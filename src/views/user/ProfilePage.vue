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

import {
  chevronForwardOutline
} from "ionicons/icons";

import Header from "@/components/Header.vue";

import PenIcon from "@/components/icon/PenIcon.vue";

import { useUserStore } from "@/store/user";


const { t } = useI18n();

const router = useIonRouter();
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
}

const langSelectEnterAnimation = (el) => 
  createAnimation()
    .addElement(el)
    .duration(400)
    .fromTo('opacity', '0', '1')
    .beforeAddClass('visible')

const langSelectLeaveAnimation = (el) => 
  createAnimation()
    .addElement(el)
    .duration(400)
    .fromTo('opacity', '1', '0')
    .afterRemoveClass('visible')

const langSelectAlertOptions = {
  cssClass: "profile-select-language-alert-wrapper",
  header: t("user.profile.language.alert_header"),
  enterAnimation: langSelectEnterAnimation,
  leaveAnimation: langSelectLeaveAnimation,
}


const logout = () => {
  userStore.logout();
  router.push("/");
};
</script>

<template>
  <ion-page>
    <ion-content class="ion-padding">
      <Header>{{ $t("user.profile.title") }}</Header>

      <div class="account-component">
        <h3 class="headline-small">{{ $t("user.profile.account") }}</h3>

        <div id="profile-details" class="profile-details" @click="openProfileDetails">
          <div class="profile-picture">
            <img :src="user.picture" />
          </div>

          <div class="profile-small-info">
            <div clas="profile-name title-medium">{{ user.name }}</div>
            <div class="profile-id body-small">{{ user.id }}</div>
          </div>

          <div class="action-button">
            <ion-icon
              color="light"
              :icon="chevronForwardOutline"
              />
          </div>
        </div>
        <ion-modal
          class="full-profile-modal"
          trigger="profile-details"
          :initial-breakpoint="0.6"
          >
          <ion-content class="full-profile-content ion-padding">
            <div class="profile-picture-change">
              <div class="profile-picture">
                <img :src="user.picture" />
              </div>
              <label class="label-large" for="file_input">
                <input id="file_input" class="hidden" type="file" />

                <PenIcon />
                <span>{{ $t("user.profile.set_profile_image") }}</span>
              </label>
            </div>
            <div class="modal-profile-details">
              <div class="line">{{ user.name }}</div>
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
          <ion-list class="ion-list">
            <ion-item class="ion-item">
              <ion-select
                class="language-select body-large"
                :label="$t('user.profile.language.label')"
                :toggle-icon="chevronForwardOutline"
                :expanded-icon="chevronForwardOutline"
                :interface-options="langSelectAlertOptions"
                :cancelText="$t('user.profile.language.cancel_text')"
                :okText="$t('user.profile.language.ok_text')"
                >
                <ion-select-option value="en">
                  {{ $t("user.profile.language.en") }}
                </ion-select-option>
                <ion-select-option value="ar">
                  {{ $t("user.profile.language.ar") }}
                </ion-select-option>
              </ion-select>
            </ion-item>
          </ion-list>

          <!--
          <div>{{ $t("user.profile.language") }}</div>

          <div class="action-button">
            <ion-icon
              color="light"
              :icon="chevronForwardOutline"
              />
          </div>
          -->
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
    </ion-content>

    <div class="pixel-perfect"></div>
  </ion-page>
</template>

<style lang="scss">
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
    background-color: var(--ion-color-secondary-contrast);
    border-radius: 28px;
    width: 308px;
    max-width: none;
    padding: 7px 22px;


    .alert-title {
      font-size: 24px;
      line-height: 32px;
      letter-spacing: -0.2px;
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
          font-family: 'Roboto', sans-serif;
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
    background-color: rgba(var(--ion-color-primary-rgb), 8%);
    color: var(--ion-color-dark-contrast);
    padding: 12px;

    display: flex;
    flex-flow: column;
    align-items: center;
    justify-content: center;
  }
}

.lang-switcher  {
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
    font-family: 'Roboto', sans-serif;
    background: none;
    --min-height: 0;
    min-height: 0;

    &::part(icon) {
      margin: 2px -4px 0 auto;
      align-self: center;
      color: inherit;
      width: 17px;
      height: 17px;
    }
  }
}

.logout-button {
  margin-top: 167px;
  font-family: 'Readex Pro', sans-serif;
}

.full-profile-modal {
  --border-radius: 16px 16px 0 0;

  .full-profile-content {
    background-color: var(--ion-color-secondary-contrast);
    --background: var(--ion-color-secondary-contrast);

    .modal-profile-details {
      display: flex;
      flex-flow: column;
      gap: 29px;
      margin-top: 35px;
      padding: 0 8px;
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
