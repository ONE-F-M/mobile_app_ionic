import { nextTick, ref } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getDocumentActions, applyDocumentAction } = vi.hoisted(() => ({
  getDocumentActions: vi.fn(),
  applyDocumentAction: vi.fn(),
}));
vi.mock("@/api/processa", () => ({ default: { getDocumentActions, applyDocumentAction } }));

import { useDocumentActions } from "@/composable/useDocumentActions";

const SUBMIT = { instance_name: "I1", task_id: "T1", task_name: "Submit for Review", action: "Submit for Review", confirm: false };
const DRAFT = { workflow_state: "Draft", actions: [SUBMIT], pending_with: [], editable_fields: ["relieving_date"] };
const PENDING = { workflow_state: "Pending Supervisor", actions: [], pending_with: ["Jane Doe"], editable_fields: [] };
const flush = () => new Promise((resolve) => setTimeout(resolve));

describe("useDocumentActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getDocumentActions.mockResolvedValue({ data: { message: DRAFT } });
  });

  it("loads the actions of the document when created", async () => {
    const docActions = useDocumentActions("Employee Resignation", () => "HR-RSGN-1");
    await flush();

    expect(getDocumentActions).toHaveBeenCalledWith("Employee Resignation", "HR-RSGN-1");
    expect(docActions.actions.value).toEqual([SUBMIT]);
    expect(docActions.editableFields.value).toEqual(["relieving_date"]);
    expect(docActions.workflowState.value).toBe("Draft");
    expect(docActions.loading.value).toBe(false);
  });

  it("loads again when the document changes", async () => {
    const docname = ref("HR-RSGN-1");
    useDocumentActions("Employee Resignation", () => docname.value);
    await flush();

    docname.value = "HR-RSGN-2";
    await nextTick();
    await flush();

    expect(getDocumentActions).toHaveBeenLastCalledWith("Employee Resignation", "HR-RSGN-2");
  });

  it("keeps a load error for the component to show", async () => {
    const failure = { status: 403, data: {} };
    getDocumentActions.mockRejectedValue(failure);
    const docActions = useDocumentActions("Employee Resignation", () => "HR-RSGN-1");
    await flush();

    expect(docActions.error.value).toEqual(failure);
    expect(docActions.loading.value).toBe(false);
  });

  it("applies an action on the current document and takes the new state from the response", async () => {
    applyDocumentAction.mockResolvedValue({
      data: { message: { ...PENDING, process_status: "Active", messages: ["<b>Sent</b> for review", null] } },
    });
    const docActions = useDocumentActions("Employee Resignation", () => "HR-RSGN-1");
    await flush();

    const result = await docActions.apply(SUBMIT, { values: { relieving_date: "2026-11-30" } });

    expect(applyDocumentAction).toHaveBeenCalledWith({
      doctype: "Employee Resignation",
      docname: "HR-RSGN-1",
      task_id: "T1",
      action: "Submit for Review",
      values: { relieving_date: "2026-11-30" },
      attachments: {},
    });
    expect(result).toEqual({ messages: ["Sent for review"], process_status: "Active" });
    expect(docActions.actions.value).toEqual([]);
    expect(docActions.pendingWith.value).toEqual(["Jane Doe"]);
  });

  it("passes an apply error to the caller and clears loading", async () => {
    const failure = { status: 403, data: {} };
    applyDocumentAction.mockRejectedValue(failure);
    const docActions = useDocumentActions("Employee Resignation", () => "HR-RSGN-1");
    await flush();

    await expect(docActions.apply(SUBMIT)).rejects.toBe(failure);
    expect(docActions.loading.value).toBe(false);
  });
});
