<script setup async>
import {
  IonContent,
  IonButton,
  IonText,
  IonPage,
  IonCol,
  IonRow,
  useIonRouter,
  IonModal,
} from "@ionic/vue";

import IconPlus from "@/components/icon/Plus.vue";
import CheckinHeader from "@/components/checkin/Header.vue";
import checkin from "@/api/checkin";
import { useUserStore } from "@/store/user.js";
import { onMounted, ref } from "vue";
import { useCustomToast } from "@/composable/toast.js";
import useDateHelper from "@/composable/useDateHelper";
import { useLangStore } from "@/store/lang.js";
import { Geolocation } from "@capacitor/geolocation";
import { useI18n } from "vue-i18n";

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

const fetchCkeckinList = async (defaults = {}) => {
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
onMounted(async () => {
	await fetchCkeckinList({
		from_date: dayjs(0).format("YYYY-MM-DD"),
		to_date: dayjs(new Date()).format("YYYY-MM-DD"),
	});
	
	try {
		await printCurrentPosition();
	} catch (e) {
		showErrorToast(t("user.checkin.geolocation.title"))
		return
	}
	
	await getSiteLocation()
})
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
                  {{
                    formatDate(dateRange.start) === formatDate(dateRange.end)
                      ? formatDate(dateRange.start, "ddd, MMM D")
                      : `${formatDate(dateRange.start, "MMM D")} -
                  ${formatDate(dateRange.end, "MMM D")}`
                  }}
                </h3>
                <!--                <ion-button class="ckeckin-datepicker-edit-button" fill="clear">-->
                <!--                  <IconEdit />-->
                <!--                </ion-button>-->
              </ion-row>
            </div>
            <v-date-picker
              v-model.range="dateRange"
              class="ckeckin-datepicker-range"
              :locale="langStore.lang"
              mode="date"
              expanded
              title-position="left"
            />
            <ion-row
              class="ion-justify-content-end ckeckin-datepicker-card-footer-wrapper"
            >
              <ion-button fill="clear" @click="isOpenDatePicker = false">{{
                $t("utils.cancel")
              }}</ion-button>
              <ion-button fill="clear" @click="() => fetchCkeckinList()">
                {{ $t("utils.ok") }}
              </ion-button>
            </ion-row>
          </div>
        </ion-row>
      </ion-modal>

      <ion-button
	      v-if="logType"
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

.ckeckin-datepicker-modal {
  --background: transperent;
}

.ckeckin-datepicker-wrapper {
  height: 100%;
}

::v-deep(.ckeckin-datepicker-range) {
  background: transparent;
  border: none;
  --vc-header-title-color: #c0c7cd;
  --vc-header-arrow-color: #c0c7cd;
  --test: 364955;
  --vc-highlight-light-bg: #364955;
  --vc-color: #e0e3e3;

  .vc-header {
    margin-bottom: 12px;
  }

  .vc-highlight-content-solid {
    --vc-highlight-solid-content-color: #003549;
    font-weight: 600;
  }

  .vc-highlight-content-light {
    --vc-highlight-light-content-color: #e0e3e3;
  }

  //.vc-highlight-bg-outline {
  //  background: #76d1ff;
  //  border: none;
  //}

  .vc-highlight-base-start {
    background: #364955;
  }

  .vc-highlight-base-end {
    background: #364955;
  }

  .vc-highlight-base-middle {
    background: #364955;
  }

  .vc-arrow,
  .vc-title-wrapper button {
    background: transparent;
  }

  .vc-weeks {
    padding: 0;
  }

  .vc-week {
    padding: 4px 0;
  }

  .vc-day-content {
    font-weight: 400;
    width: 40px;
    height: 40px;

    &.vc-highlight-content-solid,
    &.vc-highlight-content-outline {
      font-weight: 700;
    }

    &.vc-highlight-content-outline {
      color: #003549;
    }
  }

  .vc-highlights {
    height: 40px;
  }

  .vc-day-box-center-center {
    height: 40px;
  }

  .vc-highlight-bg-solid {
    background: #76d1ff;
  }

  .vc-highlight-bg-solid,
  .vc-highlight-bg-outline {
    width: 40px;
  }

  .vc-highlight {
    height: 40px;
  }
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
