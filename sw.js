const CACHE_NAME = 'bullkarry-v2';
const CORE_ASSETS = ['/', '/src/styles.css', '/src/app.js', '/data/content.json'];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(CORE_ASSETS)).catch(() => {}));
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});
