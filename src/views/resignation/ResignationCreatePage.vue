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
      <div v-else-if="displayResignation">
        <ResignationTracker
          :resignation="displayResignation"
          :description="isTerminalView ? '' : $t('resignation.active_description', 'You currently have an active resignation. You cannot submit another one until this workflow completes.')"
          :showInitiated="true"
        />

        <template v-if="!isTerminalView">
          <!-- Correction Flow Container -->
          <div v-if="displayResignation.workflow_state === 'Pending Relieving Date Correction'" class="correction-container">
            <ion-button expand="block" shape="round" color="warning" @click="router.push('/resignation/correct')" class="action-btn" style="margin-inline: 16px;">
              <BilingualText tag="span" tKey="resignation.action.correct" fallback="Submit Date Correction" />
            </ion-button>
          </div>

          <!-- Pending Action Banners -->
          <div v-if="hasPendingWithdrawal" class="ion-padding" style="text-align: center; color: var(--ion-color-danger); font-weight: 500;">
            <BilingualText tKey="resignation.pending_withdrawal_msg" fallback="Your resignation withdrawal is currently under review." />
          </div>
          <div v-else-if="hasPendingExtension" class="ion-padding" style="text-align: center; color: var(--ion-color-warning); font-weight: 500;">
            <BilingualText tKey="resignation.pending_extension_msg" fallback="Your resignation date adjustment is currently under review." />
          </div>

          <div class="tracker-actions" v-else-if="displayResignation.workflow_state === 'Approved'">
            <ion-button expand="block" shape="round" color="warning" @click="goToExtension" class="action-btn">
              <BilingualText tag="span" tKey="resignation.action.extend" fallback="Extend / Reduce Resignation" />
            </ion-button>

            <ion-button expand="block" shape="round" color="danger" @click="goToWithdrawal" class="action-btn-danger">
              <BilingualText tag="span" tKey="resignation.action.withdraw" fallback="Withdraw Resignation" />
            </ion-button>
          </div>
        </template>
      </div>

      <div v-else-if="viewedId" class="ion-padding ion-text-center loading-container">
        <BilingualText tKey="resignation.not_found" fallback="Resignation record not found." />
      </div>

      <div class="leaves-create" v-else>
        <ion-row class="form-row">
          <ion-col size="12">
            <BilingualText tag="p" class="leaves-create-label" tKey="resignation.employee_id" fallback="Employee ID" />
            <ion-input
              fill="outline"
              readonly
              :value="userStore.user?.employee_id"
            />
          </ion-col>
        </ion-row>

        <ion-row class="form-row">
          <ion-col size="12">
            <BilingualText
              tag="p"
              class="leaves-create-label leaves-create-label__required"
              :class="{ 'text-danger': errors.supervisor }"
              :tKey="supervisorLabelKey"
              :fallback="supervisorLabelFallback"
            />
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
            <BilingualText
              tag="p"
              class="leaves-create-label leaves-create-label__required"
              :class="{ 'text-danger': errors.resignationInitiationDate }"
              tKey="resignation.resignation_initiation_date"
              fallback="Resignation Initiation Date"
            />
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
            <BilingualText
              tag="p"
              class="leaves-create-label leaves-create-label__required"
              :class="{ 'text-danger': errors.relievingDate }"
              tKey="resignation.requested_relieving_date"
              fallback="Requested Relieving Date"
            />
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
          <BilingualText
            tag="p"
            class="leaves-create-label leaves-create-label__required"
            :class="{ 'text-danger': errors.proofDocument }"
            tKey="resignation.proof_letter"
            fallback="Resignation Letter (Photo)"
          />
          <img
            v-if="createFile.attachment.value.base64"
            :src="createFile.attachment.value.base64"
            class="proof-photo-preview"
            alt=""
          />
          <ion-button
            shape="round"
            class="leaves-create-upload-button"
            expand="block"
            @click="createFile.takePhoto"
          >
            <BilingualText tag="span" tKey="resignation.upload_resignation_letter" fallback="Take Photo of Resignation Letter" />
          </ion-button>
        </div>

        <ion-row class="form-row">
          <ion-col size="12">
            <BilingualText tag="p" class="leaves-create-label" tKey="resignation.reason_for_exit" fallback="Reason for Exit" />
            <ion-input
              :placeholder="$t('resignation.detailed_reason', 'Detailed reason...')"
              fill="outline"
              v-model="reasonForExit"
            ></ion-input>
          </ion-col>
        </ion-row>

        <ion-button
          shape="round"
          class="submit-btn"
          expand="block"
          @click="onSubmit"
          :disabled="isLoading || supervisorLoading"
        >
          <ion-spinner v-if="isLoading" name="crescent"></ion-spinner>
          <BilingualText v-else tag="span" tKey="resignation.submit_resignation" fallback="Submit Resignation" />
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
  popoverController,
  IonPopover,
  IonDatetime,
  IonIcon
} from "@ionic/vue";
import { useConfirmAlert } from "@/composable/useConfirmAlert.ts";
import { calendarOutline, attachOutline } from "ionicons/icons";
import PageHeader from "@/components/common/PageHeader.vue";
import ResignationTracker from "@/components/resignation/ResignationTracker.vue";
import BilingualText from "@/components/base/BilingualText.vue";
import { ref, reactive, computed } from "vue";
import { useCustomToast } from "@/composable/toast.js";
import resignation from "@/api/resignation";
import { useUserStore } from "@/store/user.js";
import { useResignationStore } from "@/store/resignation.ts";
import { useFileAttachment } from "@/composable/useFileAttachment.ts";
import { useNoticePeriod } from "@/composable/useNoticePeriod.ts";
import useDateHelper from "@/composable/useDateHelper.ts";
import { useI18n } from "vue-i18n";
import { useSecondaryLanguage } from "@/composable/useSecondaryLanguage";
import { useRoute } from "vue-router";

const userStore = useUserStore();
const resignationStore = useResignationStore();
const route = useRoute();
const { t } = useI18n();
const { bilingual, bilingualInline } = useSecondaryLanguage();
const { showAcknowledge } = useConfirmAlert();
const { showErrorToast } = useCustomToast();
const { checkNoticePeriod } = useNoticePeriod();
const { dayjs } = useDateHelper();
const router = useIonRouter();

const isLoading = ref(false);
const supervisorLoading = ref(false);

// Set when this page was opened by tapping a specific resignation from the
// list, rather than via the "your active resignation" dashboard entry point.
const viewedId = computed(() => route.params.id || null);
const displayResignation = computed(() =>
  viewedId.value ? resignationStore.viewedResignation : resignationStore.activeResignation
);

// Whether to show it read-only. Tapping a row in the list can land on either
// a genuinely finished resignation OR the employee's own current one (it's
// in that same list) -- only the former should be read-only, so this checks
// the actual state rather than just "was a specific id given".
const RESIGNATION_TERMINAL_STATES = ["Resigned", "Cancelled", "Resignation Withdrawn", "Withdrawn"];
const isTerminalView = computed(() =>
  RESIGNATION_TERMINAL_STATES.includes(displayResignation.value?.workflow_state)
);

// The backend returns the linked Withdrawal/Extension sub-document's own
// state (even once terminal), not a boolean -- derive "is one currently in
// progress" from that here, so the dashboard actually hides Withdraw/Extend
// while one is already pending instead of letting the employee walk all the
// way to a submit screen that the backend then rejects.
const hasPendingWithdrawal = computed(() => {
  const state = displayResignation.value?.withdrawal_state;
  return !!state && !["Approved", "Rejected"].includes(state);
});
const hasPendingExtension = computed(() => {
  const state = displayResignation.value?.extension_state;
  return !!state && state !== "Approved";
});

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
const reasonForExit = ref("");



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
const isLineManager = ref(false);
const supervisorLabelKey = computed(() =>
  isLineManager.value ? 'resignation.line_manager_name' : 'resignation.supervisor_name'
);
const supervisorLabelFallback = computed(() =>
  isLineManager.value ? 'Line Manager Name' : 'Supervisor Name'
);

const fetchSupervisor = async (empId) => {
  supervisorLoading.value = true;
  try {
    if (!empId) return;
    const res = await resignation.getEmployeeSupervisor(empId);
    const superData = res.data?.message || {};
    // Corporate hires have no Operations Manager step -- their "Supervisor"
    // is really their Line Manager (matches the ERP desk's own relabeling).
    isLineManager.value = !superData.shift_working;
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
  reasonForExit.value = "";
  isLineManager.value = false;
};

const submitData = async () => {
  isLoading.value = true;
  try {
    const data = {
      employee_id: userStore.user?.employee_id,
      supervisor: selectedSupervisor.value,
      resignation_initiation_date: resignationInitiationDate.value ? resignationInitiationDate.value.split('T')[0] : "",
      relieving_date: relievingDate.value ? relievingDate.value.split('T')[0] : "",
      reason_for_exit: reasonForExit.value,
      attachment: {
        attachment_name: createFile.attachment.value.name,
        attachment: createFile.attachment.value.base64,
      },
    };
    await resignation.createResignation(data);

    await showAcknowledge(
      bilingual(t('resignation.submit_success_title', 'Resignation Submitted'), 'resignation.submit_success_title'),
      bilingual(t('resignation.submit_success_msg', 'Employee resignation submitted successfully. Please submit the signed resignation letter to the Camp Boss.'), 'resignation.submit_success_msg'),
      bilingualInline(t('resignation.acknowledge', 'Acknowledge'), 'resignation.acknowledge')
    );
    clearForm();
    triggerBack();
    
  } catch (error) {
    console.error(error);
    showErrorToast(error?.data?.message, error?.data?.error || error?.message, error?.data?.status_code);
  } finally {
    isLoading.value = false;
  }
};


const onSubmit = async () => {
  const isValidForm = validateForm();
  if (!isValidForm) return;

  const initStr = resignationInitiationDate.value.split('T')[0];
  const relStr = relievingDate.value.split('T')[0];

  let isPeriodValid;
  try {
    isPeriodValid = await checkNoticePeriod(initStr, relStr);
  } catch (error) {
    console.error("Notice period check failed:", error);
    showErrorToast(null, error?.message);
    return;
  }
  if (!isPeriodValid) return;

  await submitData();
};

onIonViewWillEnter(async () => {
  if (viewedId.value) {
    if (userStore.user?.employee_id && userStore.token) {
      await resignationStore.fetchResignationById(viewedId.value);
    }
    return;
  }

  clearForm();
  if (userStore.user?.employee_id && userStore.token) {
    await resignationStore.fetchActiveResignation();
    await fetchSupervisor(userStore.user.employee_id);
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

.proof-photo-preview {
  display: block;
  width: 100%;
  max-height: 220px;
  object-fit: cover;
  border-radius: 12px;
  margin-block-start: 8px;
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
