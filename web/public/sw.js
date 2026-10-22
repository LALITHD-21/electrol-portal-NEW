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
    icon: '/icon-192.png',
    badge: '/icon-192.png',
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

  const options = {
    body: data.body,
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/icon-192.png',
    data: {
      url: data.url || '/search',
      timestamp: Date.now(),
    },
    tag: data.tag || 'polling-day-reminder',
    renotify: true,
    requireInteraction: true,
    vibrate: [200, 100, 200],
    actions: [
      {
        action: 'open',
        title: 'ಮತದಾರರ ಪಟ್ಟಿ ವೀಕ್ಷಿಸಿ / Open',
      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
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
