'use client';

import React, { Suspense, useState } from 'react';
import { useSearch } from '@/features/search/hooks/useSearch';
import { SearchBox } from '@/features/search/components/SearchBox';
import { SearchFilters } from '@/features/search/components/SearchFilters';
import { SearchResults } from '@/features/search/components/SearchResults';
import { CandidateHeroBanner } from '@/components/candidate/CandidateHeroBanner';
import { RequestAddVoterModal } from '@/components/requests/RequestAddVoterModal';
import { Loader2 } from 'lucide-react';

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
    isExporting,
    error,
    handleQueryChange,
    handleFilterChange,
    handleToggleFuzzy,
    handleClearFilters,
    handleClearAll,
    handlePageChange,
    handleRecentSelect,
    exportToCsv,
  } = useSearch();

  const hasQueryOrFilter = Boolean(
    query.trim() ||
      filters.part ||
      filters.ac ||
      filters.district ||
      filters.village
  );

  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

  return (
    <div className="flex-1 flex flex-col items-center justify-start p-3 sm:p-6 lg:p-8 max-w-5xl w-full mx-auto space-y-5">
      {/* Executive Candidate / Party Member Profile Banner (Light Blue Theme) */}
      <CandidateHeroBanner
        onRequestAddVoter={() => setIsRequestModalOpen(true)}
        candidateName="Party Member / Candidate"
        candidateTitle="Official Candidate • Karnataka Legislative Council"
        constituencyName="South-East & Central Karnataka Constituency"
      />

      {/* Main Search Box */}
      <div className="w-full space-y-3">
        <SearchBox
          value={query}
          onChange={handleQueryChange}
          onClear={() => handleQueryChange('')}
          isFuzzy={filters.fuzzy}
          onToggleFuzzy={handleToggleFuzzy}
          onSelectRecent={handleRecentSelect}
          isLoading={isLoading}
          autoFocus={true}
        />

        {/* Collapsible Advanced Filters (District, AC, Part, Village) */}
        <SearchFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
        />
      </div>

      {/* Live Search Results List */}
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
          isExporting={isExporting}
          error={error}
          searchQuery={query}
          hasQueryOrFilter={hasQueryOrFilter}
          onPageChange={handlePageChange}
          onReset={handleClearAll}
          onExportCsv={exportToCsv}
          onRequestAddVoter={() => setIsRequestModalOpen(true)}
        />
      </div>

      {/* Request to Add Voter Modal */}
      <RequestAddVoterModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
      />
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
