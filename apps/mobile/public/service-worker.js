// Service Worker for Barcode Scanner PWA
const APP_VERSION = "1.1.6"; // Increment this for each new deployment
const CACHE_NAME = `barcode-scanner-v${APP_VERSION}`;
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/manifest.json",
  "/favicon.ico",
  "/placeholder.svg",
];

// Install event - cache assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              return name !== CACHE_NAME;
            })
            .map((name) => {
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - serve cached assets or fetch from network
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches
      .match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request).then((fetchResponse) => {
          // Don't cache API calls or external resources
          if (
            !event.request.url.startsWith(self.location.origin) ||
            event.request.url.includes("/api/")
          ) {
            return fetchResponse;
          }

          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, fetchResponse.clone());
            return fetchResponse;
          });
        });
      })
      .catch(() => {
        // Fallback for offline navigation
        if (event.request.mode === "navigate") {
          return caches.match("/");
        }
        return null;
      })
  );
});
