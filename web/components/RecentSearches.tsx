'use client';

import React, { useState, useEffect } from 'react';
import { SearchHistoryItem, getSearchHistory, clearSearchHistory } from '@/lib/searchHistory';
import { History, Trash2, ArrowUpRight, Clock } from 'lucide-react';
import { formatEpicForDisplay } from '@/lib/utils';
import { AnimatedItem } from '@/components/ui/AnimatedList';

interface RecentSearchesProps {
  onSelectEpic: (epic: string) => void;
  refreshTrigger?: number;
}

export default function RecentSearches({ onSelectEpic, refreshTrigger = 0 }: RecentSearchesProps) {
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);

  useEffect(() => {
    setHistory(getSearchHistory());
  }, [refreshTrigger]);

  const handleClearAll = () => {
    clearSearchHistory();
    setHistory([]);
  };

  if (history.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-xl mx-auto space-y-2.5 pt-2 animate-fadeIn">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest text-slate-400">
          <Clock className="w-3.5 h-3.5 text-indigo-600" />
          <span>Recent Searches</span>
        </div>

        <button
          type="button"
          onClick={handleClearAll}
          className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-rose-600 transition"
        >
          <Trash2 className="w-3 h-3" />
          <span>Clear</span>
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {history.map((item, idx) => {
          const epic = item.epic || item.query;
          const name = item.name || item.label;
          return (
            <AnimatedItem
              key={`${epic}-${item.timestamp}`}
              index={idx}
              delay={Math.min(idx * 0.03, 0.12)}
              threshold={0.1}
            >
              <button
                type="button"
                onClick={() => onSelectEpic(epic)}
                className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-indigo-50/80 border border-slate-200/80 hover:border-indigo-200 shadow-xs text-xs font-semibold transition-all duration-200 active:scale-95"
              >
                <span className="epic-mono font-extrabold text-slate-900 group-hover:text-indigo-700">
                  {formatEpicForDisplay(epic)}
                </span>
                {name && (
                  <span className="text-slate-500 font-medium truncate max-w-[120px]">
                    • {name}
                  </span>
                )}
                <ArrowUpRight className="w-3 h-3 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>
            </AnimatedItem>
          );
        })}
      </div>
    </div>
  );
}
