import { beforeEach, describe, expect, test, vi } from "vitest";

const getInfo = vi.fn();
const getPlatform = vi.fn();
const getAppVersion = vi.fn();

vi.mock("@capacitor/app", () => ({ App: { getInfo } }));
vi.mock("@capacitor/core", () => ({ Capacitor: { getPlatform } }));
vi.mock("@/api/configuration", () => ({ default: { getAppVersion } }));

const { useAppVersion, DISMISSED_KEY } = await import("@/composable/useAppVersion.js");

const store = {};
vi.stubGlobal("localStorage", {
  getItem: (key) => (key in store ? store[key] : null),
  setItem: (key, value) => {
    store[key] = String(value);
  },
  removeItem: (key) => {
    delete store[key];
  },
});

const respond = (android = {}, ios = {}) =>
  getAppVersion.mockResolvedValue({ data: { data: { android, ios } } });

const settings = {
  minimum_app_version: "1.2.0",
  latest_app_version: "1.5.0",
  store_url: "https://store.example/app",
};

let state;

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  delete store[DISMISSED_KEY];
  getPlatform.mockReturnValue("android");
  getInfo.mockResolvedValue({ version: "1.3.0" });
  respond(settings, settings);
  state = useAppVersion();
});

describe("useAppVersion", () => {
  test("does nothing on web", async () => {
    getPlatform.mockReturnValue("web");
    await state.checkAppVersion();
    expect(getAppVersion).not.toHaveBeenCalled();
    expect(state.blocked.value).toBe(false);
    expect(state.showBanner.value).toBe(false);
  });

  test("blocks a build below the minimum version", async () => {
    getInfo.mockResolvedValue({ version: "1.1.9" });
    await state.checkAppVersion();
    expect(state.blocked.value).toBe(true);
    expect(state.showBanner.value).toBe(false);
    expect(state.storeUrl.value).toBe(settings.store_url);
  });

  test("shows the banner below latest but at or above the minimum", async () => {
    await state.checkAppVersion();
    expect(state.blocked.value).toBe(false);
    expect(state.showBanner.value).toBe(true);
  });

  test("uses the settings of the current platform", async () => {
    getPlatform.mockReturnValue("ios");
    respond(settings, { ...settings, minimum_app_version: "2.0.0" });
    await state.checkAppVersion();
    expect(state.blocked.value).toBe(true);
  });

  test("no banner when up to date", async () => {
    getInfo.mockResolvedValue({ version: "1.5.0" });
    await state.checkAppVersion();
    expect(state.blocked.value).toBe(false);
    expect(state.showBanner.value).toBe(false);
  });

  test("dismissing hides the banner for the rest of the day", async () => {
    await state.checkAppVersion();
    state.dismissBanner();
    expect(state.showBanner.value).toBe(false);
    expect(store[DISMISSED_KEY]).toBe(new Date().toISOString().slice(0, 10));
    await state.checkAppVersion();
    expect(state.showBanner.value).toBe(false);
  });

  test("a banner dismissed on an earlier day shows again", async () => {
    store[DISMISSED_KEY] = "2000-01-01";
    await state.checkAppVersion();
    expect(state.showBanner.value).toBe(true);
  });

  test("a failed request lets the user in", async () => {
    getInfo.mockResolvedValue({ version: "0.0.1" });
    await state.checkAppVersion();
    expect(state.blocked.value).toBe(true);
    getAppVersion.mockRejectedValue(new Error("offline"));
    await state.checkAppVersion();
    expect(state.blocked.value).toBe(false);
    expect(state.showBanner.value).toBe(false);
  });

  test("empty settings let the user in", async () => {
    respond(
      { minimum_app_version: "", latest_app_version: "", store_url: "" },
      {},
    );
    await state.checkAppVersion();
    expect(state.blocked.value).toBe(false);
    expect(state.showBanner.value).toBe(false);
  });
});
