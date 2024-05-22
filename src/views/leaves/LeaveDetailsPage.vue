<script setup>
import {
  IonContent,
  IonPage,
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
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";

const { formatDate } = useDateHelper();
const router = useIonRouter();
const userStore = useUserStore();
const { showErrorToast } = useCustomToast();
const route = useRoute();

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

const contents = ref("");

const writeProofFile = async () => {
  await Filesystem.writeFile({
    path: `${proofDocumentName.value}`,
    data: documentContent.value,
    directory: Directory.Documents,
  });
};
const fetchLeave = async () => {
  try {
    const { data } = await leave.details({
      employee_id: userStore.user?.employee_id,
      leave_id: route.params.id,
    });

    leaveDetails.value = data.data || {};
  } catch (error) {
    showErrorToast(error.data?.error?.message || error.data?.error);
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
    showErrorToast(error.data?.error?.message || error.data?.error);
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

        <template v-if="proofDocumentName">
          <p class="leaves-details-proof-title">
            {{ $t("user.leaves.detail.document_proof") }}
          </p>
          <div class="leaves-details-proof-card">
            <ion-row class="ion-align-items-center ion-justify-content-between">
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
                View
              </ion-button>
            </ion-row>
          </div>
        </template>
      </div>
    </ion-content>
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
</style>
