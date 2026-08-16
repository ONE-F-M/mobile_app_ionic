<template>
  <ion-page>
    <ion-content class="ion-padding leaves-page">
      <PageHeader
        :title="$t('resignation.withdrawal.title', 'Resignation Withdrawal')"
        class="leaves-page-header"
        @click-back="triggerBack"
      />

      <div v-if="resignationStore.loading" class="ion-text-center ion-padding loading-container">
        <ion-spinner name="crescent"></ion-spinner>
      </div>

      <template v-else>
        <ResignationTracker 
          :resignation="resignationStore.activeResignation" 
          :description="$t('resignation.withdrawal.tracker_description', 'You are requesting to withdraw the following active resignation:')"
        />

      <div v-if="resignationStore.activeResignation" class="leaves-create" :class="{'with-margin': resignationStore.activeResignation}">
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
              :class="{ 'text-danger': errors.reason }"
              tKey="resignation.withdrawal.reason"
              fallback="Reason for Withdrawal"
            />
            <ion-input
              :placeholder="$t('resignation.detailed_reason', 'Detailed reason...')"
              fill="outline"
              v-model="reason"
            ></ion-input>
          </ion-col>
        </ion-row>

        <ion-row class="form-row">
          <ion-col size="12">
            <BilingualText
              tag="p"
              class="leaves-create-label leaves-create-label__required"
              :class="{ 'text-danger': errors.proofDocument }"
              tKey="resignation.withdrawal.proof"
              fallback="Withdrawal Letter/Proof (Required)"
            />
            <img v-if="attachment.base64" :src="attachment.base64" class="proof-photo-preview" alt="" />

            <div class="upload-container">
              <ion-button fill="outline" color="primary" @click="takePhoto" class="upload-btn">
                <ion-icon slot="start" :icon="attachOutline"></ion-icon>
                <BilingualText tag="span" tKey="resignation.attach_document" fallback="Take Photo" />
              </ion-button>
            </div>
          </ion-col>
        </ion-row>

        <div class="form-row">
            <BilingualText tag="p" class="legal-notice" tKey="resignation.withdrawal.legal_notice" fallback="By clicking submit, you are officially registering an intent to withdraw any active resignation applications on file." />
        </div>

        <ion-button
          shape="round"
          class="submit-btn"
          expand="block"
          @click="onSubmit"
          :disabled="isLoading || supervisorLoading"
        >
          <ion-spinner v-if="isLoading" name="crescent"></ion-spinner>
          <BilingualText v-else tag="span" tKey="resignation.withdrawal.submit" fallback="Submit Withdrawal Request" />
        </ion-button>
      </div>
      </template>
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
  IonSpinner,
  IonRow,
  IonIcon,
  IonCol,
  onIonViewWillEnter,
} from "@ionic/vue";
import PageHeader from "@/components/common/PageHeader.vue";
import ResignationTracker from "@/components/resignation/ResignationTracker.vue";
import BilingualText from "@/components/base/BilingualText.vue";
import { ref, reactive, computed } from "vue";
import { attachOutline } from "ionicons/icons";
import { useCustomToast } from "@/composable/toast.js";
import resignation from "@/api/resignation";
import { useUserStore } from "@/store/user.js";
import { useResignationStore } from "@/store/resignation.ts";
import { useFileAttachment } from "@/composable/useFileAttachment.ts";
import { useConfirmAlert } from "@/composable/useConfirmAlert.ts";
import { useI18n } from 'vue-i18n';
import { useSecondaryLanguage } from "@/composable/useSecondaryLanguage";

const userStore = useUserStore();
const resignationStore = useResignationStore();
const { t } = useI18n();
const { bilingualInline } = useSecondaryLanguage();
const { showAcknowledge } = useConfirmAlert();
const { showErrorToast, showSuccessToast } = useCustomToast();
const router = useIonRouter();

const isLoading = ref(false);
const supervisorLoading = ref(false);

const triggerBack = () => {
  router.canGoBack() ? router.back() : router.push("/resignation");
};

const { attachment, takePhoto, clearAttachment } = useFileAttachment();

const reason = ref("");

const errors = reactive({
  supervisor: false,
  reason: false,
  proofDocument: false,
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

const clearForm = () => {
  clearAttachment();
  selectedSupervisor.value = "";
  supervisorSearch.value = "";
  isLineManager.value = false;
  reason.value = "";
};

const validateForm = () => {
  errors.supervisor = !selectedSupervisor.value;
  errors.reason = !reason.value;
  errors.proofDocument = !attachment.value.base64;
  return !errors.supervisor && !errors.reason && !errors.proofDocument;
};

const onSubmit = async () => {
  if (!validateForm()) return;

  isLoading.value = true;
  try {
    const data = {
      employee_id: userStore.user?.employee_id,
      supervisor: selectedSupervisor.value,
      reason: reason.value,
      attachment: {
        attachment_name: attachment.value.name,
        attachment: attachment.value.base64,
      },
    };
    await resignation.withdrawResignation(data);
    showSuccessToast(bilingualInline(t('resignation.withdrawal.success_msg', 'Resignation Withdrawal processed successfully.'), 'resignation.withdrawal.success_msg', ' / '));
    clearForm();
    triggerBack();
  } catch (error) {
    console.error(error);
    showErrorToast(error?.data?.message, error?.data?.error || error?.message, error?.data?.status_code);
  } finally {
    isLoading.value = false;
  }
};

onIonViewWillEnter(async () => {
  clearForm();
  if (userStore.user?.employee_id && userStore.token) {
    await resignationStore.fetchActiveResignation();
    await fetchSupervisor(userStore.user.employee_id);
    
    // Fallback: Auto-fill supervisor from the active resignation if fetch fails
    if (!selectedSupervisor.value && resignationStore.activeResignation?.supervisor) {
      selectedSupervisor.value = resignationStore.activeResignation.supervisor;
      supervisorSearch.value = resignationStore.activeResignation.supervisor_name || resignationStore.activeResignation.supervisor;
    }
  }
});
</script>

<style scoped lang="scss">
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

  &.with-margin {
    margin-block-start: 16px;
  }

  .form-row {
    position: relative;
    margin-block-start: 16px;
  }

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

  .legal-notice {
    color: var(--ion-color-step-600, #c0c7cd);
    font-size: 14px;
  }

  .submit-btn {
    margin-block-start: 16px;
  }
}

.loading-container {
  margin-block-start: 50px;
}
</style>
