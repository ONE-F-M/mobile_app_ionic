import { beforeEach, describe, expect, test, vi } from "vitest";

const init = vi.fn();
const setTag = vi.fn();
vi.mock("@sentry/capacitor", () => ({ init: (...a) => init(...a), setTag: (...a) => setTag(...a) }));
vi.mock("@sentry/vue", () => ({ init: "vue-init" }));

const load = async () => (await import("@/plugins/sentry.js")).initSentry;

describe("initSentry", () => {
  beforeEach(() => {
    vi.resetModules();
    init.mockClear();
    setTag.mockClear();
    vi.unstubAllEnvs();
  });

  test("does nothing without a DSN", async () => {
    vi.stubEnv("VITE_SENTRY_DSN", "");
    (await load())({});
    expect(init).not.toHaveBeenCalled();
  });

  test("starts Sentry with the release, the environment and no personal data", async () => {
    vi.stubEnv("VITE_SENTRY_DSN", "https://key@o1.ingest.de.sentry.io/2");
    const app = {};
    (await load())(app);
    const [options, vueInit] = init.mock.calls[0];
    expect(vueInit).toBe("vue-init");
    expect(options.app).toBe(app);
    expect(options.release).toBe(`one-fm-mobile@${__APP_VERSION__}`);
    expect(options.environment).toBe(import.meta.env.MODE);
    expect(options.sendDefaultPii).toBe(false);
    const sent = options.beforeSend({ user: { id: "x" }, request: { url: "/r?employee_id=E1" } });
    expect(sent.user).toBeUndefined();
    expect(sent.request.url).toBe("/r?employee_id=[Filtered]");
    expect(options.beforeBreadcrumb({ message: "Bearer abc" }).message).toBe("Bearer [Filtered]");
  });

  test("tags the WebView version", async () => {
    vi.stubEnv("VITE_SENTRY_DSN", "https://key@o1.ingest.de.sentry.io/2");
    vi.spyOn(navigator, "userAgent", "get").mockReturnValue("Mozilla/5.0 (Linux; Android 14; wv) Chrome/120.0.6099.230 Mobile");
    (await load())({});
    expect(setTag).toHaveBeenCalledWith("webview", "Chrome 120.0.6099.230");
  });
});
