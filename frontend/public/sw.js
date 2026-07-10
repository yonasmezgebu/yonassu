self.addEventListener('push', function(event) {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icon.png', // Add a dummy icon path or real one later
      data: data.data,
      vibrate: [100, 50, 100],
    };
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  if (event.notification.data && event.notification.data.link) {
    event.waitUntil(
      clients.openWindow(event.notification.data.link)
    );
  }
});
