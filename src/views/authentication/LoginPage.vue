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
  useIonRouter,
} from "@ionic/vue";
import { reactive, ref, computed } from "vue";
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
    // TODO implement get user name by id
  } catch (error) {
    console.error(error);
  }
};

const prevStep = () => {
  step.value -= 1;
};

const login = async () => {
  try {
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
        duration: 5000,
        color: "medium",
        buttons: [{ icon: closeOutline, role: "cancel" }],
        icon: closeOutline,
      });

      await errorToast.present();
      return;
    }

    const successToast = await toastController.create({
      cssClass: "toast-success",
      header: "Success!",
      message: data.message,
      position: "top",
      duration: 5000,
      color: "medium",
      buttons: [{ icon: closeOutline, role: "cancel" }],
      icon: checkmarkOutline,
    });

    await successToast.present();

    userStore.setUser(data.data);
    userStore.setToken(data.data.token);

    form.id = "";
    form.password = "";

    router.push("/user/");
  } catch (error) {
    console.error(error);
  }
};
</script>

<template>
  <ion-page>
    <ion-content>
      <Transition>
        <div
          v-if="step === 0"
          class="ion-justify-content-between ion-padding login-wrapper"
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
            <p class="login-wrapper-hello">
              {{ $t("login.hello") }}
            </p>
          </div>

          <div>
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
              {{ $t("login.login") }}
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
.login {
  &-wrapper {
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;

    &-header {
      margin: 0;
    }

    &-hello {
      font-size: 1rem;
      font-weight: 400;
      color: var(--ion-color-medium-shade);
    }

    &-subtitle {
      font-size: 1rem;
      margin-bottom: 4px;
      font-weight: 400;
      color: var(--ion-color-medium-shade);
    }

    &-title {
      font-size: 1.5rem;
      line-height: 2rem;
      font-weight: 400;
      margin-bottom: 12px;
      color: var(--ion-color-dark-contrast);
    }

    &-next-button {
      font-weight: 400;
      font-size: 1.125rem;
    }

    &-back-button {
      position: absolute;

      z-index: 1;
      top: 50%;
      transform: translateY(-50%);
    }
  }

  &-header-wrapper {
    position: relative;
  }

  &-description {
    font-size: 0.875rem;
    line-height: 1rem;
    font-weight: 300;
    display: flex;
    align-items: center;
    gap: 4px;

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
</style>
