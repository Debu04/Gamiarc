'use client';

import { useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { GAMES } from '../../lib/games';
import GameCard from '../../components/games/GameCard';

const CATEGORIES = [
  {
    id: 'all',
    label: 'All Games',
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    id: 'action',
    label: 'Action',
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  {
    id: 'puzzle',
    label: 'Puzzle',
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10 2a3 3 0 00-3 3 1 1 0 01-1 1H4a2 2 0 00-2 2v2a1 1 0 001 1 3 3 0 110 6 1 1 0 00-1 1v2a2 2 0 002 2h2a1 1 0 011 1 3 3 0 106 0 1 1 0 011-1h2a2 2 0 002-2v-2a1 1 0 00-1-1 3 3 0 110-6 1 1 0 001-1V8a2 2 0 00-2-2h-2a1 1 0 01-1-1 3 3 0 00-3-3z" />
      </svg>
    ),
  },
  {
    id: 'strategy',
    label: 'Strategy',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v3m0 12v3M3 12h3m12 0h3m-6-3l-3 3 3 3" />
      </svg>
    ),
  },
  {
    id: 'rpg',
    label: 'RPG',
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
      </svg>
    ),
  },
  {
    id: 'sports',
    label: 'Sports',
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  {
    id: 'board',
    label: 'Board Games',
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
      </svg>
    ),
  },
  {
    id: 'casual',
    label: 'Casual',
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" />
      </svg>
    ),
  },
];

const SORT_OPTIONS = [
  { id: 'newest', label: 'Newest' },
  { id: 'popular', label: 'Most Popular' },
  { id: 'rating', label: 'Top Rated' },
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
    <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto">
      {/* ===== HERO / INTRO ===== */}
      <section className="text-center pt-6 pb-10">
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

      {/* ===== SIDE BY SIDE DESKTOP LAYOUT ===== */}
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 items-start">
        {/* Left Sidebar (Desktop Only) */}
        <aside className="hidden lg:block w-56 lg:w-60 flex-shrink-0 space-y-7">
          {/* Categories */}
          <div>
            <p className="text-[#64748b] text-[0.7rem] font-bold uppercase tracking-[0.18em] mb-3">Category</p>
            <div className="space-y-1">
              {CATEGORIES.map((cat) => {
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`sidebar-category-btn ${isActive ? 'active' : ''}`}
                  >
                    <span className="flex-shrink-0 opacity-80">{cat.icon}</span>
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sort By */}
          <div>
            <p className="text-[#64748b] text-[0.7rem] font-bold uppercase tracking-[0.18em] mb-3">Sort By</p>
            <div className="space-y-1">
              {SORT_OPTIONS.map((sort) => {
                const isActive = activeSort === sort.id;
                return (
                  <button
                    key={sort.id}
                    onClick={() => setActiveSort(sort.id)}
                    className={`sidebar-sort-btn ${isActive ? 'active' : ''}`}
                  >
                    <span>{sort.label}</span>
                    {isActive && (
                      <svg className="w-4 h-4 text-[#3b82f6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live Count Widget */}
          <div className="game-card rounded-2xl p-4 bg-[#0d1220]/70 border border-white/[0.07]">
            <div className="flex items-center gap-2 mb-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22c55e] opacity-60"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#22c55e]"></span>
              </span>
              <p className="text-white text-xs font-semibold">Players Online</p>
            </div>
            <p className="text-2xl font-black text-white tracking-tight">12,842</p>
          </div>
        </aside>

        {/* Right Main Grid Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[#64748b] text-[0.7rem] font-bold uppercase tracking-[0.18em]">
              All Games <span className="text-white/80 font-bold ml-1">{filteredGames.length}</span>
            </p>
          </div>

          {filteredGames.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
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
