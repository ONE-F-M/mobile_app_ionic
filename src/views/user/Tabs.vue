<script setup>
import {
  IonContent,
  IonIcon,
  IonPage,
  IonTabs,
  IonTabButton,
  IonTabBar,
  IonRouterOutlet,
} from "@ionic/vue";
import {gridOutline, homeOutline, notificationsOutline, personOutline} from "ionicons/icons";
</script>

<template>
  <ion-page>
    <ion-content class="ion-padding">
      <ion-tabs>
        <ion-router-outlet />
        <ion-tab-bar slot="bottom">
          <ion-tab-button tab="home" href="/home">
            <ion-icon :icon="homeOutline" />
            Home
          </ion-tab-button>
          <ion-tab-button tab="service" href="/service">
            <ion-icon :icon="gridOutline" />
            Service
          </ion-tab-button>
          <ion-tab-button tab="notification" href="/notification">
            <ion-icon :icon="notificationsOutline" />
            Notification
          </ion-tab-button>
          <ion-tab-button tab="profile" href="/profile">
            <ion-icon :icon="personOutline" />
            Profile
          </ion-tab-button>
        </ion-tab-bar>
      </ion-tabs>
    </ion-content>
  </ion-page>
</template>
