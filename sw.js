/**
 * ChronoFlow Service Worker
 * Cache-First para estáticos, Network-First para dinámicos
 * Versión: 1.0.0
 */

const CACHE_NAME = 'chronoflow-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/main.css',
  '/css/wallclock.css',
  '/js/timer.js',
  '/js/storage.js',
  '/js/notifications.js',
  '/js/wallclock.js',
  '/assets/icons/icon-192x192.png',
  '/assets/icons/icon-512x512.png'
];

// Instalación: precachear assets estáticos
self.addEventListener('install', (event) => {
  console.log('SW: Instalando...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('SW: Cacheando assets estáticos');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('SW: Instalación completa');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('SW: Error en instalación', error);
      })
  );
});

// Activación: limpiar caches antiguas
self.addEventListener('activate', (event) => {
  console.log('SW: Activando...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => {
              console.log('SW: Eliminando cache antigua:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('SW: Activación completa');
        return self.clients.claim();
      })
  );
});

// Fetch: estrategia de cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Cache-First para assets estáticos locales
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            // Devolver cache y actualizar en segundo plano
            fetch(request)
              .then((networkResponse) => {
                if (networkResponse.ok) {
                  caches.open(CACHE_NAME).then((cache) => {
                    cache.put(request, networkResponse.clone());
                  });
                }
              })
              .catch(() => {
                // Silencioso — tenemos cache
              });
            
            return cachedResponse;
          }
          
          // No está en cache, fetch normal
          return fetch(request)
            .then((networkResponse) => {
              if (networkResponse.ok && request.method === 'GET') {
                const responseClone = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(request, responseClone);
                });
              }
              return networkResponse;
            });
        })
        .catch((error) => {
          console.error('SW: Error en fetch', error);
          // Offline fallback
          if (request.mode === 'navigate') {
            return caches.match('/index.html');
          }
          throw error;
        })
    );
  }
});

// Mensajes desde la app principal
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});

// Push notifications (para Fase 2)
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body || 'Timer completado',
    icon: '/assets/icons/icon-192x192.png',
    badge: '/assets/icons/icon-192x192.png',
    tag: 'chronoflow-timer',
    requireInteraction: false,
    data: data
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'ChronoFlow', options)
  );
});

// Click en notificación
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then((clientList) => {
        // Si hay ventana abierta, enfocarla
        for (const client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        // Si no, abrir nueva
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
  );
});
