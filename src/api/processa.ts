import { httpService as http } from "./http.service";

type ApplyParams = {
  doctype: string;
  docname: string;
  task_id: string;
  action: string;
  values?: Record<string, unknown>;
  attachments?: Record<string, { attachment_name: string; attachment: string }>;
};

const getDocumentActions = async (doctype: string, docname: string) =>
  await http.get(`v1.processa.get_document_actions`, {
    params: { doctype, docname },
  });

const applyDocumentAction = async (data: ApplyParams) =>
  await http.post(`v1.processa.apply_document_action`, {
    data,
    headers: { "Content-Type": "application/json" },
  });

export default {
  getDocumentActions,
  applyDocumentAction,
};
