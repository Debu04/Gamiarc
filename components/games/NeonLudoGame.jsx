'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

// ============================================================
// LUDO CONSTANTS & GAME RULES ENGINE
// ============================================================

const PLAYER_DEFS = {
  red:    { label: 'Red',    colorHex: '#ef4444', trackStart: 0,  homeEntry: 50, homeColor: 'rgba(239,68,68,0.35)',    glowColor: 'rgba(239,68,68,0.6)' },
  blue:   { label: 'Blue',   colorHex: '#3b82f6', trackStart: 13, homeEntry: 11, homeColor: 'rgba(59,130,246,0.35)',  glowColor: 'rgba(59,130,246,0.6)' },
  yellow: { label: 'Yellow', colorHex: '#eab308', trackStart: 26, homeEntry: 24, homeColor: 'rgba(234,179,8,0.35)',   glowColor: 'rgba(234,179,8,0.6)' },
  green:  { label: 'Green',  colorHex: '#22c55e', trackStart: 39, homeEntry: 37, homeColor: 'rgba(34,197,94,0.35)',   glowColor: 'rgba(34,197,94,0.6)' },
};

// Safe cells on the main track (absolute positions 0-51)
// 4 Player Starts (0, 13, 26, 39) + 4 Star Safe Cells (8, 21, 34, 47)
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
// AI STRATEGY ENGINE (Unrigged, Progressive Heuristics)
// ============================================================

function scoreMove(player, tokenIndex, roll, players, difficulty) {
  const token = player.tokens[tokenIndex];
  const prevProgress = token.progress;
  const nextProgress = prevProgress === -1 ? 0 : prevProgress + roll;

  // 1. Reaching home goal
  if (nextProgress === MAX_PROGRESS) {
    if (difficulty === 'easy') return 50;
    if (difficulty === 'normal') return 200;
    return 1000; // Hard / Expert: always prioritize finishing
  }

  let score = nextProgress * 2; // base forward movement value

  // 2. Exiting base on 6
  if (prevProgress === -1 && roll === 6) {
    if (difficulty === 'easy') score += 10;
    else if (difficulty === 'normal') score += 40;
    else if (difficulty === 'hard') score += 90;
    else score += 140; // Expert: release tokens rapidly
  }

  // 3. Entering home stretch
  if (prevProgress < HOME_STRETCH_START && nextProgress >= HOME_STRETCH_START) {
    if (difficulty === 'easy') score += 15;
    else if (difficulty === 'normal') score += 40;
    else score += 100; // Hard/Expert: safe in home stretch
  }

  // 4. Capturing opponent tokens
  if (nextProgress >= 0 && nextProgress < HOME_STRETCH_START) {
    const absLandingPos = getAbsoluteTrackPos(player.id, nextProgress);
    if (!SAFE_CELLS.has(absLandingPos)) {
      const capturables = findCapturableTokens(players, player.id, absLandingPos);
      if (capturables.length > 0) {
        if (difficulty === 'easy') score += 20;
        else if (difficulty === 'normal') score += 60 * capturables.length;
        else if (difficulty === 'hard') score += 160 * capturables.length;
        else score += 320 * capturables.length; // Expert: aggressive capture
      }
    } else {
      if (difficulty === 'hard') score += 25;
      else if (difficulty === 'expert') score += 60;
    }
  }

  // 5. Threat avoidance and escaping enemy capture range (Hard & Expert)
  if (difficulty === 'hard' || difficulty === 'expert') {
    // Escaping a current threat (enemy within 1-6 squares behind)
    if (prevProgress >= 0 && prevProgress < HOME_STRETCH_START) {
      const currentAbsPos = getAbsoluteTrackPos(player.id, prevProgress);
      if (!SAFE_CELLS.has(currentAbsPos)) {
        let inDanger = false;
        players.forEach(p => {
          if (p.id === player.id) return;
          p.tokens.forEach(enemyToken => {
            if (enemyToken.progress >= 0 && enemyToken.progress < HOME_STRETCH_START) {
              const enemyAbs = getAbsoluteTrackPos(p.id, enemyToken.progress);
              const dist = (currentAbsPos - enemyAbs + 52) % 52;
              if (dist >= 1 && dist <= 6) inDanger = true;
            }
          });
        });
        if (inDanger) {
          score += difficulty === 'expert' ? 180 : 80;
        }
      }
    }

    // Avoiding landing into a dangerous square
    if (nextProgress >= 0 && nextProgress < HOME_STRETCH_START) {
      const landingAbsPos = getAbsoluteTrackPos(player.id, nextProgress);
      if (!SAFE_CELLS.has(landingAbsPos)) {
        let landingInDanger = false;
        players.forEach(p => {
          if (p.id === player.id) return;
          p.tokens.forEach(enemyToken => {
            if (enemyToken.progress >= 0 && enemyToken.progress < HOME_STRETCH_START) {
              const enemyAbs = getAbsoluteTrackPos(p.id, enemyToken.progress);
              const dist = (landingAbsPos - enemyAbs + 52) % 52;
              if (dist >= 1 && dist <= 6) landingInDanger = true;
            }
          });
        });
        if (landingInDanger) {
          score -= difficulty === 'expert' ? 70 : 35;
        }
      }
    }
  }

  return score;
}

function chooseBotMove(player, roll, movableIndexes, players, difficulty) {
  if (difficulty === 'easy') {
    const shuffled = [...movableIndexes].sort(() => Math.random() - 0.5);
    return shuffled[0];
  }

  let best = movableIndexes[0];
  let bestScore = -Infinity;
  for (const i of movableIndexes) {
    const s = scoreMove(player, i, roll, players, difficulty);
    if (s > bestScore) {
      bestScore = s;
      best = i;
    }
  }
  return best;
}

// ============================================================
// AUTHENTIC 15x15 LUDO BOARD GEOMETRY
// ============================================================

const CELL = 40; // 40 SVG units per cell (600x600 viewBox)

// Standard 52-cell outer track in clockwise sequence
const STANDARD_TRACK = [
  // 1. Red arm (going right): row 6, cols 1..5 (5 cells)
  [1, 6], [2, 6], [3, 6], [4, 6], [5, 6],
  // 2. Top arm (going up): col 6, rows 5..0 (6 cells)
  [6, 5], [6, 4], [6, 3], [6, 2], [6, 1], [6, 0],
  // 3. Top edge (going right): row 0, cols 7..8 (2 cells)
  [7, 0], [8, 0],
  // 4. Blue arm (going down): col 8, rows 1..5 (5 cells, start=[8,1])
  [8, 1], [8, 2], [8, 3], [8, 4], [8, 5],
  // 5. Right arm (going right): row 6, cols 9..14 (6 cells)
  [9, 6], [10, 6], [11, 6], [12, 6], [13, 6], [14, 6],
  // 6. Right edge (going down): col 14, rows 7..8 (2 cells)
  [14, 7], [14, 8],
  // 7. Yellow arm (going left): row 8, cols 13..9 (5 cells, start=[13,8])
  [13, 8], [12, 8], [11, 8], [10, 8], [9, 8],
  // 8. Bottom arm (going down): col 8, rows 9..14 (6 cells)
  [8, 9], [8, 10], [8, 11], [8, 12], [8, 13], [8, 14],
  // 9. Bottom edge (going left): row 14, cols 7..6 (2 cells)
  [7, 14], [6, 14],
  // 10. Green arm (going up): col 6, rows 13..9 (5 cells, start=[6,13])
  [6, 13], [6, 12], [6, 11], [6, 10], [6, 9],
  // 11. Left arm (going left): row 8, cols 5..0 (6 cells)
  [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8],
  // 12. Left edge (going up): col 0, rows 7..6 (2 cells)
  [0, 7], [0, 6],
];

// Home stretches (5 cells leading into central nexus)
const HOME_LANES = {
  red:    [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7]],
  blue:   [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5]],
  yellow: [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7]],
  green:  [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9]],
};

// Base token slots within the 6x6 corner bases
const BASE_POSITIONS = {
  red:    [[1.5, 1.5], [3.5, 1.5], [1.5, 3.5], [3.5, 3.5]],
  blue:   [[10.5, 1.5], [12.5, 1.5], [10.5, 3.5], [12.5, 3.5]],
  yellow: [[10.5, 10.5], [12.5, 10.5], [10.5, 12.5], [12.5, 12.5]],
  green:  [[1.5, 10.5], [3.5, 10.5], [1.5, 12.5], [3.5, 12.5]],
};

const PLAYER_TRACK_STARTS = {
  red: 0,
  blue: 13,
  yellow: 26,
  green: 39,
};

const DIFFICULTIES = [
  { id: 'easy',   label: 'Easy',   desc: 'Casual moves' },
  { id: 'normal', label: 'Normal', desc: 'Balanced AI' },
  { id: 'hard',   label: 'Hard',   desc: 'Tactical AI' },
  { id: 'expert', label: 'Expert', desc: 'Grandmaster' },
];

// ============================================================
// LOBBY COMPONENT
// ============================================================

function Lobby({ onStart }) {
  const [playerCount, setPlayerCount] = useState(4);
  const [mode, setMode] = useState('classic'); // 'classic' | 'quick'
  const [difficulty, setDifficulty] = useState('normal');

  // Player configuration: slot index -> isBot boolean
  const [slotIsBot, setSlotIsBot] = useState({
    0: false, // Red: Human by default
    1: true,  // Blue: Bot
    2: true,  // Yellow: Bot
    3: true,  // Green: Bot
  });

  const getActivePlayerIds = useCallback(() => {
    if (playerCount === 2) return ['red', 'yellow']; // Opposite corners for classic 2-player
    if (playerCount === 3) return ['red', 'blue', 'yellow'];
    return ['red', 'blue', 'yellow', 'green'];
  }, [playerCount]);

  const activeIds = getActivePlayerIds();
  const botCount = activeIds.filter((_, idx) => slotIsBot[idx]).length;

  function toggleSlot(idx) {
    setSlotIsBot(prev => ({ ...prev, [idx]: !prev[idx] }));
  }

  function setPreset(preset) {
    if (preset === 'vs_bots') {
      setSlotIsBot({ 0: false, 1: true, 2: true, 3: true });
    } else if (preset === 'pass_play') {
      setSlotIsBot({ 0: false, 1: false, 2: false, 3: false });
    } else if (preset === 'all_bots') {
      setSlotIsBot({ 0: true, 1: true, 2: true, 3: true });
    }
  }

  return (
    <div className="nludo-lobby">
      <div className="nludo-lobby-inner">
        {/* Header */}
        <div className="nludo-lobby-header">
          <div className="nludo-lobby-badge">
            <span className="nludo-badge-dot" />
            NEON LUDO
          </div>
          <h2 className="nludo-lobby-title">Match Setup</h2>
          <p className="nludo-lobby-subtitle">Play solo vs bots, pass & play with friends, or mix human & AI players.</p>
        </div>

        {/* Quick Presets */}
        <div className="nludo-section">
          <p className="nludo-section-label">Quick Match Presets</p>
          <div className="nludo-presets-row">
            <button
              type="button"
              className="nludo-preset-btn"
              onClick={() => setPreset('vs_bots')}
            >
              🎮 vs Computer
            </button>
            <button
              type="button"
              className="nludo-preset-btn"
              onClick={() => setPreset('pass_play')}
            >
              👥 Pass & Play
            </button>
            <button
              type="button"
              className="nludo-preset-btn"
              onClick={() => setPreset('all_bots')}
            >
              🤖 Bot Battle
            </button>
          </div>
        </div>

        {/* Game Mode */}
        <div className="nludo-section">
          <p className="nludo-section-label">Game Mode</p>
          <div className="nludo-mode-row">
            <button
              type="button"
              className={`nludo-mode-btn ${mode === 'classic' ? 'active' : ''}`}
              onClick={() => setMode('classic')}
            >
              <span className="nludo-mode-icon">♟</span>
              <div>
                <span className="nludo-mode-name">Classic Ludo</span>
                <span className="nludo-mode-sub">4 tokens per player</span>
              </div>
            </button>
            <button
              type="button"
              className={`nludo-mode-btn ${mode === 'quick' ? 'active' : ''}`}
              onClick={() => setMode('quick')}
            >
              <span className="nludo-mode-icon">⚡</span>
              <div>
                <span className="nludo-mode-name">Quick Play</span>
                <span className="nludo-mode-sub">2 tokens per player</span>
              </div>
            </button>
          </div>
        </div>

        {/* Number of Players */}
        <div className="nludo-section">
          <p className="nludo-section-label">Player Count</p>
          <div className="nludo-count-row">
            {[2, 3, 4].map(n => (
              <button
                key={n}
                type="button"
                className={`nludo-count-btn ${playerCount === n ? 'active' : ''}`}
                onClick={() => setPlayerCount(n)}
              >
                {n} <span className="nludo-count-label">{n === 2 ? 'Players (Opposite)' : 'Players'}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Individual Player Slots (Human / Bot Toggle) */}
        <div className="nludo-section">
          <p className="nludo-section-label">Player Roster (Tap to Toggle Human / Bot)</p>
          <div className="nludo-roster-grid">
            {activeIds.map((pid, idx) => {
              const def = PLAYER_DEFS[pid];
              const isBot = !!slotIsBot[idx];
              return (
                <div
                  key={pid}
                  className="nludo-roster-card"
                  onClick={() => toggleSlot(idx)}
                  style={{ borderColor: isBot ? 'rgba(255,255,255,0.08)' : `${def.colorHex}60` }}
                >
                  <span
                    className="nludo-player-dot"
                    style={{ background: def.colorHex, boxShadow: `0 0 10px ${def.colorHex}` }}
                  />
                  <div className="nludo-roster-info">
                    <span className="nludo-roster-name">{def.label}</span>
                    <span className={`nludo-roster-badge ${isBot ? 'bot' : 'human'}`}>
                      {isBot ? '🤖 Bot' : '👤 Human'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bot Difficulty (if any bots) */}
        {botCount > 0 && (
          <div className="nludo-section">
            <p className="nludo-section-label">Bot Intelligence</p>
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

        {/* Start Game Button */}
        <button
          type="button"
          className="nludo-start-btn"
          onClick={() => {
            const playersConfig = activeIds.map((pid, idx) => ({
              id: pid,
              label: PLAYER_DEFS[pid].label,
              isBot: !!slotIsBot[idx],
              difficulty,
            }));
            onStart({ playersConfig, mode, difficulty });
          }}
        >
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
          </svg>
          Launch Match
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
        <h3 className="nludo-modal-title">Classic Ludo Rules</h3>
        <div className="nludo-rules">
          <div className="nludo-rule">
            <span className="nludo-rule-num">1</span>
            <div>
              <strong>Roll 6 to Release</strong>
              <p>You must roll a 6 to move a token out of your corner base onto the starting track square.</p>
            </div>
          </div>
          <div className="nludo-rule">
            <span className="nludo-rule-num">2</span>
            <div>
              <strong>Clockwise Race</strong>
              <p>Move your tokens clockwise around the 52-cell track according to the exact number rolled on the dice.</p>
            </div>
          </div>
          <div className="nludo-rule">
            <span className="nludo-rule-num">3</span>
            <div>
              <strong>Captures & Safe Cells</strong>
              <p>Landing on an enemy token captures it and sends it back to base! Squares with stars (★) and starting squares are safe.</p>
            </div>
          </div>
          <div className="nludo-rule">
            <span className="nludo-rule-num">4</span>
            <div>
              <strong>Bonus Extra Turns</strong>
              <p>Rolling a 6 or capturing an opponent token awards an immediate bonus roll!</p>
            </div>
          </div>
          <div className="nludo-rule">
            <span className="nludo-rule-num">5</span>
            <div>
              <strong>Home Stretch & Exact Finish</strong>
              <p>After completing the lap, tokens enter your colored home column and require an exact roll to enter the center nexus.</p>
            </div>
          </div>
        </div>
        <button className="nludo-modal-ok" onClick={onClose}>Understood</button>
      </div>
    </div>
  );
}

// ============================================================
// VICTORY SCREEN
// ============================================================

function VictoryScreen({ winner, players, onPlayAgain, onNewGame }) {
  const def = PLAYER_DEFS[winner.id];
  const maxTokens = winner.tokens.length;

  return (
    <div className="nludo-victory">
      <div className="nludo-victory-glow" style={{ background: def.colorHex }} />
      <div className="nludo-victory-content">
        <div className="nludo-victory-trophy">🏆</div>
        <h2 className="nludo-victory-title" style={{ color: def.colorHex }}>
          {winner.label} Victory!
        </h2>
        <p className="nludo-victory-sub">
          {winner.isBot ? 'The AI dominated the neon nexus.' : 'Outstanding play! You reached the nexus first.'}
        </p>
        <div className="nludo-victory-standings">
          {players.map((p, idx) => {
            const d = PLAYER_DEFS[p.id];
            const done = p.tokens.filter(t => t.progress === MAX_PROGRESS).length;
            return (
              <div key={p.id} className="nludo-standing-row">
                <span className="nludo-standing-pos">#{idx + 1}</span>
                <span className="nludo-standing-dot" style={{ background: d.colorHex }} />
                <span className="nludo-standing-name">{p.label} {p.isBot ? '(AI)' : ''}</span>
                <span className="nludo-standing-score">{done}/{maxTokens} home</span>
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
        <rect
          x="3" y="3" width="94" height="94" rx="18" ry="18"
          fill="rgba(15,23,42,0.9)"
          stroke="rgba(59,130,246,0.5)"
          strokeWidth="3"
        />
        {dots.map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r="9" fill="#ffffff" style={{ filter: 'drop-shadow(0 0 4px #38bdf8)' }} />
        ))}
      </svg>
    </div>
  );
}

// ============================================================
// LUDO BOARD SVG (15x15 Exact Grid)
// ============================================================

function LudoBoard({ players, currentPlayerId, movableTokens, onTokenClick, diceValue, lastCapture }) {
  const TRACK = STANDARD_TRACK; // 52 cells
  const VB = 15 * CELL; // 600

  const trackMap = new Map();
  const homeLaneMap = {};
  const baseMap = {};

  players.forEach(p => {
    homeLaneMap[p.id] = Array.from({ length: 5 }, () => []);
    baseMap[p.id] = [];
    p.tokens.forEach((t, ti) => {
      if (t.progress === MAX_PROGRESS) return; // finished
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
  const HOME_ARROWS = { red: '▶', blue: '▼', yellow: '◀', green: '▲' };

  function TokenCircle({ pid, ti, cx, cy, r = 11 }) {
    const color = playerColors[pid];
    const movable = isMovable(pid, ti);
    const hitRadius = Math.max(r + 10, 20);

    return (
      <g
        onClick={() => movable && onTokenClick(pid, ti)}
        onKeyDown={(e) => {
          if (movable && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onTokenClick(pid, ti);
          }
        }}
        role={movable ? 'button' : undefined}
        tabIndex={movable ? 0 : undefined}
        aria-label={movable ? `Move ${PLAYER_DEFS[pid]?.label || pid} token ${ti + 1}` : undefined}
        style={{ cursor: movable ? 'pointer' : 'default', touchAction: 'manipulation' }}
      >
        <circle cx={cx} cy={cy} r={hitRadius} fill="transparent" pointerEvents="all" />

        {movable && (
          <>
            <circle cx={cx} cy={cy} r={r + 6} fill={color} opacity="0.3" className="nludo-token-pulse" />
            <circle cx={cx} cy={cy} r={r + 3} fill="none" stroke="#ffffff" strokeWidth="1.5" strokeDasharray="3 2" className="nludo-token-ring" />
          </>
        )}

        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill={color}
          stroke={movable ? '#ffffff' : 'rgba(255,255,255,0.6)'}
          strokeWidth={movable ? 2.5 : 1.5}
          style={{
            filter: movable ? `drop-shadow(0 0 8px ${color})` : `drop-shadow(0 0 3px ${color})`,
            transform: movable ? 'scale(1.12)' : 'scale(1)',
            transformOrigin: `${cx}px ${cy}px`,
            transition: 'transform 0.15s ease, filter 0.15s ease',
          }}
        />

        <circle cx={cx - r * 0.28} cy={cy - r * 0.28} r={r * 0.32} fill="rgba(255,255,255,0.45)" />

        <text
          x={cx}
          y={cy + 3.5}
          textAnchor="middle"
          fontSize={r > 10 ? '9' : '8'}
          fontWeight="900"
          fill="#ffffff"
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          {ti + 1}
        </text>
      </g>
    );
  }

  const zoneColors = {
    red:    { fill: 'rgba(239,68,68,0.18)',  stroke: 'rgba(239,68,68,0.45)' },
    blue:   { fill: 'rgba(59,130,246,0.18)', stroke: 'rgba(59,130,246,0.45)' },
    yellow: { fill: 'rgba(234,179,8,0.18)',  stroke: 'rgba(234,179,8,0.45)' },
    green:  { fill: 'rgba(34,197,94,0.18)',  stroke: 'rgba(34,197,94,0.45)' },
  };

  return (
    <svg
      viewBox={`0 0 ${VB} ${VB}`}
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid meet"
      className="nludo-board-svg"
      role="img"
      aria-label="Neon Ludo Board"
    >
      {/* ── Background ── */}
      <rect width={VB} height={VB} fill="#0b0f19" rx="14" />

      {/* ── 4 Corner Base Zones (6x6 each) ── */}
      {/* Red: top-left [0-5, 0-5] */}
      <rect x={0} y={0} width={6*CELL} height={6*CELL}
        fill={zoneColors.red.fill} stroke={zoneColors.red.stroke} strokeWidth="1.5" />
      <rect x={CELL} y={CELL} width={4*CELL} height={4*CELL}
        fill="rgba(239,68,68,0.1)" stroke="rgba(239,68,68,0.25)" strokeWidth="1" rx="8" />

      {/* Blue: top-right [9-14, 0-5] */}
      <rect x={9*CELL} y={0} width={6*CELL} height={6*CELL}
        fill={zoneColors.blue.fill} stroke={zoneColors.blue.stroke} strokeWidth="1.5" />
      <rect x={10*CELL} y={CELL} width={4*CELL} height={4*CELL}
        fill="rgba(59,130,246,0.1)" stroke="rgba(59,130,246,0.25)" strokeWidth="1" rx="8" />

      {/* Yellow: bottom-right [9-14, 9-14] */}
      <rect x={9*CELL} y={9*CELL} width={6*CELL} height={6*CELL}
        fill={zoneColors.yellow.fill} stroke={zoneColors.yellow.stroke} strokeWidth="1.5" />
      <rect x={10*CELL} y={10*CELL} width={4*CELL} height={4*CELL}
        fill="rgba(234,179,8,0.1)" stroke="rgba(234,179,8,0.25)" strokeWidth="1" rx="8" />

      {/* Green: bottom-left [0-5, 9-14] */}
      <rect x={0} y={9*CELL} width={6*CELL} height={6*CELL}
        fill={zoneColors.green.fill} stroke={zoneColors.green.stroke} strokeWidth="1.5" />
      <rect x={CELL} y={10*CELL} width={4*CELL} height={4*CELL}
        fill="rgba(34,197,94,0.1)" stroke="rgba(34,197,94,0.25)" strokeWidth="1" rx="8" />

      {/* ── 52 Track Cells ── */}
      {TRACK.map(([col, row], absIdx) => {
        const x = col * CELL;
        const y = row * CELL;
        const isSafe = SAFE_CELLS.has(absIdx);
        const startPlayer = Object.entries(PLAYER_TRACK_STARTS).find(([,s]) => s === absIdx)?.[0];

        let cellFill = 'rgba(255,255,255,0.03)';
        let cellStroke = 'rgba(255,255,255,0.08)';

        if (startPlayer) {
          cellFill = `${zoneColors[startPlayer].fill}`;
          cellStroke = `${zoneColors[startPlayer].stroke}`;
        } else if (isSafe) {
          cellFill = 'rgba(255,255,255,0.08)';
          cellStroke = 'rgba(255,255,255,0.25)';
        }

        const tokensHere = trackMap.get(absIdx) || [];

        return (
          <g key={absIdx}>
            <rect x={x+1} y={y+1} width={CELL-2} height={CELL-2}
              fill={cellFill} stroke={cellStroke} strokeWidth="1" rx="4" />
            {isSafe && (
              <text x={x+CELL/2} y={y+CELL/2+4.5} textAnchor="middle"
                fontSize="13" fill={startPlayer ? playerColors[startPlayer] : 'rgba(255,255,255,0.4)'} fontWeight="bold">
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

      {/* ── Home Lane Cells (Colored paths to center) ── */}
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
                <text x={x+CELL/2} y={y+CELL/2+5} textAnchor="middle"
                  fontSize="14" fill={color} opacity="0.75" fontWeight="bold">
                  {HOME_ARROWS[pid]}
                </text>
              )}
              {tokensHere.map(({ playerId, tokenIndex }) => (
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

      {/* ── Base Token Slots ── */}
      {Object.entries(BASE_POSITIONS).map(([pid, positions]) => {
        const tokens = baseMap[pid] || [];
        const playerObj = players.find(p => p.id === pid);
        const maxTokens = playerObj ? playerObj.tokens.length : 4;

        return positions.slice(0, maxTokens).map(([cCol, cRow], slotIdx) => {
          const cx = cCol * CELL + CELL / 2;
          const cy = cRow * CELL + CELL / 2;
          const tokenEntry = tokens[slotIdx];

          return (
            <g key={`base-${pid}-${slotIdx}`}>
              <circle
                cx={cx} cy={cy} r={CELL/2 - 4}
                fill="rgba(10,10,10,0.5)"
                stroke="rgba(255,255,255,0.12)"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              {tokenEntry && (
                <TokenCircle
                  pid={tokenEntry.playerId}
                  ti={tokenEntry.tokenIndex}
                  cx={cx}
                  cy={cy}
                  r={13}
                />
              )}
            </g>
          );
        });
      })}

      {/* ── Center Nexus Triangles ── */}
      <polygon points="240,240 240,360 300,300" fill="rgba(239,68,68,0.4)" stroke="rgba(239,68,68,0.7)" strokeWidth="1" />
      <polygon points="240,240 360,240 300,300" fill="rgba(59,130,246,0.4)" stroke="rgba(59,130,246,0.7)" strokeWidth="1" />
      <polygon points="360,240 360,360 300,300" fill="rgba(234,179,8,0.4)" stroke="rgba(234,179,8,0.7)" strokeWidth="1" />
      <polygon points="240,360 360,360 300,300" fill="rgba(34,197,94,0.4)" stroke="rgba(34,197,94,0.7)" strokeWidth="1" />

      {/* Center star */}
      <text x={300} y={306} textAnchor="middle"
        fontSize="22" fill="#ffffff"
        style={{ filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.8))' }}>
        ★
      </text>

      {/* ── Base Zone Labels ── */}
      {[
        { pid: 'red', x: 3*CELL, y: 5.3*CELL },
        { pid: 'blue', x: 12*CELL, y: 5.3*CELL },
        { pid: 'yellow', x: 12*CELL, y: 9.7*CELL },
        { pid: 'green', x: 3*CELL, y: 9.7*CELL },
      ].map(({ pid, x, y }) => (
        <text key={pid} x={x} y={y} textAnchor="middle"
          fontSize="11" fontWeight="900" letterSpacing="0.12em"
          fill={playerColors[pid]} opacity="0.8" style={{ textTransform: 'uppercase' }}>
          {pid.toUpperCase()}
        </text>
      ))}

      {/* ── Finished tokens badges ── */}
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
            <circle cx={fx} cy={fy} r={16} fill="rgba(0,0,0,0.6)" stroke={playerColors[p.id]} strokeWidth="1.5" />
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
// MAIN GAME CONTROLLER
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

  const timerRef = useRef(null);
  const playersRef = useRef(players);
  const currentIdxRef = useRef(currentIdx);
  const phaseRef = useRef(phase);

  useEffect(() => { playersRef.current = players; }, [players]);
  useEffect(() => { currentIdxRef.current = currentIdx; }, [currentIdx]);
  useEffect(() => { phaseRef.current = phase; }, [phase]);

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
    const tokenCount = cfg.mode === 'quick' ? 2 : 4;
    const newPlayers = cfg.playersConfig.map(p => ({
      id: p.id,
      label: p.label,
      isBot: p.isBot,
      difficulty: p.difficulty,
      tokens: Array.from({ length: tokenCount }, () => ({ progress: -1 })),
    }));

    setPlayers(newPlayers);
    setCurrentIdx(0);
    setDiceValue(null);
    setPhase('roll');
    setLogEntries([]);
    setWinner(null);
    setMovableTokens([]);
    setStatusMsg(`Match initiated! ${newPlayers[0].label} rolls first.`);
    setScreen('game');

    if (newPlayers[0].isBot) {
      delay(800, () => doBotRoll(newPlayers, 0, newPlayers[0].difficulty));
    }
  }

  function doBotRoll(ps, idx, diff) {
    const player = ps[idx];
    if (!player || !player.isBot) return;
    setStatusMsg(`${player.label} (AI) is calculating...`);
    delay(500, () => {
      const roll = rollDie();
      setDiceRolling(true);
      setTimeout(() => setDiceRolling(false), 350);
      setDiceValue(roll);
      addLog(`${player.label} rolled ${roll}`);

      const movable = getMovableTokens(player, roll);
      if (!movable.length) {
        setStatusMsg(`${player.label} rolled ${roll} — no valid moves.`);
        delay(900, () => advanceTurn(ps, idx, false));
        return;
      }

      const choice = chooseBotMove(player, roll, movable, ps, diff || 'normal');
      setStatusMsg(`${player.label} rolled ${roll} and moves token ${choice + 1}.`);
      delay(800, () => doMoveToken(ps, idx, choice, roll));
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
    setTimeout(() => setDiceRolling(false), 350);
    setDiceValue(roll);
    addLog(`${player.label} rolled ${roll}`);

    const movable = getMovableTokens(player, roll);
    if (!movable.length) {
      setStatusMsg(`Rolled ${roll} — no legal moves. Passing turn.`);
      setPhase('roll');
      delay(1100, () => advanceTurn(ps, idx, false));
      return;
    }

    setMovableTokens(movable);
    setPhase('move');
    if (roll === 6) {
      setStatusMsg(`Rolled 6! Tap any highlighted token to move.`);
    } else {
      setStatusMsg(`Rolled ${roll}. Select a highlighted token.`);
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
      addLog(`💥 ${mover.label} captured opponent! Bonus turn!`);
    }

    if (prevProgress === -1 && newProgress === 0) {
      addLog(`${mover.label} brought token ${tokenIndex + 1} into play.`);
    } else if (newProgress === MAX_PROGRESS) {
      grantExtraTurn = true;
      addLog(`🏠 ${mover.label} scored token ${tokenIndex + 1} home! Bonus roll!`);
    }

    setPlayers(updatedPlayers);
    setMovableTokens([]);
    setPhase('roll');

    // Victory check
    const isWinner = updatedPlayers[playerIdx].tokens.every(t => t.progress === MAX_PROGRESS);
    if (isWinner) {
      setWinner(updatedPlayers[playerIdx]);
      setStatusMsg(`${mover.label} wins the game! 🎉`);
      addLog(`🏆 ${mover.label} is victorious!`);
      delay(1400, () => setScreen('victory'));
      return;
    }

    if (grantExtraTurn) {
      setStatusMsg(`${mover.label} earned a bonus roll!`);
      if (mover.isBot) {
        delay(900, () => doBotRoll(updatedPlayers, playerIdx, mover.difficulty));
      } else {
        setDiceValue(null);
        setPhase('roll');
        setStatusMsg(`Bonus turn! Roll again.`);
      }
    } else {
      delay(650, () => advanceTurn(updatedPlayers, playerIdx, false));
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
    setPhase('bot');
    doMoveToken(ps, idx, tokenIndex, roll);
  }

  function advanceTurn(ps, fromIdx, extraTurn) {
    if (extraTurn) {
      const player = ps[fromIdx];
      setDiceValue(null);
      setPhase('roll');
      if (player.isBot) {
        doBotRoll(ps, fromIdx, player.difficulty);
      } else {
        setStatusMsg(`Bonus roll! Go again.`);
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
      setStatusMsg(`${nextPlayer.label} (AI) is rolling...`);
      delay(700, () => doBotRoll(ps, nextIdx, nextPlayer.difficulty));
    } else {
      setStatusMsg(`Your turn, ${nextPlayer.label}! Roll the dice.`);
    }
  }

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
        {/* ── Board Area ── */}
        <div className="nludo-board-area">
          {/* Clean Mobile Status Bar (No duplicate dice) */}
          <div className="nludo-mobile-turn-bar">
            <div className="nludo-mobile-turn-info">
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
              <span className="nludo-mobile-status">{statusMsg}</span>
            </div>
          </div>

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

        {/* ── Interactive Controls & Sidebar ── */}
        <aside className="nludo-sidebar">
          {/* Current Turn Card */}
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
                  <span className="nludo-turn-type">{currentPlayer.isBot ? 'BOT' : 'HUMAN'}</span>
                </>
              )}
            </div>
            <p className="nludo-status-msg">{statusMsg}</p>
          </div>

          {/* Dedicated Single Dice & Roll Card */}
          <div className="nludo-dice-card">
            <div className="nludo-dice-wrap">
              <DiceFace value={diceValue || 1} rolling={diceRolling} />
            </div>
            <div className="nludo-dice-val">
              {diceValue ? `Rolled: ${diceValue}` : 'Roll to start'}
            </div>
            <button
              type="button"
              className="nludo-roll-btn"
              onClick={doRollDice}
              disabled={phase !== 'roll' || currentPlayer?.isBot}
              aria-label="Roll Dice"
            >
              {diceRolling ? 'Rolling...' : diceValue && phase === 'move' ? `Rolled ${diceValue}` : '🎲 Roll Dice'}
            </button>
            {phase === 'move' && !currentPlayer?.isBot && (
              <p className="nludo-hint">Tap a highlighted token to move</p>
            )}
          </div>

          {/* Players Roster */}
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
                      {p.isBot && <span className="nludo-bot-tag">AI</span>}
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

          {/* Match Log */}
          <div className="nludo-log-card">
            <h3 className="nludo-card-title">Event Log</h3>
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

          {/* Global Controls */}
          <div className="nludo-controls-row">
            <button type="button" className="nludo-ctrl-btn" onClick={() => setShowHelp(true)} title="Rules">
              ❓ Rules
            </button>
            <button type="button" className="nludo-ctrl-btn" onClick={() => startGame(config)} title="Restart">
              🔄 Restart
            </button>
            <button type="button" className="nludo-ctrl-btn" onClick={() => setScreen('lobby')} title="New Setup">
              🏠 Menu
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
