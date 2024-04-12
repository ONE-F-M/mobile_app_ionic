<script setup>
import {
  IonButton,
  IonCol,
  IonContent,
  IonPage,
  IonRow,
  useIonRouter,
} from "@ionic/vue";
import { useUserStore } from "@/store/user.js";

const router = useIonRouter();
const userStore = useUserStore();

const logout = () => {
  userStore.logout();
  router.push("/");
};
</script>

<template>
  <ion-page>
    <ion-content class="ion-padding">
      <ion-row class="login-header-wrapper">
        <ion-col class="ion-align-self-center ion-text-center">
          <ion-text>
            <h3 class="login-wrapper-header ion-padding">
              {{ $t("user.home.title") }}
            </h3>
          </ion-text>
        </ion-col>
      </ion-row>
      <ion-button expand="block" shape="round" @click="logout">
        {{ $t("user.home.logout") }}
      </ion-button>
    </ion-content>
  </ion-page>
</template>
