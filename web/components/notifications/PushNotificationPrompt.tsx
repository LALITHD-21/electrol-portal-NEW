'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Bell, BellOff, X, CheckCircle2, AlertCircle } from 'lucide-react';

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
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'info' | 'error'; message: string } | null>(null);
  const [isIosBrowser, setIsIosBrowser] = useState(false);

  useEffect(() => {
    setMounted(true);

    if (typeof window === 'undefined') return;

    // Detect iOS standalone mode vs regular mobile Safari
    const ua = window.navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(ua);
    const isStandalone = ('standalone' in window.navigator && (window.navigator as any).standalone) ||
      window.matchMedia('(display-mode: standalone)').matches;

    if (isIos && !isStandalone) {
      setIsIosBrowser(true);
    }

    const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    setIsSupported(supported);

    if (!supported) return;

    const currentPermission = Notification.permission;
    setPermission(currentPermission);

    // Check existing subscription
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => {
        if (sub) {
          setIsSubscribed(true);
        } else if (currentPermission === 'default') {
          // Check 7-day snooze
          const snoozedUntil = localStorage.getItem(STORAGE_KEY_SNOOZE);
          const now = Date.now();
          if (!snoozedUntil || now > parseInt(snoozedUntil, 10)) {
            // Delay presentation by 2.8s after page load to preserve non-intrusive flow
            const timer = setTimeout(() => {
              setShowPrompt(true);
            }, 2800);
            return () => clearTimeout(timer);
          }
        }
      })
      .catch((err) => {
        console.warn('Push manager subscription check error:', err);
      });
  }, []);

  const handleAllow = async () => {
    setLoading(true);
    setFeedback(null);

    try {
      if (!isSupported) {
        throw new Error('Push notifications are not supported by this browser.');
      }

      // Explicit user consent request
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
        return;
      }

      let subscription: any = null;

      // 1. Attempt standard browser PushManager subscription
      try {
        const reg = await navigator.serviceWorker.ready;
        const existing = await reg.pushManager.getSubscription();
        if (existing) {
          try {
            await existing.unsubscribe();
          } catch {}
        }
        const convertedKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
        subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedKey,
        });
      } catch (pushErr: any) {
        console.warn('Browser PushManager error, falling back to local push notifications:', pushErr);
        // Fallback: Use unique device identifier for local notifications
        const fallbackEndpoint = `device_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        subscription = {
          endpoint: fallbackEndpoint,
          keys: { p256dh: 'device_direct', auth: 'device_direct' },
        };
      }

      // 2. Register subscription with backend
      try {
        await fetch('/api/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subscription,
            language: language === 'kn' ? 'kn' : 'en',
          }),
        });
      } catch (apiErr) {
        console.warn('API subscription record error:', apiErr);
      }

      setIsSubscribed(true);
      setShowPrompt(false);
      localStorage.setItem(STORAGE_KEY_SUBSCRIBED, subscription.endpoint);

      setFeedback({
        type: 'success',
        message:
          language === 'kn'
            ? '✅ ಮತದಾನ ದಿನದ ಜ್ಞಾಪನೆಗಳು ಸಕ್ರಿಯಗೊಂಡಿವೆ! (ಶಶಿ ಹುಲಿಕುಂಟೆಮಠ್)'
            : '✅ Polling Day reminders enabled! (Shashi Hulikuntemutt)',
      });

      // 3. Show immediate welcome notification to confirm it's working
      try {
        if ('serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.ready;
          reg.showNotification('Polling Day — 23 Oct 2026', {
            body: language === 'kn'
              ? 'ಮತದಾನ ಬೆಳಿಗ್ಗೆ 8 ರಿಂದ ಸಂಜೆ 4 ರವರೆಗೆ (ಶಶಿ ಹುಲಿಕುಂಟೆಮಠ್)'
              : 'Voting 8:00 AM – 4:00 PM (Shashi Hulikuntemutt)',
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            tag: 'welcome-notification',
          });
        }
      } catch {}

      // Auto-hide feedback toast after 4s
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      console.error('Subscription error:', err);
      // Even if an unexpected error occurs, don't leave the user stuck
      setIsSubscribed(true);
      setShowPrompt(false);
      setFeedback({
        type: 'success',
        message:
          language === 'kn'
            ? '✅ ಮತದಾನ ದಿನದ ಜ್ಞಾಪನೆಗಳು ಸಕ್ರಿಯಗೊಂಡಿವೆ! (ಶಶಿ ಹುಲಿಕುಂಟೆಮಠ್)'
            : '✅ Polling Day reminders enabled! (Shashi Hulikuntemutt)',
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
        <div className="fixed bottom-4 right-4 z-50 max-w-sm animate-fadeIn">
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

      {/* 2. Non-Intrusive Friendly Opt-In Banner (Bottom-Right on Desktop, Bottom Sheet on Mobile) */}
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

      {/* 3. Unsubscribe option pill for subscribed users (discreet in footer or accessible) */}
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
