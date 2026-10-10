'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

// ============================================================
// LUDO CONSTANTS & GAME RULES ENGINE
// ============================================================

// Standard 4-player Ludo board:
// - 52 main track cells (0-51), shared ring
// - Each player has a start offset on the ring
// - Each player has 5 home-stretch cells (52-56 relative to their progress)
// - Token needs progress = 57 to be "done"

const PLAYER_DEFS = {
  red:    { label: 'Red',    colorHex: '#ef4444', trackStart: 0,  homeEntry: 50, homeColor: 'rgba(239,68,68,0.35)',    glowColor: 'rgba(239,68,68,0.6)' },
  blue:   { label: 'Blue',   colorHex: '#3b82f6', trackStart: 13, homeEntry: 11, homeColor: 'rgba(59,130,246,0.35)',  glowColor: 'rgba(59,130,246,0.6)' },
  yellow: { label: 'Yellow', colorHex: '#eab308', trackStart: 26, homeEntry: 24, homeColor: 'rgba(234,179,8,0.35)',   glowColor: 'rgba(234,179,8,0.6)' },
  green:  { label: 'Green',  colorHex: '#22c55e', trackStart: 39, homeEntry: 37, homeColor: 'rgba(34,197,94,0.35)',   glowColor: 'rgba(34,197,94,0.6)' },
};

// Safe cells on the main track (absolute positions 0-51)
const SAFE_CELLS = new Set([0, 8, 13, 21, 26, 34, 39, 47]);

// Token progress encoding:
// -1 = in base
// 0-51 = relative steps from player's trackStart (on main track)
// 52-56 = home stretch (5 cells)
// 57 = home (finished)

const MAX_PROGRESS = 57;
const HOME_STRETCH_START = 52;

function rollDie() {
  return Math.floor(Math.random() * 6) + 1;
}

function getAbsoluteTrackPos(playerId, progress) {
  if (progress < 0 || progress >= HOME_STRETCH_START) return null;
  return (PLAYER_DEFS[playerId].trackStart + progress) % 52;
}

function getMovableTokens(player, roll) {
  return player.tokens.reduce((acc, token, i) => {
    if (token.progress === MAX_PROGRESS) return acc; // already home
    if (token.progress === -1) {
      if (roll === 6) acc.push(i);
      return acc;
    }
    const next = token.progress + roll;
    if (next <= MAX_PROGRESS) acc.push(i);
    return acc;
  }, []);
}

function findCapturableTokens(players, moverId, absolutePos) {
  if (absolutePos === null) return [];
  const captured = [];
  players.forEach(p => {
    if (p.id === moverId) return;
    p.tokens.forEach((t, ti) => {
      if (t.progress < 0 || t.progress >= HOME_STRETCH_START) return;
      const absPos = getAbsoluteTrackPos(p.id, t.progress);
      if (absPos === absolutePos) {
        captured.push({ playerId: p.id, tokenIndex: ti });
      }
    });
  });
  return captured;
}

// ============================================================
// AI STRATEGY
// ============================================================

function scoreMove(player, tokenIndex, roll, players, difficulty) {
  const token = player.tokens[tokenIndex];
  const prevProgress = token.progress;
  const nextProgress = prevProgress === -1 ? 0 : prevProgress + roll;

  let score = nextProgress; // base: prefer tokens closer to home

  // Bonus for releasing from base
  if (prevProgress === -1) score += 15;

  // Big bonus for finishing a token
  if (nextProgress === MAX_PROGRESS) score += 80;

  // Bonus for entering home stretch
  if (prevProgress < HOME_STRETCH_START && nextProgress >= HOME_STRETCH_START) score += 30;

  // Check for captures (enemy tokens at landing position on main track)
  if (nextProgress >= 0 && nextProgress < HOME_STRETCH_START) {
    const absPos = getAbsoluteTrackPos(player.id, nextProgress);
    if (!SAFE_CELLS.has(absPos)) {
      const caps = findCapturableTokens(players, player.id, absPos);
      if (caps.length > 0) {
        if (difficulty === 'easy') score += 10;
        else if (difficulty === 'normal') score += 25 * caps.length;
        else score += 40 * caps.length;
      }
    }
    // Safety: avoid landing on dangerous cells
    if (difficulty !== 'easy') {
      if (SAFE_CELLS.has(absPos)) score += 8;
    }
  }

  // Expert: prefer tokens that are further ahead (protect them)
  if (difficulty === 'expert') {
    if (prevProgress > 30 && prevProgress < HOME_STRETCH_START) score += 10;
  }

  return score;
}

function chooseBotMove(player, roll, movableIndexes, players, difficulty) {
  if (difficulty === 'easy') {
    // Random choice with slight preference for captures
    const shuffled = [...movableIndexes].sort(() => Math.random() - 0.5);
    return shuffled[0];
  }

  let best = movableIndexes[0];
  let bestScore = -Infinity;
  for (const i of movableIndexes) {
    const s = scoreMove(player, i, roll, players, difficulty);
    if (s > bestScore) { bestScore = s; best = i; }
  }
  return best;
}

// ============================================================
// BOARD GEOMETRY — proper 15×15 Ludo layout in SVG coords
// ============================================================
//
// Standard Ludo board is 15x15 cells:
//   3 columns of 3 cells  = 9 wide  (home zones at corners)
//   6 columns of 1 cell   = 6 wide  (track columns)
//   1 center column       = ?
// More precisely:
// Columns 0-5: rows 0-5 = Red home (top-left 6×6 area)
// Columns 9-14: rows 0-5 = Blue home (top-right 6×6 area)
// Columns 0-5: rows 9-14 = Green home (bottom-left 6×6 area)  
// Columns 9-14: rows 9-14 = Yellow home (bottom-right 6×6 area)
// The track wraps in rows/columns 6-8 (3-cell-wide paths)

// We'll use a grid of 15x15. Cell (col, row) → SVG x = col*cell, y = row*cell
// Cell size in viewBox units: 40 → viewBox = 600x600

const CELL = 40; // 40 SVG units per cell
const BOARD_SIZE = 15 * CELL; // 600

// Track layout: 52 cells around the perimeter of the inner 9×9 ring
// Each colored path is 6 cells + 1 shared start cell
// We define the 52 main track cells as (col, row) grid positions

function trackCell(col, row) {
  return { x: col * CELL + CELL / 2, y: row * CELL + CELL / 2 };
}

// Build the 52-cell track. Standard Ludo path:
// Red starts at col=1, row=6 (absolute track pos 0)
// Going clockwise:
//   Down the left column (rows 6-8 → 3 cells, col 1) — wait, standard is:
//   Red token enters at position (col=6, row=1) after leaving base

// Standard Ludo 15x15 track positions (col, row), 0-indexed:
// Going clockwise from Red's start cell at (1,6):
const TRACK_GRID = (() => {
  const cells = [];
  // Red entry side: col=1, rows 6→8 (3 cells going down left column of center area)
  // Actually let's follow the standard layout precisely.
  // The track runs in the 3-wide corridors between the 6×6 home zones.
  
  // Bottom-to-top on column 1 (left side, going up): rows 8→6
  for (let r = 8; r >= 6; r--) cells.push([1, r]);   // pos 0,1,2
  // Left-to-right on row 5 (top-left corridor): cols 0→5
  for (let c = 0; c <= 5; c++) cells.push([c, 5]);    // pos 3,4,5,6,7,8
  // But wait - rows 0-5, cols 6-8 is the top corridor and cols 0-5 row 5 is part of path
  // This gets complicated. Let me just hard-code the 52 positions from known Ludo layout:
  return cells;
})();

// Hard-coded correct 52 track positions for standard Ludo (col, row), 0-indexed from 0..14
const LUDO_TRACK = [
  // Starting from Red's entry (left side of board, column 1, going up)
  [1,8],[1,7],[1,6],                               // 0,1,2  - Red pre-entry
  [0,5],[1,5],[2,5],[3,5],[4,5],[5,5],             // 3..8
  [5,4],[5,3],[5,2],[5,1],[5,0],                   // 9..13 — Blue entry zone approach
  [6,0],[7,0],                                     // 14,15
  [8,0],[8,1],[8,2],[8,3],[8,4],[8,5],             // 16..21 — Blue start zone
  [9,5],[10,5],[11,5],[12,5],[13,5],[14,5],        // 22..27
  [14,6],[14,7],[14,8],                            // 28,29,30
  [14,9],[13,9],[12,9],[11,9],[10,9],[9,9],        // 31..36 — Yellow entry zone approach  
  [8,9],[8,10],[8,11],[8,12],[8,13],[8,14],        // 37..42
  [7,14],[6,14],                                   // 43,44
  [5,14],[5,13],[5,12],[5,11],[5,10],[5,9],        // 45..50 — Green start zone
  [4,9],[3,9],[2,9],[1,9],                         // 51..54?
];

// Let me use correct standard Ludo track coordinates
// Standard Ludo: 52 squares in ring, each player has 13-cell approach + home column
// Red: track[0..12], Blue: track[13..25], Yellow: track[26..38], Green: track[39..51]

// Using authentic 15x15 grid positions:
const STANDARD_TRACK = buildStandardTrack();

function buildStandardTrack() {
  // The 52-cell outer ring for a standard Ludo board
  // Positions as (col, row) in a 15×15 grid
  const t = [];
  // Left column going up (col=1, rows 8→6): 3 cells [0,1,2]
  t.push([1,8],[1,7],[1,6]);
  // Top-left going right (row=5, cols 0→5): 6 cells [3..8]
  t.push([0,5],[1,5],[2,5],[3,5],[4,5],[5,5]);
  // Left part of top going up (col=5, rows 4→0): 5 cells [9..13]
  t.push([5,4],[5,3],[5,2],[5,1],[5,0]);
  // Top middle going right (row=0, cols 6→7): 2 cells [14,15]
  t.push([6,0],[7,0]);
  // Right part of top going down (col=8, rows 0→5): 5 cells wait.. no
  // Blue home entry is col=8. Let's do it properly.
  // Top row going right (row=0, col=8): 1 + going down col 8
  // Blue start = absolute track pos 13, which is [6,0] (col=6, row=0) or similar
  
  // OK I'm going to use a definitively correct layout based on real Ludo boards:
  // Re-doing from scratch with verified positions:
  
  const cells = [];
  
  // Starting from Red's first track cell (after leaving base), going clockwise:
  // Left vertical strip (going up): col=1, row=8→6
  for (let r = 8; r >= 6; r--) cells.push([1, r]);      // 0,1,2
  // Top horizontal (going right): row=5, col=0→5
  for (let c = 0; c <= 5; c++) cells.push([c, 5]);      // 3,4,5,6,7,8
  // Left vertical of top section (going up): col=5, row=4→0
  for (let r = 4; r >= 0; r--) cells.push([5, r]);      // 9,10,11,12,13
  // Top horizontal center (going right): row=0, col=6→7
  cells.push([6,0],[7,0]);                               // 14,15
  // Right vertical of top section (going down): col=8, row=0→4
  for (let r = 0; r <= 4; r++) cells.push([8, r]);      // 16,17,18,19,20
  // Top horizontal right (going right): row=5, col=9→14
  for (let c = 9; c <= 14; c++) cells.push([c, 5]);     // 21,22,23,24,25,26
  // Right vertical strip (going down): col=13, row=6→8
  for (let r = 6; r <= 8; r++) cells.push([13, r]);     // 27,28,29
  // Bottom horizontal right (going left): row=9, col=14→9
  for (let c = 14; c >= 9; c--) cells.push([c, 9]);     // 30,31,32,33,34,35
  // Right vertical of bottom section (going down): col=8, row=10→14
  for (let r = 10; r <= 14; r++) cells.push([8, r]);    // 36,37,38,39,40
  // Bottom horizontal center (going left): row=14, col=7→6
  cells.push([7,14],[6,14]);                             // 41,42
  // Left vertical of bottom section (going up): col=5, row=14→10
  for (let r = 14; r >= 10; r--) cells.push([5, r]);    // 43,44,45,46,47
  // Bottom horizontal left (going left): row=9, col=4→0
  for (let c = 4; c >= 0; c--) cells.push([c, 9]);      // 48,49,50,51
  
  return cells; // 52 cells total
}

// Home stretch paths: 5 cells each, going toward center
const HOME_STRETCHES = {
  red:    [[1,7],[2,7],[3,7],[4,7],[5,7]],          // → right toward center (actually col 1-5, row 7)
  blue:   [[7,1],[7,2],[7,3],[7,4],[7,5]],          // ↓ down toward center
  yellow: [[13,7],[12,7],[11,7],[10,7],[9,7]],      // ← left toward center  
  green:  [[7,13],[7,12],[7,11],[7,10],[7,9]],      // ↑ up toward center
};

// Fix home stretches to match actual Ludo layout
const HOME_LANES = {
  red:    [[2,7],[3,7],[4,7],[5,7],[6,7]],          // cols 2→6, row 7
  blue:   [[7,2],[7,3],[7,4],[7,5],[7,6]],          // col 7, rows 2→6
  yellow: [[12,7],[11,7],[10,7],[9,7],[8,7]],       // cols 12→8, row 7
  green:  [[7,12],[7,11],[7,10],[7,9],[7,8]],       // col 7, rows 12→8
};

// Base token positions (within each 6×6 home zone)
const BASE_POSITIONS = {
  red:    [[2,2],[3,2],[2,3],[3,3]],      // top-left quadrant, 4 slots
  blue:   [[11,2],[12,2],[11,3],[12,3]], // top-right quadrant
  yellow: [[11,11],[12,11],[11,12],[12,12]], // bottom-right
  green:  [[2,11],[3,11],[2,12],[3,12]],  // bottom-left
};

// Player start cells on main track (absolute positions)
const PLAYER_TRACK_STARTS = {
  red: 0, blue: 13, yellow: 26, green: 39,
};

// ============================================================
// LOBBY SCREEN
// ============================================================

const DIFFICULTIES = [
  { id: 'easy',   label: 'Easy',   desc: 'Random moves' },
  { id: 'normal', label: 'Normal', desc: 'Basic strategy' },
  { id: 'hard',   label: 'Hard',   desc: 'Smart strategy' },
  { id: 'expert', label: 'Expert', desc: 'Optimal play' },
];

const PLAYER_COUNT_OPTIONS = [2, 3, 4];

function Lobby({ onStart }) {
  const [playerCount, setPlayerCount] = useState(4);
  const [humanCount, setHumanCount] = useState(1);
  const [difficulty, setDifficulty] = useState('normal');
  const [mode, setMode] = useState('classic'); // 'classic' | 'quick'

  const botCount = playerCount - humanCount;

  const playerIds = ['red', 'blue', 'yellow', 'green'].slice(0, playerCount);

  return (
    <div className="nludo-lobby">
      <div className="nludo-lobby-inner">
        {/* Header */}
        <div className="nludo-lobby-header">
          <div className="nludo-lobby-badge">
            <span className="nludo-badge-dot" />
            NEON LUDO
          </div>
          <h2 className="nludo-lobby-title">Set Up Your Game</h2>
          <p className="nludo-lobby-subtitle">Configure your match, then start rolling.</p>
        </div>

        {/* Mode */}
        <div className="nludo-section">
          <p className="nludo-section-label">Game Mode</p>
          <div className="nludo-mode-row">
            <button
              type="button"
              className={`nludo-mode-btn ${mode === 'classic' ? 'active' : ''}`}
              onClick={() => setMode('classic')}
            >
              <span className="nludo-mode-icon">♟</span>
              <span>Classic Ludo</span>
            </button>
            <button
              type="button"
              className={`nludo-mode-btn ${mode === 'quick' ? 'active' : ''}`}
              onClick={() => setMode('quick')}
            >
              <span className="nludo-mode-icon">⚡</span>
              <span>Quick Play</span>
            </button>
          </div>
        </div>

        {/* Players */}
        <div className="nludo-section">
          <p className="nludo-section-label">Number of Players</p>
          <div className="nludo-count-row">
            {PLAYER_COUNT_OPTIONS.map(n => (
              <button
                key={n}
                type="button"
                className={`nludo-count-btn ${playerCount === n ? 'active' : ''}`}
                onClick={() => { setPlayerCount(n); setHumanCount(Math.min(humanCount, n)); }}
              >
                {n} <span className="nludo-count-label">Players</span>
              </button>
            ))}
          </div>
        </div>

        {/* Human vs Bot */}
        <div className="nludo-section">
          <p className="nludo-section-label">Human Players</p>
          <div className="nludo-count-row">
            {Array.from({ length: playerCount }, (_, i) => i + 1).map(n => (
              <button
                key={n}
                type="button"
                className={`nludo-count-btn ${humanCount === n ? 'active' : ''}`}
                onClick={() => setHumanCount(n)}
              >
                {n} <span className="nludo-count-label">{n === 1 ? 'Human' : 'Humans'}</span>
              </button>
            ))}
          </div>
          {botCount > 0 && (
            <p className="nludo-info-text">+{botCount} bot{botCount > 1 ? 's' : ''} will fill remaining slots</p>
          )}
        </div>

        {/* Difficulty (only if bots) */}
        {botCount > 0 && (
          <div className="nludo-section">
            <p className="nludo-section-label">Bot Difficulty</p>
            <div className="nludo-diff-row">
              {DIFFICULTIES.map(d => (
                <button
                  key={d.id}
                  type="button"
                  className={`nludo-diff-btn ${difficulty === d.id ? 'active' : ''}`}
                  onClick={() => setDifficulty(d.id)}
                >
                  <span className="nludo-diff-name">{d.label}</span>
                  <span className="nludo-diff-desc">{d.desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Player Colors Preview */}
        <div className="nludo-section">
          <p className="nludo-section-label">Players</p>
          <div className="nludo-player-preview">
            {playerIds.map((pid, idx) => {
              const def = PLAYER_DEFS[pid];
              const isHuman = idx < humanCount;
              return (
                <div key={pid} className="nludo-player-pill">
                  <span
                    className="nludo-player-dot"
                    style={{ background: def.colorHex, boxShadow: `0 0 8px ${def.colorHex}` }}
                  />
                  <span className="nludo-player-pid">{def.label}</span>
                  <span className="nludo-player-type">{isHuman ? '👤 Human' : '🤖 Bot'}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* How to Play quick tip */}
        <div className="nludo-howto">
          <span className="nludo-howto-icon">💡</span>
          <span>Roll 6 to release a token from base. Land on enemies to send them back. First to bring all tokens home wins!</span>
        </div>

        {/* Start Button */}
        <button
          type="button"
          className="nludo-start-btn"
          onClick={() => onStart({ playerCount, humanCount, difficulty, mode })}
        >
          <svg width="18" height="18" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
          </svg>
          Start Game
        </button>
      </div>
    </div>
  );
}

// ============================================================
// HOW TO PLAY MODAL
// ============================================================

function HowToPlayModal({ onClose }) {
  return (
    <div className="nludo-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label="How to Play">
      <div className="nludo-modal-card" onClick={e => e.stopPropagation()}>
        <button className="nludo-modal-close" onClick={onClose} aria-label="Close">×</button>
        <h3 className="nludo-modal-title">How to Play Neon Ludo</h3>
        <div className="nludo-rules">
          <div className="nludo-rule">
            <span className="nludo-rule-num">1</span>
            <div>
              <strong>Roll to Release</strong>
              <p>You must roll a 6 to move a token out of your base onto the main track.</p>
            </div>
          </div>
          <div className="nludo-rule">
            <span className="nludo-rule-num">2</span>
            <div>
              <strong>Move & Race</strong>
              <p>Move any token the exact number shown on the dice. Tokens travel clockwise around the board.</p>
            </div>
          </div>
          <div className="nludo-rule">
            <span className="nludo-rule-num">3</span>
            <div>
              <strong>Captures</strong>
              <p>Land on an enemy token to send it back to its base! Safe cells (highlighted) are protected.</p>
            </div>
          </div>
          <div className="nludo-rule">
            <span className="nludo-rule-num">4</span>
            <div>
              <strong>Extra Turns</strong>
              <p>Rolling a 6 gives you another turn. A capture also grants a bonus roll!</p>
            </div>
          </div>
          <div className="nludo-rule">
            <span className="nludo-rule-num">5</span>
            <div>
              <strong>Home Stretch</strong>
              <p>After one full lap, your tokens enter the colored home column. They need exact rolls to reach home.</p>
            </div>
          </div>
          <div className="nludo-rule">
            <span className="nludo-rule-num">6</span>
            <div>
              <strong>Victory</strong>
              <p>First player to bring ALL 4 tokens home wins the match!</p>
            </div>
          </div>
        </div>
        <button className="nludo-modal-ok" onClick={onClose}>Got it!</button>
      </div>
    </div>
  );
}

// ============================================================
// VICTORY SCREEN
// ============================================================

function VictoryScreen({ winner, players, onPlayAgain, onNewGame }) {
  const def = PLAYER_DEFS[winner.id];
  return (
    <div className="nludo-victory">
      <div className="nludo-victory-glow" style={{ background: def.colorHex }} />
      <div className="nludo-victory-content">
        <div className="nludo-victory-trophy">🏆</div>
        <h2 className="nludo-victory-title" style={{ color: def.colorHex }}>
          {winner.label} Wins!
        </h2>
        <p className="nludo-victory-sub">
          {winner.isBot ? 'The bot dominated this round.' : 'Congratulations on your victory!'}
        </p>
        <div className="nludo-victory-standings">
          {players.map((p, idx) => {
            const d = PLAYER_DEFS[p.id];
            const done = p.tokens.filter(t => t.progress === MAX_PROGRESS).length;
            return (
              <div key={p.id} className="nludo-standing-row">
                <span className="nludo-standing-pos">#{idx + 1}</span>
                <span className="nludo-standing-dot" style={{ background: d.colorHex }} />
                <span className="nludo-standing-name">{p.label}</span>
                <span className="nludo-standing-score">{done}/4 home</span>
              </div>
            );
          })}
        </div>
        <div className="nludo-victory-btns">
          <button type="button" className="nludo-play-again-btn" onClick={onPlayAgain}>
            Play Again
          </button>
          <button type="button" className="nludo-new-game-btn" onClick={onNewGame}>
            New Setup
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// DICE COMPONENT
// ============================================================

function DiceFace({ value, rolling }) {
  const dotPositions = {
    1: [[50, 50]],
    2: [[25, 25], [75, 75]],
    3: [[25, 25], [50, 50], [75, 75]],
    4: [[25, 25], [75, 25], [25, 75], [75, 75]],
    5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]],
    6: [[25, 20], [75, 20], [25, 50], [75, 50], [25, 80], [75, 80]],
  };
  const dots = dotPositions[value] || dotPositions[1];

  return (
    <div className={`nludo-dice ${rolling ? 'rolling' : ''}`}>
      <svg viewBox="0 0 100 100" width="100%" height="100%">
        <rect x="2" y="2" width="96" height="96" rx="18" ry="18"
          fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />
        {dots.map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r="9" fill="rgba(255,255,255,0.9)" />
        ))}
      </svg>
    </div>
  );
}

// ============================================================
// LUDO BOARD SVG
// ============================================================

function LudoBoard({ players, currentPlayerId, movableTokens, onTokenClick, diceValue, lastCapture }) {
  const TRACK = STANDARD_TRACK; // 52 cells
  const CELL = 40;
  const VB = 15 * CELL; // 600

  // Build a map: absTrackPos → tokens there
  const trackMap = new Map();
  const homeLaneMap = {}; // playerId → array of tokens per lane step
  const baseMap = {};     // playerId → token array

  players.forEach(p => {
    homeLaneMap[p.id] = Array.from({ length: 5 }, () => []);
    baseMap[p.id] = [];
    p.tokens.forEach((t, ti) => {
      if (t.progress === MAX_PROGRESS) return; // done
      if (t.progress === -1) {
        baseMap[p.id].push({ playerId: p.id, tokenIndex: ti, token: t });
        return;
      }
      if (t.progress >= HOME_STRETCH_START) {
        const laneIdx = t.progress - HOME_STRETCH_START; // 0..4
        if (laneIdx < 5) {
          homeLaneMap[p.id][laneIdx].push({ playerId: p.id, tokenIndex: ti, token: t });
        }
        return;
      }
      // On main track
      const absPos = (PLAYER_DEFS[p.id].trackStart + t.progress) % 52;
      if (!trackMap.has(absPos)) trackMap.set(absPos, []);
      trackMap.get(absPos).push({ playerId: p.id, tokenIndex: ti, token: t });
    });
  });

  const isMovable = (playerId, tokenIndex) => {
    if (playerId !== currentPlayerId) return false;
    return movableTokens.includes(tokenIndex);
  };

  const playerColors = { red: '#ef4444', blue: '#3b82f6', yellow: '#eab308', green: '#22c55e' };

  function TokenCircle({ pid, ti, cx, cy, r = 11 }) {
    const color = playerColors[pid];
    const movable = isMovable(pid, ti);
    return (
      <g
        onClick={() => movable && onTokenClick(pid, ti)}
        style={{ cursor: movable ? 'pointer' : 'default' }}
      >
        {movable && (
          <circle cx={cx} cy={cy} r={r + 5} fill="rgba(255,255,255,0.12)" className="nludo-token-pulse" />
        )}
        <circle
          cx={cx} cy={cy} r={r}
          fill={color}
          stroke={movable ? '#fff' : 'rgba(255,255,255,0.5)'}
          strokeWidth={movable ? 2.5 : 1.5}
          style={{
            filter: movable ? `drop-shadow(0 0 6px ${color})` : `drop-shadow(0 0 3px ${color})`,
            transform: movable ? 'scale(1.1)' : 'scale(1)',
            transformOrigin: `${cx}px ${cy}px`,
            transition: 'all 0.2s',
          }}
        />
        {/* Inner highlight */}
        <circle cx={cx - r * 0.25} cy={cy - r * 0.25} r={r * 0.3} fill="rgba(255,255,255,0.4)" />
      </g>
    );
  }

  // Zone backgrounds
  const zoneColors = {
    red:    { fill: 'rgba(239,68,68,0.15)',  stroke: 'rgba(239,68,68,0.4)' },
    blue:   { fill: 'rgba(59,130,246,0.15)', stroke: 'rgba(59,130,246,0.4)' },
    yellow: { fill: 'rgba(234,179,8,0.15)',  stroke: 'rgba(234,179,8,0.4)' },
    green:  { fill: 'rgba(34,197,94,0.15)',  stroke: 'rgba(34,197,94,0.4)' },
  };

  return (
    <svg
      viewBox={`0 0 ${VB} ${VB}`}
      width="100%"
      height="100%"
      className="nludo-board-svg"
      role="img"
      aria-label="Ludo Board"
    >
      {/* ── Board background ── */}
      <rect width={VB} height={VB} fill="#0d1117" rx="12" />

      {/* ── Home Zones (6×6 corner squares) ── */}
      {/* Red: top-left [0-5, 0-5] */}
      <rect x={0} y={0} width={6*CELL} height={6*CELL}
        fill={zoneColors.red.fill} stroke={zoneColors.red.stroke} strokeWidth="1.5" />
      {/* Inner base area: 4×4 centered */}
      <rect x={CELL} y={CELL} width={4*CELL} height={4*CELL}
        fill="rgba(239,68,68,0.08)" stroke="rgba(239,68,68,0.2)" strokeWidth="1" rx="8" />

      {/* Blue: top-right [9-14, 0-5] */}
      <rect x={9*CELL} y={0} width={6*CELL} height={6*CELL}
        fill={zoneColors.blue.fill} stroke={zoneColors.blue.stroke} strokeWidth="1.5" />
      <rect x={10*CELL} y={CELL} width={4*CELL} height={4*CELL}
        fill="rgba(59,130,246,0.08)" stroke="rgba(59,130,246,0.2)" strokeWidth="1" rx="8" />

      {/* Yellow: bottom-right [9-14, 9-14] */}
      <rect x={9*CELL} y={9*CELL} width={6*CELL} height={6*CELL}
        fill={zoneColors.yellow.fill} stroke={zoneColors.yellow.stroke} strokeWidth="1.5" />
      <rect x={10*CELL} y={10*CELL} width={4*CELL} height={4*CELL}
        fill="rgba(234,179,8,0.08)" stroke="rgba(234,179,8,0.2)" strokeWidth="1" rx="8" />

      {/* Green: bottom-left [0-5, 9-14] */}
      <rect x={0} y={9*CELL} width={6*CELL} height={6*CELL}
        fill={zoneColors.green.fill} stroke={zoneColors.green.stroke} strokeWidth="1.5" />
      <rect x={CELL} y={10*CELL} width={4*CELL} height={4*CELL}
        fill="rgba(34,197,94,0.08)" stroke="rgba(34,197,94,0.2)" strokeWidth="1" rx="8" />

      {/* ── Track cells ── */}
      {TRACK.map(([col, row], absIdx) => {
        const x = col * CELL;
        const y = row * CELL;
        const isSafe = SAFE_CELLS.has(absIdx);
        const startPlayer = Object.entries(PLAYER_TRACK_STARTS).find(([,s]) => s === absIdx)?.[0];

        let cellFill = 'rgba(255,255,255,0.04)';
        let cellStroke = 'rgba(255,255,255,0.08)';

        if (isSafe) {
          if (startPlayer) {
            cellFill = `${zoneColors[startPlayer].fill}`;
            cellStroke = `${zoneColors[startPlayer].stroke}`;
          } else {
            cellFill = 'rgba(255,255,255,0.1)';
            cellStroke = 'rgba(255,255,255,0.2)';
          }
        }

        const tokensHere = trackMap.get(absIdx) || [];

        return (
          <g key={absIdx}>
            <rect x={x+1} y={y+1} width={CELL-2} height={CELL-2}
              fill={cellFill} stroke={cellStroke} strokeWidth="1" rx="4" />
            {isSafe && (
              <text x={x+CELL/2} y={y+CELL/2+4} textAnchor="middle"
                fontSize="12" fill="rgba(255,255,255,0.25)" fontWeight="bold">
                ★
              </text>
            )}
            {tokensHere.map(({ playerId, tokenIndex }, ti) => {
              const spread = tokensHere.length > 1;
              const offsetX = spread ? ((ti % 2) * 18 - 9) : 0;
              const offsetY = spread ? (Math.floor(ti / 2) * 18 - 4) : 0;
              return (
                <TokenCircle
                  key={`${playerId}-${tokenIndex}`}
                  pid={playerId}
                  ti={tokenIndex}
                  cx={x + CELL/2 + offsetX}
                  cy={y + CELL/2 + offsetY}
                  r={spread ? 8 : 11}
                />
              );
            })}
          </g>
        );
      })}

      {/* ── Home lane cells (colored paths to center) ── */}
      {Object.entries(HOME_LANES).map(([pid, cells]) => {
        const color = playerColors[pid];
        const fillC = `${zoneColors[pid].fill}`;
        const strokeC = `${zoneColors[pid].stroke}`;
        return cells.map(([col, row], laneIdx) => {
          const x = col * CELL;
          const y = row * CELL;
          const tokensHere = (homeLaneMap[pid] || [])[laneIdx] || [];
          return (
            <g key={`home-${pid}-${laneIdx}`}>
              <rect x={x+1} y={y+1} width={CELL-2} height={CELL-2}
                fill={fillC} stroke={strokeC} strokeWidth="1.5" rx="4" />
              {laneIdx === 4 && (
                // Arrow pointing to center
                <text x={x+CELL/2} y={y+CELL/2+5} textAnchor="middle"
                  fontSize="14" fill={color} opacity="0.5">▶</text>
              )}
              {tokensHere.map(({ playerId, tokenIndex }, ti) => (
                <TokenCircle
                  key={`${playerId}-${tokenIndex}`}
                  pid={playerId}
                  ti={tokenIndex}
                  cx={x + CELL/2}
                  cy={y + CELL/2}
                  r={11}
                />
              ))}
            </g>
          );
        });
      })}

      {/* ── Base tokens ── */}
      {Object.entries(BASE_POSITIONS).map(([pid, positions]) => {
        const tokens = baseMap[pid] || [];
        return positions.map(([col, row], slotIdx) => {
          const x = col * CELL;
          const y = row * CELL;
          const tokenEntry = tokens[slotIdx];
          return (
            <g key={`base-${pid}-${slotIdx}`}>
              <circle
                cx={x + CELL/2} cy={y + CELL/2} r={CELL/2 - 4}
                fill="rgba(10,10,10,0.4)"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              {tokenEntry && (
                <TokenCircle
                  pid={tokenEntry.playerId}
                  ti={tokenEntry.tokenIndex}
                  cx={x + CELL/2}
                  cy={y + CELL/2}
                  r={13}
                />
              )}
            </g>
          );
        });
      })}

      {/* ── Center / Home area ── */}
      <polygon
        points={`${7*CELL},${6*CELL} ${8*CELL},${7*CELL} ${7*CELL},${8*CELL} ${6*CELL},${7*CELL}`}
        fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1"
      />
      {/* Colored triangles in center */}
      <polygon points={`${7*CELL},${6*CELL} ${8*CELL},${7*CELL} ${7*CELL},${7*CELL}`}
        fill="rgba(59,130,246,0.35)" />
      <polygon points={`${8*CELL},${7*CELL} ${7*CELL},${8*CELL} ${7*CELL},${7*CELL}`}
        fill="rgba(234,179,8,0.35)" />
      <polygon points={`${7*CELL},${8*CELL} ${6*CELL},${7*CELL} ${7*CELL},${7*CELL}`}
        fill="rgba(34,197,94,0.35)" />
      <polygon points={`${6*CELL},${7*CELL} ${7*CELL},${6*CELL} ${7*CELL},${7*CELL}`}
        fill="rgba(239,68,68,0.35)" />

      {/* Center star */}
      <text x={7.5*CELL} y={7.5*CELL+6} textAnchor="middle"
        fontSize="20" fill="rgba(255,255,255,0.8)"
        style={{ filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.5))' }}>
        ★
      </text>

      {/* ── Player zone labels ── */}
      {[
        { pid: 'red', x: 3*CELL, y: 5.3*CELL },
        { pid: 'blue', x: 12*CELL, y: 5.3*CELL },
        { pid: 'yellow', x: 12*CELL, y: 9.7*CELL },
        { pid: 'green', x: 3*CELL, y: 9.7*CELL },
      ].map(({ pid, x, y }) => (
        <text key={pid} x={x} y={y} textAnchor="middle"
          fontSize="10" fontWeight="800" letterSpacing="0.1em"
          fill={playerColors[pid]} opacity="0.7" style={{ textTransform: 'uppercase' }}>
          {pid.toUpperCase()}
        </text>
      ))}

      {/* ── Finished tokens indicator ── */}
      {players.map(p => {
        const finishedCount = p.tokens.filter(t => t.progress === MAX_PROGRESS).length;
        if (!finishedCount) return null;
        const positions = {
          red: [3*CELL, 7.5*CELL],
          blue: [7.5*CELL, 3*CELL],
          yellow: [12*CELL, 7.5*CELL],
          green: [7.5*CELL, 12*CELL],
        };
        const [fx, fy] = positions[p.id];
        return (
          <g key={`fin-${p.id}`}>
            <circle cx={fx} cy={fy} r={16} fill="rgba(0,0,0,0.5)" stroke={playerColors[p.id]} strokeWidth="1.5" />
            <text x={fx} y={fy+5} textAnchor="middle" fontSize="14" fontWeight="900" fill={playerColors[p.id]}>
              {finishedCount}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================
// MAIN GAME COMPONENT
// ============================================================

export default function NeonLudoGame() {
  const [screen, setScreen] = useState('lobby'); // 'lobby' | 'game' | 'victory'
  const [config, setConfig] = useState(null);
  const [players, setPlayers] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [diceValue, setDiceValue] = useState(null);
  const [diceRolling, setDiceRolling] = useState(false);
  const [phase, setPhase] = useState('roll'); // 'roll' | 'move' | 'bot'
  const [logEntries, setLogEntries] = useState([]);
  const [winner, setWinner] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const [movableTokens, setMovableTokens] = useState([]);
  const [capturedEffect, setCapturedEffect] = useState(null);
  const [statusMsg, setStatusMsg] = useState('');
  const [extraTurnPending, setExtraTurnPending] = useState(false);
  const [finishOrder, setFinishOrder] = useState([]);

  const timerRef = useRef(null);
  const playersRef = useRef(players);
  const currentIdxRef = useRef(currentIdx);
  const phaseRef = useRef(phase);
  const finishOrderRef = useRef(finishOrder);

  useEffect(() => { playersRef.current = players; }, [players]);
  useEffect(() => { currentIdxRef.current = currentIdx; }, [currentIdx]);
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { finishOrderRef.current = finishOrder; }, [finishOrder]);

  function addLog(msg) {
    setLogEntries(prev => [msg, ...prev].slice(0, 20));
  }

  function clearTimer() {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
  }

  function delay(ms, fn) {
    clearTimer();
    timerRef.current = setTimeout(fn, ms);
  }

  function startGame(cfg) {
    setConfig(cfg);
    const playerIds = ['red', 'blue', 'yellow', 'green'].slice(0, cfg.playerCount);
    const newPlayers = playerIds.map((pid, idx) => ({
      id: pid,
      label: PLAYER_DEFS[pid].label,
      isBot: idx >= cfg.humanCount,
      difficulty: cfg.difficulty,
      tokens: Array.from({ length: 4 }, (_, ti) => ({ progress: -1 })),
    }));
    setPlayers(newPlayers);
    setCurrentIdx(0);
    setDiceValue(null);
    setPhase('roll');
    setLogEntries([]);
    setWinner(null);
    setMovableTokens([]);
    setFinishOrder([]);
    setStatusMsg('Game started! Red goes first.');
    setScreen('game');

    // If first player is bot, start bot turn
    if (newPlayers[0].isBot) {
      delay(800, () => doBotRoll(newPlayers, 0, cfg.difficulty));
    }
  }

  function doBotRoll(ps, idx, diff) {
    const player = ps[idx];
    if (!player || !player.isBot) return;
    setStatusMsg(`${player.label} is thinking...`);
    delay(600, () => {
      const roll = rollDie();
      setDiceRolling(true);
      setTimeout(() => setDiceRolling(false), 400);
      setDiceValue(roll);
      addLog(`${player.label} rolled ${roll}`);

      const movable = getMovableTokens(player, roll);
      if (!movable.length) {
        setStatusMsg(`${player.label} rolled ${roll} — no legal moves.`);
        delay(1000, () => advanceTurn(ps, idx, false));
        return;
      }

      const choice = chooseBotMove(player, roll, movable, ps, diff || 'normal');
      setStatusMsg(`${player.label} rolled ${roll} and moves token ${choice + 1}.`);
      delay(900, () => doMoveToken(ps, idx, choice, roll));
    });
  }

  function doRollDice() {
    if (phase !== 'roll') return;
    const ps = playersRef.current;
    const idx = currentIdxRef.current;
    const player = ps[idx];
    if (!player || player.isBot) return;

    const roll = rollDie();
    setDiceRolling(true);
    setTimeout(() => setDiceRolling(false), 400);
    setDiceValue(roll);
    addLog(`${player.label} rolled ${roll}`);

    const movable = getMovableTokens(player, roll);
    if (!movable.length) {
      setStatusMsg(`You rolled ${roll} — no legal moves. Passing turn.`);
      setPhase('roll');
      delay(1200, () => advanceTurn(ps, idx, false));
      return;
    }

    setMovableTokens(movable);
    setPhase('move');
    if (roll === 6) {
      setStatusMsg(`You rolled 6! Choose a highlighted token to move.`);
    } else {
      setStatusMsg(`You rolled ${roll}. Choose a highlighted token to move.`);
    }
  }

  function doMoveToken(ps, playerIdx, tokenIndex, roll) {
    const newPlayers = ps.map((p, pi) => {
      if (pi !== playerIdx) return p;
      const newTokens = p.tokens.map((t, ti) => {
        if (ti !== tokenIndex) return t;
        const prev = t.progress;
        const next = prev === -1 ? 0 : prev + roll;
        return { ...t, progress: Math.min(next, MAX_PROGRESS) };
      });
      return { ...p, tokens: newTokens };
    });

    const mover = newPlayers[playerIdx];
    const movedToken = mover.tokens[tokenIndex];
    const prevProgress = ps[playerIdx].tokens[tokenIndex].progress;
    const newProgress = movedToken.progress;

    // Check captures
    let captured = 0;
    let grantExtraTurn = roll === 6;

    const updatedPlayers = newPlayers.map(p => {
      if (p.id === mover.id) return p;
      const newTokens = p.tokens.map(t => {
        if (t.progress < 0 || t.progress >= HOME_STRETCH_START) return t;
        const absPos = getAbsoluteTrackPos(p.id, t.progress);
        const moverAbs = newProgress >= HOME_STRETCH_START ? null : getAbsoluteTrackPos(mover.id, newProgress);
        if (moverAbs !== null && absPos === moverAbs && !SAFE_CELLS.has(absPos)) {
          captured++;
          return { ...t, progress: -1 };
        }
        return t;
      });
      return { ...p, tokens: newTokens };
    });

    if (captured > 0) {
      grantExtraTurn = true;
      setCapturedEffect(mover.id);
      setTimeout(() => setCapturedEffect(null), 800);
      addLog(`${mover.label} captured ${captured} token${captured > 1 ? 's' : ''}! Bonus turn!`);
    }

    if (prevProgress === -1 && newProgress === 0) {
      addLog(`${mover.label} released token ${tokenIndex + 1} from base.`);
    } else if (newProgress === MAX_PROGRESS) {
      addLog(`${mover.label} brought token ${tokenIndex + 1} home! 🏠`);
    }

    setPlayers(updatedPlayers);
    setMovableTokens([]);
    setPhase('roll');

    // Check if player won
    const isWinner = updatedPlayers[playerIdx].tokens.every(t => t.progress === MAX_PROGRESS);
    if (isWinner) {
      setWinner(updatedPlayers[playerIdx]);
      setStatusMsg(`${mover.label} wins! 🎉`);
      addLog(`🏆 ${mover.label} wins the game!`);
      delay(1500, () => setScreen('victory'));
      return;
    }

    if (grantExtraTurn) {
      setStatusMsg(`${mover.label} gets an extra turn!`);
      if (mover.isBot) {
        delay(1000, () => doBotRoll(updatedPlayers, playerIdx, config?.difficulty));
      } else {
        setDiceValue(null);
        setPhase('roll');
        setStatusMsg(`You earned an extra turn! Roll again.`);
      }
    } else {
      delay(700, () => advanceTurn(updatedPlayers, playerIdx, false));
    }
  }

  function handleTokenClick(playerId, tokenIndex) {
    const ps = playersRef.current;
    const idx = currentIdxRef.current;
    const phs = phaseRef.current;

    if (phs !== 'move') return;
    const player = ps[idx];
    if (!player || player.id !== playerId || player.isBot) return;
    if (!movableTokens.includes(tokenIndex)) return;

    const roll = diceValue;
    setPhase('bot'); // lock input during animation
    doMoveToken(ps, idx, tokenIndex, roll);
  }

  function advanceTurn(ps, fromIdx, extraTurn) {
    if (extraTurn) {
      const player = ps[fromIdx];
      setDiceValue(null);
      setPhase('roll');
      if (player.isBot) {
        doBotRoll(ps, fromIdx, config?.difficulty);
      } else {
        setStatusMsg(`Your extra turn! Roll again.`);
      }
      return;
    }

    const nextIdx = (fromIdx + 1) % ps.length;
    setCurrentIdx(nextIdx);
    setDiceValue(null);
    setPhase('roll');

    const nextPlayer = ps[nextIdx];
    if (!nextPlayer) return;

    if (nextPlayer.isBot) {
      setStatusMsg(`${nextPlayer.label}'s turn...`);
      delay(800, () => doBotRoll(ps, nextIdx, config?.difficulty));
    } else {
      setStatusMsg(`Your turn, ${nextPlayer.label}! Roll the dice.`);
    }
  }

  // Cleanup on unmount
  useEffect(() => () => clearTimer(), []);

  const currentPlayer = players[currentIdx];

  if (screen === 'lobby') {
    return (
      <div className="nludo-shell">
        <Lobby onStart={startGame} />
      </div>
    );
  }

  if (screen === 'victory' && winner) {
    return (
      <div className="nludo-shell">
        <VictoryScreen
          winner={winner}
          players={players}
          onPlayAgain={() => startGame(config)}
          onNewGame={() => setScreen('lobby')}
        />
      </div>
    );
  }

  return (
    <div className="nludo-shell">
      {showHelp && <HowToPlayModal onClose={() => setShowHelp(false)} />}

      <div className="nludo-game-layout">
        {/* ── Board ── */}
        <div className="nludo-board-area">
          <div className="nludo-board-wrap">
            <LudoBoard
              players={players}
              currentPlayerId={currentPlayer?.id}
              movableTokens={phase === 'move' && !currentPlayer?.isBot ? movableTokens : []}
              onTokenClick={handleTokenClick}
              diceValue={diceValue}
              lastCapture={capturedEffect}
            />
            {capturedEffect && (
              <div className="nludo-capture-fx" style={{ color: PLAYER_DEFS[capturedEffect]?.colorHex }}>
                Capture! 💥
              </div>
            )}
          </div>
        </div>

        {/* ── Sidebar ── */}
        <aside className="nludo-sidebar">
          {/* Current Turn Info */}
          <div className="nludo-turn-card">
            <div className="nludo-turn-header">
              {currentPlayer && (
                <>
                  <span
                    className="nludo-turn-dot"
                    style={{
                      background: PLAYER_DEFS[currentPlayer.id]?.colorHex,
                      boxShadow: `0 0 10px ${PLAYER_DEFS[currentPlayer.id]?.colorHex}`,
                    }}
                  />
                  <span className="nludo-turn-name">{currentPlayer.label}</span>
                  <span className="nludo-turn-type">{currentPlayer.isBot ? 'BOT' : 'YOU'}</span>
                </>
              )}
            </div>
            <p className="nludo-status-msg">{statusMsg}</p>
          </div>

          {/* Dice & Roll Button */}
          <div className="nludo-dice-card">
            <div className="nludo-dice-wrap">
              <DiceFace value={diceValue || 1} rolling={diceRolling} />
            </div>
            <div className="nludo-dice-val">{diceValue ? `Rolled: ${diceValue}` : 'No roll yet'}</div>
            <button
              type="button"
              className="nludo-roll-btn"
              onClick={doRollDice}
              disabled={phase !== 'roll' || currentPlayer?.isBot}
              aria-label="Roll Dice"
            >
              {diceRolling ? '...' : '🎲 Roll Dice'}
            </button>
            {phase === 'move' && !currentPlayer?.isBot && (
              <p className="nludo-hint">Click a highlighted token to move it</p>
            )}
          </div>

          {/* Players */}
          <div className="nludo-players-card">
            <h3 className="nludo-card-title">Players</h3>
            <div className="nludo-player-list">
              {players.map((p, idx) => {
                const def = PLAYER_DEFS[p.id];
                const done = p.tokens.filter(t => t.progress === MAX_PROGRESS).length;
                const inBase = p.tokens.filter(t => t.progress === -1).length;
                const onTrack = p.tokens.filter(t => t.progress >= 0 && t.progress < HOME_STRETCH_START).length;
                const inLane = p.tokens.filter(t => t.progress >= HOME_STRETCH_START && t.progress < MAX_PROGRESS).length;
                const isActive = idx === currentIdx;
                return (
                  <div key={p.id} className={`nludo-player-row ${isActive ? 'active' : ''}`}
                    style={isActive ? { borderColor: def.colorHex + '50' } : {}}>
                    <div className="nludo-player-info">
                      <span className="nludo-player-color"
                        style={{ background: def.colorHex, boxShadow: `0 0 6px ${def.colorHex}` }} />
                      <span className="nludo-player-name">{p.label}</span>
                      {p.isBot && <span className="nludo-bot-tag">BOT</span>}
                    </div>
                    <div className="nludo-token-bars">
                      <span title="In Base" className="nludo-bar-item nludo-bar-base">{inBase}🏠</span>
                      <span title="On Track" className="nludo-bar-item nludo-bar-track">{onTrack}🔄</span>
                      <span title="Home Lane" className="nludo-bar-item nludo-bar-lane">{inLane}→</span>
                      <span title="Finished" className="nludo-bar-item nludo-bar-done">{done}✓</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Log */}
          <div className="nludo-log-card">
            <h3 className="nludo-card-title">Match Log</h3>
            <div className="nludo-log-list">
              {logEntries.length === 0 ? (
                <div className="nludo-log-empty">Game events will appear here.</div>
              ) : (
                logEntries.map((e, i) => (
                  <div key={i} className="nludo-log-entry">{e}</div>
                ))
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="nludo-controls-row">
            <button type="button" className="nludo-ctrl-btn" onClick={() => setShowHelp(true)} title="How to Play">
              ❓ Help
            </button>
            <button type="button" className="nludo-ctrl-btn" onClick={() => startGame(config)} title="Restart">
              🔄 Restart
            </button>
            <button type="button" className="nludo-ctrl-btn" onClick={() => setScreen('lobby')} title="New Game">
              🏠 Menu
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
