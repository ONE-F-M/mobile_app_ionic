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
            <p class="leaves-create-label leaves-create-label__required" :class="{ 'text-danger': errors.reason }">
              {{ $t('resignation.withdrawal.reason', 'Reason for Withdrawal') }}
            </p>
            <ion-input
              :placeholder="$t('resignation.detailed_reason', 'Detailed reason...')"
              fill="outline"
              v-model="reason"
            ></ion-input>
          </ion-col>
        </ion-row>

        <ion-row class="form-row">
          <ion-col size="12">
            <p class="leaves-create-label leaves-create-label__required" :class="{ 'text-danger': errors.proofDocument }">
              {{ $t('resignation.withdrawal.proof', 'Withdrawal Letter/Proof (Required)') }}
            </p>
            <input type="file" :ref="(el) => fileInput = el" accept=".pdf,.jpg,.jpeg,.png" @change="onFileUpload" class="hidden-input" />
            
            <div class="upload-container">
              <ion-button fill="outline" color="primary" @click="triggerFileUpload" class="upload-btn">
                <ion-icon slot="start" :icon="attachOutline"></ion-icon>
                {{ attachment.name ? attachment.name : $t('resignation.attach_document', 'Attach Document') }}
              </ion-button>
            </div>
          </ion-col>
        </ion-row>

        <div class="form-row">
            <p class="legal-notice">{{ $t('resignation.withdrawal.legal_notice', 'By clicking submit, you are officially registering an intent to withdraw any active resignation applications on file.') }}</p>
        </div>

        <ion-button
          shape="round"
          class="submit-btn"
          expand="block"
          @click="onSubmit"
          :disabled="isLoading || supervisorLoading"
        >
          <ion-spinner v-if="isLoading" name="crescent"></ion-spinner>
          <span v-else>{{ $t('resignation.withdrawal.submit', 'Submit Withdrawal Request') }}</span>
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
import { ref, reactive } from "vue";
import { attachOutline } from "ionicons/icons";
import { useCustomToast } from "@/composable/toast.js";
import resignation from "@/api/resignation";
import { useUserStore } from "@/store/user.js";
import { useResignationStore } from "@/store/resignation.js";
import { useFileAttachment } from "@/composable/useFileAttachment.js";
import { useI18n } from 'vue-i18n';

const userStore = useUserStore();
const resignationStore = useResignationStore();
const { t } = useI18n();
const { showErrorToast, showSuccessToast } = useCustomToast();
const router = useIonRouter();

const isLoading = ref(false);
const supervisorLoading = ref(false);

const triggerBack = () => {
  router.canGoBack() ? router.back() : router.push("/resignation");
};

const { fileInput, attachment, onFileUpload, triggerFileUpload, clearAttachment } = useFileAttachment();

const reason = ref("");

const errors = reactive({
  supervisor: false,
  reason: false,
  proofDocument: false,
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

const clearForm = () => {
  clearAttachment();
  selectedSupervisor.value = "";
  supervisorSearch.value = "";
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
      }),
    };
    await resignation.withdrawResignation(data);
    showSuccessToast(t('resignation.withdrawal.success_msg', 'Resignation Withdrawal processed successfully.'));
    clearForm();
    triggerBack();
  } catch (error) {
    console.error(error);
    showErrorToast(error?.data?.message, error?.data?.error, error?.data?.status_code);
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
