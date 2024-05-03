<script setup>
import { IonContent, IonPage, useIonRouter } from "@ionic/vue";
import LeavesHeader from "@/components/leaves/Header.vue";

import { chevronDownOutline } from "ionicons/icons";
const router = useIonRouter();

const triggerBack = () => {
  router.push("/leaves");
};
</script>

<template>
  <ion-page>
    <ion-content class="ion-padding leaves-page">
      <LeavesHeader
        :title="$t('user.leaves.new_leave_application')"
        class="leaves-page-header"
        @click-back="triggerBack"
      />

      <div class="leaves-create">
        <p class="leaves-create-label leaves-create-label__required">
          {{ $t("user.leaves.create_leave.type") }}
        </p>
        <ion-select
          placeholder="Select Leave Type"
          interface="action-sheet"
          :toggleIcon="chevronDownOutline"
          fill="outline"
        >
          <ion-select-option>Sick Leave</ion-select-option>
          <ion-select-option>Maternity Leave</ion-select-option>
          <ion-select-option>Hajj Leave</ion-select-option>
          <ion-select-option>Annual Leave</ion-select-option>
        </ion-select>
        <span class="leaves-create-label-required">
          *{{ $t("utils.required") }}
        </span>

        <div class="ion-margin-top">
          <p class="leaves-create-label">
            {{ $t("user.leaves.create_leave.details") }}
          </p>
          <div class="leaves-create-detail-card">
            <ion-row
              class="leaves-create-detail-card-total-leaves leaves-create-detail-card-stats ion-align-items-center ion-justify-content-between"
            >
              <p>{{ $t("user.leaves.create_leave.total_leaves") }}</p>
              <span>0</span>
            </ion-row>
            <ion-row
              class="leaves-create-detail-card-stats ion-align-items-center ion-justify-content-between"
            >
              <p>{{ $t("user.leaves.create_leave.expired_leaves") }}</p>
              <span>- 0</span>
            </ion-row>
            <ion-row
              class="leaves-create-detail-card-stats ion-align-items-center ion-justify-content-between"
            >
              <p>{{ $t("user.leaves.create_leave.pending_leaves") }}</p>
              <span>0</span>
            </ion-row>
            <ion-row
              class="leaves-create-detail-card-stats ion-align-items-center ion-justify-content-between"
            >
              <p>{{ $t("user.leaves.create_leave.leaves_taken") }}</p>
              <span>- 0</span>
            </ion-row>
            <ion-row
              class="leaves-create-detail-card-available-leaves leaves-create-detail-card-stats ion-align-items-center ion-justify-content-between"
            >
              <p>{{ $t("user.leaves.create_leave.available_leaves") }}</p>
              <span> 0</span>
            </ion-row>
          </div>
        </div>

        <ion-row class="ion-margin-top">
          <ion-col size="6">
            <p class="leaves-create-label leaves-create-label__required">
              {{ $t("user.leaves.detail.from") }}
            </p>
            <ion-input fill="outline" placeholder="From Date"></ion-input>
            <span class="leaves-create-label-required"
              >*{{ $t("utils.required") }}</span
            >
          </ion-col>
          <ion-col size="6">
            <p class="leaves-create-label leaves-create-label__required">
              {{ $t("user.leaves.detail.till") }}
            </p>
            <ion-input fill="outline" placeholder="Till Date"></ion-input>
            <span class="leaves-create-label-required"
              >*{{ $t("utils.required") }}</span
            >
          </ion-col>
        </ion-row>

        <div class="ion-margin-top">
          <p class="leaves-create-label leaves-create-label__required">
            {{ $t("user.leaves.detail.reason") }}
          </p>
          <ion-textarea
            fill="outline"
            rows="6"
            placeholder="Enter reason here"
          />
          <span class="leaves-create-label-required"
            >*{{ $t("utils.required") }}</span
          >
        </div>

        <div class="ion-margin-top">
          <p class="leaves-create-label">
            {{ $t("user.leaves.create_leave.proof_document") }}
          </p>
          <ion-button
            shape="round"
            class="leaves-create-upload-button"
            expand="block"
          >
            {{ $t("user.leaves.create_leave.upload_proof_document") }}
          </ion-button>
        </div>

        <div class="ion-margin-top leaves-create-summary-card">
          <div>
            <p class="leaves-create-summary-card-label">
              {{ $t("user.leaves.create_leave.posting_date") }}
            </p>
            <span class="leaves-create-summary-card-value">25 Oct, 2022</span>
          </div>

          <div class="leaves-create-summary-card-value-wrapper">
            <p class="leaves-create-summary-card-label">
              {{ $t("user.leaves.create_leave.total_leaves_days") }}
            </p>
            <span class="leaves-create-summary-card-value">2</span>
          </div>
        </div>

        <ion-button shape="round" class="ion-margin-top" expand="block">
          {{ $t("user.leaves.create_leave.save_leaves_application") }}
        </ion-button>
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
    z-index: 5;
    background: #191c1d;
  }
}

.leaves-create {
  padding: 0 16px 0;

  &-label-required {
    margin: 4px 16px;
    font-size: 0.75rem;
    line-height: 1rem;
    color: #8b9298;
  }

  &-label {
    color: #c0c7cd;
    font-size: 0.875rem;
    line-height: 1.25rem;
    margin: 0 0 8px;

    &__required {
      &:after {
        content: "*";
        color: #8b9298;
      }
    }
  }

  &-detail-card {
    padding: 16px;
    border-radius: 16px;
    background: #1e2529;

    p {
      margin: 0;
    }

    &-stats {
      &:not(:first-child) {
        margin-top: 20px;
      }

      font-size: 1rem;
      line-height: 1.5rem;
      color: #8b9298;
    }

    &-total-leaves {
      color: #c0c7cd;
    }

    &-available-leaves {
      color: #76d1ff;
    }
  }

  &-summary-card {
    padding: 16px;
    border-radius: 16px;
    background: #1e2529;

    p {
      margin: 0;
    }

    &-label {
      margin-bottom: 4px;
      font-size: 0.875rem;
      line-height: 1.25rem;
      color: #8b9298;
    }

    &-value {
      font-size: 1rem;
      line-height: 1.5rem;
      color: #e0e3e3;
    }

    &-value-wrapper {
      margin-top: 8px;
    }
  }

  &-upload-button {
    --background: #004c69;
    --color: #c1e8ff;
  }
}
</style>
