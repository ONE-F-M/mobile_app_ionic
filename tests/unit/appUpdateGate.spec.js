import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";

const source = readFileSync(
  resolve(process.cwd(), "src/components/AppUpdateGate.vue"),
  "utf8",
);

// The banner is primary-coloured, so its buttons need color="light" to be readable.
const bannerButtons = () => {
  const banner = source.match(
    /<div[^>]*class="update-banner"[\s\S]*?<\/div>/,
  )?.[0];
  expect(banner).toBeTruthy();
  return banner.match(/<ion-button\b[^>]*>/g) ?? [];
};

describe("AppUpdateGate.vue banner buttons", () => {
  test("the banner has the Update and Later buttons", () => {
    const buttons = bannerButtons();
    expect(buttons).toHaveLength(2);
    expect(buttons[0]).toContain("openStore");
    expect(buttons[1]).toContain("dismissBanner");
  });

  test("both banner buttons are color=\"light\"", () => {
    for (const button of bannerButtons()) {
      expect(button).toContain('color="light"');
    }
  });
});
