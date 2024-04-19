<script setup>
import { ref } from "vue";
import { useI18n } from "vue-i18n";

import {
  IonContent,
  IonInput,
  IonPage,
  IonSpinner,
  useIonRouter,
} from "@ionic/vue";

import Header from "@/components/Header.vue";
import InputBox from "@/components/InputBox.vue";
import StepIndicator from "@/components/auth/StepIndicator.vue";
import HelloName from "@/components/auth/HelloName.vue";
import { useCustomToast } from "@/composable/toast.js";
import { useAuthStore } from "@/store/auth.js";
import { storeToRefs } from "pinia";
import auth from "@/api/authentication";

const { t } = useI18n();

/*
    steps:
      password
      confirm
  */
const step = ref("password");
const fieldFilled = ref(false);
const password = ref("");
const confirm_password = ref("");
const authStore = useAuthStore();
const { employeeId, userName, otpCode, userId, isRegistered } =
  storeToRefs(authStore);
const router = useIonRouter();

const { showErrorToast, showSuccessToast } = useCustomToast();

const isLoading = ref(false);

const prevStep = () => {
  router.back();
};
const nextStep = () => {
  step.value = "confirm";
  confirm_password.value = "";
};

const updatePassword = async () => {
  try {
    if (password.value != confirm_password.value) {
      showErrorToast(t("auth.errors.passwords_mismatch"));
      step.value = "password";
      return;
    }

    isLoading.value = true;

    await auth.updatePassword({
      otp: otpCode.value,
      id: userId.value,
      employee_id: employeeId.value,
      new_password: password.value,
    });

    await auth.userLogin({
      employee_id: employeeId.value,
      password: password.value,
    });

    showSuccessToast("Password update successfully");
    router.push("/home");
  } catch (error) {
    showErrorToast(error.message);
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <ion-page>
    <ion-content>
      <div class="wrapper ion-justify-content-between">
        <div>
          <Header with-back-button @goBack="prevStep">
            <slot name="title">
              <template v-if="isRegistered">
                {{ $t("login.login") }}
              </template>
              <template v-else>
                {{ $t("auth.page.set_password") }}
              </template>
            </slot>
          </Header>

          <HelloName :hello_name="userName" />
        </div>

        <div>
          <template v-if="step == 'password'">
            <InputBox
              :subtitle="
                isRegistered
                  ? $t('auth.label.resetYour')
                  : $t('auth.label.setYour')
              "
              :title="$t('auth.field.password')"
            >
              <ion-input
                type="password"
                fill="outline"
                :placeholder="$t('auth.placeholder.password')"
                v-model="password"
              />
            </InputBox>
          </template>

          <template v-else>
            <InputBox
              :subtitle="$t('auth.label.confirmYour')"
              :title="$t('auth.field.password')"
            >
              <ion-input
                type="password"
                fill="outline"
                :placeholder="$t('auth.placeholder.password')"
                v-model="confirm_password"
              />
            </InputBox>
          </template>

          <ion-button
            v-if="step === 'password'"
            class="continue-button"
            expand="block"
            shape="round"
            @click="nextStep"
            :disabled="!password.length"
          >
            {{ $t("auth.action.continue") }}
          </ion-button>
          <ion-button
            v-else
            class="continue-button"
            expand="block"
            shape="round"
            @click="updatePassword"
            :disabled="!confirm_password.length || isLoading"
          >
            <ion-spinner v-if="isLoading" name="crescent"></ion-spinner>
            <span v-else>{{ $t("auth.action.continue") }}</span>
          </ion-button>
        </div>

        <StepIndicator class="step-indicator" :step="3" />
      </div>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.continue-button {
  margin-top: 24px;
}
.step-indicator {
  margin-bottom: 40px;
}

.wrapper {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;

  padding: 0 15px 24px;
}
</style>
