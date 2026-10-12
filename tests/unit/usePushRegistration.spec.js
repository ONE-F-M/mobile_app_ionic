import { beforeEach, describe, expect, test, vi } from "vitest";

const platform = { native: false, name: "web" };
const listeners = {};

vi.mock("@capacitor/core", () => ({
  Capacitor: {
    isNativePlatform: () => platform.native,
    getPlatform: () => platform.name,
  },
}));
vi.mock("@capacitor/push-notifications", () => ({
  PushNotifications: {
    addListener: vi.fn(async (event, handler) => {
      listeners[event] = handler;
    }),
    checkPermissions: vi.fn(async () => ({ receive: "granted" })),
    requestPermissions: vi.fn(async () => ({ receive: "granted" })),
    register: vi.fn(async () => {}),
    unregister: vi.fn(async () => {}),
  },
}));
vi.mock("@capacitor/haptics", () => ({
  Haptics: { notification: vi.fn(async () => {}) },
  NotificationType: { Success: "SUCCESS" },
}));
vi.mock("@/store/auth", () => {
  const store = { employeeIdentificator: "EMP-1", setFcmToken: vi.fn() };
  return { useAuthStore: () => store };
});
vi.mock("@/api/profile", () => ({ default: { setDeviceIdNotifications: vi.fn(async () => ({})) } }));
vi.mock("@/composable/useConfirmAlert.ts", () => ({ useConfirmAlert: () => ({ showAcknowledge: vi.fn() }) }));
vi.mock("@/utils/notificationSound", () => ({ playNotificationSound: vi.fn(async () => {}) }));
vi.mock("@/services/firebase", () => ({
  initializeFirebase: vi.fn(async () => ({ app: true })),
  getFirebaseMessaging: vi.fn(async () => ({ messaging: true })),
}));
vi.mock("firebase/messaging", () => ({
  getToken: vi.fn(async () => "web-token"),
  getMessaging: vi.fn(() => ({ messaging: true })),
  deleteToken: vi.fn(async () => true),
}));

const load = async () => {
  vi.resetModules();
  const { usePushRegistration } = await import("@/composable/usePushRegistration");
  const { PushNotifications } = await import("@capacitor/push-notifications");
  const messaging = await import("firebase/messaging");
  const profile = (await import("@/api/profile")).default;
  return { push: usePushRegistration(), PushNotifications, messaging, profile };
};

beforeEach(() => {
  vi.clearAllMocks();
  for (const key of Object.keys(listeners)) delete listeners[key];
  globalThis.Notification = { requestPermission: vi.fn(async () => "granted") };
});

describe("usePushRegistration on web", () => {
  beforeEach(() => {
    platform.native = false;
    platform.name = "web";
  });

  test("register stores the Firebase web token for the logged-in user", async () => {
    const { push, PushNotifications, messaging, profile } = await load();
    await push.register({ name: "EMP-9" });
    expect(messaging.getToken).toHaveBeenCalled();
    expect(PushNotifications.register).not.toHaveBeenCalled();
    expect(profile.setDeviceIdNotifications).toHaveBeenCalledWith({
      fcm_token: "web-token",
      employee_id: "EMP-9",
      device_os: "web",
    });
  });

  test("register stores nothing when notification permission is refused", async () => {
    globalThis.Notification.requestPermission = vi.fn(async () => "denied");
    const { push, profile } = await load();
    await push.register({ name: "EMP-9" });
    expect(profile.setDeviceIdNotifications).not.toHaveBeenCalled();
  });

  test("unregister deletes the web token and sends an empty token to clear it", async () => {
    const { push, messaging, profile } = await load();
    await push.unregister();
    expect(messaging.deleteToken).toHaveBeenCalled();
    expect(profile.setDeviceIdNotifications).toHaveBeenCalledWith({
      fcm_token: "",
      employee_id: "EMP-1",
      device_os: "web",
    });
  });
});

describe("usePushRegistration on native", () => {
  beforeEach(() => {
    platform.native = true;
    platform.name = "android";
  });

  test("register uses the Capacitor plugin and stores the token from the registration event", async () => {
    const { push, PushNotifications, messaging, profile } = await load();
    await push.register({ name: "EMP-9" });
    expect(PushNotifications.register).toHaveBeenCalled();
    expect(messaging.getToken).not.toHaveBeenCalled();

    await listeners.registration({ value: "native-token" });
    expect(profile.setDeviceIdNotifications).toHaveBeenCalledWith({
      fcm_token: "native-token",
      employee_id: "EMP-1",
      device_os: "android",
    });
  });

  test("register throws when the user refuses notifications", async () => {
    const { push, PushNotifications } = await load();
    PushNotifications.checkPermissions.mockResolvedValueOnce({ receive: "denied" });
    await expect(push.register({ name: "EMP-9" })).rejects.toThrow();
    expect(PushNotifications.register).not.toHaveBeenCalled();
  });

  test("listeners are attached once even after two logins", async () => {
    const { push, PushNotifications } = await load();
    await push.register({ name: "EMP-9" });
    await push.register({ name: "EMP-9" });
    const registrationListeners = PushNotifications.addListener.mock.calls.filter(
      ([event]) => event === "registration",
    );
    expect(registrationListeners).toHaveLength(1);
  });

  test("unregister uses the Capacitor plugin", async () => {
    const { push, PushNotifications, messaging } = await load();
    await push.unregister();
    expect(PushNotifications.unregister).toHaveBeenCalled();
    expect(messaging.deleteToken).not.toHaveBeenCalled();
  });
});
