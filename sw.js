// Service Worker — Memorama Electoral IEE Sonora
// IMPORTANTE: sube este número de versión cada vez que subas un index.html nuevo,
// si no, los usuarios que ya instalaron la app seguirán viendo la versión vieja
// (el service worker sirve todo desde caché una vez instalado).
const CACHE_VERSION = 'v1';
const CACHE_NAME = 'memorama-iee-' + CACHE_VERSION;

const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Instalación: descarga y guarda en caché los archivos principales
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activación: borra cachés de versiones anteriores
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith('memorama-iee-') && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: caché primero, con respaldo a la red (y guarda lo nuevo que se descargue)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Sin red y sin caché: si piden la página principal, regresa el index cacheado
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
    })
  );
});
