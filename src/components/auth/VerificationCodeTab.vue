<script setup>

  import { watch, ref, reactive, onMounted, onUnmounted } from "vue";

  import { IonInput } from "@ionic/vue";

  import Header from "@/components/Header.vue";
  import InputBox from "@/components/InputBox.vue";
  import ActionButton from "@/components/auth/ActionButton.vue";
  import StepIndicator from "@/components/auth/StepIndicator.vue";

  const emit = defineEmits(["nextStep", "prevStep", "resendCode"]);

  const SECONDS_BEFORE_NEXT_CODE = 120;

  let timeout = null;
  const seconds = ref(SECONDS_BEFORE_NEXT_CODE);
  const code = reactive(new Array(6));
  const isCodeFull = ref(false);

  watch(code, (newCode) => {
    isCodeFull.value = newCode[0] && newCode[1] && newCode[2] && newCode[3] && newCode[4] && newCode[5];
  })

  const secondsCounter = () => {
    seconds.value -= 1;

    if (seconds.value == 0) return

    timeout = setTimeout(secondsCounter, 1000);
  }

  const initSecondsCounter = () => {
    seconds.value = SECONDS_BEFORE_NEXT_CODE;
    timeout = setTimeout(secondsCounter, 1000);
  }

  const resendCode = () => {
    emit("resendCode");
    initSecondsCounter();
  }

  onMounted(() => {
    initSecondsCounter();
  });

  onUnmounted(() => {
    timeout && clearTimeout(timeout);
  });

  const getCode = () => code.join("");

  const pasteCode = async (clip = null) => {
    // not supported
    if (!clip && !navigator.clipboard.readText) return;

    clip = clip || await navigator.clipboard.readText();

    code[0] = clip[0] ?? null;
    code[1] = clip[1] ?? null;
    code[2] = clip[2] ?? null;
    code[3] = clip[3] ?? null;
    code[4] = clip[4] ?? null;
    code[5] = clip[5] ?? null;
  }

  const onIonInput = (evt, id) => {
    if (evt.keyCode == 8 || evt.keyCode == 9 || evt.charCode == 46) {
      return;
    }
    const key = evt.detail.value;

    // ion-input prevents onPaste
    // so we have to call paste manually
    if (key.length == 6) {
      pasteCode(key)
      return;
    }

    if (key == " ") return;
    if (key.length > 1) {
      code[id] = key.slice(-1);
    }
  }

  const onKeyup = (evt, id) => {
    // ignore tab
    if (evt.keyCode == 9) return;

    // backspace and del
    if (evt.keyCode == 8 || evt.charCode == 46) {
      if (id == 0) return;
      document.querySelector(`#input-${id-1} input`).focus();
      return;
    }

    if (id == 5) return;
    if (!code[id]) return;
    document.querySelector(`#input-${id+1} input`).focus();
  }

  const prevStep = () => emit("prevStep");
  const nextStep = () => emit("nextStep", { code: getCode() });
</script>

<template>

  <Header with-back-button @goBack="prevStep">
    {{ $t("auth.page.registration") }}
  </Header>

  <InputBox
    :subtitle="$t('auth.label.enterYour')"
    :title="$t('auth.field.verification_code')"
    >
    <div class="code-wrapper">
      <template v-for="_, index in code" :key="index">
        <ion-input
          class="code-input"
          :id="`input-${index}`"
          @paste="pasteCode"
          @ion-input="(evt) => onIonInput(evt, index)"
          @keyup="(evt) => onKeyup(evt, index)"
          v-model="code[index]"
          />
      </template>
    </div>

    <div class="resend-code-wrapper">
      <template v-if="seconds > 0">
        <span>{{ $t('auth.resend_code_in', { seconds }) }}</span>
      </template>
      <template v-else>
        <a @click="resendCode">
          {{ $t('auth.resend_code_now') }}
        </a>
      </template>
    </div>
  </InputBox>

  <div>
    <StepIndicator class="step-indicator" :step="2" />

    <ActionButton
        :disabled="!isCodeFull"
        @click="nextStep"
      >
      {{ $t("auth.action.verify") }}
    </ActionButton>
  </div>
</template>

<style scoped>
.code-wrapper {
  display: flex;
  gap: 8px;
}
.code-input {
  height: 56px;
  background-color: rgba(var(--ion-color-primary-tint-rgb), 16%);
  text-align: center;
  border-bottom: none;
  border-radius: 8px;
}
.resend-code-wrapper {
  margin-top: 28px;
  text-align: end;
}
.step-indicator {
  margin-bottom: 40px;
}
</style>
