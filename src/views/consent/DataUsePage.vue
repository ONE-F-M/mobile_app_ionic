<script setup>
import { IonButton, IonContent, IonPage, useIonRouter } from "@ionic/vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import { saveDataUseConsent } from "@/composable/useDataUseConsent.js";

const PRIVACY_POLICY_URL = "https://app.one-fm.com/privacy_policy/";

const { t } = useI18n();
const route = useRoute();
const router = useIonRouter();

// Only follow in-app paths, never an address someone put in the link.
const nextPath = () => {
  const next = route.query.next;
  return typeof next === "string" && next.startsWith("/") && !next.startsWith("//")
    ? next
    : "/dashboard";
};

const accept = async () => {
  await saveDataUseConsent();
  router.replace(nextPath());
};

const decline = () => {
  router.replace("/dashboard");
};
</script>

<template>
  <ion-page>
    <ion-content class="ion-padding">
      <div class="data-use">
        <div>
          <h2 class="data-use-title">{{ t("consent.title") }}</h2>
          <p class="data-use-text">{{ t("consent.face_video") }}</p>
          <p class="data-use-text">{{ t("consent.location") }}</p>
          <a
            class="data-use-link"
            :href="PRIVACY_POLICY_URL"
            target="_blank"
            rel="noopener"
          >
            {{ t("consent.privacy_link") }}
          </a>
        </div>

        <div class="data-use-actions">
          <ion-button
            class="data-use-button"
            expand="block"
            shape="round"
            @click="accept"
          >
            {{ t("consent.continue") }}
          </ion-button>
          <ion-button
            class="data-use-button"
            expand="block"
            shape="round"
            fill="clear"
            @click="decline"
          >
            {{ t("consent.not_now") }}
          </ion-button>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<style lang="scss" scoped>
.data-use {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 24px;

  &-title {
    margin: 16px 0 16px;
    font-size: 1.5rem;
    line-height: 2rem;
    font-weight: 500;
    color: var(--ion-color-dark-contrast);
  }

  &-text {
    font-size: 1rem;
    line-height: 1.5rem;
    color: var(--ion-color-dark-contrast);
  }

  &-link {
    display: inline-block;
    margin-top: 8px;
    font-size: 1rem;
    font-weight: 500;
    color: var(--ion-color-secondary);
  }

  &-button {
    min-height: 46px;
    font-weight: 700;
  }
}
</style>
