// Service Worker ELZER v8 - Force refresh
const CACHE = 'elzer-v8';
const FILES = [
  '/elzer/',
  '/elzer/index.html',
  '/elzer/admin.html',
  '/elzer/admin-login.html',
  '/elzer/stock.html',
  '/elzer/icon-192.png',
  '/elzer/icon-512.png'
];

self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(c){return c.addAll(FILES);})
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){return k!==CACHE;}).map(function(k){return caches.delete(k);}));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e){
  // Toujours aller au reseau d'abord
  e.respondWith(
    fetch(e.request).catch(function(){
      return caches.match(e.request);
    })
  );
});
