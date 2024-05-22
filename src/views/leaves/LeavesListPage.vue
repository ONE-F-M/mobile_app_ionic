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
} from "@ionic/vue";
import LeavesHeader from "@/components/leaves/Header.vue";
import { computed, nextTick, ref, shallowRef, watch } from "vue";

import IconPlus from "@/components/icon/Plus.vue";
import ArrowRight from "@/components/icon/ArrowRight.vue";
import IconCheck from "@/components/icon/Check.vue";
import IconClose from "@/components/icon/Close.vue";
import IconAccountClock from "@/components/icon/AccountClock.vue";
import IconVisibility from "@/components/icon/Visibility.vue";
import IconBlock from "@/components/icon/Block.vue";
import leave from "@/api/leave";
import dayjs from "dayjs";
import { useUserStore } from "@/store/user.js";
import { useCustomToast } from "@/composable/toast.js";
import { LEAVE_STATUS } from "@/types/enums";
import { useI18n } from "vue-i18n";

const router = useIonRouter();
const userStore = useUserStore();
const { showErrorToast } = useCustomToast();
const { t } = useI18n();

const LEAVE_RESPONSE_TYPE = {
  MY_LEAVE: "my_leaves",
  REPORTS_TO: "reports_to",
};

const showTypeLeaves = ref(LEAVE_RESPONSE_TYPE.MY_LEAVE);
const openFilter = ref(false);
const isOpenDatePicker = ref(false);

const leaveStatuses = [
  {
    label: t("user.leaves.card.status.approved"),
    value: `${LEAVE_STATUS.APPROVED}`,
  },
  {
    label: t("user.leaves.card.status.rejected"),
    value: `${LEAVE_STATUS.REJECTED}`,
  },
  {
    label: t("user.leaves.card.status.cancelled"),
    value: `${LEAVE_STATUS.CANCELLED}`,
  },
  {
    label: t("user.leaves.card.status.open"),
    value: `${LEAVE_STATUS.OPEN}`,
  },
];
const selectedLeaveStatus = ref("");
const showStatuses = shallowRef(true);
watch(selectedLeaveStatus, () => {
  showStatuses.value = false;
  nextTick(() => {
    showStatuses.value = true;
  });
});

const selectedLeaveType = ref("");
const showTypes = shallowRef(true);
watch(selectedLeaveType, () => {
  showTypes.value = false;
  nextTick(() => {
    showTypes.value = true;
  });
});
const leaveOptions = ref([]);
const fetchLeaveTypes = async () => {
  try {
    const { data } = await leave.types({
      employee_id: userStore.user?.employee_id,
    });

    leaveOptions.value = Object.keys(data.data) || [];
  } catch (error) {
    showErrorToast(error.data?.error?.message || error.data?.error);
  }
};

const myLeaves = ref([]);
const leavesReportsTo = ref([]);
const leaves = computed(() => {
  if (showTypeLeaves.value === LEAVE_RESPONSE_TYPE.MY_LEAVE) {
    return [...myLeaves.value];
  }

  return [...leavesReportsTo.value];
});
const formatDateToDisplay = (date, format = "DD-MM-YYYY") => {
  return dayjs(date, "YYYY-MM-DD").format(format);
};

const triggerBack = () => {
  router.push("/home");
};

const changeType = (e) => {
  showTypeLeaves.value = e.detail.value;
};
const onDismiss = () => {
  openFilter.value = false;
  fetchLeaves();
};
const closeModal = (e) => {
  if (e.detail.breakpoint === 0) {
    openFilter.value = false;
  }
};

const resetFilters = () => {
  selectedLeaveType.value = "";
  selectedLeaveStatus.value = "";
};

const setLeaveType = (event) => {
  if (event.detail.value === selectedLeaveType.value) {
    selectedLeaveType.value = "";
    return;
  }
  selectedLeaveType.value = event.detail.value;
};

const setLeaveStatus = (event) => {
  if (event.detail.value === selectedLeaveStatus.value) {
    selectedLeaveStatus.value = "";
    return;
  }
  selectedLeaveStatus.value = event.detail.value;
};

const dateRange = ref({
  // Means timestamp of zero, 1970-01-01
  start: 0,
  end: new Date(),
});
const fetchLeaves = async () => {
  try {
    const { data } = await leave.getLeavesList({
      employee_id: userStore.user?.employee_id,
      from_date: dayjs(dateRange.value.start).format("YYYY-MM-DD"),
      to_date: dayjs(dateRange.value.end).format("YYYY-MM-DD"),
      leave_type: selectedLeaveType.value,
      status: selectedLeaveStatus.value,
    });

    myLeaves.value = data.data.my_leaves || [];
    leavesReportsTo.value = data.data.reports_to || [];
  } catch (error) {
    showErrorToast(error.data?.error?.message || error.data?.error);
    myLeaves.value = [];
    leavesReportsTo.value = [];
  } finally {
    isOpenDatePicker.value = false;
  }
};

onIonViewWillEnter(async () => {
  await Promise.all([fetchLeaves(), fetchLeaveTypes()]);
});
</script>

<template>
  <ion-page>
    <ion-content class="ion-padding leaves-page">
      <LeavesHeader
        class="leaves-page-header"
        :title="$t('user.leaves.leaves')"
        show-filter-button
        @open-filters="openFilter = true"
        @click-back="triggerBack"
      />

      <div class="leaves-page-switcher-wrapper">
        <ion-segment
          class="leaves-page-switcher"
          :value="showTypeLeaves"
          @ionChange="changeType"
        >
          <ion-segment-button
            class="leaves-page-switcher-button"
            value="my_leaves"
          >
            <ion-label class="leaves-page-switcher-button-label">
              <IconCheck class="leaves-page-my-leaves-icon" />
              {{ $t("user.leaves.my_leaves") }}
            </ion-label>
          </ion-segment-button>
          <ion-segment-button
            class="leaves-page-switcher-button"
            value="reports_to"
          >
            <ion-label class="leaves-page-switcher-button-label"
              >{{ $t("user.leaves.reports_to") }}
            </ion-label>
          </ion-segment-button>
        </ion-segment>
      </div>

      <div class="leaves-wrapper">
        <ion-row
          v-for="leave in leaves"
          :key="leave.name"
          @click="router.push(`/leaves/${leave.name}`)"
          class="leaves ion-align-items-center ion-justify-content-between"
        >
          <ion-row class="leaves-content ion-align-items-center">
            <ion-col size="3">
              <div v-if="leave.workflow_state" class="leaves-icon-wrapper">
                <IconAccountClock
                  v-if="leave.workflow_state === LEAVE_STATUS.OPEN"
                  class="leaves-icon"
                  :class="`leaves-status__${leave.workflow_state}`"
                />
                <IconCheck
                  v-if="leave.workflow_state === LEAVE_STATUS.APPROVED"
                  class="leaves-icon"
                  :class="`leaves-status__${leave.workflow_state}`"
                />
                <IconClose
                  v-if="leave.workflow_state === LEAVE_STATUS.REJECTED"
                  class="leaves-icon"
                  :class="`leaves-status__${leave.workflow_state}`"
                />
                <IconVisibility
                  v-if="leave.workflow_state === LEAVE_STATUS.PENDING"
                  class="leaves-icon"
                  :class="`leaves-status__${leave.workflow_state}`"
                />
                <IconBlock
                  v-if="leave.workflow_state === LEAVE_STATUS.CANCELLED"
                  class="leaves-icon"
                  :class="`leaves-status__${leave.workflow_state}`"
                />
                <p class="leaves-type">
                  {{
                    $t(
                      `user.leaves.card.type.${leave.leave_type.toLowerCase().replaceAll(" ", "_")}`,
                    )
                  }}
                </p>
              </div>
            </ion-col>
            <div class="leaves-content-wrapper">
              <p class="leaves-label-white">
                <span :class="`leaves-status__${leave.workflow_state}`">{{
                  leave.workflow_state
                }}</span>
                - {{ leave.name }}
              </p>
              <p class="leaves-label-white">
                <span class="leaves-label"
                  >{{ $t("user.leaves.card.from") }}:</span
                >
                {{ formatDateToDisplay(leave.from_date) }}
                <span class="leaves-label"
                  >{{ $t("user.leaves.card.to") }}:</span
                >
                {{ formatDateToDisplay(leave.to_date) }}
              </p>
              <p class="leaves-label-white">
                <span class="leaves-label"
                  >{{ $t("user.leaves.card.date_posted") }}:</span
                >
                {{ formatDateToDisplay(leave.posting_date, "DD MMM, YYYY") }}
              </p>
              <p
                v-if="
                  leave.leave_approver_name &&
                  showTypeLeaves === LEAVE_RESPONSE_TYPE.MY_LEAVE
                "
                class="leaves-label-white"
              >
                <span class="leaves-label"
                  >{{ $t("user.leaves.card.approver") }}:</span
                >
                {{ leave.leave_approver_name }}
              </p>
              <p
                v-if="showTypeLeaves === LEAVE_RESPONSE_TYPE.REPORTS_TO"
                class="leaves-label-white"
              >
                {{ leave.employee_name }}
              </p>
            </div>
          </ion-row>
          <ion-button fill="clear" class="leaves-redirect-button">
            <ArrowRight />
          </ion-button>
        </ion-row>
      </div>

      <ion-button class="leaves-add-button" @click="router.push('/leaves/add')">
        <IconPlus />
        <ion-text>
          <p class="leaves-add-button-label">
            {{ $t("user.leaves.apply_leave") }}
          </p>
        </ion-text>
      </ion-button>

      <ion-modal
        :is-open="openFilter"
        :initial-breakpoint="0.85"
        class="leaves-filter-modal"
        :breakpoints="[0, 0.85]"
        @didDismiss="onDismiss"
        @ionBreakpointDidChange="closeModal"
      >
        <div class="leaves-filter-modal-content">
          <ion-row class="ion-justify-content-between ion-align-items-center">
            <ion-row class="ion-align-items-center">
              <ion-button
                fill="clear"
                color="light"
                class="leaves-filter-modal-close-button"
                @click="openFilter = false"
              >
                <IconClose />
              </ion-button>
              <p>
                {{ $t("utils.filter") }}
              </p>
            </ion-row>
            <ion-button fill="clear" @click="resetFilters">
              {{ $t("utils.reset") }}
            </ion-button>
          </ion-row>
          <div>
            <div>
              <p class="leaves-filter-checkbox-list-title">
                {{ $t("user.leaves.leave_type") }}
              </p>
              <div v-if="showTypes" class="leaves-filter-checkbox-list">
                <ion-checkbox
                  v-for="leaveOption in leaveOptions"
                  :checked="selectedLeaveType === leaveOption"
                  :key="leaveOption"
                  :value="leaveOption"
                  @ionChange="setLeaveType($event)"
                >
                  {{ leaveOption }}
                </ion-checkbox>
              </div>
              <p class="leaves-filter-checkbox-list-title">Status</p>
              <div v-if="showStatuses" class="leaves-filter-checkbox-list">
                <ion-checkbox
                  v-for="leaveStatus in leaveStatuses"
                  :checked="selectedLeaveStatus === leaveStatus.value"
                  :key="leaveStatus.value"
                  :value="leaveStatus.value"
                  @ionChange="setLeaveStatus($event)"
                >
                  {{ leaveStatus.label }}
                </ion-checkbox>
              </div>
            </div>
          </div>
        </div>
      </ion-modal>
    </ion-content>
  </ion-page>
</template>

<style scoped lang="scss">
.leaves-page {
  --padding-top: 0;
  --padding-bottom: 24px;
  --padding-start: 0;
  --padding-end: 0;

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

  &-my-leaves-icon {
    width: 18px;
    height: 18px;
  }

  &-header {
    position: sticky;
    top: 0;
    padding: 0 15px;
    z-index: 1;
    background: #191c1d;
  }
}

.leaves-wrapper {
  margin-top: 26px;
}

.leaves {
  border-bottom: 1px solid var(--ion-color-medium-shade);
  padding: 7px 8px 4px;
  margin-bottom: 4px;
  gap: 12px;
  flex-wrap: nowrap;

  &-icon-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    text-wrap: nowrap;
  }

  &-icon {
    width: 42px;
    height: 42px;
  }

  &-type {
    margin: 8px 0 0;
    font-size: 0.75rem;
    line-height: 1rem;
    color: #b5c9d7;
    font-weight: 500;
  }

  .leaves-content {
    flex-wrap: nowrap;
    gap: 12px;
    flex-grow: 1;
  }

  .leaves-label {
    font-size: 0.75rem;
    line-height: 1rem;
    color: #8b9298;
    &-white {
      margin: 4px 0 0;
      &:first-child {
        margin-top: 0;
      }
      font-size: 0.75rem;
      line-height: 1rem;
      color: #e0e3e3;
    }
  }

  &-redirect-button {
    --padding-end: 10px;
    --color: #d9d9d9;
  }
}

.leaves-add-button {
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

.leaves-content-wrapper {
  p {
    letter-spacing: 0.5px;
  }

  p:not(:first-child) {
    margin-top: 4px;
  }
}

.leaves-filter-modal {
  &::part(content) {
    border-radius: 28px 28px 0 0;

    background: #1e2529;
  }

  &-content {
    padding: 16px;
  }

  &-close-button {
    --padding-top: 6px;
    --padding-bottom: 6px;
    --padding-start: 6px;
    --padding-end: 6px;
  }
}

.leaves-filter-checkbox-list-title {
  margin: 16px 0;
}

.leaves-filter-checkbox-list {
  display: flex;
  flex-direction: column;

  ion-checkbox {
    margin-top: 12px;
    padding: 8px 0;
  }
}
</style>
