'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { useSearch } from '@/features/search/hooks/useSearch';
import { SearchResultRow } from '@/features/search/types';
import { SearchFilters } from '@/features/search/components/SearchFilters';
import { SearchResults } from '@/features/search/components/SearchResults';
import { CandidateHeroBanner } from '@/components/candidate/CandidateHeroBanner';
import { RequestAddVoterModal } from '@/components/requests/RequestAddVoterModal';
import { ElectorDetailModal } from '@/components/search/ElectorDetailModal';
import { VoterSlipModal } from '@/components/search/VoterSlipModal';
import { PwaInstallPrompt } from '@/components/pwa/PwaInstallPrompt';
import { Loader2, ShieldCheck } from 'lucide-react';

function SearchPageContent() {
  const {
    query,
    filters,
    page,
    pageSize,
    results,
    total,
    queryType,
    durationMs,
    boothInfo,
    isLoading,
    error,
    handleQueryChange,
    handleFilterChange,
    handleToggleFuzzy,
    handleClearFilters,
    handleClearAll,
    handlePageChange,
    handleRecentSelect,
  } = useSearch();

  const hasQueryOrFilter = Boolean(
    query.trim() ||
      filters.part ||
      filters.ac ||
      filters.district ||
      filters.village
  );

  // Modal states
  const [selectedElectorForDetail, setSelectedElectorForDetail] =
    useState<SearchResultRow | null>(null);
  const [selectedElectorForSlip, setSelectedElectorForSlip] =
    useState<SearchResultRow | null>(null);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestModalMode, setRequestModalMode] = useState<'add' | 'correction'>('add');
  const [correctionInitialData, setCorrectionInitialData] = useState<{
    fullName?: string;
    relativeName?: string;
    epicNumber?: string;
    taluk?: string;
    hobli?: string;
    villageArea?: string;
    address?: string;
  } | null>(null);

  // Discreet access for authorized campaign staff (single shield tap / keyboard shortcut)
  const handleShieldAdminClick = () => {
    window.location.href = '/team';
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') ||
        (e.altKey && e.key.toLowerCase() === 't')
      ) {
        window.location.href = '/team';
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleOpenAddRequest = () => {
    setCorrectionInitialData(null);
    setRequestModalMode('add');
    setIsRequestModalOpen(true);
  };

  const handleSelectElector = (elector: SearchResultRow) => {
    setSelectedElectorForDetail(elector);
  };

  const handleDownloadSlipFromDetail = () => {
    if (selectedElectorForDetail) {
      setSelectedElectorForSlip(selectedElectorForDetail);
      setSelectedElectorForDetail(null);
    }
  };

  const handleRequestCorrectionFromDetail = () => {
    if (selectedElectorForDetail) {
      setCorrectionInitialData({
        fullName: selectedElectorForDetail.name,
        relativeName: selectedElectorForDetail.relative_name || '',
        epicNumber: selectedElectorForDetail.epic_number,
        taluk: selectedElectorForDetail.taluk || '',
        hobli: selectedElectorForDetail.polling_station_name || '',
        villageArea: selectedElectorForDetail.village || '',
        address: selectedElectorForDetail.address || '',
      });
      setRequestModalMode('correction');
      setIsRequestModalOpen(true);
      setSelectedElectorForDetail(null);
    }
  };

  return (
    <div className="relative min-h-screen min-h-dvh flex flex-col justify-between bg-slate-50/95 overflow-x-clip selection:bg-blue-600 selection:text-white">
      {/* ─── Ambient Sovereign Architectural Canvas Background (Desktop & Mobile Optimized) ─── */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
      >
        {/* 1. Sovereign Tri-Color Civic Header Glow Stripe */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#FF671F] via-[#2563eb] to-[#046A38] opacity-90 shadow-2xs" />

        {/* 2. Primary Atmospheric Blue/Indigo Hero Aura (Directly behind Candidate Banner) */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-[720px] sm:w-[980px] h-[360px] sm:h-[480px] bg-gradient-to-b from-blue-600/12 via-indigo-600/6 to-transparent rounded-full blur-3xl transform-gpu" />

        {/* 3. Subtle Warm Saffron Light (Top-Left Flank on Desktop/Tablet) */}
        <div className="hidden md:block absolute top-10 left-[-80px] lg:left-[-40px] w-[360px] h-[360px] bg-amber-500/6 rounded-full blur-3xl transform-gpu" />

        {/* 4. Subtle Emerald Aura (Top-Right Flank on Desktop/Tablet) */}
        <div className="hidden md:block absolute top-14 right-[-80px] lg:right-[-40px] w-[360px] h-[360px] bg-emerald-500/6 rounded-full blur-3xl transform-gpu" />

        {/* 5. Precision Electoral Micro-Grid Texture (Official Security Document Mesh) */}
        <div className="absolute inset-0 bg-tech-grid opacity-[0.38] [mask-image:radial-gradient(ellipse_at_center,black_45%,transparent_92%)]" />

        {/* 6. Mid-Page Soft Depth Luminous Bloom (Behind Search Results Stack) */}
        <div className="absolute top-[48%] left-1/2 -translate-x-1/2 w-[600px] sm:w-[820px] h-[320px] bg-indigo-500/4 rounded-full blur-3xl transform-gpu" />

        {/* 7. Grounding Base Vignette */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[540px] h-[200px] bg-blue-500/5 rounded-full blur-2xl transform-gpu" />
      </div>

      {/* ─── Foreground Content Viewport (Elevated Z-Index) ─── */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-start px-3.5 sm:px-6 lg:px-8 pt-2.5 sm:pt-6 pb-6 max-w-5xl w-full mx-auto space-y-4 sm:space-y-5">
        {/* 1. Executive Candidate Profile Banner & Clean Search Card */}
        <CandidateHeroBanner
        onRequestAddVoter={() => {
          setRequestModalMode('add');
          setIsRequestModalOpen(true);
        }}
        candidateName="SHASHI HULIKUNTEMUTT"
        candidateRole="INC Candidate"
        constituencyTitle="South-East Graduates' Constituency, Karnataka"
        voterCountText="1,92,696 graduate voters listed"
        candidatePhotoUrl="/candidate-avatar.jpg"
        partyLogoUrl="/inc-logo.png"
        searchQuery={query}
        onSearchChange={handleQueryChange}
      />

      {/* 2. Directly Under Candidate Hero: Advanced Constituency & Booth Filters */}
      <div className="w-full max-w-2xl mx-auto space-y-3">
        <SearchFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
        />
      </div>

      {/* 3. PWA App Installation Prompt (For Android & iOS) */}
      <PwaInstallPrompt />

      {/* 4. Live Search Results List */}
      <div className="w-full max-w-2xl mx-auto">
        <SearchResults
          results={results}
          total={total}
          page={page}
          pageSize={pageSize}
          queryType={queryType}
          durationMs={durationMs}
          boothInfo={boothInfo}
          isLoading={isLoading}
          error={error}
          searchQuery={query}
          hasQueryOrFilter={hasQueryOrFilter}
          onPageChange={handlePageChange}
          onReset={handleClearAll}
          onRequestAddVoter={handleOpenAddRequest}
          onSelectElector={handleSelectElector}
        />
      </div>

      {/* 5. Official Electoral Compliance & Privacy Footer */}
      <footer className="w-full max-w-2xl mx-auto text-center text-[11px] text-slate-400 font-medium pt-4 pb-9 space-y-1.5 select-none">
        <div className="inline-flex items-center justify-center gap-1.5 text-slate-500 font-semibold text-[11px] select-none">
          <button
            type="button"
            onClick={handleShieldAdminClick}
            aria-label="Official Verification Status"
            title="Official Electoral Roll Verification System"
            className="p-0.5 text-slate-400 hover:text-slate-600 active:opacity-60 transition-colors focus:outline-none"
          >
            <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
          </button>
          <span>Official Electoral Roll Verification · South-East &amp; Central Karnataka Constituency</span>
        </div>
        <p className="leading-relaxed text-slate-400 text-[11px]">
          Public lookup displays limited elector indices in accordance with Election Commission statutory privacy standards.
        </p>
        <p className="text-[10px] text-slate-400">
          Official roll data published by Chief Electoral Officer (CEO), Karnataka · All statutory safeguards active.
        </p>
      </footer>

      {/* Elector Quick Detail Modal (Triggered when tapping a card) */}
      <ElectorDetailModal
        isOpen={Boolean(selectedElectorForDetail)}
        onClose={() => setSelectedElectorForDetail(null)}
        elector={selectedElectorForDetail}
        onDownloadSlip={handleDownloadSlipFromDetail}
        onRequestCorrection={handleRequestCorrectionFromDetail}
      />

      {/* Official Download Voter Slip Modal (Replicating Reference Image 7.42.37 AM) */}
      <VoterSlipModal
        isOpen={Boolean(selectedElectorForSlip)}
        onClose={() => setSelectedElectorForSlip(null)}
        elector={selectedElectorForSlip}
        candidateName="SHASHI HULIKUNTEMUTT"
        candidateRole="INC Candidate"
        constituencyTitle="South-East Graduates' Constituency, Karnataka"
        candidatePhotoUrl="/candidate-avatar.jpg"
      />

      {/* Request to Add or Correct Voter Modal */}
      <RequestAddVoterModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        mode={requestModalMode}
        initialData={correctionInitialData}
      />
    </main>
  </div>
);
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center p-12">
          <div className="flex items-center gap-2.5 text-sm font-semibold text-slate-500">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
            <span>Loading search engine...</span>
          </div>
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}
