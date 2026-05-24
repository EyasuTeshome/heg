const CACHE_VERSION = 'tariffcheck-v1'
const STATIC_CACHE = `${CACHE_VERSION}-static`
const API_CACHE = `${CACHE_VERSION}-api`

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
]

const CACHE_FIRST_PATTERNS = [
  /\/api\/cities/,
  /\/api\/routes\/[^/]+\/tariffs/,
]

// Install: cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('Failed to cache some static assets:', err)
      })
    }).then(() => self.skipWaiting())
  )
})

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('tariffcheck-') && name !== STATIC_CACHE && name !== API_CACHE)
          .map((name) => caches.delete(name))
      )
    }).then(() => self.clients.claim())
  )
})

// Fetch: cache strategy
self.addEventListener('fetch', (event) => {
  // Only handle http/https — skip chrome-extension:// and others
  if (!event.request.url.startsWith('http')) return

  const url = new URL(event.request.url)

  // Only handle GET requests
  if (event.request.method !== 'GET') return

  const isCacheFirst = CACHE_FIRST_PATTERNS.some((pattern) => pattern.test(url.pathname))

  if (isCacheFirst) {
    // Cache-first for city/route tariff API responses
    event.respondWith(
      caches.open(API_CACHE).then(async (cache) => {
        const cached = await cache.match(event.request)
        if (cached) {
          // Background revalidate
          fetch(event.request).then((networkResponse) => {
            if (networkResponse.ok) {
              cache.put(event.request, networkResponse.clone())
            }
          }).catch(() => {})
          return cached
        }
        try {
          const networkResponse = await fetch(event.request)
          if (networkResponse.ok) {
            cache.put(event.request, networkResponse.clone())
          }
          return networkResponse
        } catch (err) {
          return new Response(JSON.stringify({ error: 'Offline' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          })
        }
      })
    )
  } else if (url.pathname.startsWith('/api/')) {
    // Network-first for other API routes
    event.respondWith(
      fetch(event.request).then((networkResponse) => {
        return networkResponse
      }).catch(async () => {
        const cached = await caches.match(event.request)
        if (cached) return cached
        return new Response(JSON.stringify({ error: 'Offline' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        })
      })
    )
  } else {
    // Cache-first for static assets
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse.ok && !url.pathname.startsWith('/api/')) {
            const responseToCache = networkResponse.clone()
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put(event.request, responseToCache)
            })
          }
          return networkResponse
        })
      })
    )
  }
})

// Message: allow clients to clear cache for a specific city
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CACHE_CITY') {
    const { cityId } = event.data
    // Pre-cache this city's routes
    caches.open(API_CACHE).then(async (cache) => {
      try {
        const routesResponse = await fetch(`/api/cities/${cityId}/routes`)
        if (routesResponse.ok) {
          cache.put(`/api/cities/${cityId}/routes`, routesResponse.clone())
        }
      } catch (err) {
        console.warn('Failed to pre-cache city routes:', err)
      }
    })
  }
})
