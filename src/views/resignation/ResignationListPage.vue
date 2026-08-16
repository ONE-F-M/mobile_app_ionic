<template>
  <ion-page>
    <ion-content class="ion-padding leaves-page">
      <ion-refresher slot="fixed" @ionRefresh="handleRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <PageHeader
        class="leaves-page-header"
        :title="$t('resignation.my_resignations', 'My Resignations')"
        @click-back="triggerBack"
      />

      <div class="leaves-wrapper">
        <ion-row
          v-for="resig in myResignations"
          :key="resig.name"
          class="leaves ion-align-items-center ion-justify-content-between"
          @click="goToDetail(resig.name)"
        >
          <ion-row class="leaves-content ion-align-items-center">
            <div class="leaves-content-wrapper">
              <p class="leaves-label-white">
                <BilingualText
                  v-if="getStateI18nKey(getDisplayState(resig))"
                  tag="span"
                  :class="`leaves-status__${getStateClass(getDisplayState(resig))}`"
                  :tKey="getStateI18nKey(getDisplayState(resig))"
                  :fallback="getDisplayState(resig)"
                />
                <span v-else :class="`leaves-status__${getStateClass(getDisplayState(resig))}`">{{
                  getDisplayState(resig)
                }}</span>
                - {{ resig.name }}
              </p>
              <p class="leaves-label-white">
                <BilingualText tag="span" class="leaves-label" tKey="resignation.initiation_date" fallback="Initiation Date:" />
                {{ formatDateToDisplay(resig.resignation_initiation_date) }}
                <BilingualText tag="span" class="leaves-label" tKey="resignation.relieving_date" fallback="Relieving Date:" />
                {{ formatDateToDisplay(resig.relieving_date) }}
              </p>
              <p class="leaves-label-white">
                <BilingualText tag="span" class="leaves-label" tKey="resignation.requested_on" fallback="Requested On:" />
                {{ formatDateToDisplay(resig.creation, "DD MMM, YYYY") }}
              </p>
            </div>
          </ion-row>
          <ion-button fill="clear" class="leaves-redirect-button">
            <ArrowRight />
          </ion-button>
        </ion-row>

        <BilingualText v-if="!myResignations.length && !isLoading" tag="p" class="empty-state" tKey="resignation.no_records" fallback="No resignation records found." />
      </div>

      <ion-button class="leaves-add-button" @click="router.push('/resignation/add')">
        <IconPlus />
        <ion-text>
          <BilingualText tag="p" class="leaves-add-button-label" tKey="resignation.initiate_resignation" fallback="Initiate Resignation" />
        </ion-text>
      </ion-button>

    </ion-content>
  </ion-page>
</template>

<script setup>
import {
  IonButton,
  IonContent,
  IonPage,
  IonText,
  IonRow,
  useIonRouter,
  onIonViewWillEnter,
  IonRefresher,
  IonRefresherContent,
} from "@ionic/vue";
import PageHeader from "@/components/common/PageHeader.vue";
import BilingualText from "@/components/base/BilingualText.vue";
import { ref } from "vue";
import { getDisplayState, getStateClass, getStateI18nKey } from "@/utils/resignationConstants.js";

import IconPlus from "@/components/icon/Plus.vue";
import ArrowRight from "@/components/icon/ArrowRight.vue";
import resignation from "@/api/resignation";
import { useUserStore } from "@/store/user.js";
import { useCustomToast } from "@/composable/toast.js";
import useDateHelper from "@/composable/useDateHelper";

const router = useIonRouter();
const userStore = useUserStore();
const { showErrorToast } = useCustomToast();
const { dayjs } = useDateHelper();

const myResignations = ref([]);
const isLoading = ref(false);


const formatDateToDisplay = (date, format = "DD-MM-YYYY") => {
  if (!date) return "";
  return dayjs(date, "YYYY-MM-DD").format(format);
};

const triggerBack = () => {
  router.push("/home");
};

const goToDetail = (id) => {
  router.push(`/resignation/add/${id}`);
};

const fetchResignations = async () => {
  const employeeId = userStore.user?.employee_id;
  if (!employeeId) {
    myResignations.value = [];
    return;
  }
  try {
    isLoading.value = true;
    const { data } = await resignation.getAllMyResignations(employeeId);
    myResignations.value = data.message || [];
  } catch (error) {
    showErrorToast(error?.data?.message, error?.data?.error, error?.data?.status_code);
    myResignations.value = [];
  } finally {
    isLoading.value = false;
  }
};



onIonViewWillEnter(async () => {
  if (userStore.user?.employee_id && userStore.token) {
    await fetchResignations();
  }
});

const handleRefresh = async (event) => {
  await fetchResignations();
  event.target.complete();
};

</script>

<style scoped lang="scss">
.leaves-page {
  --padding-top: 0;
  --padding-bottom: 24px;
  --padding-start: 0;
  --padding-end: 0;

  &-header {
    position: sticky;
    top: 0;
    padding-inline: 15px;
    z-index: 1;
    background: #191c1d;
  }
}

.leaves-wrapper {
  margin-block-start: 26px;
  padding-inline: 15px;
}

.leaves {
  border-bottom: 1px solid var(--ion-color-medium-shade);
  padding-block: 7px 4px;
  padding-inline: 8px;
  margin-block-end: 4px;
  gap: 12px;
  flex-wrap: nowrap;

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
      margin-block-start: 4px;
      &:first-child {
        margin-block-start: 0;
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
  inset-block-end: 24px;
  inset-inline-end: 16px;
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
    margin-block: 16px;
    margin-inline-start: 12px;
  }
}

.leaves-content-wrapper {
  p {
    letter-spacing: 0.5px;
  }

  p:not(:first-child) {
    margin-block-start: 4px;
  }
}

.leaves-status__Pending { color: #f5b041; }
.leaves-status__Approved { color: #52be80; }
.leaves-status__Rejected { color: #e74c3c; }
.leaves-status__Cancelled { color: #95a5a6; }
.leaves-status__Resignation-Withdrawn { color: #95a5a6; }

.empty-state {
  text-align: center;
  color: #8b9298;
  margin-block-start: 50px;
}
</style>
