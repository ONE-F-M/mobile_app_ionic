<script setup>
  import {
    IonPage,
    IonContent,
    onIonViewDidEnter,
    onIonViewDidLeave,
    useIonRouter
  } from "@ionic/vue"
  import { ref } from "vue";
  import { useI18n } from "vue-i18n";

  import { forgotPassword, updatePassword } from "@/api/authentication";

  import { useRegistrationStore } from "@/store/registration";

  import { getUserEnrollment } from "@/api/authentication"
  import { showErrorToast, showSuccessToast } from "@/utils/toast";

  import EmployeeIdTab from "@/components/auth/EmployeeIdTab.vue";
  import VerificationMethodTab from "@/components/auth/VerificationMethodTab.vue";
  import VerificationCodeTab from "@/components/auth/VerificationCodeTab.vue";
  import SetPasswordTab from "@/components/auth/SetPasswordTab.vue"

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
      default: "select_employee_id"
    }
  });

  const inView = ref(false);

  onIonViewDidEnter(() => inView.value = true);
  onIonViewDidLeave(() => inView.value = false);

  const { t } = useI18n();

  const router = useIonRouter();

  const isLoading = ref(false);

  const data = useRegistrationStore();

  const prevStep = () => router.back();

  const onEmployeeIdSelected = async ({ employee_id }) => {

    if (debug_mode) {
      data.employee_id = "123123123";
      data.employee_name = "John Doe";
      router.push("/register/method");

      return;
    }

    isLoading.value = true;
    const { data: res } = await getUserEnrollment({ employee_id });
    isLoading.value = false;

    if (res.error) {
      await showErrorToast(t, data.error);
      return;
    }

    data.employee_id = employee_id;
    data.employee_name = res.data.employee_name;
    router.push("/register/method");
  }

  const requestCode = async () => {
    if (debug_mode) {
      data.temp_id = "temp_id";
      await showSuccessToast(t, "debug mode: code sent");
      return true;
    }

    const { data: res } = await forgotPassword({
      employee_id: data.employee_id,
      otp_source: data.method,
    });

    if (res.error) {
      await showErrorToast(t, data.message);
      return false;
    }

    data.temp_id = res.data.temp_id;

    await showSuccessToast(t, res.message);
    return true;
  }

  const onVerifyMethodSelected = async ({ method }) => {
    data.method = method;
    if (await requestCode()) {
      router.push("/register/code");
    }
  }

  const onVerifyCodeEntered = ({ code }) => {
    data.code = code;
    router.push("/register/set-password");
  }

  const onPasswordSet = async ({ password }) => {
    data.password = password;

    if (debug_mode) {
      await showSuccessToast(t, "debug mode: success. Redirect to homepage in normal mode.");
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
          await showErrorToast(t, data.error);
          return;
        }

        router.push("/home");
      })
      .catch(async (err) => {
        await showErrorToast(t, err.message)
      })
  }
</script>

<template>
  <ion-page>
    <ion-content>
      <div v-if="inView" class="wrapper ion-justify-content-between">
        <template v-if="step == 'select_employee_id'">
          <EmployeeIdTab
            @prevStep="prevStep"
            @nextStep="onEmployeeIdSelected"
            :isLoading="isLoading"
            />
        </template>
        <template v-if="step == 'select_verify_method'">
          <VerificationMethodTab
            @prevStep="prevStep"
            @nextStep="onVerifyMethodSelected"
            :employee_name="data.employee_name"
            />
        </template>
        <template v-if="step == 'confirm_verify_code'">
          <VerificationCodeTab
            @nextStep="onVerifyCodeEntered"
            @prevStep="prevStep"
            @resendCode="requestCode"
            />
        </template>
        <template v-if="step == 'set_password'">
          <SetPasswordTab
            @nextStep="onPasswordSet"
            @prevStep="prevStep"
            :employee_name="data.emlpoyee_name"
            />
        </template>
      </div>
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

