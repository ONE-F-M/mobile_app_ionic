import { ref, watch } from "vue";
import processa from "@/api/processa";
import { stripHtml } from "@/utils/frappeError";

type ProcessaAction = {
  instance_name: string;
  task_id: string;
  task_name: string;
  action: string;
  confirm: boolean;
};

export function useDocumentActions(doctype: string, docname: () => string) {
  const actions = ref<ProcessaAction[]>([]);
  const editableFields = ref<string[]>([]);
  const pendingWith = ref<string[]>([]);
  const workflowState = ref("");
  const loading = ref(false);
  const error = ref(null);

  const setState = (state) => {
    actions.value = state.actions;
    editableFields.value = state.editable_fields;
    pendingWith.value = state.pending_with;
    workflowState.value = state.workflow_state;
  };

  const load = async () => {
    loading.value = true;
    error.value = null;
    try {
      const res = await processa.getDocumentActions(doctype, docname());
      setState(res.data.message);
    } catch (err) {
      error.value = err;
    } finally {
      loading.value = false;
    }
  };

  const apply = async (task: ProcessaAction, { values = {}, attachments = {} } = {}) => {
    loading.value = true;
    try {
      const res = await processa.applyDocumentAction({
        doctype,
        docname: docname(),
        task_id: task.task_id,
        action: task.action,
        values,
        attachments,
      });
      const result = res.data.message;
      setState(result);
      return {
        messages: result.messages.filter(Boolean).map(stripHtml),
        process_status: result.process_status,
      };
    } finally {
      loading.value = false;
    }
  };

  watch(docname, load, { immediate: true });

  return { actions, editableFields, pendingWith, workflowState, loading, error, load, apply };
}
