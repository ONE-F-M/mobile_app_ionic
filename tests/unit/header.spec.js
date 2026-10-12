import { mount } from "@vue/test-utils";
import { describe, expect, test } from "vitest";
import Header from "@/components/Header.vue";

describe("Header.vue", () => {
  test("back button has aria-label for screen reader accessibility", () => {
    const wrapper = mount(Header, {
      props: { withBackButton: true },
      slots: { default: "Test Header" },
    });

    const backButton = wrapper.find("ion-button");
    expect(backButton.attributes("aria-label")).toBe("Back");
  });

  test("back button is not rendered when withBackButton is false", () => {
    const wrapper = mount(Header, {
      props: { withBackButton: false },
      slots: { default: "Test Header" },
    });

    const backButton = wrapper.find("ion-button");
    expect(backButton.exists()).toBe(false);
  });
});
