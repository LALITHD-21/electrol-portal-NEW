import React from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'flat' | 'elevated' | 'glass';
}

export function Card({
  className,
  variant = 'default',
  children,
  ...props
}: CardProps) {
  const variantStyles = {
    default: 'bg-white rounded-2xl border border-slate-200/90 shadow-soft-sm',
    flat: 'bg-slate-50/80 rounded-2xl border border-slate-200/70',
    elevated: 'bg-white rounded-3xl border border-slate-200/90 shadow-soft-lg',
    glass: 'bg-white/90 backdrop-blur-md rounded-2xl border border-white/80 shadow-soft-sm',
  };

  return (
    <div
      className={cn(variantStyles[variant], 'transition-all', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('px-5 py-4 border-b border-slate-100 flex items-center justify-between', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('p-5', className)} {...props}>
      {children}
    </div>
  );
}
