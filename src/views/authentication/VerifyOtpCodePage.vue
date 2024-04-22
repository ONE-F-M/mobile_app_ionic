<script setup>
import VOtpInput from "vue3-otp-input";
import { onMounted, ref } from "vue";

import Header from "@/components/Header.vue";
import InputBox from "@/components/InputBox.vue";
import ActionButton from "@/components/auth/ActionButton.vue";
import StepIndicator from "@/components/auth/StepIndicator.vue";
import auth from "@/api/authentication";
import { useAuthStore } from "@/store/auth.js";
import { useCustomToast } from "@/composable/toast.js";
import {
  onIonViewDidLeave,
  IonPage,
  IonContent,
  useIonRouter,
} from "@ionic/vue";
import { storeToRefs } from "pinia";

const SECONDS_BEFORE_NEXT_CODE = 120;

const authStore = useAuthStore();
const { employeeId, tempId, verificationMethod, isRegistered } =
  storeToRefs(authStore);
const { showSuccessToast, showErrorToast } = useCustomToast();
const router = useIonRouter();

let interval = null;
const seconds = ref(SECONDS_BEFORE_NEXT_CODE);

const otpCode = ref("");

const secondsCounter = () => {
  if (seconds.value === 0) {
    interval && clearInterval(interval);
    return;
  }

  seconds.value -= 20;
};

const initSecondsCounter = () => {
  seconds.value = SECONDS_BEFORE_NEXT_CODE;
  interval = setInterval(secondsCounter, 1000);
};

const resendCode = async () => {
  try {
    const { data } = await auth.forgotPassword({
      employee_id: employeeId.value,
      otp_source: verificationMethod.value,
    });

    if (data.error) {
      throw new Error(data);
    }

    authStore.setUserId(data.data.temp_id);
    showSuccessToast("Verification code sent successfully");

    initSecondsCounter();
  } catch (error) {
    showErrorToast(
      "Cannot send verification code due to internal server error",
    );
  }
};

const verifyCode = async () => {
  try {
    const { data } = await auth.verifyOtp({
      otp: otpCode.value,
      temp_id: tempId.value,
    });

    console.log("data otpCode", data);

    authStore.setPasswordCode(data.data.password_token);
    showSuccessToast("Verification successfully");
    router.push("/register/set-password");
  } catch (error) {
    console.log("error", error);
    showErrorToast(error.error ?? "OTP Verification Failed!");
  }
};

const prevStep = () => {
  router.back();
};

onMounted(() => {
  initSecondsCounter();
});

// onIonViewDidEnter(() => {
//   initSecondsCounter();
// });

onIonViewDidLeave(() => {
  interval && clearInterval(interval);
  otpCode.value = "";
});
</script>

<template>
  <ion-page>
    <ion-content>
      <div class="wrapper ion-justify-content-between">
        <Header with-back-button @goBack="prevStep">
          <template v-if="isRegistered">
            {{ $t("auth.page.forgot_password") }}
          </template>
          <template v-else>
            {{ $t("auth.page.registration") }}
          </template>
        </Header>

        <InputBox
          :subtitle="$t('auth.label.enterYour')"
          :title="$t('auth.field.verification_code')"
        >
          <div class="code-wrapper">
            <v-otp-input
              input-classes="otp-input"
              :separator="' '"
              class="otp-wrapper"
              :num-inputs="6"
              v-model:value="otpCode"
              :should-auto-focus="true"
              :placeholder="['', '', '', '', '', '']"
              :should-focus-order="true"
            />
          </div>

          <div class="resend-code-wrapper">
            <template v-if="seconds > 0">
              <span>{{ $t("auth.resend_code_in", { seconds }) }}</span>
            </template>
            <template v-else>
              <a @click="resendCode">
                {{ $t("auth.resend_code_now") }}
              </a>
            </template>
          </div>
        </InputBox>

        <div>
          <StepIndicator class="step-indicator" :step="2" />

          <ActionButton :disabled="otpCode.length < 6" @click="verifyCode">
            {{ $t("auth.action.verify") }}
          </ActionButton>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.code-wrapper {
  display: flex;
  gap: 8px;
}

.otp-wrapper {
  width: 100%;
  gap: 8px;
  flex-grow: 1;
  justify-content: center;
}

:deep(.otp-input) {
  height: 56px;
  max-width: 48px;
  flex-grow: 0;
  background-color: rgba(var(--ion-color-primary-tint-rgb), 16%);
  border: 0;
  text-align: center;
  border-bottom: none;
  border-radius: 8px;
  transition: background-color 0.2s ease;

  @media (max-width: 340px) {
    height: 48px;
    max-width: 42px;
  }

  &:focus {
    border: 0;
  }
}

:deep(.otp-input:not(:placeholder-shown)) {
  background: #25353d;
}

.resend-code-wrapper {
  margin-top: 28px;
  text-align: end;
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
