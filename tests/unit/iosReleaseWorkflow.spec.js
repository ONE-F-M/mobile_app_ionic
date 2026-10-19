import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";

const workflow = readFileSync(resolve(__dirname, "../../.github/workflows/build-production-ios.yml"), "utf8");
const exportOptions = readFileSync(resolve(__dirname, "../../ios/App/ExportOptions.plist"), "utf8");

describe("iOS release workflow", () => {
  test("builds only from version-15", () => {
    expect(workflow).toMatch(/push:\s*\n\s*branches:\s*\n\s*- version-15\s*\n\s*workflow_dispatch:\s*\n\s*\njobs:/);
  });

  test("exports with the app-store-connect method for team 8R3SW4662G", () => {
    expect(exportOptions).toMatch(/<key>method<\/key>\s*<string>app-store-connect<\/string>/);
    expect(exportOptions).toMatch(/<key>teamID<\/key>\s*<string>8R3SW4662G<\/string>/);
  });

  test("uses actions GitHub still runs and the lockfile's Yarn version", () => {
    expect(workflow).not.toMatch(/actions\/(checkout|upload-artifact)@v3/);
    expect(workflow).toContain("corepack yarn@3.8.7 install --immutable");
    expect(workflow).toContain("corepack yarn@3.8.7 build:native --mode production");
    expect(workflow).toContain("npx cap sync ios");
    expect(workflow).not.toContain("ionic capacitor sync");
  });

  test("sets no VITE_ variable, so .env.production supplies the server URL, and runs on macos-26", () => {
    expect(workflow).not.toMatch(/^\s+VITE_[A-Z_]+:/m);
    expect(workflow).toMatch(/^\s+runs-on: macos-26$/m);
  });

  test("has no separate test-production iOS workflow", () => {
    expect(existsSync(resolve(__dirname, "../../.github/workflows/build-test-production-ios.yml"))).toBe(false);
  });

  test("gives every upload a new build number", () => {
    expect(workflow).toContain("- name: Set the version");
    expect(workflow).toContain("node scripts/set-native-version.mjs ${{ github.run_number }}");
    expect(workflow).not.toContain("yanamura/ios-bump-version");
  });
});
