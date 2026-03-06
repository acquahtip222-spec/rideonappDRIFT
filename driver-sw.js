// DRIFT Driver Service Worker v1.0
const CACHE = 'drift-driver-v1';
const ASSETS = [
  '/driver.html',
  '/driver-manifest.json',
  '/driver-icon-192.png',
  '/driver-icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.hostname.includes('tile.openstreetmap') || url.hostname.includes('fonts.googleapis') || url.hostname.includes('unpkg.com')) {
    return;
  }
  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});

self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : { title: 'DRIFT Driver', body: 'New ride request nearby!' };
  e.waitUntil(
    self.registration.showNotification(data.title || 'DRIFT Driver', {
      body: data.body || '',
      icon: '/driver-icon-192.png',
      badge: '/driver-icon-192.png',
      vibrate: [300, 100, 300, 100, 300],
      tag: 'ride-request',
      renotify: true,
      data: { url: '/driver.html' }
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.openWindow('/driver.html'));
});
