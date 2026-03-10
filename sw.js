// Service Worker - Johnapuls Oil PWA
var CACHE_NAME = 'johnapuls-oil-v4';

self.addEventListener('install', function(event) {
  self.skipWaiting();
});

// Network-first for HTML: always fetch fresh HTML, fall back to cache
// Cache-first for everything else (images, fonts, CSS, JS)
self.addEventListener('fetch', function(event) {
  var request = event.request;
  var url = new URL(request.url);

  // Only handle same-origin requests
  if (url.origin !== location.origin) return;

  // Network-first for HTML navigation requests
  if (request.mode === 'navigate' || request.headers.get('accept').indexOf('text/html') !== -1) {
    event.respondWith(
      fetch(request).then(function(response) {
        if (response && response.status === 200) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) { cache.put(request, clone); });
        }
        return response;
      }).catch(function() {
        return caches.match(request);
      })
    );
    return;
  }

  // Cache-first for static assets
  event.respondWith(
    caches.match(request).then(function(cached) {
      if (cached) return cached;
      return fetch(request).then(function(response) {
        if (!response || response.status !== 200 || response.type !== 'basic') return response;
        var clone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) { cache.put(request, clone); });
        return response;
      });
    })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(name) {
          return name !== CACHE_NAME;
        }).map(function(name) {
          return caches.delete(name);
        })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});
