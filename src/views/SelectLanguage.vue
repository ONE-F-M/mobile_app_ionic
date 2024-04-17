<script setup>
import IconDoubleArrowRight from "@/components/icon/DoubleArrowRight.vue";
import { IonPage, IonContent, createGesture } from "@ionic/vue";
import { useUserStore } from "@/store/user";
import { useLangStore } from "@/store/lang";
import { useIonRouter } from "@ionic/vue";
import { useI18n } from "vue-i18n";
import { onMounted, ref } from "vue";

const router = useIonRouter();

const userStore = useUserStore();
const langStore = useLangStore();
const i18n = useI18n();

let deltaX = ref(0);
let isAnimated = ref(false);
const content = ref();
let gesture;

if (userStore.user && langStore.lang) {
  router.push("/user/");
}

const selectArabic = () => {
  langStore.setLang("ar");

  i18n.locale.value = "ar";
  router.push("/login");
};

const selectEnglish = () => {
  langStore.setLang("en");
  i18n.locale.value = "en";
  router.push("/login");
};

function checkDirection() {
  if (deltaX.value < -30) {
    selectArabic();
  }
  if (deltaX.value > 30) {
    selectEnglish();
  }
}

const onMove = (detail) => {
  deltaX.value = detail.deltaX;
};

const onEnd = () => {
  checkDirection();

  setTimeout(() => {
    deltaX.value = 0;
  }, 400);
};

onMounted(() => {
  gesture = createGesture({
    el: content.value.$el,
    onMove: (detail) => onMove(detail),
    onEnd: () => onEnd(),
    gestureName: "selectLang",
  });

  gesture.enable();

  setTimeout(() => {
    isAnimated.value = true
  }, 1000)
});
</script>

<template>
  <ion-page>
    <ion-content ref="content">
      <div class="lang-wrapper">
        <ion-row
          class="ion-align-items-center ion-justify-content-center lang-selector-logo"
          :class="{ 'animated': isAnimated }"
        >
          <img src="/image/logo.svg" alt="logo" />
        </ion-row>

        <div
          class="lang-selector-wrapper"
          :style="`--translate-x-lang-wrapper:${deltaX * 0.3}px;`"
        >
          <ion-button
            @click="selectArabic"
            fill="clear"
            color="light"
            class="lang-selector-button-wrapper lang-selector-button-wrapper__ar"
            dir="rtl"
            :class="{ 'animated': isAnimated }"
          >
            <ion-row
              class="ion-justify-content-between lang-selector-button-wrapper"
            >
              <ion-col class="ion-text-start ion-no-padding">
                <ion-text>
                  <p
                    class="ion-no-margin lang-selector-subtitle lang-selector-subtitle__ar"
                  >
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
                <p
                  class="lang-selector-lang-name lang-selector-lang-name__ar ion-no-margin ion-margin-start"
                >
                  عربى
                </p>
              </ion-row>
            </ion-row>
          </ion-button>
          <ion-button
            @click="selectEnglish"
            fill="clear"
            color="light"
            class="lang-selector-button-wrapper lang-selector-button-wrapper__en"
            dir="ltr"
            :class="{ 'animated': isAnimated }"
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
                <span>
                  <IconDoubleArrowRight
                    class="lang-selector-lang-name__en-icon"
                  />
                </span>
                <p
                  class="lang-selector-lang-name lang-selector-lang-name__en ion-no-margin"
                >
                  English
                </p>
              </ion-row>
            </ion-row>
          </ion-button>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<style lang="scss" scoped>
.lang-wrapper {
  padding: 24px 14px 16px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.lang-selector {
  &-wrapper {
    margin-top: 98px;
    transition: transform 0.3s ease;
    transform: translateX(var(--translate-x-lang-wrapper));
  }

  &-lang-name {
    &__ar {
      font-size: 1.125rem;
      margin-right: 20px;
    }

    &__en {
      margin-left: 25px;
      margin-bottom: 8px;
    }

    &__en-icon {
      margin-bottom: 8px;
    }

    font-size: 1.125rem;
    line-height: 1.5rem;
    color: var(--ion-color-secondary-tint);
  }

  &-title {
    font-size: 2rem;
    line-height: 2.5rem;

    font-family: "Readex Pro", sans-serif;

    &__en {
      max-width: max(200px, 60%);
      font-size: 1.85rem;
      word-wrap: break-word;

      @media (max-width: 359px) {
        font-size: 1.65rem;
      }
    }

    &__ar {
      font-weight: 700;
      padding-right: 4px;
      padding-bottom: 1px;
      font-family: "Cairo", "sans-serif";
      font-size: 2rem;
      line-height: 2.5rem;
      overflow: inherit;
      max-width: max(130px, 50%);

      @media (max-width: 359px) {
        font-size: 1.80rem;
      }
    }
  }

  &-subtitle {
    font-size: 1.5rem;
    line-height: 2rem;
    font-weight: 400;
    color: var(--ion-color-medium-shade);
    text-wrap: initial;
    font-family: "Readex Pro", sans-serif;

    &__ar {
      font-family: "Cairo", "sans-serif";
      line-height: 1.85rem;
    }
  }

  &-button-wrapper {
    width: 100%;
    flex-wrap: nowrap;
    transition: transform .75s ease;
    transform: translateX(0);

    &__ar {
      &::part(native) {
        padding: 0 0 0 14px;
      }

      &:not(.animated) {
        transform: translateX(150%);
      }
    }

    &__en {
      margin-top: 36px;

      &::part(native) {
        padding: 0 16px 0 0;
      }

      &:not(.animated) {
        transform: translateX(-150%);
      }
    }
  }

  &-logo {
    position: relative;
    top: 0;
    transition: all .75s ease;
    z-index: 2;

    &:not(.animated) {
      top: 50%;
      transform: translateY(-50%) scale(1.5);
    }
  }

  &-icon-wrapper {
    flex-wrap: nowrap;
    flex-shrink: 0;
  }
}
</style>
