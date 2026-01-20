<script setup>
import { IonRow, IonCol, IonText, IonButton, IonIcon } from "@ionic/vue";

import { arrowBackOutline } from "ionicons/icons";

const props = defineProps({
  withBackButton: Boolean,
});

const { withBackButton } = props;

const emit = defineEmits(["goBack"]);

const triggerBack = () => emit("goBack");
</script>

<template>
  <ion-row class="header-wrapper">
    <template v-if="withBackButton">
      <ion-col class="back-button-wrapper" size="3">
        <ion-button @click="triggerBack" router-direction="back" fill="clear">
          <ion-icon
            class="icon-arrow-back"
            color="light"
            :icon="arrowBackOutline"
          />
        </ion-button>
      </ion-col>
    </template>

    <ion-col class="ion-align-self-center ion-text-center">
      <ion-text>
        <h3 class="header-text-wrapper ion-padding">
          <slot />
        </h3>
      </ion-text>
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
	  color: var(--ion-color-dark-tint);
    letter-spacing: 0.05px;
  }
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
