// Master plan PACR — service worker: works offline, updates the page when online.
const VERSION = 'pacr-v1';
const ASSETS = [
  './', 'index.html', 'manifest.webmanifest',
  'apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'favicon-32.png',
  'barlow-latin-400-normal.woff2', 'barlow-latin-500-normal.woff2', 'barlow-latin-600-normal.woff2', 'barlow-latin-700-normal.woff2',
  'barlow-condensed-latin-500-normal.woff2', 'barlow-condensed-latin-600-normal.woff2', 'barlow-condensed-latin-700-normal.woff2',
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(VERSION).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('pacr-') && k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  // The page itself: network first so updates arrive, cached copy when offline.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(res => { const copy = res.clone(); caches.open(VERSION).then(c => c.put('index.html', copy)); return res; })
        .catch(() => caches.match('index.html'))
    );
    return;
  }
  // Fonts and icons: cache first.
  event.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
      return res;
    }))
  );
});
