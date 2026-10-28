import { mount } from "@vue/test-utils";
import { ref } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { showConfirm, showAcknowledge, showErrorToast } = vi.hoisted(() => ({
  showConfirm: vi.fn(),
  showAcknowledge: vi.fn(),
  showErrorToast: vi.fn(),
}));

vi.mock("@ionic/vue", () => ({
  IonButton: { name: "IonButton", props: ["disabled"], template: "<button :disabled='disabled'><slot /></button>" },
}));
vi.mock("vue-i18n", () => ({
  useI18n: () => ({
    t: (key, params) => (params ? `${key} ${JSON.stringify(params)}` : key),
    te: (key) => key === "processa.actions.submit_for_review",
  }),
}));
vi.mock("@/composable/useConfirmAlert.ts", () => ({ useConfirmAlert: () => ({ showConfirm, showAcknowledge }) }));
vi.mock("@/composable/toast.js", () => ({ useCustomToast: () => ({ showErrorToast }) }));

import DocumentActions from "@/components/common/DocumentActions.vue";

const SUBMIT = { instance_name: "I1", task_id: "T1", task_name: "Submit for Review", action: "Submit for Review", confirm: false };
const RESUBMIT = { instance_name: "I1", task_id: "T2", task_name: "Resubmit Date", action: "Resubmit Date", confirm: true };
const COMPLETE = { instance_name: "I1", task_id: "T3", task_name: "Review", action: "", confirm: true };

const makeDocActions = (actions, overrides = {}) => ({
  actions: ref(actions),
  editableFields: ref([]),
  pendingWith: ref([]),
  workflowState: ref("Draft"),
  loading: ref(false),
  error: ref(null),
  load: vi.fn(),
  apply: vi.fn(async () => ({ messages: [], process_status: "Active" })),
  ...overrides,
});
const mountActions = (docActions, props = {}) => mount(DocumentActions, { props: { docActions, ...props } });
const flush = () => new Promise((resolve) => setTimeout(resolve));

describe("DocumentActions.vue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    showConfirm.mockResolvedValue(true);
  });

  it("shows one button per map action, translated only when the language has the label", () => {
    const wrapper = mountActions(makeDocActions([SUBMIT, RESUBMIT, COMPLETE]));

    expect(wrapper.findAll("button").map((button) => button.text())).toEqual([
      "processa.actions.submit_for_review",
      "Resubmit Date",
      "processa.complete",
    ]);
  });

  it("sends the screen's values and attachments with the action, then emits applied", async () => {
    const docActions = makeDocActions([SUBMIT]);
    const values = { relieving_date: "2026-11-30" };
    const attachments = { resignation_letter: { attachment_name: "letter.jpg", attachment: "data:image/jpeg;base64,AAA" } };
    const wrapper = mountActions(docActions, { values, attachments });

    await wrapper.find("button").trigger("click");
    await flush();

    expect(showConfirm).not.toHaveBeenCalled();
    expect(docActions.apply).toHaveBeenCalledWith(SUBMIT, { values, attachments });
    expect(wrapper.emitted("applied")).toHaveLength(1);
  });

  it("sends nothing when beforeApply returns false", async () => {
    const docActions = makeDocActions([SUBMIT]);
    const wrapper = mountActions(docActions, { beforeApply: async () => false });

    await wrapper.find("button").trigger("click");
    await flush();

    expect(docActions.apply).not.toHaveBeenCalled();
  });

  it("asks for confirmation when the map says so and sends nothing on cancel", async () => {
    showConfirm.mockResolvedValue(false);
    const docActions = makeDocActions([RESUBMIT]);
    const wrapper = mountActions(docActions);

    await wrapper.find("button").trigger("click");
    await flush();

    expect(showConfirm).toHaveBeenCalledTimes(1);
    expect(docActions.apply).not.toHaveBeenCalled();
  });

  it("shows the map's messages and a stopped process", async () => {
    const docActions = makeDocActions([SUBMIT], {
      apply: vi.fn(async () => ({ messages: ["Fix the relieving date"], process_status: "Errored" })),
    });
    const wrapper = mountActions(docActions);

    await wrapper.find("button").trigger("click");
    await flush();

    expect(showAcknowledge).toHaveBeenCalledWith("processa.messages_title", "Fix the relieving date", "utils.ok");
    expect(showAcknowledge).toHaveBeenCalledWith("utils.toast.error", "processa.process_error", "utils.ok");
    expect(wrapper.emitted("applied")).toHaveLength(1);
  });

  it("shows the server error, reloads the actions and does not emit applied", async () => {
    const reason = "This action is no longer available. Refresh and try again.";
    const failure = { status: 403, data: { _server_messages: JSON.stringify([JSON.stringify({ message: reason })]) } };
    const docActions = makeDocActions([SUBMIT], {
      apply: vi.fn(async () => {
        throw failure;
      }),
    });
    const wrapper = mountActions(docActions);

    await wrapper.find("button").trigger("click");
    await flush();

    expect(showErrorToast).toHaveBeenCalledWith(null, reason);
    expect(docActions.load).toHaveBeenCalledTimes(1);
    expect(wrapper.emitted("applied")).toBeUndefined();
  });

  it("shows an error when the actions cannot be loaded", async () => {
    const docActions = makeDocActions([]);
    mountActions(docActions);

    docActions.error.value = { message: "Network error" };
    await flush();

    expect(showErrorToast).toHaveBeenCalledWith(null, "Network error");
  });

  it("shows who holds the task when the user has no actions", () => {
    const wrapper = mountActions(makeDocActions([], { pendingWith: ref(["Jane Doe", "HR Manager"]) }));

    expect(wrapper.find("button").exists()).toBe(false);
    expect(wrapper.text()).toContain('processa.pending_with {"names":"Jane Doe, HR Manager"}');
  });

  it("disables the buttons while a request runs", () => {
    const wrapper = mountActions(makeDocActions([SUBMIT], { loading: ref(true) }));

    expect(wrapper.find("button").attributes("disabled")).toBeDefined();
  });
});
