import { beforeEach, describe, expect, test, vi } from "vitest";

const sheetCreate = vi.fn();
const captureException = vi.fn();
const addBreadcrumb = vi.fn();
const user = { current: null };

vi.mock("@sentry/capacitor", () => ({
  captureException: (...a) => captureException(...a),
  addBreadcrumb: (...a) => addBreadcrumb(...a),
  nativeCrash: vi.fn(),
}));
vi.mock("@ionic/vue", () => ({
  actionSheetController: { create: (...a) => sheetCreate(...a) },
  alertController: { create: vi.fn() },
  toastController: { create: vi.fn(async () => ({ present: vi.fn() })) },
}));
vi.mock("vue-i18n", () => ({ useI18n: () => ({ t: (key) => key }) }));
vi.mock("@/store/user", () => ({ useUserStore: () => ({ user: user.current }) }));

import { TAPS_TO_OPEN, TESTER_ROLE, useDebugMenu } from "@/composable/useDebugMenu.js";

const tap = async (menu, times) => {
  for (let i = 0; i < times; i += 1) await menu.onVersionTap();
};

describe("useDebugMenu", () => {
  beforeEach(() => {
    sheetCreate.mockReset();
    sheetCreate.mockResolvedValue({ present: vi.fn() });
    captureException.mockClear();
  });

  test("opens on the seventh tap for a tester", async () => {
    user.current = { roles: ["Employee", TESTER_ROLE] };
    const menu = useDebugMenu();
    await tap(menu, TAPS_TO_OPEN - 1);
    expect(sheetCreate).not.toHaveBeenCalled();
    await tap(menu, 1);
    expect(sheetCreate).toHaveBeenCalledTimes(1);
  });

  test("never opens for a user without the tester role", async () => {
    user.current = { roles: ["Employee"] };
    await tap(useDebugMenu(), TAPS_TO_OPEN * 2);
    expect(sheetCreate).not.toHaveBeenCalled();
  });

  test("sends a test error with a URL that the scrubber must clean", async () => {
    user.current = { roles: [TESTER_ROLE] };
    await tap(useDebugMenu(), TAPS_TO_OPEN);
    const { buttons } = sheetCreate.mock.calls[0][0];
    await buttons[0].handler();
    expect(captureException).toHaveBeenCalledWith(expect.objectContaining({ message: "Sentry test error from the debug menu" }));
    expect(addBreadcrumb.mock.calls[0][0].message).toContain("employee_id=");
  });
});
