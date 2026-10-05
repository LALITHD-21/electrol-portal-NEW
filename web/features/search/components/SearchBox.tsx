'use client';

import React, { useRef, useState, useEffect } from 'react';
import {
  Search,
  X,
  Loader2,
  Sparkles,
  Phone,
  CreditCard,
  User,
  History,
  Trash2,
  Hash,
} from 'lucide-react';
import { normalizeEpic, isValidEpic } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import {
  getSearchHistory,
  clearSearchHistory,
  SearchHistoryItem,
} from '@/lib/searchHistory';
import { cn } from '@/lib/utils';

export interface SearchBoxProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  isFuzzy?: boolean;
  onToggleFuzzy?: () => void;
  onSelectRecent?: (item: SearchHistoryItem) => void;
  isLoading?: boolean;
  autoFocus?: boolean;
}

export function SearchBox({
  value,
  onChange,
  onClear,
  isFuzzy = false,
  onToggleFuzzy,
  onSelectRecent,
  isLoading = false,
  autoFocus = true,
}: SearchBoxProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [historyItems, setHistoryItems] = useState<SearchHistoryItem[]>([]);

  useEffect(() => {
    setHistoryItems(getSearchHistory());
  }, [value]);

  const handleClearHistory = (e: React.MouseEvent) => {
    e.stopPropagation();
    clearSearchHistory();
    setHistoryItems([]);
  };

  const trimmed = value.trim();
  const normalizedEpic = normalizeEpic(trimmed);

  // Detect mode
  const isEpic = isValidEpic(normalizedEpic);
  const isMobile = /^\d{10}$/.test(trimmed.replace(/\D/g, ''));
  const isName = trimmed.length > 0 && !isEpic && !isMobile;

  return (
    <div className="w-full space-y-2.5">
      <div className="relative group">
        {/* Glow backdrop on focus */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500/20 to-violet-500/20 rounded-2xl blur-sm opacity-0 group-focus-within:opacity-100 transition duration-300" />

        <div className="relative flex items-center bg-white rounded-2xl border border-slate-200 shadow-soft-sm group-focus-within:border-indigo-600 group-focus-within:ring-4 group-focus-within:ring-indigo-500/10 transition-all duration-200">
          {/* Leading Icon */}
          <div className="pl-4 pr-2 text-slate-400 group-focus-within:text-indigo-600 transition">
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
            ) : (
              <Search className="w-5 h-5" />
            )}
          </div>

          {/* Main Input */}
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            autoFocus={autoFocus}
            placeholder="Search by Voter Name, 10-digit Mobile, or EPIC Number..."
            className="w-full py-3.5 pr-12 text-sm sm:text-base font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-normal bg-transparent focus:outline-none"
          />

          {/* Clear Button */}
          {value && (
            <button
              type="button"
              onClick={() => {
                onClear();
                inputRef.current?.focus();
              }}
              aria-label="Clear search input"
              className="absolute right-3 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition active:scale-95"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Sub-bar: Status Pill + Fuzzy Search Toggle Switch */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs">
        {/* Left: Mode Indicators */}
        <div className="flex items-center gap-2">
          {trimmed.length > 0 ? (
            <>
              <span className="text-slate-400 font-medium">Mode:</span>
              {isEpic && (
                <Badge variant="indigo" size="sm">
                  <CreditCard className="w-3 h-3" />
                  <span>EPIC Mode (Instant 0 ms)</span>
                </Badge>
              )}
              {isMobile && (
                <Badge variant="emerald" size="sm">
                  <Phone className="w-3 h-3" />
                  <span>Mobile Search</span>
                </Badge>
              )}
              {isName && (
                <Badge variant="slate" size="sm">
                  <User className="w-3 h-3" />
                  <span>Name Search</span>
                </Badge>
              )}
            </>
          ) : (
            <span className="text-slate-400">Search voters across Karnataka electoral roll</span>
          )}
        </div>

        {/* Right: Fuzzy Search Toggle */}
        {onToggleFuzzy && (
          <button
            type="button"
            onClick={onToggleFuzzy}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all duration-200 border',
              isFuzzy
                ? 'bg-amber-50 text-amber-800 border-amber-300 shadow-2xs'
                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
            )}
          >
            <Sparkles className={cn('w-3.5 h-3.5', isFuzzy ? 'text-amber-600' : 'text-slate-400')} />
            <span>Fuzzy / Typo-tolerant</span>
            <span
              className={cn(
                'ml-1 px-1.5 py-0.2 rounded-md text-[10px] font-extrabold uppercase',
                isFuzzy ? 'bg-amber-200/80 text-amber-900' : 'bg-slate-100 text-slate-500'
              )}
            >
              {isFuzzy ? 'ON' : 'OFF'}
            </span>
          </button>
        )}
      </div>

      {/* Recent Searches Chips (when input is empty) */}
      {!trimmed && historyItems.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1 px-1">
          <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 mr-1">
            <History className="w-3 h-3 text-slate-400" />
            <span>Recent:</span>
          </div>

          {historyItems.map((item, idx) => (
            <button
              key={`${item.query}-${idx}`}
              type="button"
              onClick={() => onSelectRecent?.(item)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/50 hover:text-indigo-700 transition shadow-2xs group"
            >
              {item.type === 'epic' && <CreditCard className="w-3 h-3 text-indigo-500" />}
              {item.type === 'mobile' && <Phone className="w-3 h-3 text-emerald-500" />}
              {item.type === 'booth' && <Hash className="w-3 h-3 text-amber-500" />}
              {item.type === 'name' && <User className="w-3 h-3 text-slate-400" />}
              <span>{item.label || item.query}</span>
            </button>
          ))}

          <button
            type="button"
            onClick={handleClearHistory}
            title="Clear search history"
            className="p-1 text-slate-300 hover:text-rose-500 transition ml-1"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}
