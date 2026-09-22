'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { loadGameData, saveGameData } from '../../lib/storage';

const HUMAN = 'X';
const BOT = 'O';

const WIN_COMBOS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
  [0, 4, 8], [2, 4, 6],            // diagonals
];

export default function TicTacToeGame() {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState(HUMAN);
  const [mode, setMode] = useState(null); // 'bot' | 'local'
  const [difficulty, setDifficulty] = useState('medium'); // 'easy' | 'medium' | 'hard'
  const [gameActive, setGameActive] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [winner, setWinner] = useState(null);
  const [winCombo, setWinCombo] = useState(null);
  const [scores, setScores] = useState({ X: 0, O: 0, draw: 0 });
  const [logEntries, setLogEntries] = useState([]);
  const [statusMessage, setStatusMessage] = useState('Pick a mode to start playing.');
  const [showModeSelector, setShowModeSelector] = useState(false);

  const botTimeoutRef = useRef(null);

  // Load saved scores on client mount
  useEffect(() => {
    const saved = loadGameData('tic_tac_toe', 'scores', { X: 0, O: 0, draw: 0 });
    if (saved) setScores(saved);
  }, []);

  // Save scores whenever they change and match has started
  useEffect(() => {
    if (gameStarted) {
      saveGameData('tic_tac_toe', 'scores', scores);
    }
  }, [scores, gameStarted]);

  // Clean up bot timeout on unmount
  useEffect(() => {
    return () => {
      if (botTimeoutRef.current) clearTimeout(botTimeoutRef.current);
    };
  }, []);

  const addLog = useCallback((message) => {
    setLogEntries((prev) => [message, ...prev].slice(0, 15));
  }, []);

  const getPlayerLabel = useCallback(
    (player) => {
      if (mode === 'bot') {
        return player === 'X' ? 'You (✕)' : 'Bot (○)';
      }
      return player === 'X' ? 'Player ✕' : 'Player ○';
    },
    [mode]
  );

  const checkWin = (b, player) => {
    for (const combo of WIN_COMBOS) {
      if (combo.every((i) => b[i] === player)) {
        return combo;
      }
    }
    return null;
  };

  const startMatch = (chosenMode) => {
    if (botTimeoutRef.current) clearTimeout(botTimeoutRef.current);
    setMode(chosenMode);
    setScores({ X: 0, O: 0, draw: 0 });
    setLogEntries([]);
    setGameStarted(true);
    setShowModeSelector(false);
    addLog(`${chosenMode === 'bot' ? 'Bot match' : 'Local match'} started. Good luck!`);
    startNewRound(chosenMode);
  };

  const startNewRound = (activeMode = mode) => {
    if (botTimeoutRef.current) clearTimeout(botTimeoutRef.current);
    setBoard(Array(9).fill(null));
    setCurrentPlayer(HUMAN);
    setGameActive(true);
    setWinner(null);
    setWinCombo(null);
    setStatusMessage(
      activeMode === 'bot'
        ? 'Your turn. Place your mark (✕) on the board.'
        : "Player X's turn. Click a cell to place your mark."
    );
  };

  const minimax = (b, depth, isMaximizing, alpha, beta) => {
    const botWin = checkWin(b, BOT);
    const humanWin = checkWin(b, HUMAN);

    if (botWin) return 10 - depth;
    if (humanWin) return depth - 10;
    if (b.every((cell) => cell !== null)) return 0;

    if (isMaximizing) {
      let maxEval = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (b[i] !== null) continue;
        b[i] = BOT;
        const evalScore = minimax(b, depth + 1, false, alpha, beta);
        b[i] = null;
        maxEval = Math.max(maxEval, evalScore);
        alpha = Math.max(alpha, evalScore);
        if (beta <= alpha) break;
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (let i = 0; i < 9; i++) {
        if (b[i] !== null) continue;
        b[i] = HUMAN;
        const evalScore = minimax(b, depth + 1, true, alpha, beta);
        b[i] = null;
        minEval = Math.min(minEval, evalScore);
        beta = Math.min(beta, evalScore);
        if (beta <= alpha) break;
      }
      return minEval;
    }
  };

  const getBotMoveHard = (b) => {
    let bestScore = -Infinity;
    let bestMove = null;
    const temp = [...b];

    for (let i = 0; i < 9; i++) {
      if (temp[i] !== null) continue;
      temp[i] = BOT;
      const score = minimax(temp, 0, false, -Infinity, Infinity);
      temp[i] = null;
      if (score > bestScore) {
        bestScore = score;
        bestMove = i;
      }
    }
    return bestMove;
  };

  const getBotMove = (b) => {
    const empty = b.reduce((acc, v, i) => (v === null ? [...acc, i] : acc), []);
    if (difficulty === 'easy') {
      return empty[Math.floor(Math.random() * empty.length)];
    }
    if (difficulty === 'medium') {
      if (Math.random() < 0.6) {
        return getBotMoveHard(b);
      }
      return empty[Math.floor(Math.random() * empty.length)];
    }
    return getBotMoveHard(b);
  };

  const placeMove = (index, mark, currentBoard) => {
    const nextBoard = [...currentBoard];
    nextBoard[index] = mark;
    setBoard(nextBoard);

    // Check Win
    const winningCombo = checkWin(nextBoard, mark);
    if (winningCombo) {
      setWinner(mark);
      setWinCombo(winningCombo);
      setGameActive(false);
      setScores((prev) => ({ ...prev, [mark]: prev[mark] + 1 }));
      const label = getPlayerLabel(mark);
      addLog(`${label} wins! 🎉`);
      setStatusMessage(`${label} wins the round!`);
      return;
    }

    // Check Draw
    if (nextBoard.every((c) => c !== null)) {
      setWinner('draw');
      setGameActive(false);
      setScores((prev) => ({ ...prev, draw: prev.draw + 1 }));
      addLog("It's a draw!");
      setStatusMessage("It's a draw! No one wins this round.");
      return;
    }

    // Switch Player
    const nextPlayer = mark === HUMAN ? BOT : HUMAN;
    setCurrentPlayer(nextPlayer);
    setStatusMessage(`${getPlayerLabel(nextPlayer)}'s turn.`);

    // Trigger Bot Move if applicable
    if (mode === 'bot' && nextPlayer === BOT) {
      setStatusMessage('Bot is thinking...');
      botTimeoutRef.current = setTimeout(() => {
        const botIndex = getBotMove(nextBoard);
        if (botIndex !== null && botIndex !== undefined) {
          placeMove(botIndex, BOT, nextBoard);
        }
      }, 550);
    }
  };

  const handleCellClick = (index) => {
    if (!gameActive || board[index] !== null) return;
    if (mode === 'bot' && currentPlayer !== HUMAN) return;
    placeMove(index, currentPlayer, board);
  };

  const totalRounds = scores.X + scores.O + scores.draw;

  // Win line coordinate helper for SVG
  const getCellCenter = (index) => {
    const col = index % 3;
    const row = Math.floor(index / 3);
    return {
      x: col * 33.33 + 16.67,
      y: row * 33.33 + 16.67,
    };
  };

  return (
    <div className="game-shell glass-card" id="game-shell">
      {/* Mode Selector Overlay */}
      {(!gameStarted || showModeSelector) && (
        <div className="mode-overlay visible" aria-live="polite">
          <div className="mode-card">
            <p className="mode-kicker">Play Setup</p>
            <h3>Choose how you want to play</h3>
            <p className="mode-copy">
              Challenge the AI in a single-player battle or pass-and-play with a friend on the same device.
            </p>
            <div className="mode-options">
              <button
                className="mode-option primary"
                onClick={() => startMatch('bot')}
                type="button"
              >
                <span className="mode-title">vs Bot</span>
                <span className="mode-meta">You (✕) vs AI (○)</span>
              </button>
              <button
                className="mode-option"
                onClick={() => startMatch('local')}
                type="button"
              >
                <span className="mode-title">Local 2 Player</span>
                <span className="mode-meta">Pass & play on one device</span>
              </button>
            </div>
            <p className="mode-feedback">Pick a mode to launch the board.</p>
          </div>
        </div>
      )}

      {/* Main Game Arena Layout */}
      <div className={`game-layout ${!gameStarted ? 'filter blur-md opacity-30 pointer-events-none' : ''}`}>
        <div className="board-panel">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', width: '100%' }}>
            {/* Score Display */}
            <div className="score-display">
              <div className="score-card x-score">
                <span className="score-mark">✕</span>
                <div className="score-info">
                  <span className="score-label">Player X</span>
                  <span className="score-value">{scores.X}</span>
                </div>
              </div>
              <div className="score-card draw-score">
                <span className="score-mark">=</span>
                <div className="score-info">
                  <span className="score-label">Draws</span>
                  <span className="score-value">{scores.draw}</span>
                </div>
              </div>
              <div className="score-card o-score">
                <span className="score-mark">○</span>
                <div className="score-info">
                  <span className="score-label">Player O</span>
                  <span className="score-value">{scores.O}</span>
                </div>
              </div>
            </div>

            {/* Game Board */}
            <div className="ttt-board-container">
              <div className="ttt-board" id="ttt-board">
                {board.map((cell, index) => {
                  const isWinCell = winCombo && winCombo.includes(index);
                  const cellClass = [
                    'ttt-cell',
                    cell === 'X' ? 'x-cell taken' : '',
                    cell === 'O' ? 'o-cell taken' : '',
                    isWinCell ? 'win-cell' : '',
                    !gameActive && cell === null ? 'disabled' : '',
                  ]
                    .filter(Boolean)
                    .join(' ');

                  return (
                    <button
                      key={index}
                      type="button"
                      className={cellClass}
                      onClick={() => handleCellClick(index)}
                      disabled={!gameActive || cell !== null}
                    >
                      {cell === 'X' ? '✕' : cell === 'O' ? '○' : ''}
                    </button>
                  );
                })}
              </div>

              {/* Win Line SVG Overlay */}
              {winCombo && (
                <svg className="win-line-overlay" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <line
                    x1={getCellCenter(winCombo[0]).x}
                    y1={getCellCenter(winCombo[0]).y}
                    x2={getCellCenter(winCombo[2]).x}
                    y2={getCellCenter(winCombo[2]).y}
                    stroke="#06b6d4"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                </svg>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Controls & Status */}
        <aside className="game-sidebar">
          <div className="status-card">
            <div className="status-row">
              <span className="status-label">Mode</span>
              <span className="status-value">{mode === 'bot' ? 'vs Bot' : mode === 'local' ? 'Local 2P' : 'Waiting'}</span>
            </div>
            <div className="status-row">
              <span className="status-label">Turn</span>
              <span className="status-value">
                {winner === 'draw' ? (
                  'Draw'
                ) : winner ? (
                  `${getPlayerLabel(winner)} Won`
                ) : gameActive ? (
                  <span className="turn-indicator">
                    <span className={`turn-mark ${currentPlayer === 'X' ? 'x-turn' : 'o-turn'}`}>
                      {currentPlayer === 'X' ? '✕' : '○'}
                    </span>
                    <span> {getPlayerLabel(currentPlayer)}</span>
                  </span>
                ) : (
                  'Waiting'
                )}
              </span>
            </div>
            <div className="status-row">
              <span className="status-label">Round</span>
              <span className="status-value">{totalRounds > 0 ? `Round ${totalRounds}` : '-'}</span>
            </div>

            {mode === 'bot' && (
              <div className="status-row" style={{ marginTop: '8px' }}>
                <span className="status-label">AI Level</span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {['easy', 'medium', 'hard'].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setDifficulty(lvl)}
                      className={`difficulty-btn ${difficulty === lvl ? 'active' : ''}`}
                      style={{
                        padding: '3px 8px',
                        fontSize: '0.65rem',
                        borderRadius: '6px',
                        textTransform: 'uppercase',
                        fontWeight: '700',
                        background: difficulty === lvl ? '#2563eb' : 'rgba(255,255,255,0.05)',
                        color: difficulty === lvl ? '#fff' : '#64748b',
                      }}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="status-alert">{statusMessage}</div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
              <button
                type="button"
                className="btn-new-game"
                onClick={() => startNewRound()}
                disabled={!mode}
                style={{ flex: 1 }}
              >
                New Round
              </button>
              <button
                type="button"
                className="btn-outline"
                onClick={() => setShowModeSelector(true)}
                style={{ fontSize: '0.75rem', padding: '8px 12px' }}
              >
                Switch Mode
              </button>
            </div>
          </div>

          {/* Match Log Card */}
          <div className="match-log-card">
            <div className="match-log-header">
              <span className="match-log-title">Match Log</span>
              <span className="log-badge">{logEntries.length} Events</span>
            </div>
            <div className="match-log-list" id="match-log">
              {logEntries.length > 0 ? (
                logEntries.map((log, i) => (
                  <div key={i} className="log-entry">
                    {log}
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
