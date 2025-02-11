<script setup>
import {
  IonPage,
  IonContent,
  onIonViewDidEnter,
  onIonViewDidLeave,
  useIonRouter,
} from "@ionic/vue";
import { ref } from "vue";

import { updatePassword } from "@/api/authentication";

import { useRegistrationStore } from "@/store/registration";

import { useCustomToast } from "@/composable/toast.js";

const { showSuccessToast, showErrorToast } = useCustomToast();
const debug_mode = false;

/*
  steps:
    select_employee_id
    select_verify_method
    confirm_verify_code
    set_password
  */
const { step } = defineProps({
  step: {
    type: String,
    default: "select_verify_method",
  },
});

const inView = ref(false);

onIonViewDidEnter(() => (inView.value = true));
onIonViewDidLeave(() => (inView.value = false));

const router = useIonRouter();

const data = useRegistrationStore();

const prevStep = () => router.back();

const onVerifyCodeEntered = ({ code }) => {
  data.code = code;
  router.push("/register/set-password");
};

const onPasswordSet = async ({ password }) => {
  data.password = password;

  if (debug_mode) {
    await showSuccessToast(
      "debug mode: success. Redirect to homepage in normal mode.",
    );
    return;
  }

  updatePassword({
    otp: data.code,
    id: data.temp_id,
    employee_id: data.employee_id,
    new_password: password,
  })
    .then(async (res) => {
      if (res.error) {
        await showErrorToast(data.error);
        return;
      }

      router.push("/home");
    })
    .catch(async (err) => {
      await showErrorToast(error?.data?.message, error?.data?.error, error?.data?.status_code);
    });
};
</script>

<template>
  <ion-page>
    <ion-content>
      <div v-if="inView" class="wrapper ion-justify-content-between"></div>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.wrapper {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;

  padding: 0 15px 24px;
}
</style>
