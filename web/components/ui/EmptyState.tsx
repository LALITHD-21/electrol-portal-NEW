'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Search, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'w-full py-12 px-4 flex flex-col items-center justify-center text-center',
        className
      )}
    >
      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3.5 shadow-2xs">
        {icon || <Search className="w-7 h-7 text-slate-400" />}
      </div>
      <h3 className="text-base font-bold text-slate-900 tracking-tight max-w-xs">{title}</h3>
      {description && (
        <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-sm leading-relaxed">
          {description}
        </p>
      )}
      {action && (
        <div className="mt-5">
          <Button variant="secondary" size="md" onClick={action.onClick}>
            {action.label}
          </Button>
        </div>
      )}
    </div>
  );
}

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'We encountered an error loading this data. Please check your connection and try again.',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'w-full py-10 px-4 flex flex-col items-center justify-center text-center rounded-2xl bg-rose-50/50 border border-rose-100',
        className
      )}
    >
      <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600 mb-3">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-bold text-rose-900">{title}</h3>
      <p className="text-xs text-rose-700/80 mt-1 max-w-sm leading-relaxed">{message}</p>
      {onRetry && (
        <div className="mt-4">
          <Button
            variant="destructive"
            size="sm"
            onClick={onRetry}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
}
