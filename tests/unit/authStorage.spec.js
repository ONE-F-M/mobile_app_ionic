import { createApp, nextTick } from "vue";
import { createPinia, setActivePinia } from "pinia";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";
import { beforeEach, describe, expect, test, vi } from "vitest";

const platform = { native: false };
const saved = {};

vi.mock("@capacitor/core", () => ({
  Capacitor: { isNativePlatform: () => platform.native, getPlatform: () => (platform.native ? "android" : "web") },
}));
vi.mock("@capacitor/preferences", () => ({
  Preferences: {
    get: vi.fn(async ({ key }) => ({ value: key in saved ? saved[key] : null })),
    set: vi.fn(async ({ key, value }) => {
      saved[key] = value;
    }),
    remove: vi.fn(async ({ key }) => {
      delete saved[key];
    }),
  },
}));

const load = async () => {
  vi.resetModules();
  const storage = await import("@/utils/authStorage");
  const { Preferences } = await import("@capacitor/preferences");
  return { ...storage, Preferences };
};

beforeEach(() => {
  vi.clearAllMocks();
  for (const key of Object.keys(saved)) delete saved[key];
  localStorage.clear();
});

describe("authStorage on web", () => {
  beforeEach(() => {
    platform.native = false;
  });

  test("is localStorage and needs no loading", async () => {
    const { authStorage, authStorageReady, Preferences } = await load();
    await authStorageReady;
    expect(authStorage).toBe(localStorage);
    expect(Preferences.get).not.toHaveBeenCalled();
  });
});

describe("authStorage on native", () => {
  beforeEach(() => {
    platform.native = true;
  });

  test("reads the saved session before the app starts", async () => {
    saved.user = '{"token":"Bearer abc"}';
    const { authStorage, authStorageReady } = await load();
    await authStorageReady;
    expect(authStorage.getItem("user")).toBe('{"token":"Bearer abc"}');
    expect(authStorage.getItem("auth")).toBeNull();
  });

  test("writes through to Preferences", async () => {
    const { authStorage, authStorageReady, Preferences } = await load();
    await authStorageReady;
    authStorage.setItem("auth", '{"fcmToken":null}');
    expect(authStorage.getItem("auth")).toBe('{"fcmToken":null}');
    expect(Preferences.set).toHaveBeenCalledWith({ key: "auth", value: '{"fcmToken":null}' });
  });

  test("clearAuthStorage removes both session keys", async () => {
    saved.user = "{}";
    saved.auth = "{}";
    const { authStorage, authStorageReady, clearAuthStorage, Preferences } = await load();
    await authStorageReady;
    clearAuthStorage();
    expect(authStorage.getItem("user")).toBeNull();
    expect(Preferences.remove).toHaveBeenCalledWith({ key: "user" });
    expect(Preferences.remove).toHaveBeenCalledWith({ key: "auth" });
  });

  test("a failed read starts the app signed out", async () => {
    const { Preferences } = await import("@capacitor/preferences");
    Preferences.get.mockRejectedValueOnce(new Error("unavailable"));
    const { authStorage, authStorageReady } = await load();
    await expect(authStorageReady).resolves.toBeUndefined();
    expect(authStorage.getItem("user")).toBeNull();
  });

  test("the user store restores the saved session and logout clears it", async () => {
    saved.user = JSON.stringify({ user: { name: "EMP-1" }, token: "Bearer abc", refreshToken: "r" });
    const { authStorageReady, Preferences } = await load();
    await authStorageReady;
    const { useUserStore } = await import("@/store/user");
    const pinia = createPinia();
    pinia.use(piniaPluginPersistedstate);
    createApp({}).use(pinia);
    setActivePinia(pinia);

    const userStore = useUserStore();
    expect(userStore.token).toBe("Bearer abc");

    userStore.logout();
    await nextTick();
    await nextTick();
    expect(Preferences.remove).toHaveBeenCalledWith({ key: "user" });
    expect(Preferences.remove).toHaveBeenCalledWith({ key: "auth" });
    expect(saved.user).toBeUndefined();
  });
});
