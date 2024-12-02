import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { initializeApp } from "firebase/app";
import { useAuthStore } from "@/store/auth";
import { Device } from "@capacitor/device";

import profile from "@/api/profile";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
};

const firebaseApp = initializeApp(firebaseConfig);
const messaging = getMessaging(firebaseApp);

export const setupNotifications = async (proxy={}) => {
  // Request Notification permission
  
  const authStore = useAuthStore();
  const permission = await Notification.requestPermission();
  
  if (permission === "granted") {
    try {
      const currentToken = await getToken(messaging, {
        vapidKey: firebaseConfig.vapidKey,
      });
      
      if (currentToken) {
        const loggedInUser = proxy.data.name;

        if (loggedInUser) {
          authStore.setFcmToken(currentToken);
          
          const deviceInfo = await Device.getInfo();
    
          profile.setDeviceIdNotifications({
            fcm_token: currentToken,
            employee_id: authStore.employeeIdentificator,
            device_os: deviceInfo?.platform,
          });
          
        }
      } 
      else {
        console.log(
          "No registration token available. Request permission to generate one."
        );
      }
    } catch (error) {
      console.error("An error occurred while retrieving token: ", error);
    }

    // Listen for foreground messages
    onMessage(messaging, (payload) => {
      
      const notificationTitle = payload?.notification?.title || "Notification";
      const notificationOptions = {
        body: payload?.notification?.body || "",
        icon: payload?.notification?.icon || "/assets/logo.png",
      };

      const isChrome = navigator.userAgent.toLowerCase().includes("chrome");
      if (isChrome) {
        notificationOptions.data = {
          url: payload?.notification?.click_action,
        };
      } else {
        if (payload?.notification?.click_action) {
          notificationOptions.actions = [
            {
              action: payload.notification.click_action,
              title: "View Details",
            },
          ];
        }
      }

      if (Notification.permission === "granted") {
        const notification = new Notification(
          notificationTitle,
          notificationOptions
        );
        notification.onclick = (event) => {
          event.preventDefault();
          const url = isChrome
            ? notificationOptions.data.url
            : payload?.notification?.click_action;
          if (url) {
            window.open(url, "_blank");
          }
        };
      }
    });
  } else {
    console.log("Unable to get permission to notify.");
  }
};
