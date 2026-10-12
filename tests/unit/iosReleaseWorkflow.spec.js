import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";

const workflow = readFileSync(resolve(__dirname, "../../.github/workflows/build-production-ios.yml"), "utf8");

describe("iOS release workflow", () => {
  test("builds only from version-15", () => {
    expect(workflow).toMatch(/push:\s*\n\s*branches:\s*\n\s*- version-15\s*\n\s*\njobs:/);
  });

  test("uses actions GitHub still runs and the lockfile's Yarn version", () => {
    expect(workflow).not.toMatch(/actions\/(checkout|upload-artifact)@v3/);
    expect(workflow).toContain("corepack yarn@3.8.7 install --immutable");
    expect(workflow).toContain("corepack yarn@3.8.7 build:native --mode production");
    expect(workflow).toContain("npx cap sync ios");
    expect(workflow).not.toContain("ionic capacitor sync");
  });

  test("gives every upload a new build number", () => {
    expect(workflow).toContain("build-number: ${{ github.run_number }}");
  });
});
