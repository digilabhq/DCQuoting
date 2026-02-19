// Service Worker for DCQuoting PWA

const CACHE_NAME = 'dcquoting-v1';
const urlsToCache = [
  '/DCQuoting/',
  '/DCQuoting/index.html',
  '/DCQuoting/css/styles.css',
  '/DCQuoting/js/auth.js',
  '/DCQuoting/js/config.js',
  '/DCQuoting/js/calculator.js',
  '/DCQuoting/js/report.js',
  '/DCQuoting/js/app.js',
  '/DCQuoting/images/Logo.svg',
  '/DCQuoting/images/Icon.jpg',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
];

// Install service worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// Fetch from cache
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});

// Update service worker
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
