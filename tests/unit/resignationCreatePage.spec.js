import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, test, vi } from "vitest";
import ResignationCreatePage from "@/views/resignation/ResignationCreatePage.vue";
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
vi.mock("@/composable/useNoticePeriod.ts", () => ({
  NOTICE_PERIOD_DAYS: 90,
  useNoticePeriod: () => ({ checkNoticePeriod: vi.fn() }),
}));
vi.mock("@/composable/useFileAttachment.ts", () => ({
  useFileAttachment: () => ({
    attachment: { value: { name: "letter.png", base64: "data:image/png;base64,abc" } },
    clearAttachment: vi.fn(),
  }),
}));
vi.mock("@/api/resignation", () => ({ default: { getEmployeeSupervisor: vi.fn(), createResignation: vi.fn() } }));
vi.mock("@/components/resignation/ResignationRecordForm.vue", () => ({
  default: { name: "ResignationRecordForm", template: "<div class='record-form-stub' />" },
}));

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

  test("a resignation waiting for its first approver can be withdrawn, extended or reduced", () => {
    for (const state of ["Pending Supervisor", "Pending Line Manager", "Pending T4 Admin"]) {
      const labels = buttonLabels(mountWithResignation(state));

      expect(labels).toContain("Withdraw Resignation");
      expect(labels).toContain("Extend / Reduce Resignation");
    }
  });

  test("once the first approver has approved, only HR can change the date", () => {
    for (const state of ["Pending Project Manager", "Approved"]) {
      const labels = buttonLabels(mountWithResignation(state));

      expect(labels).toContain("Withdraw Resignation");
      expect(labels).not.toContain("Extend / Reduce Resignation");
    }
  });

  test("a pending relieving date correction shows the record form, not the old correction button", () => {
    const wrapper = mountWithResignation("Pending Relieving Date Correction");
    const labels = buttonLabels(wrapper);

    expect(labels).not.toContain("Submit Date Correction");
    expect(labels).toContain("Withdraw Resignation");
    expect(labels).not.toContain("Extend / Reduce Resignation");
    expect(wrapper.find(".record-form-stub").exists()).toBe(true);
  });

  test("a new resignation shows the fixed dates and does not send them", async () => {
    useResignationStore().activeResignation = null;
    const wrapper = mount(ResignationCreatePage, {
      global: {
        stubs: {
          PageHeader: true,
          ResignationTracker: true,
          BilingualText: { props: ["fallback"], template: "<span>{{ fallback }}</span>" },
        },
        mocks: { $t: (key, fallback) => fallback ?? key },
      },
    });

    expect(wrapper.findAllComponents({ name: "IonDatetime" })).toHaveLength(0);
    expect(wrapper.text()).toContain("the relieving date is 90 days later");

    await wrapper.vm.submitData();

    const sent = resignation.createResignation.mock.calls[0][0];
    expect(sent).not.toHaveProperty("resignation_initiation_date");
    expect(sent).not.toHaveProperty("relieving_date");
  });
});
