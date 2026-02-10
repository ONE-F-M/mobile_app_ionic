<script setup>
import {
  IonContent,
  IonButton,
  IonText,
  IonPage,
  IonCol,
  IonRow,
  IonSkeletonText,
  useIonRouter,
  onIonViewWillEnter,
} from "@ionic/vue";

import IconPlus from "@/components/icon/Plus.vue";
import CheckinHeader from "@/components/checkin/Header.vue";
import checkin from "@/api/checkin";
import { useUserStore } from "@/store/user.js";
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useCustomToast } from "@/composable/toast.js";
import useDateHelper from "@/composable/useDateHelper";
import { useLangStore } from "@/store/lang.js";
import { Geolocation } from "@capacitor/geolocation";
import { useI18n } from "vue-i18n";
import Datepicker from "@/components/base/Datepicker.vue";
import { App } from '@capacitor/app';

const { dayjs, formatDate } = useDateHelper();
const langStore = useLangStore();
const router = useIonRouter();
const userStore = useUserStore();
const { showErrorToast } = useCustomToast();
const { t } = useI18n();

// State
const checkInList = ref([]);
const isListLoading = ref(true);
const isOpenDatePicker = ref(false);

const currentShifts = ref([]);
const isDeterminingLocation = ref(false);
const availableShifts = computed(() =>
  currentShifts.value.filter((shift) => !shift?.is_completed)
);

const dateRange = ref({
  start: new Date(),
  end: new Date(),
});

// --- HELPER: Extract API Error Message ---
const getErrorMessage = (error) => {
  // 1. Check for specific backend 'error' field (e.g. "No employee record found")
  if (error?.data?.error) {
    return error.data.error;
  }
  // 2. Fallback to standard message (e.g. "Resource Not Found")
  if (error?.data?.message) {
    return error.data.message;
  }
  // 3. Fallback to generic error
  return "An unexpected error occurred.";
};

const fetchCheckinList = async (defaults = {}) => {
  const { isInitial, ...requestParams } = defaults;
  const isInitialLoad = isInitial;
  
  if (isInitialLoad && userStore.cachedCheckinList) {
    console.log("⚡ Instant Load from Cache");
    checkInList.value = userStore.cachedCheckinList;
    isListLoading.value = false;
  } else if (checkInList.value.length === 0) {
    isListLoading.value = true;
  }

  try {
    const { data } = await checkin.getCheckinList({
      employee_id: userStore.user?.employee_id,
      from_date: dayjs(dateRange.value.start).format("YYYY-MM-DD"),
      to_date: dayjs(dateRange.value.end).format("YYYY-MM-DD"),
      ...requestParams,
    });

    checkInList.value = data.data || [];

    // Always update cache on successful fetch to keep it fresh
    userStore.cachedCheckinList = data.data;
    userStore.lastCheckinFetch = Date.now();

  } catch (error) {
    const message = getErrorMessage(error);
    showErrorToast(message);
    if (checkInList.value.length === 0) {
        checkInList.value = [];
    }
  } finally {
    isListLoading.value = false;
    isOpenDatePicker.value = false;
  }
};

const refreshLocationAndShifts = async () => {
  if (isDeterminingLocation.value) return;
  isDeterminingLocation.value = true;
  
  try {
    const coordinates = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10000,
    });

    const { data } = await checkin.getSiteLocation({
      employee_id: userStore.user?.employee_id,
      latitude: coordinates.coords.latitude,
      longitude: coordinates.coords.longitude,
    });

    currentShifts.value = [];
    if (data.data.shift) currentShifts.value.push(data.data.shift);
    if (data.data.upcoming_shifts) currentShifts.value.push(...data.data.upcoming_shifts);

  } catch (error) {
    // 1. Handle Device GPS Errors
    if (error.code === 1 || error.message?.includes('location')) {
       showErrorToast(t("user.checkin.geolocation.title"));
    } 
    // 2. Handle Backend API Errors (Logic Fix)
    else {
       const message = getErrorMessage(error);
       showErrorToast(message);
    }
    currentShifts.value = [];
  } finally {
    isDeterminingLocation.value = false;
  }
};

// --- Lifecycle ---

onIonViewWillEnter(() => {
  dateRange.value.start = new Date();
  dateRange.value.end = new Date();

  fetchCheckinList({
    from_date: dayjs().subtract(6, 'month').format("YYYY-MM-DD"),
    to_date: dayjs(new Date()).format("YYYY-MM-DD"),
    isInitial: true
  });
  
  refreshLocationAndShifts();
});

onMounted(() => {
  App.addListener('appStateChange', async ({ isActive }) => {
    if (isActive) {
      fetchCheckinList({
        from_date: dayjs().subtract(6, 'month').format("YYYY-MM-DD"),
        to_date: dayjs(new Date()).format("YYYY-MM-DD"),
        isInitial: true
      });
      refreshLocationAndShifts();
    }
  });
});

onBeforeUnmount(() => {
  App.removeAllListeners();
});

const openDatePicker = () => {
  isOpenDatePicker.value = true;
};
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
          <ion-col class="checkin-page-table-label">{{ $t("user.checkin.employee_name") }}</ion-col>
          <ion-col size="auto" class="align-cols-end checkin-page-table-label">
            {{ $t("user.checkin.date_time") }}
          </ion-col>
          <ion-col size="3" class="align-cols-end checkin-page-table-label">
            {{ $t("user.checkin.status") }}
          </ion-col>
        </ion-row>

        <div class="checkin-page-table-content-wrapper">
          <div v-if="isListLoading">
             <ion-row v-for="n in 5" :key="n" class="checkin-page-table-content-row ion-padding-vertical">
               <ion-col><ion-skeleton-text animated style="width: 80%"></ion-skeleton-text></ion-col>
               <ion-col size="auto"><ion-skeleton-text animated style="width: 60px"></ion-skeleton-text></ion-col>
               <ion-col size="3"><ion-skeleton-text animated style="width: 100%"></ion-skeleton-text></ion-col>
             </ion-row>
          </div>

          <template v-else>
            <ion-row
              v-for="check in checkInList"
              :key="check.name"
              class="checkin-page-table-content-row"
            >
              <ion-col>
                <div class="checkin-page-name-wrapper">
                  <p class="checkin-page-name">
                    {{ $i18n.locale === 'ar' ? check.employee_name_in_arabic: check.employee_name }}
                  </p>
                  <p class="checkin-page-duration">
                    {{ dayjs(check.time).locale(langStore.lang).toNow(true) }}
                  </p>
                </div>
              </ion-col>
              <ion-col size="auto" class="align-cols-end">
                <div>
                  <p class="checkin-page-date">{{ formatDate(check.time, "DD/MM/YY") }}</p>
                  <p class="checkin-page-time">{{ formatDate(check.time, "hh:mm A") }}</p>
                </div>
              </ion-col>
              <ion-col size="3" class="align-cols-end">
                <div
                  class="checkin-page-status"
                  :class="`checkin-page-status-${check.log_type}`"
                >
                  {{ check.log_type === "OUT" ? $t("user.checkin.out") : $t("user.checkin.in") }}
                </div>
              </ion-col>
            </ion-row>

            <div v-if="checkInList.length === 0" class="ion-text-center ion-padding">
              <p class="checkin-page-duration">No records found.</p>
            </div>
          </template>
        </div>
      </div>

      <Datepicker
        :lang="langStore.lang"
        :is-open="isOpenDatePicker"
        v-model="dateRange"
        @cancel="isOpenDatePicker = false"
        @ok="() => fetchCheckinList()"
      />

      <div class="checkin-add-buttons-wrapper">
        <ion-button v-if="isDeterminingLocation" class="checkin-add-button" disabled>
           <ion-text>Locating...</ion-text>
        </ion-button>

        <template v-else>
          <ion-button
            v-for="(shift, index) in availableShifts"
            :key="index"
            class="checkin-add-button"
            @click="router.push({ path: '/checkin/geolocation', query: { shift: shift.name, log_type: shift.log_type } })"
          >
            <IconPlus />
            <ion-text>
              <p class="checkin-add-button-label">
                {{ shift.log_type === "OUT" ? $t("user.checkin.checkout") : $t("user.checkin.checkin") }} 
                ({{ shift.roster_type }})
              </p>
            </ion-text>
          </ion-button>
        </template>
      </div>

    </ion-content>
  </ion-page>
</template>

<style lang="scss" scoped>
/* Kept all your existing styles exactly as they were */
p { margin: 0; }
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
  &-table-wrapper { margin: 22px -4px 0; }
  &-table-content-wrapper { margin-top: 6px; }
  &-table-content-row { margin-bottom: 2px; }
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
  &-date, &-time {
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

    &-IN { background: #52e169; color: #00390c; }
    &-OUT { background: #ffb3ac; color: #68000a; }
  }
}

.checkin-add-buttons-wrapper {
  position: fixed;
  bottom: 24px;
  right: 16px;
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: flex-end;
}

.checkin-add-button {
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
  &-label { margin: 16px 0 16px 12px; }
}

.align-cols-end {
  display: flex;
  justify-content: flex-end;
}
</style>