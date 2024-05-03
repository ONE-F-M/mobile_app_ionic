<script setup>
import { IonContent, IonPage, useIonRouter } from "@ionic/vue";
import LeavesHeader from "@/components/leaves/Header.vue";

const router = useIonRouter();

const triggerBack = () => {
  router.push("/leaves");
};
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
              {{ $t("user.leaves.leave_details") }}
            </p>
            <p class="leaves-details-card-value leaves-status__Accepted">
              {{ $t("user.leaves.leave_details") }}
            </p>
          </div>

          <div class="leaves-details-card-value-wrapper">
            <p class="leaves-details-card-label">
              {{ $t("user.leaves.detail.leave_type") }}
            </p>
            <p class="leaves-details-card-value">
              {{ $t("user.leaves.card.type.sick") }}
            </p>
          </div>

          <div class="leaves-details-card-value-wrapper">
            <p class="leaves-details-card-label">
              {{ $t("user.leaves.detail.days_requested") }}
            </p>
            <p class="leaves-details-card-value">2 Days</p>
          </div>

          <div class="leaves-details-card-value-wrapper">
            <p class="leaves-details-card-label">
              {{ $t("user.leaves.detail.date_posted") }}
            </p>
            <p class="leaves-details-card-value">25 Oct, 2022</p>
          </div>

          <div class="leaves-details-card-value-wrapper">
            <p class="leaves-details-card-label">
              {{ $t("user.leaves.detail.from") }}
            </p>
            <p class="leaves-details-card-value">26 Oct, 2022</p>
          </div>

          <div class="leaves-details-card-value-wrapper">
            <p class="leaves-details-card-label">
              {{ $t("user.leaves.detail.till") }}
            </p>
            <p class="leaves-details-card-value">28 Oct, 2022</p>
          </div>

          <div class="leaves-details-card-value-wrapper">
            <p class="leaves-details-card-label">
              {{ $t("user.leaves.detail.reason") }}
            </p>
            <p class="leaves-details-card-value">Medical Issue</p>
          </div>

          <div class="leaves-details-card-value-wrapper">
            <p class="leaves-details-card-label">
              {{ $t("user.leaves.detail.leave_approver") }}
            </p>
            <p class="leaves-details-card-value">Mohammed Jasem</p>
          </div>
        </div>

        <p class="leaves-details-proof-title">
          {{ $t("user.leaves.detail.document_proof") }}
        </p>
        <div class="leaves-details-proof-card">
          <ion-row class="ion-align-items-center ion-justify-content-between">
            <ion-row class="ion-align-items-center">
              <img
                src="/image/icon/leaves/jpg-file.png"
                alt="file type"
                class="leaves-details-proof-card-image"
              />
              <p class="leaves-details-proof-card-file-name">Image Name.JPG</p>
            </ion-row>
            <ion-button size="large" fill="clear">{{
              $t("user.leaves.detail.view")
            }}</ion-button>
          </ion-row>
        </div>
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
    padding: 2px 2px 2px 12px;
    border-radius: 16px;
    background: #1e2529;

    &-image {
      width: 36px;
      height: 36px;
      object-fit: contain;
    }

    &-file-name {
      margin: 0 0 0 4px;
    }
  }
}
</style>
