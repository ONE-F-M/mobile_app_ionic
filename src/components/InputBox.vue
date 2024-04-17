<script setup>
  const model = defineModel();

  const {
    subtitle,
    title,
  } = defineProps({
    subtitle: String,
    title: String,
  })
</script>

<template>
  <div>
    <p class="input-subtitle ion-no-margin">
      {{ subtitle }}
    </p>

    <h1 class="input-title ion-no-margin">
      {{ title }}
    </h1>

    <slot />
  </div>
</template>

<style lang="scss" scoped>
.input-subtitle {
  font-size: 1rem;
  margin-bottom: 6px;
  font-weight: 400;
  color: var(--ion-color-medium-shade);
}

.input-title {
  font-size: 1.5rem;
  line-height: 2rem;
  font-weight: 400;
  margin-bottom: 17px;
  color: var(--ion-color-dark-contrast);
}
</style>
