import { mount } from "@vue/test-utils";
import { describe, expect, test } from "vitest";
import Header from "@/components/Header.vue";

const mountHeader = (withBackButton = false) =>
  mount(Header, {
    props: { withBackButton },
    global: { stubs: { IonRow: true, IonCol: true, IonText: true, IonButton: true, IonIcon: true } },
    slots: { default: "Test Header" },
  });

describe("Header.vue", () => {
  test("shows back button when withBackButton prop is true", () => {
    const wrapper = mountHeader(true);
    expect(wrapper.find("ion-button-stub").exists()).toBe(true);
  });

  test("does not show back button when withBackButton prop is false", () => {
    const wrapper = mountHeader(false);
    expect(wrapper.find("ion-button-stub").exists()).toBe(false);
  });

  test("back button has aria-label attribute for screen reader accessibility", () => {
    const wrapper = mountHeader(true);
    const backButton = wrapper.find("ion-button-stub");

    expect(backButton.attributes("aria-label")).toBe("Back");
  });

  test("back button emits goBack event when clicked", () => {
    const wrapper = mountHeader(true);
    const backButton = wrapper.find("ion-button-stub");

    backButton.trigger("click");

    expect(wrapper.emitted("goBack")).toHaveLength(1);
  });
});
