// Service Worker — Illa Pancha Push Notifications
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  const title = data.title || 'Illa Pancha';
  const options = {
    body: data.body || 'Nueva notificación',
    icon: '/logo_lineas.png',
    badge: '/logo_lineas.png',
    data: { url: data.url || '/gestion' },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/gestion';
  event.waitUntil(clients.openWindow(url));
});
