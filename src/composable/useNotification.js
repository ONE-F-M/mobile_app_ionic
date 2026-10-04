import { PushNotifications } from "@capacitor/push-notifications";
import { Haptics, NotificationType } from "@capacitor/haptics";
import { useAuthStore } from "./../store/auth";
import profile from "./../api/profile";
import { Device } from "@capacitor/device";
import { useConfirmAlert } from "@/composable/useConfirmAlert.ts";
import { playNotificationSound } from "@/utils/notificationSound";

export default function useNotification() {
  const authStore = useAuthStore();
  const { showAcknowledge } = useConfirmAlert();

  const addListeners = async () => {
    await PushNotifications.addListener("registration", async (token) => {
      authStore.setFcmToken(token.value);

      const deviceInfo = await Device.getInfo();
        
      await profile.setDeviceIdNotifications({
        fcm_token: token.value,
        employee_id: authStore.employeeIdentificator,
        device_os: deviceInfo?.platform,
      });
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

    // Fires when a notification is tapped. Nothing to route to yet — deep-linking
    // to the relevant screen belongs here.
    await PushNotifications.addListener(
      "pushNotificationActionPerformed",
      () => {},
    );
  };

  const registerNotifications = async () => {
    let permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive === "prompt") {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== "granted") {
      throw new Error("User denied permissions!");
    }

    await PushNotifications.register();
  };

  const unRegisterNotifications = async () => {
    await PushNotifications.unregister();
  };

  return {
    addListeners,
    registerNotifications,
    unRegisterNotifications,
  };
}
