import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import dotenv from "dotenv";
import { describe, expect, test } from "vitest";

const read = (path) => readFileSync(resolve(__dirname, "../..", path), "utf8");

describe("Sentry build setup", () => {
  test.each(["staging", "test-production", "production"])("%s has the one-fm-mobile DSN in the EU region", (mode) => {
    expect(dotenv.parse(read(`.env.${mode}`)).VITE_SENTRY_DSN).toMatch(/^https:\/\/\w+@o\d+\.ingest\.de\.sentry\.io\/\d+$/);
  });

  test("source maps are built hidden only with a token, and deleted after upload", () => {
    const config = read("vite.config.ts");
    expect(config).toContain("sourcemap: sentryAuthToken ? 'hidden' : false");
    expect(config).toContain("disable: !sentryAuthToken");
    expect(config).toContain("filesToDeleteAfterUpload: ['dist/**/*.map']");
  });

  test("both store workflows pass the token, and iOS uploads its debug symbols only when it is set", () => {
    for (const file of ["build-production-apk.yml", "build-production-ios.yml"]) {
      expect(read(`.github/workflows/${file}`), file).toContain("SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}");
    }
    expect(read(".github/workflows/build-production-ios.yml")).toMatch(/if: env\.SENTRY_AUTH_TOKEN != ''\s+run: npx sentry-cli .*debug-files upload .*dSYMs/);
  });

  test("Android uploads the R8 mapping only when the token is set", () => {
    const gradle = read("android/app/build.gradle");
    expect(gradle).toContain("apply plugin: 'io.sentry.android.gradle'");
    expect(gradle).toContain("autoUploadProguardMapping = !sentryAuthToken.isEmpty()");
    expect(read("android/build.gradle")).toContain("io.sentry:sentry-android-gradle-plugin:6.23.0");
  });

  test("the native Sentry plugin is linked on both platforms", () => {
    expect(read("ios/App/Podfile")).toContain("pod 'SentryCapacitor', :path => '../../node_modules/@sentry/capacitor'");
    expect(read("android/capacitor.settings.gradle")).toContain("include ':sentry-capacitor'");
  });

  test("an outdated WebView is reported before the update prompt", () => {
    const main = read("src/main.js");
    expect(main.indexOf('captureMessage("webview_too_old"')).toBeGreaterThan(0);
    expect(main.indexOf('captureMessage("webview_too_old"')).toBeLessThan(main.indexOf("showWebViewGate(i18n"));
  });
});
