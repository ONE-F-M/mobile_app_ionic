<script setup>
  import { ref, watch } from "vue";
  import { useI18n } from "vue-i18n";

  import { showErrorToast } from "@/utils/toast";

  import { IonInput } from "@ionic/vue";

  import Header from "@/components/Header.vue";
  import InputBox from "@/components/InputBox.vue";
  import ActionButton from "@/components/auth/ActionButton.vue";
  import StepIndicator from "@/components/auth/StepIndicator.vue";
  import HelloName from "@/components/auth/HelloName.vue";


  const { employee_name } = defineProps({
    employee_name: String
  });

  const { t } = useI18n();

  const emit = defineEmits(["nextStep", "prevStep"]);

  /*
    steps:
      password
      confirm
  */
  const step = ref("password");
  const fieldFilled = ref(false);
  const password = ref("");
  const confirm_password = ref("");

  watch(password, (newPass) => fieldFilled.value = newPass.length > 0);
  watch(confirm_password, (newPass) => fieldFilled.value = newPass.length > 0);

  const prevStep = () => emit("prevStep");
  const nextStep = () => {
    if (step.value == "password") {
      step.value = "confirm";
      confirm_password.value = "";
      fieldFilled.value = false;
      return;
    }

    if (password.value != confirm_password.value) {
      showErrorToast(t, t("auth.errors.passwords_mismatch"));
      step.value = "password";
      return;
    }

    emit("nextStep", { password })
    fieldFilled.value = false;
  }
</script>

<template>
  <div>
  <Header with-back-button @goBack="prevStep">
    <slot name="title">
      {{ $t("auth.page.set_password") }}
    </slot>
  </Header>

  <HelloName :hello_name="employee_name" />
  </div>

  <div>
    <template v-if="step == 'password'">
      <InputBox
        :subtitle="$t('auth.label.setYour')"
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
</template>

<style scoped>
.continue-button {
  margin-top: 24px;
}
.step-indicator {
  margin-bottom: 40px;
}
</style>
