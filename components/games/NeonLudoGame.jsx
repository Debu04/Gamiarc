'use client';

import { useEffect, useRef, useState } from 'react';

const PLAYER_CONFIG = [
  { id: 'red', label: 'You', kind: 'Human', colorClass: 'piece-red', startIndex: 0, isBot: false },
  { id: 'blue', label: 'Bot 1', kind: 'Bot', colorClass: 'piece-blue', startIndex: 13, isBot: true },
  { id: 'green', label: 'Bot 2', kind: 'Bot', colorClass: 'piece-green', startIndex: 39, isBot: true },
  { id: 'yellow', label: 'Bot 3', kind: 'Bot', colorClass: 'piece-yellow', startIndex: 26, isBot: true },
];

const SAFE_CELLS = new Set([0, 8, 13, 21, 26, 34, 39, 47]);
const MAX_PROGRESS = 56;

function buildTrackCoords() {
  const coords = [];
  const min = 18;
  const max = 82;
  const step = (max - min) / 13;

  for (let index = 0; index <= 13; index += 1) coords.push({ x: min + step * index, y: min });
  for (let index = 1; index <= 13; index += 1) coords.push({ x: max, y: min + step * index });
  for (let index = 12; index >= 0; index -= 1) coords.push({ x: min + step * index, y: max });
  for (let index = 12; index >= 1; index -= 1) coords.push({ x: min, y: min + step * index });

  return coords;
}

function buildLaneCoords(fromX, fromY, toX, toY) {
  return Array.from({ length: 5 }, (_, index) => {
    const fraction = (index + 1) / 5;
    return {
      x: fromX + (toX - fromX) * fraction,
      y: fromY + (toY - fromY) * fraction,
    };
  });
}

const TRACK_COORDS = buildTrackCoords();
const HOME_COORDS = {
  red: buildLaneCoords(25, 25, 46, 46),
  blue: buildLaneCoords(75, 25, 54, 46),
  yellow: buildLaneCoords(75, 75, 54, 54),
  green: buildLaneCoords(25, 75, 46, 54),
};

export default function NeonLudoGame() {
  const [mode, setMode] = useState(null);
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [modeFeedback, setModeFeedback] = useState('Pick a mode to launch the board.');
  const [gameStarted, setGameStarted] = useState(false);
  const [turnLabel, setTurnLabel] = useState('Choose a mode');
  const [diceLabel, setDiceLabel] = useState('-');
  const [statusMessage, setStatusMessage] = useState('Open the launcher and start a bot match.');
  const [winnerBanner, setWinnerBanner] = useState('No winners yet');
  const [rollButtonDisabled, setRollButtonDisabled] = useState(true);
  const [logEntries, setLogEntries] = useState([]);
  const [playerStats, setPlayerStats] = useState({});
  const [activePlayerId, setActivePlayerId] = useState(null);

  const gameStateRef = useRef({
    mode: null,
    players: [],
    currentPlayerIndex: 0,
    diceValue: null,
    awaitingHumanMove: false,
    winner: null,
    gameStarted: false,
    logEntries: [],
    pendingTimeouts: [],
  });

  const domRefs = useRef({
    trackCells: new Map(),
    homeCells: new Map(),
    baseSlots: new Map(),
  });

  const boardTrackRef = useRef(null);
  const boardHomeLanesRef = useRef(null);
  const baseGridRefs = {
    red: useRef(null),
    blue: useRef(null),
    green: useRef(null),
    yellow: useRef(null),
  };

  const schedule = (callback, delay) => {
    const timeoutId = window.setTimeout(() => {
      gameStateRef.current.pendingTimeouts = gameStateRef.current.pendingTimeouts.filter((id) => id !== timeoutId);
      callback();
    }, delay);
    gameStateRef.current.pendingTimeouts.push(timeoutId);
  };

  const clearPendingTimeouts = () => {
    gameStateRef.current.pendingTimeouts.forEach((id) => clearTimeout(id));
    gameStateRef.current.pendingTimeouts = [];
  };

  const getCurrentPlayer = () => {
    const s = gameStateRef.current;
    return s.players[s.currentPlayerIndex] || null;
  };

  const addLog = (message) => {
    const s = gameStateRef.current;
    s.logEntries.unshift(message);
    s.logEntries = s.logEntries.slice(0, 10);
    setLogEntries([...s.logEntries]);
  };

  const setStatus = (msg) => {
    setStatusMessage(msg);
  };

  const getMovableTokenIndexes = (player, roll) => {
    return player.tokens.reduce((indexes, token, index) => {
      if (token.progress === MAX_PROGRESS) return indexes;
      if (token.progress === -1) {
        if (roll === 6) indexes.push(index);
        return indexes;
      }
      if (token.progress + roll <= MAX_PROGRESS) {
        indexes.push(index);
      }
      return indexes;
    }, []);
  };

  const getAbsolutePosition = (player, progress) => {
    return (player.startIndex + progress) % 52;
  };

  const getCapturableOpponents = (playerId, absolutePosition) => {
    const captured = [];
    gameStateRef.current.players.forEach((player) => {
      if (player.id === playerId) return;
      player.tokens.forEach((token) => {
        if (token.progress >= 0 && token.progress < 52) {
          const position = getAbsolutePosition(player, token.progress);
          if (position === absolutePosition) {
            captured.push(token);
          }
        }
      });
    });
    return captured;
  };

  const moveToken = (playerId, tokenIndex) => {
    const s = gameStateRef.current;
    const player = s.players.find((p) => p.id === playerId);
    if (!player || s.winner) return;

    const roll = s.diceValue;
    if (!roll) return;

    const movable = getMovableTokenIndexes(player, roll);
    if (!movable.includes(tokenIndex)) return;

    const token = player.tokens[tokenIndex];
    const prev = token.progress;
    token.progress = prev === -1 ? 0 : prev + roll;

    let capturedCount = 0;
    if (token.progress >= 0 && token.progress < 52) {
      const absPos = getAbsolutePosition(player, token.progress);
      if (!SAFE_CELLS.has(absPos)) {
        const captured = getCapturableOpponents(player.id, absPos);
        captured.forEach((opponentToken) => {
          opponentToken.progress = -1;
          capturedCount += 1;
        });
      }
    }

    const leftBase = prev === -1 && token.progress === 0;
    const reachedHome = token.progress === MAX_PROGRESS;

    let message = `${player.label} moved token ${tokenIndex + 1}`;
    if (leftBase) message += ' out of base';
    if (capturedCount > 0) message += ` and captured ${capturedCount} token${capturedCount > 1 ? 's' : ''}`;
    if (reachedHome) message += ' into home';
    message += '.';
    addLog(message);

    if (player.tokens.every((t) => t.progress === MAX_PROGRESS)) {
      s.winner = player.id;
      s.awaitingHumanMove = false;
      setStatus(`${player.label} wins the match.`);
      renderGame();
      return;
    }

    const extraTurn = roll === 6;
    s.awaitingHumanMove = false;
    renderGame();

    if (extraTurn) {
      setStatus(`${player.label} rolled a 6 and gets another turn.`);
      addLog(`${player.label} earned an extra turn.`);
      schedule(beginTurn, 1000);
      return;
    }

    schedule(nextTurn, 900);
  };

  const chooseBotMove = (player, roll, movableIndexes) => {
    let bestMove = movableIndexes[0];
    let bestScore = -Infinity;

    movableIndexes.forEach((tokenIndex) => {
      const token = player.tokens[tokenIndex];
      const targetProgress = token.progress === -1 ? 0 : token.progress + roll;
      let score = targetProgress;

      if (token.progress === -1) score += 18;
      if (targetProgress >= 52) score += 12;
      if (targetProgress === MAX_PROGRESS) score += 50;

      if (targetProgress < 52) {
        const absolutePosition = getAbsolutePosition(player, targetProgress);
        if (!SAFE_CELLS.has(absolutePosition)) {
          const captures = getCapturableOpponents(player.id, absolutePosition).length;
          score += captures * 30;
        } else {
          score += 6;
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestMove = tokenIndex;
      }
    });

    return bestMove;
  };

  const nextTurn = () => {
    const s = gameStateRef.current;
    s.currentPlayerIndex = (s.currentPlayerIndex + 1) % s.players.length;
    beginTurn();
  };

  const beginTurn = () => {
    const s = gameStateRef.current;
    if (!s.gameStarted || s.winner) {
      renderGame();
      return;
    }

    s.awaitingHumanMove = false;
    s.diceValue = null;
    const currentPlayer = getCurrentPlayer();
    if (!currentPlayer) return;

    if (currentPlayer.isBot) {
      setStatus(`${currentPlayer.label} is thinking...`);
      renderGame();
      schedule(rollCurrentPlayer, 800);
      return;
    }

    setStatus('Your turn. Roll the dice, then click one of the highlighted red tokens.');
    renderGame();
  };

  const rollCurrentPlayer = () => {
    const s = gameStateRef.current;
    const currentPlayer = getCurrentPlayer();
    if (!currentPlayer || s.winner) return;

    const roll = Math.floor(Math.random() * 6) + 1;
    s.diceValue = roll;

    const movableIndexes = getMovableTokenIndexes(currentPlayer, roll);
    addLog(`${currentPlayer.label} rolled a ${roll}.`);

    if (!movableIndexes.length) {
      setStatus(`${currentPlayer.label} rolled ${roll} but has no legal move.`);
      renderGame();
      schedule(nextTurn, 1000);
      return;
    }

    if (currentPlayer.isBot) {
      setStatus(`${currentPlayer.label} rolled ${roll}.`);
      renderGame();
      schedule(() => {
        const choice = chooseBotMove(currentPlayer, roll, movableIndexes);
        moveToken(currentPlayer.id, choice);
      }, 900);
      return;
    }

    s.awaitingHumanMove = true;
    setStatus(`You rolled ${roll}. Choose a highlighted red token to move.`);
    renderGame();
  };

  const renderGame = () => {
    const s = gameStateRef.current;
    const currentPlayer = getCurrentPlayer();

    // Update React states for UI
    setTurnLabel(
      s.winner
        ? `${PLAYER_CONFIG.find((p) => p.id === s.winner)?.label || s.winner} won`
        : currentPlayer
        ? currentPlayer.label
        : 'Waiting'
    );
    setDiceLabel(s.diceValue ? String(s.diceValue) : '-');
    setWinnerBanner(
      s.winner
        ? `${PLAYER_CONFIG.find((p) => p.id === s.winner)?.label || s.winner} finished first`
        : 'No winners yet'
    );
    setRollButtonDisabled(
      !s.gameStarted || !!s.winner || !currentPlayer || currentPlayer.isBot || s.awaitingHumanMove
    );
    setActivePlayerId(!s.winner && currentPlayer ? currentPlayer.id : null);

    // Compute stats
    const stats = {};
    s.players.forEach((p) => {
      stats[p.id] = {
        base: p.tokens.filter((t) => t.progress === -1).length,
        track: p.tokens.filter((t) => t.progress >= 0 && t.progress < 52).length,
        home: p.tokens.filter((t) => t.progress >= 52 && t.progress < MAX_PROGRESS).length,
        done: p.tokens.filter((t) => t.progress === MAX_PROGRESS).length,
      };
    });
    setPlayerStats(stats);

    // Render tokens in DOM
    renderTokens();
  };

  const renderTokens = () => {
    const s = gameStateRef.current;
    const refs = domRefs.current;

    // Clear existing pieces
    refs.trackCells.forEach((cell) => (cell.innerHTML = ''));
    refs.homeCells.forEach((cells) => cells.forEach((c) => (c.innerHTML = '')));
    refs.baseSlots.forEach((slots) => slots.forEach((slot) => (slot.innerHTML = '')));

    s.players.forEach((player) => {
      player.tokens.forEach((token, tokenIndex) => {
        if (token.progress === MAX_PROGRESS) return;

        const piece = document.createElement('button');
        piece.type = 'button';
        piece.className = `piece ${player.colorClass}`;

        const isCurrentHuman = !player.isBot && getCurrentPlayer()?.id === player.id && s.awaitingHumanMove;
        const isMovable = isCurrentHuman && getMovableTokenIndexes(player, s.diceValue || 0).includes(tokenIndex);

        if (isMovable) {
          piece.classList.add('movable');
          piece.onclick = () => moveToken(player.id, tokenIndex);
        } else {
          piece.disabled = true;
        }

        if (token.progress === -1) {
          const slot = refs.baseSlots.get(player.id)?.[tokenIndex];
          if (slot) slot.appendChild(piece);
          return;
        }

        if (token.progress >= 52) {
          const laneCell = refs.homeCells.get(player.id)?.[token.progress - 52];
          if (laneCell) laneCell.appendChild(piece);
          return;
        }

        const absPos = getAbsolutePosition(player, token.progress);
        const trackCell = refs.trackCells.get(absPos);
        if (trackCell) trackCell.appendChild(piece);
      });
    });
  };

  const startMatch = (chosenMode) => {
    clearPendingTimeouts();
    const s = gameStateRef.current;
    s.mode = chosenMode;
    s.players = PLAYER_CONFIG.map((p) => ({
      ...p,
      tokens: Array.from({ length: 4 }, (_, idx) => ({
        id: `${p.id}-${idx}`,
        progress: -1,
      })),
    }));
    s.currentPlayerIndex = 0;
    s.diceValue = null;
    s.awaitingHumanMove = false;
    s.winner = null;
    s.gameStarted = true;
    s.logEntries = [];

    setMode(chosenMode);
    setGameStarted(true);
    setShowModeSelector(false);
    addLog('Bot match started. You play as red and take the first turn.');
    setStatus('Your turn. Roll the dice to start the match.');
    renderGame();
    beginTurn();
  };

  // Build the board track and home cells once on client mount
  useEffect(() => {
    const refs = domRefs.current;
    if (!boardTrackRef.current || !boardHomeLanesRef.current) return;

    // Track
    boardTrackRef.current.innerHTML = '';
    TRACK_COORDS.forEach((coord, index) => {
      const cell = document.createElement('div');
      const classes = ['track-cell'];
      if (SAFE_CELLS.has(index)) classes.push('safe-cell');
      const safePlayer = PLAYER_CONFIG.find((p) => p.startIndex === index)?.id;
      if (safePlayer) classes.push(`safe-${safePlayer}`);
      cell.className = classes.join(' ');
      cell.style.left = `${coord.x}%`;
      cell.style.top = `${coord.y}%`;
      cell.dataset.trackIndex = String(index);
      boardTrackRef.current.appendChild(cell);
      refs.trackCells.set(index, cell);
    });

    // Home lanes
    boardHomeLanesRef.current.innerHTML = '';
    PLAYER_CONFIG.forEach((p) => {
      const laneCells = [];
      HOME_COORDS[p.id].forEach((coord) => {
        const cell = document.createElement('div');
        cell.className = `home-cell home-${p.id}`;
        cell.style.left = `${coord.x}%`;
        cell.style.top = `${coord.y}%`;
        boardHomeLanesRef.current.appendChild(cell);
        laneCells.push(cell);
      });
      refs.homeCells.set(p.id, laneCells);

      // Base slots
      const baseGrid = baseGridRefs[p.id].current;
      if (baseGrid) {
        baseGrid.innerHTML = '';
        const slots = [];
        for (let i = 0; i < 4; i++) {
          const slot = document.createElement('div');
          slot.className = 'base-slot';
          baseGrid.appendChild(slot);
          slots.push(slot);
        }
        refs.baseSlots.set(p.id, slots);
      }
    });

    return () => {
      clearPendingTimeouts();
    };
  }, []);

  return (
    <div className="game-shell glass-card" id="game-shell">
      {/* Mode Overlay */}
      {(!gameStarted || showModeSelector) && (
        <div className="mode-overlay visible" aria-live="polite">
          <div className="mode-card">
            <p className="mode-kicker">Play Setup</p>
            <h3>Choose how you want to play</h3>
            <p className="mode-copy">
              Single-player bot matches are ready now. Multiplayer stays visible so the flow is in place, but it is
              not implemented yet.
            </p>
            <div className="mode-options">
              <button
                className="mode-option primary"
                onClick={() => startMatch('bot')}
                type="button"
              >
                <span className="mode-title">With Bot</span>
                <span className="mode-meta">You vs 3 bots</span>
              </button>
              <button
                className="mode-option"
                onClick={() =>
                  setModeFeedback('Multiplayer is not implemented yet. Use "With Bot" to start the playable mode.')
                }
                type="button"
              >
                <span className="mode-title">Multiplayer</span>
                <span className="mode-meta">Coming soon</span>
              </button>
            </div>
            <p className="mode-feedback">{modeFeedback}</p>
          </div>
        </div>
      )}

      <div className={`game-layout ${!gameStarted ? 'filter blur-md opacity-30 pointer-events-none' : ''}`}>
        <div className="board-panel">
          <div className="board-frame" id="board-frame">
            <div className="base-zone base-red" id="base-red">
              <div className="base-zone-title">You</div>
              <div className="base-grid" ref={baseGridRefs.red}></div>
            </div>
            <div className="base-zone base-blue" id="base-blue">
              <div className="base-zone-title">Bot 1</div>
              <div className="base-grid" ref={baseGridRefs.blue}></div>
            </div>
            <div className="base-zone base-green" id="base-green">
              <div className="base-zone-title">Bot 2</div>
              <div className="base-grid" ref={baseGridRefs.green}></div>
            </div>
            <div className="base-zone base-yellow" id="base-yellow">
              <div className="base-zone-title">Bot 3</div>
              <div className="base-grid" ref={baseGridRefs.yellow}></div>
            </div>

            <div className="board-track" ref={boardTrackRef} id="board-track"></div>
            <div className="board-home-lanes" ref={boardHomeLanesRef} id="board-home-lanes"></div>

            <div className="board-center-core">
              <div className="center-badge">NEXUS</div>
              <div className="center-subtext">First color to bring all 4 tokens home wins.</div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="game-sidebar">
          <div className="status-card">
            <div className="status-row">
              <span className="status-label">Mode</span>
              <span className="status-value">{mode === 'bot' ? 'With Bot' : 'Waiting'}</span>
            </div>
            <div className="status-row">
              <span className="status-label">Turn</span>
              <span className="status-value">{turnLabel}</span>
            </div>
            <div className="status-row">
              <span className="status-label">Dice</span>
              <span className="status-value dice-readout">{diceLabel}</span>
            </div>
            <div className="status-message">{statusMessage}</div>
            <button
              className="roll-button"
              onClick={rollCurrentPlayer}
              disabled={rollButtonDisabled}
              type="button"
            >
              Roll Dice
            </button>
          </div>

          {/* Players Card */}
          <div className="players-card">
            <div className="players-card-header">
              <h3>Players</h3>
              <span>{winnerBanner}</span>
            </div>
            <div className="player-list">
              {PLAYER_CONFIG.map((p) => {
                const stats = playerStats[p.id] || { base: 4, track: 0, home: 0, done: 0 };
                const isActive = activePlayerId === p.id;
                return (
                  <div key={p.id} className={`player-card ${isActive ? 'active-player' : ''}`}>
                    <div className="player-name-row">
                      <span className={`player-chip ${p.colorClass}`}></span>
                      <span className="player-name">{p.label}</span>
                      <span className="player-kind">{p.kind}</span>
                    </div>
                    <div className="progress-row">
                      <div className="progress-pill">
                        <span className="player-meta">Base</span>
                        <strong>{stats.base}</strong>
                      </div>
                      <div className="progress-pill">
                        <span className="player-meta">Track</span>
                        <strong>{stats.track}</strong>
                      </div>
                      <div className="progress-pill">
                        <span className="player-meta">Home</span>
                        <strong>{stats.home}</strong>
                      </div>
                      <div className="progress-pill">
                        <span className="player-meta">Done</span>
                        <strong>{stats.done}</strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Match Log Card */}
          <div className="log-card">
            <div className="players-card-header">
              <h3>Match Log</h3>
              <span>Latest turns</span>
            </div>
            <div className="match-log">
              {logEntries.length > 0 ? (
                logEntries.map((entry, idx) => (
                  <div key={idx} className="log-entry">
                    {entry}
                  </div>
                ))
              ) : (
                <div className="log-entry">Match events will appear here after you start a game.</div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
