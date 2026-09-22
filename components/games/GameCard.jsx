'use client';

import Link from 'next/link';

export default function GameCard({ game, variant = 'standard' }) {
  const isAvailable = game.status === 'published';
  const playUrl = isAvailable ? game.route : '#';

  const handlePlayClick = (e) => {
    if (!isAvailable) {
      e.preventDefault();
      alert(`Launching ${game.name}... (Coming Soon)`);
    }
  };

  const accentColor = game.accentColor || '#3b82f6';

  if (variant === 'compact') {
    // Games Library Grid Card Variant (matches pages/games.html)
    return (
      <article
        className="game-card flex flex-col gap-2 rounded-2xl overflow-hidden group p-2.5 sm:p-0"
        data-genre={game.genre}
        data-rating={game.rating}
        data-players={game.playersNumber}
      >
        <div className="aspect-[4/3] sm:aspect-video sm:h-44 overflow-hidden relative rounded-xl sm:rounded-b-none sm:rounded-t-2xl">
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d1220]/90 via-transparent to-transparent z-10"></div>
          <div
            className="absolute inset-0 z-10 group-hover:opacity-0 transition-opacity"
            style={{ backgroundColor: `${accentColor}1a` }}
          ></div>

          {game.badge && (
            <span
              className="absolute top-2 left-2 sm:top-3 sm:left-3 z-20 px-1.5 py-0.5 sm:px-2 sm:py-1 text-[0.55rem] sm:text-[0.6rem] font-bold uppercase rounded-md sm:rounded-lg text-white"
              style={{ backgroundColor: accentColor }}
            >
              {game.badge}
            </span>
          )}

          <div className="absolute bottom-2 left-2 z-20 flex items-center gap-1 bg-black/40 backdrop-blur-sm px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-[0.6rem] sm:text-xs text-yellow-400 font-bold sm:hidden">
            <svg className="w-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>{' '}
            {game.rating}
          </div>

          <img
            src={game.thumbnail}
            alt={`${game.name} – Free browser game`}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          />
        </div>

        <div className="px-1 sm:p-5 flex flex-col flex-grow">
          <span
            className="hidden sm:block text-[0.6rem] font-bold tracking-[0.2em] uppercase"
            style={{ color: accentColor }}
          >
            {game.category}
          </span>
          <div className="flex items-start justify-between sm:mt-1 sm:mb-1">
            <h3 className="text-sm sm:text-base font-bold text-white truncate">{game.name}</h3>
            <div className="hidden sm:flex items-center gap-1 text-[#a855f7]">
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-xs font-bold">{game.rating}</span>
            </div>
          </div>
          <p className="text-[#64748b] text-[0.65rem] sm:text-xs mb-0 sm:mb-4 leading-relaxed line-clamp-1 sm:line-clamp-2">
            {game.subgenre || game.description}
          </p>
          <div className="mt-auto hidden sm:block">
            <Link
              href={playUrl}
              onClick={handlePlayClick}
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
          </div>
        </div>
      </article>
    );
  }

  // Standard Variant (matches index.html)
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
        <Link
          href={playUrl}
          onClick={handlePlayClick}
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
      </div>
    </article>
  );
}
