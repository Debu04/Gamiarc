import Link from 'next/link';
import './tictactoe.css';
import TicTacToeGame from '../../../components/games/TicTacToeGame';
import GameErrorBoundary from '../../../components/games/GameErrorBoundary';

export const metadata = {
  title: 'Neon Tic-Tac-Toe – Classic Strategy Reimagined | Gamiarc',
  description:
    'Play Neon Tic-Tac-Toe on Gamiarc. The classic strategy game reimagined with stunning neon aesthetics. Challenge the AI or play with a friend, no download required.',
  keywords: 'neon tic-tac-toe, tic tac toe online, free tic tac toe, strategy game, multiplayer tic tac toe',
  openGraph: {
    title: 'Neon Tic-Tac-Toe – Classic Strategy Reimagined',
    description: 'Experience the classic strategy game with stunning neon visuals. Play free on Gamiarc.',
  },
};

export default function TicTacToePage() {
  return (
    <div className="pb-20-mobile">
      {/* ===== HERO ===== */}
      <section className="hero" id="hero">
        <div className="orb hero-orb-1"></div>
        <div className="orb hero-orb-2"></div>
        <div className="container">
          {/* Breadcrumb */}
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
            <Link href="/games">Games</Link>
            <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
            <span>Neon Tic-Tac-Toe</span>
          </nav>

          <div className="hero-content">
            <div className="hero-text">
              <div className="hero-badge">
                <span className="hero-badge-dot"></span>
                Strategy · Puzzle
              </div>
              <h1 className="hero-title">
                <span className="grad-text">NEON</span>
                <br />
                TIC-TAC-TOE
              </h1>
              <p className="hero-subtitle">
                Classic Strategy Game Reimagined in Neon. Outsmart the AI or challenge a friend — three in a row wins
                the neon crown.
              </p>
              <div className="hero-cta">
                <a href="#arena" className="btn-primary" id="play-now-btn">
                  <svg width="18" height="18" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Play Now — Free
                </a>
                <a href="#about" className="btn-outline" id="about-btn">
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Learn More
                </a>
              </div>
            </div>

            {/* Neon Tic-Tac-Toe Preview Board */}
            <div className="hero-board-wrap" aria-hidden="true">
              <div className="ttt-preview-board">
                <div className="preview-cell x-mark">✕</div>
                <div className="preview-cell o-mark">○</div>
                <div className="preview-cell x-mark">✕</div>
                <div className="preview-cell o-mark">○</div>
                <div className="preview-cell x-mark">✕</div>
                <div className="preview-cell"></div>
                <div className="preview-cell o-mark">○</div>
                <div className="preview-cell"></div>
                <div className="preview-cell x-mark">✕</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== INFO STRIP ===== */}
      <div className="info-strip">
        <div className="container">
          <div className="info-strip-inner">
            <div className="stat-pill">
              <div className="stat-pill-icon" style={{ background: 'rgba(234,179,8,0.12)' }}>
                <svg fill="currentColor" viewBox="0 0 20 20" style={{ color: '#eab308' }}>
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <div>
                <div className="stat-pill-label">Rating</div>
                <div className="stat-pill-value">4.9 / 5.0</div>
              </div>
            </div>
            <div className="divider-vertical"></div>
            <div className="stat-pill">
              <div className="stat-pill-icon" style={{ background: 'rgba(34,197,94,0.12)' }}>
                <svg fill="none" stroke="#22c55e" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="4" />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
                  />
                </svg>
              </div>
              <div>
                <div className="stat-pill-label">Players Online</div>
                <div className="stat-pill-value">9,400</div>
              </div>
            </div>
            <div className="divider-vertical"></div>
            <div className="stat-pill">
              <div className="stat-pill-icon" style={{ background: 'rgba(59,130,246,0.12)' }}>
                <svg fill="none" stroke="#3b82f6" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z"
                  />
                </svg>
              </div>
              <div>
                <div className="stat-pill-label">Category</div>
                <div className="stat-pill-value">Strategy</div>
              </div>
            </div>
            <div className="divider-vertical"></div>
            <div className="stat-pill">
              <div className="stat-pill-icon" style={{ background: 'rgba(168,85,247,0.12)' }}>
                <svg fill="none" stroke="#a855f7" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <div className="stat-pill-label">Play Time</div>
                <div className="stat-pill-value">1–3 min</div>
              </div>
            </div>
            <div className="divider-vertical"></div>
            <div className="stat-pill">
              <div className="stat-pill-icon" style={{ background: 'rgba(236,72,153,0.12)' }}>
                <svg fill="none" stroke="#ec4899" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <div>
                <div className="stat-pill-label">Players</div>
                <div className="stat-pill-value">1 – 2</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== GAME ARENA ===== */}
      <section className="game-arena-section" id="arena">
        <div className="container">
          <div className="arena-header">
            <div>
              <p className="section-label" style={{ color: '#06b6d4' }}>
                Playable Match
              </p>
              <h2 className="section-title">
                Start a <span className="grad-text">Live Game</span>
              </h2>
              <p className="section-desc">
                Place your marks, outsmart your opponent, and line up three to claim victory. Play against the AI or
                challenge a friend locally.
              </p>
            </div>
          </div>

          {/* Interactive Game Engine wrapped in Error Boundary */}
          <GameErrorBoundary>
            <TicTacToeGame />
          </GameErrorBoundary>
        </div>
      </section>

      {/* ===== ABOUT & RULES SECTION ===== */}
      <section className="about-section" id="about">
        <div className="container">
          <div className="about-grid">
            <div>
              <p className="section-label" style={{ color: '#a855f7' }}>
                Tactical Manual
              </p>
              <h2 className="section-title">
                How to Play <span className="grad-text-purple">Neon Tic-Tac-Toe</span>
              </h2>
              <p className="section-desc">
                The objective is simple: be the first player to line up three of your marks horizontally, vertically, or
                diagonally on the 3x3 grid.
              </p>
              <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="game-card p-4 rounded-xl">
                  <h3 className="font-bold text-white text-sm mb-1">Single Player vs Bot</h3>
                  <p className="text-xs text-[#64748b]">
                    Test your logic against our algorithmic bot. Toggle between Easy, Medium, and Hard difficulty in the
                    side panel.
                  </p>
                </div>
                <div className="game-card p-4 rounded-xl">
                  <h3 className="font-bold text-white text-sm mb-1">Local Pass & Play</h3>
                  <p className="text-xs text-[#64748b]">
                    Share the screen or touch device with a friend. Take turns placing marks and tracking wins round by
                    round.
                  </p>
                </div>
              </div>
            </div>

            {/* Game Specs */}
            <div className="game-card p-6 rounded-2xl">
              <h3 className="text-base font-bold text-white mb-4">Game Specifications</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px' }}>
                  <span className="text-[#64748b]">Engine</span>
                  <span className="text-white font-semibold">React Native State Loop</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px' }}>
                  <span className="text-[#64748b]">Offline Play</span>
                  <span className="text-white font-semibold">Supported (100% Browser)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px' }}>
                  <span className="text-[#64748b]">Storage</span>
                  <span className="text-white font-semibold">Local Storage Namespaced</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="text-[#64748b]">Version</span>
                  <span className="text-white font-semibold">2.0.0</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
