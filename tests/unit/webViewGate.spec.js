import { describe, it, expect, vi, beforeEach } from "vitest";

const create = vi.fn();
const useBackButton = vi.fn();

vi.mock("@ionic/vue", () => ({
  alertController: { create: (...args) => create(...args) },
  useBackButton: (...args) => useBackButton(...args),
}));

import {
  MIN_WEBVIEW_MAJOR,
  webViewMajor,
  isWebViewTooOld,
  webViewStoreUrl,
  showWebViewGate,
} from "@/utils/webViewGate.js";

const UA_88 =
  "Mozilla/5.0 (Linux; Android 8.0.0; SM-G950F Build/R16NW; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/88.0.4324.93 Mobile Safari/537.36";
const UA_120 =
  "Mozilla/5.0 (Linux; Android 13; Pixel 7 Build/TQ3A; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/120.0.6099.144 Mobile Safari/537.36";
const UA_89 = UA_120.replace("Chrome/120", "Chrome/89");
const UA_NO_CHROME = "Mozilla/5.0 (Linux; Android 8.0.0) AppleWebKit/537.36";

describe("webViewGate", () => {
  beforeEach(() => {
    create.mockReset();
    useBackButton.mockReset();
    vi.restoreAllMocks();
  });

  it("uses 89 as the minimum major", () => {
    expect(MIN_WEBVIEW_MAJOR).toBe(89);
  });

  it("webViewMajor parses the Chrome token", () => {
    expect(webViewMajor(UA_88)).toBe(88);
    expect(webViewMajor(UA_120)).toBe(120);
    expect(webViewMajor(UA_NO_CHROME)).toBeNull();
  });

  it("isWebViewTooOld only on android below the minimum", () => {
    expect(isWebViewTooOld(UA_88, "ios")).toBe(false);
    expect(isWebViewTooOld(UA_88, "web")).toBe(false);
    expect(isWebViewTooOld(UA_89, "android")).toBe(false);
    expect(isWebViewTooOld(UA_120, "android")).toBe(false);
    expect(isWebViewTooOld(UA_NO_CHROME, "android")).toBe(false);
    expect(isWebViewTooOld(UA_88, "android")).toBe(true);
  });

  it("webViewStoreUrl picks chrome on Android 7-9, webview otherwise", () => {
    expect(webViewStoreUrl(UA_88)).toBe("market://details?id=com.android.chrome");
    expect(webViewStoreUrl(UA_120)).toBe(
      "market://details?id=com.google.android.webview"
    );
  });

  it("showWebViewGate creates a blocking alert with a back guard", async () => {
    const unregister = vi.fn();
    useBackButton.mockReturnValue(unregister);
    let dismissCb;
    const alert = {
      present: vi.fn().mockResolvedValue(undefined),
      onDidDismiss: vi.fn(() => ({
        then: (cb) => {
          dismissCb = cb;
        },
      })),
    };
    create.mockResolvedValue(alert);
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    const t = (key) => key;

    await showWebViewGate(t, UA_88);

    expect(useBackButton).toHaveBeenCalledWith(101, expect.any(Function));
    const options = create.mock.calls[0][0];
    expect(options.header).toBe("utils.webview_outdated.title");
    expect(options.message).toBe("utils.webview_outdated.message");
    expect(options.backdropDismiss).toBe(false);
    expect(options.buttons.map((b) => b.text)).toEqual([
      "utils.webview_outdated.update",
      "utils.webview_outdated.retry",
    ]);

    const result = options.buttons[0].handler();
    expect(openSpy).toHaveBeenCalledWith(
      "market://details?id=com.android.chrome",
      "_system"
    );
    expect(result).toBe(false);
    expect(alert.present).toHaveBeenCalled();

    dismissCb();
    expect(unregister).toHaveBeenCalled();
  });
});
