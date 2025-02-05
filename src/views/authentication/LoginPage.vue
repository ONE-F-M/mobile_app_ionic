<script setup>
import {
  IonInput,
  IonButton,
  IonPage,
  IonContent,
  IonSpinner,
  useIonRouter,
  onIonViewDidLeave,
} from "@ionic/vue";
import { setupNotifications } from '@/services/notifications.js';
import { ref, watch } from "vue";
import { Device } from "@capacitor/device";

import auth from "@/api/authentication";
import { useUserStore } from "@/store/user";
import { useAuthStore } from "@/store/auth";
import { storeToRefs } from "pinia";
import Header from "@/components/Header.vue";
import useNotification from "@/composable/useNotification";
import { setupNotifications } from '@/services/notifications.js';

const userStore = useUserStore();
const authStore = useAuthStore();
const { employeeId, userName } = storeToRefs(authStore);
const router = useIonRouter();


const step = ref(0);
const isLoading = ref(false);
const isIncorrectPassword = ref(false);

const { addListeners, registerNotifications } = useNotification();

const password = ref("");

const prevStep = () => {
  if (step.value === 0) {
    router.back();
  } else {
    step.value -= 1;
  }
};

const login = async () => {
  try {
    isLoading.value = true;
    const { data } = await auth.userLogin({
      employee_id: employeeId.value,
      password: password.value,
    });
   
    userStore.setUser(data.data);
    userStore.setToken(data.data.token);
    userStore.setEndpointStatus(data.data.endpoint_state)
    
    const deviceInfo = await Device.getInfo();

    authStore.setEmployeeIdentificator(data.data.name);

    if (deviceInfo.platform !== "web") {
      await addListeners();
      await registerNotifications();
    }
    else{
      setupNotifications(data)
    }

    password.value = "";

    isLoading.value = false;

    if (data.data.enrolled) {
      router.push("/home/");
    } else {
      router.push("/enrollment");
    }
  } catch (error) {
    isIncorrectPassword.value = true;

    console.error(error);
  } finally {
    isLoading.value = false;
  }
};

onIonViewDidLeave(() => {
  step.value = 0;
  isLoading.value = false;
  password.value = "";
  isIncorrectPassword.value = false;
});

const forgotPassword = () => {
  authStore.setRegistered(true);
  router.push("/register/method");
};

watch(
  () => password.value,
  () => {
    isIncorrectPassword.value = false;
  },
);
</script>

<template>
  <ion-page>
    <ion-content>
      <div class="ion-justify-content-between ion-padding login-wrapper">
        <div>
          <Header with-back-button @goBack="prevStep">
            <slot name="title">
              {{ $t("login.login") }}
            </slot>
          </Header>

          <div class="login-wrapper-hello">
            {{ $t("login.hello") }}
            <h5 v-if="userName">{{ userName }}</h5>
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
            v-model="password"
            fill="outline"
            type="password"
            :label="$t('login.password')"
            label-placement="floating"
            :class="{
              'ion-touched ion-invalid': isIncorrectPassword,
            }"
            :error-text="$t('auth.invalid.password')"
          />
          <ion-button
            @click="login"
            class="login-button"
            expand="block"
            :disabled="!password"
            shape="round"
          >
            <ion-spinner v-if="isLoading" name="crescent"></ion-spinner>
            <span v-else>{{ $t("login.login") }}</span>
          </ion-button>
        </div>
        <p class="login-description ion-text-center">
          {{ $t("login.forgotPassword") }}
          <a @click="forgotPassword" class="login-description-link">
            {{ $t("login.clickHere") }} </a
          >.
        </p>
      </div>
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
      top: 50%;
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
