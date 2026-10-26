import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";

const root = resolve(__dirname, "../..");
const gradle = readFileSync(resolve(root, "android/app/build.gradle"), "utf8");
const googlePlay = readFileSync(resolve(root, "docs/store/google-play.md"), "utf8");

describe("Google Play answers match the Android build", () => {
  test("declare App interactions only while an analytics SDK is in the build", () => {
    const hasAnalytics = gradle.includes("firebase-analytics");
    expect(googlePlay.includes("| App activity | App interactions |")).toBe(hasAnalytics);
  });
});
