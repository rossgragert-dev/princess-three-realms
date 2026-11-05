/* Offline cache. CACHE is bumped by tools/make_precache.mjs on every build (it rewrites the line below). */
const CACHE = 'ptr-05733a9c48';
const PRECACHE_URL = './precache.json';

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    try {
      const list = await (await fetch(PRECACHE_URL, { cache: 'no-store' })).json();
      // Add one by one: a missing optional file (e.g. a narration clip not yet recorded) must not abort install.
      await Promise.all(list.map((u) => cache.add(u).catch(() => undefined)));
    } catch { /* first dev run without a build: nothing to precache */ }
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(req, { ignoreSearch: true });
    if (hit) return hit;
    try {
      const res = await fetch(req);
      if (res.ok) cache.put(req, res.clone());
      return res;
    } catch {
      if (req.mode === 'navigate') { const index = await cache.match('./index.html') || await cache.match('./'); if (index) return index; }
      return new Response('', { status: 504 });
    }
  })());
});
