import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, test, vi } from "vitest";
import CheckinGeolocation from "@/views/checkin/CheckinGeolocation.vue";
import checkin from "@/api/checkin";
import { getCurrentPositionSafe } from "@/utils/geolocation.js";
import { useUserStore } from "@/store/user.js";

vi.mock("@ionic/vue", () => {
  const stub = (name) => ({ name, props: ["isOpen"], template: "<div><slot /></div>" });
  return {
    IonContent: stub("IonContent"),
    IonModal: stub("IonModal"),
    IonPage: stub("IonPage"),
    IonRow: stub("IonRow"),
    IonButton: stub("IonButton"),
    IonText: stub("IonText"),
    IonSpinner: stub("IonSpinner"),
    IonProgressBar: stub("IonProgressBar"),
    onIonViewDidEnter: vi.fn(),
    onIonViewWillLeave: vi.fn(),
    onIonViewDidLeave: vi.fn(),
    useIonRouter: () => ({ back: vi.fn(), push: vi.fn() }),
  };
});
vi.mock("vue-router", () => ({
  useRoute: () => ({ query: { shift: "HR-SHA-TEST", log_type: "IN" } }),
}));
vi.mock("vue-i18n", () => ({ useI18n: () => ({ t: (key) => key }) }));
vi.mock("@capacitor/core", () => ({ Capacitor: { getPlatform: () => "web" } }));
vi.mock("@googlemaps/js-api-loader", () => ({ Loader: vi.fn() }));
vi.mock("@/utils/geolocation.js", () => ({ getCurrentPositionSafe: vi.fn() }));
vi.mock("@/api/checkin", () => ({ default: { getSiteLocation: vi.fn(), verifyCheckin: vi.fn() } }));
vi.mock("@/api/utils", () => ({
  default: { getGoogleMapApiKey: vi.fn(async () => ({ data: { data: { google_map_api: "test" } } })) },
}));
vi.mock("@/api/authentication", () => ({
  default: { getUserFaceEnrollment: vi.fn(async () => ({ data: { data: { enrolled: true } } })) },
}));
vi.mock("@/composable/toast.js", () => ({
  useCustomToast: () => ({ showErrorToast: vi.fn(), showSuccessToast: vi.fn() }),
}));

const INSIDE_FIX = { coords: { latitude: 29.151985, longitude: 48.1210916 } };
const siteLocationResponse = (inside) => ({
  data: {
    data: {
      geofence_radius: 200,
      site_name: "Mahboula Camp",
      latitude: 29.151817,
      longitude: 48.121204,
      endpoint_status: 0,
      user_within_geofence_radius: inside,
      shift: { name: "HR-SHA-TEST", log_type: "IN" },
    },
  },
});

const mountPage = async () => {
  const wrapper = mount(CheckinGeolocation, {
    global: {
      mocks: { $t: (key) => key },
      stubs: {
        Header: true,
        CheckinBanner: true,
        IconScan: true,
        IconClose: true,
        MyLocation: true,
      },
    },
  });
  await flushPromises();
  return wrapper;
};

const outsideModalIsOpen = (wrapper) =>
  wrapper.findAllComponents({ name: "IonModal" })[1].props("isOpen");

describe("CheckinGeolocation.vue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.className = "dark";
    document.body.innerHTML = '<div id="map"></div>';
    setActivePinia(createPinia());

    const userStore = useUserStore();
    userStore.user = { employee_id: "TEST-EMP" };
    userStore.cachedGeolocationData = siteLocationResponse(false).data.data;
    userStore.lastGeolocationFetch = Date.now();

    getCurrentPositionSafe.mockResolvedValue(INSIDE_FIX);
    checkin.getSiteLocation.mockResolvedValue(siteLocationResponse(true));
  });

  test("decides inside or outside from a fresh fix, not the stored Home answer", async () => {
    const wrapper = await mountPage();

    expect(getCurrentPositionSafe).toHaveBeenCalledWith({ maximumAge: 0, highAccuracyOnly: true });
    expect(checkin.getSiteLocation).toHaveBeenCalledWith(
      expect.objectContaining({ latitude: 29.151985, longitude: 48.1210916 }),
    );
    expect(outsideModalIsOpen(wrapper)).toBe(false);
  });

  test("checks the location again when Check-in is pressed", async () => {
    const wrapper = await mountPage();
    checkin.getSiteLocation.mockResolvedValue(siteLocationResponse(false));

    await wrapper.find(".checkin-button").trigger("click");
    await flushPromises();

    expect(getCurrentPositionSafe).toHaveBeenCalledTimes(2);
    expect(checkin.getSiteLocation).toHaveBeenCalledTimes(2);
    expect(outsideModalIsOpen(wrapper)).toBe(true);
  });
});
