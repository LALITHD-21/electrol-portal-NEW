'use client';

import React, { Suspense, useState } from 'react';
import {
  Sparkles,
  AlertCircle,
  Briefcase,
  GraduationCap,
  Shield,
  Layers,
  BarChart3,
  ShieldAlert,
  GitCompare,
  RotateCw,
} from 'lucide-react';
import { useAnalytics } from '@/features/analytics/hooks/useAnalytics';
import { HierarchyTiles } from '@/features/analytics/components/HierarchyTiles';
import { KpiTiles } from '@/features/analytics/components/KpiTiles';
import { FilterBar } from '@/features/analytics/components/FilterBar';
import { GenderDonutChart } from '@/features/analytics/components/GenderDonutChart';
import { AgePyramidChart } from '@/features/analytics/components/AgePyramidChart';
import { DistrictStrengthChart } from '@/features/analytics/components/DistrictStrengthChart';
import { TopDistributionChart } from '@/features/analytics/components/TopDistributionChart';
import { BoothTable } from '@/features/analytics/components/BoothTable';
import { DataQualityPanel } from '@/features/analytics/components/DataQualityPanel';
import { CompareView } from '@/features/analytics/components/CompareView';
import { LiveActivityStrip } from '@/features/analytics/components/LiveActivityStrip';
import { normalizeOccupations } from '@/features/analytics/utils/normalizeOccupations';

function AnalyticsDashboardContent() {
  const [activeTab, setActiveTab] = useState<'overview' | 'quality' | 'compare'>('overview');

  const {
    stats,
    filters,
    isLoading,
    isRefreshing,
    error,
    lastRefreshed,
    activeFilterCount,
    liveData,
    liveStatus,
    lastSyncAt,
    handleFilterChange,
    handleResetFilters,
    handleCrossFilter,
    refresh,
  } = useAnalytics();

  return (
    <div className="flex-1 bg-slate-50/70 bg-tech-grid text-slate-900 min-h-screen relative overflow-hidden">
      {/* Interactive Ambient Glow Lighting Orbs */}
      <div className="absolute top-12 left-1/4 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-gradient-to-br from-brand-300/20 via-indigo-200/15 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-10 w-[600px] h-[600px] rounded-full bg-gradient-to-tl from-emerald-300/15 via-sky-200/15 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-1/3 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-violet-300/15 via-pink-200/10 to-transparent blur-3xl pointer-events-none" />

      {/* Top Bar Header */}
      <div className="border-b border-slate-200/80 bg-white/95 backdrop-blur-xl relative sm:sticky sm:top-20 z-10 sm:z-sticky shadow-2xs">
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-3 sm:py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="p-2 sm:p-2.5 rounded-2xl bg-brand-50 border border-brand-200 shadow-2xs text-brand-600 flex-shrink-0">
              <Layers className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-sm sm:text-lg font-extrabold text-slate-900 tracking-tight">
                  Electoral Analytics &amp; Strategic Intelligence
                </h1>
                {stats?.isFiltered && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
                    Filtered
                  </span>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5 truncate">
                Constituency Demographic Intelligence • 151 Polling Stations Verified Roll
              </p>
            </div>
          </div>

          {/* Module Mode Navigation Tabs (3-column grid on mobile, flex on desktop) */}
          <div className="grid grid-cols-3 sm:flex items-center gap-1 sm:gap-1.5 p-1 bg-slate-100 border border-slate-200 rounded-xl w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-2 sm:py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === 'overview'
                  ? 'bg-white text-brand-700 shadow-2xs border border-slate-200 font-extrabold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Overview</span>
            </button>

            <button
              onClick={() => setActiveTab('quality')}
              className={`flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-2 sm:py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === 'quality'
                  ? 'bg-white text-brand-700 shadow-2xs border border-slate-200 font-extrabold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">Data Quality</span>
            </button>

            <button
              onClick={() => setActiveTab('compare')}
              className={`flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-2 sm:py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === 'compare'
                  ? 'bg-white text-brand-700 shadow-2xs border border-slate-200 font-extrabold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <GitCompare className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Compare</span>
            </button>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Real-Time Live Activity Strip */}
        <LiveActivityStrip
          liveData={liveData}
          liveStatus={liveStatus}
          lastSyncAt={lastSyncAt}
          totals={stats?.totals}
          isLoading={isLoading && !stats}
        />

        {/* Error Alert with Retry button if any */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center justify-between gap-3 text-rose-800 text-sm shadow-xs">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
              <div>
                <span className="font-bold">Analytics Connection Alert: </span>
                {error}
              </div>
            </div>
            <button
              onClick={refresh}
              className="btn-secondary !bg-white !text-rose-700 !border-rose-300 text-xs py-1 px-3"
            >
              <RotateCw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {activeTab === 'overview' && (
          <>
            {/* Row 1: 7 Hierarchy Tiles */}
            <HierarchyTiles hierarchy={stats?.hierarchy} isLoading={isLoading && !stats} />

            {/* Row 1b: 7 Reconciled KPI Tiles */}
            <KpiTiles
              totals={stats?.totals}
              coverage={stats?.coverage}
              duplicates={stats?.duplicates}
              isLoading={isLoading && !stats}
            />

            {/* Sticky Filter Bar */}
            <FilterBar
              filters={filters}
              activeFilterCount={activeFilterCount}
              lastRefreshed={lastRefreshed}
              isRefreshing={isRefreshing}
              liveStatus={liveStatus}
              lastSyncAt={lastSyncAt}
              onFilterChange={handleFilterChange}
              onResetFilters={handleResetFilters}
              onRefresh={refresh}
            />

            {/* Row 2: Visual Demographic Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2">
                <DistrictStrengthChart
                  districts={stats?.district_strength || []}
                  selectedDistrict={filters.district}
                  onSelectDistrict={(dist) => handleCrossFilter('district', dist)}
                  isLoading={isLoading && !stats}
                />
              </div>
              <div className="lg:col-span-1">
                <GenderDonutChart
                  totals={stats?.totals || { total: 0, male: 0, female: 0, unspecified: 0 }}
                  isLoading={isLoading && !stats}
                />
              </div>
            </div>

            {/* Row 3: Cohort Distributions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Age Demographics */}
              <AgePyramidChart
                brackets={stats?.age_brackets || []}
                isLoading={isLoading && !stats}
              />

              {/* Top Qualifications */}
              <TopDistributionChart
                title="Top Qualifications"
                subtitle="Graduate degrees breakdown in MLC roll"
                icon={GraduationCap}
                data={stats?.qualifications || []}
                colorTheme="amber"
                isLoading={isLoading && !stats}
              />

              {/* Top Occupations */}
              <TopDistributionChart
                title="Top Occupations"
                subtitle="Leading professions among registered voters"
                icon={Briefcase}
                data={normalizeOccupations(stats?.occupations)}
                colorTheme="purple"
                isLoading={isLoading && !stats}
              />
            </div>

            {/* Caste Intelligence (Admin Only) */}
            {stats?.caste_majority && (
              <div className="grid grid-cols-1 gap-5">
                <TopDistributionChart
                  title="Caste Distribution"
                  subtitle="Aggregate community breakdown (Admin Only)"
                  icon={Shield}
                  data={stats.caste_majority}
                  colorTheme="emerald"
                  adminOnly={true}
                  maxItems={8}
                  multiColor={true}
                  isLoading={isLoading && !stats}
                />
              </div>
            )}

            {/* Row 4: 151 Polling Booths Operations Directory */}
            <BoothTable
              districtFilter={filters.district}
              acFilter={filters.ac}
            />
          </>
        )}

        {activeTab === 'quality' && <DataQualityPanel />}

        {activeTab === 'compare' && <CompareView />}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 bg-slate-50 min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-slate-500 font-semibold">Initializing Electoral Intelligence...</span>
          </div>
        </div>
      }
    >
      <AnalyticsDashboardContent />
    </Suspense>
  );
}
