<script setup>
  import {
    IonRow,
    IonButton,
    IonText
  } from "@ionic/vue";

  const { disabled } = defineProps({
    disabled: Boolean
  });

  const emit = defineEmits(["click"]);

  const onClicked = () => emit("click");
</script>

<template>
  <ion-row class="ion-justify-content-end">
    <ion-button
      fill="clear"
      strong
      :disabled="disabled"
      @click="onClicked"
      router-direction="back"
    >
      <ion-text>
        <h4 class="ion-no-margin action-button">
          <slot />
        </h4>
      </ion-text>
    </ion-button>
  </ion-row>
</template>

<style scoped>
.action-button {
  font-weight: 400;
  font-size: 1.125rem;
}
</style>

