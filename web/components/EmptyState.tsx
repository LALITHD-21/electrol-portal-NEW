'use client';

import React from 'react';
import Link from 'next/link';
import { SearchX, ArrowLeft } from 'lucide-react';
import { formatEpicForDisplay } from '@/lib/utils';

interface EmptyStateProps {
  epic: string;
}

export default function EmptyState({ epic }: EmptyStateProps) {
  const formatted = formatEpicForDisplay(epic);

  return (
    <div className="w-full max-w-lg mx-auto bg-white rounded-2xl border border-gray-200/60 p-8 md:p-12 text-center shadow-soft space-y-6 animate-scaleIn">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-600 border border-blue-100/60 shadow-sm">
        <SearchX className="w-8 h-8" />
      </div>

      <div className="space-y-2.5">
        <h2 className="text-xl md:text-2xl font-extrabold text-gray-900">
          No Elector Found
        </h2>
        <p className="text-sm text-gray-500 font-medium">
          No voter record matches the EPIC number:
        </p>
        <div className="inline-block mt-2 px-4 py-2 bg-gray-50 rounded-xl epic-mono text-base font-bold text-gray-800 border border-gray-200/70 shadow-sm">
          {formatted || epic}
        </div>
      </div>

      <p className="text-xs text-gray-400 max-w-xs mx-auto leading-relaxed">
        Double-check the 10-character EPIC number for typos or missing digits and try again.
      </p>

      <div className="pt-2">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 focus:outline-none focus:ring-4 focus:ring-blue-200 transition-all duration-200 active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Search</span>
        </Link>
      </div>
    </div>
  );
}
