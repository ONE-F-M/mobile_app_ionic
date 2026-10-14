import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, test, vi } from "vitest";
import ResignationCreatePage from "@/views/resignation/ResignationCreatePage.vue";
import { useResignationStore } from "@/store/resignation.ts";

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
    IonButton: { name: "IonButton", template: "<button><slot /></button>" },
    popoverController: { getTop: vi.fn() },
    onIonViewWillEnter: vi.fn(),
    useIonRouter: () => ({ canGoBack: () => true, back: vi.fn(), push: vi.fn() }),
  };
});
vi.mock("vue-router", () => ({ useRoute: () => ({ params: {} }) }));
vi.mock("vue-i18n", () => ({ useI18n: () => ({ t: (key, fallback) => fallback ?? key }) }));
vi.mock("@/composable/toast.js", () => ({ useCustomToast: () => ({ showErrorToast: vi.fn() }) }));
vi.mock("@/composable/useSecondaryLanguage", () => ({
  useSecondaryLanguage: () => ({ bilingual: (text) => text, bilingualInline: (text) => text }),
}));
vi.mock("@/composable/useConfirmAlert.ts", () => ({ useConfirmAlert: () => ({ showAcknowledge: vi.fn() }) }));
vi.mock("@/composable/useNoticePeriod.ts", () => ({ useNoticePeriod: () => ({ checkNoticePeriod: vi.fn() }) }));
vi.mock("@/composable/useFileAttachment.ts", () => ({ useFileAttachment: () => ({}) }));
vi.mock("@/api/resignation", () => ({ default: { getEmployeeSupervisor: vi.fn() } }));

const mountWithResignation = (workflowState) => {
  useResignationStore().activeResignation = { name: "HR-RES-TEST", workflow_state: workflowState };
  return mount(ResignationCreatePage, {
    global: {
      stubs: {
        PageHeader: true,
        ResignationTracker: true,
        BilingualText: { props: ["fallback"], template: "<span>{{ fallback }}</span>" },
      },
      mocks: { $t: (key, fallback) => fallback ?? key },
    },
  });
};

const buttonLabels = (wrapper) => wrapper.findAll("button").map((button) => button.text());

describe("ResignationCreatePage.vue actions", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  test("a resignation at Pending Supervisor can be withdrawn but not extended or reduced", () => {
    const labels = buttonLabels(mountWithResignation("Pending Supervisor"));

    expect(labels).toContain("Withdraw Resignation");
    expect(labels).not.toContain("Extend / Reduce Resignation");
  });

  test("an Approved resignation can be withdrawn, extended or reduced", () => {
    const labels = buttonLabels(mountWithResignation("Approved"));

    expect(labels).toContain("Withdraw Resignation");
    expect(labels).toContain("Extend / Reduce Resignation");
  });

  test("a pending relieving date correction can still be withdrawn", () => {
    const labels = buttonLabels(mountWithResignation("Pending Relieving Date Correction"));

    expect(labels).toContain("Submit Date Correction");
    expect(labels).toContain("Withdraw Resignation");
    expect(labels).not.toContain("Extend / Reduce Resignation");
  });
});
