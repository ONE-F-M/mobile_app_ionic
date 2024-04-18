<script setup>
// from 1 to 3
const { step } = defineProps({ step: Number });
</script>

<template>
  <div class="steps-container">
    <div class="step" :class="{ active: step >= 1 }"></div>
    <div class="step" :class="{ active: step >= 2 }"></div>
    <div class="step" :class="{ active: step >= 3 }"></div>
  </div>
</template>

<style scoped>
.steps-container {
  margin-top: 20px;
  display: flex;
  gap: 8px;
  justify-content: center;
}

.step {
  width: 28px;
  border-color: var(--ion-color-medium-shade);
  border-bottom: 2px solid;
}
.step.active {
  border-color: var(--ion-color-primary);
}
</style>
