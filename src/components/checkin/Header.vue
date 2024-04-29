<script setup>
import {
  IonRow,
  IonCol,
  IonText,
  IonButton,
  IonIcon,
  useIonRouter,
} from "@ionic/vue";

import { arrowBackOutline, calendarOutline } from "ionicons/icons";

const router = useIonRouter();

const triggerBack = () => {
  router.push("/home");
};
</script>

<template>
  <ion-row class="header-wrapper">
    <ion-col class="ion-align-self-center ion-no-padding ion-text-center">
      <ion-row class="">
        <ion-col>
          <ion-row class="ion-justify-content-between">
            <ion-row>
              <ion-button
                @click="triggerBack"
                router-direction="back"
                class="button-back"
                fill="clear"
              >
                <ion-icon
                  class="icon-arrow-back"
                  color="light"
                  :icon="arrowBackOutline"
                />
              </ion-button>
              <ion-text>
                <h3 class="header-text-wrapper ion-padding-vertical">
                  {{ $t("user.checkin.title") }}
                </h3>
              </ion-text>
            </ion-row>
            <ion-button router-direction="back" fill="clear">
              <ion-icon color="light" :icon="calendarOutline" />
            </ion-button>
          </ion-row>
        </ion-col>
      </ion-row>
    </ion-col>
  </ion-row>
</template>

<style lang="scss" scoped>
.header-wrapper {
  position: relative;

  ion-button {
    --padding-start: 12px;
  }

  .back-button-wrapper {
    position: absolute;
    z-index: 1;
    top: 50%;
    left: -12px;
    transform: translateY(-50%);
  }

  .header-text-wrapper {
    margin: 0;
    font-weight: 400;
    font-family: "Readex Pro", sans-serif;
    letter-spacing: 0.05px;
  }
}

[dir="ltr"] .button-back {
  margin-left: -8px;
}

[dir="rtl"] .button-back {
  margin-right: -8px;
}

.rtl {
  .header-wrapper {
    .back-button-wrapper {
      right: -3px;
      left: auto;
    }
  }
}
</style>
