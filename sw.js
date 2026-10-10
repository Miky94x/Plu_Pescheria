// la versione arriva da index.html (sw.js?v=...): un solo posto da aggiornare
const APP_VERSION = new URL(self.location.href).searchParams.get('v') || '0';
const CACHE_NAME = 'plu-pescheria-v' + APP_VERSION;
const ASSETS = [
  './',
  './index.html',
  './firebase-config.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Solo GET. Le chiamate a Firebase (Auth/Firestore, POST o altri domini)
  // passano direttamente in rete senza toccare la cache.
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const isSameOrigin = url.origin === self.location.origin;
  const isFirebaseSdk = url.hostname === 'www.gstatic.com';
  if (!isSameOrigin && !isFirebaseSdk) return;

  // pagina HTML: network-first (ultima versione online, cache come fallback offline)
  const isNavigation =
    req.mode === 'navigate' ||
    (req.headers.get('accept') || '').includes('text/html');

  if (isNavigation) {
    event.respondWith(
      fetch(req, { cache: 'no-store' })
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          return response;
        })
        .catch(() =>
          caches.match(req).then((cached) => cached || caches.match('./index.html'))
        )
    );
    return;
  }

  // asset statici e SDK Firebase: cache-first
  event.respondWith(
    caches.match(req).then((cached) => {
      return (
        cached ||
        fetch(req).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return response;
        })
      );
    })
  );
});
