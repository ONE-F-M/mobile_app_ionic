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
import {
  gridOutline,
  homeOutline,
  notificationsOutline,
  personOutline,
} from "ionicons/icons";
</script>

<template>
  <ion-page>
    <ion-content class="ion-padding">
      <ion-tabs>
        <ion-router-outlet />
        <ion-tab-bar class="navigation-tabs" slot="bottom">
          <ion-tab-button tab="home" href="/dashboard">
            <ion-icon :icon="homeOutline" />
            {{ $t("user.home.title") }}
          </ion-tab-button>
          <ion-tab-button tab="service" href="/service">
            <ion-icon :icon="gridOutline" />
            {{ $t("user.service.title") }}
          </ion-tab-button>
          <ion-tab-button tab="notification" href="/notification">
            <ion-icon :icon="notificationsOutline" />
            {{ $t("user.notification.title") }}
          </ion-tab-button>
          <ion-tab-button tab="profile" href="/profile">
            <ion-icon :icon="personOutline" />
            {{ $t("user.profile.title") }}
          </ion-tab-button>
        </ion-tab-bar>
      </ion-tabs>
    </ion-content>
  </ion-page>
</template>

<style lang="scss" scoped>
ion-tab-bar {
  height: 80px;

  .tab-selected {
    color: var(--ion-color-secondary-tint);

    ion-icon {
      color: var(--ion-color-secondary-tint);
    }
  }

  ion-tab-button {
    background: var(--ion-color-secondary-container);
    color: var(--ion-color-medium-contrast);
    padding-bottom: 5px;
    --ripple-color: transparent;

    &.tab-selected,
    &.ion-activated {
      ion-icon {
        background: var(--ion-color-secondary-shade);
      }
    }
  }

  ion-icon {
    font-size: 20px;
    margin-bottom: 4px;
    height: 20px;
    padding: 6px 0;
    width: 64px;
    border-radius: 20px;
    color: var(--ion-color-medium-contrast);
    transition: background 0.3s ease;
    --ionicon-stroke-width: 48px;
  }
}
</style>
