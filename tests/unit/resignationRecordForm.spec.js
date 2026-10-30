import { mount } from "@vue/test-utils";
import { ref } from "vue";
import { beforeEach, describe, expect, test, vi } from "vitest";

const { letterPhoto } = vi.hoisted(() => ({ letterPhoto: { value: null } }));
import ResignationRecordForm from "@/components/resignation/ResignationRecordForm.vue";
import { useDocumentActions } from "@/composable/useDocumentActions.ts";
import { useNoticePeriod } from "@/composable/useNoticePeriod.ts";

vi.mock("@ionic/vue", () => {
  const stub = (name) => ({ name, template: "<div><slot /></div>" });
  return {
    IonRow: stub("IonRow"),
    IonCol: stub("IonCol"),
    IonIcon: stub("IonIcon"),
    IonInput: stub("IonInput"),
    IonPopover: { name: "IonPopover", template: "<div class='popover'><slot /></div>" },
    IonDatetime: {
      name: "IonDatetime",
      props: ["modelValue"],
      emits: ["update:modelValue", "ionChange"],
      template: "<input class='datetime' :value='modelValue' @input=\"$emit('update:modelValue', $event.target.value)\" />",
    },
    IonButton: { name: "IonButton", template: "<button @click=\"$emit('click')\"><slot /></button>" },
    popoverController: { getTop: vi.fn() },
  };
});
vi.mock("@/composable/useDocumentActions.ts", () => ({ useDocumentActions: vi.fn() }));
vi.mock("@/composable/useNoticePeriod.ts", () => ({ useNoticePeriod: vi.fn() }));
vi.mock("@/composable/useDateHelper.ts", () => ({
  default: () => ({ dayjs: (value) => ({ format: () => value }) }),
}));
vi.mock("@/composable/useFileAttachment.ts", async () => {
  const { ref: vueRef } = await import("vue");
  return {
    useFileAttachment: () => {
      letterPhoto.value = vueRef({ name: null, base64: null });
      return { attachment: letterPhoto.value, takePhoto: vi.fn(), clearAttachment: vi.fn() };
    },
  };
});
// The real DocumentActions runs, so a tap on the action button goes through beforeApply and apply
vi.mock("vue-i18n", () => ({ useI18n: () => ({ t: (key) => key, te: () => false }) }));
vi.mock("@/composable/useConfirmAlert.ts", () => ({
  useConfirmAlert: () => ({ showConfirm: vi.fn(async () => true), showAcknowledge: vi.fn() }),
}));
vi.mock("@/composable/toast.js", () => ({ useCustomToast: () => ({ showErrorToast: vi.fn() }) }));

const record = {
  name: "HR-RSGN-TEST",
  workflow_state: "Pending Relieving Date Correction",
  resignation_initiation_date: "2026-10-20",
  relieving_date: "2026-11-15",
};
const ALL_FIELDS = ["resignation_initiation_date", "relieving_date", "resignation_letter"];
const RESUBMIT = { instance_name: "I1", task_id: "T1", action: "Resubmit Date", confirm: false };
let checkNoticePeriod;
let docActions;

const mountForm = (editable) => {
  docActions = {
    actions: ref([RESUBMIT]),
    editableFields: ref(editable),
    pendingWith: ref([]),
    workflowState: ref(record.workflow_state),
    loading: ref(false),
    error: ref(null),
    load: vi.fn(),
    apply: vi.fn(async () => ({ messages: [], process_status: "Active" })),
  };
  useDocumentActions.mockReturnValue(docActions);
  return mount(ResignationRecordForm, {
    props: { resignation: record },
    global: { stubs: { BilingualText: true } },
  });
};
const actionsProps = (wrapper) => wrapper.findComponent({ name: "DocumentActions" }).props();
const tapAction = async (wrapper) => {
  await wrapper.find(".document-actions button").trigger("click");
  await new Promise((resolve) => setTimeout(resolve));
};

describe("ResignationRecordForm.vue", () => {
  beforeEach(() => {
    checkNoticePeriod = vi.fn(async () => true);
    useNoticePeriod.mockReturnValue({ checkNoticePeriod });
  });

  test("a changed relieving date is sent with the action when the map step allows it", async () => {
    const wrapper = mountForm(ALL_FIELDS);
    await wrapper.findAll("input.datetime")[1].setValue("2026-11-30");

    expect(actionsProps(wrapper).values).toEqual({ relieving_date: "2026-11-30" });
  });

  test("the dates cannot be changed when the map step does not allow it", () => {
    const wrapper = mountForm([]);

    expect(wrapper.findAll(".popover")).toHaveLength(0);
    expect(actionsProps(wrapper).values).toEqual({});
  });

  test("the notice period is checked only when a date changed", async () => {
    const wrapper = mountForm(ALL_FIELDS);
    await actionsProps(wrapper).beforeApply();
    expect(checkNoticePeriod).not.toHaveBeenCalled();

    await wrapper.findAll("input.datetime")[1].setValue("2026-11-30");
    await actionsProps(wrapper).beforeApply();
    expect(checkNoticePeriod).toHaveBeenCalledWith("2026-10-20", "2026-11-30");
  });

  test("a new letter photo is sent with the action when the map step allows it", async () => {
    const wrapper = mountForm(ALL_FIELDS);
    letterPhoto.value.value = { name: "letter.jpg", base64: "data:image/jpeg;base64,abc" };
    await tapAction(wrapper);

    expect(docActions.apply).toHaveBeenCalledWith(RESUBMIT, {
      values: {},
      attachments: { resignation_letter: { attachment_name: "letter.jpg", attachment: "data:image/jpeg;base64,abc" } },
    });
  });

  test("the action does not run when the employee cancels the notice period alert", async () => {
    checkNoticePeriod.mockResolvedValue(false);
    const wrapper = mountForm(ALL_FIELDS);
    await wrapper.findAll("input.datetime")[1].setValue("2026-11-30");
    await tapAction(wrapper);

    expect(checkNoticePeriod).toHaveBeenCalled();
    expect(docActions.apply).not.toHaveBeenCalled();
  });
});
