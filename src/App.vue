<template>
  <ion-app :class="appClasses" :dir="rtl ? 'rtl' : 'ltr'">
    <ion-router-outlet />
  </ion-app>
</template>

<script setup>
import { IonApp, IonRouterOutlet } from "@ionic/vue";
import { useLangStore } from "@/store/lang.js";
import { storeToRefs } from "pinia";
import { computed } from 'vue';
import { Capacitor } from '@capacitor/core';

const langStore = useLangStore();
const { rtl } = storeToRefs(langStore);

const platform = computed(() => Capacitor.getPlatform());
const isIOS = computed(() => platform.value === "ios");

const appClasses = computed(() => {
  const classes = [];

  if (isIOS.value) {
    classes.push('ios', 'ion-page');
  }
  if (rtl.value) {
    classes.push('rtl');
  }

  return classes;
});
</script>
