import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, test } from "vitest";

const root = resolve(__dirname, "../..");
const ANDROID_RES = join(root, "android/app/src/main/res");
const IOS_ASSETS = join(root, "ios/App/App/Assets.xcassets");
const IONIC_DEFAULT_SPLASH_MD5 = "00459383989255587cafede50bd4321b";

const filesUnder = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? filesUnder(path) : [path];
  });

const md5 = (path) => createHash("md5").update(readFileSync(path)).digest("hex");

describe("app icons and splash screens", () => {
  test("no image is the Ionic starter splash", () => {
    const images = [...filesUnder(ANDROID_RES), ...filesUnder(IOS_ASSETS)].filter((f) => f.endsWith(".png"));
    expect(images.length).toBeGreaterThan(50);
    expect(images.filter((f) => md5(f) === IONIC_DEFAULT_SPLASH_MD5)).toEqual([]);
  });

  test("every density has the adaptive icon layers and no duplicate webp launcher", () => {
    const densities = readdirSync(ANDROID_RES).filter((d) => /^mipmap-[a-z]*dpi$/.test(d));
    expect(densities.length).toBeGreaterThanOrEqual(5);
    for (const density of densities) {
      const files = readdirSync(join(ANDROID_RES, density));
      for (const name of ["ic_launcher.png", "ic_launcher_round.png", "ic_launcher_foreground.png", "ic_launcher_background.png"]) {
        expect(files, density).toContain(name);
      }
      expect(files.filter((f) => f.startsWith("ic_launcher") && f.endsWith(".webp")), density).toEqual([]);
    }
  });

  test("the iOS icon set has the 1024 marketing icon", () => {
    const contents = JSON.parse(readFileSync(join(IOS_ASSETS, "AppIcon.appiconset/Contents.json"), "utf8"));
    const files = contents.images.map((image) => image.filename).filter(Boolean);
    expect(files).toContain("AppIcon-512@2x.png");
  });

  test("the splash stays up until the app hides it", () => {
    const config = readFileSync(join(root, "capacitor.config.ts"), "utf8");
    expect(config).toMatch(/SplashScreen:\s*{[^}]*launchAutoHide:\s*false/);
    expect(readFileSync(join(root, "src/main.js"), "utf8")).toMatch(/app\.mount\("#app"\);\s*\n\s*SplashScreen\.hide\(\)/);
  });
});
