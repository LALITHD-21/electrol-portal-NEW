'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AppShell from '@/components/shell/AppShell';
import {
  Bell,
  Send,
  Users,
  ShieldAlert,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  KeyRound,
} from 'lucide-react';
import { SCHEDULED_REMINDERS } from '@/lib/push-types';

export default function AdminPushNotificationPage() {
  const [secret, setSecret] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [subscribersCount, setSubscribersCount] = useState<number | null>(null);
  const [languages, setLanguages] = useState<{ en: number; kn: number }>({ en: 0, kn: 0 });

  const [title, setTitle] = useState('Polling Day — 23 Oct 2026');
  const [message, setMessage] = useState('Voting 8:00 AM – 4:00 PM. ಮತದಾನ ಬೆಳಿಗ್ಗೆ 8 ರಿಂದ ಸಂಜೆ 4 ರವರೆಗೆ');
  const [url, setUrl] = useState('/search');
  const [targetLang, setTargetLang] = useState<'all' | 'en' | 'kn'>('all');

  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const [vapidKey, setVapidKey] = useState(
    'BMdNkZ8bdFSIAwaVY8lSqt5EI5jF87f7x1OGwLJoDwm6qxt2uUR6R0B97QroKkBXosiFCHn57K7l1AaDmfIKTzY'
  );
  const [deviceSubscribed, setDeviceSubscribed] = useState(false);
  const [subscribingDevice, setSubscribingDevice] = useState(false);

  // Auto-fill and auto-unlock with admin session key
  useEffect(() => {
    try {
      const saved = localStorage.getItem('admin_push_secret') || 'shashi_mlc_2026_push_secret';
      setSecret(saved);
      loadStats(saved);
    } catch {
      setSecret('shashi_mlc_2026_push_secret');
      loadStats('shashi_mlc_2026_push_secret');
    }
  }, []);

  const loadStats = async (key: string) => {
    setError(null);
    try {
      const res = await fetch('/api/notifications/push', {
        headers: {
          'x-admin-push-secret': key,
        },
      });

      if (!res.ok) {
        throw new Error('Invalid Admin Secret or unauthorized.');
      }

      const data = await res.json();
      setSubscribersCount(data.subscribersCount ?? 0);
      setLanguages(data.languages || { en: 0, kn: 0 });
      if (data.vapidPublicKey) {
        setVapidKey(data.vapidPublicKey);
      }
      setIsUnlocked(true);
      try {
        localStorage.setItem('admin_push_secret', key);
      } catch {}
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
      setIsUnlocked(false);
    }
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!secret.trim()) return;
    loadStats(secret.trim());
  };

  const handleSelectTemplate = (template: typeof SCHEDULED_REMINDERS[0]) => {
    setTitle(template.title);
    setMessage(template.body);
    setUrl(template.url || '/search');
  };

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const handleSubscribeThisDevice = async () => {
    setSubscribingDevice(true);
    setError(null);
    try {
      if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('Notification' in window)) {
        throw new Error('Push notifications are not supported in this browser.');
      }

      const perm = await Notification.requestPermission();
      if (perm !== 'granted') {
        throw new Error('Notification permission was dismissed or blocked in your browser settings.');
      }

      let sub: any = null;
      const reg = await navigator.serviceWorker.ready;
      sub = await reg.pushManager.getSubscription();
      if (!sub) {
        const converted = urlBase64ToUint8Array(vapidKey);
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: converted,
        });
      }

      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: sub,
          language: targetLang === 'kn' ? 'kn' : 'en',
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to save subscription.');
      }

      setDeviceSubscribed(true);
      await loadStats(secret);
      alert('✅ This device has been registered as a subscriber! You can now send live broadcasts.');
    } catch (err: any) {
      console.error('Device subscription error:', err);
      setError(err.message || 'Failed to register this device.');
    } finally {
      setSubscribingDevice(false);
    }
  };

  const handleTestOnScreen = async () => {
    try {
      if (typeof window === 'undefined' || !('Notification' in window)) {
        alert('Notification API is not supported in this browser.');
        return;
      }

      const perm = await Notification.requestPermission();
      if (perm !== 'granted') {
        alert('Please allow notification permissions in your browser to test.');
        return;
      }

      const reg = await navigator.serviceWorker.ready.catch(() => null);
      if (reg && reg.showNotification) {
        await reg.showNotification(title.trim() || 'Polling Day — 23 Oct 2026', {
          body: message.trim() || 'Voting 8:00 AM – 4:00 PM. ಮತದಾನ ಬೆಳಿಗ್ಗೆ 8 ರಿಂದ ಸಂಜೆ 4 ರವರೆಗೆ',
          icon: '/app-logo.png',
          badge: '/icon-192.png',
          data: { url: url || '/search' },
        });
      } else {
        new Notification(title.trim() || 'Polling Day — 23 Oct 2026', {
          body: message.trim() || 'Voting 8:00 AM – 4:00 PM. ಮತದಾನ ಬೆಳಿಗ್ಗೆ 8 ರಿಂದ ಸಂಜೆ 4 ರವರೆಗೆ',
          icon: '/app-logo.png',
        });
      }
    } catch (err: any) {
      alert(`Test notification error: ${err.message}`);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      alert('Please fill out both Title and Message.');
      return;
    }

    if ((subscribersCount ?? 0) === 0) {
      const proceed = confirm(
        'Currently 0 subscriber devices are registered in the database.\n\nDo you want to send and queue this broadcast now anyway?'
      );
      if (!proceed) return;
    } else {
      if (
        !confirm(
          `Are you sure you want to broadcast this notification to ${
            subscribersCount ?? 'all'
          } subscribers?`
        )
      ) {
        return;
      }
    }

    setSending(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch('/api/notifications/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-push-secret': secret,
        },
        body: JSON.stringify({
          title: title.trim(),
          body: message.trim(),
          url: url.trim(),
          language: targetLang,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Broadcast failed.');
      }

      setResult(data);
      // Refresh count after delivery
      loadStats(secret);
    } catch (err: any) {
      setError(err.message || 'Error dispatching notifications');
    } finally {
      setSending(false);
    }
  };

  return (
    <AppShell>
      <div className="flex-1 bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur-md px-4 sm:px-8 py-3.5 sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/search"
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>Push Notification Console</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200 uppercase">
                Campaign Dispatcher
              </span>
            </h1>
            <p className="text-xs text-slate-500">
              Shashi Hulikuntemutt · Karnataka South-East Graduates Constituency 2026
            </p>
          </div>
        </div>

        {isUnlocked && (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Users className="w-3.5 h-3.5" />
              <span>{subscribersCount ?? 0} Subscribers</span>
            </span>
          </div>
        )}
      </header>

      <main className="max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex-1 space-y-6">
        {!isUnlocked ? (
          /* Password Authentication Gate */
          <div className="max-w-md mx-auto my-12 bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center mx-auto shadow-xs">
              <KeyRound className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h2 className="text-lg font-black text-slate-900">Admin Authorization Required</h2>
              <p className="text-xs text-slate-500">
                Enter your campaign dispatcher secret key to send push notifications.
              </p>
            </div>

            <form onSubmit={handleUnlock} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Admin Push Secret
                </label>
                <input
                  type="password"
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  placeholder="Enter secret key..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition shadow-sm"
              >
                Unlock Console
              </button>
            </form>
          </div>
        ) : (
          /* Unlocked Admin Broadcast Console */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Notification Composer */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-soft-sm p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <Send className="w-4 h-4 text-blue-600" />
                    <span>Compose Broadcast Notification</span>
                  </h3>
                  <span className="text-xs text-slate-500">Rate limit: Max 3/day</span>
                </div>

                <form onSubmit={handleSend} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Notification Title (Max 60 chars)
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      maxLength={65}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Message Body (Bilingual Kannada + English recommended)
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={3}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Target URL (Opens on Click)
                      </label>
                      <input
                        type="text"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Language Audience
                      </label>
                      <select
                        value={targetLang}
                        onChange={(e) => setTargetLang(e.target.value as any)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                      >
                        <option value="all">All Subscribers ({subscribersCount})</option>
                        <option value="kn">Kannada Only ({languages.kn})</option>
                        <option value="en">English Only ({languages.en})</option>
                      </select>
                    </div>
                  </div>

                  {/* Result & Error display */}
                  {error && (
                    <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  {result && (
                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-sm">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>{result.message}</span>
                      </div>
                      <p>
                        Total: {result.result?.total} | Sent: {result.result?.sent} | Failed: {result.result?.failed} | Cleaned Expired: {result.result?.removedDead}
                      </p>
                    </div>
                  )}

                  {/* Subscribers Guidance when count is 0 */}
                  {(subscribersCount ?? 0) === 0 && (
                    <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 text-xs space-y-2">
                      <div className="flex items-center gap-2 font-bold text-blue-800">
                        <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>No Devices Registered Yet (0 Subscribers)</span>
                      </div>
                      <p className="text-blue-700 leading-relaxed">
                        To receive notifications on this computer or phone, click <strong>Register This Device</strong> below. You can also test how the notification looks on your screen right now with <strong>Screen Test</strong>.
                      </p>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <button
                          type="button"
                          onClick={handleSubscribeThisDevice}
                          disabled={subscribingDevice}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition"
                        >
                          <Bell className="w-3.5 h-3.5" />
                          <span>{subscribingDevice ? 'Registering...' : '📱 Register This Device (+1)'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleTestOnScreen}
                          className="px-3 py-1.5 rounded-lg bg-white border border-blue-300 hover:bg-blue-50 text-blue-700 font-bold text-xs flex items-center gap-1.5 shadow-2xs transition"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          <span>🧪 Instant Screen Test</span>
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="pt-2 flex flex-wrap items-center gap-3 justify-between">
                    <button
                      type="submit"
                      disabled={sending}
                      className="px-6 py-2.5 rounded-xl text-sm font-black text-white bg-gradient-to-r from-blue-700 to-indigo-600 hover:from-blue-800 hover:to-indigo-700 shadow-md active:scale-95 transition disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      <span>{sending ? 'Broadcasting...' : 'Send Broadcast Now'}</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSubscribeThisDevice}
                        disabled={subscribingDevice}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 active:scale-95 transition flex items-center gap-1.5"
                        title="Subscribe your browser as a push device"
                      >
                        <Bell className="w-3.5 h-3.5 text-blue-600" />
                        <span>{subscribingDevice ? 'Subscribing...' : 'Subscribe This Device'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleTestOnScreen}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 active:scale-95 transition flex items-center gap-1.5"
                        title="Show immediate desktop/mobile banner preview"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Test on Screen</span>
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              {/* Notification Live Simulation Preview */}
              <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-6 space-y-3 shadow-xl">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Mobile / Desktop Notification Preview
                </span>
                <div className="bg-slate-800/90 rounded-2xl p-4 border border-slate-700/80 flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shrink-0 shadow-md">
                    <Bell className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="font-bold text-slate-300">SHASHI HULIKUNTEMUTT</span>
                      <span>Just now</span>
                    </div>
                    <h4 className="text-sm font-bold text-white truncate">{title || 'Notification Title'}</h4>
                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                      {message || 'Notification body text appears here...'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Col: Official Polling Templates & Stats */}
            <div className="space-y-6">
              {/* Audience Breakdown */}
              <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-3 shadow-soft-sm">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span>Subscribers Active</span>
                </h4>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="text-xl font-black text-slate-900">{subscribersCount ?? 0}</div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold">Total</div>
                  </div>
                  <div className="p-3 rounded-2xl bg-blue-50 border border-blue-100">
                    <div className="text-xl font-black text-blue-700">{languages.kn}</div>
                    <div className="text-[10px] text-blue-600 uppercase font-bold">Kannada</div>
                  </div>
                </div>
              </div>

              {/* Scheduled Templates */}
              <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-3 shadow-soft-sm">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  <span>Quick Polling Templates</span>
                </h4>

                <div className="space-y-2.5">
                  {SCHEDULED_REMINDERS.map((tpl) => (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => handleSelectTemplate(tpl)}
                      className="w-full text-left p-3 rounded-2xl border border-slate-200/90 hover:border-blue-400 hover:bg-blue-50/50 transition-all text-xs space-y-1 group"
                    >
                      <div className="flex items-center justify-between font-bold text-slate-800 group-hover:text-blue-700">
                        <span>{tpl.scheduledTimeIST}</span>
                        <Sparkles className="w-3.5 h-3.5 text-blue-500 opacity-0 group-hover:opacity-100 transition" />
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-1">{tpl.title}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      </div>
    </AppShell>
  );
}
