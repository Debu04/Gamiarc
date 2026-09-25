'use client';

import { useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { GAMES } from '../../lib/games';
import GameCard from '../../components/games/GameCard';

const CATEGORIES = [
  { id: 'all', label: 'All Games', icon: 'grid_view' },
  { id: 'action', label: 'Action', icon: 'sports_esports' },
  { id: 'strategy', label: 'Strategy', icon: 'psychology' },
  { id: 'board', label: 'Board Games', icon: 'table_chart' },
  { id: 'puzzle', label: 'Puzzle', icon: 'extension' },
  { id: 'rpg', label: 'RPG', icon: 'shield' },
  { id: 'sports', label: 'Sports', icon: 'directions_car' },
  { id: 'casual', label: 'Casual', icon: 'casino' },
];

export default function GamesLibraryContent() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams ? searchParams.get('search') || '' : '';

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeSort, setActiveSort] = useState('newest');

  // Filter and sort games
  const filteredGames = useMemo(() => {
    let list = GAMES.filter((game) => {
      const matchesCategory = activeCategory === 'all' || game.genre === activeCategory;
      const matchesSearch =
        searchQuery === '' ||
        game.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        game.category.toLowerCase().includes(searchQuery.toLowerCase().trim());
      return matchesCategory && matchesSearch;
    });

    if (activeSort === 'rating') {
      list = [...list].sort((a, b) => b.rating - a.rating);
    } else if (activeSort === 'popular') {
      list = [...list].sort((a, b) => (b.playersNumber || 0) - (a.playersNumber || 0));
    }

    return list;
  }, [activeCategory, searchQuery, activeSort]);

  return (
    <div className="pt-24 pb-20 px-4 sm:px-6 max-w-7xl mx-auto">
      {/* ===== HERO / INTRO ===== */}
      <section className="text-center pt-8 pb-10">
        <div className="inline-flex items-center gap-2 version-badge px-4 py-1.5 rounded-full mb-6">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#a855f7] opacity-60"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#a855f7]"></span>
          </span>
          <span className="text-[0.65rem] font-semibold tracking-[0.2em] text-[#c084fc] uppercase">
            In-Browser Gaming
          </span>
        </div>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-white mb-4">
          Browse the Full <br />
          <span className="hero-title-grad">Games Library</span>
        </h1>
        <p className="text-[#94a3b8] text-sm md:text-base max-w-xl mx-auto mb-8">
          Over 200 high-performance mini-games. Filter by category, sort by popularity, or search for your favourite
          title.
        </p>

        {/* Search Bar */}
        <div className="max-w-xl mx-auto relative mb-6">
          <svg
            className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#555]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search games by title, genre, keyword..."
            className="w-full bg-white/[0.04] border border-white/10 rounded-full py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-[#2563eb] transition-all placeholder:text-[#555]"
          />
        </div>

        {/* Mobile Horizontal Category Filter (scrollable) */}
        <div className="lg:hidden flex items-center gap-2 overflow-x-auto hide-scrollbar pb-2 pt-2">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                  isActive
                    ? 'filter-active text-white'
                    : 'bg-white/[0.03] border-white/10 text-[#64748b] hover:text-white'
                }`}
              >
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ===== CATALOGUE CONTENT ===== */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Sidebar (Desktop Only) */}
        <aside className="hidden lg:block w-64 flex-shrink-0 space-y-6">
          <div className="game-card rounded-2xl p-5">
            <p className="text-[#475569] text-[0.65rem] font-bold uppercase tracking-[0.2em] mb-3">Categories</p>
            <div className="space-y-1">
              {CATEGORIES.map((cat) => {
                const isActive = activeCategory === cat.id;
                const count =
                  cat.id === 'all'
                    ? GAMES.length
                    : GAMES.filter((g) => g.genre === cat.id).length;

                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? 'filter-active font-semibold'
                        : 'text-[#64748b] hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    <span>{cat.label}</span>
                    <span className="text-[0.65rem] opacity-60">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sort Controls */}
          <div className="game-card rounded-2xl p-5">
            <p className="text-[#475569] text-[0.65rem] font-bold uppercase tracking-[0.2em] mb-3">Sort By</p>
            <div className="space-y-1">
              <button
                onClick={() => setActiveSort('newest')}
                className={`sort-btn w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  activeSort === 'newest'
                    ? 'sort-active text-white'
                    : 'text-[#64748b] hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <span>Newest</span>
                {activeSort === 'newest' && (
                  <svg className="w-3.5 h-3.5 text-[#2563eb]" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
              <button
                onClick={() => setActiveSort('popular')}
                className={`sort-btn w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  activeSort === 'popular'
                    ? 'sort-active text-white'
                    : 'text-[#64748b] hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <span>Most Popular</span>
                {activeSort === 'popular' && (
                  <svg className="w-3.5 h-3.5 text-[#2563eb]" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
              <button
                onClick={() => setActiveSort('rating')}
                className={`sort-btn w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  activeSort === 'rating'
                    ? 'sort-active text-white'
                    : 'text-[#64748b] hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <span>Top Rated</span>
                {activeSort === 'rating' && (
                  <svg className="w-3.5 h-3.5 text-[#2563eb]" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Live Count Widget */}
          <div className="game-card rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22c55e] opacity-60"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#22c55e]"></span>
              </span>
              <p className="text-white text-xs font-semibold">Players Online</p>
            </div>
            <p className="text-2xl font-black text-white">12,842</p>
            <p className="text-[#475569] text-[0.65rem] mt-1">Real-time across Gamiarc</p>
          </div>
        </aside>

        {/* Main Grid Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[#475569] text-[0.65rem] font-bold uppercase tracking-[0.2em]">
              Showing Games <span className="text-white/60">({filteredGames.length})</span>
            </p>
          </div>

          {filteredGames.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
              {filteredGames.map((game) => (
                <GameCard key={game.id} game={game} variant="compact" />
              ))}
            </div>
          ) : (
            <div className="game-card rounded-2xl text-center py-20 px-6">
              <svg className="w-12 h-12 text-[#334155] mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-[#94a3b8] font-medium text-base mb-1">No games found</p>
              <p className="text-[#475569] text-xs">Try selecting a different filter or clearing your search term.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
