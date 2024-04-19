<script setup>
import {
  IonCol,
  IonContent,
  IonPage,
  IonRow,
  IonIcon,
} from "@ionic/vue";

import BellIcon from "@/components/icon/BellIcon.vue";

import Header from "@/components/Header.vue";

const notifications = [
  {
    name: "Notification Name",
    time: "7 Jul at 12:00 PM",
    content: "It is a long established fact that a reader will be by distracted by the readable"
  },
  {
    name: "Notification Name",
    time: "7 Jul at 12:00 PM",
    content: "It is a long established fact that a reader will be by distracted by the readable"
  },
  {
    name: "Notification Name",
    time: "7 Jul at 12:00 PM",
    content: "It is a long established fact that a reader will be by distracted by the readable"
  },
]
</script>

<template>
  <ion-page>
    <ion-content class="ion-padding content">
      <Header>{{ $t("user.notification.title") }}</Header>

      <div class="notifications-wrapper">
        <template v-for="notification in notifications">
          <div class="notification">
            <div class="notification-header">
              <div class="notification-title">
                <BellIcon />
                <span class="label-large">{{ notification.name }}</span>
              </div>

              <span class="body-small notification-time">{{ notification.time }}</span>
            </div>
            <p class="body-medium notification-content">{{ notification.content }}</p>
          </div>
        </template>
      </div>
    </ion-content>

    <div class="pixel-perfect"></div>
  </ion-page>
</template>

<style lang="scss" scoped>
.content {
  background: var(--ion-color-dark);
}
.notifications-wrapper {
  margin-top: 10px;
}
.notification {
  border-bottom: 1px solid var(--ion-color-medium-shade);
  padding: 7px 0px 4px;
  margin-bottom: 4px;

  .notification-header {
    display: flex;
    justify-content: space-between;
    color: var(--ion-color-secondary);

    .notification-title {
      display: flex;
      gap: 12px;
    }

    .bell-icon {
      font-size: 20px;
    }
  }

  .notification-time {
    color: var(--ion-color-medium-contrast);
    margin-right: 4px;
  }

  .notification-content {
    color: var(--ion-color-dark-contrast);
    margin: 6px 0;
  }
}
</style>
