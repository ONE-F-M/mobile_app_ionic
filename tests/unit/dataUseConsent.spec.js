import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, test, vi } from "vitest";
import {
  DATA_USE_POLICY_VERSION,
  hasDataUseConsent,
  saveDataUseConsent,
} from "@/composable/useDataUseConsent.js";
import { useUserStore } from "@/store/user.js";
import { Geolocation } from "@capacitor/geolocation";

const saved = {};

vi.mock("@capacitor/preferences", () => ({
  Preferences: {
    get: vi.fn(async ({ key }) => ({ value: key in saved ? saved[key] : null })),
    set: vi.fn(async ({ key, value }) => {
      saved[key] = value;
    }),
  },
}));
vi.mock("@capacitor/geolocation", () => ({
  Geolocation: { getCurrentPosition: vi.fn() },
}));
vi.mock("@/utils/authStorage", () => ({
  authStorage: {},
  clearAuthStorage: vi.fn(),
}));
vi.mock("@/store/auth.js", () => ({ useAuthStore: vi.fn() }));
vi.mock("@/store/resignation.ts", () => ({ useResignationStore: vi.fn() }));
vi.mock("@/api/checkin", () => ({ default: { getSiteLocation: vi.fn() } }));
vi.mock("@/api/leave", () => ({ default: {} }));
vi.mock("@/api/shifts", () => ({ default: {} }));
vi.mock("@/api/authentication", () => ({
  default: { getUserFaceEnrollment: vi.fn() },
}));

beforeEach(() => {
  vi.clearAllMocks();
  for (const key of Object.keys(saved)) delete saved[key];
  setActivePinia(createPinia());
});

describe("data-use consent", () => {
  test("is not given by default", async () => {
    expect(await hasDataUseConsent()).toBe(false);
  });

  test("is given after it is saved, under the data_use_consent key", async () => {
    await saveDataUseConsent();

    expect(saved.data_use_consent).toBe(DATA_USE_POLICY_VERSION);
    expect(DATA_USE_POLICY_VERSION).toBe("2026-10-22");
    expect(await hasDataUseConsent()).toBe(true);
  });

  test("is not given when the notice version has changed", async () => {
    saved.data_use_consent = "2020-01-01";

    expect(await hasDataUseConsent()).toBe(false);
  });
});

describe("prefetchGeolocation", () => {
  test("reads no location without consent", async () => {
    const store = useUserStore();

    await store.prefetchGeolocation("TEST-EMP");

    expect(Geolocation.getCurrentPosition).not.toHaveBeenCalled();
  });

  test("reads the location once consent is given", async () => {
    Geolocation.getCurrentPosition.mockResolvedValue(null);
    await saveDataUseConsent();
    const store = useUserStore();

    await store.prefetchGeolocation("TEST-EMP");

    expect(Geolocation.getCurrentPosition).toHaveBeenCalledTimes(1);
  });
});
