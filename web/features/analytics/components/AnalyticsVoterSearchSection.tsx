'use client';

import React, { useState } from 'react';
import { useSearch } from '@/features/search/hooks/useSearch';
import { SearchResultRow } from '@/features/search/types';
import { SearchFilters } from '@/features/search/components/SearchFilters';
import { SearchResults } from '@/features/search/components/SearchResults';
import { RequestAddVoterModal } from '@/components/requests/RequestAddVoterModal';
import { ElectorDetailModal } from '@/components/search/ElectorDetailModal';
import { VoterSlipModal } from '@/components/search/VoterSlipModal';
import {
  Search,
  Users,
  Sparkles,
  MapPin,
  Building2,
  FileText,
  Filter,
  CheckCircle2,
  Download,
} from 'lucide-react';
import Image from 'next/image';

export function AnalyticsVoterSearchSection() {
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
  } = useSearch();

  const hasQueryOrFilter = Boolean(
    query.trim() ||
      filters.part ||
      filters.ac ||
      filters.district ||
      filters.village
  );

  // Modals state
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
    <div className="space-y-6 max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-6 animate-fadeIn">
      {/* 1. Analyst Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 text-white rounded-3xl p-5 sm:p-7 shadow-xl border border-blue-800/40 relative overflow-hidden">
        {/* Subtle decorative watermark */}
        <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-10 pointer-events-none overflow-hidden">
          <Image
            src="/congress-flag.png"
            alt="Watermark"
            fill
            unoptimized
            className="object-cover object-right"
          />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-blue-500/20 text-blue-200 border border-blue-400/30">
              <Search className="w-3.5 h-3.5 text-blue-300" />
              <span>ELECTORAL ROLL LOOKUP &amp; VERIFICATION</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Voter Directory &amp; Profile Search Engine
            </h2>
            <p className="text-xs sm:text-sm text-blue-200/90 font-medium max-w-2xl leading-relaxed">
              Search by EPIC number or Elector Name across all 5 districts of the South-East Graduates&apos; Constituency. Verify serial numbers, polling station booths, and generate official voter slips.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            <button
              type="button"
              onClick={handleOpenAddRequest}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition active:scale-95 flex items-center gap-2"
            >
              <span>+ Form 18 Request</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Search & Constituency Filters Container */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200/90 shadow-soft-sm space-y-4">
        {/* Search Input Bar */}
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Search by EPIC Number (e.g. IUO...) or Voter Name (English / ಕನ್ನಡ)..."
            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 hover:bg-slate-50/80 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-2xl text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-100 transition shadow-inner"
          />
        </div>

        {/* Filter Bar (District, Taluk, Booth, Fuzzy) */}
        <SearchFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
        />
      </div>

      {/* 3. Search Results */}
      <div className="w-full">
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

      {/* Elector Quick Detail Modal */}
      <ElectorDetailModal
        isOpen={Boolean(selectedElectorForDetail)}
        onClose={() => setSelectedElectorForDetail(null)}
        elector={selectedElectorForDetail}
        onDownloadSlip={handleDownloadSlipFromDetail}
        onRequestCorrection={handleRequestCorrectionFromDetail}
      />

      {/* Voter Slip Modal */}
      <VoterSlipModal
        isOpen={Boolean(selectedElectorForSlip)}
        onClose={() => setSelectedElectorForSlip(null)}
        elector={selectedElectorForSlip}
        candidateName="SHASHI HULIKUNTEMUTT"
        candidateRole="INC Candidate"
        constituencyTitle="South-East Graduates' Constituency, Karnataka"
        candidatePhotoUrl="/candidate-avatar.jpg"
      />

      {/* Request Add / Correct Voter Modal */}
      <RequestAddVoterModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        mode={requestModalMode}
        initialData={correctionInitialData || undefined}
      />
    </div>
  );
}
