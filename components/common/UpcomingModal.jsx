'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';

export default function UpcomingModal({ isOpen, onClose, featureName = 'Feature' }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md transition-all"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full p-6 rounded-3xl bg-[#0d1220]/95 backdrop-blur-xl border border-white/10 shadow-2xl text-center animate-modal-in flex flex-col items-center justify-center"
        style={{ maxWidth: '340px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close modal"
          style={{
            position: 'absolute',
            top: '14px',
            right: '14px',
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.10)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'rgba(255,255,255,0.6)',
            flexShrink: 0,
          }}
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Glowing Badge */}
        <div className="inline-flex items-center gap-2 version-badge px-3 py-1 rounded-full mb-4">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3b82f6] opacity-60"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#3b82f6]"></span>
          </span>
          <span className="text-[0.65rem] font-bold tracking-[0.18em] text-[#93c5fd] uppercase">
            Coming Soon
          </span>
        </div>

        {/* Feature Icon Graphic */}
        <div className="w-12 h-12 mx-auto mb-3.5 rounded-xl bg-[#2563eb]/20 border border-[#2563eb]/35 flex items-center justify-center text-[#3b82f6] shadow-[0_0_20px_rgba(37,99,235,0.25)]">
          {featureName.toLowerCase().includes('leaderboard') ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          )}
        </div>

        {/* Content */}
        <h3 className="text-lg sm:text-xl font-black text-white mb-1.5 tracking-tight">
          {featureName} is Under Development
        </h3>
        <p className="text-[#94a3b8] text-xs leading-relaxed mb-5 max-w-[280px] mx-auto">
          We&apos;re crafting this experience with real-time features and interactive player capabilities. It will be unlocked in the upcoming update!
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 justify-center w-full">
          <button
            onClick={onClose}
            className="w-full px-5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-white text-xs font-semibold border border-white/10 transition-all"
          >
            Got it
          </button>
          <Link
            href="/games"
            onClick={onClose}
            className="w-full px-5 py-2 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-semibold shadow-[0_0_15px_rgba(37,99,235,0.35)] transition-all flex items-center justify-center gap-1.5"
          >
            Explore Games
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
