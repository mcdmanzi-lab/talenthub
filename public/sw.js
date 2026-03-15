// ─── Service Worker — TalentHub ───────────────────────────────
// Bump CACHE_VERSION on every deployment to force old cache eviction.
// In CI/CD: inject the build hash here automatically.
const CACHE_VERSION = 'talenthub-v3'

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.svg',
  '/favicon.svg',
]

// ── Install: pre-cache static shell ─────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting()) // activate immediately
  )
})

// ── Activate: delete ALL old cache versions ──────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_VERSION) // keep only current version
          .map(key => {
            console.log('[SW] Deleting old cache:', key)
            return caches.delete(key)
          })
      )
    ).then(() => self.clients.claim()) // take control of open tabs immediately
  )
})

// ── Fetch: network-first with offline fallback ────────────────
self.addEventListener('fetch', event => {
  const { request } = event

  // Never intercept non-GET or Supabase/API calls
  if (request.method !== 'GET') return
  if (request.url.includes('supabase.co')) return
  if (request.url.includes('/api/')) return
  if (request.url.includes('resend.com')) return
  if (request.url.includes('pesapal.com')) return
  if (request.url.includes('fonts.googleapis.com')) return

  // Network-first strategy: try fresh from network, fall back to cache
  event.respondWith(
    fetch(request)
      .then(response => {
        // Only cache valid responses
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response
        }
        // Clone the response — one goes to browser, one to cache
        const toCache = response.clone()
        caches.open(CACHE_VERSION).then(cache => cache.put(request, toCache))
        return response
      })
      .catch(() => {
        // Network failed — serve from cache
        return caches.match(request).then(cached => {
          if (cached) return cached
          // For HTML navigations, serve the app shell
          if (request.headers.get('accept')?.includes('text/html')) {
            return caches.match('/index.html')
          }
        })
      })
  )
})

// ── Message: allow pages to force a cache refresh ────────────
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
