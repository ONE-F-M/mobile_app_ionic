import { describe, expect, test, vi } from "vitest";

vi.mock("@/api/http.service", () => ({ httpService: { post: vi.fn() } }));

import { httpService } from "@/api/http.service";
import checkin from "@/api/checkin";

describe("acknowledgePenalties", () => {
  test("sends the names as one JSON list, which survives form encoding", async () => {
    await checkin.acknowledgePenalties(["PI-1-HR-EMP-1", "PI-2-HR-EMP-1"]);

    const [, options] = httpService.post.mock.calls[0];
    expect(options.data.names).toBe('["PI-1-HR-EMP-1","PI-2-HR-EMP-1"]');
    expect(new URLSearchParams(options.data).get("names")).toBe('["PI-1-HR-EMP-1","PI-2-HR-EMP-1"]');
  });
});
