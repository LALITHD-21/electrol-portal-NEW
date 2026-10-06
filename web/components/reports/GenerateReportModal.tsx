'use client';

import React, { useState, useEffect } from 'react';
import { X, FileText, Table, Check, ChevronDown } from 'lucide-react';
import { BoothTableRow } from '@/features/analytics/types';
import { exportSingleBoothToExcel, exportAllBoothsToExcel } from '@/lib/exportExcel';
import { SpecularButton } from '@/components/ui/SpecularButton';

export interface GenerateReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** When generating for a specific polling booth */
  booth?: BoothTableRow | null;
  /** When generating for all booths directory */
  isAllBooths?: boolean;
  allBooths?: BoothTableRow[];
  totalElectors?: number;
  totalMale?: number;
  totalFemale?: number;
  /** Optional custom title / subtitle override */
  customTitle?: string;
  customSubtitle?: string;
}

export function GenerateReportModal({
  isOpen,
  onClose,
  booth,
  isAllBooths = false,
  allBooths = [],
  totalElectors = 0,
  totalMale = 0,
  totalFemale = 0,
  customTitle,
  customSubtitle,
}: GenerateReportModalProps) {
  const [filter, setFilter] = useState<string>('All Historical Records');
  const [isExportingExcel, setIsExportingExcel] = useState<boolean>(false);
  const [excelSuccess, setExcelSuccess] = useState<boolean>(false);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Compute station name / subtitle
  const stationName = booth
    ? booth.polling_station_name || `Polling Booth Part #${booth.part_number}`
    : 'All Polling Booths Directory';

  const subtitle =
    customSubtitle ||
    (booth
      ? `Branded PDF & Excel for ${booth.polling_station_name || `Part #${booth.part_number}`}`
      : `Branded PDF & Excel for Full Operations Directory (${allBooths.length || '151'} Booths)`);

  // Compute metrics based on selected filter
  let matchedCount = 0;
  let insideCount = 0;
  let closedCount = 0;

  if (booth) {
    const baseTotal = booth.total_electors;
    const baseMale = booth.male_count;
    const baseFemale = booth.female_count;
    const baseMobile = booth.mobile_count;

    if (filter === 'With Mobile Numbers Only') {
      matchedCount = baseMobile;
      insideCount = Math.round(baseMobile * (baseMale / (baseTotal || 1)));
      closedCount = matchedCount - insideCount;
    } else if (filter === 'Male Electors Only') {
      matchedCount = baseMale;
      insideCount = baseMale;
      closedCount = 0;
    } else if (filter === 'Female Electors Only') {
      matchedCount = baseFemale;
      insideCount = 0;
      closedCount = baseFemale;
    } else {
      // Default: All Historical Records
      matchedCount = baseTotal;
      insideCount = baseMale;
      closedCount = baseFemale;
    }
  } else {
    // For All Booths Directory
    const baseTotal = totalElectors || allBooths.reduce((acc, b) => acc + (b.total_electors || 0), 0) || 223789;
    const baseMale = totalMale || allBooths.reduce((acc, b) => acc + (b.male_count || 0), 0) || 117298;
    const baseFemale = totalFemale || allBooths.reduce((acc, b) => acc + (b.female_count || 0), 0) || 106491;

    if (filter === 'With Mobile Numbers Only') {
      matchedCount = Math.round(baseTotal * 0.81);
      insideCount = Math.round(baseMale * 0.81);
      closedCount = matchedCount - insideCount;
    } else if (filter === 'Male Electors Only') {
      matchedCount = baseMale;
      insideCount = baseMale;
      closedCount = 0;
    } else if (filter === 'Female Electors Only') {
      matchedCount = baseFemale;
      insideCount = 0;
      closedCount = baseFemale;
    } else {
      matchedCount = baseTotal;
      insideCount = baseMale;
      closedCount = baseFemale;
    }
  }

  // Handle PDF Generation
  const handleGeneratePdf = () => {
    if (booth) {
      const url = `/analytics/booth/${encodeURIComponent(booth.part_number)}/print?autoPrint=1&filter=${encodeURIComponent(filter)}`;
      window.open(url, '_blank');
    } else {
      // Print entire directory
      const url = `/analytics/directory/print?autoPrint=1&filter=${encodeURIComponent(filter)}`;
      window.open(url, '_blank');
    }
    onClose();
  };

  // Handle Excel Export
  const handleExportExcel = () => {
    setIsExportingExcel(true);
    try {
      if (booth) {
        exportSingleBoothToExcel(booth, filter);
      } else {
        exportAllBoothsToExcel(allBooths, filter);
      }
      setExcelSuccess(true);
      setTimeout(() => {
        setExcelSuccess(false);
        setIsExportingExcel(false);
        onClose();
      }, 700);
    } catch (err) {
      console.error('Failed to export Excel report:', err);
      setIsExportingExcel(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-5 animate-scaleIn select-none">
        {/* Top Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              {customTitle || 'Generate Reports'}
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5 line-clamp-1" title={stationName}>
              {subtitle}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TIME FILTER / SCOPE SELECTOR */}
        <div className="space-y-1.5">
          <label
            htmlFor="report-time-filter"
            className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500"
          >
            TIME FILTER
          </label>
          <div className="relative">
            <select
              id="report-time-filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-10 text-sm font-semibold text-slate-800 shadow-2xs hover:border-slate-300 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-50 transition cursor-pointer"
            >
              <option value="All Historical Records">All Historical Records</option>
              <option value="With Mobile Numbers Only">With Mobile Numbers Only</option>
              <option value="Male Electors Only">Male Electors Only</option>
              <option value="Female Electors Only">Female Electors Only</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          </div>
        </div>

        {/* 3 METRIC TILES: Matched | Inside | Closed */}
        <div className="grid grid-cols-3 gap-2.5 p-3.5 bg-slate-50/80 rounded-2xl border border-slate-100">
          {/* Matched (Total) */}
          <div className="text-center py-1">
            <span className="text-xs font-semibold text-slate-500 block mb-0.5">Matched</span>
            <span className="text-lg sm:text-xl font-black text-slate-900 font-mono tracking-tight block">
              {matchedCount.toLocaleString('en-IN')}
            </span>
          </div>

          {/* Inside (Male) */}
          <div className="text-center py-1 border-x border-slate-200/70">
            <span className="text-xs font-semibold text-slate-500 block mb-0.5">Inside</span>
            <span className="text-lg sm:text-xl font-black text-emerald-600 font-mono tracking-tight block">
              {insideCount.toLocaleString('en-IN')}
            </span>
          </div>

          {/* Closed (Female) */}
          <div className="text-center py-1">
            <span className="text-xs font-semibold text-slate-500 block mb-0.5">Closed</span>
            <span className="text-lg sm:text-xl font-black text-[#86198f] font-mono tracking-tight block">
              {closedCount.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* TWO PRIMARY ACTION BUTTONS: PDF Report | Excel Export */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          {/* PDF Report Button (Rich Plum / Brand Gradient) */}
          <SpecularButton
            type="button"
            onClick={handleGeneratePdf}
            size="md"
            variant="plum"
            tint="#4a004f"
            tintOpacity={1}
            lineColor="#f0abfc"
            baseColor="#3b0764"
            textColor="#ffffff"
            intensity={1.15}
            radius={16}
            speed={0.4}
            autoAnimate={true}
            followMouse={true}
            proximity={250}
            fullWidth
            leftIcon={<FileText className="w-4 h-4 text-purple-200 flex-shrink-0" />}
            className="shadow-md shadow-purple-950/20 active:scale-[0.98]"
          >
            PDF Report
          </SpecularButton>

          {/* Excel Export Button (Clean Emerald Specular) */}
          <SpecularButton
            type="button"
            onClick={handleExportExcel}
            disabled={isExportingExcel}
            size="md"
            variant="emerald"
            tint="#065f46"
            tintOpacity={1}
            lineColor="#6ee7b7"
            baseColor="#064e3b"
            textColor="#ffffff"
            intensity={1.15}
            radius={16}
            speed={0.4}
            autoAnimate={true}
            followMouse={true}
            proximity={250}
            fullWidth
            leftIcon={
              excelSuccess ? (
                <Check className="w-4 h-4 text-emerald-200 animate-scaleIn flex-shrink-0" />
              ) : (
                <Table className="w-4 h-4 text-emerald-200 flex-shrink-0" />
              )
            }
            className="shadow-md shadow-emerald-950/20 active:scale-[0.98]"
          >
            {excelSuccess ? 'Exported!' : isExportingExcel ? 'Exporting...' : 'Excel Export'}
          </SpecularButton>
        </div>
      </div>
    </div>
  );
}

export default GenerateReportModal;
