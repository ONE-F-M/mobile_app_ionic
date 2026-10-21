import { describe, expect, test } from "vitest";
import { NOTIFICATION_FALLBACK_PATH, toRouterPath } from "@/utils/notificationUrl";

const KNOWN = ["/leaves/HR-LAP-1", "/resignation", "/checkin", "/notification"];
const router = {
  resolve: (path) => {
    const bare = path.split(/[?#]/)[0];
    return { matched: KNOWN.includes(bare) ? [{}] : [], fullPath: path };
  },
};

describe("toRouterPath", () => {
  test("keeps the screen addresses the backend sends", () => {
    for (const path of KNOWN) expect(toRouterPath(router, path)).toBe(path);
  });

  test("keeps a query string on a known route", () => {
    expect(toRouterPath(router, "/checkin?from=push")).toBe("/checkin?from=push");
  });

  test("turns a same-origin absolute url into a path", () => {
    expect(toRouterPath(router, `${window.location.origin}/resignation`)).toBe("/resignation");
  });

  test("sends a route the app does not have to the notification list", () => {
    expect(toRouterPath(router, "/payslip")).toBe(NOTIFICATION_FALLBACK_PATH);
  });

  test("refuses a url on another site", () => {
    expect(toRouterPath(router, "https://example.com/checkin")).toBe(NOTIFICATION_FALLBACK_PATH);
  });

  test("falls back for a missing or empty url", () => {
    expect(toRouterPath(router, undefined)).toBe(NOTIFICATION_FALLBACK_PATH);
    expect(toRouterPath(router, "  ")).toBe(NOTIFICATION_FALLBACK_PATH);
  });
});
