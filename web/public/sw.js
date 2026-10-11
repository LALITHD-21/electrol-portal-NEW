// PWA Service Worker for Voter Search Portal (v4 - Ultra-fast & Safe)
const CACHE_NAME = 'voter-search-pwa-v4';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // CRITICAL: NEVER intercept API requests, Next.js assets, or non-GET requests.
  // Passing through to native browser stack guarantees maximum search speed and prevents script corruption.
  const url = new URL(event.request.url);
  if (
    event.request.method !== 'GET' ||
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/_next')
  ) {
    return;
  }

  // Only handle browser navigation requests (HTML page visits)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/search');
      })
    );
  }
});
