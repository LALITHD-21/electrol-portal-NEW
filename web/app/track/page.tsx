'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  CheckCircle2,
  Clock,
  Phone,
  MessageSquare,
  Share2,
  Copy,
  Check,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  FileText,
  Calendar,
  Send,
  ArrowRight,
  Globe,
  Trash2,
} from 'lucide-react';
import {
  RequestStatus,
  STATUS_MAP,
  LINEAR_STEPPER_STEPS,
  getStatusConfig,
} from '@/lib/status-map';
import { PublicTrackResponse } from '@/lib/requestsService';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n/LanguageContext';

const HELPLINE_PHONE = '+91 9845123456';
const LAST_TRACKED_STORAGE_KEY = 'electrol_last_tracked_ref';

function TrackPageContent() {
  const searchParams = useSearchParams();
  const urlRef = searchParams.get('ref') || searchParams.get('referenceId') || '';
  const urlEpic = searchParams.get('epic') || searchParams.get('q') || '';

  // Form State
  const [referenceId, setReferenceId] = useState('');
  const [epicNumber, setEpicNumber] = useState('');
  const [storedRef, setStoredRef] = useState<string | null>(null);

  // View & Language State from global context
  const { language: lang, setLanguage: setLang } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [trackResult, setTrackResult] = useState<PublicTrackResponse | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);
  const [showExactTime, setShowExactTime] = useState(false);

  function getRelativeTimeString(dateIso: string | undefined, currentLang: 'en' | 'kn'): string {
    if (!dateIso) return '';
    const diffSec = Math.floor((Date.now() - new Date(dateIso).getTime()) / 1000);
    if (diffSec < 60) return currentLang === 'en' ? 'just now' : 'ಇದೀಗ ತಾನೆ';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return currentLang === 'en' ? `${diffMin} min ago` : `${diffMin} ನಿಮಿಷಗಳ ಹಿಂದೆ`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return currentLang === 'en' ? `${diffHours} hour${diffHours > 1 ? 's' : ''} ago` : `${diffHours} ಗಂಟೆಗಳ ಹಿಂದೆ`;
    const diffDays = Math.floor(diffHours / 24);
    return currentLang === 'en' ? `${diffDays} day${diffDays > 1 ? 's' : ''} ago` : `${diffDays} ದಿನಗಳ ಹಿಂದೆ`;
  }

  // Form Submission Handler
  const handleTrack = async (
    e?: React.FormEvent,
    isBackground = false,
    overrideRef?: string,
    overrideEpic?: string
  ) => {
    if (e) e.preventDefault();
    const rawRef = overrideRef !== undefined ? overrideRef : referenceId;
    const rawEpic = overrideEpic !== undefined ? overrideEpic : epicNumber;

    let cleanRef = rawRef.trim().toUpperCase();
    let cleanEpic = rawEpic.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

    // Smart detect if user pasted REQ- into epic field or EPIC into ref field
    if (cleanEpic.startsWith('REQ-')) {
      cleanRef = cleanEpic;
      cleanEpic = '';
    } else if (cleanRef && !cleanEpic && !cleanRef.startsWith('REQ-') && cleanRef.length >= 6 && cleanRef.length <= 16) {
      cleanEpic = cleanRef.replace(/[^A-Z0-9]/g, '');
    }

    if (!cleanRef && !cleanEpic) {
      setErrorMsg(
        lang === 'en'
          ? 'Please enter your Tracking Reference ID (e.g. REQ-2026-KA-XXXXX) or EPIC Number.'
          : 'ದಯವಿಟ್ಟು ನಿಮ್ಮ ಅರ್ಜಿ ಉಲ್ಲೇಖ ಐಡಿ (REQ-2026-KA-XXXXX) ಅಥವಾ ಎಪಿಕ್ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ.'
      );
      return;
    }

    if (!isBackground) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }
    setErrorMsg(null);

    try {
      const res = await fetch('/api/public/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referenceId: cleanRef || undefined,
          epic: cleanEpic || undefined,
        }),
      });

      if (res.status === 429) {
        setErrorMsg(
          lang === 'en'
            ? 'Too many attempts. Please wait a few minutes before checking again.'
            : 'ಹೆಚ್ಚಿನ ಪ್ರಯತ್ನಗಳು ನಡೆದಿವೆ. ದಯವಿಟ್ಟು ಕೆಲವು ನಿಮಿಷಗಳ ನಂತರ ಪ್ರಯತ್ನಿಸಿ.'
        );
        return;
      }

      const data: PublicTrackResponse = await res.json();

      if (!data.found) {
        setErrorMsg(
          lang === 'en'
            ? 'No application or voter record found matching these details. Please verify your Reference ID or EPIC number.'
            : 'ಈ ವಿವರಗಳಿಗೆ ಹೊಂದಿಕೆಯಾಗುವ ಯಾವುದೇ ಅರ್ಜಿ ಅಥವಾ ದಾಖಲೆ ಕಂಡುಬಂದಿಲ್ಲ. ದಯವಿಟ್ಟು ಉಲ್ಲೇಖ ಸಂಖ್ಯೆ ಅಥವಾ ಎಪಿಕ್ ಸಂಖ್ಯೆಯನ್ನು ಪರಿಶೀಲಿಸಿ.'
        );
        setTrackResult(null);
      } else {
        setTrackResult(data);
        const saveKey = cleanRef || cleanEpic;
        if (typeof window !== 'undefined' && saveKey) {
          localStorage.setItem(LAST_TRACKED_STORAGE_KEY, saveKey);
          setStoredRef(saveKey);
        }
      }
    } catch (err: any) {
      setErrorMsg(
        lang === 'en'
          ? 'Unable to connect to service. Please check your internet connection.'
          : 'ಸರ್ವರ್ ಸಂಪರ್ಕಿಸಲು ಸಾಧ್ಯವಾಗುತ್ತಿಲ್ಲ. ಇಂಟರ್ನೆಟ್ ಸಂಪರ್ಕವನ್ನು ಪರಿಶೀಲಿಸಿ.'
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Auto-fill from URL or localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(LAST_TRACKED_STORAGE_KEY);
      if (saved) setStoredRef(saved);
      if (urlRef) {
        const u = urlRef.trim().toUpperCase();
        if (u.startsWith('REQ-')) {
          setReferenceId(u);
          handleTrack(undefined, false, u, '');
        } else {
          setEpicNumber(u);
          handleTrack(undefined, false, '', u);
        }
      } else if (urlEpic) {
        const u = urlEpic.trim().toUpperCase();
        setEpicNumber(u);
        handleTrack(undefined, false, '', u);
      } else if (saved) {
        if (saved.startsWith('REQ-')) {
          setReferenceId(saved);
        } else {
          setEpicNumber(saved);
        }
      }
    }
  }, [urlRef, urlEpic]);

  // Background polling every 30s while page is visible
  useEffect(() => {
    if (!trackResult || (!referenceId && !epicNumber)) return;

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        handleTrack(undefined, true);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [trackResult, referenceId, epicNumber]);

  // Copy helpers
  const handleCopyRef = () => {
    if (trackResult?.reference_id) {
      navigator.clipboard.writeText(trackResult.reference_id);
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2000);
    }
  };

  const handleShareLink = () => {
    if (trackResult?.reference_id && typeof window !== 'undefined') {
      const isRef = trackResult.reference_id.toUpperCase().startsWith('REQ-');
      const paramName = isRef ? 'ref' : 'epic';
      const link = `${window.location.origin}/track?${paramName}=${encodeURIComponent(trackResult.reference_id)}`;
      navigator.clipboard.writeText(link);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleForgetSaved = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LAST_TRACKED_STORAGE_KEY);
      setStoredRef(null);
      if (!trackResult) {
        setReferenceId('');
        setEpicNumber('');
      }
    }
  };

  const currentCfg = trackResult?.status ? getStatusConfig(trackResult.status) : null;

  return (
    <div className="flex-1 flex flex-col items-center justify-start p-4 sm:p-6 lg:p-8 max-w-2xl w-full mx-auto space-y-6 animate-fadeIn">
      {/* Top Language Toggle & Candidate Header */}
      <div className="w-full flex items-center justify-between">
        <Link
          href="/search"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-900 transition"
        >
          <span>&larr;</span>
          <span>{lang === 'en' ? 'Back to Voter Search' : 'ಮತದಾರರ ಹುಡುಕಾಟಕ್ಕೆ ಹಿಂತಿರುಗಿ'}</span>
        </Link>

        {/* Bilingual Toggle */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => setLang('en')}
            className={cn(
              'px-2.5 py-1 rounded-lg text-xs font-black transition',
              lang === 'en' ? 'bg-white text-blue-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            )}
          >
            English
          </button>
          <button
            type="button"
            onClick={() => setLang('kn')}
            className={cn(
              'px-2.5 py-1 rounded-lg text-xs font-black transition',
              lang === 'kn' ? 'bg-white text-blue-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            )}
          >
            ಕನ್ನಡ
          </button>
        </div>
      </div>

      {/* Main Card: Track Request Form */}
      <div className="w-full bg-white rounded-3xl border border-slate-200 shadow-soft-sm p-5 sm:p-7 space-y-4">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {lang === 'en' ? 'Track Application & Voter Status' : 'ಅರ್ಜಿ ಮತ್ತು ಮತದಾರರ ಸ್ಥಿತಿ ಪರಿಶೀಲಿಸಿ'}
          </h1>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            {lang === 'en'
              ? 'Enter your Application Tracking ID or EPIC (Voter ID) number to view live progress.'
              : 'ಅರ್ಜಿಯ ಪ್ರಸ್ತುತ ಸ್ಥಿತಿ ತಿಳಿಯಲು ನಿಮ್ಮ ಟ್ರ್ಯಾಕಿಂಗ್ ಐಡಿ ಅಥವಾ ಎಪಿಕ್ (ಮತದಾರರ ಗುರುತಿನ ಚೀಟಿ) ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ.'}
          </p>
        </div>

        <form onSubmit={handleTrack} className="space-y-3.5 pt-1">
          {/* Reference ID input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {lang === 'en' ? 'Application Tracking / Reference ID' : 'ಅರ್ಜಿ ಟ್ರ್ಯಾಕಿಂಗ್ / ಉಲ್ಲೇಖ ಐಡಿ'}
            </label>
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="e.g. REQ-2026-KA-XXXXX"
                value={referenceId}
                onChange={(e) => setReferenceId(e.target.value.toUpperCase())}
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm font-mono font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-sans uppercase"
              />
              {referenceId && (
                <button
                  type="button"
                  onClick={() => setReferenceId('')}
                  className="absolute right-3 text-xs text-slate-400 hover:text-slate-600 font-bold"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Divider OR */}
          <div className="relative flex items-center justify-center my-0.5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative px-3 bg-white text-[11px] font-black text-slate-400 uppercase tracking-wider">
              {lang === 'en' ? '— OR —' : '— ಅಥವಾ —'}
            </div>
          </div>

          {/* EPIC Number input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {lang === 'en' ? 'EPIC Number (Voter ID Card)' : 'ಎಪಿಕ್ ಸಂಖ್ಯೆ (ಮತದಾರರ ಗುರುತಿನ ಚೀಟಿ)'}
            </label>
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="e.g. IUO3578762 or KA/04/025/123456"
                value={epicNumber}
                onChange={(e) => setEpicNumber(e.target.value.toUpperCase())}
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm font-mono font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-sans uppercase"
              />
              {epicNumber && (
                <button
                  type="button"
                  onClick={() => setEpicNumber('')}
                  className="absolute right-3 text-xs text-slate-400 hover:text-slate-600 font-bold"
                >
                  ✕
                </button>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {lang === 'en'
                ? 'Enter either your Tracking Reference ID or EPIC Number to track live status.'
                : 'ಸ್ಥಿತಿ ಪರಿಶೀಲಿಸಲು ಉಲ್ಲೇಖ ಐಡಿ ಅಥವಾ ಎಪಿಕ್ ಸಂಖ್ಯೆ ನಮೂದಿಸಿ.'}
            </p>
          </div>

          {/* Error Notice */}
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-800 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span className="font-semibold leading-relaxed">{errorMsg}</span>
            </div>
          )}

          {/* Track Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full min-h-[48px] py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-extrabold text-sm shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
            ) : (
              <Search className="w-4 h-4 text-white" />
            )}
            <span>
              {isLoading
                ? lang === 'en'
                  ? 'Verifying...'
                  : 'ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ...'
                : lang === 'en'
                ? 'Track Status'
                : 'ಸ್ಥಿತಿ ಪರಿಶೀಲಿಸಿ'}
            </span>
          </button>
        </form>

        {/* Remembered / Last tracked shortcut */}
        {storedRef && !trackResult && (
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              {lang === 'en' ? 'Last tracked:' : 'ಹಿಂದೆ ಪರಿಶೀಲಿಸಿದ್ದು:'}{' '}
              <strong className="font-mono text-blue-700">{storedRef}</strong>
            </span>
            <button
              type="button"
              onClick={handleForgetSaved}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-700"
            >
              <Trash2 className="w-3 h-3" />
              <span>{lang === 'en' ? 'Forget' : 'ಮರೆತುಬಿಡಿ'}</span>
            </button>
          </div>
        )}
      </div>

      {/* SKELETON LOADER (Section 3.4) */}
      {isLoading && !trackResult && (
        <div className="w-full space-y-4 animate-pulse">
          <div className="bg-white rounded-3xl border border-slate-200 p-5 h-20 bg-slate-100/70" />
          <div className="rounded-3xl border border-blue-200 p-6 h-36 bg-blue-50/50" />
          <div className="bg-white rounded-3xl border border-slate-200 p-6 h-48 bg-slate-100/70" />
        </div>
      )}

      {/* TRACKING RESULT SECTION */}
      {trackResult && currentCfg && (
        <div className="w-full space-y-4 animate-fadeIn">
          {/* Header Bar */}
          <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-black text-sm text-blue-800">
                  {trackResult.reference_id}
                </span>
                <button
                  type="button"
                  onClick={handleCopyRef}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 transition"
                  title="Copy Reference ID"
                >
                  {copiedRef ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {lang === 'en' ? 'Applicant:' : 'ಅರ್ಜಿದಾರರು:'}{' '}
                <strong className="text-slate-800">{trackResult.first_name}</strong>
                {' • '}
                {lang === 'en' ? 'Submitted:' : 'ಸಲ್ಲಿಸಿದ ದಿನ:'}{' '}
                {new Date(trackResult.submitted_at!).toLocaleDateString('en-IN', {
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleTrack(undefined, false)}
              disabled={isRefreshing}
              className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition flex items-center gap-1.5 text-xs font-bold"
            >
              <RefreshCw
                className={cn('w-3.5 h-3.5', isRefreshing && 'animate-spin text-blue-600')}
              />
              <span className="hidden sm:inline">
                {lang === 'en' ? 'Refresh' : 'ನವೀಕರಿಸಿ'}
              </span>
            </button>
          </div>

          {/* Current Status Hero Card */}
          <div
            className={cn(
              'rounded-3xl border p-5 sm:p-6 space-y-3.5 shadow-soft-sm transition-all',
              currentCfg.badgeVariant === 'success'
                ? 'bg-gradient-to-br from-emerald-50 via-white to-emerald-50/70 border-emerald-300'
                : currentCfg.badgeVariant === 'error'
                ? 'bg-gradient-to-br from-rose-50 via-white to-rose-50/70 border-rose-300'
                : 'bg-gradient-to-br from-blue-50 via-white to-blue-50/70 border-blue-200'
            )}
          >
            <div className="flex items-center gap-2.5">
              <span
                className={cn(
                  'w-3 h-3 rounded-full',
                  currentCfg.badgeVariant === 'success'
                    ? 'bg-emerald-500'
                    : currentCfg.badgeVariant === 'error'
                    ? 'bg-rose-500'
                    : 'bg-blue-600 animate-pulse'
                )}
              />
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                {lang === 'en' ? 'Current Application Status' : 'ಪ್ರಸ್ತುತ ಅರ್ಜಿಯ ಸ್ಥಿತಿ'}
              </span>
            </div>

            <div className="space-y-1">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                {lang === 'en'
                  ? currentCfg.publicStepLabel.en
                  : currentCfg.publicStepLabel.kn}
              </h2>
              <p className="text-xs sm:text-sm text-slate-700 font-semibold leading-relaxed">
                {lang === 'en'
                  ? currentCfg.publicMessage.en({
                      date: trackResult.form_submitted_at
                        ? trackResult.form_submitted_at.slice(0, 10)
                        : '',
                      ackNumber: trackResult.form_ack_number,
                      partNumber: trackResult.enrolled_part_number,
                      serialNumber: trackResult.enrolled_serial_number,
                      rejectReason: trackResult.reject_reason_en,
                    })
                  : currentCfg.publicMessage.kn({
                      date: trackResult.form_submitted_at
                        ? trackResult.form_submitted_at.slice(0, 10)
                        : '',
                      ackNumber: trackResult.form_ack_number,
                      partNumber: trackResult.enrolled_part_number,
                      serialNumber: trackResult.enrolled_serial_number,
                      rejectReasonKn: trackResult.reject_reason_kn,
                    })}
              </p>
            </div>

            <div
              onClick={() => setShowExactTime(!showExactTime)}
              className="pt-1 text-[11px] text-slate-500 font-medium cursor-pointer hover:text-slate-800 transition select-none flex flex-wrap items-center gap-1.5"
            >
              <span>
                {lang === 'en' ? 'Last updated:' : 'ಕೊನೆಯ ನವೀಕರಣ:'}{' '}
                {getRelativeTimeString(trackResult.last_updated_at, lang)}
              </span>
              <span className="text-[10px] text-blue-600 underline">
                {showExactTime
                  ? `(${new Date(trackResult.last_updated_at!).toLocaleString('en-IN')})`
                  : lang === 'en'
                  ? '(tap for exact date & time)'
                  : '(ನಿಖರ ಸಮಯ ನೋಡಿ)'}
              </span>
            </div>
          </div>

          {/* Stepper Card (Section 3.2 Vertical Stepper) */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4">
            <h3 className="text-sm font-black text-slate-900 tracking-tight">
              {lang === 'en' ? 'Application Progress Stepper' : 'ಅರ್ಜಿ ಪ್ರಗತಿ ಹಂತಗಳು'}
            </h3>

            {/* Stepper List */}
            <div className="space-y-3 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {LINEAR_STEPPER_STEPS.map((s) => {
                const isCurrent = trackResult.status === s.key;
                const isCompleted =
                  currentCfg.stepperIndex > s.step ||
                  (trackResult.status === 'enrolled' && s.step <= 5);

                return (
                  <div key={s.key} className="flex items-start gap-3.5 relative z-10">
                    <div
                      className={cn(
                        'w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 transition-all shadow-2xs',
                        isCurrent
                          ? 'bg-blue-600 text-white ring-4 ring-blue-100 animate-pulse'
                          : isCompleted
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white border-2 border-slate-300 text-slate-400'
                      )}
                    >
                      {isCompleted ? <Check className="w-3.5 h-3.5" /> : s.step}
                    </div>

                    <div className="space-y-0.5 pt-0.5">
                      <div
                        className={cn(
                          'text-xs font-extrabold',
                          isCurrent
                            ? 'text-blue-900 font-black'
                            : isCompleted
                            ? 'text-slate-800'
                            : 'text-slate-400'
                        )}
                      >
                        {lang === 'en' ? s.labelEn : s.labelKn}
                      </div>
                      {isCurrent && (
                        <p className="text-[11px] text-blue-700 font-medium">
                          {lang === 'en'
                            ? 'Currently in this stage'
                            : 'ಪ್ರಸ್ತುತ ಈ ಹಂತದಲ್ಲಿದೆ'}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Branch status notice */}
            {currentCfg.isBranchState && (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <strong className="block font-bold">
                    {lang === 'en' ? currentCfg.publicStepLabel.en : currentCfg.publicStepLabel.kn}
                  </strong>
                  <p className="leading-relaxed">
                    {lang === 'en'
                      ? currentCfg.whatHappensNext.en
                      : currentCfg.whatHappensNext.kn}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Enrolled Confirmation Action Card */}
          {(trackResult.status === 'enrolled' || trackResult.status === 'duplicate') && (
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-3xl p-5 sm:p-6 shadow-md space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-emerald-200" />
                <h4 className="text-base font-black">
                  {lang === 'en'
                    ? 'Official Enrolment Confirmed!'
                    : 'ಅಧಿಕೃತ ಮತದಾರರ ಪಟ್ಟಿಯಲ್ಲಿ ಹೆಸರು ದೃಢಪಟ್ಟಿದೆ!'}
                </h4>
              </div>
              <p className="text-xs text-emerald-100 font-medium leading-relaxed">
                {lang === 'en'
                  ? 'Your name appears in the published electoral roll. You can now view and download your candidate voter slip.'
                  : 'ನಿಮ್ಮ ಹೆಸರು ಪ್ರಕಟಿತ ಮತದಾರರ ಪಟ್ಟಿಯಲ್ಲಿದೆ. ಈಗಲೇ ನಿಮ್ಮ ಅಧಿಕೃತ ಮತದಾರರ ಚೀಟಿಯನ್ನು ವೀಕ್ಷಿಸಿ ಮತ್ತು ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ.'}
              </p>

              {trackResult.enrolled_part_number && (
                <div className="flex items-center gap-3 pt-1">
                  <span className="px-3 py-1 rounded-xl bg-white/20 text-xs font-mono font-bold">
                    Part No: {trackResult.enrolled_part_number}
                  </span>
                  <span className="px-3 py-1 rounded-xl bg-white/20 text-xs font-mono font-bold">
                    Serial No: {trackResult.enrolled_serial_number}
                  </span>
                </div>
              )}

              <div className="pt-2">
                <Link
                  href={`/search?q=${encodeURIComponent(trackResult.first_name || '')}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white text-emerald-900 font-black text-xs hover:bg-emerald-50 transition shadow-sm"
                >
                  <span>
                    {lang === 'en'
                      ? 'View My Name in Voter List'
                      : 'ಮತದಾರರ ಪಟ್ಟಿಯಲ್ಲಿ ನನ್ನ ಹೆಸರನ್ನು ನೋಡಿ'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}

          {/* "What Happens Next" Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 space-y-2 text-xs">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">
              {lang === 'en' ? 'What Happens Next?' : 'ಮುಂದಿನ ಹಂತವೇನು?'}
            </span>
            <p className="text-slate-700 font-semibold leading-relaxed">
              {lang === 'en' ? currentCfg.whatHappensNext.en : currentCfg.whatHappensNext.kn}
            </p>
          </div>

          {/* Public-Visible Milestones Timeline */}
          {trackResult.timeline && trackResult.timeline.length > 0 && (
            <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-3 shadow-2xs">
              <span className="text-xs font-black uppercase tracking-wider text-slate-800 block">
                {lang === 'en' ? 'Application History' : 'ಅರ್ಜಿ ಇತಿಹಾಸ'}
              </span>

              <div className="space-y-2.5">
                {trackResult.timeline.map((evt, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-blue-800">
                        {STATUS_MAP[evt.to_status]?.publicStepLabel.en || evt.action}
                      </span>
                      <span className="text-slate-400">
                        {new Date(evt.created_at).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    <p className="text-slate-700 font-medium">
                      {lang === 'en'
                        ? evt.public_note || 'Step completed'
                        : evt.public_note_kn || evt.public_note || 'ಹಂತ ಪೂರ್ಣಗೊಂಡಿದೆ'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Voter Support & Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            <a
              href={`https://wa.me/919845123456?text=${encodeURIComponent(
                `Namaskara, I am checking my Form 18 enrolment request ID: ${trackResult.reference_id}`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 transition flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <span>WhatsApp Us</span>
            </a>

            <a
              href={`tel:${HELPLINE_PHONE}`}
              className="px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex items-center justify-center gap-2"
            >
              <Phone className="w-4 h-4 text-slate-500" />
              <span>{lang === 'en' ? 'Call Helpline' : 'ಸಹಾಯವಾಣಿ ಕರೆ'}</span>
            </a>

            <button
              type="button"
              onClick={handleShareLink}
              className="px-4 py-3 rounded-2xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-900 text-xs font-bold transition flex items-center justify-center gap-2"
            >
              {copiedLink ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>{lang === 'en' ? 'Link Copied!' : 'ಲಿಂಕ್ ನಕಲಿಸಲಾಗಿದೆ!'}</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 text-blue-600" />
                  <span>{lang === 'en' ? 'Share Tracking Link' : 'ಲಿಂಕ್ ಹಂಚಿಕೊಳ್ಳಿ'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Statutory Disclaimer */}
      <div className="w-full text-center text-[11px] text-slate-400 font-medium pt-4 pb-6 space-y-1">
        <p>
          {lang === 'en'
            ? 'The official electoral roll is published solely by the Election Commission of India / ERO.'
            : 'ಮತದಾರರ ಪಟ್ಟಿಯನ್ನು ಚುನಾವಣಾ ನೋಂದಣಿ ಅಧಿಕಾರಿಗಳೇ (ERO) ಅಧಿಕೃತವಾಗಿ ಪ್ರಕಟಿಸುತ್ತಾರೆ.'}
        </p>
        <p>
          Shashi Hulikuntemutt Campaign Citizen Assistance Desk · South-East Graduates’ Constituency
        </p>
      </div>
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center p-12 text-slate-400">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
        </div>
      }
    >
      <TrackPageContent />
    </Suspense>
  );
}
