/* Admin-only web push worker. Intentionally NEVER caches protected pages or API data. */
self.addEventListener('install', () => { self.skipWaiting(); });
self.addEventListener('activate', event => { event.waitUntil(self.clients.claim()); });
self.addEventListener('push', event => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = {}; }
  // No lead names, phone numbers, emails or project descriptions in push payloads.
  const title = typeof data.title === 'string' ? data.title.slice(0, 90) : 'Neue Admin-Benachrichtigung';
  const body = typeof data.body === 'string' ? data.body.slice(0, 160) : 'Bitte das Admin-Panel öffnen.';
  event.waitUntil(self.registration.showNotification(title, {
    body, icon: '/web-app-manifest-192x192.png', badge: '/web-app-manifest-192x192.png',
    tag: typeof data.tag === 'string' ? data.tag.slice(0, 90) : 'admin-alert',
    renotify: true, data: { url: '/admin' },
  }));
});
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const existing = all.find(c => new URL(c.url).pathname.startsWith('/admin'));
    if (existing) return existing.focus();
    return self.clients.openWindow('/admin');
  })());
});
