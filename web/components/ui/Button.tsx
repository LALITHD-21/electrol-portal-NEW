'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  fullWidth?: boolean;
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      isLoading = false,
      loadingText,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const variantStyles = {
      primary:
        'bg-brand-600 text-white shadow-sm hover:bg-brand-700 active:bg-brand-800 focus-visible:ring-brand-500 border border-transparent',
      secondary:
        'bg-white text-slate-700 border border-slate-200/90 shadow-2xs hover:bg-slate-50 hover:border-slate-300 active:bg-slate-100 focus-visible:ring-slate-400',
      outline:
        'bg-transparent text-slate-700 border border-slate-300 hover:bg-slate-50 active:bg-slate-100 focus-visible:ring-brand-500',
      ghost:
        'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 active:bg-slate-200/60 focus-visible:ring-slate-400 border border-transparent',
      destructive:
        'bg-rose-600 text-white shadow-sm hover:bg-rose-700 active:bg-rose-800 focus-visible:ring-rose-500 border border-transparent',
    };

    // Standardized sizes with min 44px touch targets on mobile (md and lg)
    const sizeStyles = {
      sm: 'h-9 px-3 text-xs rounded-xl min-w-[36px]',
      md: 'h-11 sm:h-10 px-4 text-sm rounded-xl min-h-[44px] sm:min-h-[40px]',
      lg: 'h-12 px-5 text-base rounded-2xl min-h-[48px]',
      icon: 'h-11 w-11 sm:h-10 sm:w-10 rounded-xl min-h-[44px] min-w-[44px] p-0 flex items-center justify-center',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-semibold select-none',
          'transition-all duration-150 ease-out active:scale-[0.98]',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
            <span>{loadingText || children}</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
            <span className="truncate">{children}</span>
            {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
