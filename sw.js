const CACHE_NAME = 'elzer-v7';
const ASSETS = [
  '/elzer/accueil.html',
  '/elzer/admin-login.html',
  '/elzer/admin-install.html',
  '/elzer/admin.html',
  '/elzer/index.html',
  '/elzer/manifest.json',
  '/elzer/manifest-admin.json',
  '/elzer/icon-192.png',
  '/elzer/icon-512.png',
  '/elzer/icon.svg'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return Promise.allSettled(ASSETS.map(url => 
        cache.add(url).catch(e => console.log('Cache skip:', url))
      ));
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => {
        console.log('Suppression ancien cache:', k);
        return caches.delete(k);
      }))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if(event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if(response && response.status === 200 && response.type !== 'opaque') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
