<script setup>
import {
  IonInput,
  IonRow,
  IonButton,
  IonPage,
  IonContent,
  IonText,
  useIonRouter,
  onIonViewDidLeave,
  createAnimation,
} from "@ionic/vue";
import { ref, computed } from "vue";

import auth from "@/api/authentication";
import Header from "@/components/Header.vue";
import InputBox from "@/components/InputBox.vue";
import { useAuthStore } from "@/store/auth.js";
import { useCustomToast } from "@/composable/toast.js";
import { useI18n } from "vue-i18n";


const authStore = useAuthStore();
const router = useIonRouter();
const { showErrorToast } = useCustomToast();
const { locale } = useI18n(); // Get the current locale


const isLoading = ref(false);

const employeeId = ref("");

const validId = computed(() => {
  return employeeId.value.length >= 4;
});

const nextStep = async () => {
  try {
    isLoading.value = true;
    const { data } = await auth.getUserEnrollment({
      employee_id: employeeId.value,
    });
    const employeeName = locale.value === "ar" ? data.data.employee_name_ar : data.data.employee_name;

    authStore.setEmployeeId(employeeId.value);
    authStore.setUserName(employeeName);

    if (data.data.registered) {
      authStore.setRegistered(true);
      return router.push("/login");
    } else {
      authStore.setRegistered(false);
      return router.push("/register");
    }
  } catch (error) {
    showErrorToast(error?.data?.message, error?.data?.error, error?.data?.status_code);
    console.error(error);
  } finally {
    isLoading.value = false;
  }
};

const prevStep = () => {
  router.push("/");
};

onIonViewDidLeave(() => {
  isLoading.value = false;
  employeeId.value = "";
});
</script>

<template>
  <ion-page>
    <ion-content>
      <div class="ion-justify-content-between login-wrapper">
        <Header with-back-button @goBack="prevStep">{{
          $t("login.employeeId")
        }}</Header>

        <InputBox
          :subtitle="$t('auth.label.enterYour')"
          :title="$t('auth.field.employeeId')"
        >
          <ion-input
            v-model="employeeId"
            fill="outline"
            :label="$t('auth.placeholder.id')"
            label-placement="floating"
            :class="{
              'ion-touched': employeeId,
              'ion-invalid': !validId,
            }"
            :error-text="$t('auth.invalid.id')"
          />
        </InputBox>

        <ion-row class="ion-justify-content-end">
          <ion-button
            fill="clear"
            strong
            :disabled="!validId || isLoading"
            @click="nextStep"
            router-direction="back"
          >
            <ion-text>
              <h4 class="ion-no-margin login-wrapper-next-button">
                {{ $t("login.next") }}
              </h4>
            </ion-text>
          </ion-button>
        </ion-row>
      </div>
    </ion-content>
  </ion-page>
</template>

<style lang="scss" scoped>
.login-header-wrapper {
  ion-button {
    --padding-start: 0;
  }
}

.login {
  &-wrapper {
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;

    padding: 0 15px 24px;

    &-header {
      margin: 0;
    }

    &-hello {
      margin-top: 13px;
      font-size: 1rem;
      line-height: 1.5rem;
      font-weight: 500;
      color: var(--ion-color-medium-shade);

      h5 {
        font-size: 1.75rem;
        line-height: 2rem;
        font-weight: 400;
        margin-top: 5px;
        color: var(--ion-color-primary);
      }
    }

    &-subtitle {
      font-size: 1rem;
      margin-bottom: 6px;
      font-weight: 400;
      color: var(--ion-color-medium-shade);
    }

    &-title {
      font-size: 1.5rem;
      line-height: 2rem;
      font-weight: 400;
      margin-bottom: 17px;
      color: var(--ion-color-dark-contrast);
    }

    &-next-button {
      font-weight: 400;
      font-size: 1.125rem;
    }

    &-back-button {
      position: absolute;

      z-index: 1;
      top: 50%;
      left: -3px;
      transform: translateY(-50%);
    }
  }

  &-header-wrapper {
    position: relative;
  }

  &-password-wrapper {
    margin-top: 12px;
  }

  &-description {
    font-size: 0.875rem;
    line-height: 1rem;
    font-weight: 300;
    text-align: center;
    gap: 4px;
    padding-bottom: 22px;
    letter-spacing: 0.25px;

    &-link {
      margin-bottom: 2px;
      font-size: 0.875rem;
      line-height: 1rem;
      text-decoration: none;
      font-weight: 500;
    }
  }

  &-button {
    margin-top: 24px;
    height: 46px;
  }
}

.v-enter-active,
.v-leave-active {
  transition: opacity 0.3s ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}

.login-header-wrapper {
  ion-button {
    --padding-start: 0;
  }
}
</style>
