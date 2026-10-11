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
  ExternalLink,
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

    // 2. Reliable iOS & iPadOS Detection (exact previous behavior)
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice =
      /iphone|ipad|ipod/.test(ua) ||
      (ua.includes('macintosh') && (window.navigator.maxTouchPoints || 0) > 1);
    const isIpadDevice =
      /ipad/.test(ua) ||
      (ua.includes('macintosh') && (window.navigator.maxTouchPoints || 0) > 1);

    setIsIos(isIosDevice);
    setIsIpad(isIpadDevice);

    if (isIosDevice) {
      const inApp =
        /instagram|fbav|fban|whatsapp|line|micromessenger|snapchat|twitter/i.test(
          ua
        ) || (!(window as any).safari && !/crios|fxios|edgios/i.test(ua));
      setIsInAppBrowser(inApp);
    } else {
      const inAppAndroid = /wv|fbav|fban|instagram|whatsapp|line|micromessenger/i.test(ua);
      setIsInAppBrowser(inAppAndroid);
    }

    // 3. Immediately pick up any early prompt captured by root layout
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

    // 5. Automatic gentle prompt on iOS if not standalone (exact previous behavior)
    let autoTimer: any = null;
    if (isIosDevice && !isStandalone) {
      autoTimer = setTimeout(() => {
        setShowModal(true);
      }, 2500);
    }

    // 6. If navigated with ?install=1 from an intent, auto-prompt immediately
    if (window.location.search && window.location.search.indexOf('install=') !== -1) {
      const promptObj = (window as any).__pwaInstallPrompt;
      if (promptObj) {
        try {
          promptObj.prompt();
          promptObj.userChoice.then((choice: any) => {
            if (choice?.outcome === 'accepted') setIsInstalled(true);
          });
        } catch {}
      }
    }

    return () => {
      if (autoTimer) clearTimeout(autoTimer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('pwa-prompt-available', handlePromptAvailable);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Launch Chrome app directly via Android intent (for in-app / custom tabs)
  const openChromeIntent = useCallback(() => {
    if (typeof window === 'undefined') return;
    const targetHost = window.location.host;
    const targetPath = window.location.pathname || '/search';
    const intentUrl = `intent://${targetHost}${targetPath}?install=1#Intent;scheme=https;package=com.android.chrome;end`;
    window.location.href = intentUrl;
  }, []);

  // Main automatic install click handler
  const handleInstallClick = useCallback(async () => {
    setIsDismissed(false);

    // For iOS: open previous perfect 3-step guide modal
    if (isIos) {
      setShowModal(true);
      return;
    }

    // For Android: Automatic 1-Click Install
    let prompt =
      deferredPrompt ||
      (typeof window !== 'undefined' ? (window as any).__pwaInstallPrompt : null);

    // If prompt is not yet ready, wait briefly for it
    if (!prompt) {
      await new Promise<void>((resolve) => {
        const timer = setTimeout(() => resolve(), 600);
        const onReady = (e: any) => {
          clearTimeout(timer);
          prompt = e?.detail || (window as any).__pwaInstallPrompt;
          window.removeEventListener('pwa-prompt-available', onReady);
          resolve();
        };
        window.addEventListener('pwa-prompt-available', onReady, { once: true });
      });
      prompt =
        prompt ||
        (typeof window !== 'undefined' ? (window as any).__pwaInstallPrompt : null);
    }

    if (prompt) {
      setShowModal(false);
      try {
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
        console.error('Prompt error:', err);
      }
    }

    // If native prompt is blocked (e.g. Chrome Custom Tabs in WhatsApp), launch in Chrome
    try {
      openChromeIntent();
    } catch {}

    // Show fallback modal with 1-click button if still on screen
    setShowModal(true);
  }, [deferredPrompt, isIos, openChromeIntent]);

  // Global listener for top bar install button
  useEffect(() => {
    const handleOpenCustom = () => {
      handleInstallClick();
    };
    window.addEventListener('open-pwa-install', handleOpenCustom);
    return () => {
      window.removeEventListener('open-pwa-install', handleOpenCustom);
    };
  }, [handleInstallClick]);

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
                onClick={handleInstallClick}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-blue-700 hover:bg-blue-50 active:scale-95 rounded-xl text-xs font-black shadow-xs transition"
              >
                <Download className="w-3.5 h-3.5 text-blue-600" />
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

      {/* Guided Installation Modal */}
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

            {/* In-App Browser Warning (e.g. WhatsApp, Instagram, Telegram) */}
            {isIos && isInAppBrowser && (
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-800 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-900">
                  <Compass className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>Open in Safari first</span>
                </div>
                <p className="text-[11px] leading-snug">
                  You are viewing this inside an in-app browser. Tap the menu (•••)
                  or Share icon and select <strong>&quot;Open in Safari&quot;</strong> to
                  install onto your iPhone.
                </p>
              </div>
            )}

            {/* iOS Safari Guided Steps - EXACT PREVIOUS VERSION */}
            {isIos ? (
              <div className="space-y-2.5">
                <p className="text-xs font-bold text-slate-800">
                  Follow these 3 quick steps in Safari:
                </p>

                <div className="space-y-2 text-xs text-slate-700">
                  {/* Step 1 */}
                  <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-black text-[11px] flex items-center justify-center flex-shrink-0 shadow-xs">
                      1
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900">
                        Tap the <span className="text-blue-600 font-bold">Share</span> button
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {isIpad
                          ? 'Located at the top toolbar in Safari'
                          : 'Located at the bottom bar of Safari'}
                      </p>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-blue-600 shadow-2xs flex-shrink-0">
                      <Share className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-black text-[11px] flex items-center justify-center flex-shrink-0 shadow-xs">
                      2
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900">
                        Scroll down and tap
                      </p>
                      <p className="text-[11px] font-bold text-slate-800">
                        &quot;Add to Home Screen&quot;
                      </p>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-800 shadow-2xs flex-shrink-0">
                      <PlusSquare className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-black text-[11px] flex items-center justify-center flex-shrink-0 shadow-xs">
                      3
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900">
                        Tap <span className="text-blue-600 font-bold">&quot;Add&quot;</span> in top right
                      </p>
                      <p className="text-[11px] text-slate-500">
                        App will instantly appear on your home screen
                      </p>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 shadow-2xs flex-shrink-0 font-bold text-[11px]">
                      Add
                    </div>
                  </div>
                </div>

                {/* iPhone Bottom Bar Indicator Cue */}
                {!isIpad && (
                  <div className="pt-1 flex items-center justify-center gap-1.5 text-[11px] text-blue-600 font-bold animate-bounce">
                    <ChevronDown className="w-3.5 h-3.5" />
                    <span>Look for the Share icon at the bottom of your screen</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </div>
                )}

                {/* Direct 1-Tap iOS WebClip Profile Option */}
                <div className="pt-2 border-t border-slate-100 space-y-1.5">
                  <p className="text-[10px] text-slate-500 font-semibold text-center">
                    Alternative: Install via Apple Configuration Profile
                  </p>
                  <a
                    href="/api/pwa/ios-profile"
                    className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 border border-slate-300/80"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-600" />
                    <span>Download iOS Install Profile (.mobileconfig)</span>
                  </a>
                </div>
              </div>
            ) : (
              /* Android 1-Click Install Flow */
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={openChromeIntent}
                  className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-98 text-white font-black text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4 text-white" />
                  <span>1-Tap Install in Chrome Browser</span>
                  <ExternalLink className="w-3.5 h-3.5 text-blue-200" />
                </button>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 text-xs space-y-1">
                  <p className="font-semibold text-slate-800">
                    Why open in Chrome?
                  </p>
                  <p className="text-[11px] leading-relaxed">
                    You are currently viewing this inside an in-app browser tab (e.g. WhatsApp). Tapping the button above launches Chrome to install the app with 1 tap.
                  </p>
                </div>
              </div>
            )}

            {/* Close Button */}
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl shadow-xs transition"
            >
              Got it, close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
