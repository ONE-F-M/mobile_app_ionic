<template>
  <div v-if="blocked" class="update-gate" role="alertdialog" aria-modal="true">
    <h1>{{ t("utils.update_required.title") }}</h1>
    <p>{{ t("utils.update_required.message") }}</p>
    <ion-button expand="block" @click="openStore">
      {{ t("utils.update") }}
    </ion-button>
  </div>
  <div v-else-if="showBanner" class="update-banner" role="status">
    <span class="update-banner__message">
      {{ t("utils.update_available.message") }}
    </span>
    <ion-button size="small" @click="openStore">
      {{ t("utils.update") }}
    </ion-button>
    <ion-button size="small" fill="clear" @click="dismissBanner">
      {{ t("utils.later") }}
    </ion-button>
  </div>
</template>

<script setup>
import { IonButton } from "@ionic/vue";
import { useI18n } from "vue-i18n";
import { useAppVersion } from "@/composable/useAppVersion.js";

const { t } = useI18n();
const { blocked, showBanner, storeUrl, dismissBanner } = useAppVersion();

const openStore = () => {
  if (storeUrl.value) window.open(storeUrl.value, "_system");
};
</script>

<style scoped>
.update-gate {
  position: fixed;
  inset: 0;
  z-index: 100000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 24px;
  text-align: center;
  background: var(--ion-background-color, #fff);
  color: var(--ion-text-color, #000);
}

.update-banner {
  position: fixed;
  inset-inline: 0;
  top: 0;
  z-index: 99999;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: calc(env(safe-area-inset-top, 0px) + 8px) 12px 8px;
  background: var(--ion-color-primary, #3880ff);
  color: var(--ion-color-primary-contrast, #fff);
}

.update-banner__message {
  flex: 1;
}
</style>
