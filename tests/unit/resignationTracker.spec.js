import { mount } from "@vue/test-utils";
import { describe, expect, test, vi } from "vitest";
import ResignationTracker from "@/components/resignation/ResignationTracker.vue";

vi.mock("@ionic/vue", () => ({ IonIcon: { name: "IonIcon", template: "<i />" } }));

const mountTracker = (resignation) =>
  mount(ResignationTracker, {
    props: { resignation },
    global: {
      stubs: { BilingualText: { props: ["fallback"], template: "<span>{{ fallback }}</span>" } },
      mocks: { $t: (key, fallback) => fallback ?? key },
    },
  });

describe("ResignationTracker.vue HR visit date", () => {
  test("shows the day to visit HR", () => {
    const text = mountTracker({ workflow_state: "Approved", relieving_date: "2027-02-04", hr_visit_date: "2027-02-07" }).text();

    expect(text).toContain("Visit HR on:");
    expect(text).toContain("2027-02-07");
  });

  test("shows nothing about HR when the server sends no visit date", () => {
    const text = mountTracker({ workflow_state: "Draft", relieving_date: "2027-02-04" }).text();

    expect(text).not.toContain("Visit HR on:");
  });
});
