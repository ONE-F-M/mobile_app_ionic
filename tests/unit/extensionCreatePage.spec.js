import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, test, vi } from "vitest";
import ExtensionCreatePage from "@/views/resignation/ExtensionCreatePage.vue";
import { useResignationStore } from "@/store/resignation.ts";
import resignation from "@/api/resignation";

vi.mock("@ionic/vue", () => {
  const stub = (name) => ({ name, template: "<div><slot /></div>" });
  return {
    IonContent: stub("IonContent"),
    IonPage: stub("IonPage"),
    IonRow: stub("IonRow"),
    IonCol: stub("IonCol"),
    IonIcon: stub("IonIcon"),
    IonSpinner: stub("IonSpinner"),
    IonInput: stub("IonInput"),
    IonPopover: stub("IonPopover"),
    IonDatetime: stub("IonDatetime"),
    IonSegment: stub("IonSegment"),
    IonSegmentButton: stub("IonSegmentButton"),
    IonButton: { name: "IonButton", template: "<button><slot /></button>" },
    onIonViewWillEnter: vi.fn(),
    useIonRouter: () => ({ canGoBack: () => true, back: vi.fn(), push: vi.fn() }),
  };
});
vi.mock("vue-i18n", () => ({ useI18n: () => ({ t: (key, fallback) => fallback ?? key }) }));
vi.mock("@/composable/toast.js", () => ({ useCustomToast: () => ({ showErrorToast: vi.fn() }) }));
vi.mock("@/composable/useSecondaryLanguage", () => ({
  useSecondaryLanguage: () => ({ bilingual: (text) => text, bilingualInline: (text) => text }),
}));
vi.mock("@/composable/useConfirmAlert.ts", () => ({ useConfirmAlert: () => ({ showAcknowledge: vi.fn() }) }));
vi.mock("@/composable/useNoticePeriod", () => ({
  NOTICE_PERIOD_DAYS: 90,
  useNoticePeriod: () => ({ checkNoticePeriod: vi.fn() }),
}));
vi.mock("@/composable/useFileAttachment.ts", () => ({
  useFileAttachment: () => ({
    attachment: { value: { name: "letter.png", base64: "data:image/png;base64,abc" } },
    clearAttachment: vi.fn(),
  }),
}));
vi.mock("@/api/resignation", () => ({ default: { getEmployeeSupervisor: vi.fn(), extendResignation: vi.fn() } }));

const mountPage = () =>
  mount(ExtensionCreatePage, {
    global: {
      stubs: {
        PageHeader: true,
        ResignationTracker: true,
        BilingualText: { props: ["fallback"], template: "<span>{{ fallback }}</span>" },
      },
      mocks: { $t: (key, fallback) => fallback ?? key },
    },
  });

describe("ExtensionCreatePage.vue request type", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    useResignationStore().activeResignation = { name: "HR-RES-TEST", relieving_date: "2027-02-07" };
    vi.mocked(resignation.extendResignation).mockClear();
  });

  test("offers Extension and Reduction", () => {
    const text = mountPage().text();

    expect(text).toContain("Extension (later date)");
    expect(text).toContain("Reduction (earlier date)");
  });

  test("sends Extension unless the employee picks Reduction", async () => {
    const wrapper = mountPage();

    await wrapper.vm.submitData();

    expect(resignation.extendResignation).toHaveBeenCalledWith(expect.objectContaining({ adjustment_type: "Extension" }));
  });

  test("sends the Reduction the employee picked", async () => {
    const wrapper = mountPage();
    wrapper.vm.adjustmentType = "Reduction";

    await wrapper.vm.submitData();

    expect(resignation.extendResignation).toHaveBeenCalledWith(expect.objectContaining({ adjustment_type: "Reduction" }));
  });
});
