'use client';

import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedNumberProps {
  value: number | null | undefined;
  /** Tween duration in ms */
  duration?: number;
  /** Decimal places to render */
  decimals?: number;
  /** Optional suffix, e.g. "%" */
  suffix?: string;
  /** Optional prefix */
  prefix?: string;
  /** Flash green/red when the value changes after first render */
  flash?: boolean;
  /** Placeholder when value is null/undefined */
  placeholder?: string;
  className?: string;
  /** Use compact notation (e.g. 12.4k) */
  compact?: boolean;
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

function format(n: number, decimals: number, compact: boolean) {
  if (compact && Math.abs(n) >= 1000) {
    if (Math.abs(n) >= 100000) return `${(n / 100000).toFixed(1)}L`;
    return `${(n / 1000).toFixed(1)}k`;
  }
  return n.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Smoothly tweens between numeric values using requestAnimationFrame.
 * Renders tabular numerals so the width doesn't jitter while counting.
 */
export function AnimatedNumber({
  value,
  duration = 800,
  decimals = 0,
  suffix = '',
  prefix = '',
  flash = true,
  placeholder = '—',
  className,
  compact = false,
}: AnimatedNumberProps) {
  const [display, setDisplay] = useState<number | null>(
    typeof value === 'number' ? value : null
  );
  const [flashDir, setFlashDir] = useState<'up' | 'down' | null>(null);
  const fromRef = useRef<number | null>(typeof value === 'number' ? value : null);
  const rafRef = useRef<number | null>(null);
  const flashKey = useRef(0);

  useEffect(() => {
    if (typeof value !== 'number' || Number.isNaN(value)) return;

    const from = fromRef.current;
    // First real value: animate up from 0 for a pleasant entrance
    const start = from === null ? 0 : from;
    if (start === value) {
      setDisplay(value);
      fromRef.current = value;
      return;
    }

    if (from !== null && flash) {
      flashKey.current += 1;
      setFlashDir(value > from ? 'up' : 'down');
    }

    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (reduceMotion) {
      setDisplay(value);
      fromRef.current = value;
      return;
    }

    const startTime = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - startTime) / duration);
      const current = start + (value - start) * easeOutCubic(t);
      setDisplay(current);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = value;
      }
    };
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      // If interrupted mid-tween, continue from the last target
      fromRef.current = value;
    };
  }, [value, duration, flash]);

  useEffect(() => {
    if (!flashDir) return;
    const timer = setTimeout(() => setFlashDir(null), 1200);
    return () => clearTimeout(timer);
  }, [flashDir]);

  if (display === null) {
    return <span className={cn('tabular', className)}>{placeholder}</span>;
  }

  const rounded =
    decimals > 0 ? display : Math.round(display);

  return (
    <span
      key={flashDir ? `f-${flashKey.current}` : 'static'}
      className={cn(
        'tabular inline-block',
        flashDir === 'up' && 'animate-flash-up',
        flashDir === 'down' && 'animate-flash-down',
        className
      )}
    >
      {prefix}
      {format(rounded, decimals, compact)}
      {suffix}
    </span>
  );
}

export default AnimatedNumber;
