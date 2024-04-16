<script setup>
import {
  IonInput,
  IonIcon,
  IonRow,
  IonCol,
  IonButton,
  toastController,
  IonPage,
  IonContent,
  IonSpinner,
  useIonRouter,
  onIonViewDidLeave,
} from "@ionic/vue";
import {reactive, ref, computed, onUnmounted, onMounted} from "vue";

import {
  arrowBackOutline,
  closeOutline,
  checkmarkOutline,
} from "ionicons/icons";
import auth from "@/api/authentication";
import { useUserStore } from "@/store/user";

const userStore = useUserStore();
const router = useIonRouter();

const step = ref(0);
const isLoading = ref(false);
const employeeName = ref("");

const form = reactive({
  id: "",
  password: "",
});

const validId = computed(() => {
  return form.id.length <= 12 && form.id.length > 0;
});

const nextStep = async () => {
  step.value += 1;

  try {
    const { data } = await auth.getUserEnrollment({
      employee_id: form.id,
    });
    employeeName.value = data.data.employee_name;
  } catch (error) {
    console.error(error);
  }
};

const prevStep = () => {
  step.value -= 1;
};

const login = async () => {
  try {
    isLoading.value = true;
    const { data } = await auth.userLogin({
      employee_id: form.id,
      password: form.password,
    });

    if (data.error) {
      const errorToast = await toastController.create({
        cssClass: "toast-error",
        header: "Error!",
        message: data.error,
        position: "top",
        duration: 2000,
        color: "medium",
        buttons: [{ icon: closeOutline, role: "cancel" }],
        icon: closeOutline,
      });

      await errorToast.present();
      isLoading.value = false;
      return;
    }

    const successToast = await toastController.create({
      cssClass: "toast-success",
      header: "Success!",
      message: data.message,
      position: "top",
      duration: 2000,
      color: "medium",
      buttons: [{ icon: closeOutline, role: "cancel" }],
      icon: checkmarkOutline,
    });

    await successToast.present();

    userStore.setUser(data.data);
    userStore.setToken(data.data.token);

    form.id = "";
    form.password = "";

    isLoading.value = false;

    if (data.data.enrolled) {
      router.push("/home/");
    } else {
      router.push("/enrollment");
    }
  } catch (error) {
    isLoading.value = false;
    console.error(error);
  }
};

onIonViewDidLeave(() => {
  step.value = 0;
  isLoading.value = false;
  employeeName.value = "";
  form.id = "";
  form.password = "";
})
</script>

<template>
  <ion-page>
    <ion-content>
      <Transition>
        <div
          v-if="step === 0"
          class="ion-justify-content-between login-wrapper"
        >
          <ion-row class="login-header-wrapper">
            <ion-col class="ion-align-self-center ion-text-center">
              <ion-text>
                <h3 class="login-wrapper-header ion-padding">
                  {{ $t("login.employeeId") }}
                </h3>
              </ion-text>
            </ion-col>
          </ion-row>

          <div>
            <p class="login-wrapper-subtitle ion-no-margin">
              {{ $t("login.enterYour") }}
            </p>

            <h1 class="login-wrapper-title ion-no-margin">
              {{ $t("login.employeeId") }}
            </h1>
            <ion-input
              v-model="form.id"
              fill="outline"
              :placeholder="$t('login.id')"
            />
          </div>
          <ion-row class="ion-justify-content-end">
            <ion-button
              fill="clear"
              strong
              :disabled="!validId"
              @click="nextStep"
              router-direction="back"
            >
              <ion-text>
                <h4 class="ion-no-margin login-wrapper-next-button">
                  {{ $t("login.next") }}
                </h4>
              </ion-text>
            </ion-button>
          </ion-row>
        </div>
      </Transition>

      <Transition>
        <div
          v-if="step === 1"
          class="ion-justify-content-between ion-padding login-wrapper"
        >
          <div>
            <ion-row class="login-header-wrapper">
              <ion-col class="login-wrapper-back-button" size="3">
                <ion-button
                  @click="prevStep"
                  router-direction="back"
                  fill="clear"
                >
                  <ion-icon
                    class="icon-arrow-back"
                    color="light"
                    :icon="arrowBackOutline"
                  />
                </ion-button>
              </ion-col>
              <ion-col class="ion-align-self-center ion-text-center">
                <ion-text>
                  <h3 class="login-wrapper-header ion-padding">
                    {{ $t("login.login") }}
                  </h3>
                </ion-text>
              </ion-col>
            </ion-row>
            <div class="login-wrapper-hello">
              {{ $t("login.hello") }}
              <h5 v-if="employeeName">{{ employeeName }}</h5>
            </div>
          </div>

          <div class="login-password-wrapper">
            <p class="login-wrapper-subtitle ion-no-margin">
              {{ $t("login.enterYour") }}
            </p>
            <h1 class="login-wrapper-title ion-no-margin">
              {{ $t("login.password") }}
            </h1>
            <ion-input
              v-model="form.password"
              fill="outline"
              type="password"
              :placeholder="$t('login.password')"
            />
            <ion-button
              @click="login"
              class="login-button"
              expand="block"
              :disabled="!form.password"
              shape="round"
            >
              <ion-spinner v-if="isLoading" name="crescent"></ion-spinner>
              <span v-else>{{ $t("login.login") }}</span>
            </ion-button>
          </div>
          <p class="login-description ion-text-center">
            {{ $t("login.forgotPassword") }}
            <router-link class="login-description-link" to="/forgot-password">
              {{ $t("login.clickHere") }} </router-link
            >.
          </p>
        </div>
      </Transition>

      <ion-toast
        trigger="open-inline-toast"
        :duration="3000"
        message="This is a toast with a long message and a button that appears on the same line."
      ></ion-toast>
    </ion-content>
  </ion-page>
</template>

<style lang="scss" scoped>
.login-header-wrapper {
  ion-button {
    --padding-start: 0;
  }
}

.login {
  &-wrapper {
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;

    padding: 0 15px 24px;

    &-header {
      margin: 0;
    }

    &-hello {
      margin-top: 13px;
      font-size: 1rem;
      line-height: 1.5rem;
      font-weight: 500;
      color: var(--ion-color-medium-shade);

      h5 {
        font-size: 1.75rem;
        line-height: 2rem;
        font-weight: 400;
        margin-top: 5px;
        color: var(--ion-color-primary);
      }
    }

    &-subtitle {
      font-size: 1rem;
      margin-bottom: 6px;
      font-weight: 400;
      color: var(--ion-color-medium-shade);
    }

    &-title {
      font-size: 1.5rem;
      line-height: 2rem;
      font-weight: 400;
      margin-bottom: 17px;
      color: var(--ion-color-dark-contrast);
    }

    &-next-button {
      font-weight: 400;
      font-size: 1.125rem;
    }

    &-back-button {
      position: absolute;

      z-index: 1;
      top: calc(50% - 2px);
      left: -3px;
      transform: translateY(-50%);
    }
  }

  &-header-wrapper {
    position: relative;
  }

  &-password-wrapper {
    margin-top: 12px;
  }

  &-description {
    font-size: 0.875rem;
    line-height: 1rem;
    font-weight: 300;
    text-align: center;
    gap: 4px;
    padding-bottom: 22px;
    letter-spacing: 0.25px;

    &-link {
      margin-bottom: 2px;
      font-size: 0.875rem;
      line-height: 1rem;
      text-decoration: none;
      font-weight: 500;
    }
  }

  &-button {
    margin-top: 24px;
    height: 46px;
  }
}

.v-enter-active,
.v-leave-active {
  transition: opacity 0.3s ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}

.login-header-wrapper {
  ion-button {
    --padding-start: 0;
  }
}
</style>
