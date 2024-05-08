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
	useIonRouter, onIonViewWillEnter,
} from "@ionic/vue";
import LeavesHeader from "@/components/leaves/Header.vue";
import { computed, ref } from "vue";

import IconPlus from "@/components/icon/Plus.vue";
import ArrowRight from "@/components/icon/ArrowRight.vue";
import IconCheck from "@/components/icon/Check.vue";
import IconClose from "@/components/icon/Close.vue";
import IconVisibility from "@/components/icon/Visibility.vue";
import IconBlock from "@/components/icon/Block.vue";
import leave from "@/api/leave";
import dayjs from "dayjs";
import { useUserStore } from "@/store/user.js";
import { useCustomToast } from "@/composable/toast.js";
import { LEAVE_STATUS, LEAVE_TYPE } from "@/types/enums";

const router = useIonRouter();
const userStore = useUserStore();
const { showErrorToast } = useCustomToast();

const LEAVE_RESPONSE_TYPE = {
	MY_LEAVE: "my_leaves",
	REPORTS_TO: "reports_to",
}

const showTypeLeaves = ref(LEAVE_RESPONSE_TYPE.MY_LEAVE);
const openFilter = ref(false);
const isOpenDatePicker = ref(false);

const leaveStatuses = [
	{
		label: t("user.leaves.card.status.approved"),
		value: LEAVE_STATUS.APPROVED
	},
	{
		label: t("user.leaves.card.status.rejected"),
		value: LEAVE_STATUS.REJECTED
	},
	{
		label: t("user.leaves.card.status.cancelled"),
		value: LEAVE_STATUS.CANCELLED
	},
	{
		label: t("user.leaves.card.status.opened"),
		value: LEAVE_STATUS.OPENED
	},
]
const selectedLeaveStatus = ref('')

const leaveOptions = [
	{
		label: t("user.leaves.card.type.sick"),
		value: LEAVE_TYPE.SICK
	},
	{
		label: t("user.leaves.card.type.maternity"),
		value: LEAVE_TYPE.MATERNITY
	},
	{
		label: t("user.leaves.card.type.hajj"),
		value: LEAVE_TYPE.HAJJ
	},
	{
		label: t("user.leaves.card.type.annual"),
		value: LEAVE_TYPE.ANNUAL
	},
]
const selectedLeaveType = ref('')

const myLeaves = ref([])
const leavesReportsTo = ref([])

const leaves = computed(() => {
	if (showTypeLeaves.value === LEAVE_RESPONSE_TYPE.MY_LEAVE) {
		return [...myLeaves.value]
	}
	
	return [...leavesReportsTo.value]
});

const triggerBack = () => {
  router.push("/home");
};

const changeType = (e) => {
  showTypeLeaves.value = e.detail.value;
};

const closeModal = (e) => {
  if (e.detail.breakpoint === 0) {
    openFilter.value = false;
  }
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
			leave_type: selectedLeaveType,
			leave_status: selectedLeaveStatus,
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
	await fetchLeaves();
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
          :key="leave.id"
          @click="router.push(`/leaves/${leave.id}`)"
          class="leaves ion-align-items-center ion-justify-content-between"
        >
          <ion-row class="leaves-content ion-align-items-center">
            <div class="leaves-icon-wrapper">
              <IconCheck
                class="leaves-icon"
                :class="`leaves-status__${leave.status}`"
                v-if="leave.status === 'Approved'"
              />
              <IconClose
                class="leaves-icon"
                :class="`leaves-status__${leave.status}`"
                v-if="leave.status === 'Rejected'"
              />
              <IconVisibility
                class="leaves-icon"
                :class="`leaves-status__${leave.status}`"
                v-if="leave.status === 'Pending'"
              />
              <IconBlock
                class="leaves-icon"
                :class="`leaves-status__${leave.status}`"
                v-if="leave.status === 'Cancelled'"
              />
              <p v-if="leave.type === 'sick'" class="leaves-type">
                {{ $t(`user.leaves.card.type.${leave.type.toLowerCase()}`) }}
              </p>
            </div>
            <div>
              <p class="leaves-label-white">
                <span :class="`leaves-status__${leave.status}`">{{
                  $t(`user.leaves.card.status.${leave.status.toLowerCase()}`)
                }}</span>
                - {{ leave.id }}
              </p>
              <p class="leaves-label-white">
                <span class="leaves-label"
                  >{{ $t("user.leaves.card.from") }}:</span
                >
                {{ leave.from }}
                <span class="leaves-label"
                  >{{ $t("user.leaves.card.to") }}:</span
                >
                {{ leave.to }}
              </p>
              <p class="leaves-label-white">
                <span class="leaves-label"
                  >{{ $t("user.leaves.card.date_posted") }}:</span
                >
                {{ leave.createdAt }}
              </p>
              <p class="leaves-label-white">
                <span class="leaves-label"
                  >{{ $t("user.leaves.card.approver") }}:</span
                >
                {{ leave.approver }}
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
        @didDismiss="openFilter = false"
        @ionBreakpointDidChange="closeModal"
      >
        <div class="leaves-filter-modal-content">
          <ion-row class="ion-justify-content-between ion-align-items-center">
            <ion-row class="ion-align-items-center">
              <ion-button
                fill="clear"
                color="light"
                class="leaves-filter-modal-close-button"
              >
                <IconClose @click="openFilter = false" />
              </ion-button>
              <p>Filter</p>
            </ion-row>
            <ion-button fill="clear">Reset</ion-button>
          </ion-row>
          <div>
            <div>
              <p class="leaves-filter-checkbox-list-title">Leave type</p>
              <div class="leaves-filter-checkbox-list">
                <ion-checkbox
                  v-for="leaveOption in leaveOptions"
                  v-model="selectedLeaveType"
                  :key="leaveOption.value"
                  :value="leaveOption.value"
                >
	                {{ leaveOption.label }}
                </ion-checkbox>
              </div>
              <p class="leaves-filter-checkbox-list-title">Status</p>
              <div class="leaves-filter-checkbox-list">
                <ion-checkbox
	                v-model="selectedLeaveStatus"
	                v-for="leaveStatus in leaveStatuses"
	                :key="leaveStatus.value"
	                :value="leaveStatus.value"
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
