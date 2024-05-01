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
</style>
