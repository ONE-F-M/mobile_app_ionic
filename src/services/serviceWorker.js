export const registerServiceWorker = async (proxy={}) => {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js')
          .then((registration) => {
            if (registration) {
              
              // Service Worker already registered with scope
            } else {
               // Service Worker not registered
              navigator.serviceWorker.register('/firebase-messaging-sw.js')
             
                .then(() => {
                  // Token registration happens at login via
                  // usePushRegistration().register(user).
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