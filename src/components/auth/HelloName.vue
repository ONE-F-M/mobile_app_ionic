<script setup>
  const { hello_name } = defineProps({ hello_name: String });
</script>

<template>
  <div class="hello-wrapper">
    {{ $t("login.hello") }}
    <h5 v-if="hello_name">{{ hello_name }}</h5>
  </div>
</template>

<style lang="scss" scoped>
.hello-wrapper {
  margin-top: 13px;
  font-size: 1rem;
  line-height: 1.5rem;
  font-weight: 500;
  color: var(--ion-color-medium-shade);

  h5 {
    font-size: 1.75rem;
    line-height: 2rem;
    font-weight: 400;
    margin-top: 5px;
    color: var(--ion-color-primary);
  }
}
</style>

