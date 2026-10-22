'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Download,
  Search,
  ChevronDown,
  Check,
  Sparkles,
  ClipboardList,
  X,
  Loader2,
  Bell,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export interface CandidateHeroBannerProps {
  onRequestAddVoter?: () => void;
  candidateName?: string;
  candidateRole?: string;
  constituencyTitle?: string;
  voterCountText?: string;
  voterCount?: number;
  candidatePhotoUrl?: string;
  partyLogoUrl?: string;
  // Search integration
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  onSubmitSearch?: () => void;
  totalResults?: number;
  selectedPlace?: string;
  onSelectPlace?: (place: string) => void;
  relativeNameFilter?: string;
  onRelativeNameChange?: (val: string) => void;
  isLoading?: boolean;
  showBallotGuide?: boolean;
}

export function CandidateHeroBanner({
  onRequestAddVoter,
  candidateName,
  candidateRole,
  constituencyTitle,
  voterCountText,
  voterCount,
  candidatePhotoUrl = '/candidate-avatar.jpg',
  partyLogoUrl = '/inc-logo.png',
  searchQuery = '',
  onSearchChange,
  onSubmitSearch,
  totalResults,
  selectedPlace = 'All places',
  onSelectPlace,
  relativeNameFilter = '',
  onRelativeNameChange,
  isLoading = false,
  showBallotGuide = true,
}: CandidateHeroBannerProps) {
  const [showRelativeInput, setShowRelativeInput] = useState(Boolean(relativeNameFilter));
  const [liveVoterCount, setLiveVoterCount] = useState<number>(voterCount ?? 183818);

  useEffect(() => {
    if (typeof voterCount === 'number' && voterCount > 0) {
      setLiveVoterCount(voterCount);
    }
  }, [voterCount]);

  useEffect(() => {
    let active = true;
    const fetchLiveCount = async () => {
      try {
        const res = await fetch('/api/stats', { cache: 'no-store' });
        if (res.ok && active) {
          const data = await res.json();
          if (typeof data.count === 'number' && data.count > 0) {
            setLiveVoterCount(data.count);
          }
        }
      } catch {
        // silent fallback
      }
    };

    fetchLiveCount();

    const handleElectorUpdate = (e: Event) => {
      const custom = e as CustomEvent<{ version?: string; total?: number }>;
      if (custom.detail?.total && typeof custom.detail.total === 'number') {
        setLiveVoterCount(custom.detail.total);
      } else {
        fetchLiveCount();
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('focus', fetchLiveCount);
      window.addEventListener('electors-updated', handleElectorUpdate);
    }

    return () => {
      active = false;
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', fetchLiveCount);
        window.removeEventListener('electors-updated', handleElectorUpdate);
      }
    };
  }, []);

  useEffect(() => {
    if (relativeNameFilter && !showRelativeInput) {
      setShowRelativeInput(true);
    }
  }, [relativeNameFilter, showRelativeInput]);
  const { language, toggleLanguage, t } = useLanguage();

  const displayName =
    language === 'kn' ? t.candidateName : (candidateName || t.candidateName);
  const displayRole =
    language === 'kn' ? t.candidateRole : (candidateRole || t.candidateRole);
  const displayConstituency =
    language === 'kn'
      ? t.constituencyTitle
      : (constituencyTitle || t.constituencyTitle);

  const formattedCount = liveVoterCount.toLocaleString('en-IN');
  const dynamicVoterCountText =
    language === 'kn'
      ? `${formattedCount} ನೋಂದಾಯಿತ ಪದವೀಧರ ಮತದಾರರು`
      : `${formattedCount} graduate voters listed`;

  const displayVoterCount =
    voterCountText && !voterCountText.includes('1,92,696')
      ? voterCountText
      : dynamicVoterCountText;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 font-sans">
      {/* 1. Top Bar: MLC ELECTION 2026 + Language Switcher */}
      <div className="flex items-center justify-between gap-1.5 px-0.5 sm:px-1 text-slate-800">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="inline-flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs font-black tracking-wider uppercase text-blue-800 bg-blue-50 px-2 sm:px-2.5 py-1 rounded-lg border border-blue-200 truncate">
            <span className="relative w-3.5 h-4 rounded-2xs overflow-hidden inline-block shrink-0">
              <Image src={partyLogoUrl} alt="INC" fill unoptimized className="object-cover" />
            </span>
            <span className="truncate">{t.mlcElection}</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Push Notification Alerts Button */}
          <button
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('open-push-prompt'));
              }
            }}
            className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-black border border-amber-300 bg-amber-50/95 text-amber-900 hover:bg-amber-100 active:scale-95 shadow-2xs transition"
            aria-label="Polling Alerts"
            title="Enable or Test Polling Day Alerts"
          >
            <Bell className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
            <span>{language === 'kn' ? 'ಜ್ಞಾಪನೆ' : 'Alerts'}</span>
          </button>

          {/* Prominent App Install Button */}
          <button
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('open-pwa-install'));
              }
            }}
            className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-black border border-blue-300 bg-white/95 text-blue-700 hover:bg-blue-50 active:scale-95 shadow-2xs transition"
            aria-label="Install App"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span>{t.pwaInstallBtn}</span>
          </button>

          {/* Language Switcher Pill */}
          <button
            type="button"
            onClick={toggleLanguage}
            className="px-2.5 sm:px-3.5 py-1 rounded-full text-[11px] sm:text-xs font-extrabold border border-blue-300 bg-white/95 text-blue-800 hover:bg-blue-50 active:scale-95 shadow-2xs transition"
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
          <div className={cn(
            "relative rounded-2xl sm:rounded-3xl border-2 border-white/95 shadow-xl shadow-blue-950/25 overflow-hidden bg-slate-900/10 group shrink-0 transition-all duration-300",
            searchQuery.trim()
              ? "w-14 h-14 min-w-[56px] min-h-[56px] sm:w-36 sm:h-36 sm:min-w-[144px] sm:min-h-[144px]"
              : "w-24 h-24 min-w-[96px] min-h-[96px] sm:w-36 sm:h-36 sm:min-w-[144px] sm:min-h-[144px]"
          )}>
            <Image
              src={candidatePhotoUrl}
              alt={displayName}
              fill
              priority
              unoptimized
              className="object-cover object-top transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 96px, 144px"
            />
          </div>

          {/* Candidate Text Metadata */}
          <div className="flex-1 min-w-0 space-y-1 sm:space-y-1.5 py-0.5">
            <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-blue-200 leading-tight truncate">
              {displayConstituency}
            </div>
            <h2 className={cn(
              "font-black tracking-tight text-white leading-snug truncate transition-all",
              searchQuery.trim() ? "text-sm sm:text-2xl md:text-3xl" : "text-base sm:text-2xl md:text-3xl"
            )}>
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
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
              document.activeElement.blur();
            }
            onSubmitSearch?.();
            if (typeof window !== 'undefined') {
              const el = document.getElementById('search-results-section');
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }
          }}
          className="relative flex items-center bg-slate-50/90 rounded-2xl border border-slate-200 focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-100/70 focus-within:bg-white transition-all shadow-inner"
        >
          <div className="pl-3.5 pr-1.5 text-slate-400 flex items-center justify-center shrink-0">
            {isLoading ? (
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
            ) : (
              <Search className="w-5 h-5 text-slate-400" />
            )}
          </div>
          <input
            type="search"
            enterKeyHint="search"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full min-h-[46px] py-2.5 pr-2 text-sm font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-normal bg-transparent focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange?.('')}
              className="p-1.5 mr-1 text-slate-400 hover:text-slate-600 focus:outline-none rounded-full"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="submit"
            className="mr-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition shrink-0"
          >
            {language === 'kn' ? 'ಹುಡುಕಿ' : 'Search'}
          </button>
        </form>

        {/* Live Search Status Pill on Mobile */}
        {searchQuery.trim().length > 0 && (
          <div className="pt-0.5 animate-fadeIn">
            {isLoading ? (
              <div className="flex items-center gap-1.5 text-blue-700 font-bold text-xs py-1 px-1">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                <span>{language === 'kn' ? 'ಮತದಾರರ ಪಟ್ಟಿಯಲ್ಲಿ ಹುಡುಕಲಾಗುತ್ತಿದೆ...' : 'Searching voter list...'}</span>
              </div>
            ) : totalResults !== undefined && totalResults > 0 ? (
              <div className="flex items-center justify-between bg-blue-50/95 border border-blue-200/90 px-3.5 py-2 rounded-2xl text-xs font-bold text-blue-950 shadow-2xs">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>
                    {totalResults.toLocaleString()} {language === 'kn' ? 'ಮತದಾರರು ಕಂಡುಬಂದಿದ್ದಾರೆ' : 'voters found'}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('search-results-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className="text-blue-700 hover:text-blue-900 font-black inline-flex items-center gap-1 focus:outline-none active:scale-95 transition"
                >
                  <span>{language === 'kn' ? 'ಫಲಿತಾಂಶ ನೋಡಿ' : 'View Results'}</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : null}
          </div>
        )}

        {/* Accordion: + Add father / husband name */}
        <div className="pt-0.5">
          <button
            type="button"
            onClick={() => {
              if (showRelativeInput) {
                setShowRelativeInput(false);
                onRelativeNameChange?.('');
              } else {
                setShowRelativeInput(true);
              }
            }}
            className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-800 transition"
          >
            <span>{showRelativeInput ? t.hideRelativeBtn : t.addRelativeBtn}</span>
          </button>

          {showRelativeInput && (
            <div className="mt-2 animate-fadeIn relative">
              <input
                type="text"
                value={relativeNameFilter}
                onChange={(e) => onRelativeNameChange?.(e.target.value)}
                placeholder={t.relativePlaceholder}
                className="w-full px-3.5 py-2.5 pr-8 text-xs font-semibold text-slate-900 placeholder:text-slate-400 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all"
              />
              {relativeNameFilter && (
                <button
                  type="button"
                  onClick={() => onRelativeNameChange?.('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-full transition"
                  aria-label="Clear relative name"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Tip text */}
        <p className="text-[11px] text-slate-500 font-medium">
          {t.searchTip}
        </p>
      </div>

      {/* 4. Official Ballot Paper Voting Guide Card */}
      {showBallotGuide && <BallotGuideCard />}
    </div>
  );
}

export function BallotGuideCard() {
  const { t } = useLanguage();
  return (
    <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-slate-200/90 shadow-soft-sm p-4 sm:p-5 space-y-3.5 transition-all overflow-hidden">
      {/* Header with Title and Sl. No. Badge */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-blue-100 text-blue-700 font-black text-xs shadow-2xs shrink-0">
            <Sparkles className="w-4 h-4 text-blue-600" />
          </span>
          <div className="min-w-0">
            <h4 className="text-xs sm:text-base font-black text-slate-900 tracking-tight flex items-center gap-1.5 truncate">
              <span>{t.ballotGuideBadge}</span>
            </h4>
            <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium truncate">
              {t.ballotInstructionHeader}
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-black bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-2xs shrink-0 whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          <span>{t.ballotSlNoBadge}</span>
        </span>
      </div>

      {/* Prominent, Large & Perfectly Aligned Ballot Paper Specimen */}
      <div className="relative w-full aspect-[1024/367] rounded-2xl overflow-hidden bg-white shadow-soft-xs border border-slate-200/90">
        <Image
          src="/ballot-candidate-guide.png"
          alt="Ballot Paper Specimen - Shashi Hulikuntemutt Sl. No. 1"
          fill
          priority
          unoptimized
          sizes="(max-width: 640px) 100vw, 672px"
          className="object-contain w-full h-full"
        />
      </div>
    </div>
  );
}
