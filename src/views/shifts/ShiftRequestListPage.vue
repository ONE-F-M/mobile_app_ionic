<script setup>
import {
  IonButton,
  IonContent,
  IonPage,
  IonText,
  IonSegment,
  IonSegmentButton,
  IonRow,
  IonLabel,
  IonModal,
  useIonRouter,
  onIonViewWillEnter,
  IonInput,
  IonCol,
  IonCheckbox,
  IonSpinner,
} from "@ionic/vue";
import LeavesHeader from "@/components/leaves/Header.vue";
import { computed, ref, shallowRef } from "vue";

import IconPlus from "@/components/icon/Plus.vue";
import ArrowRight from "@/components/icon/ArrowRight.vue";
import IconAccountClock from "@/components/icon/AccountClock.vue";
import IconCheck from "@/components/icon/Check.vue";
import IconClose from "@/components/icon/Close.vue";
import IconBlock from "@/components/icon/Block.vue";

import { useUserStore } from "@/store/user.js";
import { useCustomToast } from "@/composable/toast.js";
import { useLangStore } from "@/store/lang.js";
import useDateHelper from "@/composable/useDateHelper";
import Datepicker from "@/components/base/Datepicker.vue";

import shiftsApi from "@/api/shifts.ts";

const router = useIonRouter();
const userStore = useUserStore();
const { formatDate, dayjs } = useDateHelper();
const langStore = useLangStore();
const { showErrorToast } = useCustomToast();

const SHIFT_RESPONSE_TYPE = {
  MY_SHIFT: "my_shifts",
  REPORTS_TO: "reports_to",
};

const showTypeShifts = ref(SHIFT_RESPONSE_TYPE.MY_SHIFT);
const openFilter = ref(false);
const isFromDatePickerOpen = shallowRef(false);
const isToDatePickerOpen = shallowRef(false);
const isLoading = ref(false);

const selectedDates = ref({
  start: dayjs().subtract(12, 'month').toDate(),
  end: dayjs().add(1, 'year').toDate()
});

const purposes = ["Assign Day Off", "Day Off Overtime"];
const selectedPurposes = ref([]);

const myShifts = ref([]);
const shiftsReportsTo = ref([]);

const fetchShiftRequests = async () => {
  try {
    isLoading.value = true;
    const { data } = await shiftsApi.getShiftsList({
      employee_id: userStore.user?.employee_id,
      from_date: dayjs(selectedDates.value.start).format("YYYY-MM-DD"),
      to_date: dayjs(selectedDates.value.end).format("YYYY-MM-DD"),
    });

    if (data && data.status_code === 200) {
      myShifts.value = data.data.my_shifts || [];
      shiftsReportsTo.value = data.data.reports_to || [];
    }
  } catch (error) {
    const errorData = error?.data || {};
    showErrorToast(
      errorData.message || "Failed to fetch shift requests",
      errorData.error,
      errorData.status_code
    );
  } finally {
    isLoading.value = false;
  }
};

const shifts = computed(() => {
  if (showTypeShifts.value === SHIFT_RESPONSE_TYPE.MY_SHIFT) {
    return [...myShifts.value];
  }
  return [...shiftsReportsTo.value];
});

const filteredShifts = computed(() => {
  return shifts.value.filter(shift => {
    const matchesPurpose = selectedPurposes.value.length === 0 || selectedPurposes.value.includes(shift.purpose);
    return matchesPurpose;
  });
});

const togglePurpose = (purpose) => {
  const index = selectedPurposes.value.indexOf(purpose);
  if (index > -1) {
    selectedPurposes.value.splice(index, 1);
  } else {
    selectedPurposes.value.push(purpose);
  }
};

const resetFilters = () => {
  selectedPurposes.value = [];
  selectedDates.value = {
    start: dayjs().subtract(12, 'month').toDate(),
    end: dayjs().add(1, 'year').toDate(),
  };
};

const applyFilters = async () => {
  openFilter.value = false;
  await fetchShiftRequests();
};

const triggerBack = () => {
  router.push("/dashboard");
};


const formatDateToDisplay = (date, format = "DD-MM-YYYY") => {
  return dayjs(date, "YYYY-MM-DD").format(format);
};

onIonViewWillEnter(async () => {
  await fetchShiftRequests();
});
</script>

<template>
  <ion-page>
    <ion-content class="ion-padding shifts-page">
      <LeavesHeader
        class="shifts-page-header"
        :title="$t('user.shifts.shifts')"
        show-filter-button
        @open-filters="openFilter = true"
        @click-back="triggerBack"
      />

      <div class="shifts-page-switcher-wrapper">
        <ion-segment
          class="shifts-page-switcher"
          v-model="showTypeShifts"
        >
          <ion-segment-button
            class="shifts-page-switcher-button"
            value="my_shifts"
          >
            <ion-label class="shifts-page-switcher-button-label">
              <IconCheck class="shifts-page-my-shifts-icon" />
              {{ $t("user.shifts.my_shifts") }}
            </ion-label>
          </ion-segment-button>
          <ion-segment-button
            class="shifts-page-switcher-button"
            value="reports_to"
          >
            <ion-label class="shifts-page-switcher-button-label"
              >{{ $t("user.shifts.reports_to") }}
            </ion-label>
          </ion-segment-button>
        </ion-segment>
      </div>

      <div class="shifts-wrapper">
        <div v-if="isLoading" class="ion-text-center ion-padding">
          <ion-spinner name="crescent"></ion-spinner>
        </div>
        <ion-row
          v-else
          v-for="shift in filteredShifts"
          :key="shift.name"
          @click="router.push(`/shifts/${shift.name}`)"
          class="shifts ion-align-items-center ion-justify-content-between"
        >
          <ion-row class="shifts-content ion-align-items-center">
            <ion-col size="3">
              <div class="shifts-icon-wrapper">
                <IconAccountClock
                  v-if="['Draft', 'Open', 'Pending', 'Pending Approval'].includes(shift.workflow_state)"
                  class="shifts-icon shifts-status__Open"
                />
                <IconCheck
                  v-else-if="shift.workflow_state === 'Approved'"
                  class="shifts-icon shifts-status__Approved"
                />
                <IconClose
                  v-else-if="shift.workflow_state === 'Rejected'"
                  class="shifts-icon shifts-status__Rejected"
                />
                <IconBlock
                  v-else
                  class="shifts-icon shifts-status__Cancelled"
                />
                <p class="shifts-purpose-small">
                  {{ $t(`user.shifts.card.purpose.${shift.purpose.toLowerCase().replaceAll(" ", "_")}`) }}
                </p>
              </div>
            </ion-col>
            <div class="shifts-content-wrapper">
              <p class="shifts-label-white">
                <span :class="`shifts-status__${shift.workflow_state}`">{{
                  $t(`user.shifts.card.status.${shift.workflow_state.toLowerCase()}`)
                }}</span>
                - {{ shift.name }}
              </p>
              <p class="shifts-label-white">
                <span class="shifts-label">{{ $t("user.shifts.purpose") }}:</span>
                {{ $t(`user.shifts.card.purpose.${shift.purpose.toLowerCase().replaceAll(" ", "_")}`) }}
              </p>
              <p class="shifts-label-white">
                <span class="shifts-label">{{ $t("user.shifts.card.start_date") }}:</span>
                {{ formatDateToDisplay(shift.from_date) }}
              </p>
              <p
                v-if="showTypeShifts === SHIFT_RESPONSE_TYPE.REPORTS_TO"
                class="shifts-label-white"
              >
                {{ shift.employee_name }}
              </p>
            </div>
          </ion-row>
          <ion-button fill="clear" class="shifts-redirect-button">
            <ArrowRight />
          </ion-button>
        </ion-row>
      </div>

      <ion-button class="shifts-add-button" @click="router.push('/shifts/add')">
        <IconPlus />
        <ion-text>
          <p class="shifts-add-button-label">
            {{ $t("user.shifts.apply_shift") }}
          </p>
        </ion-text>
      </ion-button>

      <ion-modal
        :is-open="openFilter"
        :initial-breakpoint="0.85"
        class="shifts-filter-modal"
        :breakpoints="[0, 0.85]"
        @didDismiss="openFilter = false"
      >
        <div class="shifts-filter-modal-content">
          <ion-row class="ion-justify-content-between ion-align-items-center">
            <ion-row class="ion-align-items-center">
              <ion-button
                fill="clear"
                color="light"
                class="shifts-filter-modal-close-button"
                @click="openFilter = false"
              >
                <IconClose />
              </ion-button>
              <p>{{ $t("utils.filter") }}</p>
            </ion-row>
            <ion-button fill="clear" @click="resetFilters">
              {{ $t("utils.reset") }}
            </ion-button>
          </ion-row>

          <ion-row class="ion-margin-top">
            <ion-col size="6">
              <p class="shifts-filter-label">{{ $t("user.shifts.from_date") }}</p>
              <ion-input
                fill="outline"
                readonly
                :value="formatDate(selectedDates.start, 'DD-MM-YYYY')"
                @ion-focus="isFromDatePickerOpen = true"
              />
            </ion-col>
            <ion-col size="6">
              <p class="shifts-filter-label">{{ $t("user.shifts.to_date") }}</p>
              <ion-input
                fill="outline"
                readonly
                :value="formatDate(selectedDates.end, 'DD-MM-YYYY')"
                @ion-focus="isToDatePickerOpen = true"
              />
            </ion-col>
          </ion-row>

          <Datepicker
            :lang="langStore.lang"
            :is-open="isFromDatePickerOpen"
            v-model="selectedDates.start"
            @cancel="isFromDatePickerOpen = false"
            @ok="isFromDatePickerOpen = false"
          />
          <Datepicker
            :lang="langStore.lang"
            :is-open="isToDatePickerOpen"
            v-model="selectedDates.end"
            @cancel="isToDatePickerOpen = false"
            @ok="isToDatePickerOpen = false"
          />

          <div class="ion-margin-top">
            <p class="shifts-filter-checkbox-list-title">{{ $t("user.shifts.purpose") }}</p>
            <div class="shifts-filter-checkbox-list">
              <ion-checkbox
                v-for="purpose in purposes"
                :key="purpose"
                :checked="selectedPurposes.includes(purpose)"
                @ionChange="togglePurpose(purpose)"
              >
                {{ $t(`user.shifts.card.purpose.${purpose.toLowerCase().replaceAll(" ", "_")}`) }}
              </ion-checkbox>
            </div>
          </div>

          <ion-button expand="block" shape="round" class="ion-margin-top" @click="applyFilters">
            {{ $t("utils.apply") }}
          </ion-button>
        </div>
      </ion-modal>
    </ion-content>
  </ion-page>
</template>

<style scoped lang="scss">
.shifts-page {
  --padding-top: 0;
  --padding-bottom: 24px;
  --padding-start: 0;
  --padding-end: 0;

  &-header {
    position: sticky;
    top: 0;
    padding: 0 15px;
    z-index: 10;
    background: #191c1d;
  }

  &-switcher {
    margin-top: 20px;
    border: 2px solid #8b9298;
    border-radius: 100px;

    &-button {
      --padding-top: 0;
      --padding-bottom: 0;
      --padding-start: 0;
      --padding-end: 0;

      --margin-top: 0;
      --margin-bottom: 0;
      --margin-start: 0;
      --margin-end: 0;

      --indicator-height: 0;

      --color: #e0e3e3;

      min-height: 40px;

      &.segment-button-checked {
        --color-checked: #d1e5f3;
        background: #364955;
      }

      &:first-child {
        border-right: 2px solid #8b9298;
        border-bottom: 0 !important;
        border-top-right-radius: 0;
        border-bottom-right-radius: 0;
      }

      &:last-child {
        border-top-left-radius: 0;
        border-bottom-left-radius: 0;
      }

      &-label {
        margin: 0;
        display: flex;
        gap: 8px;
        align-items: center;
        font-size: 0.875rem;
        line-height: 1.25rem;
        font-weight: 500;
        text-transform: none;
      }

      &::part(indicator) {
        height: 20px;
      }
    }
  }

  &-switcher-wrapper {
    padding: 0 15px;
  }

  &-my-shifts-icon {
    width: 18px;
    height: 18px;
  }
}

.shifts-wrapper {
  margin-top: 26px;
}

.shifts {
  border-bottom: 1px solid var(--ion-color-medium-shade);
  padding: 12px 8px;
  margin-bottom: 4px;
  gap: 12px;
  flex-wrap: nowrap;

  &-icon-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  &-icon {
    width: 40px;
    height: 40px;
  }

  &-purpose-small {
    margin: 4px 0 0;
    font-size: 0.7rem;
    line-height: 1rem;
    color: #b5c9d7;
    font-weight: 500;
  }

  .shifts-content {
    flex-wrap: nowrap;
    gap: 12px;
    flex-grow: 1;
  }

  .shifts-label {
    font-size: 0.75rem;
    color: #8b9298;
    &-white {
      margin: 4px 0 0;
      &:first-child {
        margin-top: 0;
      }
      font-size: 0.75rem;
      color: #e0e3e3;
    }
  }

  &-redirect-button {
    --color: #d9d9d9;
  }
}

.shifts-status__Open, .shifts-status__Draft, .shifts-status__Pending {
  color: #76d1ff;
}
.shifts-status__Approved {
  color: #52e169;
}
.shifts-status__Rejected {
  color: #ffb4a9;
}
.shifts-status__Cancelled {
  color: #8b9298;
}

.shifts-add-button {
  position: fixed;
  bottom: calc(24px + env(safe-area-inset-bottom));
  right: 16px;
  z-index: 10;
  --background: #004c69;
  --color: #c1e8ff;
  --border-radius: 16px;
  --padding-end: 20px;
  font-weight: 500;

  &-label {
    margin: 16px 0 16px 12px;
  }
}

.shifts-filter-modal {
  &::part(content) {
    border-radius: 28px 28px 0 0;
    background: #1e2529;
  }
  &-content {
    padding: 16px;
  }
  &-close-button {
    --padding-start: 0;
  }
}

.shifts-filter-label {
  color: #c0c7cd;
  font-size: 0.875rem;
  margin-bottom: 8px;
}

.shifts-filter-checkbox-list-title {
  margin: 16px 0 8px;
  color: #e0e3e3;
}

.shifts-filter-checkbox-list {
  display: flex;
  flex-direction: column;
  ion-checkbox {
    padding: 12px 0;
  }
}
</style>
