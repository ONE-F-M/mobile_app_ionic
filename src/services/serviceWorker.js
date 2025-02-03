import { setupNotifications } from '@/services/notifications.js';

export const registerServiceWorker = async (proxy={}) => {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js')
          .then((registration) => {
            if (registration) {
              
              // Service Worker already registered with scope
            } else {
               // Service Worker not registered
              navigator.serviceWorker.register('/firebase-messaging-sw.js')
             
                .then((newRegistration) => {
                  setupNotifications()
                })
                .catch((error) => {
                  console.error('Service Worker registration failed:', error);
                });
            }
          })
          .catch((error) => {
            console.error('Error checking Service Worker registration:', error);
          });
      }
}