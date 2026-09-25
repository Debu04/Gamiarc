'use client';

import { useState } from 'react';

const PODIUM = [
  {
    rank: 1,
    badge: '01',
    name: 'PHANT0M_X',
    title: 'LEGENDARY',
    xp: '58,204 XP',
    avatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAEuWxm3_UGPlmney4oOzNgkxjQP6c4veDt08qE27FLjXs2X_Lq0cVB6X82rKhH4YzKISr91uve1Ew8mvkgVJ_xrAwYqmbWmGhv9L9-u7R6VzSWrxJh9ESZyfnO88m4TmoP-60ZQonrVj9tPUJ8G_3cLXSC5HbByjrjmVVKrn9lWAG-dUKY2Es6_9F8MagQd51I678y6d0rGost3p9thRg5zj7zwdByvV1-Wa-fO-gr9NzWWeDWopeKebs96CTyr4pyowTBs_h8Os4h',
    isWinner: true,
  },
  {
    rank: 2,
    badge: '02',
    name: 'V0ID_WALKER',
    title: 'ELITE',
    xp: '42,910 XP',
    avatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDgvEQGDenIGlebB5908ZEEjh_v_ZQwOarNatfJTuE644DPcP6zMGa4Y_yQ6TEMogWiKZ101lihgdbhNVAW1uWgf6NJEniK6uKnkiAmxr8Of88F57mPanmhuuxR4eSpvMrz4LJesy3bXm_503-qj8CDu3iB0PFqoI88r5ezLEbfovZ5pNJ8rJD9ETOtQOPtGUT6h2t8tehQXEdtrAiCIgiyoWoKFDUgHcijNOSXraHdjTWtkrK-ea4B_T9TfPZv1O2c5Ofo1pe-108_',
  },
  {
    rank: 3,
    badge: '03',
    name: 'CYBER_REBEL',
    title: 'ELITE',
    xp: '39,400 XP',
    avatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBwG3jZu2G5qC9noBhMoEJEFP3cX4_ndFkJIuxx-nEllWsp_W2n2jp2XVr-OzSyS7_vF876Iso80waX-SG0ZbkbTx1OqoFy2c-BdJKJO8y7uwZeE4EXOFZ14oG7emZCBEjyjqjcuDTxCbyTlK6BRCaQ4Jeyps6QEwrYKqBx9-KTfxpGqKqXz04Rqh6q1dR4zR6jtSr6fuTsHa9Cw032wi89N7Oj3NT2kwRhkLzd0apB22jVW8r7jEiK-LDvEvhEet6E1DeZ9OsPSDbh',
  },
];

const LEADERBOARD_ROWS = [
  {
    rank: '04',
    name: 'Neon_Pulse',
    sub: 'LVL 45 CRUSADER',
    xp: '31,200 XP',
    avatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuB6ViDG_DrB6cc88ZUNjliQdMRMo_S0k-nH-ffXcdcOr0zHUS7zeZ98Xn6q-byQ0iBk2enu4nUHuWejvR3B0BB6BTl29tAhepc4BC6j8EOcriJV_sMcPBA_Rp1YwMlHgOcRf7Bknwrgahv8T1dvUPJVN4TSSGpLUCEOL7wWxE9GHhIoVY8Gj_qAl3BZZBCvoC0_yREGYNMU2CtTs1i1fICzaXWpyMmUMmbNaEH5xSf3J2OyPAaHqIQ83JdRPknC99e3F5EnRV7DNkkh',
  },
  {
    rank: '05',
    name: 'Circuit_Breaker',
    sub: 'LVL 42 OPERATIVE',
    xp: '29,880 XP',
    avatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBy5bocp7vWUu2D_uQYmRWy-4qQd5gD36a8UHTXKjmRLm77itjM-fQRpg6woLe5WDv5lS2c74RwRumWpWFgzWM1TojBCePi0H792u2lWcm-tj5jhzI1S7QIum8Anp8VdG5ukfV7XFThTXWtXyp-uw-yLu0gb3BMWgSj53WBSZVX6fVKBqe6xnNan-aMLdLLeoPbBPEOJy7XO6ogR6iA9V0QHPYhK3E9TLGXpp1ykeuoTpgv38Yr2hGGoRvUYGsmXtPcw_Hg8fv816OQ',
  },
  {
    rank: '06',
    name: 'Void_Walker',
    sub: 'LVL 41 OPERATIVE',
    xp: '28,100 XP',
    avatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAu-DdWrUWboD853udax4PC5eSobCcGEGSg0AC0gaizE0IwIU5n-YPRu6hxcHLGB3AsLGUh_59-OFFRcMySBEbwsRyIuTZvYVkJiTxs3Z8Jwjv8GeclzA3o9RNcN5qq9RLGRv0hwsGr2_ncU0_yCTDP4VitBy-Ve1M2-g4MeFyMrKDWOZUi0ygwHDPjuoZ6_USoRIG82A0B9B8r79UMnSuXtXk4-84ThxecbCrD9N8B8e_igI-cLOUJ1u3_mKQJ8fVte_7IicD54Fco',
  },
  {
    rank: '07',
    name: 'Static_Shock',
    sub: 'LVL 39 RECRUIT',
    xp: '26,450 XP',
    avatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuByCPUAN7GOGAos6rmJqR-bXvsuuBvCUTMss7n8m6WiZfb9ajYiUHWIib4Q0yRnrR8DrI-9IRrWRMv-IDQ1tm5KIkQSZK6J7WOsZeHm0y3lV3EaxxtMJ39CrHrDyZsjM3vpAf0Gckbc9N92l__SUaosHxXynB2dXHODI18e_DnTvKRn9R58pP_k0l-ubPhF2fO0spMKkF2-EhjW8w7uMvUEqIPZESpc44eNWoR92S2BjfEHkO654fO5OrXJfU3FpELJgfZdC8rT_3WZ',
  },
  {
    rank: '08',
    name: 'Cyber_Sensei',
    sub: 'LVL 38 RECRUIT',
    xp: '24,900 XP',
    avatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCRrBimLtyXmVKdf3KgWy6fVMxqpFMoGVl3yzGjNdXOqvYcZu3fLOV1rtfvxmOZm9MNkhamSVfTAiveQi0LM8przJXuv_DFjEcxPql05iyITqPKdhI-syIlURmn_cxYAzQuPey6hiaCUlWXJ7X4cYEbrhvylsnC43SYn6gTW8YaEG-Jf6_TvEkEgyMXqQqUgNCdfDaRUzo824O_tiA_F6q5cCJG9AkVD1OWjy513X6BSa6nSbj6g3h_kLOhYrpfWBod_gtYu3RfutR7',
  },
];

export default function LeaderboardsPage() {
  const [timeframe, setTimeframe] = useState('monthly');

  return (
    <div className="pt-24 pb-20 px-4 sm:px-6 max-w-7xl mx-auto relative">
      <div className="fixed inset-0 scanline-overlay z-10 opacity-10 pointer-events-none"></div>

      {/* ===== UPCOMING NOTICE BANNER ===== */}
      <div className="mb-8 p-4 rounded-2xl bg-[#0e1320] border border-[#2563eb]/30 shadow-[0_0_25px_rgba(37,99,235,0.15)] flex flex-col sm:flex-row items-center justify-between gap-4 relative z-20">
        <div className="flex items-center gap-3 text-center sm:text-left">
          <div className="w-9 h-9 rounded-xl bg-[#2563eb]/20 flex items-center justify-center text-[#3b82f6] flex-shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-white">Leaderboards is Under Development</p>
            <p className="text-xs text-[#94a3b8]">Live competitive rankings will launch in an upcoming release. Preview the mock interface below.</p>
          </div>
        </div>
        <a
          href="/games"
          className="px-4 py-2 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-semibold whitespace-nowrap transition-colors flex-shrink-0"
        >
          Play Games
        </a>
      </div>

      {/* ===== HEADER & PERIOD FILTERS ===== */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6 relative z-20">
        <div>
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-white mb-2">Global Rankings</h1>
          <p className="text-[#64748b] text-xs font-semibold uppercase tracking-widest">
            Sector: Elite Operatives // 2026 Protocol
          </p>
        </div>
        <div className="flex gap-2 bg-white/[0.03] p-1.5 rounded-xl border border-white/10">
          <button
            onClick={() => setTimeframe('weekly')}
            className={`px-5 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-colors ${
              timeframe === 'weekly' ? 'bg-[#2563eb] text-white' : 'text-[#64748b] hover:text-white'
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => setTimeframe('monthly')}
            className={`px-5 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-colors ${
              timeframe === 'monthly' ? 'bg-[#2563eb] text-white' : 'text-[#64748b] hover:text-white'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setTimeframe('alltime')}
            className={`px-5 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-colors ${
              timeframe === 'alltime' ? 'bg-[#2563eb] text-white' : 'text-[#64748b] hover:text-white'
            }`}
          >
            All-Time
          </button>
        </div>
      </div>

      {/* ===== PODIUM (TOP 3 OPERATIVES) ===== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end mb-14 max-w-6xl mx-auto relative z-20">
        {/* Rank 2 */}
        <div className="order-2 md:order-1 flex flex-col items-center">
          <div className="relative w-full aspect-[4/5] game-card border border-white/10 group p-1 rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/90 via-transparent to-transparent z-10"></div>
            <img
              className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
              src={PODIUM[1].avatar}
              alt="Rank 2 Avatar"
            />
            <div className="absolute bottom-0 left-0 w-full p-6 bg-black/60 backdrop-blur-md border-t border-white/10 z-20">
              <div className="text-xl font-bold uppercase text-white">{PODIUM[1].name}</div>
              <div className="flex justify-between items-center mt-1">
                <span className="bg-[#a855f7]/20 text-[#c084fc] text-[10px] px-2 py-0.5 rounded font-bold tracking-widest">
                  {PODIUM[1].title}
                </span>
                <span className="text-sm font-bold text-white">{PODIUM[1].xp}</span>
              </div>
            </div>
            <div className="absolute top-3 left-3 w-10 h-10 bg-[#a855f7] text-white rounded-xl flex items-center justify-center text-lg font-black italic z-20">
              02
            </div>
          </div>
        </div>

        {/* Rank 1 */}
        <div className="order-1 md:order-2 flex flex-col items-center scale-105 z-30">
          <div className="relative w-full aspect-[4/5] game-card border-2 border-[#2563eb] neon-glow-primary p-1 rounded-2xl overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/90 via-transparent to-transparent z-10"></div>
            <img
              className="w-full h-full object-cover transition-all duration-500"
              src={PODIUM[0].avatar}
              alt="Rank 1 Avatar"
            />
            <div className="absolute bottom-0 left-0 w-full p-6 bg-black/60 backdrop-blur-md border-t border-[#2563eb]/40 z-20">
              <div className="text-2xl font-black uppercase text-[#3b82f6] tracking-tight">{PODIUM[0].name}</div>
              <div className="flex justify-between items-center mt-1">
                <span className="bg-[#2563eb]/20 text-[#60a5fa] text-[10px] px-2 py-0.5 rounded font-bold tracking-widest">
                  {PODIUM[0].title}
                </span>
                <span className="text-base font-bold text-white">{PODIUM[0].xp}</span>
              </div>
            </div>
            <div className="absolute top-3 left-3 w-12 h-12 bg-[#2563eb] text-white rounded-xl flex items-center justify-center text-xl font-black italic z-20 shadow-lg">
              01
            </div>
          </div>
        </div>

        {/* Rank 3 */}
        <div className="order-3 md:order-3 flex flex-col items-center">
          <div className="relative w-full aspect-[4/5] game-card border border-white/10 group p-1 rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/90 via-transparent to-transparent z-10"></div>
            <img
              className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
              src={PODIUM[2].avatar}
              alt="Rank 3 Avatar"
            />
            <div className="absolute bottom-0 left-0 w-full p-6 bg-black/60 backdrop-blur-md border-t border-white/10 z-20">
              <div className="text-xl font-bold uppercase text-white">{PODIUM[2].name}</div>
              <div className="flex justify-between items-center mt-1">
                <span className="bg-[#a855f7]/20 text-[#c084fc] text-[10px] px-2 py-0.5 rounded font-bold tracking-widest">
                  {PODIUM[2].title}
                </span>
                <span className="text-sm font-bold text-white">{PODIUM[2].xp}</span>
              </div>
            </div>
            <div className="absolute top-3 left-3 w-10 h-10 bg-[#a855f7] text-white rounded-xl flex items-center justify-center text-lg font-black italic z-20">
              03
            </div>
          </div>
        </div>
      </div>

      {/* ===== USER RANK STICKY BAR & LEADERBOARD ROWS ===== */}
      <div className="space-y-3 relative z-20">
        {/* Sticky User Row */}
        <div className="game-card p-4 rounded-xl flex items-center gap-4 border-l-4 border-[#2563eb] sticky top-20 z-30 shadow-lg">
          <span className="font-black text-[#2563eb] text-xl w-8 text-center">42</span>
          <div className="w-10 h-10 rounded-lg overflow-hidden border border-[#2563eb]/40 flex-shrink-0 bg-white/5 flex items-center justify-center">
            <span className="material-symbols-outlined text-[#2563eb]">account_circle</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm uppercase text-white truncate">YOU (OPERATOR)</p>
            <p className="text-[10px] text-[#3b82f6] font-semibold">TOP 5% OF OPERATORS</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-sm text-white">12,450 XP</p>
          </div>
        </div>

        {/* Other Leaderboard Rows */}
        {LEADERBOARD_ROWS.map((row) => (
          <div
            key={row.rank}
            className="game-card p-4 rounded-xl flex items-center gap-4 hover:border-white/25 transition-all"
          >
            <span className="font-bold text-[#64748b] text-base w-8 text-center">{row.rank}</span>
            <img src={row.avatar} alt={row.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm uppercase text-white truncate">{row.name}</p>
              <p className="text-[10px] text-[#64748b] font-medium">{row.sub}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-sm text-white">{row.xp}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
