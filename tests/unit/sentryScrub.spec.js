import { describe, expect, test } from "vitest";
import { scrub } from "@/utils/sentryScrub.js";

const F = "[Filtered]";

describe("scrub", () => {
  test("removes employee_id and token from URLs", () => {
    const crumb = scrub({ data: { url: "https://x.one-fm.com/api/method/v1.r?employee_id=HR-EMP-04135&token=abc&page=2" } });
    expect(crumb.data.url).toBe(`https://x.one-fm.com/api/method/v1.r?employee_id=${F}&token=${F}&page=2`);
  });

  test("removes employee_id from a bare query string, as native HTTP breadcrumbs record it", () => {
    const crumb = scrub({ data: { "http.query": "employee_id=2602012XX100&from_date=2025-10-19" } });
    expect(crumb.data["http.query"]).toBe(`employee_id=${F}&from_date=2025-10-19`);
  });

  test("replaces values of sensitive keys at any depth", () => {
    const event = scrub({
      request: { headers: { Authorization: "Bearer abc.def", Accept: "application/json" } },
      extra: { employee_name: "Test Guy", form: { password: "x", video: "AAAA" } },
    });
    expect(event.request.headers).toEqual({ Authorization: F, Accept: "application/json" });
    expect(event.extra).toEqual({ employee_name: F, form: { password: F, video: F } });
  });

  test("removes bearer tokens and long base64 from free text", () => {
    const message = scrub(`failed with Bearer eyJ.abc-def and payload ${"A".repeat(300)}`);
    expect(message).toBe(`failed with Bearer ${F} and payload ${F}`);
  });

  test("keeps ordinary text, numbers and arrays", () => {
    expect(scrub({ message: "Check-in failed", count: 3, tags: ["ios", "staging"] })).toEqual({
      message: "Check-in failed",
      count: 3,
      tags: ["ios", "staging"],
    });
  });
});
