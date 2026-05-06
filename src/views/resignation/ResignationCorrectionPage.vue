<template>
  <ion-page>
    <ion-content class="ion-padding leaves-page">
      <LeavesHeader
        :title="$t('resignation.title_correction', 'Resignation Correction')"
        class="leaves-page-header"
        @click-back="triggerBack"
      />

      <div v-if="isLoading" class="ion-text-center ion-padding loading-container">
        <ion-spinner name="crescent"></ion-spinner>
      </div>

      <div v-else class="correction-container">
        <div class="correction-form">
          <ion-row class="form-row">
            <!-- Corrected Initiation Date -->
            <ion-col size="12">
              <p class="leaves-create-label leaves-create-label__required">{{ $t('resignation.corrected_initiation_date', 'Corrected Initiation Date') }}</p>
              <div id="open-new-initiation-modal" class="date-selector">
                <ion-input fill="outline" readonly :value="formattedNewInitiationDate || $t('resignation.click_to_select', 'Click to select date')" class="readonly-input">
                  <ion-icon slot="start" :icon="calendarOutline"></ion-icon>
                </ion-input>
              </div>
              <ion-popover trigger="open-new-initiation-modal" :keep-contents-mounted="true" class="custom-calendar-popover">
                <ion-datetime presentation="date" v-model="newInitiationDate" class="brighter-calendar" color="primary" @ionChange="closeCalendarPopover"></ion-datetime>
              </ion-popover>
            </ion-col>
            
            <!-- Corrected Relieving Date -->
            <ion-col size="12">
              <p class="leaves-create-label leaves-create-label__required">{{ $t('resignation.corrected_relieving_date', 'Corrected Relieving Date') }}</p>
              <div id="open-new-relieving-modal" class="date-selector">
                <ion-input fill="outline" readonly :value="formattedNewRelievingDate || $t('resignation.click_to_select', 'Click to select date')" class="readonly-input">
                  <ion-icon slot="start" :icon="calendarOutline"></ion-icon>
                </ion-input>
              </div>
              <ion-popover trigger="open-new-relieving-modal" :keep-contents-mounted="true" class="custom-calendar-popover">
                <ion-datetime presentation="date" v-model="newRelievingDate" :min="minDate" class="brighter-calendar" color="primary" @ionChange="closeCalendarPopover"></ion-datetime>
              </ion-popover>
            </ion-col>

            <ion-col size="12">
              <p class="leaves-create-label leaves-create-label__required">{{ $t('resignation.new_signed_letter', 'New Signed Letter (PDF, JPG, PNG)') }}</p>
              <input type="file" :ref="(el) => correctionFile.fileInput.value = el" accept=".pdf,.jpg,.jpeg,.png" @change="correctionFile.onFileUpload" class="hidden-input" />
              
              <div class="upload-container">
                <ion-button fill="outline" color="primary" @click="correctionFile.triggerFileUpload" class="upload-btn">
                  <ion-icon slot="start" :icon="attachOutline"></ion-icon>
                  {{ correctionFile.attachment.value.name ? correctionFile.attachment.value.name : $t('resignation.attach_document', 'Attach Document') }}
                </ion-button>
              </div>
            </ion-col>
          </ion-row>
          
          <ion-button 
            class="submit-correction-btn" 
            expand="block" 
            shape="round"
            @click="submitCorrection" 
          >
            <ion-spinner v-if="isSubmitting" name="crescent"></ion-spinner>
            <span v-else>{{ $t('resignation.resubmit_correction', 'Resubmit Corrected Details') }}</span>
          </ion-button>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import {
  IonContent,
  IonPage,
  IonButton,
  useIonRouter,
  IonInput,
  onIonViewWillEnter,
  IonSpinner,
  IonRow,
  IonCol,
  alertController,
  popoverController,
  IonPopover,
  IonDatetime,
  IonIcon
} from "@ionic/vue";
import { calendarOutline, attachOutline } from "ionicons/icons";
import LeavesHeader from "@/components/leaves/Header.vue";
import { ref, computed } from "vue";
import { useCustomToast } from "@/composable/toast.js";
import resignation from "@/api/resignation";
import { useUserStore } from "@/store/user.js";
import { useResignationStore } from "@/store/resignation.ts";
import { useFileAttachment } from "@/composable/useFileAttachment.ts";
import { useNoticePeriod } from "@/composable/useNoticePeriod.ts";
import { useI18n } from "vue-i18n";

const userStore = useUserStore();
const resignationStore = useResignationStore();
const { t } = useI18n();
const { showErrorToast } = useCustomToast();
const { checkNoticePeriod } = useNoticePeriod();
const router = useIonRouter();

const isLoading = ref(false);
const isSubmitting = ref(false);

const triggerBack = () => {
  router.push("/resignation");
};

const correctionFile = useFileAttachment();

const newRelievingDate = ref("");
const newInitiationDate = ref("");

const closeCalendarPopover = async () => {
  const topPopover = await popoverController.getTop();
  if (topPopover) {
    topPopover.dismiss();
  }
};

const minDate = new Date().toISOString().split('T')[0];

const formattedNewInitiationDate = computed(() => {
  if (!newInitiationDate.value) return "";
  const iso = newInitiationDate.value.split('T')[0];
  if (!iso || !iso.includes('-')) return iso;
  const [year, month, day] = iso.split('-');
  return `${day}/${month}/${year}`;
});

const formattedNewRelievingDate = computed(() => {
  if (!newRelievingDate.value) return "";
  const iso = newRelievingDate.value.split('T')[0];
  if (!iso || !iso.includes('-')) return iso;
  const [year, month, day] = iso.split('-');
  return `${day}/${month}/${year}`;
});

const clearForm = () => {
  correctionFile.clearAttachment();
  const baseIso = new Date().toISOString().split('T')[0];
  newInitiationDate.value = baseIso;
  newRelievingDate.value = baseIso;
};

const normalizeDateOnly = (value) => value ? value.split('T')[0] : "";

const executeCorrection = async () => {
  const payload = {
    employee_id: userStore.user.employee_id,
    new_date: normalizeDateOnly(newRelievingDate.value),
    new_initiation_date: normalizeDateOnly(newInitiationDate.value),
    attachment: {
      attachment_name: correctionFile.attachment.value.name,
      attachment: correctionFile.attachment.value.base64,
    },
    resignation_id: resignationStore.activeResignation?.name
  };

  try {
    isSubmitting.value = true;
    await resignation.correctResignationDate(payload);
    
    const alert = await alertController.create({
      header: t('resignation.correction_success_title', 'Correction Submitted'),
      message: t('resignation.correction_success_msg', 'Employee resignation corrected successfully. Please submit the updated signed resignation letter to the Camp Boss.'),
      cssClass: 'bright-md3-alert',
      backdropDismiss: false,
      buttons: [
        {
          text: t('resignation.acknowledge', 'Acknowledge'),
          handler: () => {
            clearForm();
            triggerBack();
          }
        }
      ]
    });
    await alert.present();
    
    await resignationStore.fetchActiveResignation();
  } catch (error) {
    showErrorToast(error?.data?.message, error?.data?.error, error?.data?.status_code);
  } finally {
    isSubmitting.value = false;
  }
};

const submitCorrection = async () => {
  if (!newRelievingDate.value || !newInitiationDate.value || !correctionFile.attachment.value.base64) {
    showErrorToast(t("resignation.validation_error", "Validation Error"), t("resignation.validation_missing", "Please select dates and attach your corrected signed letter."));
    return;
  }

  const initStr = newInitiationDate.value.split('T')[0];
  const relStr = newRelievingDate.value.split('T')[0];

  const isPeriodValid = await checkNoticePeriod(initStr, relStr);
  if (!isPeriodValid) return;

  await executeCorrection();
};

onIonViewWillEnter(async () => {
  clearForm();
  isLoading.value = true;
  if (userStore.user?.employee_id && userStore.token) {
    await resignationStore.fetchActiveResignation();
    if (resignationStore.activeResignation) {
      newInitiationDate.value = resignationStore.activeResignation.resignation_initiation_date || "";
      newRelievingDate.value = resignationStore.activeResignation.relieving_date || "";
    }
  }
  isLoading.value = false;
});
</script>

<style lang="scss" scoped>
.leaves-page {
  --padding-top: 0;
  --padding-bottom: 24px;
  --padding-start: 0;
  --padding-end: 0;

  &-header {
    position: sticky;
    top: 0;
    padding-inline: 15px;
    z-index: 5;
    background: #191c1d;
  }
}

.leaves-create-label {
  color: var(--ion-color-step-600, #c0c7cd);
  font-size: 0.875rem;
  line-height: 1.25rem;
  margin-block: 0 8px;

  &__required {
    &:after {
      content: " *";
      color: #ffb4a9;
    }
  }
}

.loading-container {
  margin-block-start: 50px;
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

.hidden-input {
  display: none;
}

.upload-container {
  display: flex;
  justify-content: flex-start;
  margin-block-start: 5px;
}

.upload-btn {
  text-transform: none;
  --border-radius: 8px;
}

.correction-container {
  margin-block-start: 16px;
}

.correction-form {
  margin-block-end: 25px;
}

.submit-correction-btn {
  --background: var(--ion-color-success);
  margin-block-start: 16px;
  margin-block-end: 15px;
  margin-inline: 16px;
}

ion-popover.custom-calendar-popover {
  --background: #2a2d32;
  --box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  --border-radius: 12px;
}

ion-datetime.brighter-calendar {
  --background: #2a2d32;
  --title-color: #ffffff;
  --color: #ffffff;
  border-radius: 12px;
}
</style>
