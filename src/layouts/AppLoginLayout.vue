<script setup>
import { IonContent, IonPage, IonRouterOutlet } from "@ionic/vue";
</script>

<template>
  <ion-page>
    <ion-content :fullscreen="false">
      <ion-router-outlet />
    </ion-content>
  </ion-page>
</template>
