import { beforeEach, describe, expect, it, vi } from "vitest";

const { get, post } = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));
vi.mock("@/api/http.service", () => ({ httpService: { get, post } }));

import processa from "@/api/processa";

describe("processa API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reads the actions of a document", async () => {
    await processa.getDocumentActions("Employee Resignation", "HR-RSGN-1");

    expect(get).toHaveBeenCalledWith("v1.processa.get_document_actions", {
      params: { doctype: "Employee Resignation", docname: "HR-RSGN-1" },
    });
  });

  it("posts an action with its values and attachments as JSON", async () => {
    const payload = {
      doctype: "Employee Resignation",
      docname: "HR-RSGN-1",
      task_id: "T1",
      action: "Resubmit Date",
      values: { relieving_date: "2026-11-30" },
      attachments: { resignation_letter: { attachment_name: "letter.jpg", attachment: "data:image/jpeg;base64,AAA" } },
    };

    await processa.applyDocumentAction(payload);

    expect(post).toHaveBeenCalledWith("v1.processa.apply_document_action", {
      data: payload,
      headers: { "Content-Type": "application/json" },
    });
  });
});
