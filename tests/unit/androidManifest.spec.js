import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";

const manifest = readFileSync(
  resolve(__dirname, "../../android/app/src/main/AndroidManifest.xml"),
  "utf8",
);

const permission = (name) =>
  manifest.match(new RegExp(`<uses-permission[^>]*android\\.permission\\.${name}"[^>]*>`))?.[0];

const feature = (name) =>
  manifest.match(new RegExp(`<uses-feature[^>]*android:name="${name}"[^>]*>`))?.[0];

describe("AndroidManifest.xml", () => {
  test("asks only for the permissions the app uses", () => {
    expect(permission("RECORD_VIDEO")).toBeUndefined();
    for (const name of ["CAMERA", "ACCESS_COARSE_LOCATION", "ACCESS_FINE_LOCATION", "INTERNET"]) {
      expect(permission(name)).toBeDefined();
    }
  });

  test("declares POST_NOTIFICATIONS, which the push plugin requests but does not declare", () => {
    expect(permission("POST_NOTIFICATIONS")).toBeDefined();
  });

  test("limits storage permissions to Android 12 and older", () => {
    for (const name of ["READ_EXTERNAL_STORAGE", "WRITE_EXTERNAL_STORAGE"]) {
      expect(permission(name)).toContain('android:maxSdkVersion="32"');
    }
  });

  test("does not require camera or GPS hardware", () => {
    for (const name of [
      "android.hardware.camera",
      "android.hardware.camera.autofocus",
      "android.hardware.location.gps",
    ]) {
      expect(feature(name)).toContain('android:required="false"');
    }
  });

  test("does not back up app data", () => {
    expect(manifest).toContain('android:allowBackup="false"');
  });
});
