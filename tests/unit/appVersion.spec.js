import { describe, expect, test } from "vitest";
import { isOlder } from "@/utils/appVersion";

describe("isOlder", () => {
  test("compares number by number, not as text", () => {
    expect(isOlder("1.9.0", "1.10.0")).toBe(true);
    expect(isOlder("1.10.0", "1.9.0")).toBe(false);
    expect(isOlder("2.0.0", "10.0.0")).toBe(true);
  });

  test("equal versions are not older, and missing parts count as zero", () => {
    expect(isOlder("1.2.3", "1.2.3")).toBe(false);
    expect(isOlder("1.2", "1.2.0")).toBe(false);
    expect(isOlder("1.2", "1.2.1")).toBe(true);
  });

  test("an empty value is never older", () => {
    expect(isOlder("1.0.0", "")).toBe(false);
    expect(isOlder("1.0.0", undefined)).toBe(false);
    expect(isOlder("1.0.0", null)).toBe(false);
    expect(isOlder("", "1.0.0")).toBe(false);
    expect(isOlder("1.0.0", "  ")).toBe(false);
  });
});
