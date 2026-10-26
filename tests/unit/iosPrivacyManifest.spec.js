import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";

const iosApp = resolve(__dirname, "../../ios/App");
const manifestPath = resolve(iosApp, "App/PrivacyInfo.xcprivacy");
const project = readFileSync(resolve(iosApp, "App.xcodeproj/project.pbxproj"), "utf8");

const reasonsFor = (manifest, category) => {
  const block = manifest.match(
    new RegExp(`<string>${category}</string>\\s*<key>NSPrivacyAccessedAPITypeReasons</key>\\s*<array>([\\s\\S]*?)</array>`),
  )?.[1] || "";
  return [...block.matchAll(/<string>([^<]*)<\/string>/g)].map((m) => m[1]);
};

describe("iOS privacy manifest", () => {
  test("exists and declares no tracking", () => {
    expect(existsSync(manifestPath)).toBe(true);
    const manifest = readFileSync(manifestPath, "utf8");
    expect(manifest).toMatch(/<key>NSPrivacyTracking<\/key>\s*<false\/>/);
  });

  test("gives a reason for each required-reason API the plugins use", () => {
    const manifest = readFileSync(manifestPath, "utf8");
    // @capacitor/preferences stores the session in UserDefaults for the app itself.
    expect(reasonsFor(manifest, "NSPrivacyAccessedAPICategoryUserDefaults")).toEqual(["CA92.1"]);
    // @capacitor/filesystem returns creation and modification dates of files in the app container.
    expect(reasonsFor(manifest, "NSPrivacyAccessedAPICategoryFileTimestamp")).toEqual(["C617.1"]);
  });

  test("is bundled with the App target", () => {
    expect(project).toMatch(/\/\* PrivacyInfo\.xcprivacy \*\/ = \{isa = PBXFileReference;[^}]*path = PrivacyInfo\.xcprivacy;/);
    const resources = project.match(/\/\* Resources \*\/ = \{\s*isa = PBXResourcesBuildPhase;[\s\S]*?\);/)?.[0] || "";
    expect(resources).toContain("PrivacyInfo.xcprivacy in Resources");
  });
});
