<template>
  <div class="record-form">
    <ion-row class="form-row">
      <ion-col size="12">
        <BilingualText
          tag="p"
          class="record-form-label"
          tKey="resignation.resignation_initiation_date"
          fallback="Resignation Initiation Date"
        />
        <div
          id="record-initiation-date"
          class="date-selector"
        >
          <ion-input
            fill="outline"
            readonly
            :value="formatDate(initiationDate)"
            class="readonly-input"
          >
            <ion-icon
              slot="start"
              :icon="calendarOutline"
            ></ion-icon>
          </ion-input>
        </div>
        <ion-popover
          v-if="canEdit('resignation_initiation_date')"
          trigger="record-initiation-date"
          :keep-contents-mounted="true"
          class="custom-calendar-popover"
        >
          <ion-datetime
            v-model="initiationDate"
            presentation="date"
            class="brighter-calendar"
            color="primary"
            @ionChange="closeCalendarPopover"
          ></ion-datetime>
        </ion-popover>
      </ion-col>
    </ion-row>

    <ion-row class="form-row">
      <ion-col size="12">
        <BilingualText
          tag="p"
          class="record-form-label"
          tKey="resignation.requested_relieving_date"
          fallback="Requested Relieving Date"
        />
        <div
          id="record-relieving-date"
          class="date-selector"
        >
          <ion-input
            fill="outline"
            readonly
            :value="formatDate(relievingDate)"
            class="readonly-input"
          >
            <ion-icon
              slot="start"
              :icon="calendarOutline"
            ></ion-icon>
          </ion-input>
        </div>
        <ion-popover
          v-if="canEdit('relieving_date')"
          trigger="record-relieving-date"
          :keep-contents-mounted="true"
          class="custom-calendar-popover"
        >
          <ion-datetime
            v-model="relievingDate"
            presentation="date"
            :min="minDate"
            class="brighter-calendar"
            color="primary"
            @ionChange="closeCalendarPopover"
          ></ion-datetime>
        </ion-popover>
      </ion-col>
    </ion-row>

    <div
      v-if="canEdit('resignation_letter')"
      class="form-row"
    >
      <BilingualText
        tag="p"
        class="record-form-label"
        tKey="resignation.new_signed_letter"
        fallback="New Signed Letter (Photo)"
      />
      <img
        v-if="letterFile.attachment.value.base64"
        :src="letterFile.attachment.value.base64"
        class="proof-photo-preview"
        alt=""
      />
      <ion-button
        fill="outline"
        color="primary"
        class="upload-btn"
        @click="letterFile.takePhoto"
      >
        <ion-icon
          slot="start"
          :icon="attachOutline"
        ></ion-icon>
        <BilingualText
          tag="span"
          tKey="resignation.attach_document"
          fallback="Take Photo"
        />
      </ion-button>
    </div>

    <DocumentActions
      :doc-actions="docActions"
      :values="changedDates"
      :attachments="letterAttachment"
      :before-apply="checkDates"
      @applied="emit('applied')"
    />
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import {
  IonRow,
  IonCol,
  IonInput,
  IonIcon,
  IonPopover,
  IonDatetime,
  IonButton,
  popoverController,
} from "@ionic/vue";
import { calendarOutline, attachOutline } from "ionicons/icons";
import BilingualText from "@/components/base/BilingualText.vue";
import DocumentActions from "@/components/common/DocumentActions.vue";
import { useDocumentActions } from "@/composable/useDocumentActions.ts";
import { useFileAttachment } from "@/composable/useFileAttachment.ts";
import { useNoticePeriod } from "@/composable/useNoticePeriod.ts";
import useDateHelper from "@/composable/useDateHelper.ts";

const props = defineProps({
  resignation: {
    type: Object,
    required: true,
  },
});
const emit = defineEmits(["applied"]);

const docActions = useDocumentActions("Employee Resignation", () => props.resignation.name);
const letterFile = useFileAttachment();
const { checkNoticePeriod } = useNoticePeriod();
const { dayjs } = useDateHelper();

const minDate = new Date().toISOString().split("T")[0];
const initiationDate = ref("");
const relievingDate = ref("");

const dateOnly = (value) => (value ? value.split("T")[0] : "");
const formatDate = (value) => (value ? dayjs(dateOnly(value), "YYYY-MM-DD").format("DD-MM-YYYY") : "");
const canEdit = (fieldname) => docActions.editableFields.value.includes(fieldname);

watch(
  () => props.resignation,
  (record) => {
    initiationDate.value = record.resignation_initiation_date || "";
    relievingDate.value = record.relieving_date || "";
    letterFile.clearAttachment();
  },
  { immediate: true },
);

const changedDates = computed(() => {
  const values = {};
  const initiation = dateOnly(initiationDate.value);
  const relieving = dateOnly(relievingDate.value);
  if (canEdit("resignation_initiation_date") && initiation !== props.resignation.resignation_initiation_date) {
    values.resignation_initiation_date = initiation;
  }
  if (canEdit("relieving_date") && relieving !== props.resignation.relieving_date) {
    values.relieving_date = relieving;
  }
  return values;
});

const letterAttachment = computed(() => {
  const { name, base64 } = letterFile.attachment.value;
  if (!canEdit("resignation_letter") || !base64) return {};
  return { resignation_letter: { attachment_name: name, attachment: base64 } };
});

const checkDates = async () => {
  if (!Object.keys(changedDates.value).length) return true;
  return checkNoticePeriod(dateOnly(initiationDate.value), dateOnly(relievingDate.value));
};

const closeCalendarPopover = async () => {
  const topPopover = await popoverController.getTop();
  if (topPopover) {
    topPopover.dismiss();
  }
};
</script>

<style lang="scss" scoped>
.record-form-label {
  color: var(--ion-color-step-600, #c0c7cd);
  font-size: 0.875rem;
  line-height: 1.25rem;
  margin-block: 0 8px;
}

.form-row {
  margin-block-start: 16px;
  position: relative;
  padding-inline: 16px;
}

.date-selector {
  cursor: pointer;
  width: 100%;
}

.readonly-input {
  pointer-events: none;
  opacity: 0.7;
}

.proof-photo-preview {
  display: block;
  width: 100%;
  max-height: 220px;
  object-fit: cover;
  border-radius: 12px;
  margin-block-start: 8px;
}

.upload-btn {
  text-transform: none;
  --border-radius: 8px;
}

ion-popover.custom-calendar-popover {
  --background: #2a2d32;
  --box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  --border-radius: 12px;
  --width: min(340px, 92vw);
}

ion-datetime.brighter-calendar {
  --background: #2a2d32;
  --background-rgb: 42, 45, 50;
  --title-color: #ffffff;
  --color: #ffffff;
  --wheel-fade-background-rgb: 42, 45, 50;
  --wheel-highlight-background: rgba(255, 255, 255, 0.08);
  border-radius: 12px;
}
</style>
