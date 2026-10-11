'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  Download,
  Search,
  ChevronDown,
  Check,
  Sparkles,
  ClipboardList,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export interface CandidateHeroBannerProps {
  onRequestAddVoter?: () => void;
  candidateName?: string;
  candidateRole?: string;
  constituencyTitle?: string;
  voterCountText?: string;
  candidatePhotoUrl?: string;
  partyLogoUrl?: string;
  // Search integration
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  selectedPlace?: string;
  onSelectPlace?: (place: string) => void;
  relativeNameFilter?: string;
  onRelativeNameChange?: (val: string) => void;
}

export function CandidateHeroBanner({
  onRequestAddVoter,
  candidateName,
  candidateRole,
  constituencyTitle,
  voterCountText,
  candidatePhotoUrl = '/candidate-avatar.jpg',
  partyLogoUrl = '/inc-logo.png',
  searchQuery = '',
  onSearchChange,
  selectedPlace = 'All places',
  onSelectPlace,
  relativeNameFilter = '',
  onRelativeNameChange,
}: CandidateHeroBannerProps) {
  const [showRelativeInput, setShowRelativeInput] = useState(false);
  const { language, toggleLanguage, t } = useLanguage();

  const displayName =
    language === 'kn' ? t.candidateName : (candidateName || t.candidateName);
  const displayRole =
    language === 'kn' ? t.candidateRole : (candidateRole || t.candidateRole);
  const displayConstituency =
    language === 'kn'
      ? t.constituencyTitle
      : (constituencyTitle || t.constituencyTitle);
  const displayVoterCount =
    language === 'kn' ? t.voterCountText : (voterCountText || t.voterCountText);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 font-sans">
      {/* 1. Top Bar: MLC ELECTION 2026 + Language Switcher */}
      <div className="flex items-center justify-between px-1 text-slate-800">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-black tracking-wider uppercase text-blue-800 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
            <span className="relative w-3.5 h-4 rounded-2xs overflow-hidden inline-block flex-shrink-0">
              <Image src={partyLogoUrl} alt="INC" fill unoptimized className="object-cover" />
            </span>
            <span>{t.mlcElection}</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Prominent App Install Button */}
          <button
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('open-pwa-install'));
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border border-blue-300 bg-white/95 text-blue-700 hover:bg-blue-50 active:scale-95 shadow-2xs transition"
            aria-label="Install App"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span>{t.pwaInstallBtn}</span>
          </button>

          {/* Language Switcher Pill */}
          <button
            type="button"
            onClick={toggleLanguage}
            className="px-3.5 py-1 rounded-full text-xs font-extrabold border border-blue-300 bg-white/95 text-blue-800 hover:bg-blue-50 active:scale-95 shadow-2xs transition"
            aria-label={language === 'en' ? 'Switch to Kannada' : 'Switch to English'}
          >
            {language === 'en' ? 'ಕನ್ನಡ' : 'English'}
          </button>
        </div>
      </div>

      {/* 2. Candidate Hero Card (Royal Blue Gradient Theme with INC Identity) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1e40af] via-[#2563eb] to-[#0284c7] text-white shadow-xl shadow-blue-900/15 p-4 sm:p-6 border border-blue-400/40">
        {/* Subtle Indian National Congress Tricolor Accent Stripe at Top */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FF671F] via-white to-[#046A38] opacity-90" />

        {/* Official Indian National Congress Tricolor Flag Background Integration */}
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-full sm:w-3/4 md:w-2/3 h-full opacity-20 sm:opacity-25 translate-x-16 sm:translate-x-24 md:translate-x-28">
            <Image
              src="/congress-flag.png"
              alt="Indian National Congress Flag"
              fill
              priority
              unoptimized
              className="object-cover object-center"
            />
          </div>

          <div className="absolute inset-0 bg-gradient-to-r from-[#1e40af] via-[#1e40af]/90 sm:via-[#1e40af]/75 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-blue-950/25 via-transparent to-blue-900/15" />
        </div>

        <div className="relative flex items-center justify-between gap-3.5 sm:gap-6">
          {/* Candidate Portrait Avatar Frame */}
          <div className="relative w-28 h-28 sm:w-36 sm:h-36 min-w-[112px] min-h-[112px] sm:min-w-[144px] sm:min-h-[144px] shrink-0">
            <div className="relative w-full h-full rounded-2xl sm:rounded-3xl border-2 border-white/95 shadow-xl shadow-blue-950/25 overflow-hidden bg-slate-900/10 group">
              <Image
                src={candidatePhotoUrl}
                alt={displayName}
                fill
                priority
                unoptimized
                className="object-cover object-top transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 640px) 112px, 144px"
              />
            </div>
          </div>

          {/* Candidate Text Metadata */}
          <div className="flex-1 min-w-0 space-y-1 sm:space-y-1.5 py-0.5">
            <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-blue-200 leading-tight truncate">
              {displayConstituency}
            </div>
            <h2 className="text-base sm:text-2xl md:text-3xl font-black tracking-tight text-white leading-snug truncate">
              {displayName}
            </h2>
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              {/* INC Candidate Pill */}
              <span className="relative overflow-hidden inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] sm:text-xs font-black text-blue-950 shadow-sm border border-white/90 backdrop-blur-md">
                <div className="absolute inset-0 flex flex-col pointer-events-none opacity-40">
                  <div className="flex-1 bg-[#FF9933]" />
                  <div className="flex-1 bg-white" />
                  <div className="flex-1 bg-[#138808]" />
                </div>
                <div className="absolute inset-0 bg-white/55 pointer-events-none" />

                <span className="relative z-10 flex items-center gap-1.5">
                  <span className="relative w-3.5 h-4.5 rounded-2xs overflow-hidden inline-block shrink-0">
                    <Image src={partyLogoUrl} alt="INC" fill unoptimized className="object-cover" />
                  </span>
                  <span>{displayRole}</span>
                </span>
              </span>

              {/* Listed Voters Pill */}
              <span className="inline-block px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-extrabold bg-blue-950/50 border border-blue-300/40 text-blue-100 backdrop-blur-xs truncate max-w-full">
                {displayVoterCount}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. "Find your name in the voter list" Card */}
      <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-slate-200/90 shadow-soft-sm p-4 sm:p-6 space-y-3.5 transition-all">
        <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
          {t.findNameTitle}
        </h3>

        {/* Search Input Box */}
        <div className="relative flex items-center bg-slate-50/90 rounded-2xl border border-slate-200 focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-100/70 focus-within:bg-white transition-all">
          <div className="pl-3.5 pr-1.5 text-slate-400 flex items-center justify-center">
            <Search className="w-5 h-5 text-slate-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full min-h-[46px] py-2.5 pr-4 text-sm font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-normal bg-transparent focus:outline-none"
          />
        </div>

        {/* Accordion: + Add father / husband name */}
        <div className="pt-0.5">
          <button
            type="button"
            onClick={() => setShowRelativeInput(!showRelativeInput)}
            className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-800 transition"
          >
            <span>{showRelativeInput ? t.hideRelativeBtn : t.addRelativeBtn}</span>
          </button>

          {showRelativeInput && (
            <div className="mt-2 animate-fadeIn">
              <input
                type="text"
                value={relativeNameFilter}
                onChange={(e) => onRelativeNameChange?.(e.target.value)}
                placeholder={t.relativePlaceholder}
                className="w-full px-3.5 py-2 text-xs font-semibold text-slate-900 placeholder:text-slate-400 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}
        </div>

        {/* Tip text */}
        <p className="text-[11px] text-slate-500 font-medium">
          {t.searchTip}
        </p>
      </div>
    </div>
  );
}
