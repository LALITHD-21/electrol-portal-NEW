'use client';

import React from 'react';
import { SearchResultRow } from '../types';
import { formatEpicForDisplay } from '@/lib/utils';
import { resolveElectorLocation, resolveElectorSerialNumber } from '@/lib/boothMaster';
import { ChevronRight } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export interface SearchRowProps {
  row: SearchResultRow;
  searchQuery: string;
  onSelect?: (row: SearchResultRow) => void;
}

function HighlightText({ text, query }: { text: string | null | undefined; query: string }) {
  if (!text) return null;
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 2) return <span>{text}</span>;

  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));

  return (
    <span>
      {parts.map((part, idx) =>
        part.toLowerCase() === trimmed.toLowerCase() ? (
          <mark
            key={idx}
            className="bg-blue-100 text-blue-950 rounded-xs px-0.5 font-bold"
          >
            {part}
          </mark>
        ) : (
          <span key={idx}>{part}</span>
        )
      )}
    </span>
  );
}

export function SearchRow({ row, searchQuery, onSelect }: SearchRowProps) {
  const { t } = useLanguage();

  const handleClick = () => {
    if (onSelect) {
      onSelect(row);
    }
  };

  const loc = resolveElectorLocation(row);
  const partNo = row.part_number || '1';
  const serialNo = resolveElectorSerialNumber(row);
  const talukCity = row.taluk || loc.taluk || loc.district || 'Tumkur';
  const areaText = [
    row.polling_station_name,
    row.village || row.address,
  ].filter(Boolean).join(' · ') || `${loc.taluk}, ${loc.district}`;

  return (
    <div
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      className="group relative bg-white hover:bg-gradient-to-br hover:from-white hover:to-blue-50/40 rounded-2xl border border-slate-200/90 hover:border-blue-400/80 p-3.5 sm:p-4 transition-all duration-200 shadow-2xs hover:shadow-card-hover cursor-pointer text-left w-full h-full flex flex-col justify-between select-none"
    >
      <div className="space-y-2 min-w-0">
        {/* Top: Elector Name & Relative */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h4 className="text-sm sm:text-base font-black text-slate-900 group-hover:text-blue-700 transition truncate leading-snug">
              <HighlightText text={row.name} query={searchQuery} />
            </h4>
            <p className="text-[11.5px] text-slate-600 font-medium truncate mt-0.5">
              {t.fatherSpouseLabel} <HighlightText text={row.relative_name || '—'} query={searchQuery} />
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-0.5" />
        </div>

        {/* EPIC Badge + Taluk Chip */}
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <span className="font-mono font-black text-xs text-blue-950 bg-blue-50/90 border border-blue-200/80 px-2 py-0.5 rounded-md">
            <HighlightText text={formatEpicForDisplay(row.epic_number)} query={searchQuery} />
          </span>
          <span className="font-sans font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
            {talukCity}
          </span>
        </div>
      </div>

      {/* Bottom: Part & Serial numbers + Polling Area */}
      <div className="pt-2.5 mt-2.5 border-t border-slate-100/90 space-y-1.5">
        <div className="flex items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/70">
            {t.partLabelShort} <strong className="text-blue-700 font-black">{partNo}</strong>
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/70">
            {t.serialLabelShort} <strong className="text-blue-700 font-black">{serialNo}</strong>
          </span>
        </div>

        {areaText && (
          <p className="text-[11px] text-slate-500 font-medium truncate flex items-center gap-1.5" title={areaText}>
            <img
              src="/location-pin.png"
              alt="Location"
              className="w-3.5 h-3.5 shrink-0 object-contain inline-block"
            />
            <span className="truncate">{areaText}</span>
          </p>
        )}
      </div>
    </div>
  );
}

export default SearchRow;
