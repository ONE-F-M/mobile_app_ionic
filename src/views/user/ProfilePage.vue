<script setup>
import {
  IonCol,
  IonContent,
  IonPage,
  IonRow,
  IonIcon,
  IonList,
  IonItem,
  IonSelect,
  IonSelectOption,
  IonButton,
  createAnimation,
  IonModal,
  useIonRouter,
} from "@ionic/vue";

import { useI18n } from "vue-i18n";

import { chevronForwardOutline } from "ionicons/icons";

import Header from "@/components/Header.vue";

import PenIcon from "@/components/icon/PenIcon.vue";

import { useUserStore } from "@/store/user";
import { ref } from "vue";
import { useLangStore } from "@/store/lang.js";

const { t } = useI18n();

const router = useIonRouter();
const langStore = useLangStore();
const userStore = useUserStore();

const user = {
  name: "John Doe",
  id: "HR-EMP-12345",
  picture: "/profile_picture.png",
  email: "h.javed@one-fm.com",
  phone: "+965 12345678",
  job_title: "UI/UX Engineer",
  // picture: "bobross.jpeg"
  // picture: "tall_test.jpeg"
};

const selectedLanguage = ref(langStore.lang);

const langSelectEnterAnimation = (el) =>
  createAnimation()
    .addElement(el)
    .duration(400)
    .fromTo("opacity", "0", "1")
    .beforeAddClass("visible");

const langSelectLeaveAnimation = (el) =>
  createAnimation()
    .addElement(el)
    .duration(400)
    .fromTo("opacity", "1", "0")
    .afterRemoveClass("visible");

const langSelectAlertOptions = {
  cssClass: "profile-select-language-alert-wrapper",
  header: t("user.profile.language.alert_header"),
  enterAnimation: langSelectEnterAnimation,
  leaveAnimation: langSelectLeaveAnimation,
};

const updateImage = (event) => {
  console.log("update image event", event);
};

const changeLanguage = (lang) => {
  langStore.setLang(lang);
};

const logout = () => {
  userStore.logout();
  router.push("/");
};
</script>

<template>
  <ion-page>
    <ion-content class="ion-padding">
      <div class="profile-wrapper">
        <div>
          <Header>{{ $t("user.profile.title") }}</Header>

          <div class="account-component">
            <h3 class="headline-small">{{ $t("user.profile.account") }}</h3>

            <div
              id="profile-details"
              class="profile-details"
              @click="openProfileDetails"
            >
              <div class="profile-picture">
                <img :src="user.picture" />
              </div>

              <div class="profile-small-info">
                <div clas="profile-name title-medium">{{ user.name }}</div>
                <div class="profile-id body-small">{{ user.id }}</div>
              </div>

              <div class="action-button">
                <ion-icon color="light" :icon="chevronForwardOutline" />
              </div>
            </div>
            <ion-modal
              class="full-profile-modal"
              trigger="profile-details"
              :initial-breakpoint="0.6"
              :breakpoints="[0, 0.6, 0.75, 1]"
            >
              <ion-content class="full-profile-content ion-padding">
                <div class="profile-picture-change">
                  <div class="profile-picture">
                    <img :src="user.picture" />
                  </div>
                  <label class="label-large" for="file_input">
                    <input
                      id="file_input"
                      class="hidden"
                      type="file"
                      @select="updateImage"
                    />

                    <PenIcon />
                    <span>{{ $t("user.profile.set_profile_image") }}</span>
                  </label>
                </div>
                <div class="modal-profile-details">
                  <div class="line modal-profile-details-name">
                    {{ user.name }}
                  </div>
                  <div class="line">{{ user.email }}</div>
                  <div class="line">{{ user.phone }}</div>
                  <div class="line">{{ user.job_title }}</div>
                  <div class="line">{{ user.id }}</div>
                </div>
              </ion-content>
            </ion-modal>
            <div class="profile-stats body-medium">
              <div class="profile-stats-block">
                <span class="profile-stats-title">
                  {{ $t("user.profile.stats.energy_points") }}
                </span>
                <span class="profile-stats-counter title-large">0</span>
              </div>
              <div class="profile-stats-block">
                <span class="profile-stats-title">
                  {{ $t("user.profile.stats.review_points") }}
                </span>
                <span class="profile-stats-counter title-large">0</span>
              </div>
              <div class="profile-stats-block">
                <span class="profile-stats-title">
                  {{ $t("user.profile.stats.rank") }}
                </span>
                <span class="profile-stats-counter title-large">0</span>
              </div>
              <div class="profile-stats-block">
                <span class="profile-stats-title">
                  {{ $t("user.profile.stats.monthly_rank") }}
                </span>
                <span class="profile-stats-counter title-large">0</span>
              </div>
            </div>
          </div>

          <div class="settings-component">
            <h3 class="headline-small">
              {{ $t("user.profile.settings") }}
            </h3>

            <div class="lang-switcher">
              <ion-select
                v-model="selectedLanguage"
                class="language-select body-large"
                :label="$t('user.profile.language.label')"
                :toggle-icon="chevronForwardOutline"
                :expanded-icon="chevronForwardOutline"
                :interface-options="langSelectAlertOptions"
                :cancelText="$t('user.profile.language.cancel_text')"
                :okText="$t('user.profile.language.ok_text')"
                @update:model-value="changeLanguage"
              >
                <ion-select-option value="en">
                  {{ $t("user.profile.language.en") }}
                </ion-select-option>
                <ion-select-option value="ar">
                  {{ $t("user.profile.language.ar") }}
                </ion-select-option>
              </ion-select>
            </div>
          </div>
        </div>

        <ion-button
          class="logout-button title-medium"
          expand="block"
          shape="round"
          @click="logout"
        >
          {{ $t("user.profile.logout") }}
        </ion-button>
      </div>
    </ion-content>
  </ion-page>
</template>

<style lang="scss">
.profile-wrapper {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

/* lang select */
.profile-select-language-alert-wrapper {
  --backdrop-opacity: 25%;
  transition-timing-function: ease-in-out;

  .alert-head {
    padding-inline-start: 0;
    padding-bottom: 20px;
  }

  .alert-wrapper {
    /* blend of --ion-color-dark and --ion-color-primary with 11% opacity */
    background-color: #233036;
    border-radius: 28px;
    width: 308px;
    max-width: none;
    padding: 7px 22px;

    .alert-title {
      font-size: 24px;
      line-height: 32px;
      font-weight: 400;
      font-family: "Readex Pro", sans-serif;
      letter-spacing: 0.2px;
    }

    .alert-radio-group {
      border: none;
      display: flex;
      flex-flow: column;
      gap: 8px;
      margin: 11px 0 17px;

      .alert-radio-button {
        border-bottom: 1px solid var(--ion-color-medium-shade);

        .alert-button-inner {
          padding-bottom: 8px;
        }

        .alert-radio-label {
          font-family: "Roboto", sans-serif;
          font-size: 16px;
          line-height: 24px;
          letter-spacing: 0.5px;
          padding: 0;
        }

        .alert-radio-icon {
          order: 2;
          margin-right: 28px;
        }
      }
    }

    .alert-button-group {
      gap: 14px;
      padding-inline-end: 2px;

      .alert-button {
        text-transform: none;
        margin-inline-end: 0;
      }
    }
  }

  &.visible {
    .alert-wrapper.sc-ion-alert-md {
      opacity: 1;
    }
  }
}
</style>

<style lang="scss" scoped>
.profile-details {
  display: flex;
  height: 54px;
  justify-content: flex-start;
  gap: 17px;
  margin: 0 10px;

  .profile-picture {
    width: 54px;
    overflow: hidden;
    border-radius: 50%;

    img {
      object-fit: cover;
      width: 100%;
      height: 100%;
    }
  }

  .profile-small-info {
    display: flex;
    flex-flow: column;
    gap: 3px;
    margin: 9px 0px;

    .profile-name {
      letter-spacing: 0.3px;
    }
    .profile-id {
      letter-spacing: -0.3px;
    }
  }

  .action-button {
    margin: 5px 2px 0 auto;
    align-self: center;
  }
}

.profile-stats {
  display: grid;
  gap: 8px;
  grid-template-columns: 1fr 1fr;
  margin-top: 19px;

  .profile-stats-block {
    background-color: #202b2f;
    color: var(--ion-color-dark-contrast);
    padding: 12px;
    border-radius: 8px;

    display: flex;
    flex-flow: column;
    align-items: center;
    justify-content: center;
    text-align: center;
  }
}

.lang-switcher {
  --ion-item-background: none;

  .ion-item {
    --min-height: 0;
    --ion-padding: 2px;
    --padding-start: 0;
  }

  .ion-list {
    --ion-padding: 0;
    padding: 0;
  }

  .language-select {
    padding: 12px 0;
    font-family: "Roboto", sans-serif;
    background: none;
    --min-height: 0;
    --highlight-color-focused: transparent;
    min-height: 0;

    &::part(icon) {
      margin: 2px -4px 0 auto;
      align-self: center;
      color: inherit;
      width: 17px;
      height: 17px;
    }

    &::part(text) {
      display: none;
    }
  }
}

.logout-button {
  height: 40px;
  margin-top: 24px;
  font-family: "Readex Pro", sans-serif;
}

.full-profile-modal {
  --border-radius: 16px 16px 0 0;

  .full-profile-content {
    background-color: #233036;
    --background: var(--ion-color-secondary-contrast);

    .modal-profile-details {
      display: flex;
      flex-flow: column;
      gap: 24px;
      margin-top: 24px;
      padding: 0 8px;
      font-size: 1rem;
      line-height: 1.5rem;
      font-weight: 300;
      font-family: "Roboto", sans-serif;

      &-name {
        font-weight: 500;
      }
    }

    .profile-picture-change {
      display: flex;
      flex-flow: column;
      justify-content: center;
      align-items: center;

      label {
        color: var(--ion-color-primary);
        display: flex;
        gap: 8px;
        margin-top: 30px;
      }
    }
  }
}

.hidden {
  display: none;
}
</style>
