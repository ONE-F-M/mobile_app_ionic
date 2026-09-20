<script setup>
import {
  IonContent,
  IonPage,
  IonSpinner,
  onIonViewWillEnter,
  useIonRouter,
} from "@ionic/vue";
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import PageHeader from "@/components/common/PageHeader.vue";
import { useUserStore } from "@/store/user";
import profile from "@/api/profile";
import { useCustomToast } from "@/composable/toast";
import { App } from "@capacitor/app";
import pkg from "../../../package.json";

const { t } = useI18n();
const router = useIonRouter();
const userStore = useUserStore();
const { showErrorToast } = useCustomToast();

// Loading / empty state pattern matches src/views/stock_entry/StockEntryDetailPage.vue
const isLoading = ref(false);
const accountDetails = ref(null);
// Default to the version this build was shipped with; overwritten with the
// native app version below when running inside Capacitor.
const appVersion = ref(pkg.version);

// Back action pattern matches src/views/stock_entry/StockEntryDetailPage.vue,
// which navigates back using useIonRouter().back() instead of a hardcoded path.
const triggerBack = () => {
  router.back();
};

const fetchAppVersion = async () => {
  try {
    const info = await App.getInfo();
    if (info?.version) {
      appVersion.value = info.version;
    }
  } catch (error) {
    // App.getInfo() is not implemented on the web platform, so we silently
    // keep the package.json version already set above.
    console.warn("Falling back to package.json app version:", error);
  }
};

const fetchAccountDetails = async () => {
  isLoading.value = true;
  try {
    const { data } = await profile.getUserProfile({
      employee_id: userStore.user?.employee_id,
    });
    accountDetails.value = data?.message || null;
  } catch (error) {
    accountDetails.value = null;
    showErrorToast(error?.data?.message, error?.data?.error, error?.data?.status_code);
  } finally {
    isLoading.value = false;
  }
};

// onIonViewWillEnter data-loading pattern matches src/views/user/ProfilePage.vue
// and src/views/leaves/LeaveDetailsPage.vue.
onIonViewWillEnter(async () => {
  await fetchAppVersion();
  await fetchAccountDetails();
});
</script>

<template>
  <ion-page>
    <ion-content class="ion-padding account-details-page">
      <PageHeader :title="t('user.account.title')" @click-back="triggerBack" />

      <div v-if="isLoading" class="ion-text-center ion-padding">
        <ion-spinner name="crescent"></ion-spinner>
      </div>

      <div v-else-if="accountDetails" class="account-details">
        <div class="account-details-card">
          <div class="account-details-card-value-wrapper">
            <p class="account-details-card-label">
              {{ t("user.account.employee_id") }}
            </p>
            <p class="account-details-card-value">
              {{ userStore.user?.employee_id }}
            </p>
          </div>

          <div class="account-details-card-value-wrapper">
            <p class="account-details-card-label">
              {{ t("user.account.name") }}
            </p>
            <p class="account-details-card-value">{{ accountDetails.Name }}</p>
          </div>

          <div class="account-details-card-value-wrapper">
            <p class="account-details-card-label">
              {{ t("user.account.email") }}
            </p>
            <p class="account-details-card-value">{{ accountDetails.Email }}</p>
          </div>

          <div class="account-details-card-value-wrapper">
            <p class="account-details-card-label">
              {{ t("user.account.phone") }}
            </p>
            <p class="account-details-card-value">
              {{ accountDetails.Mobile_no }}
            </p>
          </div>

          <div class="account-details-card-value-wrapper">
            <p class="account-details-card-label">
              {{ t("user.account.job_title") }}
            </p>
            <p class="account-details-card-value">
              {{ accountDetails.Designation }}
            </p>
          </div>

          <div class="account-details-card-value-wrapper">
            <p class="account-details-card-label">
              {{ t("user.account.app_version") }}
            </p>
            <p class="account-details-card-value">{{ appVersion }}</p>
          </div>
        </div>
      </div>

      <div v-else class="ion-text-center ion-padding account-details-empty">
        <p>{{ t("user.account.no_data") }}</p>
      </div>
    </ion-content>
  </ion-page>
</template>

<style scoped lang="scss">
.account-details-page {
  --padding-top: 0;
  --padding-bottom: 24px;
  --padding-start: 0;
  --padding-end: 0;
}

.account-details {
  padding: 16px;

  &-card {
    padding: 24px 16px;
    border-radius: 16px;
    background: #1e2529;

    &-label {
      margin: 0;
      font-size: 0.875rem;
      line-height: 1.25rem;
      color: #8b9298;
    }

    &-value {
      margin: 4px 0 4px;
      font-size: 1rem;
      line-height: 1.5rem;
      color: #e0e3e3;
    }

    &-value-wrapper {
      &:not(:first-child) {
        margin-top: 16px;
      }
    }
  }
}

.account-details-empty {
  color: #8b9298;
}
</style>
