import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";

const read = (path) => readFileSync(resolve(__dirname, "../..", path), "utf8");

describe("unused native plugins stay removed", () => {
  test("package.json has neither Google Maps nor the status bar plugin", () => {
    const deps = JSON.parse(read("package.json")).dependencies;
    expect(deps).not.toHaveProperty("@capacitor/google-maps");
    expect(deps).not.toHaveProperty("@capacitor/status-bar");
  });

  test("no native file carries the Maps SDK or its key", () => {
    expect(read("android/app/build.gradle")).not.toMatch(/googleApiKey|AIza/);
    expect(read("android/app/src/main/AndroidManifest.xml")).not.toContain("com.google.android.geo.API_KEY");
    expect(read("android/variables.gradle")).not.toMatch(/googleMaps|kotlinxCoroutines/);
    expect(read("ios/App/Podfile")).not.toMatch(/GoogleMaps|Google-Maps-iOS-Utils|CapacitorStatusBar/);
  });
});
