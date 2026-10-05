'use client';

import React, { Suspense, useState } from 'react';
import {
  RotateCw,
  Clock,
  Sparkles,
  AlertCircle,
  Briefcase,
  GraduationCap,
  Shield,
  Layers,
  BarChart3,
  ShieldAlert,
  GitCompare,
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
    handleFilterChange,
    handleResetFilters,
    handleCrossFilter,
    refresh,
  } = useAnalytics();

  // Format last updated timestamp
  const formattedUpdated = lastRefreshed
    ? new Date(lastRefreshed).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : 'Live';

  return (
    <div className="flex-1 bg-slate-50/60 text-slate-900 min-h-screen">
      {/* Top Bar Header */}
      <div className="border-b border-slate-200/80 bg-white/90 backdrop-blur-md sticky top-16 sm:top-20 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-200 shadow-2xs">
              <Layers className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                  Electoral Analytics & Strategic Intelligence
                </h1>
                {stats?.isFiltered && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Filtered
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                100% SQL-reconciled constituency roll analytics • Antigravity v4.0
              </p>
            </div>
          </div>

          {/* Module Mode Navigation Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 border border-slate-200 rounded-xl">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === 'overview'
                  ? 'bg-white text-indigo-700 shadow-2xs border border-slate-200'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Overview</span>
            </button>

            <button
              onClick={() => setActiveTab('quality')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === 'quality'
                  ? 'bg-white text-indigo-700 shadow-2xs border border-slate-200'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Data Quality</span>
            </button>

            <button
              onClick={() => setActiveTab('compare')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === 'compare'
                  ? 'bg-white text-indigo-700 shadow-2xs border border-slate-200'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <GitCompare className="w-3.5 h-3.5" />
              <span>Compare</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Error Alert if any */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center gap-3 text-rose-800 text-sm shadow-xs">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
            <div>
              <span className="font-bold">Analytics Error: </span>
              {error}
            </div>
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
              onFilterChange={handleFilterChange}
              onResetFilters={handleResetFilters}
              onRefresh={refresh}
            />

            {/* Row 2: Visual Demographic Breakdown (District Strength Top-Left, Gender Donut Top-Right) */}
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

            {/* Row 3: Cohort Distributions (Age Demographics, Top Qualifications, Top Occupations) */}
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
                data={stats?.occupations || []}
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
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-slate-500 font-semibold">Initializing Electoral Intelligence...</span>
          </div>
        </div>
      }
    >
      <AnalyticsDashboardContent />
    </Suspense>
  );
}
