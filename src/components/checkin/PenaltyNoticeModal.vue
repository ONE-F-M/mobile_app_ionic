<script setup>
import { IonButton, IonModal, IonRow, IonSpinner } from "@ionic/vue";
import dayjs from "dayjs";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import checkin from "@/api/checkin";
import { useCustomToast } from "@/composable/toast.js";

// Blocking notice of penalties issued against the employee. It closes only once the
// server has acknowledged every row shown; there is no other way out of it.
const props = defineProps({
  penalties: {
    type: Array,
    default: () => [],
  },
});
const emit = defineEmits(["acknowledged"]);

const { t } = useI18n();
const { showErrorToast } = useCustomToast();
const isDismissing = ref(false);

const isOpen = computed(() => props.penalties.length > 0);
const canDismiss = async () => !isOpen.value;

const formatOccurrence = (value) =>
  value ? dayjs(value).format("DD MMM YYYY, HH:mm") : "";

const dismiss = async () => {
  if (isDismissing.value) return;
  isDismissing.value = true;
  try {
    await checkin.acknowledgePenalties(props.penalties.map((row) => row.name));
    emit("acknowledged");
  } catch {
    showErrorToast(
      t("user.checkin.penalty_notice.dismiss_failed"),
      t("user.checkin.penalty_notice.try_again"),
    );
  } finally {
    isDismissing.value = false;
  }
};
</script>

<template>
  <ion-modal :is-open="isOpen" :backdrop-dismiss="false" :can-dismiss="canDismiss">
    <ion-row class="penalty-notice ion-align-items-center ion-justify-content-center">
      <div class="penalty-notice-card" role="alertdialog" aria-labelledby="penalty-notice-title">
        <div class="penalty-notice-card-icon-wrapper">
          <MdiIcon name="alert-outline" :size="24" />
        </div>
        <p id="penalty-notice-title" class="penalty-notice-card-title">
          {{ $t("user.checkin.penalty_notice.title") }}
        </p>
        <p class="penalty-notice-card-description">
          {{ $t("user.checkin.penalty_notice.description") }}
        </p>

        <div class="penalty-notice-card-list">
          <dl v-for="penalty in penalties" :key="penalty.name" class="penalty-notice-card-item">
            <dt>{{ $t("user.checkin.penalty_notice.reference") }}</dt>
            <dd>{{ penalty.penalty_issuance }}</dd>
            <dt>{{ $t("user.checkin.penalty_notice.issuer") }}</dt>
            <dd>{{ penalty.issuer_name }}</dd>
            <dt>{{ $t("user.checkin.penalty_notice.category") }}</dt>
            <dd>{{ penalty.penalty_category }}</dd>
            <dt>{{ $t("user.checkin.penalty_notice.occurred_at") }}</dt>
            <dd>{{ formatOccurrence(penalty.penalty_occurence_time) }}</dd>
          </dl>
        </div>

        <ion-row class="ion-justify-content-end">
          <ion-button class="penalty-notice-card-dismiss" fill="clear" :disabled="isDismissing" @click="dismiss">
            <ion-spinner v-if="isDismissing" name="crescent" />
            <span v-else>{{ $t("user.checkin.penalty_notice.dismiss") }}</span>
          </ion-button>
        </ion-row>
      </div>
    </ion-row>
  </ion-modal>
</template>

<style lang="scss" scoped>
ion-modal {
  &::part(content) {
    background: transparent;
  }
}

.penalty-notice {
  height: 100%;
}

.penalty-notice-card {
  margin: 8px 20px;
  padding: 18px 16px 10px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  background: #233036;
  border-radius: 28px;

  &-icon-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 48px;
    width: 48px;
    margin: 0 auto;
    background: #ffb3ac;
    color: #68000a;
    border-radius: 50%;
  }

  &-title {
    text-align: center;
    font-size: 1.5rem;
    line-height: 2rem;
    color: #e0e3e3;
  }

  &-description {
    font-size: 0.925rem;
    line-height: 1.25rem;
    color: #c0c7cd;
  }

  &-list {
    overflow-y: auto;
  }

  &-item {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 4px 12px;
    margin: 0 0 12px;
    padding: 12px;
    border-radius: 12px;
    background: #2d3132;
    font-size: 0.875rem;
    line-height: 1.25rem;

    dt {
      color: #c0c7cd;
    }

    dd {
      margin: 0;
      color: #e0e3e3;
      overflow-wrap: anywhere;
    }
  }

  &-dismiss {
    color: #ffb4a9;
  }
}
</style>
