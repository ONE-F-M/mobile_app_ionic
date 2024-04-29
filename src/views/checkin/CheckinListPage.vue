<script setup async>
import {
  IonContent,
  IonButton,
  IonText,
  IonPage,
  useIonRouter,
  onIonViewWillEnter,
} from "@ionic/vue";

import IconPlus from "@/components/icon/Plus.vue";
import CheckinHeader from "@/components/checkin/Header.vue";
import checkin from "@/api/checkin";
import { useUserStore } from "@/store/user.js";
import { ref } from "vue";
import { useCustomToast } from "@/composable/toast.js";
import useDateHelper from "@/composable/useDateHelper";

const { dayjs, formatDate } = useDateHelper();

const router = useIonRouter();
const userStore = useUserStore();
const { showErrorToast } = useCustomToast();

const checkInList = ref([]);

const fetchCkeckinList = async () => {
  try {
    const { data } = await checkin.getCheckinList({
      employee_id: userStore.user?.employee_id,
      from_date: "",
      to_date: "",
    });

    checkInList.value = data.data;
  } catch (error) {
    showErrorToast(error.data?.error?.message || error.data?.error);
    checkInList.value = [];
  }
};

onIonViewWillEnter(async () => {
  await fetchCkeckinList();
});
</script>

<template>
  <ion-page>
    <ion-content class="checkin-page">
      <CheckinHeader class="checkin-page-header" />

      <div>
        <ion-row>
          <ion-col class="checkin-page-table-label">Employee Name</ion-col>
          <ion-col size="auto" class="align-cols-end checkin-page-table-label"
            >Date/Time</ion-col
          >
          <ion-col size="3" class="align-cols-end checkin-page-table-label"
            >Status</ion-col
          >
        </ion-row>

        <ion-row v-for="check in checkInList" :key="check.name">
          <ion-col>
            <div class="checkin-page-name-wrapper">
              <p class="checkin-page-name">{{ check.employee_name }}</p>
              <p class="checkin-page-duration">
                {{ dayjs(check.time).toNow(true) }}
              </p>
            </div>
          </ion-col>
          <ion-col size="auto" class="align-cols-end">
            <div>
              <p class="checkin-page-date">
                {{ formatDate(check.time, "DD/MM/YY") }}
              </p>
              <p class="checkin-page-time">
                {{ formatDate(check.time, "hh:mm A") }}
              </p>
            </div>
          </ion-col>
          <ion-col size="3" class="align-cols-end">
            <div
              class="checkin-page-status"
              :class="`checkin-page-status-${check.log_type}`"
            >
              {{ check.log_type }}
            </div>
          </ion-col>
        </ion-row>
      </div>

      <ion-button
        class="checkin-add-button"
        @click="router.push('/checkin/geolocation')"
      >
        <IconPlus />
        <ion-text>
          <p class="checkin-add-button-label">Checkin</p>
        </ion-text>
      </ion-button>
    </ion-content>
  </ion-page>
</template>

<style lang="scss" scoped>
p {
  margin: 0;
}
.checkin-page {
  position: relative;
  --padding-top: 0;
  --padding-bottom: 24px;
  --padding-start: 15px;
  --padding-end: 15px;

  &-header {
    position: sticky;
    top: 0;
    z-index: 1;
    background: #191c1d;
  }

  &-table-label {
    font-size: 0.875rem;
    line-height: 1.25rem;
    font-weight: 600;
    color: #8b9298;
  }

  &-name {
    font-size: 0.875rem;
    line-height: 1.25rem;
    font-weight: 600;
    color: #e0e3e3;
  }

  &-duration {
    margin-top: 4px;
    font-size: 0.75rem;
    line-height: 1rem;
    font-weight: 500;
    color: #8b9298;
  }

  &-date,
  &-time {
    font-size: 0.75rem;
    line-height: 1rem;
    font-weight: 500;
    color: #c0c7cd;
  }

  &-status {
    width: min(55px, 100%);
    height: max-content;
    display: flex;
    padding: 8px 4px;
    justify-content: center;
    align-items: center;
    border-radius: 4px;

    text-align: center;

    font-size: 0.75rem;
    line-height: 1rem;
    font-weight: 600;

    &-IN {
      background: #52e169;
      color: #00390c;
    }

    &-OUT {
      background: #ffb3ac;
      color: #68000a;
    }
  }
}

.checkin-add-button {
  position: fixed;
  bottom: 24px;
  right: 16px;
  --background: #004c69;
  --background-hover: #014662;
  --background-activated: #004d6c;
  --background-focused: #004969;
  --color: #c1e8ff;
  --border-radius: 16px;
  --padding-end: 20px;

  font-size: 0.875rem;
  line-height: 1.25rem;
  font-weight: 500;

  &-label {
    margin: 16px 0 16px 12px;
  }
}

.align-cols-end {
  display: flex;
  justify-content: flex-end;
}
</style>
