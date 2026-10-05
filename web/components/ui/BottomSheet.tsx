'use client';

import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  maxHeight?: string; // e.g. 'max-h-[85dvh]'
}

export function BottomSheet({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  className,
  maxHeight = 'max-h-[90dvh]',
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  // Close on Escape key & lock body scroll when open
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-sheet flex flex-col justify-end sm:items-center sm:justify-center p-0 sm:p-4"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs transition-opacity animate-fade-in"
        aria-hidden="true"
      />

      {/* Sheet panel */}
      <div
        ref={sheetRef}
        className={cn(
          'relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-elevated',
          'flex flex-col overflow-hidden animate-fade-in-up border border-slate-200/80',
          'pb-safe-bottom', // respect iPhone home indicator
          maxHeight,
          className
        )}
      >
        {/* Mobile Drag Indicator Bar */}
        <div className="flex sm:hidden justify-center pt-2.5 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-300" />
        </div>

        {/* Sheet Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-start justify-between gap-3 flex-shrink-0">
          <div className="min-w-0 pr-2">
            {title && (
              <h3 className="text-base font-bold text-slate-900 truncate tracking-tight">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-slate-500 truncate mt-0.5">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 -mr-1.5 text-slate-400 hover:text-slate-700 rounded-xl active:bg-slate-100 min-h-[36px] min-w-[36px] flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sheet Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 overscroll-contain">
          {children}
        </div>

        {/* Sticky Sheet Footer (if provided) */}
        {footer && (
          <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
