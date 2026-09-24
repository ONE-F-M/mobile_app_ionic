<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>QA Test Harness</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="qa-harness-container">
        <h1>QA Test Harness</h1>
        <p>Internal testing utilities and tools for QA purposes.</p>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent } from "@ionic/vue";
</script>

<style scoped>
.qa-harness-container {
  padding: 20px;
}
</style>
