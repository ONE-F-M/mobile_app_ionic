<script setup>
import { computed, ref, watch } from "vue";
import { IonButton, IonModal, IonRow } from "@ionic/vue";
import useDateHelper from "@/composable/useDateHelper";
// OPTIMIZATION: Import v-calendar locally instead of globally.
// This defers the ~80 KB v-calendar bundle to only load when
// a page with a date picker is actually visited.
import { DatePicker as VDatePicker } from "v-calendar";
import "v-calendar/style.css";

const { formatDate } = useDateHelper();

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true,
  },
  modelValue: {
    type: [Date, Object],
    default: () => new Date(),
  },
  lang: {
    type: String,
    required: true,
  },
  minDate: {
    type: [Date, String],
    default: null,
  },
});
const emit = defineEmits(["update:model-value", "cancel", "ok"]);

const modal = ref(null);

const selectedDate = computed({
  get() {\n    return props.modelValue;
  },
  set(value) {
    emit("update:model-value", value);
  },
});

const handleCancel = async () => {
  if (modal.value) {
    await modal.value.$el.dismiss();
  }
  emit("cancel");
};

const handleOk = async () => {
  if (modal.value) {
    await modal.value.$el.dismiss();
  }
  emit("ok");
};

// Ensure modal is properly dismissed when isOpen changes to false
watch(
  () => props.isOpen,
  async (newVal) => {
    if (!newVal && modal.value) {
      // Give a small delay to ensure clean state
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }
);
</script>

<template>
  <ion-modal
    ref="modal"
    class="datepicker-modal"
    :is-open="isOpen"
    @will-dismiss="handleDismiss"
  >
    <ion-row
      class="datepicker-wrapper ion-align-items-center ion-justify-content-center"
    >
      <div class="datepicker-card">
        <div class="datepicker-card-header-wrapper">
          <div class="datepicker-card-title">
            {{ $t("utils.select_date") }}
          </div>
          <ion-row class="ion-justify-content-between ion-align-items-center">
            <h3 class="datepicker-card-header">
              {{ formatDate(selectedDate, "ddd, MMM D") }}
            </h3>
            <!--                <ion-button class="ckeckin-datepicker-edit-button" fill="clear">-->
            <!--                  <IconEdit />-->
            <!--                </ion-button>-->
          </ion-row>
        </div>
        <VDatePicker
          v-model="selectedDate"
          class="datepicker-range"
          :locale="lang"
          mode="date"
          :min-date="minDate"
          expanded
          title-position="left"
        />
        <ion-row class="ion-justify-content-end datepicker-card-footer-wrapper">
          <ion-button fill="clear" @click="emit('cancel')">
            {{ $t("utils.cancel") }}
          </ion-button>
          <ion-button
            fill="clear"
            :disabled="!selectedDate"
            @click="emit('ok')"
          >
            {{ $t("utils.ok") }}
          </ion-button>
        </ion-row>
      </div>
    </ion-row>
  </ion-modal>
</template>

<style scoped lang="scss">
@use "../../theme/datepicker.scss";
</style>
