<template>
  <ion-app :class="appClasses" :dir="rtl ? 'rtl' : 'ltr'">
    <ion-router-outlet />
  </ion-app>
</template>

<script setup>
import { IonApp, IonRouterOutlet } from "@ionic/vue";
import { useLangStore } from "@/store/lang.js";
import { useUserStore } from "@/store/user.js";
import { storeToRefs } from "pinia";
import { computed, onMounted, onUnmounted } from 'vue';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { useResignationNotifier } from '@/composable/useResignationNotifier';

const langStore = useLangStore();
const { rtl } = storeToRefs(langStore);
const userStore = useUserStore();

const { checkForUpdates } = useResignationNotifier();
let appStateListener;

onMounted(async () => {
  // Restore auth tokens from localStorage if "Remember Me" was checked
  restoreAuthFromLocalStorage();

  checkForUpdates();
  appStateListener = await CapacitorApp.addListener('appStateChange', ({ isActive }) => {
    if (isActive) checkForUpdates();
  });
});

// Restore authentication data from localStorage if user had "Remember Me" checked
const restoreAuthFromLocalStorage = () => {
  try {
    const savedToken = localStorage.getItem('auth_token');
    const savedRefreshToken = localStorage.getItem('refresh_token');
    const savedUserData = localStorage.getItem('user_data');

    // Only restore if we have at least the token and user data
    if (savedToken && savedUserData) {
      const userData = JSON.parse(savedUserData);
      userStore.setUser(userData);
      userStore.setToken(savedToken);

      if (savedRefreshToken) {
        userStore.setRefreshToken(savedRefreshToken);
      }

      // Restore other user state if available
      if (userData.endpoint_state !== undefined) {
        userStore.setEndpointStatus(userData.endpoint_state);
      }
      if (userData.shift_working !== undefined) {
        userStore.setShiftWorking(userData.shift_working);
      }
    }
  } catch (error) {
    // Silently fail if localStorage data is corrupted
    console.warn('Failed to restore auth from localStorage:', error);
  }
};

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
