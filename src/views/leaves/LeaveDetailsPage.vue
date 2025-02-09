<script setup>
import {
  IonButton,
  IonContent,
  IonModal,
  IonPage,
  IonRow,
  IonSpinner,
  onIonViewWillEnter,
  useIonRouter,
} from "@ionic/vue";
import LeavesHeader from "@/components/leaves/Header.vue";
import { useRoute } from "vue-router";
import { computed, ref } from "vue";
import { useUserStore } from "@/store/user";
import leave from "@/api/leave";
import { useCustomToast } from "@/composable/toast";
import useDateHelper from "@/composable/useDateHelper";
import dayjs from "dayjs";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { storeToRefs } from "pinia";
import IconLeave from "@/components/icon/Leave.vue";
import { App } from '@capacitor/app'; // for opening files in native apps


const { formatDate } = useDateHelper();
const router = useIonRouter();
const userStore = useUserStore();
const { user } = storeToRefs(userStore);
const { showErrorToast } = useCustomToast();
const route = useRoute();

const { showSuccessToast } = useCustomToast();

const showAcceptModal = ref(false);
const showRejectModal = ref(false);
const isLoading = ref(false);
const triggerBack = () => {
  router.push("/leaves");
};
const leaveDetails = ref({});
const proofDocumentName = computed(() => {
  return leaveDetails.value.proof_documents?.[0]?.description;
});
const documentContent = ref("");
const formatDateToDisplay = (date) => {
  return dayjs(date, "YYYY-MM-DD").format("DD MMM, YYYY");
};


const writeProofFile = async () => {
  if (Capacitor.isNativePlatform()) {
    await Filesystem.writeFile({
      path: `${proofDocumentName.value}`,
      data: documentContent.value,
      directory: Directory.Documents,
    });
    const fileUri = await Filesystem.getUri({
        path: proofDocumentName.value,
        directory: Directory.Documents,
      });
    const fileUrl = fileUri.uri;
    window.open(fileUrl, '_system');
    showSuccessToast(
      "The file has been successfully downloaded to your documents on device"
    );
  } else {
    const fileExtension = proofDocumentName.value.split('.').pop().toLowerCase();
    const mimeTypes = {
        pdf: 'application/pdf',
        txt: 'text/plain',
        docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        csv: 'text/csv',
        jpeg: 'image/jpeg',
        png: 'image/png',
        mp4: 'video/mp4',
        mp3: 'audio/mp3',
        json: 'application/json',
        // Add other file types as necessary
    };
    const mimeType = mimeTypes[fileExtension] || 'application/octet-stream'; 
    if (documentContent.value) {
        // Decode the Base64 string
        const decodedData = atob(documentContent.value);
        const byteArray = new Uint8Array(decodedData.length);
        for (let i = 0; i < decodedData.length; i++) {
            byteArray[i] = decodedData.charCodeAt(i);
        }

        // Web-specific behavior (trigger file download)
        const blob = new Blob([byteArray], { type: mimeType });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = proofDocumentName.value;
        link.click();

        showSuccessToast("The file has been downloaded on the web.");
    } else {
        showErrorToast("No content available for download.");
    }
  }

};

const fetchLeave = async () => {
  try {
    const { data } = await leave.details({
      employee_id: userStore.user?.employee_id,
      leave_id: route.params.id,
    });

    leaveDetails.value = data.data || {};
  } catch (error) {
    showErrorToast(`${error.data.status_code} ${error.data.message} ${error.data.error}`);
    leaveDetails.value = {};
  }
};

const fetchProfDocument = async () => {
  try {
    const { data } = await leave.profDocument({
      file_name: leaveDetails.value.proof_documents?.[0]?.file_name,
      docname: route.params.id,
      doctype: "Leave Application",
    });

    documentContent.value = data.data.content;
  } catch (error) {
    console.error(error);
  }
};
const rejectLeave = async () => {
  try {
    isLoading.value = true;
    await leave.updateLeaveStatus({
      leave_id: route.params.id,
      status: "Rejected",
    });

    showRejectModal.value = false;
    router.push({
      name: "leaves-list",
    });
    showSuccessToast("Leave rejected successfully");
  } catch (error) {
    showErrorToast(`${error.data.status_code} ${error.data.message} ${error.data.error}`);
  } finally {
    isLoading.value = false;
  }
};

const acceptLeave = async () => {
  try {
    isLoading.value = true;
    await leave.updateLeaveStatus({
      leave_id: route.params.id,
      status: "Approved",
    });

    showAcceptModal.value = false;
    router.push({
      name: "leaves-list",
    });
    showSuccessToast("Leave accepted successfully");
  } catch (error) {
    showErrorToast(`${error.data.status_code} ${error.data.message} ${error.data.error}`);
  } finally {
    isLoading.value = false;
  }
};

onIonViewWillEnter(async () => {
  await fetchLeave();
  await fetchProfDocument();
});
</script>

<template>
  <ion-page>
    <ion-content class="ion-padding leaves-page">
      <LeavesHeader
        :title="$t('user.leaves.leave_details')"
        class="leaves-page-header"
        @click-back="triggerBack"
      />
      <div class="leaves-details">
        <p class="leaves-details-title">{{ $route.params.id }}</p>

        <div class="leaves-details-card">
          <div class="leaves-details-card-value-wrapper">
            <p class="leaves-details-card-label">
              {{ $t("user.leaves.detail.status") }}
            </p>
            <p
              class="leaves-details-card-value"
              :class="`leaves-status__${leaveDetails.workflow_state}`"
            >
              {{ leaveDetails.workflow_state }}
            </p>
          </div>

          <div class="leaves-details-card-value-wrapper">
            <p class="leaves-details-card-label">
              {{ $t("user.leaves.detail.leave_type") }}
            </p>
            <p class="leaves-details-card-value">
              {{ leaveDetails.leave_type }}
            </p>
          </div>

          <div class="leaves-details-card-value-wrapper">
            <p class="leaves-details-card-label">
              {{ $t("user.leaves.detail.days_requested") }}
            </p>
            <p class="leaves-details-card-value">
              {{ leaveDetails.total_leave_days }}
              {{ leaveDetails.total_leave_days > 1 ? "Days" : "Day" }}
            </p>
          </div>

          <div class="leaves-details-card-value-wrapper">
            <p class="leaves-details-card-label">
              {{ $t("user.leaves.detail.date_posted") }}
            </p>
            <p class="leaves-details-card-value">
              {{ formatDate(leaveDetails.posting_date, "DD MMM, YYYY") }}
            </p>
          </div>

          <div class="leaves-details-card-value-wrapper">
            <p class="leaves-details-card-label">
              {{ $t("user.leaves.detail.from") }}
            </p>
            <p class="leaves-details-card-value">
              {{ formatDateToDisplay(leaveDetails.from_date) }}
            </p>
          </div>

          <div class="leaves-details-card-value-wrapper">
            <p class="leaves-details-card-label">
              {{ $t("user.leaves.detail.till") }}
            </p>
            <p class="leaves-details-card-value">
              {{ formatDateToDisplay(leaveDetails.to_date) }}
            </p>
          </div>

          <div class="leaves-details-card-value-wrapper">
            <p class="leaves-details-card-label">
              {{ $t("user.leaves.detail.reason") }}
            </p>
            <p class="leaves-details-card-value">
              {{ leaveDetails.description }}
            </p>
          </div>

          <div
            v-if="leaveDetails.leave_approver_name"
            class="leaves-details-card-value-wrapper"
          >
            <p class="leaves-details-card-label">
              {{ $t("user.leaves.detail.leave_approver") }}
            </p>
            <p class="leaves-details-card-value">
              {{ leaveDetails.leave_approver_name }}
            </p>
          </div>
        </div>

        <p class="leaves-details-proof-title">
          {{ $t("user.leaves.detail.document_proof") }}
        </p>
        <div class="leaves-details-proof-card">
          <ion-row
            class="ion-align-items-center ion-justify-content-between ion-nowrap"
            v-if="proofDocumentName"
          >
            <ion-row
              class="ion-align-items-center leaves-details-proof-card-wrapper"
            >
              <img
                src="/image/icon/leaves/jpg-file.png"
                alt="file type"
                class="leaves-details-proof-card-image"
              />
              <p class="leaves-details-proof-card-file-name">
                {{ proofDocumentName }}
              </p>
            </ion-row>
            <ion-button @click="writeProofFile" fill="clear">
              {{ $t("utils.view") }}
            </ion-button>
          </ion-row>
          <p v-else>We can't fetch proof document</p>
        </div>

        <ion-row
          class="ion-margin-top"
          v-if="
            leaveDetails.status === 'Open' &&
            user.user === leaveDetails.leave_approver
          "
        >
          <ion-col>
            <ion-button
              color="danger"
              expand="block"
              shape="round"
              @click="showRejectModal = true"
            >
              Reject Leave
            </ion-button>
          </ion-col>
          <ion-col>
            <ion-button
              color="success"
              expand="block"
              shape="round"
              @click="showAcceptModal = true"
            >
              Accept Leave
            </ion-button>
          </ion-col>
        </ion-row>
      </div>
    </ion-content>

    <ion-modal :is-open="showAcceptModal">
      <ion-row
        class="leave-confirm-location ion-align-items-center ion-justify-content-center"
      >
        <div class="leave-confirm-card">
          <div class="leave-confirm-card-icon-wrapper-accept">
            <IconLeave />
          </div>
          <p class="leave-confirm-card-title">
            {{ $t("user.leaves.change_status.accept_leave") }}
          </p>
          <p class="leave-confirm-card-description">
            {{ $t("user.leaves.change_status.confirm_text") }}
          </p>
          <ion-row class="ion-justify-content-end">
            <ion-button
              @click="showAcceptModal = false"
              class="leave-confirm-card-back"
              fill="clear"
              :disabled="isLoading"
            >
              {{ $t("utils.back") }}
            </ion-button>
            <ion-button fill="clear" color="success" @click="acceptLeave">
              <ion-spinner v-if="isLoading" name="crescent"></ion-spinner>
              <span v-else>{{ $t("utils.confirm") }}</span>
            </ion-button>
          </ion-row>
        </div>
      </ion-row>
    </ion-modal>

    <ion-modal :is-open="showRejectModal">
      <ion-row
        class="leave-confirm-location ion-align-items-center ion-justify-content-center"
      >
        <div class="leave-confirm-card">
          <div class="leave-confirm-card-icon-wrapper-reject">
            <IconLeave />
          </div>
          <p class="leave-confirm-card-title">
            {{ $t("user.leaves.change_status.reject_leave") }}
          </p>
          <p class="leave-confirm-card-description">
            {{ $t("user.leaves.change_status.confirm_text") }}
          </p>
          <ion-row class="ion-justify-content-end">
            <ion-button
              @click="showRejectModal = false"
              class="leave-confirm-card-back"
              fill="clear"
              :disabled="isLoading"
            >
              {{ $t("utils.back") }}
            </ion-button>
            <ion-button fill="clear" color="danger" @click="rejectLeave">
              <ion-spinner v-if="isLoading" name="crescent"></ion-spinner>
              <span v-else>{{ $t("utils.confirm") }}</span>
            </ion-button>
          </ion-row>
        </div>
      </ion-row>
    </ion-modal>
  </ion-page>
</template>

<style scoped lang="scss">
.leaves-page {
  --padding-top: 0;
  --padding-bottom: 24px;
  --padding-start: 0;
  --padding-end: 0;

  &-header {
    position: sticky;
    top: 0;
    padding: 0 15px;
    z-index: 1;
    background: #191c1d;
  }
}

.leaves-details {
  padding: 16px;

  &-title {
    font-size: 0.875rem;
    line-height: 1.25rem;
    font-weight: 500;
    margin: 0 6px 16px;
  }

  &-card {
    padding: 24px 16px;
    border-radius: 16px;
    background: #1e2529;

    &-label {
      margin: 0;
      font-size: 0.875rem;
      line-height: 1.25rem;
      color: #8b9298;
    }

    &-value {
      margin: 4px 0 4px;
      font-size: 1rem;
      line-height: 1.5rem;
      color: #e0e3e3;
    }

    &-value-wrapper {
      &:not(:first-child) {
        margin-top: 16px;
      }
    }
  }

  &-proof-title {
    font-size: 0.875rem;
    line-height: 1.25rem;
    margin: 20px 6px 10px;
    color: #8b9298;
  }

  &-proof-card {
    padding: 10px 12px;
    border-radius: 16px;
    background: #1e2529;

    &-wrapper {
      flex-wrap: nowrap;
    }

    &-image {
      width: 36px;
      height: 36px;
      object-fit: contain;
    }

    &-file-name {
      margin: 0 0 0 4px;
      word-break: break-word;
    }
  }
}

.leave-confirm-location {
  height: 100%;
}

.leave-confirm-card {
  margin: 8px 20px;
  padding: 18px 16px 10px;
  background: #233036;
  border-radius: 28px;

  &-icon-wrapper-reject {
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

  &-icon-wrapper-accept {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 48px;
    width: 48px;
    margin: 0 auto;
    background: #52e169;
    color: #00390c;
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
    line-height: 1rem;
    color: #c0c7cd;
  }

  &-back {
    color: #c0c7cd;
  }
}
</style>
