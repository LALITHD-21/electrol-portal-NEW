'use client';

import React, { useState } from 'react';
import { Phone, Eye, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MaskedPhoneProps {
  phone: string | null | undefined;
  className?: string;
  allowCopy?: boolean;
}

export function MaskedPhone({
  phone,
  className,
  allowCopy = true,
}: MaskedPhoneProps) {
  const [copied, setCopied] = useState(false);

  if (!phone || phone.trim() === '') {
    return <span className="text-slate-400 italic text-xs">Not recorded</span>;
  }

  const clean = phone.trim();
  const isMasked = clean.includes('X');

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isMasked && clean) {
      navigator.clipboard.writeText(clean.replace(/\D/g, ''));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100/90 text-slate-800 border border-slate-200/80',
        className
      )}
    >
      <Phone className="w-3 h-3 text-slate-400 flex-shrink-0" />
      <span>{clean}</span>
      {allowCopy && !isMasked && (
        <button
          type="button"
          onClick={handleCopy}
          title="Copy phone number"
          className="ml-0.5 p-0.5 text-slate-400 hover:text-indigo-600 transition"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
        </button>
      )}
    </span>
  );
}
