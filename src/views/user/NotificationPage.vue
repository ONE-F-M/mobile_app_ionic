<script setup>
import {
  IonCol,
  IonContent,
  IonPage,
  IonRow,
} from "@ionic/vue";
</script>

<template>
  <ion-page>
    <ion-content class="ion-padding">
      <ion-row class="login-header-wrapper">
        <ion-col class="ion-align-self-center ion-text-center">
          <ion-text>
            <h3 class="login-wrapper-header ion-padding">
              {{ $t("user.notification.title") }}
            </h3>
          </ion-text>
        </ion-col>
      </ion-row>
    </ion-content>
  </ion-page>
</template>
