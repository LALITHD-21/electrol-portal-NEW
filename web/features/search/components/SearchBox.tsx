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
  ArrowRight,
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
  const [showHistory, setShowHistory] = useState(false);

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

  // Keyboard inputMode hint
  const inputMode = isMobile || /^\d+$/.test(trimmed) ? 'numeric' : 'text';

  return (
    <div className="w-full space-y-2">
      <div className="relative group">
        {/* Glow backdrop on focus */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-500/20 to-violet-500/20 rounded-2xl blur-xs opacity-0 group-focus-within:opacity-100 transition duration-300 pointer-events-none" />

        <div className="relative flex items-center bg-white rounded-2xl border border-slate-200 shadow-2xs group-focus-within:border-brand-500 group-focus-within:ring-4 group-focus-within:ring-brand-100 transition-all duration-200">
          {/* Leading Icon */}
          <div className="pl-3.5 pr-1.5 text-slate-400 group-focus-within:text-brand-600 transition flex items-center justify-center">
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-brand-600" />
            ) : (
              <Search className="w-5 h-5" />
            )}
          </div>

          {/* Main Input - min-h-[48px], text-[16px] mobile to prevent iOS zoom */}
          <input
            ref={inputRef}
            type="text"
            inputMode={inputMode}
            value={value}
            onChange={(e) => {
              const val = e.target.value;
              // If starts with letters, uppercase for convenience
              if (/^[A-Za-z]{1,3}\d*/.test(val)) {
                onChange(val.toUpperCase());
              } else {
                onChange(val);
              }
            }}
            onFocus={() => {
              if (!value && historyItems.length > 0) setShowHistory(true);
            }}
            onBlur={() => {
              // Delay to allow clicking history item
              setTimeout(() => setShowHistory(false), 200);
            }}
            autoFocus={autoFocus}
            placeholder="Search Voter Name, 10-digit Mobile, or EPIC..."
            className="w-full min-h-[48px] py-3 pr-11 text-[16px] sm:text-base font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-normal bg-transparent focus:outline-none"
          />

          {/* Clear Button - min 44x44px target on mobile */}
          {value && (
            <button
              type="button"
              onClick={() => {
                onClear();
                inputRef.current?.focus();
              }}
              aria-label="Clear search input"
              className="absolute right-1.5 p-2 rounded-xl text-slate-400 hover:text-slate-600 active:bg-slate-100 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Dropdown for Recent Searches when input is empty */}
        {showHistory && !value && historyItems.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-2xl border border-slate-200/90 shadow-elevated z-dropdown p-2 animate-fade-in">
            <div className="flex items-center justify-between px-3 py-1.5 text-xs font-bold text-slate-500 border-b border-slate-100">
              <span className="flex items-center gap-1.5">
                <History className="w-3.5 h-3.5" />
                <span>Recent Searches</span>
              </span>
              <button
                type="button"
                onClick={handleClearHistory}
                className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold"
              >
                Clear
              </button>
            </div>
            <div className="max-h-56 overflow-y-auto divide-y divide-slate-50 py-1">
              {historyItems.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onMouseDown={() => {
                    if (onSelectRecent) onSelectRecent(item);
                    setShowHistory(false);
                  }}
                  className="w-full px-3 py-2 text-left flex items-center justify-between text-xs hover:bg-slate-50 active:bg-slate-100 rounded-xl transition"
                >
                  <span className="font-semibold text-slate-800 truncate">{item.query}</span>
                  <span className="text-[10px] text-slate-400 uppercase font-mono">
                    {item.type}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sub-bar: Mode Hints + Typo-tolerant Fuzzy Switch */}
      <div className="flex items-center justify-between gap-2 px-1 text-xs">
        {/* Left: Mode Badges */}
        <div className="flex items-center gap-1.5 min-w-0 overflow-x-auto py-0.5 no-scrollbar">
          {trimmed.length > 0 ? (
            <>
              {isEpic && (
                <Badge variant="indigo" size="sm" className="whitespace-nowrap">
                  <CreditCard className="w-3 h-3 flex-shrink-0" />
                  <span>EPIC Mode</span>
                </Badge>
              )}
              {isMobile && (
                <Badge variant="emerald" size="sm" className="whitespace-nowrap">
                  <Phone className="w-3 h-3 flex-shrink-0" />
                  <span>Mobile Mode</span>
                </Badge>
              )}
              {isName && (
                <Badge variant="slate" size="sm" className="whitespace-nowrap">
                  <User className="w-3 h-3 flex-shrink-0" />
                  <span>Name Mode</span>
                </Badge>
              )}
            </>
          ) : (
            <span className="text-slate-400 text-[11px] truncate">
              Type Name, Mobile, or EPIC
            </span>
          )}
        </div>

        {/* Right: Fuzzy Search Toggle (>=44px touch target) */}
        {onToggleFuzzy && (
          <button
            type="button"
            onClick={onToggleFuzzy}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex-shrink-0 border min-h-[36px]',
              isFuzzy
                ? 'bg-amber-50 text-amber-800 border-amber-300 shadow-2xs'
                : 'bg-white text-slate-600 border-slate-200 active:bg-slate-100'
            )}
          >
            <Sparkles
              className={cn('w-3.5 h-3.5 flex-shrink-0', isFuzzy ? 'text-amber-600' : 'text-slate-400')}
            />
            <span className="hidden xs:inline">Fuzzy</span>
            <span
              className={cn(
                'px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider',
                isFuzzy ? 'bg-amber-200/80 text-amber-900' : 'bg-slate-100 text-slate-500'
              )}
            >
              {isFuzzy ? 'ON' : 'OFF'}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
