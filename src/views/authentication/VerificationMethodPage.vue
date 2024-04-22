<script setup>
import { ref } from "vue";

import {
  IonContent,
  IonPage,
  IonRadio,
  IonRadioGroup,
  onIonViewDidLeave,
  useIonRouter,
} from "@ionic/vue";

import Header from "@/components/Header.vue";
import ActionButton from "@/components/auth/ActionButton.vue";
import StepIndicator from "@/components/auth/StepIndicator.vue";
import InputBox from "@/components/InputBox.vue";
import HelloName from "@/components/auth/HelloName.vue";
import { useAuthStore } from "@/store/auth.js";
import auth from "@/api/authentication";
import { storeToRefs } from "pinia";
import { useCustomToast } from "@/composable/toast.js";

const { showSuccessToast, showErrorToast } = useCustomToast();
const authStore = useAuthStore();
const { employeeId, userName, isRegistered } = storeToRefs(authStore);
const router = useIonRouter();

const otpOptions = ["email", "whatsapp", "sms"];
const otpMethod = ref("email");

const updateMethod = (evt) => (otpMethod.value = evt.detail.value);

const prevStep = () => {
  router.back();
};

const requestCode = async () => {
  try {
    const { data } = await auth.forgotPassword({
      employee_id: employeeId.value,
      otp_source: otpMethod.value,
      is_new: isRegistered.value ? 0 : 1,
    });

    if (data.error) {
      throw new Error(data);
    }

    authStore.setTempId(data.data.temp_id);
    authStore.setVerificationMethod(otpMethod.value);
    showSuccessToast("Verification code sent successfully");

    router.push("/register/verify-code");
  } catch (error) {
    showErrorToast(
      "Cannot send verification code due to internal server error",
    );
  }
};

onIonViewDidLeave(() => {
  otpMethod.value = "email";
});
</script>

<template>
  <ion-page>
    <ion-content>
      <div class="wrapper ion-justify-content-between">
        <div>
          <Header with-back-button @goBack="prevStep">
            <template v-if="isRegistered">
              {{ $t("auth.page.forgot_password") }}
            </template>
            <template v-else>
              {{ $t("auth.page.registration") }}
            </template>
          </Header>

          <HelloName :hello_name="userName" />
        </div>

        <InputBox
          :subtitle="$t('auth.label.chooseYour')"
          :title="$t('auth.field.verification_method')"
        >
          <ion-radio-group
            :value="otpMethod"
            @ionChange="updateMethod"
            class="radio-group"
          >
            <template v-for="option in otpOptions" :key="option">
              <ion-radio :value="option" class="radio-button">
                {{ $t(`auth.otp_method.${option}`) }}
              </ion-radio>
            </template>
          </ion-radio-group>
        </InputBox>

        <StepIndicator :step="1" />

        <ActionButton @click="requestCode">
          {{ $t("auth.action.next") }}
        </ActionButton>
      </div>
    </ion-content>
  </ion-page>
</template>

<style scoped lang="scss">
.radio-group {
  display: flex;
  flex-flow: column;
  gap: 18px;
}
.radio-button {
  background-color: #1e2529;
  border-radius: 8px;
  font-size: 1rem;
  line-height: 1.5rem;
  font-weight: 400 !important;
  padding: 16px;
  font-family: "Readex Pro", sans-serif;

  &.radio-checked {
    color: #76d1ff;
    background-color: #202b2f;
  }
}

.wrapper {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;

  padding: 0 15px 24px;
}
</style>
