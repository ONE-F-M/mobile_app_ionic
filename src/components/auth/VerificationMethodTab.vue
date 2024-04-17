<script setup>
  import { ref } from "vue";

  import { IonRadio, IonRadioGroup } from "@ionic/vue";

  import { useUserStore } from "@/store/user";

  import Header from "@/components/Header.vue";
  import ActionButton from "@/components/auth/ActionButton.vue";
  import StepIndicator from "@/components/auth/StepIndicator.vue";
  import InputBox from "@/components/InputBox.vue";

  const emit = defineEmits(["prevStep", "nextStep"]);

  const userStore = useUserStore();

  const { employee_name } = defineProps({
    employee_name: String
  });


  const otpOptions = [ "email", "whatsapp", "sms" ];
  const otpMethod = ref("email");

  const updateMethod = (evt) => otpMethod.value = evt.detail.value;

  const prevStep = () => emit("prevStep");
  const nextStep = () => emit("nextStep", { method: otpMethod.value });
</script>

<template>
  <Header with-back-button @goBack="prevStep">
    <template v-if="userStore.isRegistered">
      {{ $t("auth.page.forgot_password") }}
    </template>
    <template v-else>
      {{ $t("auth.page.registration") }}
    </template>
  </Header>

  <HelloName :hello_name="employee_name" />

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

  <ActionButton
      @click="nextStep"
    >
    {{ $t("auth.action.next") }}
  </ActionButton>
</template>

<style scoped>
.radio-group {
  display: flex;
  flex-flow: column;
  gap: 18px;
}
.radio-button {
  background-color: rgba(var(--ion-color-primary-rgb), 7%);
  padding: 26px 18px;
}
</style>
