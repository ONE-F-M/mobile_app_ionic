<script setup>
import {
  IonContent,
  IonButton,
  IonText,
  IonPage,
  useIonRouter,
} from "@ionic/vue";

import IconPlus from "@/components/icon/Plus.vue";
import CheckinHeader from "@/components/checkin/Header.vue";

const router = useIonRouter();
</script>

<template>
  <ion-page>
    <ion-content class="checkin-page">
      <CheckinHeader />

      <div>
        <ion-row>
          <ion-col class="checkin-page-table-label">Employee Name</ion-col>
          <ion-col size="auto" class="align-cols-end checkin-page-table-label"
            >Date/Time</ion-col
          >
          <ion-col size="3" class="align-cols-end checkin-page-table-label"
            >Status</ion-col
          >
        </ion-row>
        <ion-row>
          <ion-col>
            <div class="checkin-page-name-wrapper">
              <p class="checkin-page-name">John Watson Smith</p>
              <p class="checkin-page-duration">Now</p>
            </div>
          </ion-col>
          <ion-col size="auto" class="align-cols-end">
            <div>
              <p class="checkin-page-date">25/07/22</p>
              <p class="checkin-page-time">08:00 AM</p>
            </div>
          </ion-col>
          <ion-col size="3" class="align-cols-end">
            <div
              class="checkin-page-status"
              :class="`checkin-page-status-${'IN'}`"
            >
              IN
            </div>
          </ion-col>
        </ion-row>
        <ion-row>
          <ion-col>
            <div class="checkin-page-name-wrapper">
              <p class="checkin-page-name">John Watson Smith</p>
              <p class="checkin-page-duration">Now</p>
            </div>
          </ion-col>
          <ion-col size="auto" class="align-cols-end">
            <div>
              <p class="checkin-page-date">25/07/22</p>
              <p class="checkin-page-time">05:00 PM</p>
            </div>
          </ion-col>
          <ion-col size="3" class="align-cols-end">
            <div
              class="checkin-page-status"
              :class="`checkin-page-status-${'OUT'}`"
            >
              OUT
            </div>
          </ion-col>
        </ion-row>
      </div>

      <ion-button
        class="checkin-add-button"
        @click="router.push('/checkin/geolocation')"
      >
        <IconPlus />
        <ion-text>
          <p class="checkin-add-button-label">Checkin</p>
        </ion-text>
      </ion-button>
    </ion-content>
  </ion-page>
</template>

<style lang="scss" scoped>
p {
  margin: 0;
}
.checkin-page {
  --padding-top: 0;
  --padding-bottom: 24px;
  --padding-start: 15px;
  --padding-end: 15px;

  &-table-label {
    font-size: 0.875rem;
    line-height: 1.25rem;
    font-weight: 600;
    color: #8b9298;
  }

  &-name {
    font-size: 0.875rem;
    line-height: 1.25rem;
    font-weight: 600;
    color: #e0e3e3;
  }

  &-duration {
    margin-top: 4px;
    font-size: 0.75rem;
    line-height: 1rem;
    font-weight: 500;
    color: #8b9298;
  }

  &-date,
  &-time {
    font-size: 0.75rem;
    line-height: 1rem;
    font-weight: 500;
    color: #c0c7cd;
  }

  &-status {
    width: min(55px, 100%);
    height: max-content;
    display: flex;
    padding: 8px 4px;
    justify-content: center;
    align-items: center;
    border-radius: 4px;

    text-align: center;

    font-size: 0.75rem;
    line-height: 1rem;
    font-weight: 600;

    &-IN {
      background: #52e169;
      color: #00390c;
    }

    &-OUT {
      background: #ffb3ac;
      color: #68000a;
    }
  }
}

.checkin-add-button {
  position: absolute;
  bottom: 24px;
  right: 16px;
  --background: #004c69;
  --background-hover: #014662;
  --background-activated: #004d6c;
  --background-focused: #004969;
  --color: #c1e8ff;
  --border-radius: 16px;
  --padding-end: 20px;

  font-size: 0.875rem;
  line-height: 1.25rem;
  font-weight: 500;

  &-label {
    margin: 16px 0 16px 12px;
  }
}

.align-cols-end {
  display: flex;
  justify-content: flex-end;
}
</style>
