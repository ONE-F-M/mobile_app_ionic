<script setup>
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";

import { IonContent, IonInput, IonPage, useIonRouter } from "@ionic/vue";

import Header from "@/components/Header.vue";
import InputBox from "@/components/InputBox.vue";
import StepIndicator from "@/components/auth/StepIndicator.vue";
import HelloName from "@/components/auth/HelloName.vue";
import { useCustomToast } from "@/composable/toast.js";
import { useAuthStore } from "@/store/auth.js";
import { storeToRefs } from "pinia";

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
const { employeeId, userName, isRegistered } = storeToRefs(authStore);
const router = useIonRouter();

const { showErrorToast } = useCustomToast();

watch(password, (newPass) => (fieldFilled.value = newPass.length > 0));
watch(confirm_password, (newPass) => (fieldFilled.value = newPass.length > 0));

const prevStep = () => {
  router.back();
};
const nextStep = () => {
  if (step.value == "password") {
    step.value = "confirm";
    confirm_password.value = "";
    fieldFilled.value = false;
    return;
  }

  if (password.value != confirm_password.value) {
    showErrorToast(t("auth.errors.passwords_mismatch"));
    step.value = "password";
    return;
  }

  // TODO Integrate update password and login with redirect to user page
  fieldFilled.value = false;
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
            class="continue-button"
            expand="block"
            shape="round"
            @click="nextStep"
            :disabled="!fieldFilled"
          >
            {{ $t("auth.action.continue") }}
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
