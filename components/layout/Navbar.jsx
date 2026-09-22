'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/games?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const isLinkActive = (path) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  return (
    <header className="fixed top-0 w-full z-50 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-white/[0.06]">
      <div className="w-full px-6 h-16 flex items-center justify-between md:grid md:grid-cols-3">
        {/* LEFT: Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-white rounded-md flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 20 20">
              <path d="M11 17a1 1 0 001.447.894l4-2A1 1 0 0017 15V9.236a1 1 0 00-1.447-.894l-4 2a1 1 0 00-.553.894V17zM15.211 6.276a1 1 0 000-1.788l-4.764-2.382a1 1 0 00-.894 0L4.789 4.488a1 1 0 000 1.788l4.764 2.382a1 1 0 00.894 0l4.764-2.382zM4.447 8.342A1 1 0 003 9.236V15a1 1 0 00.553.894l4 2A1 1 0 009 17v-5.764a1 1 0 00-.553-.894l-4-2z" />
            </svg>
          </div>
          <span className="font-black text-white text-[1.05rem] tracking-tight">
            GAMIARC
          </span>
        </Link>

        {/* CENTER: Nav Links */}
        <nav className="hidden md:flex items-center justify-center gap-8">
          <Link
            href="/"
            className={`text-sm font-medium transition-colors ${
              isLinkActive('/') ? 'text-white' : 'text-[#666] hover:text-white'
            }`}
          >
            Home
          </Link>
          <Link
            href="/games"
            className={`text-sm font-medium transition-colors ${
              isLinkActive('/games') ? 'text-white' : 'text-[#666] hover:text-white'
            }`}
          >
            Games
          </Link>
          <Link
            href="/leaderboards"
            className={`text-sm font-medium transition-colors ${
              isLinkActive('/leaderboards') ? 'text-white' : 'text-[#666] hover:text-white'
            }`}
          >
            Leaderboards
          </Link>
          <Link
            href="/community"
            className={`text-sm font-medium transition-colors ${
              isLinkActive('/community') ? 'text-white' : 'text-[#666] hover:text-white'
            }`}
          >
            Community
          </Link>
        </nav>

        {/* RIGHT: Search, Sign In (Desktop), Profile (Mobile) */}
        <div className="flex items-center justify-end gap-3">
          <form onSubmit={handleSearchSubmit} className="hidden md:block relative">
            <svg
              className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#555]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search games..."
              className="bg-white/[0.05] border border-white/10 rounded-full py-2 pl-9 pr-4 text-sm text-white/60 focus:outline-none focus:border-white/25 transition-all w-44 placeholder:text-[#444] font-sans"
            />
          </form>
          <button
            type="button"
            className="hidden md:block px-5 py-2 bg-white hover:bg-white/85 text-black font-semibold text-sm rounded-full transition-colors"
          >
            Sign In
          </button>
          <div
            className="md:hidden w-8 h-8 rounded-full bg-gradient-to-br from-[#d4956a] to-[#b5723a] border border-[#8a5a2a]/60 flex items-center justify-center overflow-hidden hover:opacity-80 transition-opacity cursor-pointer"
            title="Profile"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M14.5 5.5 C14.5 3.5 13 2 11.5 2 C9.5 2 8 3.8 8.5 6 C8.8 7.5 9.5 8.5 10.5 9.2 C9 9.8 7.5 10.8 6.5 12.5 C5.5 14 5 16 5 18 L5 22 L18 22 L18 18 C18 15.5 17 13 15.5 11.5 C14.5 10.5 13.5 10 12.5 9.5 C13.8 8.5 14.5 7.2 14.5 5.5 Z"
                fill="rgba(255,220,180,0.9)"
              />
            </svg>
          </div>
        </div>
      </div>
    </header>
  );
}
