const CACHE_NAME = 'cinelist-cache-v3';
const ASSETS = [
  '/',
  '/index.html',
  '/favicon.png',
  '/pwa-192.png',
  '/pwa-512.png',
  '/apple-touch-icon.png',
  '/manifest.json'
];

// Instalação do Service Worker e caching inicial
self.addEventListener('install', (e) => {
  // Pular espera para ativar imediatamente
  self.skipWaiting();
  
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Bypassar cache de ativos no localhost durante instalação
      if (self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1') {
        return;
      }
      return cache.addAll(ASSETS);
    })
  );
});

// Ativação e limpeza de caches antigos
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('Removendo cache antigo:', key);
            return caches.delete(key);
          }
        })
      ).then(() => self.clients.claim());
    })
  );
});

// Interceptar requisições HTTP
self.addEventListener('fetch', (e) => {
  // BYPASS COMPLETO EM DESENVOLVIMENTO (Localhost): Evita tela branca/cache em dev
  if (self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1') {
    return;
  }

  // Apenas interceptar GET de recursos da mesma origem
  if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) {
    return;
  }

  const isHtml = e.request.url === self.location.origin || 
                 e.request.url.endsWith('/') || 
                 e.request.url.includes('/index.html');

  // Estratégia Network-First para o HTML principal (evita index.html apontar para hash JS deletado)
  if (isHtml) {
    e.respondWith(
      fetch(e.request)
        .then((networkResponse) => {
          if (networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(e.request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(e.request);
        })
    );
    return;
  }

  // Estratégia Cache-First para os outros ativos (favicon, manifest, etc.)
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(e.request);
    })
  );
});
