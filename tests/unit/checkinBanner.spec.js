import { mount } from "@vue/test-utils";
import { describe, expect, test } from "vitest";
import CheckinBanner from "@/components/checkin/CheckinBanner.vue";

// MdiIcon is registered globally in main.js, which a unit mount does not run.
const mountBanner = (message) =>
  mount(CheckinBanner, {
    props: { message },
    global: { stubs: { MdiIcon: true } },
  });

describe("CheckinBanner.vue", () => {
  test("says nothing when there is nothing to say", () => {
    expect(mountBanner("").find(".checkin-banner").exists()).toBe(false);
  });

  test("shows the server's sentence as it was written", () => {
    // The wording is the server's; the banner must not paraphrase or truncate it.
    const message =
      "Check-In Window Closed: Your shift check-in window closed at 12:00 PM. " +
      "Please contact your Site Supervisor for late check-in authorization.";

    expect(mountBanner(message).text()).toBe(message);
  });

  test("is announced to a screen reader", () => {
    const banner = mountBanner("Check-In Unavailable").find(".checkin-banner");

    expect(banner.attributes("role")).toBe("status");
    expect(banner.attributes("aria-live")).toBe("polite");
  });
});
