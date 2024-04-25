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

<style lang="scss">
.checkin-page {
  --padding-top: 0;
  --padding-bottom: 24px;
  --padding-start: 15px;
  --padding-end: 15px;
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
    margin-left: 12px;
  }
}
</style>
