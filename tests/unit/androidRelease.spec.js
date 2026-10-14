import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";

const android = resolve(__dirname, "../../android");
const gradle = readFileSync(resolve(android, "app/build.gradle"), "utf8");
const ignored = readFileSync(resolve(android, ".gitignore"), "utf8").split("\n");

describe("Android release build", () => {
  test("signs with the keystore from keystore.properties or the ANDROID_* variables", () => {
    expect(gradle).toContain("def keystorePath = signingValue('storeFile', 'ANDROID_KEYSTORE_PATH')");
    for (const [property, variable] of [
      ["storePassword", "ANDROID_KEYSTORE_PASSWORD"],
      ["keyAlias", "ANDROID_KEY_ALIAS"],
      ["keyPassword", "ANDROID_KEY_PASSWORD"],
    ]) {
      expect(gradle).toContain(`signingValue('${property}', '${variable}')`);
    }
    expect(gradle).toContain("rootProject.file('keystore.properties')");
    expect(gradle).toMatch(/signingConfig keystorePath \? signingConfigs\.release : null\s*minifyEnabled true\s*shrinkResources true/);
  });

  test("starts above the last Play release (versionCode 50) and takes CI's number when set", () => {
    expect(gradle).toContain("versionCode Integer.parseInt(System.getenv('ANDROID_VERSION_CODE') ?: '60')");
    expect(gradle).toContain('versionName "6.0"');
  });

  test("keeps keystores and their passwords out of git", () => {
    for (const pattern of ["*.jks", "*.keystore", "keystore.properties"]) {
      expect(ignored).toContain(pattern);
    }
  });
});
