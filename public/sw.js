// Offline support.
// - Install precaches the app shell: the page, the hashed build files (/assets/), mascot images and icons.
//   The build (vite.config.ts → serviceWorker plugin) fills PRECACHE and VERSION; in dev both stay empty (no SW in dev).
// - /assets/ is cache-first (hashed names never change). Images are stale-while-revalidate (instant, refreshed in the background).
// - Audio clips go to their own cache that survives app updates, capped at AUDIO_MAX clips (oldest dropped first).
// - Google Fonts (the emoji font) is cached too, so emoji and flags still draw offline.
// - Everything else on this origin is network-first, falling back to the cache when offline.
const VERSION = /*VERSION*/'dev'
const PRECACHE = /*PRECACHE*/[]
const SHELL = `verbidoo-${VERSION}`
const AUDIO = 'verbidoo-audio-v1'
const FONTS = 'verbidoo-fonts-v1'
const AUDIO_MAX = 800 // ~9 KB each → ~7 MB

self.addEventListener('install', (e) => e.waitUntil(
  caches.open(SHELL).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()),
))
self.addEventListener('activate', (e) => e.waitUntil(
  caches.keys().then((keys) => Promise.all(keys.filter((k) => ![SHELL, AUDIO, FONTS].includes(k)).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()),
))

const ok = (res) => res.status === 200 || res.type === 'opaque' // 206 audio ranges are never cached
const put = (cache, req, res) => { if (ok(res)) { const copy = res.clone(); caches.open(cache).then((c) => c.put(req, copy)) } return res }
const cacheFirst = (cache, req) => caches.match(req).then((hit) => hit || fetch(req).then((res) => put(cache, req, res)))
const staleWhileRevalidate = (cache, req) => caches.match(req).then((hit) => {
  const net = fetch(req).then((res) => put(cache, req, res))
  if (!hit) return net
  net.catch(() => {}) // offline: the cached copy is fine
  return hit
})
const networkFirst = (cache, req) => fetch(req).then((res) => put(cache, req, res)).catch(async () =>
  (await caches.match(req)) || (req.mode === 'navigate' && (await caches.match('/'))) || Response.error())

let trimming = false
async function trimAudio() {
  if (trimming) return
  trimming = true
  try {
    const c = await caches.open(AUDIO)
    const keys = await c.keys() // insertion order: oldest first
    await Promise.all(keys.slice(0, Math.max(0, keys.length - AUDIO_MAX)).map((k) => c.delete(k)))
  } finally { trimming = false }
}

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)

  if (url.hostname === 'fonts.googleapis.com') return e.respondWith(staleWhileRevalidate(FONTS, req))
  if (url.hostname === 'fonts.gstatic.com') return e.respondWith(cacheFirst(FONTS, req))
  if (url.origin !== location.origin) return // Supabase and other APIs go straight to the network

  const p = url.pathname
  if (p.startsWith('/assets/')) return e.respondWith(cacheFirst(SHELL, req))
  if (p.startsWith('/img/') || p.startsWith('/icons/')) return e.respondWith(staleWhileRevalidate(SHELL, req))
  if (p.startsWith('/audio/')) return e.respondWith(networkFirst(AUDIO, req).finally(() => { void trimAudio() }))
  e.respondWith(networkFirst(SHELL, req))
})
