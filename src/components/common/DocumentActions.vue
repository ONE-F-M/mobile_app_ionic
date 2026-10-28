<template>
  <div class="document-actions">
    <ion-button
      v-for="task in actions"
      :key="`${task.task_id}:${task.action}`"
      expand="block"
      shape="round"
      class="document-actions-button"
      :disabled="loading"
      @click="onTap(task)"
    >
      {{ actionLabel(task.action) }}
    </ion-button>
    <p
      v-if="pendingWith"
      class="document-actions-pending"
    >
      {{ t("processa.pending_with", { names: pendingWith }) }}
    </p>
  </div>
</template>

<script setup>
import { computed, watch } from "vue";
import { IonButton } from "@ionic/vue";
import { useI18n } from "vue-i18n";
import { useConfirmAlert } from "@/composable/useConfirmAlert.ts";
import { useCustomToast } from "@/composable/toast.js";
import { getFrappeErrorMessage } from "@/utils/frappeError";

const props = defineProps({
  docActions: {
    type: Object,
    required: true,
  },
  values: {
    type: Object,
    default: () => ({}),
  },
  attachments: {
    type: Object,
    default: () => ({}),
  },
  beforeApply: {
    type: Function,
    default: () => true,
  },
});
const emit = defineEmits(["applied"]);

const { t, te } = useI18n();
const { showConfirm, showAcknowledge } = useConfirmAlert();
const { showErrorToast } = useCustomToast();

const actions = computed(() => props.docActions.actions.value);
const loading = computed(() => props.docActions.loading.value);
const pendingWith = computed(() => (actions.value.length ? "" : props.docActions.pendingWith.value.join(", ")));

// Map labels show as they are unless the current language has a translation for them
const actionLabel = (action) => {
  if (!action) return t("processa.complete");
  const key = `processa.actions.${action.toLowerCase().replace(/\W+/g, "_")}`;
  return te(key) ? t(key) : action;
};

const showError = (error) => showErrorToast(null, getFrappeErrorMessage(error) || error?.message);

const isConfirmed = async (task) => {
  if (!task.confirm) return true;
  return showConfirm(
    t("processa.confirm_title"),
    t("processa.confirm_message", { action: actionLabel(task.action) }),
    t("utils.confirm"),
    t("utils.cancel"),
  );
};

const onTap = async (task) => {
  try {
    if (!(await props.beforeApply())) return;
    if (!(await isConfirmed(task))) return;
    const { messages, process_status } = await props.docActions.apply(task, {
      values: props.values,
      attachments: props.attachments,
    });
    if (messages.length) {
      await showAcknowledge(t("processa.messages_title"), messages.join(" "), t("utils.ok"));
    }
    if (process_status === "Errored") {
      await showAcknowledge(t("utils.toast.error"), t("processa.process_error"), t("utils.ok"));
    }
    emit("applied");
  } catch (error) {
    showError(error);
    await props.docActions.load();
  }
};

watch(
  () => props.docActions.error.value,
  (error) => {
    if (error) showError(error);
  },
);
</script>

<style lang="scss" scoped>
.document-actions {
  padding-inline: 16px;
  margin-block-start: 16px;

  &-button {
    margin-block-end: 12px;
  }

  &-pending {
    text-align: center;
    color: var(--ion-color-medium);
  }
}
</style>
