<script setup>
defineProps({
  message: {
    type: String,
    default: "",
  },
});
</script>

<template>
  <div v-if="message" class="checkin-banner" role="status" aria-live="polite">
    <!-- MdiIcon is registered globally in main.js; the webfont is no longer bundled. -->
    <MdiIcon name="alert-outline" :size="20" class="checkin-banner-icon" />
    <p class="checkin-banner-message">{{ message }}</p>
  </div>
</template>

<style lang="scss" scoped>
.checkin-banner {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-top: 16px;
  padding: 12px 14px;
  border-radius: 12px;
  background: var(--ion-color-warning-shade);
  color: var(--ion-color-warning-tint);

  &-icon {
    flex: 0 0 auto;
    margin-top: 1px;
  }

  &-message {
    margin: 0;
    font-size: 0.875rem;
    line-height: 1.25rem;
    font-weight: 500;
  }
}
</style>
