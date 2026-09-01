self.addEventListener('push', function(event) {
  let payload = {
    title: 'BattleStorm Alarme',
    body: 'Novo aviso!',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    url: '/'
  };
  
  if (event.data) {
    try {
      payload = event.data.json();
    } catch (e) {
      payload.body = event.data.text();
    }
  }

  const options = {
    body: payload.body,
    icon: payload.icon,
    badge: payload.badge,
    data: { url: payload.url },
    vibrate: [200, 100, 200, 100, 200, 100, 200],
    requireInteraction: true
  };

  event.waitUntil(
    self.registration.showNotification(payload.title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  if (event.notification.data && event.notification.data.url) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  } else {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});
