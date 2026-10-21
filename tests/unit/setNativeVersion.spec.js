import { describe, expect, test } from "vitest";
import { applyVersion } from "../../scripts/set-native-version.mjs";

const gradle = [
  "android {",
  "    defaultConfig {",
  "        versionCode 60",
  '        versionName "6.0"',
  "    }",
  "}",
  "",
].join("\n");

const pbxproj = [
  "\t\t\tbuildSettings = {",
  "\t\t\t\tCURRENT_PROJECT_VERSION = 26;",
  "\t\t\t\tMARKETING_VERSION = 6.0;",
  "\t\t\t};",
  "\t\t\tname = Debug;",
  "\t\t\tbuildSettings = {",
  "\t\t\t\tCURRENT_PROJECT_VERSION = 26;",
  "\t\t\t\tMARKETING_VERSION = 6.0;",
  "\t\t\t};",
  "\t\t\tname = Release;",
  "",
].join("\n");

describe("applyVersion", () => {
  const result = applyVersion(gradle, pbxproj, "7.0.0", "123");

  test("sets the gradle versionCode and versionName", () => {
    expect(result.gradle).toContain("        versionCode 123\n");
    expect(result.gradle).toContain('        versionName "7.0.0"\n');
    expect(result.gradle).not.toContain("versionCode 60");
    expect(result.gradle).not.toContain('"6.0"');
  });

  test("sets both MARKETING_VERSION lines", () => {
    expect(result.pbxproj.match(/MARKETING_VERSION = 7\.0\.0;/g)).toHaveLength(2);
    expect(result.pbxproj).not.toContain("MARKETING_VERSION = 6.0;");
  });

  test("sets the build number on every CURRENT_PROJECT_VERSION line", () => {
    expect(result.pbxproj.match(/CURRENT_PROJECT_VERSION = 123;/g)).toHaveLength(2);
    expect(result.pbxproj).not.toContain("CURRENT_PROJECT_VERSION = 26;");
  });

  test("leaves the rest of both files alone", () => {
    expect(result.gradle.replace(/versionCode 123|versionName "7\.0\.0"/g, "")).toBe(
      gradle.replace(/versionCode 60|versionName "6\.0"/g, ""),
    );
    expect(result.pbxproj).toContain("name = Release;");
  });
});
