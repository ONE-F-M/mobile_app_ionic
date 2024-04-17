<script setup>
  import { ref, watch } from "vue";

  import { IonInput } from "@ionic/vue";

  import Header from "@/components/Header.vue";
  import InputBox from "@/components/InputBox.vue";
  import ActionButton from "@/components/auth/ActionButton.vue"

  const emit = defineEmits(["nextStep", "prevStep"])

  const employeeId = ref("");
  const validId = ref(false);

  watch(employeeId, (newId) => {
    validId.value = newId.length <= 12 && newId.length > 0
  })

  const nextStep = () => emit("nextStep", { employeeId: employeeId.value });
  const prevStep = () => emit("prevStep");
</script>

<template>
  <Header with-back-button @goBack="prevStep">{{ $t("auth.page.employeeId") }}</Header>

  <InputBox
    :subtitle="$t('auth.label.enterYour')"
    :title="$t('auth.field.employeeId')"
    >
    <ion-input
      v-model="employeeId"
      fill="outline"
      :placeholder="$t('auth.placeholder.id')"
      />
  </InputBox>

  <ActionButton
      :disabled="!validId"
      @click="nextStep"
    >
    {{ $t("auth.action.next") }}
  </ActionButton>
</template>

