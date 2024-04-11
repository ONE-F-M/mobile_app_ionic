<script setup>
import { IonContent, IonPage } from "@ionic/vue";

import { useUserStore } from "@/store/user.js";

const userStore = useUserStore();
</script>

<template>
  <ion-page>
    <ion-content>
      <div style="overflow: auto">
        <ion-text color="primary">
          <h3 class="ion-padding">User</h3>
          <pre>{{ userStore.user }}</pre>
        </ion-text>
      </div>
    </ion-content>
  </ion-page>
</template>
