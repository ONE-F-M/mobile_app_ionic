<template>
  <ion-app :class="{rtl: rtl}" :dir="rtl ? 'rtl' : 'ltr'">
    <ion-router-outlet />
  </ion-app>
</template>

<script setup>
import { IonApp, IonRouterOutlet } from "@ionic/vue";
import { useLangStore } from "@/store/lang.js";
import { storeToRefs } from "pinia";

const langStore = useLangStore();
const { rtl } = storeToRefs(langStore);
</script>
