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
        <div class="centered">
          <template v-if="type === 'success'">
            <GreenCheck />
          </template>
          <template v-else>
            <RedTimes />
          </template>
          <h3>{{ $t(`enrollment.${type}_title`) }}</h3>
          <p>{{ $t(`enrollment.${type}_description`) }}</p>

          <router-link class="router" :to="action">
            <div class="btn-container">
              <ion-button class="ion-button">
                  {{ $t(`enrollment.${type}_action`) }}
              </ion-button>
            </div>
          </router-link>
        </div>
      </Transition>
    </ion-content>
  </ion-page>
</template>

<style lang="scss" scoped>
.centered {
  width: 100%;
  height: 100%;
  display: flex;
  flex-flow: column;
  align-items: center;
  justify-content: center;
  padding: 20px;

  p {
    text-align: center;
  }

  .btn-container {
    display: flex;
    width: 100%;
    justify-content: stretch;
  }

  .ion-button {
    width: 100%;
  }

  .router {
    display: block;
    width: 100%;
  }
}
</style>
