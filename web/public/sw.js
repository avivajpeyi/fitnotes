const CACHE_NAME = "fitnotes-hub-v2";
// Relative to this script's own URL, so these resolve correctly whether the
// app is served from "/" or from a GitHub Pages basePath like "/fitnotes/".
const APP_SHELL = ["./", "./history/", "./library/", "./manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first for data (so a fresh active_targets.json wins when online),
// falling back to cache when offline. Cache-first for everything else.
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.includes("/data/") || url.pathname.includes("/catalog/") || url.pathname.endsWith("/library/")) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (!res.ok) return caches.match(request).then((cached) => cached || res);
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return res;
        })
        .catch(() => caches.match(request).then((cached) => cached || Response.error()))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request))
  );
});
