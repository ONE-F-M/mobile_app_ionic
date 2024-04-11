<script setup>
import IconDoubleArrowRight from "@/components/icon/DoubleArrowRight.vue";
import { IonPage, IonContent } from "@ionic/vue";
import { useUserStore } from "@/store/user";
import { useLangStore } from "@/store/lang";
import { useIonRouter } from "@ionic/vue";
import { useI18n } from "vue-i18n";

const router = useIonRouter();

const userStore = useUserStore();
const langStore = useLangStore();
const i18n = useI18n();

if (userStore.user && langStore.lang) {
  console.log("going home");
  router.push("/home");
}

const selectArabic = () => {
  langStore.setLang("ar");

  i18n.locale.value = "ar";
  router.push("/home");
};

const selectEnglish = () => {
  langStore.setLang("en");
  i18n.locale.value = "en";
  router.push("/home");
};
</script>

<template>
  <ion-page>
    <ion-content>
      <div class="lang-wrapper ion-padding">
        <ion-row
          class="ion-align-items-center ion-justify-content-center ion-padding"
        >
          <img src="/image/logo.svg" alt="logo" />
        </ion-row>

        <div class="lang-selector-wrapper">
          <ion-button
            @click="selectArabic"
            fill="clear"
            color="light"
            class="lang-selector-button-wrapper"
            dir="rtl"
          >
            <ion-row
              class="ion-justify-content-between lang-selector-button-wrapper"
            >
              <ion-col class="ion-text-start">
                <ion-text>
                  <p class="ion-no-margin lang-selector-subtitle">
                    مرحبا بك في
                  </p>
                  <p
                    class="ion-no-margin lang-selector-title lang-selector-title__ar ion-text-wrap"
                  >
                    ون لإدارة المرافق
                  </p>
                </ion-text>
              </ion-col>
              <ion-row
                class="ion-align-items-center lang-selector-icon-wrapper"
              >
                <IconDoubleArrowRight class="icon-locale-rotate" />
                <p class="lang-selector-lang-name ion-no-margin">عربى</p>
              </ion-row>
            </ion-row>
          </ion-button>
          <ion-button
            @click="selectEnglish"
            fill="clear"
            color="light"
            class="lang-selector-button-wrapper"
            dir="ltr"
          >
            <ion-row
              class="ion-justify-content-between lang-selector-button-wrapper"
            >
              <ion-col class="ion-text-start ion-no-padding">
                <ion-text>
                  <p class="ion-no-margin lang-selector-subtitle">Welcome to</p>
                  <p
                    class="ion-no-margin lang-selector-title lang-selector-title__en ion-text-wrap"
                  >
                    One Facilities Management
                  </p>
                </ion-text>
              </ion-col>
              <ion-row
                class="ion-align-items-center lang-selector-icon-wrapper"
              >
                <IconDoubleArrowRight />
                <p class="lang-selector-lang-name ion-no-margin">English</p>
              </ion-row>
            </ion-row>
          </ion-button>
        </div>
        <div />
      </div>
    </ion-content>
  </ion-page>
</template>

<style lang="scss" scoped>
.lang-wrapper {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.lang-selector {
  &-lang-name {
    font-size: 1.125rem;
    line-height: 1.5rem;
    color: var(--ion-color-secondary-tint);
  }

  &-title {
    font-size: 2rem;
    line-height: 2.5rem;

    font-family: "Readex Pro", sans-serif;

    &__en {
      font-size: 1.8rem;
      word-wrap: break-word;
    }

    &__ar {
      max-width: max(120px, 50%);
    }
  }

  &-subtitle {
    font-size: 1.5rem;
    line-height: 2rem;
    font-weight: 400;
    color: var(--ion-color-medium-shade);
    text-wrap: initial;
    font-family: "Readex Pro", sans-serif;
  }

  &-button-wrapper {
    width: 100%;
    flex-wrap: nowrap;
  }

  &-icon-wrapper {
    flex-wrap: nowrap;
    gap: 18px;
    flex-shrink: 0;
  }
}
</style>
