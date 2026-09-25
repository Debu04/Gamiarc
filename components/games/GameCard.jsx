'use client';

import Link from 'next/link';

export default function GameCard({ game, variant = 'standard' }) {
  // Only Neon Tic-Tac-Toe is currently published & playable
  const isAvailable = game.id === 'tic-tac-toe' && game.status === 'published';
  const playUrl = isAvailable ? game.route : '#';

  const accentColor = game.accentColor || '#3b82f6';

  if (variant === 'compact') {
    const viewsCount = game.views || (game.playersNumber ? `${(game.playersNumber / 1000).toFixed(1).replace('.0', '')}K` : null);

    return (
      <article
        className="game-card flex flex-col rounded-2xl overflow-hidden group"
        data-genre={game.genre}
        data-rating={game.rating}
        data-players={game.playersNumber}
      >
        <div className="aspect-video w-full overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d1220]/90 via-transparent to-transparent z-10"></div>
          <div
            className="absolute inset-0 z-10 group-hover:opacity-0 transition-opacity"
            style={{ backgroundColor: `${accentColor}1a` }}
          ></div>

          {game.badge && (
            <span
              className="absolute top-3 left-3 z-20 px-2 py-0.5 text-[0.6rem] font-bold uppercase rounded-md text-white shadow-sm"
              style={{ backgroundColor: accentColor }}
            >
              {game.badge}
            </span>
          )}

          {viewsCount && (
            <span className="absolute top-3 right-3 z-20 px-2 py-0.5 text-[0.6rem] font-semibold rounded-md bg-black/60 backdrop-blur-sm text-white/90 flex items-center gap-1 border border-white/10">
              <svg className="w-3 h-3 text-white/70" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path
                  fillRule="evenodd"
                  d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                  clipRule="evenodd"
                />
              </svg>
              {viewsCount}
            </span>
          )}

          <img
            src={game.thumbnail}
            alt={`${game.name} – Free browser game`}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          />
        </div>

        <div className="p-4 flex flex-col flex-grow">
          <span
            className="text-[0.65rem] font-bold tracking-[0.18em] uppercase mb-1"
            style={{ color: accentColor }}
          >
            {game.category}
          </span>
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-bold text-white truncate">{game.name}</h3>
            <div className="flex items-center gap-1 text-[#a855f7] flex-shrink-0">
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-xs font-bold">{game.rating}</span>
            </div>
          </div>
          <p className="text-[#64748b] text-xs mb-4 leading-relaxed line-clamp-1">
            {game.subgenre || game.description}
          </p>
          <div className="mt-auto">
            {isAvailable ? (
              <Link
                href={playUrl}
                className="btn-play block w-full py-2 text-center text-xs font-semibold rounded-xl transition-all"
                style={{
                  backgroundColor: `${accentColor}18`,
                  borderColor: `${accentColor}35`,
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  color: accentColor,
                }}
              >
                Play Free
              </Link>
            ) : (
              <button
                type="button"
                disabled
                className="block w-full py-2 text-center text-xs font-semibold rounded-xl bg-white/[0.03] border border-white/[0.06] text-[#64748b] cursor-not-allowed select-none transition-all"
              >
                Under Development
              </button>
            )}
          </div>
        </div>
      </article>
    );
  }

  // Standard Variant (matches homepage)
  return (
    <article className="game-card rounded-2xl overflow-hidden group">
      <div className="h-44 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d1220]/90 to-transparent z-10"></div>
        <div
          className="absolute inset-0 z-10 group-hover:opacity-0 transition-opacity"
          style={{ backgroundColor: `${accentColor}26` }}
        ></div>
        <img
          src={game.thumbnail}
          alt={`Play ${game.name} online free`}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
      </div>
      <div className="p-5">
        <span
          className="text-[0.6rem] font-bold tracking-[0.2em] uppercase"
          style={{ color: accentColor }}
        >
          {game.category}
        </span>
        <h3 className="text-base font-bold text-white mt-1 mb-1">{game.name}</h3>
        <p className="text-[#64748b] text-xs mb-4 leading-relaxed">{game.description}</p>
        {isAvailable ? (
          <Link
            href={playUrl}
            className="btn-play block w-full py-2.5 text-center text-xs font-semibold rounded-xl transition-all"
            style={{
              backgroundColor: `${accentColor}26`,
              borderColor: `${accentColor}40`,
              borderWidth: '1px',
              borderStyle: 'solid',
              color: accentColor,
            }}
          >
            Play Free
          </Link>
        ) : (
          <button
            type="button"
            disabled
            className="block w-full py-2.5 text-center text-xs font-semibold rounded-xl bg-white/[0.03] border border-white/[0.06] text-[#64748b] cursor-not-allowed select-none transition-all"
          >
            Under Development
          </button>
        )}
      </div>
    </article>
  );
}
