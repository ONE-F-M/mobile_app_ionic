import { getMessaging, getToken } from "firebase/messaging";
import { initializeApp } from "firebase/app";
import { useAuthStore } from "@/store/auth";
import { Device } from "@capacitor/device";
import { initializeFirebase, getFirebaseMessaging } from "@/services/firebase";
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




export const setupNotifications = async (proxy={}) => {
  // Request Notification permission
  const messaging = await getFirebaseMessaging();
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
  } else {
    console.log("Unable to get permission to notify.");
  }
};
