import { mount } from "@vue/test-utils";
import { describe, expect, test } from "vitest";
import Header from "@/components/Header.vue";

describe("Header.vue", () => {
  test("back button has aria-label attribute for screen reader accessibility", () => {
    const wrapper = mount(Header, {
      props: { withBackButton: true },
      global: {
        stubs: {
          IonRow: true,
          IonCol: true,
          IonText: true,
          IonButton: true,
          IonIcon: true,
        },
      },
      slots: { default: "Test Header" },
    });

    const backButton = wrapper.find("ion-button-stub");
    expect(backButton.exists()).toBe(true);
    expect(backButton.attributes("aria-label")).toBe("Back");
  });

  test("back button aria-label is required for accessibility", () => {
    const wrapper = mount(Header, {
      props: { withBackButton: true },
      global: {
        stubs: {
          IonRow: true,
          IonCol: true,
          IonText: true,
          IonButton: true,
          IonIcon: true,
        },
      },
      slots: { default: "Test Header" },
    });

    const backButton = wrapper.find("ion-button-stub");
    // This test verifies the aria-label exists and has the correct value
    expect(backButton.attributes("aria-label")).toBeDefined();
    expect(backButton.attributes("aria-label")).toEqual("Back");
  });
});
