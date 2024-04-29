<script setup async>
import {
  IonContent,
  IonButton,
  IonText,
  IonPage,
  IonCol,
  IonRow,
  IonDatetime,
  useIonRouter,
  onIonViewWillEnter,
  IonModal,
} from "@ionic/vue";

import IconPlus from "@/components/icon/Plus.vue";
import IconEdit from "@/components/icon/Edit.vue";
import CheckinHeader from "@/components/checkin/Header.vue";
import checkin from "@/api/checkin";
import { useUserStore } from "@/store/user.js";
import { onMounted, ref } from "vue";
import { useCustomToast } from "@/composable/toast.js";
import useDateHelper from "@/composable/useDateHelper";
import { useLangStore } from "@/store/lang.js";

const { dayjs, formatDate } = useDateHelper();
const langStore = useLangStore();

const router = useIonRouter();
const userStore = useUserStore();
const { showErrorToast } = useCustomToast();

const checkInList = ref([]);
const isOpenDatePicker = ref(false);

const selectedDate = ref(new Date().toISOString());
const today = ref(new Date().toISOString());

const openDatePicker = () => {
  isOpenDatePicker.value = true;
};

const clickOnDatePicker = (event) => {
  console.log("event target", event);
};

const fetchCkeckinList = async () => {
  try {
    const { data } = await checkin.getCheckinList({
      employee_id: userStore.user?.employee_id,
      from_date: dayjs(selectedDate.value).format("YYYY-MM-DD"),
      to_date: dayjs(selectedDate.value).format("YYYY-MM-DD"),
    });

    checkInList.value = data.data;
  } catch (error) {
    showErrorToast(error.data?.error?.message || error.data?.error);
    checkInList.value = [];
  } finally {
    isOpenDatePicker.value = false;
  }
};

onIonViewWillEnter(async () => {
  await fetchCkeckinList();
});

let monthPicker;

onMounted(() => {});
</script>

<template>
  <ion-page>
    <ion-content class="checkin-page">
      <CheckinHeader
        class="checkin-page-header"
        @open-date-picker="openDatePicker"
      />

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

      <ion-modal class="ckeckin-datepicker-modal" :is-open="isOpenDatePicker">
        <ion-row
          class="ckeckin-datepicker-wrapper ion-align-items-center ion-justify-content-center"
        >
          <div class="ckeckin-datepicker-card">
            <div class="ckeckin-datepicker-card-header-wrapper">
              <div class="ckeckin-datepicker-card-title">
                {{ $t("utils.select_date") }}
              </div>
              <ion-row
                class="ion-justify-content-between ion-align-items-center"
              >
                <h3 class="ckeckin-datepicker-card-header">
                  {{ formatDate(selectedDate, "ddd, MMM D") }}
                </h3>
                <ion-button class="ckeckin-datepicker-edit-button" fill="clear">
                  <IconEdit />
                </ion-button>
              </ion-row>
            </div>
            <ion-datetime
              v-model="selectedDate"
              class="ckeckin-datepicker-single"
              :locale="langStore.lang"
              :max="today"
              presentation="date"
              @click="clickOnDatePicker"
            />
            <ion-row
              class="ion-justify-content-end ckeckin-datepicker-card-footer-wrapper"
            >
              <ion-button fill="clear" @click="isOpenDatePicker = false">{{
                $t("utils.cancel")
              }}</ion-button>
              <ion-button fill="clear" @click="fetchCkeckinList">
                {{ $t("utils.ok") }}
              </ion-button>
            </ion-row>
          </div>
        </ion-row>
      </ion-modal>

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

.ckeckin-datepicker-modal {
  --background: transperent;
}

.ckeckin-datepicker-wrapper {
  height: 100%;
}

.ckeckin-datepicker-card {
  margin: 8px 20px;
  width: 100%;
  background: #233036;
  border-radius: 28px;

  .ckeckin-datepicker-single {
    --background: transperent;
    --wheel-fade-background-rgb: transperent;

    &::part(wheel-item) {
      font-weight: 300 !important;
    }
  }

  .ckeckin-datepicker-edit-button {
    --padding-bottom: 8px;
    --padding-end: 8px;
    --padding-start: 8px;
    --padding-top: 8px;
    --color: #c0c7cd;
  }

  &-title {
    font-size: 0.75rem;
    line-height: 1rem;
    color: #c0c7cd;
    font-weight: 500;
    font-family: "Roboto", sans-serif;
  }
  &-header {
    font-size: 2rem;
    line-height: 2.5rem;
    color: #e0e3e3;
    font-weight: 400;
    font-family: "Roboto", sans-serif;
  }

  &-header-wrapper {
    border-bottom: 1px solid #8b9298;
    padding: 18px 16px 0;
  }

  &-footer-wrapper {
    padding: 0 16px 10px;
  }
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
