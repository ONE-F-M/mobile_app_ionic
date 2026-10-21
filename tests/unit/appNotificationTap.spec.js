import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";

const app = readFileSync(resolve(__dirname, "../../src/App.vue"), "utf8");
const onMounted = app.slice(app.indexOf("onMounted("), app.indexOf("onUnmounted("));

describe("App.vue notification taps", () => {
  test("attaches the push listeners on every launch, not only at login", () => {
    expect(app).toContain("const { addListeners } = usePushRegistration();");
    expect(onMounted).toMatch(/addListeners\(\)\s*\.then\(consumePendingNotificationUrl\)/);
  });

  test("reports a failure instead of hiding it", () => {
    expect(onMounted).not.toContain(".catch(() => {})");
  });
});
