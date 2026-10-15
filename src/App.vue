<template>
  <ion-app :class="appClasses" :dir="rtl ? 'rtl' : 'ltr'">
    <ion-router-outlet />
    <AppUpdateGate />
  </ion-app>
</template>

<script setup>
import { IonApp, IonRouterOutlet } from "@ionic/vue";
import { useLangStore } from "@/store/lang.js";
import { storeToRefs } from "pinia";
import { computed, onMounted, onUnmounted } from 'vue';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { useResignationNotifier } from '@/composable/useResignationNotifier';
import { useExitOnBack } from "@/composable/useExitOnBack.js";
import { consumePendingNotificationUrl, usePushRegistration } from "@/composable/usePushRegistration.js";
import { useAppVersion } from "@/composable/useAppVersion.js";
import AppUpdateGate from "@/components/AppUpdateGate.vue";

const langStore = useLangStore();
const { rtl } = storeToRefs(langStore);

const { checkForUpdates } = useResignationNotifier();
useExitOnBack();
const { addListeners } = usePushRegistration();
const { checkAppVersion } = useAppVersion();
let appStateListener;

onMounted(async () => {
  checkAppVersion();
  checkForUpdates();
  // A signed-in launch never reaches the login page, so the tap listener is attached here.
  addListeners()
    .then(consumePendingNotificationUrl)
    .catch((err) => console.error("Failed to open the tapped notification: ", err));
  appStateListener = await CapacitorApp.addListener('appStateChange', ({ isActive }) => {
    if (isActive) checkForUpdates();
  });
});

onUnmounted(() => {
  appStateListener?.remove();
});

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
