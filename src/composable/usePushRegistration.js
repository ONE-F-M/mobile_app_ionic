import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { Haptics, NotificationType } from "@capacitor/haptics";
import { useAuthStore } from "@/store/auth";
import profile from "@/api/profile";
import { useConfirmAlert } from "@/composable/useConfirmAlert.ts";
import { playNotificationSound } from "@/utils/notificationSound";
import { initializeFirebase, getFirebaseMessaging } from "@/services/firebase";

// Native listeners must only be attached once per app session, otherwise every
// login would stack another chime/alert on each incoming push.
let nativeListenersAdded = false;

/**
 * TODO(MS-017): tap routing. Called when the user taps a notification on
 * native (pushNotificationActionPerformed). Deep-link to the relevant screen
 * here. Intentionally a no-op until MS-017 lands.
 */
// eslint-disable-next-line no-unused-vars
const handleNotificationTap = (action) => {};

export function usePushRegistration() {
  const authStore = useAuthStore();
  const { showAcknowledge } = useConfirmAlert();

  const isNative = () => Capacitor.isNativePlatform();

  // "ios" | "android" | "web"
  const getDeviceOs = () => Capacitor.getPlatform();

  const storeToken = async (token, employeeId) => {
    authStore.setFcmToken(token);

    await profile.setDeviceIdNotifications({
      fcm_token: token,
      employee_id: employeeId || authStore.employeeIdentificator,
      device_os: getDeviceOs(),
    });
  };

  const addListeners = async () => {
    // On web the foreground message handler is attached by
    // getFirebaseMessaging() in src/services/firebase.js.
    if (!isNative() || nativeListenersAdded) return;
    nativeListenersAdded = true;

    await PushNotifications.addListener("registration", async (token) => {
      try {
        await storeToken(token.value);
      } catch (err) {
        console.error("Failed to store push token: ", err);
      }
    });

    await PushNotifications.addListener("registrationError", (err) => {
      console.error("Registration error: ", err.error);
    });

    await PushNotifications.addListener(
      "pushNotificationReceived",
      async (notification) => {
        // The OS only shows a banner + plays a sound automatically when the
        // app is backgrounded -- while it's open (which is when this fires),
        // nothing appears unless we show it ourselves.
        if (!notification.title && !notification.body) return;

        await playNotificationSound();
        Haptics.notification({ type: NotificationType.Success }).catch(() => {});

        await showAcknowledge(
          notification.title || "",
          notification.body || "",
        );
      },
    );

    await PushNotifications.addListener(
      "pushNotificationActionPerformed",
      handleNotificationTap,
    );
  };

  const registerNative = async () => {
    await addListeners();

    let permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive === "prompt") {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== "granted") {
      throw new Error("User denied permissions!");
    }

    // The token is stored by the "registration" listener.
    await PushNotifications.register();
  };

  const registerWeb = async (user) => {
    const employeeId = user?.name || authStore.employeeIdentificator;
    if (!employeeId) return;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn("Unable to get permission to notify.");
      return;
    }

    const { getToken } = await import("firebase/messaging");
    const messaging = await getFirebaseMessaging();
    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
    });

    if (!token) {
      console.warn(
        "No registration token available. Request permission to generate one.",
      );
      return;
    }

    await storeToken(token, employeeId);
  };

  /**
   * Request permission, obtain a push token and store it on the backend via
   * profile.setDeviceIdNotifications. `user` is the logged-in user record
   * (login response `data.data`); only its `name` is used.
   */
  const register = async (user) => {
    if (isNative()) {
      await registerNative();
    } else {
      await registerWeb(user);
    }
  };

  /**
   * Drop the push token on the device and tell the backend it is gone.
   * Call this BEFORE the session is cleared: the backend call needs auth.
   * Backend notification is sent as profile.setDeviceIdNotifications with
   * fcm_token: null (no dedicated endpoint exists).
   */
  const unregister = async () => {
    const employeeId = authStore.employeeIdentificator;

    if (isNative()) {
      await PushNotifications.unregister();
    } else {
      const { getMessaging, deleteToken } = await import("firebase/messaging");
      const app = await initializeFirebase();
      await deleteToken(getMessaging(app));
    }

    authStore.setFcmToken(null);

    await profile.setDeviceIdNotifications({
      fcm_token: null,
      employee_id: employeeId,
      device_os: getDeviceOs(),
    });
  };

  return { register, unregister, addListeners };
}

export default usePushRegistration;
