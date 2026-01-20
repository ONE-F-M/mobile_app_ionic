<script setup>
import { IonPage, IonContent } from "@ionic/vue";
import GreenCheck from "@/components/icon/GreenCheck.vue";
import RedTimes from "@/components/icon/RedTimes.vue";

defineProps({
  type: String,
  action: String,
});
</script>

<template>
  <ion-page>
    <ion-content>
      <Transition>
        <div class="enrollment-result">
          <div class="enrollment-result-status-icon">
            <template v-if="type === 'success'">
              <GreenCheck />
            </template>
            <template v-else>
              <RedTimes />
            </template>
          </div>
          <h3 class="enrollment-result-status-title">
            {{ $t(`enrollment.${type}_title`) }}
          </h3>
          <p class="enrollment-result-status-description">
            {{ $route.query?.error || $t(`enrollment.${type}_description`) }}
          </p>

          <router-link class="enrollment-result-link" :to="action">
            <ion-button class="ion-button" shape="round" expand="block">
              {{ $t(`enrollment.${type}_action`) }}
            </ion-button>
          </router-link>
        </div>
      </Transition>
    </ion-content>
  </ion-page>
</template>

<style lang="scss" scoped>
.enrollment-result {
  margin-top: -12px;

  width: 100%;
  height: 100%;
  display: flex;
  flex-flow: column;
  align-items: center;
  justify-content: center;
  padding: 20px 16px;

  &-status-icon {
    width: 80px;
    height: 80px;
  }

  &-status-title {
    margin-top: 24px;
    margin-bottom: 0;
    font-size: 1.5rem;
    line-height: 2rem;
    font-weight: 400;
  }

  &-status-description {
    margin: 16px 12px 0;
    font-size: 1rem;
    line-height: 1.5rem;
    letter-spacing: 0.5px;
    font-weight: 400;
    color: var(--ion-color-medium-contrast);
  }

  .enrollment-result-link {
    margin-top: 58px;
    display: block;
    width: 100%;

    .ion-button {
      height: 46px;
      margin: 0;

      font-size: 1rem;
      line-height: 1.5rem;
      font-weight: 500;
      font-family: "Readex Pro", sans-serif;

      letter-spacing: 0.5px;
    }

    &::part(native) {
      --padding-top: 11px;
      --padding-bottom: 11px;
    }
  }
}
</style>
