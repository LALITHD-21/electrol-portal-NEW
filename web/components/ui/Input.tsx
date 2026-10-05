'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onClear?: () => void;
  showClear?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      onClear,
      showClear = false,
      value,
      disabled,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full min-w-0">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-slate-700 mb-1.5 select-none"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 flex items-center pointer-events-none text-slate-400">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            value={value}
            disabled={disabled}
            className={cn(
              // Large thumb-friendly height (min-h-[48px]) and font size (16px base on mobile to prevent iOS autozoom)
              'w-full min-h-[48px] rounded-xl border border-slate-200 bg-white px-3.5 py-2.5',
              'text-[16px] sm:text-sm text-slate-900 placeholder:text-slate-400',
              'shadow-2xs transition-all duration-150',
              'focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100',
              'disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed',
              leftIcon && 'pl-11',
              (rightIcon || showClear) && 'pr-11',
              error && 'border-rose-300 focus:border-rose-500 focus:ring-rose-100 text-rose-900',
              className
            )}
            {...props}
          />
          {showClear && Boolean(value) && onClear && !disabled && (
            <button
              type="button"
              onClick={onClear}
              aria-label="Clear input"
              className="absolute right-3 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg active:bg-slate-100 min-h-[36px] min-w-[36px] flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          {rightIcon && (!showClear || !value) && (
            <div className="absolute right-3.5 flex items-center pointer-events-none text-slate-400">
              {rightIcon}
            </div>
          )}
        </div>
        {error ? (
          <p className="mt-1 text-xs font-medium text-rose-600">{error}</p>
        ) : hint ? (
          <p className="mt-1 text-xs text-slate-500">{hint}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
