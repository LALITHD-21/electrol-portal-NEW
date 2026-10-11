'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import {
  Download,
  Share,
  PlusSquare,
  X,
  Compass,
  ChevronDown,
  Sparkles,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export function PwaInstallPrompt() {
  const { language, t } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isIpad, setIsIpad] = useState(false);
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isWaitingPrompt, setIsWaitingPrompt] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Detect if already running in standalone / installed PWA mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    setIsInstalled(isStandalone);

    // Keep prompt accessible across visits
    try {
      sessionStorage.removeItem('pwa_prompt_dismissed');
    } catch {}
    setIsDismissed(false);

    // 2. Reliable iOS & iPadOS Detection
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice =
      /iphone|ipad|ipod/.test(ua) ||
      (ua.includes('macintosh') && (window.navigator.maxTouchPoints || 0) > 1);
    const isIpadDevice =
      /ipad/.test(ua) ||
      (ua.includes('macintosh') && (window.navigator.maxTouchPoints || 0) > 1);

    setIsIos(isIosDevice);
    setIsIpad(isIpadDevice);

    // Check if in-app browser (e.g. WhatsApp, Instagram, Facebook, Line, Telegram, Twitter)
    const inApp =
      /instagram|fbav|fban|whatsapp|line|micromessenger|snapchat|twitter/i.test(ua) ||
      (!isIosDevice && /wv/i.test(ua));
    setIsInAppBrowser(inApp);

    // 3. Immediately pick up any early prompt captured before React mounted
    if ((window as any).__pwaInstallPrompt) {
      setDeferredPrompt((window as any).__pwaInstallPrompt);
    }

    // 4. Capture native Chromium install prompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      (window as any).__pwaInstallPrompt = e;
    };

    const handlePromptAvailable = (e: any) => {
      const promptObj = e?.detail || (window as any).__pwaInstallPrompt;
      if (promptObj) {
        setDeferredPrompt(promptObj);
      }
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowModal(false);
      setDeferredPrompt(null);
      (window as any).__pwaInstallPrompt = null;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('pwa-prompt-available', handlePromptAvailable);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('pwa-prompt-available', handlePromptAvailable);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Main automatic install trigger
  const triggerInstallFlow = useCallback(async () => {
    setIsDismissed(false);

    // Case 1: iOS Devices (iPhone / iPad)
    if (isIos) {
      // 1-Tap direct trigger: initiate Apple MobileConfig WebClip download
      try {
        window.location.href = '/api/pwa/ios-profile';
      } catch (err) {
        console.error('iOS profile trigger error:', err);
      }
      // Open clean iOS guide modal to walk user through system prompt / Settings
      setShowModal(true);
      return;
    }

    // Case 2: Android / Chromium Desktop
    let prompt =
      deferredPrompt ||
      (typeof window !== 'undefined' ? (window as any).__pwaInstallPrompt : null);

    // If prompt is not ready yet, wait briefly (up to 1.2s) in case service worker or manifest check is finishing
    if (!prompt) {
      setIsWaitingPrompt(true);
      await new Promise<void>((resolve) => {
        const timer = setTimeout(() => resolve(), 1200);
        const onReady = (e: any) => {
          clearTimeout(timer);
          prompt = e?.detail || (window as any).__pwaInstallPrompt;
          window.removeEventListener('pwa-prompt-available', onReady);
          resolve();
        };
        window.addEventListener('pwa-prompt-available', onReady, { once: true });
      });
      setIsWaitingPrompt(false);
      prompt =
        prompt ||
        (typeof window !== 'undefined' ? (window as any).__pwaInstallPrompt : null);
    }

    if (prompt) {
      try {
        setShowModal(false); // DO NOT SHOW FALLBACK MODAL ON ANDROID
        await prompt.prompt();
        const choice = await prompt.userChoice;
        if (choice && choice.outcome === 'accepted') {
          setIsInstalled(true);
          setShowModal(false);
        }
        setDeferredPrompt(null);
        if (typeof window !== 'undefined') {
          (window as any).__pwaInstallPrompt = null;
        }
        return;
      } catch (err) {
        console.error('PWA install prompt error:', err);
      }
    }

    // Case 3: In-app browser or browser without beforeinstallprompt support
    setShowModal(true);
  }, [deferredPrompt, isIos]);

  // Global listener for header install button
  useEffect(() => {
    const handleOpenCustom = () => {
      triggerInstallFlow();
    };
    window.addEventListener('open-pwa-install', handleOpenCustom);
    return () => {
      window.removeEventListener('open-pwa-install', handleOpenCustom);
    };
  }, [triggerInstallFlow]);

  if (isInstalled && !showModal) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      sessionStorage.setItem('pwa_prompt_dismissed', 'true');
    } catch {}
  };

  return (
    <>
      {/* Sleek Floating Install Pill / Banner */}
      {!isDismissed && !isInstalled && (
        <div className="w-full max-w-2xl mx-auto px-2 animate-fadeIn">
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 rounded-2xl p-2.5 sm:p-3 text-white shadow-md shadow-blue-900/10 border border-blue-400/40 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-white p-1 flex-shrink-0 flex items-center justify-center shadow-xs border border-blue-200/50">
                <Image
                  src="/app-logo.png"
                  alt="App Logo"
                  width={32}
                  height={32}
                  className="rounded-lg object-contain"
                  unoptimized
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-black text-white truncate leading-tight">
                    {t.pwaInstallTitle}
                  </p>
                  <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-white/20 text-white">
                    iOS &amp; Android
                  </span>
                </div>
                <p className="text-[11px] text-blue-100 font-medium truncate mt-0.5">
                  {t.pwaInstallSubtitle}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                type="button"
                onClick={triggerInstallFlow}
                disabled={isWaitingPrompt}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-blue-700 hover:bg-blue-50 active:scale-95 rounded-xl text-xs font-black shadow-xs transition disabled:opacity-75"
              >
                {isWaitingPrompt ? (
                  <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5 text-blue-600" />
                )}
                <span>{t.pwaInstallBtn}</span>
              </button>
              <button
                type="button"
                onClick={handleDismiss}
                className="p-1.5 text-white/80 hover:text-white hover:bg-black/10 rounded-lg transition"
                aria-label="Dismiss install banner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* iOS or In-App Browser Guidance Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-modal flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn"
          onClick={() => setShowModal(false)}
        >
          <div
            className="relative w-full max-w-sm bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden border border-slate-200 p-5 space-y-4 animate-slideUp sm:animate-scaleIn my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-1 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 p-1 flex items-center justify-center shadow-xs flex-shrink-0">
                  <Image
                    src="/app-logo.png"
                    alt="Voter Search"
                    width={40}
                    height={40}
                    className="rounded-xl object-contain"
                    unoptimized
                  />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-black text-slate-900 leading-tight">
                      Voter Search Portal
                    </h3>
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  </div>
                  <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                    {isIos
                      ? isIpad
                        ? 'Install on iPad Home Screen'
                        : 'Install on iPhone Home Screen'
                      : 'Add to Mobile Home Screen'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* In-App Browser Warning (WhatsApp, Instagram, Telegram) */}
            {isInAppBrowser && (
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-800 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-900">
                  <Compass className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>{isIos ? 'Open in Safari first' : 'Open in Chrome first'}</span>
                </div>
                <p className="text-[11px] leading-snug">
                  You are viewing this inside an in-app browser (e.g. WhatsApp). Tap the menu (<strong>•••</strong> or <strong>⋮</strong>)
                  and select <strong>&quot;{isIos ? 'Open in Safari' : 'Open in Chrome'}&quot;</strong> to enable automatic installation.
                </p>
              </div>
            )}

            {/* iOS Guided Steps */}
            {isIos ? (
              <div className="space-y-3">
                {/* 1-Tap Apple WebClip Profile Status */}
                <div className="p-3 bg-blue-50/90 rounded-2xl border border-blue-200/80 text-xs text-blue-900 space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-blue-900">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <span>Automatic Profile Download Triggered</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-[11px] text-blue-800 font-medium">
                    <li>Tap <strong>&quot;Allow&quot;</strong> on Apple&apos;s system prompt</li>
                    <li>Open iPhone <strong>Settings</strong> app</li>
                    <li>Tap <strong>&quot;Profile Downloaded&quot;</strong> at top &amp; tap <strong>Install</strong></li>
                  </ol>
                </div>

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="flex-shrink mx-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Or Safari 2-Tap Install
                  </span>
                  <div className="flex-grow border-t border-slate-200"></div>
                </div>

                <div className="space-y-2 text-xs text-slate-700">
                  {/* Step 1 */}
                  <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-black text-[10px] flex items-center justify-center flex-shrink-0">
                      1
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 text-[11px]">
                        Tap Safari <span className="text-blue-600 font-bold">Share</span> button
                      </p>
                    </div>
                    <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-blue-600 shadow-2xs flex-shrink-0">
                      <Share className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-black text-[10px] flex items-center justify-center flex-shrink-0">
                      2
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 text-[11px]">
                        Scroll &amp; tap <span className="font-bold text-slate-800">&quot;Add to Home Screen&quot;</span>
                      </p>
                    </div>
                    <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-800 shadow-2xs flex-shrink-0">
                      <PlusSquare className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>

                {/* iPhone Bottom Bar Indicator Cue */}
                {!isIpad && (
                  <div className="pt-0.5 flex items-center justify-center gap-1 text-[11px] text-blue-600 font-bold">
                    <ChevronDown className="w-3.5 h-3.5" />
                    <span>Share icon is located at the bottom of Safari</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ) : (
              /* Android Fallback (Only shown if in-app browser or non-Chromium) */
              <div className="space-y-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 text-xs text-slate-700">
                <p className="font-semibold text-slate-900">
                  To install on Android:
                </p>
                <p className="text-[11px] leading-relaxed text-slate-600">
                  Tap your browser menu (<strong>⋮</strong>) in the top-right corner,
                  and select <strong>&quot;Install app&quot;</strong> or <strong>&quot;Add to Home Screen&quot;</strong>.
                </p>
              </div>
            )}

            {/* Close Button */}
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-xs transition active:scale-98"
            >
              Got it, close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
