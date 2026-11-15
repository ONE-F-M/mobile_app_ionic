<script setup>
import { nextTick, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

import {
  IonContent,
  IonInput,
  IonPage,
  IonSpinner,
  onIonViewDidLeave,
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
import { useUserStore } from "@/store/user.js";
import { usePushRegistration } from "@/composable/usePushRegistration";
const { t } = useI18n();

/*
    steps:
      password
      confirm
  */
const step = ref("password");
const password = ref("");
const isIncorrectPassword = ref(false);
const confirm_password = ref("");
const confirmInput = ref(null);
const authStore = useAuthStore();
const { employeeId, userName, passwordToken, isRegistered } =
  storeToRefs(authStore);
const userStore = useUserStore();
const router = useIonRouter();

const { showErrorToast, showSuccessToast } = useCustomToast();

const isLoading = ref(false);

const { register } = usePushRegistration();

const prevStep = () => {
  router.back();
};
const nextStep = async () => {
  // The Continue button is disabled until a password is typed, but the keyboard
  // path bypasses the button, so it has to re-check the same condition here.
  if (!password.value.length) return;

  step.value = "confirm";
  confirm_password.value = "";

  // The confirm field only mounts once the step flips, so wait for the render
  // before focusing it. Without this the user has to tap the field to carry on.
  await nextTick();
  const el = confirmInput.value?.$el ?? confirmInput.value;
  el?.setFocus?.();
};

const updatePassword = async () => {
  // Same reasoning as nextStep: the keyboard path has to re-check what the
  // button's disabled binding checks, including the in-flight guard.
  if (isLoading.value || !confirm_password.value.length) return;

  try {
    if (password.value != confirm_password.value) {
      isIncorrectPassword.value = true;
      return;
    }

    isLoading.value = true;

    await auth.updatePassword({
      employee_id: employeeId.value,
      new_password: password.value,
      password_token: passwordToken.value,
    });

    const { data } = await auth.userLogin({
      employee_id: employeeId.value,
      password: password.value,
    });

    userStore.setUser(data.data);
    userStore.setToken(data.data.token);

    authStore.setEmployeeIdentificator(data.data.name);

    try {
      await register(data.data);
    } catch (err) {
      console.warn("Push registration failed silently:", err);
    }

    if (data.data.enrolled) {
      router.push("/home/");
    } else {
      router.push("/enrollment");
    }

    showSuccessToast("Password update successfully");
  } catch (error) {
    showErrorToast(error?.data?.message, error?.data?.error, error?.data?.status_code);
  } finally {
    isLoading.value = false;
  }
};

onIonViewDidLeave(() => {
  step.value = "password";
  confirm_password.value = "";
  password.value = "";
  isIncorrectPassword.value = false;
});

watch(
  () => confirm_password.value,
  () => {
    isIncorrectPassword.value = false;
  },
);
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
                :label="$t('auth.placeholder.password')"
                label-placement="floating"
                enterkeyhint="next"
                @keyup.enter="nextStep"
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
                ref="confirmInput"
                type="password"
                fill="outline"
                :label="$t('auth.placeholder.password')"
                label-placement="floating"
                enterkeyhint="go"
                @keyup.enter="updatePassword"
                :class="{
                  'ion-touched ion-invalid': isIncorrectPassword,
                }"
                :error-text="$t('auth.invalid.password_mismatch')"
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
