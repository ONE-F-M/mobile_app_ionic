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
    console.log("BACKGROUND MESSAGE o")
  const notificationTitle = payload?.notification?.title || "Notification";
  const notificationOptions = {
    body: payload?.notification?.body || "",
    icon: payload?.notification?.icon || "/logo.png",
  };

  if (isChrome) {
    notificationOptions["data"] = {
      url: payload?.notification?.click_action,
    };
  } else {
    if (payload?.notification?.click_action) {
      notificationOptions["actions"] = [
        {
          action: payload.notification.click_action,
          title: "View Details",
        },
      ];
    }
  }

  self.registration.showNotification(notificationTitle, notificationOptions);
});