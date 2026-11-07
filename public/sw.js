const CACHE_VERSION = 'stitch-and-scrap-v1';
const APP_SHELL_CACHE = `${CACHE_VERSION}-shell`;
const ASSET_CACHE = `${CACHE_VERSION}-assets`;

const APP_SHELL_FILES = [
  './',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(APP_SHELL_CACHE);
    await Promise.allSettled(
      APP_SHELL_FILES.map((url) => cache.add(url))
    );
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames
        .filter((name) =>
          name.startsWith('stitch-and-scrap-') &&
          name !== APP_SHELL_CACHE &&
          name !== ASSET_CACHE
        )
        .map((name) => caches.delete(name))
    );
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const requestUrl = new URL(request.url);

  if (request.method !== 'GET' || requestUrl.origin !== self.location.origin) {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response.ok) {
          const cache = await caches.open(APP_SHELL_CACHE);
          await cache.put('./', response.clone());
        }
        return response;
      } catch {
        const cache = await caches.open(APP_SHELL_CACHE);
        return (await cache.match(request)) ||
          (await cache.match('./')) ||
          Response.error();
      }
    })());
    return;
  }

  // Cache static files, but leave application data and API requests network-only.
  const isStaticAsset =
    ['script', 'style', 'image', 'font'].includes(request.destination) ||
    /\.(?:js|css|png|jpg|jpeg|webp|svg|ico|woff2?)$/i.test(requestUrl.pathname);

  if (!isStaticAsset) return;

  event.respondWith((async () => {
    const cache = await caches.open(ASSET_CACHE);
    const cached = await cache.match(request);
    if (cached) return cached;

    try {
      const response = await fetch(request);
      if (response.ok) await cache.put(request, response.clone());
      return response;
    } catch {
      return cached || Response.error();
    }
  })());
});
