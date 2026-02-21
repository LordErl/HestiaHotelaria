/* eslint-disable no-restricted-globals */

// Service Worker for Push Notifications - Hestia Hotel Management

const CACHE_NAME = 'hestia-cache-v1';
const OFFLINE_URL = '/offline.html';

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(clients.claim());
});

// Push event - Handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);

  let data = {
    title: 'Hestia Hotel',
    body: 'Nova notificação',
    icon: '/logo192.png',
    badge: '/badge.png',
    tag: 'hestia-notification',
    data: {}
  };

  try {
    if (event.data) {
      const payload = event.data.json();
      data = {
        ...data,
        ...payload
      };
    }
  } catch (e) {
    console.error('Error parsing push data:', e);
    if (event.data) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/logo192.png',
    badge: data.badge || '/badge.png',
    tag: data.tag || 'hestia-notification',
    data: data.data || {},
    vibrate: [100, 50, 100],
    actions: data.actions || [
      { action: 'view', title: 'Ver', icon: '/icons/view.png' },
      { action: 'dismiss', title: 'Dispensar', icon: '/icons/dismiss.png' }
    ],
    requireInteraction: data.requireInteraction || false
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();

  const action = event.action;
  const data = event.notification.data || {};

  if (action === 'dismiss') {
    return;
  }

  // Default action - open or focus the app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // If a window is already open, focus it
        for (const client of clientList) {
          if ('focus' in client) {
            client.focus();
            // Send message to client about notification click
            client.postMessage({
              type: 'NOTIFICATION_CLICKED',
              action: action,
              data: data
            });
            return;
          }
        }
        
        // Otherwise, open a new window
        let url = '/';
        if (data.url) {
          url = data.url;
        } else if (data.type === 'reservation') {
          url = '/reservations';
        } else if (data.type === 'housekeeping') {
          url = '/housekeeping';
        } else if (data.type === 'check_in' || data.type === 'check_out') {
          url = '/check-in-out';
        }

        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

// Notification close event
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event);
});

// Message event - Handle messages from main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Fetch event - For offline support (optional)
self.addEventListener('fetch', (event) => {
  // Only handle navigation requests for offline support
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(OFFLINE_URL);
      })
    );
  }
});

console.log('Hestia Service Worker loaded');
