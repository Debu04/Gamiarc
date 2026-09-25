import { Suspense } from 'react';
import GamesLibraryContent from './GamesLibraryContent';

export const metadata = {
  title: 'Games Library – Play Free Online Mini Games | Gamiarc',
  description:
    'Browse the full Gamiarc library of 200+ free online mini games. Filter by action, strategy, puzzle, board games, sports, and casual games.',
};

function GamesLoadingFallback() {
  return (
    <div className="pt-24 pb-20 px-4 sm:px-6 max-w-7xl mx-auto flex items-center justify-center min-h-[50vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-[#2563eb] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[#94a3b8] text-sm font-medium">Loading games library...</p>
      </div>
    </div>
  );
}

export default function GamesLibraryPage() {
  return (
    <Suspense fallback={<GamesLoadingFallback />}>
      <GamesLibraryContent />
    </Suspense>
  );
}
