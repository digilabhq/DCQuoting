// Service Worker for DCQuoting PWA — v3 (cache bust)

const CACHE_NAME = 'dcquoting-v3';
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

self.addEventListener('install', function(event) {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then(function(cache) {
            return cache.addAll(urlsToCache);
        })
    );
});

self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.map(function(name) {
                    if (name !== CACHE_NAME) {
                        return caches.delete(name);
                    }
                })
            );
        }).then(function() {
            return self.clients.claim();
        })
    );
});

self.addEventListener('fetch', function(event) {
    event.respondWith(
        caches.match(event.request).then(function(response) {
            return response || fetch(event.request);
        })
    );
});
