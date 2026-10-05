'use client';

import React from 'react';
import Link from 'next/link';
import { SearchResultRow } from '../types';
import { formatEpicForDisplay } from '@/lib/utils';
import { MaskedPhone } from '@/components/ui/MaskedPhone';
import { Badge } from '@/components/ui/Badge';
import { User, Users, MapPin, Hash, Building2, ArrowRight } from 'lucide-react';

export interface SearchRowProps {
  row: SearchResultRow;
  searchQuery: string;
}

// Helper to highlight matching substrings
function HighlightText({ text, query }: { text: string | null | undefined; query: string }) {
  if (!text) return null;
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 2) return <span>{text}</span>;

  // Escape special regex characters
  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));

  return (
    <span>
      {parts.map((part, idx) =>
        part.toLowerCase() === trimmed.toLowerCase() ? (
          <mark
            key={idx}
            className="bg-amber-200/80 text-slate-900 rounded-xs px-0.5 font-bold"
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
    <div className="group relative bg-white hover:bg-indigo-50/30 rounded-2xl border border-slate-200/90 hover:border-indigo-300 p-4 sm:p-5 transition-all duration-200 shadow-2xs hover:shadow-soft-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left Column: Personal Info */}
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={profileUrl}
              className="text-base sm:text-lg font-extrabold text-slate-900 group-hover:text-indigo-600 transition truncate"
            >
              <HighlightText text={row.name} query={searchQuery} />
            </Link>

            <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
              <HighlightText text={formatEpicForDisplay(row.epic_number)} query={searchQuery} />
            </span>

            {row.serial_number && (
              <Badge variant="slate" size="sm">
                Sl #{row.serial_number}
              </Badge>
            )}
          </div>

          {/* Relative & Demographic Info */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-medium">
            {row.relative_name && (
              <span className="flex items-center gap-1 text-slate-600">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  S/O, W/O:{' '}
                  <strong className="text-slate-700">
                    <HighlightText text={row.relative_name} query={searchQuery} />
                  </strong>
                </span>
              </span>
            )}

            {row.age && (
              <span>
                Age: <strong className="text-slate-700">{row.age} yrs</strong>
              </span>
            )}

            {row.sex && (
              <span>
                Gender:{' '}
                <strong className="text-slate-700">
                  {row.sex === 'M' ? 'Male' : row.sex === 'F' ? 'Female' : row.sex}
                </strong>
              </span>
            )}

            {row.whatsapp_mob && (
              <div className="flex items-center gap-1">
                <span className="text-slate-400">Mobile:</span>
                <MaskedPhone phone={row.whatsapp_mob} />
              </div>
            )}
          </div>

          {/* Location & Polling Booth */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 pt-0.5">
            {row.part_number && (
              <span className="flex items-center gap-1 font-semibold text-indigo-700">
                <Hash className="w-3 h-3 text-indigo-500" />
                <span>Part {row.part_number}</span>
              </span>
            )}

            {row.polling_station_name && (
              <span className="flex items-center gap-1 truncate max-w-xs sm:max-w-md text-slate-600">
                <Building2 className="w-3 h-3 text-slate-400 flex-shrink-0" />
                <span className="truncate">{row.polling_station_name}</span>
              </span>
            )}

            {row.village && (
              <span className="flex items-center gap-1 text-slate-500">
                <MapPin className="w-3 h-3 text-slate-400" />
                <span>{row.village}</span>
              </span>
            )}
          </div>
        </div>

        {/* Right Column: View Profile Action */}
        <div className="flex items-center sm:self-center flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
          <Link
            href={profileUrl}
            className="inline-flex items-center justify-center gap-1.5 w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-600 hover:text-white transition-all duration-200 active:scale-95"
          >
            <span>View Profile</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
