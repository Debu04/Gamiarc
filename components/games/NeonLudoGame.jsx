'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';

// ============================================================
// LUDO CONSTANTS & 2–8 PLAYER ENGINE
// ============================================================

const PLAYER_DEFS = {
  red:    { label: 'Red',    colorHex: '#ef4444', homeColor: 'rgba(239,68,68,0.35)',    glowColor: 'rgba(239,68,68,0.6)' },
  orange: { label: 'Orange', colorHex: '#f97316', homeColor: 'rgba(249,115,22,0.35)',  glowColor: 'rgba(249,115,22,0.6)' },
  yellow: { label: 'Gold',   colorHex: '#eab308', homeColor: 'rgba(234,179,8,0.35)',   glowColor: 'rgba(234,179,8,0.6)' },
  green:  { label: 'Green',  colorHex: '#22c55e', homeColor: 'rgba(34,197,94,0.35)',   glowColor: 'rgba(34,197,94,0.6)' },
  cyan:   { label: 'Cyan',   colorHex: '#06b6d4', homeColor: 'rgba(6,182,212,0.35)',   glowColor: 'rgba(6,182,212,0.6)' },
  blue:   { label: 'Blue',   colorHex: '#3b82f6', homeColor: 'rgba(59,130,246,0.35)',  glowColor: 'rgba(59,130,246,0.6)' },
  purple: { label: 'Purple', colorHex: '#a855f7', homeColor: 'rgba(168,85,247,0.35)',  glowColor: 'rgba(168,85,247,0.6)' },
  dark:   { label: 'Black',  colorHex: '#334155', homeColor: 'rgba(30,41,59,0.55)',    glowColor: 'rgba(148,163,184,0.7)', accentHex: '#94a3b8' },
  rose:   { label: 'Pink',   colorHex: '#ec4899', homeColor: 'rgba(236,72,153,0.35)', glowColor: 'rgba(236,72,153,0.6)' },
};

// 4-Player Starts & Safe Cells (52 track cells)
const STARTS_4 = { red: 0, blue: 13, yellow: 26, green: 39 };
const SAFE_CELLS_4 = new Set([0, 8, 13, 21, 26, 34, 39, 47]);

function rollDie() {
  return Math.floor(Math.random() * 6) + 1;
}

function getHomeStretchStart(playerCount) {
  return playerCount >= 5 ? playerCount * 12 : 52;
}

function getMaxProgress(playerCount) {
  return playerCount >= 5 ? playerCount * 12 + 5 : 57;
}

function getTotalTrackCells(playerCount) {
  return playerCount >= 5 ? playerCount * 12 : 52;
}

function getSafeCellsSet(playerCount) {
  if (playerCount < 5) return SAFE_CELLS_4;
  const safe = new Set();
  for (let i = 0; i < playerCount; i++) {
    safe.add(i * 12);     // Start cell outside base
    safe.add(i * 12 + 8); // Outward corridor safe star
    if (playerCount === 8) {
      safe.add(i * 12 + 11); // Outer safe bridge 'X' cell
    }
  }
  return safe;
}

function getAbsoluteTrackPos(playerId, progress, playerCount, playerIndex = 0) {
  const homeStart = getHomeStretchStart(playerCount);
  if (progress < 0 || progress >= homeStart) return null;
  if (playerCount < 5) {
    const start = STARTS_4[playerId] ?? 0;
    return (start + progress) % 52;
  }
  const total = playerCount * 12;
  return (playerIndex * 12 + progress) % total;
}

function getMovableTokens(player, roll, playerCount) {
  const maxProg = getMaxProgress(playerCount);
  return player.tokens.reduce((acc, token, i) => {
    if (token.progress === maxProg) return acc;
    if (token.progress === -1) {
      if (roll === 6) acc.push(i);
      return acc;
    }
    const next = token.progress + roll;
    if (next <= maxProg) acc.push(i);
    return acc;
  }, []);
}

function findCapturableTokens(players, moverId, moverIndex, absolutePos, playerCount) {
  if (absolutePos === null) return [];
  const homeStart = getHomeStretchStart(playerCount);
  const captured = [];
  players.forEach((p, pIdx) => {
    if (p.id === moverId) return;
    p.tokens.forEach((t, ti) => {
      if (t.progress < 0 || t.progress >= homeStart) return;
      const absPos = getAbsoluteTrackPos(p.id, t.progress, playerCount, pIdx);
      if (absPos === absolutePos) {
        captured.push({ playerId: p.id, tokenIndex: ti });
      }
    });
  });
  return captured;
}

// ============================================================
// AI STRATEGY HEURISTICS (Unrigged & Progressive)
// ============================================================

function scoreMove(player, playerIndex, tokenIndex, roll, players, difficulty, playerCount) {
  const token = player.tokens[tokenIndex];
  const prevProgress = token.progress;
  const nextProgress = prevProgress === -1 ? 0 : prevProgress + roll;
  const maxProg = getMaxProgress(playerCount);
  const homeStart = getHomeStretchStart(playerCount);
  const safeSet = getSafeCellsSet(playerCount);

  // 1. Reaching home goal
  if (nextProgress === maxProg) {
    if (difficulty === 'easy') return 50;
    if (difficulty === 'normal') return 200;
    return 1000;
  }

  let score = nextProgress * 2;

  // 2. Exiting base on 6
  if (prevProgress === -1 && roll === 6) {
    if (difficulty === 'easy') score += 10;
    else if (difficulty === 'normal') score += 40;
    else if (difficulty === 'hard') score += 90;
    else score += 140;
  }

  // 3. Entering home stretch
  if (prevProgress < homeStart && nextProgress >= homeStart) {
    if (difficulty === 'easy') score += 15;
    else if (difficulty === 'normal') score += 40;
    else score += 100;
  }

  // 4. Capturing opponent tokens
  if (nextProgress >= 0 && nextProgress < homeStart) {
    const absLandingPos = getAbsoluteTrackPos(player.id, nextProgress, playerCount, playerIndex);
    if (!safeSet.has(absLandingPos)) {
      const capturables = findCapturableTokens(players, player.id, playerIndex, absLandingPos, playerCount);
      if (capturables.length > 0) {
        if (difficulty === 'easy') score += 20;
        else if (difficulty === 'normal') score += 60 * capturables.length;
        else if (difficulty === 'hard') score += 160 * capturables.length;
        else score += 320 * capturables.length;
      }
    } else {
      if (difficulty === 'hard') score += 25;
      else if (difficulty === 'expert') score += 60;
    }
  }

  // 5. Threat avoidance (Hard & Expert)
  if (difficulty === 'hard' || difficulty === 'expert') {
    const totalCells = getTotalTrackCells(playerCount);
    if (prevProgress >= 0 && prevProgress < homeStart) {
      const currentAbsPos = getAbsoluteTrackPos(player.id, prevProgress, playerCount, playerIndex);
      if (!safeSet.has(currentAbsPos)) {
        let inDanger = false;
        players.forEach((p, pIdx) => {
          if (p.id === player.id) return;
          p.tokens.forEach(enemyToken => {
            if (enemyToken.progress >= 0 && enemyToken.progress < homeStart) {
              const enemyAbs = getAbsoluteTrackPos(p.id, enemyToken.progress, playerCount, pIdx);
              const dist = (currentAbsPos - enemyAbs + totalCells) % totalCells;
              if (dist >= 1 && dist <= 6) inDanger = true;
            }
          });
        });
        if (inDanger) score += difficulty === 'expert' ? 180 : 80;
      }
    }

    if (nextProgress >= 0 && nextProgress < homeStart) {
      const landingAbsPos = getAbsoluteTrackPos(player.id, nextProgress, playerCount, playerIndex);
      if (!safeSet.has(landingAbsPos)) {
        let landingInDanger = false;
        players.forEach((p, pIdx) => {
          if (p.id === player.id) return;
          p.tokens.forEach(enemyToken => {
            if (enemyToken.progress >= 0 && enemyToken.progress < homeStart) {
              const enemyAbs = getAbsoluteTrackPos(p.id, enemyToken.progress, playerCount, pIdx);
              const dist = (landingAbsPos - enemyAbs + totalCells) % totalCells;
              if (dist >= 1 && dist <= 6) landingInDanger = true;
            }
          });
        });
        if (landingInDanger) score -= difficulty === 'expert' ? 70 : 35;
      }
    }
  }

  return score;
}

function chooseBotMove(player, playerIndex, roll, movableIndexes, players, difficulty, playerCount) {
  if (difficulty === 'easy') {
    const shuffled = [...movableIndexes].sort(() => Math.random() - 0.5);
    return shuffled[0];
  }

  let best = movableIndexes[0];
  let bestScore = -Infinity;
  for (const i of movableIndexes) {
    const s = scoreMove(player, playerIndex, i, roll, players, difficulty, playerCount);
    if (s > bestScore) {
      bestScore = s;
      best = i;
    }
  }
  return best;
}

// ============================================================
// 4-PLAYER 15x15 BOARD GEOMETRY
// ============================================================

const CELL_4 = 40;

const TRACK_4 = [
  [1, 6], [2, 6], [3, 6], [4, 6], [5, 6],
  [6, 5], [6, 4], [6, 3], [6, 2], [6, 1], [6, 0],
  [7, 0], [8, 0],
  [8, 1], [8, 2], [8, 3], [8, 4], [8, 5],
  [9, 6], [10, 6], [11, 6], [12, 6], [13, 6], [14, 6],
  [14, 7], [14, 8],
  [13, 8], [12, 8], [11, 8], [10, 8], [9, 8],
  [8, 9], [8, 10], [8, 11], [8, 12], [8, 13], [8, 14],
  [7, 14], [6, 14],
  [6, 13], [6, 12], [6, 11], [6, 10], [6, 9],
  [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8],
  [0, 7], [0, 6],
];

const HOME_LANES_4 = {
  red:    [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7]],
  blue:   [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5]],
  yellow: [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7]],
  green:  [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9]],
};

const BASE_POSITIONS_4 = {
  red:    [[1.5, 1.5], [3.5, 1.5], [1.5, 3.5], [3.5, 3.5]],
  blue:   [[10.5, 1.5], [12.5, 1.5], [10.5, 3.5], [12.5, 3.5]],
  yellow: [[10.5, 10.5], [12.5, 10.5], [10.5, 12.5], [12.5, 12.5]],
  green:  [[1.5, 10.5], [3.5, 10.5], [1.5, 12.5], [3.5, 12.5]],
};

// ============================================================
// 5, 6, 7-PLAYER LUDO KING STYLE BOARD GEOMETRY (Polygonal Corridors)
// ============================================================

function buildMultiBoardGeometry(numPlayers) {
  const angles = [];
  for (let i = 0; i < numPlayers; i++) {
    angles.push(-Math.PI / 2 + i * (2 * Math.PI / numPlayers));
  }
  const track = [];
  const homeLanes = [];
  const bases = [];
  const X0 = 360, Y0 = 360;
  const d = 26; // corridor offset
  const radii = [100, 130, 160, 190, 220]; // 5 cell radii

  for (let i = 0; i < numPlayers; i++) {
    const ang = angles[i];
    const uX = Math.cos(ang), uY = Math.sin(ang);
    const vX = -Math.sin(ang), vY = Math.cos(ang);

    // 1. Inward corridor (5 cells from outer to inner)
    // Step 0 is at radius 220 (start cell right outside base i)
    for (let k = 4; k >= 0; k--) {
      const r = radii[k];
      track.push({ x: X0 + r * uX - d * vX, y: Y0 + r * uY - d * vY, ang, arm: i, step: 4 - k });
    }

    // 2. Inner bridge cell between arm i and arm (i + 1) % numPlayers
    const nextI = (i + 1) % numPlayers;
    const midAng = ang + Math.PI / numPlayers;
    track.push({ x: X0 + 82 * Math.cos(midAng), y: Y0 + 82 * Math.sin(midAng), ang: midAng, arm: i, step: 5 });

    // 3. Outward corridor of arm i+1 (5 cells from inner to outer)
    const nextAng = angles[nextI];
    const nUx = Math.cos(nextAng), nUy = Math.sin(nextAng);
    const nVx = -Math.sin(nextAng), nVy = Math.cos(nextAng);
    for (let k = 0; k < 5; k++) {
      const r = radii[k];
      track.push({ x: X0 + r * nUx + d * nVx, y: Y0 + r * nUy + d * nVy, ang: nextAng, arm: nextI, step: 6 + k });
    }

    // 4. Outer bridge cell at arm i+1
    track.push({ x: X0 + 248 * nUx, y: Y0 + 248 * nUy, ang: nextAng, arm: nextI, step: 11 });

    // Home lane for arm i (5 cells from outer to inner)
    const lane = [];
    for (let k = 4; k >= 0; k--) {
      const r = radii[k];
      lane.push({ x: X0 + r * uX, y: Y0 + r * uY, ang });
    }
    homeLanes.push(lane);

    // Base for arm i
    const bCX = X0 + 295 * uX;
    const bCY = Y0 + 295 * uY;
    bases.push([
      { x: bCX - 16 * uX - 16 * vX, y: bCY - 16 * uY - 16 * vY },
      { x: bCX - 16 * uX + 16 * vX, y: bCY - 16 * uY + 16 * vY },
      { x: bCX + 16 * uX - 16 * vX, y: bCY + 16 * uY - 16 * vY },
      { x: bCX + 16 * uX + 16 * vX, y: bCY + 16 * uY + 16 * vY },
    ]);
  }

  return { angles, track, homeLanes, bases };
}

const DIFFICULTIES = [
  { id: 'easy',   label: 'Easy',   desc: 'Casual moves' },
  { id: 'normal', label: 'Normal', desc: 'Balanced AI' },
  { id: 'hard',   label: 'Hard',   desc: 'Tactical AI' },
  { id: 'expert', label: 'Expert', desc: 'Grandmaster' },
];

// ============================================================
// AUDIO SYNTHESIZER (Web Audio API)
// ============================================================

function playAudioEffect(type, soundEnabled, ctxRef) {
  if (!soundEnabled || typeof window === 'undefined') return;
  try {
    if (!ctxRef.current) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) ctxRef.current = new AudioCtx();
    }
    const ctx = ctxRef.current;
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    const now = ctx.currentTime;

    if (type === 'roll') {
      for (let i = 0; i < 4; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220 + Math.random() * 280, now + i * 0.07);
        gain.gain.setValueAtTime(0.12, now + i * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.05);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.07);
        osc.stop(now + i * 0.07 + 0.06);
      }
    } else if (type === 'step') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(480, now);
      osc.frequency.exponentialRampToValueAtTime(700, now + 0.08);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'capture') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(340, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.35);
      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);
    } else if (type === 'bonus') {
      [523.25, 659.25, 783.99].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.14, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.22);
      });
    } else if (type === 'victory') {
      [440, 554.37, 659.25, 880].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);
        gain.gain.setValueAtTime(0.2, now + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.42);
      });
    }
  } catch (e) {
    // Graceful audio safety
  }
}

// ============================================================
// LOBBY SCREEN (Supports 2, 3, 4, 5, 6, 7 Players)
// ============================================================

function Lobby({ onStart }) {
  const [playerCount, setPlayerCount] = useState(4);
  const [mode, setMode] = useState('classic'); // 'classic' | 'quick'
  const [difficulty, setDifficulty] = useState('normal');

  const [slotIsBot, setSlotIsBot] = useState({
    0: false,
    1: true,
    2: true,
    3: true,
    4: true,
    5: true,
    6: true,
    7: true,
  });

  const getActivePlayerIds = useCallback(() => {
    if (playerCount === 2) return ['red', 'yellow'];
    if (playerCount === 3) return ['red', 'blue', 'yellow'];
    if (playerCount === 4) return ['red', 'blue', 'yellow', 'green'];
    if (playerCount === 5) return ['red', 'orange', 'yellow', 'green', 'cyan'];
    if (playerCount === 6) return ['red', 'orange', 'yellow', 'green', 'cyan', 'purple'];
    if (playerCount === 7) return ['red', 'orange', 'yellow', 'green', 'cyan', 'blue', 'purple'];
    return ['green', 'orange', 'red', 'purple', 'cyan', 'dark', 'rose', 'yellow'];
  }, [playerCount]);

  const activeIds = getActivePlayerIds();
  const botCount = activeIds.filter((_, idx) => slotIsBot[idx]).length;

  function toggleSlot(idx) {
    setSlotIsBot(prev => ({ ...prev, [idx]: !prev[idx] }));
  }

  function setPreset(preset) {
    if (preset === 'vs_bots') {
      setSlotIsBot({ 0: false, 1: true, 2: true, 3: true, 4: true, 5: true, 6: true, 7: true });
    } else if (preset === 'pass_play') {
      setSlotIsBot({ 0: false, 1: false, 2: false, 3: false, 4: false, 5: false, 6: false, 7: false });
    } else if (preset === 'all_bots') {
      setSlotIsBot({ 0: true, 1: true, 2: true, 3: true, 4: true, 5: true, 6: true, 7: true });
    }
  }

  return (
    <div className="nludo-lobby">
      <div className="nludo-lobby-inner">
        <div className="nludo-lobby-header">
          <div className="nludo-lobby-badge">
            <span className="nludo-badge-dot" />
            NEON LUDO
          </div>
          <h2 className="nludo-lobby-title">Match Setup</h2>
          <p className="nludo-lobby-subtitle">Classic 2–4 players, 5–7 polygonal, or 8-Player Octagonal Star board.</p>
        </div>

        {/* Presets */}
        <div className="nludo-section">
          <p className="nludo-section-label">Quick Presets</p>
          <div className="nludo-presets-row">
            <button type="button" className="nludo-preset-btn" onClick={() => setPreset('vs_bots')}>
              🎮 vs Computer
            </button>
            <button type="button" className="nludo-preset-btn" onClick={() => setPreset('pass_play')}>
              👥 Pass & Play
            </button>
            <button type="button" className="nludo-preset-btn" onClick={() => setPreset('all_bots')}>
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

        {/* Player Count */}
        <div className="nludo-section">
          <p className="nludo-section-label">Player Count & Board Style</p>
          <div className="nludo-count-row">
            {[2, 3, 4, 5, 6, 7, 8].map(n => (
              <button
                key={n}
                type="button"
                className={`nludo-count-btn ${playerCount === n ? 'active' : ''}`}
                onClick={() => setPlayerCount(n)}
              >
                {n}
                <span className="nludo-count-label">
                  {n <= 4 ? (n === 2 ? 'Opposite' : '4-Player') : `${n}-Player`}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Player Roster */}
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
                  style={{ borderColor: isBot ? 'rgba(255,255,255,0.08)' : `${def.colorHex}70` }}
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

        {/* Bot Difficulty */}
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
            onStart({ playersConfig, mode, difficulty, playerCount });
          }}
        >
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
          </svg>
          Launch {playerCount >= 5 ? `${playerCount}-Player Match` : 'Match'}
        </button>
      </div>
    </div>
  );
}

// ============================================================
// CONCISE HOW TO PLAY MODAL
// ============================================================

function HowToPlayModal({ onClose, playerCount }) {
  const isMulti = playerCount >= 5;
  return (
    <div className="nludo-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label="Rules">
      <div className="nludo-modal-card" onClick={e => e.stopPropagation()}>
        <button className="nludo-modal-close" onClick={onClose} aria-label="Close">×</button>
        <h3 className="nludo-modal-title">{isMulti ? `${playerCount}-Player Board Rules` : 'Classic Ludo Rules'}</h3>
        <div className="nludo-rules">
          <div className="nludo-rule">
            <span className="nludo-rule-num">1</span>
            <div>
              <strong>Roll 6 to Enter</strong>
              <p>Roll a 6 to move a token from base onto your starting track square right outside your yard.</p>
            </div>
          </div>
          <div className="nludo-rule">
            <span className="nludo-rule-num">2</span>
            <div>
              <strong>Clockwise Race</strong>
              <p>Move tokens clockwise around the corridor track according to dice rolls.</p>
            </div>
          </div>
          <div className="nludo-rule">
            <span className="nludo-rule-num">3</span>
            <div>
              <strong>Captures & Safe Stars (★)</strong>
              <p>Land on an opponent to send them back to base! Star cells (★) and starting squares are safe.</p>
            </div>
          </div>
          <div className="nludo-rule">
            <span className="nludo-rule-num">4</span>
            <div>
              <strong>Bonus Extra Turns</strong>
              <p>Rolling a 6, capturing an opponent, or scoring home awards an immediate bonus roll.</p>
            </div>
          </div>
          <div className="nludo-rule">
            <span className="nludo-rule-num">5</span>
            <div>
              <strong>Exact Finishing Roll</strong>
              <p>Tokens require an exact roll to enter the central nexus triangle.</p>
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

function VictoryScreen({ winner, players, playerCount, onPlayAgain, onNewGame }) {
  const def = PLAYER_DEFS[winner.id] || PLAYER_DEFS.red;
  const maxTokens = winner.tokens.length;
  const maxProg = getMaxProgress(playerCount);

  return (
    <div className="nludo-victory">
      <div className="nludo-victory-glow" style={{ background: def.colorHex }} />
      <div className="nludo-victory-content">
        <div className="nludo-victory-trophy">🏆</div>
        <h2 className="nludo-victory-title" style={{ color: def.colorHex }}>
          {winner.label} Victory!
        </h2>
        <p className="nludo-victory-sub">
          {winner.isBot ? 'The AI conquered the nexus!' : 'Outstanding strategy! You reached the nexus first.'}
        </p>
        <div className="nludo-victory-standings">
          {players.map((p, idx) => {
            const d = PLAYER_DEFS[p.id] || PLAYER_DEFS.red;
            const done = p.tokens.filter(t => t.progress === maxProg).length;
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
          fill="rgba(15,23,42,0.95)"
          stroke="rgba(59,130,246,0.6)"
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
// TOKEN COMPONENT
// ============================================================

function TokenCircle({ pid, ti, cx, cy, r = 11, isMovable, onTokenClick }) {
  const color = PLAYER_DEFS[pid]?.colorHex || '#fff';
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

// ============================================================
// 4-PLAYER SQUARE BOARD SVG
// ============================================================

function Board4Player({ players, currentPlayerId, movableTokens, onTokenClick, playerCount }) {
  const VB = 15 * CELL_4;
  const maxProg = getMaxProgress(playerCount);
  const homeStart = getHomeStretchStart(playerCount);

  const trackMap = new Map();
  const homeLaneMap = {};
  const baseMap = {};

  players.forEach((p, pIdx) => {
    homeLaneMap[p.id] = Array.from({ length: 5 }, () => []);
    baseMap[p.id] = [];
    p.tokens.forEach((t, ti) => {
      if (t.progress === maxProg) return;
      if (t.progress === -1) {
        baseMap[p.id].push({ playerId: p.id, tokenIndex: ti, token: t });
        return;
      }
      if (t.progress >= homeStart) {
        const laneIdx = t.progress - homeStart;
        if (laneIdx < 5) homeLaneMap[p.id][laneIdx].push({ playerId: p.id, tokenIndex: ti, token: t });
        return;
      }
      const absPos = getAbsoluteTrackPos(p.id, t.progress, playerCount, pIdx);
      if (!trackMap.has(absPos)) trackMap.set(absPos, []);
      trackMap.get(absPos).push({ playerId: p.id, tokenIndex: ti, token: t });
    });
  });

  const isMovable = (pid, ti) => pid === currentPlayerId && movableTokens.includes(ti);
  const HOME_ARROWS = { red: '▶', blue: '▼', yellow: '◀', green: '▲' };

  return (
    <svg viewBox={`0 0 ${VB} ${VB}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet" className="nludo-board-svg">
      <rect width={VB} height={VB} fill="#0b0f19" rx="14" />

      {/* 4 Corner Base Zones */}
      <rect x={0} y={0} width={6*CELL_4} height={6*CELL_4} fill="rgba(239,68,68,0.18)" stroke="rgba(239,68,68,0.45)" strokeWidth="1.5" />
      <rect x={CELL_4} y={CELL_4} width={4*CELL_4} height={4*CELL_4} fill="rgba(239,68,68,0.1)" stroke="rgba(239,68,68,0.25)" strokeWidth="1" rx="8" />

      <rect x={9*CELL_4} y={0} width={6*CELL_4} height={6*CELL_4} fill="rgba(59,130,246,0.18)" stroke="rgba(59,130,246,0.45)" strokeWidth="1.5" />
      <rect x={10*CELL_4} y={CELL_4} width={4*CELL_4} height={4*CELL_4} fill="rgba(59,130,246,0.1)" stroke="rgba(59,130,246,0.25)" strokeWidth="1" rx="8" />

      <rect x={9*CELL_4} y={9*CELL_4} width={6*CELL_4} height={6*CELL_4} fill="rgba(234,179,8,0.18)" stroke="rgba(234,179,8,0.45)" strokeWidth="1.5" />
      <rect x={10*CELL_4} y={10*CELL_4} width={4*CELL_4} height={4*CELL_4} fill="rgba(234,179,8,0.1)" stroke="rgba(234,179,8,0.25)" strokeWidth="1" rx="8" />

      <rect x={0} y={9*CELL_4} width={6*CELL_4} height={6*CELL_4} fill="rgba(34,197,94,0.18)" stroke="rgba(34,197,94,0.45)" strokeWidth="1.5" />
      <rect x={CELL_4} y={10*CELL_4} width={4*CELL_4} height={4*CELL_4} fill="rgba(34,197,94,0.1)" stroke="rgba(34,197,94,0.25)" strokeWidth="1" rx="8" />

      {/* 52 Track Cells */}
      {TRACK_4.map(([col, row], absIdx) => {
        const x = col * CELL_4;
        const y = row * CELL_4;
        const isSafe = SAFE_CELLS_4.has(absIdx);
        const startPlayer = Object.entries(STARTS_4).find(([,s]) => s === absIdx)?.[0];

        let cellFill = 'rgba(255,255,255,0.03)';
        let cellStroke = 'rgba(255,255,255,0.08)';

        if (startPlayer) {
          cellFill = PLAYER_DEFS[startPlayer].homeColor;
          cellStroke = PLAYER_DEFS[startPlayer].glowColor;
        } else if (isSafe) {
          cellFill = 'rgba(255,255,255,0.08)';
          cellStroke = 'rgba(255,255,255,0.25)';
        }

        const tokensHere = trackMap.get(absIdx) || [];

        return (
          <g key={absIdx}>
            <rect x={x+1} y={y+1} width={CELL_4-2} height={CELL_4-2} fill={cellFill} stroke={cellStroke} strokeWidth="1" rx="4" />
            {isSafe && (
              <text x={x+CELL_4/2} y={y+CELL_4/2+4.5} textAnchor="middle" fontSize="13" fill={startPlayer ? PLAYER_DEFS[startPlayer].colorHex : 'rgba(255,255,255,0.4)'} fontWeight="bold">
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
                  cx={x + CELL_4/2 + offsetX}
                  cy={y + CELL_4/2 + offsetY}
                  r={spread ? 8 : 11}
                  isMovable={isMovable}
                  onTokenClick={onTokenClick}
                />
              );
            })}
          </g>
        );
      })}

      {/* Home Lanes */}
      {Object.entries(HOME_LANES_4).map(([pid, cells]) => {
        const def = PLAYER_DEFS[pid];
        return cells.map(([col, row], laneIdx) => {
          const x = col * CELL_4;
          const y = row * CELL_4;
          const tokensHere = (homeLaneMap[pid] || [])[laneIdx] || [];
          return (
            <g key={`home-${pid}-${laneIdx}`}>
              <rect x={x+1} y={y+1} width={CELL_4-2} height={CELL_4-2} fill={def.homeColor} stroke={def.glowColor} strokeWidth="1.5" rx="4" />
              {laneIdx === 4 && (
                <text x={x+CELL_4/2} y={y+CELL_4/2+5} textAnchor="middle" fontSize="14" fill={def.colorHex} opacity="0.8" fontWeight="bold">
                  {HOME_ARROWS[pid]}
                </text>
              )}
              {tokensHere.map(({ playerId, tokenIndex }) => (
                <TokenCircle
                  key={`${playerId}-${tokenIndex}`}
                  pid={playerId}
                  ti={tokenIndex}
                  cx={x + CELL_4/2}
                  cy={y + CELL_4/2}
                  r={11}
                  isMovable={isMovable}
                  onTokenClick={onTokenClick}
                />
              ))}
            </g>
          );
        });
      })}

      {/* Base Slots */}
      {Object.entries(BASE_POSITIONS_4).map(([pid, positions]) => {
        const tokens = baseMap[pid] || [];
        const playerObj = players.find(p => p.id === pid);
        const maxTokens = playerObj ? playerObj.tokens.length : 4;

        return positions.slice(0, maxTokens).map(([cCol, cRow], slotIdx) => {
          const cx = cCol * CELL_4 + CELL_4 / 2;
          const cy = cRow * CELL_4 + CELL_4 / 2;
          const tokenEntry = tokens[slotIdx];

          return (
            <g key={`base-${pid}-${slotIdx}`}>
              <circle cx={cx} cy={cy} r={CELL_4/2 - 4} fill="rgba(10,10,10,0.5)" stroke="rgba(255,255,255,0.12)" strokeWidth="1" strokeDasharray="3 3" />
              {tokenEntry && (
                <TokenCircle
                  pid={tokenEntry.playerId}
                  ti={tokenEntry.tokenIndex}
                  cx={cx}
                  cy={cy}
                  r={13}
                  isMovable={isMovable}
                  onTokenClick={onTokenClick}
                />
              )}
            </g>
          );
        });
      })}

      {/* Center Nexus */}
      <polygon points="240,240 240,360 300,300" fill="rgba(239,68,68,0.4)" stroke="rgba(239,68,68,0.7)" strokeWidth="1" />
      <polygon points="240,240 360,240 300,300" fill="rgba(59,130,246,0.4)" stroke="rgba(59,130,246,0.7)" strokeWidth="1" />
      <polygon points="360,240 360,360 300,300" fill="rgba(234,179,8,0.4)" stroke="rgba(234,179,8,0.7)" strokeWidth="1" />
      <polygon points="240,360 360,360 300,300" fill="rgba(34,197,94,0.4)" stroke="rgba(34,197,94,0.7)" strokeWidth="1" />
      <text x={300} y={306} textAnchor="middle" fontSize="22" fill="#ffffff" style={{ filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.8))' }}>
        ★
      </text>

      {/* Zone Labels */}
      {[
        { pid: 'red', x: 3*CELL_4, y: 5.3*CELL_4 },
        { pid: 'blue', x: 12*CELL_4, y: 5.3*CELL_4 },
        { pid: 'yellow', x: 12*CELL_4, y: 9.7*CELL_4 },
        { pid: 'green', x: 3*CELL_4, y: 9.7*CELL_4 },
      ].map(({ pid, x, y }) => (
        <text key={pid} x={x} y={y} textAnchor="middle" fontSize="11" fontWeight="900" letterSpacing="0.12em" fill={PLAYER_DEFS[pid].colorHex} opacity="0.8" style={{ textTransform: 'uppercase' }}>
          {pid.toUpperCase()}
        </text>
      ))}

      {/* Finished badges */}
      {players.map(p => {
        const finishedCount = p.tokens.filter(t => t.progress === maxProg).length;
        if (!finishedCount) return null;
        const positions = {
          red: [3*CELL_4, 7.5*CELL_4],
          blue: [7.5*CELL_4, 3*CELL_4],
          yellow: [12*CELL_4, 7.5*CELL_4],
          green: [7.5*CELL_4, 12*CELL_4],
        };
        const pos = positions[p.id] || [3*CELL_4, 7.5*CELL_4];
        const [fx, fy] = pos;
        return (
          <g key={`fin-${p.id}`}>
            <circle cx={fx} cy={fy} r={16} fill="rgba(0,0,0,0.6)" stroke={PLAYER_DEFS[p.id].colorHex} strokeWidth="1.5" />
            <text x={fx} y={fy+5} textAnchor="middle" fontSize="14" fontWeight="900" fill={PLAYER_DEFS[p.id].colorHex}>
              {finishedCount}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================
// 5, 6, 7-PLAYER LUDO KING STYLE BOARD SVG (Polygonal Corridors)
// ============================================================

function BoardMultiPlayer({ players, currentPlayerId, movableTokens, onTokenClick, playerCount }) {
  const geo = useMemo(() => buildMultiBoardGeometry(playerCount), [playerCount]);
  const { angles, track, homeLanes, bases } = geo;

  const homeStart = getHomeStretchStart(playerCount);
  const maxProg = getMaxProgress(playerCount);
  const safeSet = useMemo(() => getSafeCellsSet(playerCount), [playerCount]);

  const trackMap = new Map();
  const homeLaneMap = {};
  const baseMap = {};

  players.forEach((p, pIdx) => {
    homeLaneMap[p.id] = Array.from({ length: 5 }, () => []);
    baseMap[p.id] = [];
    p.tokens.forEach((t, ti) => {
      if (t.progress === maxProg) return;
      if (t.progress === -1) {
        baseMap[p.id].push({ playerId: p.id, tokenIndex: ti, token: t });
        return;
      }
      if (t.progress >= homeStart) {
        const laneIdx = t.progress - homeStart;
        if (laneIdx < 5) homeLaneMap[p.id][laneIdx].push({ playerId: p.id, tokenIndex: ti, token: t });
        return;
      }
      const absPos = getAbsoluteTrackPos(p.id, t.progress, playerCount, pIdx);
      if (!trackMap.has(absPos)) trackMap.set(absPos, []);
      trackMap.get(absPos).push({ playerId: p.id, tokenIndex: ti, token: t });
    });
  });

  const isMovable = (pid, ti) => pid === currentPlayerId && movableTokens.includes(ti);

  return (
    <svg viewBox="0 0 720 720" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" className="nludo-board-svg">
      <rect width="720" height="720" fill="#0b0f19" rx="16" />

      {/* Base Cards for all arms */}
      {angles.map((ang, i) => {
        const uX = Math.cos(ang), uY = Math.sin(ang);
        const playerObj = players[i];
        if (!playerObj) return null;
        const pid = playerObj.id;
        const def = PLAYER_DEFS[pid] || PLAYER_DEFS.red;
        const bCX = 360 + 295 * uX;
        const bCY = 360 + 295 * uY;
        const deg = (ang * 180 / Math.PI) + 90;

        return (
          <g key={`base-panel-${i}`} transform={`translate(${bCX}, ${bCY}) rotate(${deg})`}>
            <rect
              x="-38"
              y="-38"
              width="76"
              height="76"
              rx="14"
              fill={def.homeColor}
              stroke={def.glowColor}
              strokeWidth="1.5"
            />
            <text
              x="0"
              y="-24"
              textAnchor="middle"
              fontSize="9"
              fontWeight="900"
              fill={def.colorHex}
              letterSpacing="0.1em"
            >
              {def.label.toUpperCase()}
            </text>
          </g>
        );
      })}

      {/* Track Cells (Rotated along spoke angle) */}
      {track.map((pt, absIdx) => {
        const isSafe = safeSet.has(absIdx);
        const isStart = absIdx % 12 === 0;
        const armIdx = Math.floor(absIdx / 12);
        const startPlayer = isStart && players[armIdx] ? players[armIdx].id : null;
        const startDef = startPlayer ? PLAYER_DEFS[startPlayer] : null;

        let cellFill = 'rgba(255,255,255,0.03)';
        let cellStroke = 'rgba(255,255,255,0.1)';

        if (startDef) {
          cellFill = startDef.homeColor;
          cellStroke = startDef.glowColor;
        } else if (isSafe) {
          cellFill = 'rgba(255,255,255,0.09)';
          cellStroke = 'rgba(255,255,255,0.3)';
        }

        const tokensHere = trackMap.get(absIdx) || [];
        const deg = (pt.ang * 180 / Math.PI);

        return (
          <g key={`multi-track-${absIdx}`}>
            <g transform={`translate(${pt.x}, ${pt.y}) rotate(${deg})`}>
              <rect
                x="-12"
                y="-12"
                width="24"
                height="24"
                rx="4"
                fill={cellFill}
                stroke={cellStroke}
                strokeWidth={isStart ? 1.5 : 1}
              />
              {isSafe && (
                <text
                  x="0"
                  y="4"
                  textAnchor="middle"
                  fontSize="12"
                  fill={startDef ? startDef.colorHex : 'rgba(255,255,255,0.5)'}
                  fontWeight="bold"
                >
                  ★
                </text>
              )}
            </g>
            {tokensHere.map(({ playerId, tokenIndex }, ti) => {
              const spread = tokensHere.length > 1;
              const offsetX = spread ? ((ti % 2) * 12 - 6) : 0;
              const offsetY = spread ? (Math.floor(ti / 2) * 12 - 4) : 0;
              return (
                <TokenCircle
                  key={`${playerId}-${tokenIndex}`}
                  pid={playerId}
                  ti={tokenIndex}
                  cx={pt.x + offsetX}
                  cy={pt.y + offsetY}
                  r={spread ? 7 : 10}
                  isMovable={isMovable}
                  onTokenClick={onTokenClick}
                />
              );
            })}
          </g>
        );
      })}

      {/* Home Lanes (5 cells per arm) */}
      {homeLanes.map((lane, pIdx) => {
        const playerObj = players[pIdx];
        if (!playerObj) return null;
        const pid = playerObj.id;
        const def = PLAYER_DEFS[pid] || PLAYER_DEFS.red;

        return lane.map((pt, laneIdx) => {
          const tokensHere = (homeLaneMap[pid] || [])[laneIdx] || [];
          const deg = (pt.ang * 180 / Math.PI);

          return (
            <g key={`multi-home-${pid}-${laneIdx}`}>
              <g transform={`translate(${pt.x}, ${pt.y}) rotate(${deg})`}>
                <rect
                  x="-12"
                  y="-12"
                  width="24"
                  height="24"
                  rx="4"
                  fill={def.homeColor}
                  stroke={def.glowColor}
                  strokeWidth="1.5"
                />
                {laneIdx === 0 && (
                  <text x="0" y="4.5" textAnchor="middle" fontSize="11" fill={def.colorHex} opacity="0.9" fontWeight="bold">
                    ▼
                  </text>
                )}
              </g>
              {tokensHere.map(({ playerId, tokenIndex }) => (
                <TokenCircle
                  key={`${playerId}-${tokenIndex}`}
                  pid={playerId}
                  ti={tokenIndex}
                  cx={pt.x}
                  cy={pt.y}
                  r={10}
                  isMovable={isMovable}
                  onTokenClick={onTokenClick}
                />
              ))}
            </g>
          );
        });
      })}

      {/* Base Token Slots */}
      {bases.map((slots, pIdx) => {
        const playerObj = players[pIdx];
        if (!playerObj) return null;
        const pid = playerObj.id;
        const tokens = baseMap[pid] || [];
        const maxTokens = playerObj.tokens.length;

        return slots.slice(0, maxTokens).map((pt, slotIdx) => {
          const tokenEntry = tokens[slotIdx];
          return (
            <g key={`multi-base-${pid}-${slotIdx}`}>
              <circle
                cx={pt.x}
                cy={pt.y}
                r="11"
                fill="rgba(10,10,10,0.5)"
                stroke="rgba(255,255,255,0.18)"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              {tokenEntry && (
                <TokenCircle
                  pid={tokenEntry.playerId}
                  ti={tokenEntry.tokenIndex}
                  cx={pt.x}
                  cy={pt.y}
                  r={11}
                  isMovable={isMovable}
                  onTokenClick={onTokenClick}
                />
              )}
            </g>
          );
        });
      })}

      {/* Central Nexus Polygons */}
      {angles.map((ang, i) => {
        const nextAng = angles[(i + 1) % playerCount];
        const p1X = 360 + 64 * Math.cos(ang), p1Y = 360 + 64 * Math.sin(ang);
        const p2X = 360 + 64 * Math.cos(nextAng), p2Y = 360 + 64 * Math.sin(nextAng);
        const playerObj = players[i];
        const pid = playerObj ? playerObj.id : 'red';
        const def = PLAYER_DEFS[pid] || PLAYER_DEFS.red;

        return (
          <polygon
            key={`multi-center-${i}`}
            points={`360,360 ${p1X},${p1Y} ${p2X},${p2Y}`}
            fill={def.homeColor}
            stroke={def.glowColor}
            strokeWidth="1.2"
          />
        );
      })}
      <circle cx="360" cy="360" r="20" fill="rgba(11,15,25,0.95)" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
      <text x="360" y="366" textAnchor="middle" fontSize="18" fill="#ffffff" style={{ filter: 'drop-shadow(0 0 8px #fff)' }}>
        ★
      </text>

      {/* Finished Badges */}
      {players.map((p, pIdx) => {
        const finishedCount = p.tokens.filter(t => t.progress === maxProg).length;
        if (!finishedCount) return null;
        const ang = angles[pIdx];
        const fx = 360 + 338 * Math.cos(ang);
        const fy = 360 + 338 * Math.sin(ang);
        const def = PLAYER_DEFS[p.id];
        return (
          <g key={`multi-fin-${p.id}`}>
            <circle cx={fx} cy={fy} r={14} fill="rgba(0,0,0,0.8)" stroke={def.colorHex} strokeWidth="1.5" />
            <text x={fx} y={fy + 4.5} textAnchor="middle" fontSize="12" fontWeight="900" fill={def.colorHex}>
              {finishedCount}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================
// 8-PLAYER RECTANGULAR BOARD GEOMETRY & COMPONENT
// ============================================================

// ============================================================
// 8-PLAYER OCTAGONAL STAR BOARD GEOMETRY & COMPONENT (Authentic Ludo)
// ============================================================

function build8BoardGeometry() {
  const angles = [];
  for (let i = 0; i < 8; i++) {
    angles.push(-Math.PI / 2 + i * (2 * Math.PI / 8));
  }
  const track = [];
  const homeLanes = [];
  const bases = [];
  const arms = [];
  const X0 = 360, Y0 = 360;

  // 6 rows from r=112 to r=292
  const rowRadii = [112, 148, 184, 220, 256, 292];
  const colOffset = 23; // left=-23, mid=0, right=+23

  for (let i = 0; i < 8; i++) {
    const ang = angles[i];
    const uX = Math.cos(ang), uY = Math.sin(ang);
    const vX = -Math.sin(ang), vY = Math.cos(ang);

    arms.push({
      ang,
      uX, uY, vX, vY,
      armIndex: i,
    });

    // 12 track cells for sector i:
    // Step 0: Row 5 of Right column (Start cell right outside base i)
    // Steps 1-4: Rows 4 down to 1 of Right column (Inward corridor)
    for (let r = 5; r >= 1; r--) {
      const rad = rowRadii[r];
      track.push({
        x: X0 + rad * uX + colOffset * vX,
        y: Y0 + rad * uY + colOffset * vY,
        ang,
        arm: i,
        step: 5 - r,
      });
    }

    // Step 5: Inner bridge near collar between Arm i and Arm (i+1)
    const nextI = (i + 1) % 8;
    const midAng = ang + Math.PI / 8;
    track.push({
      x: X0 + 92 * Math.cos(midAng),
      y: Y0 + 92 * Math.sin(midAng),
      ang: midAng,
      arm: i,
      step: 5,
    });

    // Steps 6-10: Outward along Left column of Arm (i+1) (Rows 1 up to 5)
    const nAng = angles[nextI];
    const nUx = Math.cos(nAng), nUy = Math.sin(nAng);
    const nVx = -Math.sin(nAng), nVy = Math.cos(nAng);
    for (let r = 1; r <= 5; r++) {
      const rad = rowRadii[r];
      track.push({
        x: X0 + rad * nUx - colOffset * nVx,
        y: Y0 + rad * nUy - colOffset * nVy,
        ang: nAng,
        arm: nextI,
        step: 5 + r,
      });
    }

    // Step 11: Outer bridge at Arm (i+1)'s Row 5 Middle column (marked with X)
    track.push({
      x: X0 + rowRadii[5] * nUx,
      y: Y0 + rowRadii[5] * nUy,
      ang: nAng,
      arm: nextI,
      step: 11,
    });

    // Home lane for player i: 5 cells inward along Middle column
    // Rows 4 down to 0
    const lane = [];
    for (let r = 4; r >= 0; r--) {
      const rad = rowRadii[r];
      lane.push({
        x: X0 + rad * uX,
        y: Y0 + rad * uY,
        ang,
        step: 4 - r,
      });
    }
    homeLanes.push(lane);

    // Base for player i: in the wedge between Arm i and Arm (i+1)
    const wAng = ang + Math.PI / 8;
    const wUx = Math.cos(wAng), wUy = Math.sin(wAng);
    const wVx = -Math.sin(wAng), wVy = Math.cos(wAng);
    bases.push([
      { x: X0 + 268 * wUx - 20 * wVx, y: Y0 + 268 * wUy - 20 * wVy },
      { x: X0 + 268 * wUx + 20 * wVx, y: Y0 + 268 * wUy + 20 * wVy },
      { x: X0 + 218 * wUx,            y: Y0 + 218 * wUy },
      { x: X0 + 172 * wUx,            y: Y0 + 172 * wUy },
    ]);
  }

  return { angles, track, homeLanes, bases, arms, rowRadii, colOffset };
}

function Board8PlayerOctagon({ players, currentPlayerId, movableTokens, onTokenClick }) {
  const geo = useMemo(() => build8BoardGeometry(), []);
  const { angles, track, homeLanes, bases, arms, rowRadii } = geo;

  const homeStart = 96;
  const maxProg = 101;
  const safeSet = useMemo(() => getSafeCellsSet(8), []);

  const trackMap = new Map();
  const homeLaneMap = {};
  const baseMap = {};

  players.forEach((p, pIdx) => {
    homeLaneMap[p.id] = Array.from({ length: 5 }, () => []);
    baseMap[p.id] = [];
    p.tokens.forEach((t, ti) => {
      if (t.progress === maxProg) return;
      if (t.progress === -1) {
        baseMap[p.id].push({ playerId: p.id, tokenIndex: ti, token: t });
        return;
      }
      if (t.progress >= homeStart) {
        const laneIdx = t.progress - homeStart;
        if (laneIdx < 5) homeLaneMap[p.id][laneIdx].push({ playerId: p.id, tokenIndex: ti, token: t });
        return;
      }
      const absPos = getAbsoluteTrackPos(p.id, t.progress, 8, pIdx);
      if (!trackMap.has(absPos)) trackMap.set(absPos, []);
      trackMap.get(absPos).push({ playerId: p.id, tokenIndex: ti, token: t });
    });
  });

  const isMovable = (pid, ti) => pid === currentPlayerId && movableTokens.includes(ti);

  // 16-gon outer rim points
  const outerRimPts = [];
  for (let k = 0; k < 16; k++) {
    const a = -Math.PI / 2 + k * (2 * Math.PI / 16) - Math.PI / 16;
    outerRimPts.push(`${360 + 352 * Math.cos(a)},${360 + 352 * Math.sin(a)}`);
  }

  // Central green octagon points (radius 56)
  const greenOctPts = [];
  for (let k = 0; k < 8; k++) {
    const a = -Math.PI / 2 + k * (2 * Math.PI / 8) - Math.PI / 8;
    greenOctPts.push(`${360 + 56 * Math.cos(a)},${360 + 56 * Math.sin(a)}`);
  }

  // Collar octagon points (radius 92)
  const collarOctPts = [];
  for (let k = 0; k < 8; k++) {
    const a = -Math.PI / 2 + k * (2 * Math.PI / 8) - Math.PI / 8;
    collarOctPts.push(`${360 + 92 * Math.cos(a)},${360 + 92 * Math.sin(a)}`);
  }

  return (
    <svg viewBox="0 0 720 720" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" className="nludo-board-svg">
      {/* Dark Board Field */}
      <rect width="720" height="720" fill="#040711" rx="16" />

      {/* 16-gon Outer Perimeter with Bold Blue Neon Rim */}
      <polygon
        points={outerRimPts.join(' ')}
        fill="#000000"
        stroke="#2563eb"
        strokeWidth="4"
        style={{ filter: 'drop-shadow(0 0 10px rgba(37,99,235,0.4))' }}
      />

      {/* 8 Base Wedges (Black grounds between arms with token clusters) */}
      {bases.map((slots, pIdx) => {
        const pObj = players[pIdx];
        if (!pObj) return null;
        const pid = pObj.id;
        const def = PLAYER_DEFS[pid] || PLAYER_DEFS.red;
        const tokens = baseMap[pid] || [];
        const maxTokens = pObj.tokens.length;

        // Label in wedge
        const ang = angles[pIdx] + Math.PI / 8;
        const lx = 360 + 318 * Math.cos(ang);
        const ly = 360 + 318 * Math.sin(ang);

        return (
          <g key={`oct-base-wedge-${pid}`}>
            {/* Player Label in Base Wedge */}
            <text
              x={lx}
              y={ly}
              textAnchor="middle"
              fontSize="9"
              fontWeight="900"
              letterSpacing="0.1em"
              fill={def.colorHex}
              style={{ textTransform: 'uppercase', filter: `drop-shadow(0 0 4px ${def.glowColor})` }}
            >
              {def.label}
            </text>

            {/* Base Token Slots */}
            {slots.slice(0, maxTokens).map((pt, slotIdx) => {
              const tokenEntry = tokens[slotIdx];
              return (
                <g key={`oct-base-${pid}-${slotIdx}`}>
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="13.5"
                    fill="rgba(10,14,24,0.6)"
                    stroke={def.colorHex}
                    strokeWidth="1.2"
                    strokeDasharray="2 2"
                    opacity="0.85"
                  />
                  {tokenEntry && (
                    <TokenCircle
                      pid={tokenEntry.playerId}
                      ti={tokenEntry.tokenIndex}
                      cx={pt.x}
                      cy={pt.y}
                      r={13}
                      isMovable={isMovable}
                      onTokenClick={onTokenClick}
                    />
                  )}
                </g>
              );
            })}
          </g>
        );
      })}

      {/* 8 White Corridors (Arms) with Colored Borders, Stars, and 'X' Cells */}
      {arms.map((arm, pIdx) => {
        const pObj = players[pIdx];
        const pid = pObj ? pObj.id : 'red';
        const def = PLAYER_DEFS[pid] || PLAYER_DEFS.red;
        const deg = (arm.ang * 180 / Math.PI) + 90;

        return (
          <g key={`oct-arm-${pIdx}`} transform={`translate(360, 360) rotate(${deg})`}>
            {/* White Corridor Body */}
            <rect
              x="-34.5"
              y="-312"
              width="69"
              height="218"
              rx="3"
              fill="#ffffff"
              stroke={def.colorHex}
              strokeWidth="2.5"
              style={{ filter: `drop-shadow(0 0 6px ${def.glowColor})` }}
            />

            {/* 2 Longitudinal Divider Lines (3 columns) */}
            <line x1="-11.5" y1="-312" x2="-11.5" y2="-94" stroke={def.colorHex} strokeWidth="1.2" opacity="0.65" />
            <line x1="11.5" y1="-312" x2="11.5" y2="-94" stroke={def.colorHex} strokeWidth="1.2" opacity="0.65" />

            {/* 5 Transverse Divider Lines (6 rows) */}
            {[-276, -240, -204, -168, -132].map((yLine, li) => (
              <line key={`arm-div-${li}`} x1="-34.5" y1={yLine} x2="34.5" y2={yLine} stroke={def.colorHex} strokeWidth="1.2" opacity="0.65" />
            ))}

            {/* Row 5 (Outermost) Middle Cell: Crossed 'X' Safe/Bridge Cell */}
            <line x1="-10" y1="-310" x2="10" y2="-278" stroke={def.colorHex} strokeWidth="2.2" strokeLinecap="round" />
            <line x1="10" y1="-310" x2="-10" y2="-278" stroke={def.colorHex} strokeWidth="2.2" strokeLinecap="round" />

            {/* Row 5 (Outermost) Right Cell: Start Circle Indicator */}
            <circle cx="23" cy="-294" r="7.5" fill={def.colorHex} opacity="0.85" />

            {/* Middle Column Home Path Stars (Rows 4 down to 1) */}
            {[-258, -222, -186, -150].map((starY, si) => (
              <text
                key={`home-star-${si}`}
                x="0"
                y={starY + 6.5}
                textAnchor="middle"
                fontSize="18"
                fill={def.colorHex}
                fontWeight="bold"
                style={{ filter: `drop-shadow(0 0 2px ${def.colorHex})` }}
              >
                ★
              </text>
            ))}

            {/* Row 0 Middle Cell: Entrance Arrow to Center */}
            <text x="0" y="-108" textAnchor="middle" fontSize="12" fill={def.colorHex} opacity="0.8" fontWeight="bold">
              ▼
            </text>
          </g>
        );
      })}

      {/* Central Collar (Octagonal Ring between arms and green center) */}
      <polygon
        points={collarOctPts.join(' ')}
        fill="#040711"
        stroke="#2563eb"
        strokeWidth="2"
      />
      {angles.map((ang, i) => {
        const midA = ang + Math.PI / 8;
        const x1 = 360 + 56 * Math.cos(midA);
        const y1 = 360 + 56 * Math.sin(midA);
        const x2 = 360 + 92 * Math.cos(midA);
        const y2 = 360 + 92 * Math.sin(midA);
        return (
          <line
            key={`collar-div-${i}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#2563eb"
            strokeWidth="1.5"
            opacity="0.8"
          />
        );
      })}

      {/* Central Green Octagon Nexus */}
      <polygon
        points={greenOctPts.join(' ')}
        fill="#043d1a"
        stroke="#2563eb"
        strokeWidth="3"
        style={{ filter: 'drop-shadow(0 0 12px rgba(34,197,94,0.3))' }}
      />
      <circle cx="360" cy="360" r="16" fill="#022c13" stroke="#22c55e" strokeWidth="1.5" />
      <text
        x="360"
        y="365.5"
        textAnchor="middle"
        fontSize="16"
        fill="#facc15"
        fontWeight="bold"
        style={{ filter: 'drop-shadow(0 0 6px rgba(250,204,21,0.8))' }}
      >
        ★
      </text>

      {/* Track Tokens Rendering */}
      {track.map((pt, absIdx) => {
        const tokensHere = trackMap.get(absIdx) || [];
        if (!tokensHere.length) return null;

        return (
          <g key={`oct-track-tokens-${absIdx}`}>
            {tokensHere.map(({ playerId, tokenIndex }, ti) => {
              const spread = tokensHere.length > 1;
              const offsetX = spread ? ((ti % 2) * 12 - 6) : 0;
              const offsetY = spread ? (Math.floor(ti / 2) * 12 - 6) : 0;
              return (
                <TokenCircle
                  key={`${playerId}-${tokenIndex}`}
                  pid={playerId}
                  ti={tokenIndex}
                  cx={pt.x + offsetX}
                  cy={pt.y + offsetY}
                  r={spread ? 8 : 11}
                  isMovable={isMovable}
                  onTokenClick={onTokenClick}
                />
              );
            })}
          </g>
        );
      })}

      {/* Home Lane Tokens Rendering */}
      {homeLanes.map((lane, pIdx) => {
        const pObj = players[pIdx];
        if (!pObj) return null;
        const pid = pObj.id;

        return lane.map((pt, laneIdx) => {
          const tokensHere = (homeLaneMap[pid] || [])[laneIdx] || [];
          if (!tokensHere.length) return null;

          return (
            <g key={`oct-home-tokens-${pid}-${laneIdx}`}>
              {tokensHere.map(({ playerId, tokenIndex }) => (
                <TokenCircle
                  key={`${playerId}-${tokenIndex}`}
                  pid={playerId}
                  ti={tokenIndex}
                  cx={pt.x}
                  cy={pt.y}
                  r={11}
                  isMovable={isMovable}
                  onTokenClick={onTokenClick}
                />
              ))}
            </g>
          );
        });
      })}

      {/* Finished Badges */}
      {players.map((p, pIdx) => {
        const finishedCount = p.tokens.filter(t => t.progress === maxProg).length;
        if (!finishedCount) return null;
        const ang = angles[pIdx];
        const fx = 360 + 338 * Math.cos(ang);
        const fy = 360 + 338 * Math.sin(ang);
        const def = PLAYER_DEFS[p.id];
        return (
          <g key={`oct-fin-${p.id}`}>
            <circle cx={fx} cy={fy} r={14} fill="rgba(0,0,0,0.85)" stroke={def.colorHex} strokeWidth="1.8" />
            <text x={fx} y={fy + 4.5} textAnchor="middle" fontSize="12" fontWeight="900" fill={def.colorHex}>
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
  const [screen, setScreen] = useState('lobby');
  const [config, setConfig] = useState(null);
  const [players, setPlayers] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [diceValue, setDiceValue] = useState(null);
  const [diceRolling, setDiceRolling] = useState(false);
  const [phase, setPhase] = useState('roll');
  const [logEntries, setLogEntries] = useState([]);
  const [winner, setWinner] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const [movableTokens, setMovableTokens] = useState([]);
  const [capturedEffect, setCapturedEffect] = useState(null);
  const [statusMsg, setStatusMsg] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);

  const audioCtxRef = useRef(null);
  const timerRef = useRef(null);
  const playersRef = useRef(players);
  const currentIdxRef = useRef(currentIdx);
  const phaseRef = useRef(phase);
  const configRef = useRef(config);
  const soundEnabledRef = useRef(soundEnabled);

  useEffect(() => { playersRef.current = players; }, [players]);
  useEffect(() => { currentIdxRef.current = currentIdx; }, [currentIdx]);
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { configRef.current = config; }, [config]);
  useEffect(() => { soundEnabledRef.current = soundEnabled; }, [soundEnabled]);

  function triggerSound(type) {
    playAudioEffect(type, soundEnabledRef.current, audioCtxRef);
  }

  function addLog(msg) {
    setLogEntries(prev => [msg, ...prev].slice(0, 25));
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
    setCapturedEffect(null);
    setStatusMsg(`Match initiated! ${newPlayers[0].label} rolls first.`);
    setScreen('game');

    if (newPlayers[0].isBot) {
      delay(800, () => doBotRoll(newPlayers, 0, newPlayers[0].difficulty, cfg.playerCount));
    }
  }

  function doBotRoll(ps, idx, diff, playerCount) {
    const player = ps[idx];
    if (!player || !player.isBot) return;
    setStatusMsg(`${player.label} (AI) is calculating...`);
    delay(500, () => {
      const roll = rollDie();
      setDiceRolling(true);
      triggerSound('roll');
      setTimeout(() => setDiceRolling(false), 350);
      setDiceValue(roll);
      addLog(`${player.label} rolled ${roll}`);

      const movable = getMovableTokens(player, roll, playerCount);
      if (!movable.length) {
        setStatusMsg(`${player.label} rolled ${roll} — no valid moves.`);
        delay(900, () => advanceTurn(ps, idx, false, playerCount));
        return;
      }

      const choice = chooseBotMove(player, idx, roll, movable, ps, diff || 'normal', playerCount);
      setStatusMsg(`${player.label} rolled ${roll} and moves token ${choice + 1}.`);
      delay(800, () => doMoveToken(ps, idx, choice, roll, playerCount));
    });
  }

  function doRollDice() {
    if (phase !== 'roll') return;
    const ps = playersRef.current;
    const idx = currentIdxRef.current;
    const cfg = configRef.current;
    const player = ps[idx];
    if (!player || player.isBot) return;

    const roll = rollDie();
    setDiceRolling(true);
    triggerSound('roll');
    setTimeout(() => setDiceRolling(false), 350);
    setDiceValue(roll);
    addLog(`${player.label} rolled ${roll}`);

    const movable = getMovableTokens(player, roll, cfg?.playerCount || 4);
    if (!movable.length) {
      setStatusMsg(`Rolled ${roll} — no legal moves. Passing turn.`);
      setPhase('roll');
      delay(1100, () => advanceTurn(ps, idx, false, cfg?.playerCount || 4));
      return;
    }

    setMovableTokens(movable);
    setPhase('move');
    if (roll === 6) {
      setStatusMsg(`Rolled 6! Tap highlighted token to move.`);
    } else {
      setStatusMsg(`Rolled ${roll}. Select a highlighted token.`);
    }
  }

  function doMoveToken(ps, playerIdx, tokenIndex, roll, playerCount) {
    triggerSound('step');
    const maxProg = getMaxProgress(playerCount);
    const homeStart = getHomeStretchStart(playerCount);
    const safeSet = getSafeCellsSet(playerCount);

    const newPlayers = ps.map((p, pi) => {
      if (pi !== playerIdx) return p;
      const newTokens = p.tokens.map((t, ti) => {
        if (ti !== tokenIndex) return t;
        const prev = t.progress;
        const next = prev === -1 ? 0 : prev + roll;
        return { ...t, progress: Math.min(next, maxProg) };
      });
      return { ...p, tokens: newTokens };
    });

    const mover = newPlayers[playerIdx];
    const movedToken = mover.tokens[tokenIndex];
    const prevProgress = ps[playerIdx].tokens[tokenIndex].progress;
    const newProgress = movedToken.progress;

    let capturedVictims = [];
    let grantExtraTurn = roll === 6;

    const updatedPlayers = newPlayers.map((p, pIdx) => {
      if (p.id === mover.id) return p;
      const newTokens = p.tokens.map(t => {
        if (t.progress < 0 || t.progress >= homeStart) return t;
        const absPos = getAbsoluteTrackPos(p.id, t.progress, playerCount, pIdx);
        const moverAbs = newProgress >= homeStart ? null : getAbsoluteTrackPos(mover.id, newProgress, playerCount, playerIdx);
        if (moverAbs !== null && absPos === moverAbs && !safeSet.has(absPos)) {
          capturedVictims.push(p);
          return { ...t, progress: -1 };
        }
        return t;
      });
      return { ...p, tokens: newTokens };
    });

    const didCapture = capturedVictims.length > 0;

    if (didCapture) {
      grantExtraTurn = true;
      triggerSound('capture');
      const victim = capturedVictims[0];
      const capturerDef = PLAYER_DEFS[mover.id] || PLAYER_DEFS.red;
      const victimDef = PLAYER_DEFS[victim.id] || PLAYER_DEFS.blue;

      setCapturedEffect({
        capturerId: mover.id,
        capturedId: victim.id,
        capturerColor: capturerDef.colorHex,
        capturedColor: victimDef.colorHex,
        capturerName: mover.label,
        capturedName: victim.label,
      });

      setTimeout(() => setCapturedEffect(null), 1500);
      addLog(`💥 ${mover.label} captured ${victim.label}'s token! Bonus roll awarded!`);
    }

    if (prevProgress === -1 && newProgress === 0) {
      addLog(`${mover.label} brought token ${tokenIndex + 1} into play.`);
    } else if (newProgress === maxProg) {
      grantExtraTurn = true;
      triggerSound('bonus');
      addLog(`🏠 ${mover.label} scored token ${tokenIndex + 1} home! Bonus roll!`);
    }

    setPlayers(updatedPlayers);
    setMovableTokens([]);
    setPhase('roll');

    // Victory check
    const isWinner = updatedPlayers[playerIdx].tokens.every(t => t.progress === maxProg);
    if (isWinner) {
      setWinner(updatedPlayers[playerIdx]);
      triggerSound('victory');
      setStatusMsg(`${mover.label} wins the match! 🎉`);
      addLog(`🏆 ${mover.label} is victorious!`);
      delay(didCapture ? 2000 : 1400, () => setScreen('victory'));
      return;
    }

    const nextActionDelay = didCapture ? 1600 : 650;

    if (grantExtraTurn) {
      setStatusMsg(`${mover.label} earned a bonus roll!`);
      if (mover.isBot) {
        delay(nextActionDelay, () => doBotRoll(updatedPlayers, playerIdx, mover.difficulty, playerCount));
      } else {
        setDiceValue(null);
        setPhase('roll');
        setStatusMsg(`Bonus turn! Roll again.`);
      }
    } else {
      delay(nextActionDelay, () => advanceTurn(updatedPlayers, playerIdx, false, playerCount));
    }
  }

  function handleTokenClick(playerId, tokenIndex) {
    const ps = playersRef.current;
    const idx = currentIdxRef.current;
    const phs = phaseRef.current;
    const cfg = configRef.current;

    if (phs !== 'move') return;
    const player = ps[idx];
    if (!player || player.id !== playerId || player.isBot) return;
    if (!movableTokens.includes(tokenIndex)) return;

    const roll = diceValue;
    setPhase('bot');
    doMoveToken(ps, idx, tokenIndex, roll, cfg?.playerCount || 4);
  }

  function advanceTurn(ps, fromIdx, extraTurn, playerCount) {
    if (extraTurn) {
      const player = ps[fromIdx];
      setDiceValue(null);
      setPhase('roll');
      if (player.isBot) {
        doBotRoll(ps, fromIdx, player.difficulty, playerCount);
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
      delay(700, () => doBotRoll(ps, nextIdx, nextPlayer.difficulty, playerCount));
    } else {
      setStatusMsg(`Your turn, ${nextPlayer.label}! Roll the dice.`);
    }
  }

  // Keyboard accessibility
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === ' ' || e.key === 'Enter') {
        if (phaseRef.current === 'roll' && !playersRef.current[currentIdxRef.current]?.isBot) {
          e.preventDefault();
          doRollDice();
        }
      } else if (['1', '2', '3', '4'].includes(e.key)) {
        const tokenIdx = parseInt(e.key, 10) - 1;
        const curPlayer = playersRef.current[currentIdxRef.current];
        if (phaseRef.current === 'move' && curPlayer && !curPlayer.isBot) {
          handleTokenClick(curPlayer.id, tokenIdx);
        }
      } else if (e.key.toLowerCase() === 'm') {
        setSoundEnabled(prev => !prev);
      } else if (e.key.toLowerCase() === 'h') {
        setShowHelp(prev => !prev);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => () => clearTimer(), []);

  const currentPlayer = players[currentIdx];
  const activePlayerCount = config?.playerCount || 4;
  const isMulti = activePlayerCount >= 5;
  const homeStart = getHomeStretchStart(activePlayerCount);

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
          playerCount={activePlayerCount}
          onPlayAgain={() => startGame(config)}
          onNewGame={() => setScreen('lobby')}
        />
      </div>
    );
  }

  return (
    <div className="nludo-shell">
      {showHelp && <HowToPlayModal onClose={() => setShowHelp(false)} playerCount={activePlayerCount} />}

      <div className="nludo-game-layout">
        {/* ── Board Area ── */}
        <div className="nludo-board-area">
          {/* Single Clean Mobile Turn Header */}
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
            {activePlayerCount === 8 ? (
              <Board8PlayerOctagon
                players={players}
                currentPlayerId={currentPlayer?.id}
                movableTokens={phase === 'move' && !currentPlayer?.isBot ? movableTokens : []}
                onTokenClick={handleTokenClick}
              />
            ) : isMulti ? (
              <BoardMultiPlayer
                players={players}
                currentPlayerId={currentPlayer?.id}
                movableTokens={phase === 'move' && !currentPlayer?.isBot ? movableTokens : []}
                onTokenClick={handleTokenClick}
                playerCount={activePlayerCount}
              />
            ) : (
              <Board4Player
                players={players}
                currentPlayerId={currentPlayer?.id}
                movableTokens={phase === 'move' && !currentPlayer?.isBot ? movableTokens : []}
                onTokenClick={handleTokenClick}
                playerCount={activePlayerCount}
              />
            )}

            {/* Clear Capture Notification Banner */}
            {capturedEffect && (
              <div className="nludo-capture-banner">
                <div className="nludo-capture-title">💥 CAPTURE!</div>
                <div className="nludo-capture-desc">
                  <span style={{ color: capturedEffect.capturerColor, fontWeight: 900 }}>
                    {capturedEffect.capturerName}
                  </span>
                  {' captured '}
                  <span style={{ color: capturedEffect.capturedColor, fontWeight: 900 }}>
                    {capturedEffect.capturedName}
                  </span>
                  {'!'}
                </div>
                <div className="nludo-capture-sub">Sent back to base • Bonus Roll Awarded 🎯</div>
              </div>
            )}
          </div>
        </div>

        {/* ── Sidebar Controls ── */}
        <aside className="nludo-sidebar">
          {/* Turn Card (Hidden on Mobile) */}
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

          {/* Dedicated Dice Card */}
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
              <p className="nludo-hint">Tap a highlighted token to move (or press 1–4)</p>
            )}
          </div>

          {/* Players Roster */}
          <div className="nludo-players-card">
            <h3 className="nludo-card-title">Players {isMulti ? `(${players.length}-Player)` : ''}</h3>
            <div className="nludo-player-list">
              {players.map((p, idx) => {
                const def = PLAYER_DEFS[p.id] || PLAYER_DEFS.red;
                const done = p.tokens.filter(t => t.progress === getMaxProgress(activePlayerCount)).length;
                const inBase = p.tokens.filter(t => t.progress === -1).length;
                const onTrack = p.tokens.filter(t => t.progress >= 0 && t.progress < homeStart).length;
                const inLane = p.tokens.filter(t => t.progress >= homeStart && t.progress < getMaxProgress(activePlayerCount)).length;
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

          {/* Live Game Event Log */}
          <div className="nludo-log-card">
            <h3 className="nludo-card-title">Live Match Log</h3>
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

          {/* Controls with Sound & Shortcuts */}
          <div className="nludo-controls-row">
            <button
              type="button"
              className={`nludo-ctrl-btn ${soundEnabled ? 'active' : ''}`}
              onClick={() => setSoundEnabled(prev => !prev)}
              title="Toggle Sound (M)"
            >
              {soundEnabled ? '🔊 Sound' : '🔇 Muted'}
            </button>
            <button type="button" className="nludo-ctrl-btn" onClick={() => setShowHelp(true)} title="Rules (H)">
              ❓ Rules
            </button>
            <button type="button" className="nludo-ctrl-btn" onClick={() => startGame(config)} title="Restart (R)">
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

