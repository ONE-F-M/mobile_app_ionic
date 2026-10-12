import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";

const dir = resolve(__dirname, "../../.github/workflows");
const workflows = readdirSync(dir).filter((f) => /^build-.*\.yml$/.test(f));

describe("native build workflows", () => {
  test("every APK and IPA workflow builds with CAP_NATIVE", () => {
    expect(workflows.length).toBeGreaterThanOrEqual(6);
    for (const file of workflows) {
      expect(readFileSync(resolve(dir, file), "utf8"), file).toMatch(/^\s+CAP_NATIVE: "1"$/m);
    }
  });
});
