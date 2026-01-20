import { PushNotifications } from "@capacitor/push-notifications";
import { useAuthStore } from "./../store/auth";
import profile from "./../api/profile";
import { Device } from "@capacitor/device";

export default function useNotification() {
  const authStore = useAuthStore();

  const addListeners = async () => {
    await PushNotifications.addListener("registration", async (token) => {
      console.info("Registration token: ", token.value);

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
      (notification) => {
        console.log("Push notification received: ", notification);
      },
    );

    await PushNotifications.addListener(
      "pushNotificationActionPerformed",
      (notification) => {
        console.log(
          "Push notification action performed",
          notification.actionId,
          notification.inputValue,
        );
      },
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
