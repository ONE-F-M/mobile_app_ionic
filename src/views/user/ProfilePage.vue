<script setup>
import {
  IonContent,
  IonPage,
  IonIcon,
  IonSelect,
  IonSelectOption,
  IonButton,
  createAnimation,
  IonModal,
  useIonRouter,
  onIonViewWillEnter,
} from "@ionic/vue";

import { useI18n } from "vue-i18n";

import { chevronForwardOutline } from "ionicons/icons";

import Header from "@/components/Header.vue";

import PenIcon from "@/components/icon/PenIcon.vue";

import { useUserStore } from "@/store/user";
import { computed, reactive, ref } from "vue";
import { useLangStore } from "@/store/lang.js";
import profile from "@/api/profile";
import { useCustomToast } from "@/composable/toast";
import useDisplayImage from "@/composable/useDisplayImage";
import useNotification from "@/composable/useNotification";
import { Capacitor } from '@capacitor/core';

const { t } = useI18n();

const router = useIonRouter();
const langStore = useLangStore();
const userStore = useUserStore();

const { showErrorToast, showSuccessToast } = useCustomToast();
const { formatImageUrl } = useDisplayImage();

const user = reactive({
  name: "",
  id: "",
  picture: "",
  email: "",
  phone: "",
  job_title: "",
  energy_points: 0,
  rank: 0,
  review_points: 0,
  monthly_rank: 0,
});

const selectedLanguage = ref(langStore.lang);
const { unRegisterNotifications } = useNotification();

const platform = computed(() => Capacitor.getPlatform());
const isIOS = computed(() => platform.value === "ios");

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
  ...(!isIOS.value && { enterAnimation: langSelectEnterAnimation }),
  ...(!isIOS.value && { leaveAnimation: langSelectLeaveAnimation }),
};

const updateImage = async (event) => {
  try {
    const file = event.target?.files[0];

    if (!file) {
      return;
    }

    const readerPromise = new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });

    const imageBase64 = await readerPromise;

    const payload = {
      employee_id: userStore.user?.employee_id,
      image: imageBase64.split(",")[1],
    };

    await profile.updateProfileImage(payload);

    await getUserDetails();
    showSuccessToast(t("user.profile.image_updated"));
  } catch (error) {
    console.error(error);
    showErrorToast(error.error);
  }
};

const changeLanguage = (lang) => {
  langStore.setLang(lang);
};

const logout = () => {
  userStore.logout();
  unRegisterNotifications();

  router.navigate("/", "root");
};

const getUserDetails = async () => {
  try {
    const { data } = await profile.getUserProfile({
      employee_id: userStore.user?.employee_id,
    });

    user.name = data.message.Name;
    user.id = data.message.EMP_ID;
    user.picture = data.message.User_Image;
    user.email = data.message.Email;
    user.phone = data.message.Mobile_no;
    user.job_title = data.message.Designation;
    user.energy_points = data.message.Energy_Points;
    user.rank = data.message.Rank;
    user.review_points = data.message.Review_Points;
    user.monthly_rank = data.message.Monthly_Rank;
  } catch (error) {
    console.error(error);
    showErrorToast(error.error);
  }
};

onIonViewWillEnter(async () => {
  await getUserDetails();
});
</script>

<template>
  <ion-page>
    <ion-content class="profile-page">
      <div class="profile-wrapper">
        <div>
          <Header>{{ $t("user.profile.title") }}</Header>

          <div class="account-component">
            <h3 class="headline-small text-dark-tint">
              {{ $t("user.profile.account") }}
            </h3>

            <div id="profile-details" class="profile-details">
              <div class="profile-picture">
                <img
                  :src="formatImageUrl(user.picture) || '/profile_picture.png'"
                  alt="avatar"
                />
              </div>

              <div class="profile-small-info text-dark-tint">
                <div class="profile-name title-medium">{{ user.name }}</div>
                <div class="profile-id body-small">{{ user.id }}</div>
              </div>

              <div class="action-button icon icon-arrow-back">
                <ion-icon
                  class="text-dark-tint"
                  color="light"
                  :icon="chevronForwardOutline"
                />
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
                    <img
                      class="profile-picture-avatar"
                      :src="
                        formatImageUrl(user.picture) || '/profile_picture.png'
                      "
                      alt="avatar"
                    />
                  </div>
                  <label class="label-large" for="file_input">
                    <input
                      id="file_input"
                      class="hidden"
                      type="file"
                      @change="updateImage"
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
            <h3 class="headline-small text-dark-tint mb-0">
              {{ $t("user.profile.settings") }}
            </h3>

            <div class="lang-switcher">
              <ion-select
                v-model="selectedLanguage"
                class="language-select body-large text-dark-tint"
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
          display: flex;
          flex-direction: row-reverse;
        }

        .alert-radio-label {
          font-family: "Roboto", sans-serif;
          font-size: 16px;
          line-height: 24px;
          letter-spacing: 0.5px;
          padding: 0;
        }

        .alert-radio-icon {
          inset-inline-start: 0;
        }
      }
    }

    .alert-button-group {
      gap: 14px;
      padding-inline-end: 2px;
      flex-wrap: nowrap;
      justify-content: flex-end;

      .alert-button {
        text-transform: none;
        margin-inline-end: 0;
        border: none;
        min-width: initial;
        flex-grow: 0;
      }
    }
  }

  &.visible {
    .alert-wrapper.sc-ion-alert-md {
      opacity: 1;
    }
  }
}

.profile-picture-avatar {
  width: 110px;
  height: 110px;
  object-fit: cover;
  overflow: hidden;
  border-radius: 50%;
}
</style>

<style lang="scss" scoped>
.profile-page {
  --padding-top: 0;
  --padding-bottom: 24px;
  --padding-start: 15px;
  --padding-end: 15px;
}

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
    border: 0;

    &::part(icon) {
      margin: 2px -4px 0 auto;
      align-self: center;
      color: inherit;
      width: 17px;
      height: 17px;
    }

    [dir="rtl"] &::part(icon) {
      transform: rotate(180deg);
    }

    &::part(text) {
      display: none;
    }
  }
}

.logout-button {
  height: 40px;
  margin-top: 24px;
  margin-bottom: 12px;
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
