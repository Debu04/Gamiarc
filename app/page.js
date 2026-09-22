import Link from 'next/link';
import { GAMES } from '../lib/games';
import GameCard from '../components/games/GameCard';

export const metadata = {
  title: 'Gamiarc – Play Free Mini Games Online | Sudoku, Tic-Tac-Toe & More',
  description:
    'Gamiarc is your daily escape into premium browser mini-games. Play Sudoku, Tic-Tac-Toe, Minesweeper and hundreds more for free. No download required. Instant play.',
};

export default function HomePage() {
  // Get the 4 featured games shown on index.html: Zen Sudoku, Tic-Tac-Toe, Neon Ludo, Crystal Solitaire
  const featuredGames = [
    GAMES.find((g) => g.id === 'sudoku'),
    GAMES.find((g) => g.id === 'tic-tac-toe'),
    GAMES.find((g) => g.id === 'ludo'),
    GAMES.find((g) => g.id === 'solitaire'),
  ].filter(Boolean);

  return (
    <>
      {/* ========== HERO SECTION ========== */}
      <section className="relative pt-36 pb-12 px-6 text-center overflow-hidden">
        {/* Subtle glow orbs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-white/[0.03] rounded-full blur-[120px] pointer-events-none"></div>

        {/* Platform badge (glassmorphism + glow) */}
        <div className="inline-flex items-center gap-2.5 version-badge px-5 py-2 rounded-full mb-8">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#a855f7] opacity-60"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#a855f7]"></span>
          </span>
          <span className="text-[0.65rem] font-semibold tracking-[0.2em] text-[#c084fc] uppercase">
            New Platform Update V2.0
          </span>
        </div>

        {/* SEO Headline (H1) */}
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-black leading-[1.08] tracking-tight max-w-3xl mx-auto mb-6">
          Your Daily Escape into
          <br />
          <span className="hero-title-grad">Mini Worlds</span>
        </h1>

        <p className="text-[#94a3b8] text-base md:text-lg max-w-xl mx-auto mb-10 leading-relaxed">
          Experience premium glassmorphic gaming with neon aesthetics. Play the most addictive mini-games right from your
          browser.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <a
            href="#games"
            className="flex items-center gap-2 px-7 py-3.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold rounded-full transition-all shadow-[0_0_24px_rgba(37,99,235,0.35)] hover:shadow-[0_0_36px_rgba(37,99,235,0.55)]"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                clipRule="evenodd"
              />
            </svg>
            Play Now
          </a>
          <Link
            href="/games"
            className="px-7 py-3.5 bg-white/8 hover:bg-white/12 border border-white/15 text-white font-semibold rounded-full transition-all backdrop-blur-sm"
          >
            Explore All
          </Link>
        </div>
      </section>

      {/* ========== GAMES GRID ========== */}
      <section id="games" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Section header */}
          <div className="flex flex-col md:flex-row justify-between items-start mb-10 gap-4">
            <div>
              <p className="text-[#2563eb] text-xs font-semibold tracking-[0.2em] uppercase mb-2">Featured Games</p>
              <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">Popular Right Now</h2>
            </div>
            <Link
              href="/games"
              className="text-sm text-[#94a3b8] hover:text-white flex items-center gap-1.5 font-medium transition-colors group"
            >
              View All Games
              <svg
                className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {featuredGames.map((game) => (
              <GameCard key={game.id} game={game} variant="standard" />
            ))}
          </div>
        </div>
      </section>

      {/* ========== WHY GAMIARC SECTION (SEO text) ========== */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="game-card rounded-3xl p-10 md:p-16 text-center">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4 tracking-tight">
              Why Play on Gamiarc?
            </h2>
            <p className="text-[#94a3b8] max-w-2xl mx-auto text-base leading-relaxed mb-10">
              Gamiarc is the premier browser-based mini-game platform designed for instant, no-download fun.
              From classic Sudoku and Tic-Tac-Toe to next-gen AI-powered puzzles, every game is optimised for desktop and
              mobile — completely free, forever.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
              <div>
                <div className="w-10 h-10 rounded-xl bg-[#2563eb]/20 border border-[#2563eb]/30 flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-[#3b82f6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-white font-bold mb-2">Instant Play</h3>
                <p className="text-[#64748b] text-sm leading-relaxed">
                  No downloads, no accounts required. Click and play any game in under two seconds.
                </p>
              </div>
              <div>
                <div className="w-10 h-10 rounded-xl bg-[#818cf8]/20 border border-[#818cf8]/30 flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-[#818cf8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-white font-bold mb-2">Mobile Friendly</h3>
                <p className="text-[#64748b] text-sm leading-relaxed">
                  Every game is fully responsive and touch-optimised, perfect for phones and tablets.
                </p>
              </div>
              <div>
                <div className="w-10 h-10 rounded-xl bg-[#a855f7]/20 border border-[#a855f7]/30 flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-[#a855f7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-white font-bold mb-2">Always Free</h3>
                <p className="text-[#64748b] text-sm leading-relaxed">
                  200+ premium mini-games with zero paywalls. Earn daily rewards just for playing.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
