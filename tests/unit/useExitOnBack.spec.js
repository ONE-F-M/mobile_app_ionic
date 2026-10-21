import { beforeEach, describe, expect, test, vi } from "vitest";

const backHandlers = [];
const route = { value: { path: "/dashboard" } };
const showToast = vi.fn();
const addListener = vi.fn();
const exitApp = vi.fn();

vi.mock("@ionic/vue", () => ({
  useBackButton: (priority, handler) => backHandlers.push({ priority, handler }),
}));
vi.mock("@capacitor/app", () => ({ App: { addListener, exitApp } }));
vi.mock("vue-router", () => ({ useRouter: () => ({ currentRoute: route }) }));
vi.mock("vue-i18n", () => ({ useI18n: () => ({ t: (key) => key }) }));
vi.mock("@/composable/toast.js", () => ({ useCustomToast: () => ({ showToast }) }));

const { useExitOnBack, EXIT_WINDOW_MS } = await import("@/composable/useExitOnBack.js");

const pressBack = () => {
  const next = vi.fn();
  backHandlers[0].handler(next);
  return next;
};

beforeEach(() => {
  backHandlers.length = 0;
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-12T12:00:00Z"));
  useExitOnBack();
});

describe("useExitOnBack", () => {
  test("hands the Android back button to Ionic and registers below overlays", () => {
    expect(addListener).toHaveBeenCalledWith("backButton", expect.any(Function));
    expect(backHandlers).toHaveLength(1);
    expect(backHandlers[0].priority).toBe(10);
  });

  test("on an entry screen the first press warns and the second within 2 s exits", () => {
    for (const path of ["/", "/employee-id", "/login", "/dashboard", "/enrollment"]) {
      route.value = { path };
      vi.advanceTimersByTime(EXIT_WINDOW_MS + 1);
      expect(pressBack()).not.toHaveBeenCalled();
      expect(showToast).toHaveBeenLastCalledWith({ message: "utils.press_back_again_to_exit", duration: EXIT_WINDOW_MS });
      expect(exitApp).not.toHaveBeenCalled();

      vi.advanceTimersByTime(EXIT_WINDOW_MS - 500);
      pressBack();
      expect(exitApp).toHaveBeenCalledTimes(1);
      exitApp.mockClear();
    }
  });

  test("a second press after 2 s warns again instead of exiting", () => {
    route.value = { path: "/dashboard" };
    pressBack();
    vi.advanceTimersByTime(EXIT_WINDOW_MS + 1);
    pressBack();
    expect(exitApp).not.toHaveBeenCalled();
    expect(showToast).toHaveBeenCalledTimes(2);
  });

  test("on other screens back goes to the next handler, so Ionic pops the page", () => {
    route.value = { path: "/checkin" };
    expect(pressBack()).toHaveBeenCalledTimes(1);
    expect(showToast).not.toHaveBeenCalled();
    expect(exitApp).not.toHaveBeenCalled();
  });
});
