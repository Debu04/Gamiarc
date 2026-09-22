'use client';

import { useState } from 'react';

const TRENDING_DISCUSSIONS = [
  {
    id: 1,
    author: 'NeonPulse',
    tag: 'Guide',
    tagColor: '#3b82f6',
    title: 'Speedrunning District 9: Sub-2 minute route guide & skip locations',
    preview: 'After testing the new physics patch, here are the 3 critical wall-slide triggers you must hit...',
    time: '2 hours ago',
    replies: 42,
    upvotes: 156,
  },
  {
    id: 2,
    author: 'GlitchMaster',
    tag: 'Strategy',
    tagColor: '#a855f7',
    title: 'Optimal defensive openings in Neon Tic-Tac-Toe vs Hard AI',
    preview: 'The minimax bot prioritizes center control, but you can force an alternating fork with this opening...',
    time: '5 hours ago',
    replies: 28,
    upvotes: 89,
  },
  {
    id: 3,
    author: 'GamiarcAdmin',
    tag: 'Official',
    tagColor: '#22c55e',
    title: 'Weekend Nexus Tournament: Registration & Rulebook',
    preview: 'Compete for the top spot on the Global Leaderboards this Saturday. Double-elimination brackets...',
    time: '1 day ago',
    replies: 64,
    upvotes: 312,
  },
];

const ONLINE_OPERATIVES = [
  { name: 'V0ID_WALKER', level: 'LVL 48', status: 'In Game' },
  { name: 'CyberRebel', level: 'LVL 45', status: 'Online' },
  { name: 'StaticShock', level: 'LVL 39', status: 'In Game' },
  { name: 'Phantom_X', level: 'LVL 50', status: 'Away' },
];

export default function CommunityPage() {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  const filteredDiscussions = TRENDING_DISCUSSIONS.filter((d) => {
    if (activeFilter !== 'all' && d.tag.toLowerCase() !== activeFilter) return false;
    if (search.trim() && !d.title.toLowerCase().includes(search.toLowerCase().trim())) return false;
    return true;
  });

  return (
    <div className="pt-24 pb-20 px-4 sm:px-6 max-w-7xl mx-auto">
      {/* ===== HERO & SEARCH ===== */}
      <section className="flex flex-col gap-6 mb-10 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-[#3b82f6]/10 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="flex flex-wrap justify-between items-end gap-4 relative z-10">
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl md:text-5xl font-black leading-tight tracking-tighter uppercase italic text-white flex items-center gap-3">
              Community Hub
            </h1>
            <p className="text-[#94a3b8] text-base max-w-xl">
              The heart of the cyber grid. Connect with top players, elite operatives, and strategists.
            </p>
          </div>
          <button
            onClick={() => alert('Discussions posting will be available with user accounts.')}
            className="flex items-center gap-2 rounded-xl h-12 px-6 bg-[#2563eb] text-white text-sm font-bold uppercase tracking-widest hover:bg-[#1d4ed8] transition-all shadow-[0_0_24px_rgba(37,99,235,0.35)]"
          >
            <span className="material-symbols-outlined text-lg">add_comment</span>
            <span>Start Discussion</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full h-14 z-10">
          <div className="flex w-full h-full border border-white/10 bg-white/[0.03] backdrop-blur-md rounded-xl overflow-hidden focus-within:border-[#2563eb] transition-all">
            <div className="text-[#2563eb] flex items-center justify-center px-5">
              <span className="material-symbols-outlined text-xl">search</span>
            </div>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent border-none text-white focus:outline-none px-4 text-sm font-medium placeholder:text-white/40"
              placeholder="Search discussions, players, or tournaments..."
            />
          </div>
        </div>
      </section>

      {/* ===== MAIN LAYOUT ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        {/* Left Column: Spotlight & Discussions */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          {/* Spotlight Banner */}
          <div className="group relative overflow-hidden rounded-2xl game-card border border-white/10">
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent z-10"></div>
            <div
              className="h-[280px] sm:h-[320px] bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
              style={{
                backgroundImage:
                  "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCbE5L522EzXOLkkrF1DhNrXVr8Luzw4liK-S6cT5bPz-XqiAJed0D68Optw-0ZwyCHBLbtunB6stLOwFFV9sCKhm8_VDBzyxdrC-1VD3RNkO0qPWqFhosGdUiT-m8-vKM0N72uIJlwJNSjlwiUC9C0dEqbrdNYHb2ljQh1sdIUNH_ngCs8izfX-vSbxiqYQHIn-WpzUA3mRnE52Wj3ClnXJzJAzlYyBT-LOpwnE8eLhOTwK7_b7rukCOL7UXGxG1WSds59B12X1thR')",
              }}
            ></div>
            <div className="absolute bottom-0 left-0 p-6 sm:p-8 z-20 w-full flex justify-between items-end">
              <div>
                <span className="inline-block px-3 py-1 rounded-full bg-[#a855f7] text-[10px] font-black uppercase tracking-tighter text-white mb-2">
                  Community Spotlight
                </span>
                <h2 className="text-white text-2xl sm:text-3xl font-black leading-tight tracking-tight uppercase italic mb-1">
                  Zero_K0ol: Neon Ghost
                </h2>
                <p className="text-[#cbd5e1] text-xs sm:text-sm font-medium max-w-md">
                  Legendary runner breaks the 2-minute mark in the District 9 expansion.
                </p>
              </div>
              <button
                type="button"
                className="hidden sm:flex items-center gap-2 rounded-lg h-10 px-5 bg-white text-black text-xs font-bold uppercase transition-all hover:bg-[#2563eb] hover:text-white"
              >
                <span>Profile</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
          </div>

          {/* Trending Feed */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-lg font-bold uppercase tracking-tight text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-[#2563eb] text-xl">trending_up</span>
                Trending Discussions
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveFilter('all')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                    activeFilter === 'all' ? 'bg-white/15 text-white' : 'text-[#64748b] hover:text-white'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setActiveFilter('guide')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                    activeFilter === 'guide' ? 'bg-white/15 text-white' : 'text-[#64748b] hover:text-white'
                  }`}
                >
                  Guides
                </button>
                <button
                  onClick={() => setActiveFilter('strategy')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                    activeFilter === 'strategy' ? 'bg-white/15 text-white' : 'text-[#64748b] hover:text-white'
                  }`}
                >
                  Strategy
                </button>
              </div>
            </div>

            {/* List */}
            <div className="space-y-3">
              {filteredDiscussions.map((d) => (
                <article
                  key={d.id}
                  className="game-card p-5 rounded-xl hover:border-white/20 transition-all flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                        style={{ backgroundColor: `${d.tagColor}22`, color: d.tagColor }}
                      >
                        {d.tag}
                      </span>
                      <span className="text-xs text-[#94a3b8]">Posted by {d.author}</span>
                    </div>
                    <span className="text-[11px] text-[#475569]">{d.time}</span>
                  </div>
                  <h4 className="text-base font-bold text-white leading-snug">{d.title}</h4>
                  <p className="text-xs text-[#64748b] line-clamp-2">{d.preview}</p>
                  <div className="flex items-center gap-4 text-xs text-[#64748b] pt-1">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">chat_bubble</span>
                      {d.replies} replies
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">thumb_up</span>
                      {d.upvotes} upvotes
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar: Topics & Online Operatives */}
        <aside className="lg:col-span-4 flex flex-col gap-6">
          {/* Active Topics */}
          <div className="game-card p-5 rounded-2xl">
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#94a3b8] mb-3">Popular Topics</h4>
            <div className="flex flex-wrap gap-2">
              {['#Speedruns', '#Strategy', '#Announcements', '#BugReports', '#Lore', '#Tournaments'].map((topic) => (
                <span
                  key={topic}
                  className="text-xs px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 text-white/80 hover:text-white hover:border-[#2563eb]/50 transition-all cursor-pointer"
                >
                  {topic}
                </span>
              ))}
            </div>
          </div>

          {/* Online Operatives */}
          <div className="game-card p-5 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-[#94a3b8]">Online Operatives</h4>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22c55e] opacity-60"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#22c55e]"></span>
              </span>
            </div>
            <div className="space-y-3">
              {ONLINE_OPERATIVES.map((op) => (
                <div key={op.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#22c55e]"></div>
                    <span className="font-semibold text-white">{op.name}</span>
                  </div>
                  <span className="text-[10px] text-[#64748b]">{op.level}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Guidelines */}
          <div className="game-card p-5 rounded-2xl border border-white/5 text-xs text-[#64748b] space-y-2">
            <p className="font-bold text-white text-xs uppercase tracking-wider">Cyber Grid Protocol</p>
            <p>Treat all operatives with respect. No cheats or exploit distribution permitted on the network.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
