'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Bell, BellOff, X, CheckCircle2, AlertCircle, Sparkles, Smartphone, Share2 } from 'lucide-react';

const VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  'BMdNkZ8bdFSIAwaVY8lSqt5EI5jF87f7x1OGwLJoDwm6qxt2uUR6R0B97QroKkBXosiFCHn57K7l1AaDmfIKTzY';

const SNOOZE_DAYS = 7;
const SNOOZE_MS = SNOOZE_DAYS * 24 * 60 * 60 * 1000;
const STORAGE_KEY_SNOOZE = 'push_prompt_snoozed_until';
const STORAGE_KEY_SUBSCRIBED = 'push_prompt_subscribed_endpoint';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function PushNotificationPrompt() {
  const { language } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'info' | 'error'; message: string } | null>(null);
  const [isIosBrowser, setIsIosBrowser] = useState(false);

  // Core subscribe helper with real push gateway
  const performSubscription = useCallback(async (isAuto = false) => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null;

    try {
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();

      if (!sub) {
        const convertedKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedKey,
        });
      }

      if (sub && sub.endpoint) {
        // Register with server
        await fetch('/api/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subscription: sub,
            language: language === 'kn' ? 'kn' : 'en',
          }),
        });

        setIsSubscribed(true);
        try {
          localStorage.setItem(STORAGE_KEY_SUBSCRIBED, sub.endpoint);
        } catch {}

        return sub;
      }
    } catch (err) {
      console.warn('Subscription registration error:', err);
      if (!isAuto) throw err;
    }
    return null;
  }, [language]);

  // Trigger test notification locally on the device to verify instant display
  const fireTestNotification = useCallback(async () => {
    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.ready;
        await reg.showNotification(
          language === 'kn' ? '✅ ಜ್ಞಾಪನೆಗಳು ಸಕ್ರಿಯವಾಗಿವೆ — ಶಶಿ ಹುಲಿಕುಂಟೆಮಠ್' : '✅ Alerts Active — Shashi Hulikuntemutt',
          {
            body:
              language === 'kn'
                ? 'ಮತದಾನ ದಿನ: 23 ಅಕ್ಟೋಬರ್ 2026 (ಬೆಳಿಗ್ಗೆ 8:00 - ಸಂಜೆ 4:00). ನಿಮ್ಮ ಮೊಬೈಲ್‌ನಲ್ಲಿ ಅಧಿಕೃತ ಮಾಹಿತಿ ದೊರೆಯಲಿದೆ.'
                : 'Polling Day: Friday, 23 Oct 2026 (8:00 AM – 4:00 PM). Live alerts are active on this device.',
            icon: '/app-logo.png',
            badge: '/icon-192.png',
            tag: 'test-notification',
            vibrate: [200, 100, 200],
            data: { url: '/search' },
          } as any
        );
      }
    } catch (e) {
      console.warn('Native test notification show error:', e);
    }
  }, [language]);

  useEffect(() => {
    setMounted(true);

    if (typeof window === 'undefined') return;

    // Detect iOS standalone mode vs regular mobile Safari
    const ua = window.navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(ua);
    const isStandalone =
      ('standalone' in window.navigator && (window.navigator as any).standalone) ||
      window.matchMedia('(display-mode: standalone)').matches;

    if (isIos && !isStandalone) {
      setIsIosBrowser(true);
    }

    const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    setIsSupported(supported);

    if (!supported) return;

    const currentPermission = Notification.permission;
    setPermission(currentPermission);

    // If permission already granted, automatically verify/refresh subscription in background
    if (currentPermission === 'granted') {
      performSubscription(true);
    } else if (currentPermission === 'default') {
      // Check 7-day snooze
      const snoozedUntil = localStorage.getItem(STORAGE_KEY_SNOOZE);
      const now = Date.now();
      if (!snoozedUntil || now > parseInt(snoozedUntil, 10)) {
        const timer = setTimeout(() => {
          setShowPrompt(true);
        }, 2200);
        return () => clearTimeout(timer);
      }
    }

    // Global listener for on-demand trigger (from bell buttons across the UI)
    const handleOpenPrompt = async () => {
      if (isIos && !isStandalone) {
        setShowIosGuide(true);
        return;
      }

      if (!('Notification' in window)) {
        setFeedback({
          type: 'error',
          message: 'Push notifications are not supported on this browser.',
        });
        return;
      }

      if (Notification.permission === 'granted') {
        setLoading(true);
        try {
          await performSubscription(false);
          await fireTestNotification();
          setFeedback({
            type: 'success',
            message:
              language === 'kn'
                ? '✅ ಅಧಿಸೂಚನೆಗಳು ಸಕ್ರಿಯವಾಗಿವೆ! ಮೊಬೈಲ್ ಪರದೆಯಲ್ಲಿ ಪರೀಕ್ಷಾ ಸಂದೇಶ ಕಳುಹಿಸಲಾಗಿದೆ.'
                : '✅ Alerts are active! Sent an instant screen test notification.',
          });
        } catch {
          await fireTestNotification();
          setFeedback({
            type: 'success',
            message:
              language === 'kn'
                ? '✅ ಪರೀಕ್ಷಾ ಅಧಿಸೂಚನೆ ಕಳುಹಿಸಲಾಗಿದೆ.'
                : '✅ Test notification sent to screen.',
          });
        } finally {
          setLoading(false);
          setTimeout(() => setFeedback(null), 4500);
        }
        return;
      }

      if (Notification.permission === 'denied') {
        setFeedback({
          type: 'info',
          message:
            language === 'kn'
              ? '⚠️ ಅಧಿಸೂಚನೆಗಳನ್ನು ಬ್ರೌಸರ್ ಸೆಟ್ಟಿಂಗ್ಸ್‌ಗಳಲ್ಲಿ ನಿರ್ಬಂಧಿಸಲಾಗಿದೆ. URL ಬಾರ್‌ನಲ್ಲಿರುವ ಲಾಕ್ ಐಕಾನ್ ಒತ್ತಿ ಅನುಮತಿಸಿ.'
              : '⚠️ Notifications are blocked in browser settings. Tap the lock icon in the address bar to allow.',
        });
        setTimeout(() => setFeedback(null), 5000);
        return;
      }

      // Default permission: open the prompt
      setShowPrompt(true);
    };

    window.addEventListener('open-push-prompt', handleOpenPrompt);
    return () => window.removeEventListener('open-push-prompt', handleOpenPrompt);
  }, [fireTestNotification, language, performSubscription]);

  const handleAllow = async () => {
    setLoading(true);
    setFeedback(null);

    try {
      if (isIosBrowser) {
        setShowPrompt(false);
        setShowIosGuide(true);
        return;
      }

      if (!isSupported) {
        throw new Error('Push notifications are not supported by this browser.');
      }

      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm !== 'granted') {
        setShowPrompt(false);
        setFeedback({
          type: 'info',
          message:
            language === 'kn'
              ? 'ಅಧಿಸೂಚನೆಗಳ ಅನುಮತಿಯನ್ನು ನಿರಾಕರಿಸಲಾಗಿದೆ. ಬ್ರೌಸರ್ ಸೆಟ್ಟಿಂಗ್ಸ್‌ಗಳಲ್ಲಿ ಬದಲಾಯಿಸಬಹುದು.'
              : 'Notification permission was dismissed. You can change this in browser settings.',
        });
        setTimeout(() => setFeedback(null), 4000);
        return;
      }

      await performSubscription(false);
      await fireTestNotification();

      setShowPrompt(false);
      setFeedback({
        type: 'success',
        message:
          language === 'kn'
            ? '✅ ಮತದಾನ ದಿನದ ಜ್ಞಾಪನೆಗಳು ಸಕ್ರಿಯಗೊಂಡಿವೆ! (ಶಶಿ ಹುಲಿಕುಂಟೆಮಠ್)'
            : '✅ Polling Day reminders enabled! (Shashi Hulikuntemutt)',
      });

      setTimeout(() => setFeedback(null), 4500);
    } catch (err: any) {
      console.error('Subscription error:', err);
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to subscribe to notifications.',
      });
      setTimeout(() => setFeedback(null), 4000);
    } finally {
      setLoading(false);
    }
  };

  const handleSnooze = () => {
    try {
      const snoozeUntil = Date.now() + SNOOZE_MS;
      localStorage.setItem(STORAGE_KEY_SNOOZE, snoozeUntil.toString());
    } catch {}
    setShowPrompt(false);
  };

  const handleUnsubscribe = async () => {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch('/api/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setIsSubscribed(false);
      localStorage.removeItem(STORAGE_KEY_SUBSCRIBED);
      setFeedback({
        type: 'info',
        message:
          language === 'kn'
            ? 'ಅಧಿಸೂಚನೆಗಳಿಂದ ಯಶಸ್ವಿಯಾಗಿ ನಿರ್ಗಮಿಸಲಾಗಿದೆ.'
            : 'Unsubscribed from polling notifications.',
      });
      setTimeout(() => setFeedback(null), 3500);
    } catch (err: any) {
      console.error('Unsubscribe error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <>
      {/* 1. Optional Feedback Toast */}
      {feedback && (
        <div className="fixed top-14 sm:top-5 right-3 left-3 sm:left-auto sm:right-5 z-50 max-w-sm animate-fadeIn">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl text-xs sm:text-sm font-semibold border ${
              feedback.type === 'success'
                ? 'bg-emerald-900/95 text-emerald-100 border-emerald-500/50'
                : feedback.type === 'error'
                ? 'bg-rose-900/95 text-rose-100 border-rose-500/50'
                : 'bg-slate-900/95 text-slate-100 border-slate-700/60'
            } backdrop-blur-md`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            <span className="flex-1">{feedback.message}</span>
            <button
              onClick={() => setFeedback(null)}
              className="text-white/60 hover:text-white p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 2. iOS Safari Step-by-Step Guidance Modal */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                  <Smartphone className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  {language === 'kn' ? 'ಐಫೋನ್‌ನಲ್ಲಿ ಅಧಿಸೂಚನೆ ಪಡೆಯಲು' : 'Push Alerts on iPhone'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowIosGuide(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {language === 'kn'
                ? 'ಆಪಲ್ ಐಫೋನ್‌ನಲ್ಲಿ ಅಧಿಸೂಚನೆಗಳನ್ನು ಸ್ವೀಕರಿಸಲು, ಈ ಆ್ಯಪ್ ಅನ್ನು ಮುಖಪುಟಕ್ಕೆ (Home Screen) ಸೇರಿಸಬೇಕಾಗಿದೆ:'
                : 'Apple iOS requires adding the portal to your Home Screen to deliver live push notifications:'}
            </p>

            <div className="space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-200/80 text-xs text-slate-700">
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 font-bold text-[10px]">1</span>
                <span>{language === 'kn' ? 'ಸಫಾರಿ ಕೆಳಭಾಗದಲ್ಲಿರುವ ಶೇರ್ (Share) ಐಕಾನ್ ಒತ್ತಿ' : 'Tap the Share icon at the bottom of Safari'} <Share2 className="w-3.5 h-3.5 inline text-blue-600" /></span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 font-bold text-[10px]">2</span>
                <span>{language === 'kn' ? "'Add to Home Screen' ಆಯ್ಕೆಮಾಡಿ" : "Scroll down and tap 'Add to Home Screen'"}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 font-bold text-[10px]">3</span>
                <span>{language === 'kn' ? 'ಮುಖಪುಟದಿಂದ ಆ್ಯಪ್ ತೆರೆದು ಜ್ಞಾಪನೆ ಸಕ್ರಿಯಗೊಳಿಸಿ' : 'Open from Home Screen and tap Allow to get alerts'}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIosGuide(false)}
              className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 active:scale-95 transition"
            >
              {language === 'kn' ? 'ಅರ್ಥವಾಯಿತು / Done' : 'Got it'}
            </button>
          </div>
        </div>
      )}

      {/* 3. Non-Intrusive Friendly Opt-In Banner (Bottom-Right on Desktop, Bottom Sheet on Mobile) */}
      {showPrompt && !isSubscribed && (
        <aside
          role="complementary"
          aria-label="Polling Day Notification Opt-in"
          className="fixed bottom-3 sm:bottom-5 left-3 right-3 sm:left-auto sm:right-5 z-40 max-w-md bg-white/98 backdrop-blur-md rounded-2xl sm:rounded-3xl border border-blue-200/90 shadow-2xl p-4 sm:p-5 transition-all duration-300 animate-slideUp font-sans"
        >
          <div className="flex items-start gap-3 sm:gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200/80 flex items-center justify-center shrink-0 text-blue-700 shadow-2xs">
              <Bell className="w-5 h-5 animate-pulse" />
            </div>

            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-sm font-bold text-slate-900 tracking-tight leading-tight">
                  {language === 'kn'
                    ? 'ಮತದಾನ ದಿನದ ಜ್ಞಾಪನೆಗಳು ಬೇಕೇ?'
                    : 'Get polling day reminders?'}
                </h4>
                <button
                  type="button"
                  onClick={handleSnooze}
                  className="text-slate-400 hover:text-slate-600 p-1 -mr-1"
                  aria-label="Dismiss notification prompt"
                  title="Dismiss for 7 days"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                {language === 'kn'
                  ? 'ಅಕ್ಟೋಬರ್ 23, 2026 ಮತದಾನದ ದಿನದ ಅಧಿಕೃತ ಸಮಯ ಮತ್ತು ಮತಗಟ್ಟೆ ಜ್ಞಾಪನೆಗಳನ್ನು ನೇರವಾಗಿ ಪಡೆಯಿರಿ. (ಶಶಿ ಹುಲಿಕುಂಟೆಮಠ್)'
                  : 'Receive official polling hours & booth reminders on 23 October 2026. Strictly opt-in, zero spam.'}
              </p>

              {isIosBrowser && (
                <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-xl border border-amber-200 mt-2">
                  ℹ️ On iPhone/iPad: Tap <strong>Share</strong> and choose <strong>Add to Home Screen</strong> to receive push notifications.
                </p>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleAllow}
                  disabled={loading}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-700 to-indigo-600 hover:from-blue-800 hover:to-indigo-700 shadow-sm active:scale-95 transition disabled:opacity-50"
                >
                  {loading
                    ? (language === 'kn' ? 'ಸಕ್ರಿಯಗೊಳಿಸಲಾಗುತ್ತಿದೆ...' : 'Enabling...')
                    : (language === 'kn' ? 'ಅನುಮತಿಸಿ / Allow' : 'Allow')}
                </button>

                <button
                  type="button"
                  onClick={handleSnooze}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition active:scale-95"
                >
                  {language === 'kn' ? 'ಈಗ ಬೇಡ (Not now)' : 'Not now'}
                </button>
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* 4. Persistent Mobile Floating Bell Button (Discreet, easily tappable at any time) */}
      {!showPrompt && (
        <div className="fixed bottom-4 left-3 z-30 sm:hidden">
          <button
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('open-push-prompt'));
              }
            }}
            disabled={loading}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold shadow-lg border backdrop-blur-md transition-all active:scale-95 ${
              isSubscribed || permission === 'granted'
                ? 'bg-emerald-50/95 border-emerald-300 text-emerald-800'
                : 'bg-white/95 border-blue-300 text-blue-800'
            }`}
          >
            <span className="relative flex h-2 w-2">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isSubscribed || permission === 'granted' ? 'bg-emerald-400' : 'bg-blue-400'
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  isSubscribed || permission === 'granted' ? 'bg-emerald-500' : 'bg-blue-500'
                }`}
              />
            </span>
            <Bell className="w-3.5 h-3.5" />
            <span>
              {isSubscribed || permission === 'granted'
                ? (language === 'kn' ? 'ಜ್ಞಾಪನೆ ಸಕ್ರಿಯ' : 'Alerts Active')
                : (language === 'kn' ? 'ಜ್ಞಾಪನೆ ಪಡೆಯಿರಿ' : 'Get Alerts')}
            </span>
          </button>
        </div>
      )}

      {/* 5. Desktop Unsubscribe option pill for subscribed users */}
      {isSubscribed && (
        <div className="fixed bottom-3 right-3 z-30 hidden md:block">
          <button
            type="button"
            onClick={handleUnsubscribe}
            disabled={loading}
            title="Click to unsubscribe from reminders"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium bg-white/90 border border-slate-200 text-slate-600 hover:text-rose-600 hover:border-rose-300 shadow-2xs backdrop-blur-xs transition"
          >
            <BellOff className="w-3.5 h-3.5" />
            <span>{language === 'kn' ? 'ಜ್ಞಾಪನೆ ರದ್ದುಗೊಳಿಸಿ' : 'Subscribed to alerts'}</span>
          </button>
        </div>
      )}
    </>
  );
}
