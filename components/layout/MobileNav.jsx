'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function MobileNav() {
  const pathname = usePathname();

  const isHomeActive = pathname === '/';
  const isGamesActive = pathname.startsWith('/games');
  const isLeaderboardActive = pathname.startsWith('/leaderboards');
  const isCommunityActive = pathname.startsWith('/community');

  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 bg-[#0a0a0a] border-t border-white/[0.06]">
      <div className="flex items-center justify-around h-[60px] px-1">
        {/* Home */}
        <Link href="/" className="flex flex-col items-center gap-0.5 group min-w-0">
          <svg
            className={`w-5 h-5 ${isHomeActive ? 'text-[#a855f7]' : 'text-[#555]'}`}
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
          </svg>
          <span
            className={`text-[0.5rem] font-bold tracking-wider uppercase ${
              isHomeActive ? 'text-[#a855f7]' : 'text-[#555]'
            }`}
          >
            Home
          </span>
        </Link>

        {/* Games */}
        <Link href="/games" className="flex flex-col items-center gap-0.5 min-w-0">
          <svg
            className={`w-5 h-5 ${isGamesActive ? 'text-[#a855f7]' : 'text-[#555]'}`}
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M15 7.5V2H9v5.5l3 3 3-3zM7.5 9H2v6h5.5l3-3-3-3zM9 16.5V22h6v-5.5l-3-3-3 3zM16.5 9l-3 3 3 3H22V9h-5.5z" />
          </svg>
          <span
            className={`text-[0.5rem] font-bold tracking-wider uppercase ${
              isGamesActive ? 'text-[#a855f7]' : 'text-[#555]'
            }`}
          >
            Games
          </span>
        </Link>

        {/* Leaderboard */}
        <Link href="/leaderboards" className="flex flex-col items-center gap-0.5 min-w-0">
          <svg
            className={`w-5 h-5 ${isLeaderboardActive ? 'text-[#a855f7]' : 'text-[#555]'}`}
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M5 9h3v11H5zm6-5h3v16h-3zm6 8h3v8h-3z" />
          </svg>
          <span
            className={`text-[0.5rem] font-bold tracking-wider uppercase ${
              isLeaderboardActive ? 'text-[#a855f7]' : 'text-[#555]'
            }`}
          >
            Leaderboard
          </span>
        </Link>

        {/* Community */}
        <Link href="/community" className="flex flex-col items-center gap-0.5 min-w-0">
          <svg
            className={`w-5 h-5 ${isCommunityActive ? 'text-[#a855f7]' : 'text-[#555]'}`}
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
          </svg>
          <span
            className={`text-[0.5rem] font-bold tracking-wider uppercase ${
              isCommunityActive ? 'text-[#a855f7]' : 'text-[#555]'
            }`}
          >
            Community
          </span>
        </Link>
      </div>
    </nav>
  );
}
