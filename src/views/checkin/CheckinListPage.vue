<script setup async>
import {
  IonContent,
  IonButton,
  IonText,
  IonPage,
  IonCol,
  IonRow,
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
import { useLangStore } from "@/store/lang.js";
import { Geolocation } from "@capacitor/geolocation";
import { useI18n } from "vue-i18n";
import Datepicker from "@/components/base/Datepicker.vue";

const { dayjs, formatDate } = useDateHelper();
const langStore = useLangStore();

const router = useIonRouter();
const userStore = useUserStore();
const { showErrorToast } = useCustomToast();

const checkInList = ref([]);
const isOpenDatePicker = ref(false);

const logType = ref("");
const coordinates = ref("");
const printCurrentPosition = async () => {
  coordinates.value = await Geolocation.getCurrentPosition({
    enableHighAccuracy: true,
  });
};
const getSiteLocation = async () => {
  try {
    const { data } = await checkin.getSiteLocation({
      employee_id: userStore.user?.employee_id,
      latitude: coordinates.value?.coords?.latitude,
      longitude: coordinates.value?.coords?.longitude,
    });

    logType.value = data.data.log_type;
  } catch (error) {
    // do nothing, expected
  }
};

const dateRange = ref({
  start: new Date(),
  end: new Date(),
});

const openDatePicker = () => {
  isOpenDatePicker.value = true;
};

const fetchCheckinList = async (defaults = {}) => {
  try {
    const { data } = await checkin.getCheckinList({
      employee_id: userStore.user?.employee_id,
      from_date: dayjs(dateRange.value.start).format("YYYY-MM-DD"),
      to_date: dayjs(dateRange.value.end).format("YYYY-MM-DD"),
      ...defaults,
    });

    checkInList.value = data.data;
  } catch (error) {
    showErrorToast(error.data?.error?.message || error.data?.error);
    checkInList.value = [];
  } finally {
    isOpenDatePicker.value = false;
  }
};

const { t } = useI18n();
onIonViewWillEnter(async () => {
  await fetchCheckinList({
    from_date: dayjs(0).format("YYYY-MM-DD"),
    to_date: dayjs(new Date()).format("YYYY-MM-DD"),
  });

  dateRange.value.start = new Date();
  dateRange.value.end = new Date();

  try {
    await printCurrentPosition();
  } catch (e) {
    showErrorToast(t("user.checkin.geolocation.title"));
    return;
  }

  await getSiteLocation();
});
</script>

<template>
  <ion-page>
    <ion-content class="checkin-page">
      <CheckinHeader
        class="checkin-page-header"
        @open-date-picker="openDatePicker"
      />

      <div class="checkin-page-table-wrapper">
        <ion-row>
          <ion-col class="checkin-page-table-label">Employee Name</ion-col>
          <ion-col size="auto" class="align-cols-end checkin-page-table-label"
            >Date/Time</ion-col
          >
          <ion-col size="3" class="align-cols-end checkin-page-table-label"
            >Status</ion-col
          >
        </ion-row>

        <div class="checkin-page-table-content-wrapper">
          <ion-row
            v-for="check in checkInList"
            :key="check.name"
            class="checkin-page-table-content-row"
          >
            <ion-col>
              <div class="checkin-page-name-wrapper">
                <p class="checkin-page-name">{{ check.employee_name }}</p>
                <p class="checkin-page-duration">
                  {{ dayjs(check.time).locale(langStore.lang).toNow(true) }}
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
      </div>

      <Datepicker
        :lang="langStore.lang"
        :is-open="isOpenDatePicker"
        v-model="dateRange"
        @cancel="isOpenDatePicker = false"
        @ok="() => fetchCheckinList()"
      />

      <ion-button
        class="checkin-add-button"
        @click="router.push('/checkin/geolocation')"
      >
        <IconPlus />
        <ion-text>
          <p class="checkin-add-button-label">
            {{
              logType === "IN"
                ? $t("user.checkin.checkin")
                : $t("user.checkin.checkout")
            }}
          </p>
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

  &-table-wrapper {
    margin: 22px -4px 0;
  }

  &-table-content-wrapper {
    margin-top: 6px;
  }

  &-table-content-row {
    margin-bottom: 2px;
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
    color: #e0e3e3;
  }

  &-duration {
    font-size: 0.75rem;
    line-height: 1rem;
    color: #8b9298;
  }

  &-date,
  &-time {
    font-size: 0.75rem;
    line-height: 1rem;
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
  z-index: 10;
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
