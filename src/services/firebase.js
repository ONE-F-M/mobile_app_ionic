let firebaseApp = null;
let messaging = null;


export async function initializeFirebase() {
    if (!firebaseApp) {
      const { initializeApp } = await import("firebase/app");
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
      firebaseApp = initializeApp(firebaseConfig);
    }
    return firebaseApp;
  }
  
  export async function getFirebaseMessaging() {
    if (!messaging) {
      const { getMessaging } = await import("firebase/messaging");
      const app = await initializeFirebase();
      messaging = getMessaging(app);
    }
    try {      
        import("firebase/messaging").then(({ onMessage }) => {
          onMessage(messaging, (payload) => {
            
            const notificationTitle = payload?.notification?.title || "Notification";
            const notificationOptions = {
              body: payload?.notification?.body || "",
              icon: payload?.notification?.icon || "../../public/logo.png",
            };
  
            if (Notification.permission === "granted") {
              const notification = new Notification(notificationTitle, notificationOptions);
              notification.onclick = async (event) => {
                event.preventDefault();
                const url = payload?.data?.url;
                if (!url) return;
                // Same handling as the native tap: open the screen in this
                // tab, falling back to /notification for an unknown url.
                const [{ default: router }, { toRouterPath }] = await Promise.all([
                  import("@/router"),
                  import("@/utils/notificationUrl"),
                ]);
                window.focus();
                notification.close();
                router.push(toRouterPath(router, url));
              };
            }
          });
        });

        
        
      } catch (error) {
        console.error("Error initializing Firebase:", error);
      }
    return messaging;

  }