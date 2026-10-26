import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, test, vi } from "vitest";
import CheckinListPage from "@/views/checkin/CheckinListPage.vue";
import { getCurrentPositionSafe } from "@/utils/geolocation.js";
import { useUserStore } from "@/store/user.js";

const { routerReplace, hasConsent, viewWillEnter } = vi.hoisted(() => ({
  routerReplace: vi.fn(),
  hasConsent: vi.fn(),
  viewWillEnter: { handler: null },
}));

vi.mock("@/composable/useDataUseConsent.js", () => ({ hasDataUseConsent: hasConsent }));
vi.mock("@ionic/vue", () => {
  const stub = (name) => ({ name, template: "<div><slot /></div>" });
  return {
    IonContent: stub("IonContent"),
    IonButton: stub("IonButton"),
    IonText: stub("IonText"),
    IonPage: stub("IonPage"),
    IonCol: stub("IonCol"),
    IonRow: stub("IonRow"),
    IonSkeletonText: stub("IonSkeletonText"),
    useIonRouter: () => ({ back: vi.fn(), push: vi.fn(), replace: routerReplace }),
    onIonViewWillEnter: (handler) => {
      viewWillEnter.handler = handler;
    },
  };
});
vi.mock("vue-i18n", () => ({ useI18n: () => ({ t: (key) => key }) }));
vi.mock("@capacitor/app", () => ({ App: { addListener: vi.fn(), removeAllListeners: vi.fn() } }));
vi.mock("@/utils/geolocation.js", () => ({
  getCurrentPositionSafe: vi.fn(),
  locationErrorKey: vi.fn(() => "user.checkin.location_error"),
}));
vi.mock("@/api/checkin", () => ({
  default: {
    getSiteLocation: vi.fn(async () => ({ data: { data: { shift: null } } })),
    getCheckinList: vi.fn(async () => ({ data: { data: [] } })),
  },
}));
vi.mock("@/composable/toast.js", () => ({
  useCustomToast: () => ({ showErrorToast: vi.fn(), showSuccessToast: vi.fn() }),
}));

const enterPage = async () => {
  mount(CheckinListPage, {
    global: {
      mocks: { $t: (key) => key },
      stubs: { CheckinHeader: true, CheckinBanner: true, Datepicker: true, IconPlus: true },
    },
  });
  vi.useFakeTimers();
  viewWillEnter.handler();
  vi.advanceTimersByTime(300);
  vi.useRealTimers();
  await flushPromises();
};

describe("CheckinListPage.vue data-use consent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setActivePinia(createPinia());
    useUserStore().user = { employee_id: "TEST-EMP" };
    getCurrentPositionSafe.mockResolvedValue({ coords: { latitude: 29.37, longitude: 47.97 } });
  });

  test("opens the data-use notice and reads no location without consent", async () => {
    hasConsent.mockResolvedValue(false);

    await enterPage();

    expect(routerReplace).toHaveBeenCalledWith({ path: "/data-use", query: { next: "/checkin" } });
    expect(getCurrentPositionSafe).not.toHaveBeenCalled();
  });

  test("reads the location for the shift buttons once consent is given", async () => {
    hasConsent.mockResolvedValue(true);

    await enterPage();

    expect(routerReplace).not.toHaveBeenCalled();
    expect(getCurrentPositionSafe).toHaveBeenCalledTimes(1);
  });
});
