<script setup>
import { IonRow, IonCol, IonText, IonButton, IonIcon } from "@ionic/vue";

defineProps({
  title: {
    type: String,
    required: true,
  },
  showFilterButton: {
    type: Boolean,
    default: false,
  },
});

import { arrowBackOutline } from "ionicons/icons";
import IconFilters from "@/components/icon/Filters.vue";

defineEmits(["open-filters", "click-back"]);
</script>

<template>
  <ion-row class="header-wrapper">
    <ion-col class="ion-align-self-center ion-no-padding ion-text-center">
      <ion-row class="">
        <ion-col>
          <ion-row class="ion-justify-content-between">
            <ion-row>
              <ion-button
                @click="$emit('click-back')"
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
                  {{ title }}
                </h3>
              </ion-text>
            </ion-row>
            <ion-button
              v-if="showFilterButton"
              fill="clear"
              @click="$emit('open-filters')"
            >
              <IconFilters />
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
