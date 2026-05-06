<template>
  <ion-page>
    <ion-content class="ion-padding leaves-page">
      <PageHeader
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
          <ion-button expand="block" shape="round" color="warning" @click="router.push('/resignation/correct')" class="action-btn" style="margin-inline: 16px;">
            {{ $t('resignation.action.correct', 'Submit Date Correction') }}
          </ion-button>
        </div>

        <div class="tracker-actions" v-if="resignationStore.activeResignation.workflow_state === 'Approved'">
          <ion-button expand="block" shape="round" color="warning" @click="goToExtension" class="action-btn">
            {{ $t('resignation.action.extend', 'Extend / Reduce Resignation') }}
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
                :min="minDate"
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
            :ref="(el) => createFile.fileInput.value = el"
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
          :disabled="isLoading || supervisorLoading"
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
import { useConfirmAlert } from "@/composable/useConfirmAlert.ts";
import { calendarOutline, attachOutline } from "ionicons/icons";
import PageHeader from "@/components/common/PageHeader.vue";
import ResignationTracker from "@/components/resignation/ResignationTracker.vue";
import { ref, reactive, computed } from "vue";
import { useCustomToast } from "@/composable/toast.js";
import resignation from "@/api/resignation";
import { useUserStore } from "@/store/user.js";
import { useResignationStore } from "@/store/resignation.ts";
import { useFileAttachment } from "@/composable/useFileAttachment.ts";
import { useNoticePeriod } from "@/composable/useNoticePeriod.ts";
import useDateHelper from "@/composable/useDateHelper.ts";
import { useI18n } from "vue-i18n";

const userStore = useUserStore();
const resignationStore = useResignationStore();
const { t } = useI18n();
const { showAcknowledge } = useConfirmAlert();
const { showErrorToast } = useCustomToast();
const { checkNoticePeriod } = useNoticePeriod();
const { dayjs } = useDateHelper();
const router = useIonRouter();

const isLoading = ref(false);
const supervisorLoading = ref(false);

const triggerBack = () => {
  router.canGoBack() ? router.back() : router.push("/resignation");
};

const goToWithdrawal = () => {
  router.push("/resignation/withdraw");
};

const goToExtension = () => {
  router.push("/resignation/extend");
};

const createFile = useFileAttachment();


const closeCalendarPopover = async () => {
  const topPopover = await popoverController.getTop();
  if (topPopover) {
    topPopover.dismiss();
  }
};

const minDate = new Date().toISOString().split('T')[0];
const resignationInitiationDate = ref(new Date().toISOString().split('T')[0]);
const relievingDate = ref(new Date().toISOString().split('T')[0]);



const formattedInitiationDate = computed(() => { if (!resignationInitiationDate.value) return ""; return dayjs(resignationInitiationDate.value.split("T")[0], "YYYY-MM-DD").format("DD-MM-YYYY"); });

const formattedRelievingDate = computed(() => { if (!relievingDate.value) return ""; return dayjs(relievingDate.value.split("T")[0], "YYYY-MM-DD").format("DD-MM-YYYY"); });

const errors = reactive({
  proofDocument: false,
  supervisor: false,
  resignationInitiationDate: false,
  relievingDate: false,
});
const selectedSupervisor = ref("");
const supervisorSearch = ref("");

const fetchSupervisor = async (empId) => {
  supervisorLoading.value = true;
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
  } finally {
    supervisorLoading.value = false;
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
      attachment: {
        attachment_name: createFile.attachment.value.name,
        attachment: createFile.attachment.value.base64,
      },
    };
    await resignation.createResignation(data);
    
    await showAcknowledge(
      t('resignation.submit_success_title', 'Resignation Submitted'),
      t('resignation.submit_success_msg', 'Employee resignation submitted successfully. Please submit the signed resignation letter to the Camp Boss.'),
      t('resignation.acknowledge', 'Acknowledge')
    );
    clearForm();
    triggerBack();
    
  } catch (error) {
    console.error(error);
    showErrorToast(error?.data?.message, error?.data?.error, error?.data?.status_code);
  } finally {
    isLoading.value = false;
  }
};


const onSubmit = async () => {
  const isValidForm = validateForm();
  if (!isValidForm) return;

  const initStr = resignationInitiationDate.value.split('T')[0];
  const relStr = relievingDate.value.split('T')[0];

  const isPeriodValid = await checkNoticePeriod(initStr, relStr);
  if (!isPeriodValid) return;

  await submitData();
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
