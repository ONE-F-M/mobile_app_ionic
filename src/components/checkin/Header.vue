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

defineEmits(["open-date-picker"]);

const router = useIonRouter();

const triggerBack = () => {
  router.push("/home");
};
</script>

<template>
  <ion-row class="header-wrapper">
    <ion-col class="ion-align-self-center ion-no-padding ion-text-center">
      <ion-row>
        <ion-col class="pr-0 pl-0">
          <ion-row class="ion-justify-content-between">
            <ion-row>
              <ion-button
                @click="triggerBack"
                router-direction="back"
                class="button-back ion-no-padding"
                fill="clear"
              >
                <ion-icon
                  class="icon-arrow-back"
                  color="light"
                  :icon="arrowBackOutline"
                />
              </ion-button>
              <ion-text>
                <h3 class="header-text-wrapper text-dark-tint ion-padding-vertical">
                  {{ $t("user.checkin.title") }}
                </h3>
              </ion-text>
            </ion-row>
            <ion-button
	            class="ion-no-padding"
	            fill="clear"
	            @click="$emit('open-date-picker')"
            >
              <ion-icon
	              color="light"
	              :icon="calendarOutline"
              />
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
    font-weight: 300;
    font-family: "Readex Pro", sans-serif;
    letter-spacing: 0.05px;
  }
}

[dir="ltr"] .button-back {
	margin-right: 20px;
}

[dir="rtl"] .button-back {
	margin-left: 20px;
}

.button-back::part(native) {
	padding-left: 0;
	padding-right: 0;
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
