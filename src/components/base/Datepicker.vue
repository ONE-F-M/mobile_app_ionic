<script setup>
import { computed } from "vue";
import { IonButton, IonModal, IonRow } from "@ionic/vue";
import useDateHelper from "@/composable/useDateHelper";

const { formatDate } = useDateHelper();

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true,
  },
  modelValue: {
    type: Object,
    default: () => {},
  },
  lang: {
    type: String,
    required: true,
  },
});
const emit = defineEmits(["update:model-value", "cancel", "ok"]);

const range = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    emit("update:model-value", value);
  },
});
</script>

<template>
  <ion-modal class="datepicker-modal" :is-open="isOpen">
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
              {{
                formatDate(range.start) === formatDate(range.end)
                  ? formatDate(range.start, "ddd, MMM D")
                  : `${formatDate(range.start, "MMM D")} -
                  ${range.end && formatDate(range.end, "MMM D") || ''}`
              }}
            </h3>
            <!--                <ion-button class="ckeckin-datepicker-edit-button" fill="clear">-->
            <!--                  <IconEdit />-->
            <!--                </ion-button>-->
          </ion-row>
        </div>
        <v-date-picker
          v-model.range="range"
          class="datepicker-range"
          :locale="lang"
          mode="date"
          expanded
          title-position="left"
        />
        <ion-row class="ion-justify-content-end datepicker-card-footer-wrapper">
          <ion-button fill="clear" @click="emit('cancel')">
            {{ $t("utils.cancel") }}
          </ion-button>
          <ion-button
            fill="clear"
            :disabled="!range.start || !range.end"
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
@import "../../theme/datepicker.scss";
</style>
