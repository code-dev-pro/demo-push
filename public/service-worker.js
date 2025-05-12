// Service Worker pour gérer les notifications push

self.addEventListener('push', function(event) {
  console.log('[Service Worker] Notification push reçue');
  
  // Récupérer les données de la notification
  const data = event.data.json();
  
  // Options de la notification
  const options = {
    body: data.body,
    icon: data.icon || '/notification-icon.png',
    badge: '/badge-icon.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Voir plus'
      },
      {
        action: 'close',
        title: 'Fermer'
      }
    ]
  };
  
  // Afficher la notification
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Gérer les clics sur les notifications
self.addEventListener('notificationclick', function(event) {
  console.log('[Service Worker] Notification cliquée', event.notification.tag);
  
  // Fermer la notification
  event.notification.close();
  
  // Gérer les actions
  if (event.action === 'explore') {
    console.log('[Service Worker] Action "Voir plus" cliquée');
    // Ici, vous pouvez rediriger vers une page spécifique
  } else {
    console.log('[Service Worker] Notification principale cliquée');
  }
  
  // Ouvrir ou focaliser sur la fenêtre principale de l'application
  event.waitUntil(
    self.clients.matchAll({ type: 'window' })
      .then(function(clientList) {
        // Si une fenêtre est déjà ouverte, la focaliser
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        // Sinon, ouvrir une nouvelle fenêtre
        if (self.clients.openWindow) {
          return self.clients.openWindow('/');
        }
      })
  );
});

// Installation du service worker
self.addEventListener('install', function() {
  console.log('[Service Worker] Installation');
  self.skipWaiting();
});

// Activation du service worker
self.addEventListener('activate', function() {
  console.log('[Service Worker] Activation');
  return self.clients.claim();
});
