import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";

const workflow = readFileSync(resolve(__dirname, "../../.github/workflows/build-production-apk.yml"), "utf8");

describe("Android release workflow", () => {
  test("builds from version-15 or a manual run", () => {
    expect(workflow).toMatch(/push:\s*\n\s*branches:\s*\n\s*- version-15\s*\n\s*workflow_dispatch:\s*\n\s*\njobs:/);
  });

  test("builds a signed bundle with Yarn 3 and the keystore from secrets", () => {
    expect(workflow).toContain("corepack yarn@3.8.7 install --immutable");
    expect(workflow).toContain("corepack yarn@3.8.7 build:native --mode production");
    expect(workflow).toContain('base64 --decode > "$ANDROID_KEYSTORE_PATH"');
    expect(workflow).toContain("./gradlew bundleRelease");
    for (const secret of ["ANDROID_KEYSTORE_BASE64", "ANDROID_KEYSTORE_PASSWORD", "ANDROID_KEY_ALIAS", "ANDROID_KEY_PASSWORD"]) {
      expect(workflow).toContain(`secrets.${secret}`);
    }
    expect(workflow).not.toMatch(/assembleDebug|ionic capacitor/);
  });

  test("numbers every upload above Play's last release", () => {
    expect(workflow).toContain("node scripts/set-native-version.mjs $((60 + GITHUB_RUN_NUMBER))");
    expect(workflow).not.toContain("ANDROID_VERSION_CODE");
    expect(workflow.indexOf("node scripts/set-native-version.mjs")).toBeLessThan(workflow.indexOf("cd android"));
  });

  test("has no arithmetic inside an expression, which GitHub rejects", () => {
    expect(workflow).not.toMatch(/\$\{\{[^}]*\s[-+*/]\s[^}]*\}\}/);
  });

  test("sets no VITE_ variable, so the committed .env.production supplies the server URL", () => {
    expect(workflow).not.toMatch(/^\s+VITE_[A-Z_]+:/m);
  });

  test("has no separate test-production workflow", () => {
    expect(existsSync(resolve(__dirname, "../../.github/workflows/build-test-production-apk.yml"))).toBe(false);
  });

  test("uploads the bundle to the internal track of the live package", () => {
    expect(workflow).toContain("packageName: com.onefacilitiesmanagement.android.app");
    expect(workflow).toContain("releaseFiles: android/app/build/outputs/bundle/release/app-release.aab");
    expect(workflow).toContain("track: internal");
    expect(workflow).toContain("secrets.PLAY_SERVICE_ACCOUNT_JSON");
  });
});
