// PWA Service Worker for Voter Search Portal (v7 - Push & Offline Enabled)
const CACHE_NAME = 'voter-search-pwa-v7';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
          return Promise.resolve();
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // CRITICAL: NEVER intercept API requests, Next.js assets, or non-GET requests.
  const url = new URL(event.request.url);
  if (
    event.request.method !== 'GET' ||
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/_next')
  ) {
    return;
  }

  // Only handle browser navigation requests (HTML page visits) - Network-first
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request, { cache: 'no-cache' }).catch(() => {
        return caches.match(event.request) || caches.match('/search');
      })
    );
  }
});

// ─── Web Push Notification Handlers ───
self.addEventListener('push', (event) => {
  let data = {
    title: 'Polling Day — 23 Oct 2026',
    body: 'Voting 8:00 AM – 4:00 PM. ಮತದಾನ ಬೆಳಿಗ್ಗೆ 8 ರಿಂದ ಸಂಜೆ 4 ರವರೆಗೆ',
    url: '/search',
    icon: '/app-logo.png',
    badge: '/icon-192.png',
    tag: `broadcast-${Date.now()}`,
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    } catch {
      const text = event.data.text();
      if (text) data.body = text;
    }
  }

  // 1. Post to all active open tabs so the page can immediately play the pleasant chime sound
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        client.postMessage({
          type: 'PUSH_NOTIFICATION_RECEIVED',
          title: data.title,
          body: data.body,
          url: data.url || '/search',
        });
      }
    })
  );

  // 2. Display System Notification with fresh tag, vibration pattern, and sound
  const options = {
    body: data.body,
    icon: data.icon || '/app-logo.png',
    badge: data.badge || '/icon-192.png',
    data: {
      url: data.url || '/search',
      timestamp: Date.now(),
    },
    tag: data.tag || `poll-alert-${Date.now()}`,
    renotify: true,
    silent: false,
    vibrate: [300, 100, 300, 100, 450],
    sound: '/notification-sound.mp3',
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options).catch((err) => {
      console.warn('Rich notification failed, falling back to minimal notification:', err);
      return self.registration.showNotification(data.title, {
        body: data.body,
        icon: data.icon || '/app-logo.png',
        badge: data.badge || '/icon-192.png',
        data: {
          url: data.url || '/search',
        },
        silent: false,
      });
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/search';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
