importScripts('/sw-env.js');
importScripts("https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js");
importScripts(
  "https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js"
);

firebase.initializeApp({
  apiKey: self.__env.VITE_FIREBASE_API_KEY,
  authDomain: self.__env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: self.__env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: self.__env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: self.__env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: self.__env.VITE_FIREBASE_APP_ID,
  measurementId: self.__env.VITE_FIREBASE_MEASUREMENT_ID,
  vapidKey: self.__env.VITE_FIREBASE_VAPID_KEY,
});

const messaging = firebase.messaging();
const isChrome = navigator.userAgent.toLowerCase().includes("chrome");




messaging.onBackgroundMessage((payload) => {
  
  const notificationTitle = payload?.notification?.title || "Notification";
  const notificationOptions = {
    body: payload?.notification?.body || "",
    icon: payload?.notification?.icon || "/logo.png",
  };

  if (isChrome) {
    notificationOptions["data"] = {
      url: payload?.data?.url,
    };
  } else {
    if (payload?.data?.url) {
      notificationOptions["actions"] = [
        {
          action: payload.data.url,
          title: "View Details",
        },
      ];
    }
  }

  
    self.addEventListener('notificationclick', (event) => {
      event.notification.close();
      const clickUrl = event.notification.data?.url;
      
      if (clickUrl) {
        // Open the URL in a new window or tab
        event.waitUntil(
          clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // Focus an already open tab with the same URL, or open a new one
            for (let client of clientList) {
              if (client.url === clickUrl && 'focus' in client) {
                return client.focus();
              }
            }
            if (clients.openWindow) {
              return clients.openWindow(clickUrl);
            }
          })
        );
      }
    })
    self.registration.showNotification(notificationTitle, notificationOptions);
  
});