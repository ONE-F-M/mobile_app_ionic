<script setup>
import { nextTick, onMounted, ref, watch } from "vue";

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
const OTP_LENGTH = 6;

const authStore = useAuthStore();
const { employeeId, tempId, verificationMethod, isRegistered } =
  storeToRefs(authStore);
const { showSuccessToast, showErrorToast } = useCustomToast();
const router = useIonRouter();

let interval = null;
const seconds = ref(SECONDS_BEFORE_NEXT_CODE);

const otpCode = ref("");
const isVerifying = ref(false);
const codeInput = ref(null);
const isFocused = ref(false);

// The boxes are presentation only. A single real input sits over them so iOS
// can offer the code from Messages, which it will not do across six separate
// fields, and so the caret and keyboard behave like one field.
const focusCode = () => codeInput.value?.focus();

// Keep the value to digits regardless of what the keyboard, a paste or an
// autofill puts in, then submit once it is complete.
watch(otpCode, (value) => {
  const digits = (value || "").replace(/\D/g, "").slice(0, OTP_LENGTH);

  if (digits !== value) {
    otpCode.value = digits;
    return;
  }

  if (digits.length === OTP_LENGTH) {
    verifyCode();
  }
});

const secondsCounter = () => {
  if (seconds.value === 0) {
    interval && clearInterval(interval);
    return;
  }

  seconds.value -= 1;
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
    showErrorToast(error?.data?.message, error?.data?.error, error?.data?.status_code);
  }
};

const verifyCode = async () => {
  // Reached from the button, from Enter and from the watcher above, so it has
  // to be safe to call more than once for the same code.
  if (isVerifying.value || otpCode.value.length !== OTP_LENGTH) return;

  try {
    isVerifying.value = true;

    const { data } = await auth.verifyOtp({
      otp: otpCode.value,
      temp_id: tempId.value,
    });

    authStore.setPasswordCode(data.data.password_token);
    showSuccessToast("Verification successfully");
    router.push("/register/set-password");
  } catch (error) {
    console.error("OTP verification failed:", error);
    showErrorToast(error?.data?.message, error?.data?.error, error?.data?.status_code);

    // The field is full at OTP_LENGTH, so leaving a rejected code in place
    // would block the user from typing another one.
    otpCode.value = "";
  } finally {
    isVerifying.value = false;

    // The input is disabled while verifying, which drops focus. Give it back
    // once it is enabled again so the user can retype without tapping.
    await nextTick();
    focusCode();
  }
};

const prevStep = () => {
  router.back();
};

onMounted(() => {
  initSecondsCounter();
  focusCode();
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
          <div class="code-wrapper" @click="focusCode">
            <input
              ref="codeInput"
              v-model="otpCode"
              class="otp-field"
              type="text"
              inputmode="numeric"
              autocomplete="one-time-code"
              enterkeyhint="go"
              :maxlength="OTP_LENGTH"
              :disabled="isVerifying"
              @focus="isFocused = true"
              @blur="isFocused = false"
              @keyup.enter="verifyCode"
            />

            <div
              v-for="index in OTP_LENGTH"
              :key="index"
              class="otp-box"
              :class="{
                'otp-box-filled': otpCode.length >= index,
                'otp-box-active': isFocused && otpCode.length === index - 1,
              }"
            >
              {{ otpCode[index - 1] || "" }}
            </div>
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

          <ActionButton
            :disabled="otpCode.length < OTP_LENGTH || isVerifying"
            @click="verifyCode"
          >
            {{ $t("auth.action.verify") }}
          </ActionButton>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.code-wrapper {
  position: relative;
  display: flex;
  gap: 8px;
  justify-content: center;
}

/* The real field. Invisible but not display:none, so iOS still anchors its
   one-time-code suggestion to it and the keyboard opens on tap. */
.otp-field {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  border: 0;
  background: transparent;
  color: transparent;
  caret-color: transparent;
  z-index: 1;
}

.otp-box {
  height: 56px;
  width: 48px;
  flex-grow: 0;
  flex-shrink: 1;
  background-color: rgba(var(--ion-color-primary-tint-rgb), 16%);
  border: 1px solid transparent;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  color: var(--ion-color-dark-contrast);
  transition: background-color 0.2s ease, border-color 0.2s ease;
}

.otp-box-filled {
  background: #25353d;
}

.otp-box-active {
  border-color: var(--ion-color-primary);
}

@media (max-width: 340px) {
  .otp-box {
    height: 48px;
    width: 42px;
  }
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
