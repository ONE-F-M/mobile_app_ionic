import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";

const iosApp = resolve(__dirname, "../../ios/App");
const plist = readFileSync(resolve(iosApp, "App/Info.plist"), "utf8");
const project = readFileSync(resolve(iosApp, "App.xcodeproj/project.pbxproj"), "utf8");

const PERMISSION_KEYS = [
  "NSCameraUsageDescription",
  "NSLocationWhenInUseUsageDescription",
  "NSPhotoLibraryUsageDescription",
  "NSPhotoLibraryAddUsageDescription",
];

const plistString = (key) => plist.match(new RegExp(`<key>${key}</key>\\s*<string>([^<]*)</string>`))?.[1];
const plistArray = (key) => {
  const block = plist.match(new RegExp(`<key>${key}</key>\\s*<array>([\\s\\S]*?)</array>`))?.[1] || "";
  return [...block.matchAll(/<string>([^<]*)<\/string>/g)].map((m) => m[1]);
};
const strings = (lang) => {
  const text = readFileSync(resolve(iosApp, `App/${lang}.lproj/InfoPlist.strings`), "utf8");
  return Object.fromEntries([...text.matchAll(/"([^"]+)"\s*=\s*"([^"]*)";/g)].map((m) => [m[1], m[2]]));
};

describe("iOS identity", () => {
  test("shows ONE FM under the icon", () => {
    expect(plistString("CFBundleDisplayName")).toBe("ONE FM");
  });

  test("does not require 32-bit hardware", () => {
    expect(plistArray("UIRequiredDeviceCapabilities")).not.toContain("armv7");
  });

  test("runs in portrait only, on iPhone only", () => {
    expect(plistArray("UISupportedInterfaceOrientations")).toEqual(["UIInterfaceOrientationPortrait"]);
    expect(plist).not.toContain("UISupportedInterfaceOrientations~ipad");
    expect(project).not.toMatch(/TARGETED_DEVICE_FAMILY = "1,2"/);
    expect(project.match(/TARGETED_DEVICE_FAMILY = 1;/g)).toHaveLength(2);
  });
});

describe("iOS permission prompts", () => {
  test("every prompt explains the reason in a sentence", () => {
    for (const key of PERMISSION_KEYS) {
      const text = plistString(key);
      expect(text, key).toMatch(/^ONE FM .+\.$/);
      expect(text, key).not.toMatch(/Privacy -|Allow to use/);
    }
  });

  test("English and Arabic strings cover every prompt and are registered with Xcode", () => {
    for (const lang of ["en", "ar"]) {
      const values = strings(lang);
      for (const key of PERMISSION_KEYS) expect(values[key], `${lang} ${key}`).toBeTruthy();
      expect(project).toContain(`path = ${lang}.lproj/InfoPlist.strings;`);
    }
    expect(strings("ar").NSCameraUsageDescription).toMatch(/[؀-ۿ]/);
    expect(project).toMatch(/knownRegions = \([^)]*\bar,/);
    expect(project).toMatch(/InfoPlist\.strings in Resources/);
  });
});
