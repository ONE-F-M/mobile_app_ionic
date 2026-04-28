<template>
  <ion-page>
    <ion-content class="ion-padding leaves-page">
      <LeavesHeader
        :title="$t('resignation.title', 'Employee Resignation')"
        class="leaves-page-header"
        @click-back="triggerBack"
      />

      <div v-if="resignationStore.loading" class="ion-text-center ion-padding loading-container">
        <ion-spinner name="crescent"></ion-spinner>
      </div>

      <!-- Live Dashboard Tracker Banner -->
      <div v-else-if="resignationStore.activeResignation">
        <ResignationTracker 
          :resignation="resignationStore.activeResignation" 
          :description="$t('resignation.active_description', 'You currently have an active resignation. You cannot submit another one until this workflow completes.')"
          :showInitiated="true"
        />

        <!-- Correction Flow Container -->
        <div v-if="resignationStore.activeResignation.workflow_state === 'Pending Relieving Date Correction'" class="correction-container">
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
                  <ion-datetime presentation="date" v-model="newRelievingDate" class="brighter-calendar" color="primary" @ionChange="closeCalendarPopover"></ion-datetime>
                </ion-popover>
              </ion-col>

              <ion-col size="12">
                <p class="leaves-create-label leaves-create-label__required">{{ $t('resignation.new_signed_letter', 'New Signed Letter (PDF, JPG, PNG)') }}</p>
                <input type="file" ref="correctionFileInput" accept=".pdf,.jpg,.jpeg,.png" @change="correctionFile.onFileUpload" class="hidden-input" />
                
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
              <ion-spinner v-if="isLoading" name="crescent"></ion-spinner>
              <span v-else>{{ $t('resignation.resubmit_correction', 'Resubmit Corrected Details') }}</span>
            </ion-button>
          </div>
        </div>

        <div class="tracker-actions" v-if="resignationStore.activeResignation.workflow_state === 'Approved'">
          <ion-button expand="block" shape="round" @click="goToExtension" class="action-btn">
            {{ $t('resignation.action.extend', 'Extend Resignation') }}
          </ion-button>
          
          <ion-button expand="block" shape="round" color="danger" @click="goToWithdrawal" class="action-btn-danger">
            {{ $t('resignation.action.withdraw', 'Withdraw Resignation') }}
          </ion-button>
        </div>
      </div>

      <div class="leaves-create" v-else>
        <ion-row class="form-row">
          <ion-col size="12">
            <p class="leaves-create-label">{{ $t('resignation.employee_id', 'Employee ID') }}</p>
            <ion-input
              fill="outline"
              readonly
              :value="userStore.user?.employee_id"
            />
          </ion-col>
        </ion-row>

        <ion-row class="form-row">
          <ion-col size="12">
            <p class="leaves-create-label leaves-create-label__required" :class="{ 'text-danger': errors.supervisor }">
              {{ $t('resignation.supervisor_name', 'Supervisor Name') }}
            </p>
            <ion-input
              :placeholder="$t('resignation.fetching_supervisor', 'Fetching assigned supervisor...')"
              fill="outline"
              readonly
              :value="supervisorSearch"
            ></ion-input>
          </ion-col>
        </ion-row>

        <ion-row class="form-row">
          <ion-col size="12">
            <p class="leaves-create-label leaves-create-label__required" :class="{ 'text-danger': errors.resignationInitiationDate }">
              {{ $t('resignation.resignation_initiation_date', 'Resignation Initiation Date') }}
            </p>
            <div id="open-initiation-modal" class="date-selector">
              <ion-input
                fill="outline"
                readonly
                :value="formattedInitiationDate || $t('resignation.click_to_select', 'Click to select date')"
                class="readonly-input"
              >
                <ion-icon slot="start" :icon="calendarOutline"></ion-icon>
              </ion-input>
            </div>

            <ion-popover trigger="open-initiation-modal" :keep-contents-mounted="true" class="custom-calendar-popover">
              <ion-datetime
                presentation="date"
                v-model="resignationInitiationDate"
                class="brighter-calendar"
                color="primary"
                @ionChange="closeCalendarPopover"
              ></ion-datetime>
            </ion-popover>
          </ion-col>
        </ion-row>

        <ion-row class="form-row">
          <ion-col size="12">
            <p class="leaves-create-label leaves-create-label__required" :class="{ 'text-danger': errors.relievingDate }">
              {{ $t('resignation.requested_relieving_date', 'Requested Relieving Date') }}
            </p>
            <div id="open-relieving-modal" class="date-selector">
              <ion-input
                fill="outline"
                readonly
                :value="formattedRelievingDate || $t('resignation.click_to_select', 'Click to select date')"
                class="readonly-input"
              >
                <ion-icon slot="start" :icon="calendarOutline"></ion-icon>
              </ion-input>
            </div>

            <ion-popover trigger="open-relieving-modal" :keep-contents-mounted="true" class="custom-calendar-popover">
              <ion-datetime
                presentation="date"
                v-model="relievingDate"
                class="brighter-calendar"
                color="primary"
                @ionChange="closeCalendarPopover"
              ></ion-datetime>
            </ion-popover>
          </ion-col>
        </ion-row>

        <div class="form-row">
          <p class="leaves-create-label leaves-create-label__required" :class="{ 'text-danger': errors.proofDocument }">
            {{ $t('resignation.proof_letter', 'Resignation Letter (PDF, JPG, PNG)') }}
          </p>
          <span v-if="createFile.attachment.value.name" class="title-medium leaves-create-proof-document-name">
            {{ createFile.attachment.value.name }}
          </span>
          <ion-button
            shape="round"
            class="leaves-create-upload-button"
            expand="block"
            @click="createFile.triggerFileUpload"
          >
            {{ $t('resignation.upload_resignation_letter', 'Upload Resignation Letter') }}
          </ion-button>
          <input
            ref="createFileInput"
            class="hidden-input"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            @change="createFile.onFileUpload"
          />
        </div>

        <ion-button
          shape="round"
          class="submit-btn"
          expand="block"
          @click="onSubmit"
        >
          <ion-spinner v-if="isLoading" name="crescent"></ion-spinner>
          <span v-else>{{ $t('resignation.submit_resignation', 'Submit Resignation') }}</span>
        </ion-button>
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
import ResignationTracker from "@/components/resignation/ResignationTracker.vue";
import { ref, reactive, computed, watch, onMounted } from "vue";
import { useCustomToast } from "@/composable/toast.js";
import resignation from "@/api/resignation";
import { useUserStore } from "@/store/user.js";
import { useResignationStore } from "@/store/resignation.js";
import { useFileAttachment } from "@/composable/useFileAttachment.js";
import { useNoticePeriod } from "@/composable/useNoticePeriod";

const userStore = useUserStore();
const resignationStore = useResignationStore();
const { t } = useI18n();
const { showErrorToast } = useCustomToast();
const { checkNoticePeriod } = useNoticePeriod();
const router = useIonRouter();

const isLoading = ref(false);

const triggerBack = () => {
  router.push("/service");
};

const goToWithdrawal = () => {
  router.push("/resignation/withdraw");
};

const goToExtension = () => {
  router.push("/resignation/extend");
};

const createFile = useFileAttachment();
const correctionFile = useFileAttachment();

const createFileInput = ref();
const correctionFileInput = ref();

onMounted(() => {
  createFile.fileInput.value = createFileInput.value;
  correctionFile.fileInput.value = correctionFileInput.value;
});

const newRelievingDate = ref("");
const newInitiationDate = ref("");

const closeCalendarPopover = async () => {
  const topPopover = await popoverController.getTop();
  if (topPopover) {
    topPopover.dismiss();
  }
};

const resignationInitiationDate = ref(new Date().toISOString().split('T')[0]);
const relievingDate = ref(new Date().toISOString().split('T')[0]);


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

const formattedInitiationDate = computed(() => {
  if (!resignationInitiationDate.value) return "";
  const iso = resignationInitiationDate.value.split('T')[0];
  const [year, month, day] = iso.split('-');
  return `${day}/${month}/${year}`;
});

const formattedRelievingDate = computed(() => {
  if (!relievingDate.value) return "";
  const iso = relievingDate.value.split('T')[0];
  const [year, month, day] = iso.split('-');
  return `${day}/${month}/${year}`;
});

const errors = reactive({
  proofDocument: false,
  supervisor: false,
  resignationInitiationDate: false,
  relievingDate: false,
});
const selectedSupervisor = ref("");
const supervisorSearch = ref("");

const fetchSupervisor = async (empId) => {
  try {
    if (!empId) return;
    const res = await resignation.getEmployeeSupervisor(empId);
    const superData = res.data?.message || {};
    if (superData.user_id) {
      selectedSupervisor.value = superData.user_id;
      supervisorSearch.value = superData.full_name;
    }
  } catch (error) {
    console.error("Failed to load supervisor", error);
  }
};

const validateForm = () => {
  errors.proofDocument = !createFile.attachment.value.base64;
  errors.supervisor = !selectedSupervisor.value;
  errors.resignationInitiationDate = !resignationInitiationDate.value;
  errors.relievingDate = !relievingDate.value;
  return !errors.proofDocument && !errors.supervisor && !errors.resignationInitiationDate && !errors.relievingDate;
};

const clearForm = () => {
  createFile.clearAttachment();
  correctionFile.clearAttachment();
  const baseIso = new Date().toISOString().split('T')[0];
  resignationInitiationDate.value = baseIso;
  relievingDate.value = baseIso;
};

const submitData = async () => {
  isLoading.value = true;
  try {
    const data = {
      employee_id: userStore.user?.employee_id,
      supervisor: selectedSupervisor.value,
      resignation_initiation_date: resignationInitiationDate.value ? resignationInitiationDate.value.split('T')[0] : "",
      relieving_date: relievingDate.value ? relievingDate.value.split('T')[0] : "",
      attachment: JSON.stringify({
        attachment_name: createFile.attachment.value.name,
        attachment: createFile.attachment.value.base64,
      }),
    };
    await resignation.createResignation(data);
    
    const alert = await alertController.create({
      header: t('resignation.submit_success_title', 'Resignation Submitted'),
      message: t('resignation.submit_success_msg', 'Employee resignation submitted successfully. Please submit the signed resignation letter to the Camp Boss.'),
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
    
  } catch (error) {
    console.error(error);
    showErrorToast(error?.data?.message, error?.data?.error, error?.data?.status_code);
  } finally {
    isLoading.value = false;
  }
};

const normalizeDateOnly = (value) => value ? value.split('T')[0] : "";
const executeCorrection = async () => {
  const payload = {
    employee_id: userStore.user.employee_id,
    new_date: normalizeDateOnly(newRelievingDate.value),
    new_initiation_date: normalizeDateOnly(newInitiationDate.value),
    attachment: JSON.stringify({
      attachment_name: correctionFile.attachment.value.name,
      attachment: correctionFile.attachment.value.base64,
    }),
    resignation_id: resignationStore.activeResignation?.name
  };

  try {
    isLoading.value = true;
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
    isLoading.value = false;
  }
};

const submitCorrection = async () => {
  if (!newRelievingDate.value || !newInitiationDate.value || !correctionFile.attachment.value.base64) {
    showErrorToast(t("resignation.validation_error", "Validation Error"), t("resignation.validation_missing", "Please select dates and attach your corrected signed letter."));
    return;
  }

  const initStr = newInitiationDate.value.split('T')[0];
  const relStr = newRelievingDate.value.split('T')[0];
  const initDate = new Date(initStr);
  const relDate = new Date(relStr);
  const diffTime = relDate - initDate;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    showErrorToast(t("resignation.validation_error", "Validation Error"), t("resignation.date_error", "Relieving date cannot be earlier than initiation date."));
    return;
  }

  if (diffDays < 90) {
    const alert = await alertController.create({
      header: t('resignation.notice_shortfall_title', 'Notice Period Shortfall'),
      message: t('resignation.notice_shortfall_msg', 'According to Labour Law, you must serve a 90-day notice period. The shortfall will be adjusted from your leave balance/indemnity, or must be paid out-of-pocket.'),
      cssClass: 'bright-md3-alert',
      buttons: [
        {
          text: t('resignation.edit', 'Edit'),
          role: 'cancel'
        },
        {
          text: t('resignation.proceed', 'Proceed'),
          handler: () => {
            executeCorrection();
          }
        }
      ]
    });
    await alert.present();
  } else {
    executeCorrection();
  }
};

const onSubmit = async () => {
  const isValidForm = validateForm();
  if (!isValidForm) return;

  const initStr = resignationInitiationDate.value.split('T')[0];
  const relStr = relievingDate.value.split('T')[0];
  const initDate = new Date(initStr);
  const relDate = new Date(relStr);
  const diffTime = relDate - initDate;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    showErrorToast(t("resignation.validation_error", "Validation Error"), t("resignation.date_error", "Relieving date cannot be earlier than initiation date."));
    return;
  }

  if (diffDays < 90) {
    const alert = await alertController.create({
      header: t('resignation.notice_shortfall_title', 'Notice Period Shortfall'),
      message: t('resignation.notice_shortfall_msg', 'According to Labour Law, you must serve a 90-day notice period. The shortfall will be adjusted from your leave balance/indemnity, or must be paid out-of-pocket.'),
      cssClass: 'bright-md3-alert',
      buttons: [
        {
          text: t('resignation.edit', 'Edit'),
          role: 'cancel'
        },
        {
          text: t('resignation.proceed', 'Proceed'),
          handler: () => {
            submitData();
          }
        }
      ]
    });
    await alert.present();
  } else {
    submitData();
  }
};

onIonViewWillEnter(async () => {
  clearForm();
  if (userStore.user?.employee_id && userStore.token) {
    await resignationStore.fetchActiveResignation();
    await fetchSupervisor(userStore.user.employee_id);

    if (resignationStore.activeResignation) {
      newInitiationDate.value = resignationStore.activeResignation.resignation_initiation_date || "";
      newRelievingDate.value = resignationStore.activeResignation.relieving_date || "";
    }
  }
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

.leaves-create {
  padding-inline: 16px;

  &-label {
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

  &-upload-button {
    --background: #004c69;
    --color: #c1e8ff;
    margin-block-start: 16px;
  }
}

.loading-container {
  margin-block-start: 50px;
}

.form-row {
  margin-block-start: 16px;
  position: relative;
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
}

.tracker-actions {
  margin-block-start: 16px;
}

.action-btn {
  margin-block-end: 15px;
}

.action-btn-danger {
  // Use color attribute from component instead of inline styles
}

.submit-btn {
  margin-block-start: 16px;
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
