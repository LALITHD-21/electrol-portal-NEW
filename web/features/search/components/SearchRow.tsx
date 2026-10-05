'use client';

import React from 'react';
import Link from 'next/link';
import { SearchResultRow } from '../types';
import { formatEpicForDisplay } from '@/lib/utils';
import { MaskedPhone } from '@/components/ui/MaskedPhone';
import { Badge } from '@/components/ui/Badge';
import { Users, MapPin, Hash, Building2, ChevronRight, Phone, MessageSquare } from 'lucide-react';

export interface SearchRowProps {
  row: SearchResultRow;
  searchQuery: string;
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
            className="bg-amber-200 text-slate-950 rounded-xs px-0.5 font-bold"
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

export function SearchRow({ row, searchQuery }: SearchRowProps) {
  const profileUrl = `/profile/${encodeURIComponent(row.epic_number)}`;

  return (
    <div className="group relative bg-white hover:bg-slate-50/70 rounded-2xl border border-slate-200/90 hover:border-brand-300 p-4 sm:p-5 transition-all duration-200 shadow-2xs hover:shadow-card-hover min-w-0">
      {/* Tappable Card area linking to profile */}
      <div className="flex flex-col gap-3 min-w-0">
        {/* Top Header: Voter Name & EPIC Card Badge */}
        <div className="flex items-start justify-between gap-2 min-w-0">
          <div className="min-w-0 flex-1">
            <Link
              href={profileUrl}
              className="text-base sm:text-lg font-black text-slate-900 group-hover:text-brand-600 transition truncate block leading-snug"
            >
              <HighlightText text={row.name} query={searchQuery} />
            </Link>
            {row.relative_name && (
              <p className="text-xs text-slate-500 font-medium truncate mt-0.5 flex items-center gap-1">
                <Users className="w-3 h-3 text-slate-400 flex-shrink-0" />
                <span>
                  Rel: <HighlightText text={row.relative_name} query={searchQuery} />
                </span>
              </p>
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="epic-mono text-xs font-black text-brand-700 bg-brand-50 px-2.5 py-1 rounded-xl border border-brand-200/80 shadow-2xs select-all">
              <HighlightText text={formatEpicForDisplay(row.epic_number)} query={searchQuery} />
            </span>
            <Link
              href={profileUrl}
              aria-label={`View profile of ${row.name}`}
              className="p-1.5 text-slate-400 hover:text-brand-600 active:bg-slate-100 rounded-xl transition flex items-center justify-center min-h-[36px] min-w-[36px]"
            >
              <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Demographics row: Age, Gender, Serial Number */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 pt-0.5">
          {row.serial_number !== null && row.serial_number !== undefined && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-indigo-50 border border-indigo-200/90 text-indigo-700 font-mono font-extrabold text-[11px] shadow-2xs">
              <span className="text-[10px] uppercase font-semibold text-indigo-500">Index</span>
              <span>#{row.serial_number}</span>
            </span>
          )}

          {row.age && (
            <span className="px-2 py-0.5 bg-slate-100 rounded-lg text-slate-700 font-semibold font-mono text-[11px]">
              {row.age} yrs
            </span>
          )}

          {row.sex && (
            <span className="px-2 py-0.5 bg-slate-100 rounded-lg text-slate-700 font-semibold text-[11px]">
              {row.sex === 'M' ? 'Male' : row.sex === 'F' ? 'Female' : row.sex}
            </span>
          )}

          {row.part_number && (
            <span className="inline-flex items-center gap-1 text-brand-700 font-bold font-mono text-[11px]">
              <Hash className="w-3 h-3 text-brand-500" />
              <span>Part {row.part_number}</span>
            </span>
          )}
        </div>

        {/* Polling Booth & Location */}
        <div className="space-y-1 text-xs text-slate-500 border-t border-slate-100 pt-2 min-w-0">
          {row.polling_station_name && (
            <div className="flex items-start gap-1.5 min-w-0">
              <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
              <span className="truncate text-slate-700 font-medium">
                {row.polling_station_name}
              </span>
            </div>
          )}

          {row.village && (
            <div className="flex items-center gap-1.5 min-w-0">
              <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span className="truncate text-slate-500">{row.village}</span>
            </div>
          )}
        </div>

        {/* Mobile Contact Row (Tap to reveal phone / Quick Call / WhatsApp) */}
        {row.whatsapp_mob && (
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <span className="text-slate-400 text-[11px]">Phone:</span>
              <MaskedPhone phone={row.whatsapp_mob} />
            </div>

            <div className="flex items-center gap-1.5">
              <a
                href={`tel:${row.whatsapp_mob}`}
                aria-label={`Call ${row.name}`}
                className="p-2 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 active:scale-95 rounded-xl border border-emerald-200/80 min-h-[40px] min-w-[40px] flex items-center justify-center transition"
              >
                <Phone className="w-4 h-4" />
              </a>
              <a
                href={`https://wa.me/91${row.whatsapp_mob.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`WhatsApp ${row.name}`}
                className="p-2 text-emerald-800 bg-emerald-100 hover:bg-emerald-200 active:scale-95 rounded-xl border border-emerald-300 min-h-[40px] min-w-[40px] flex items-center justify-center transition"
              >
                <MessageSquare className="w-4 h-4" />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SearchRow;
