<script setup>
import { IonContent, IonPage, onIonViewWillEnter } from "@ionic/vue";

import BellIcon from "@/components/icon/BellIcon.vue";
import Header from "@/components/Header.vue";
import { useCustomToast } from "@/composable/toast";
import profile from "@/api/profile";
import { useUserStore } from "@/store/user.js";
import { storeToRefs } from "pinia";
import { ref } from "vue";
import useDateHelper from "@/composable/useDateHelper";

const { showErrorToast } = useCustomToast();
const userStore = useUserStore();
const { user } = storeToRefs(userStore);

const { formatDate } = useDateHelper();

const notifications = ref([]);

const fetchNotifications = async () => {
  try {
    const { data } = await profile.getNotifications({
      employee_id: user.value?.employee_id,
    });

    notifications.value = data.data.map((notification) => ({
      name: notification.title,
      time: notification.time,
      content: notification.body,
    }));
  } catch (error) {
    console.error(error);
    showErrorToast(`${error.data.status_code} ${error.data.message} ${error.data.error}`);
  }
};

onIonViewWillEnter(async () => {
  await fetchNotifications();
});
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

              <span class="body-small notification-time">{{
                `${formatDate(notification.time, "D MMM")} at ${formatDate(notification.time, "h:mm A")}`
              }}</span>
            </div>
            <p class="body-medium notification-content">
              {{ notification.content }}
            </p>
          </div>
        </template>
      </div>
    </ion-content>
  </ion-page>
</template>

<style lang="scss" scoped>
.content {
  --padding-top: 0;
  --padding-bottom: 24px;
  --padding-start: 15px;
  --padding-end: 15px;
}

.notifications-wrapper {
  margin-top: 6px;
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
	    font-weight: 400;
      gap: 12px;
    }

    .bell-icon {
      font-size: 20px;
    }
  }

  .notification-time {
    color: var(--ion-color-medium-contrast);
    margin-left: 8px;
	  font-weight: 300;
    text-wrap: nowrap;
  }

  .notification-content {
    color: var(--ion-color-dark-contrast);
	  font-weight: 300;
    margin: 6px 0;
  }
}
</style>
