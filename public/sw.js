// Offline support. Hashed build files (/assets/) are cache-first, since they never change.
// Everything else on this origin is network-first, falling back to the cache when offline.
// Audio clips, images and pages are cached the first time they load.
// ponytail: no precache list. A page or clip works offline only after it has been opened online once.
const CACHE = 'verbidoo-v1'

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(
  caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()),
))

self.addEventListener('fetch', (e) => {
  const req = e.request
  const url = new URL(req.url)
  if (req.method !== 'GET' || url.origin !== location.origin) return // Supabase, fonts, etc. go straight to network

  const save = (res) => {
    if (res.status === 200) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)) } // skip 206 audio ranges
    return res
  }

  if (url.pathname.startsWith('/assets/')) {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then(save)))
    return
  }
  e.respondWith(fetch(req).then(save).catch(async () =>
    (await caches.match(req)) || (req.mode === 'navigate' && (await caches.match('/'))) || Response.error()))
})
