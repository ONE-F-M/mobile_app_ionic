<script setup>
import {
  IonInput,
  IonButton,
  IonPage,
  IonContent,
  IonSpinner,
  useIonRouter,
  onIonViewDidLeave,
  onIonViewDidEnter,
  toastController
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

const userStore = useUserStore();
const authStore = useAuthStore();
const { employeeId, userName } = storeToRefs(authStore);
const router = useIonRouter();

const isLoading = ref(false);
const isIncorrectPassword = ref(false);
const passwordInput = ref(null); // Reference for auto-focus
const password = ref("");

const { addListeners, registerNotifications } = useNotification();

// Simple navigation back
const prevStep = () => {
  router.back();
};

const handleBackgroundTasks = async (userData) => {
  try {
    const deviceInfo = await Device.getInfo();
    
    // Logic: If on mobile, register native notifications; else web notifications
    if (deviceInfo.platform !== "web") {
      await addListeners();
      await registerNotifications(); 
    } else {
      setupNotifications(userData);
    }
  } catch (err) {
    console.warn("Background setup failed silently:", err);
  }
};

const login = async () => {
  // Prevent double submissions
  if (isLoading.value || !password.value) return;

  try {
    isLoading.value = true;
    
    // 1. Critical Path: Only wait for the Auth Token
    const { data } = await auth.userLogin({
      employee_id: employeeId.value,
      password: password.value,
    });
    
    // 2. State Updates
    userStore.setUser(data.data);
    userStore.setToken(data.data.token);
    userStore.setEndpointStatus(data.data.endpoint_state);
    authStore.setEmployeeIdentificator(data.data.name);
    
    userStore.prefetchCheckins(data.data.employee_id);

    // 3. Navigation (Immediate)
    // We determine where to go and leave immediately.
    if (data.data.enrolled) {
      router.push("/home/");
    } else {
      router.push("/enrollment");
    }

    // 4. Background Tasks (Non-blocking)
    // We do NOT await this. We let it run while the router animates the next page.
    handleBackgroundTasks(data);

    // Reset UI state
    password.value = "";
    isLoading.value = false;

  } catch (error) {
    isLoading.value = false;
    console.error(error);

    // Check if it's strictly a credential error (401/403) or a System/Network error
    // Check if it's strictly a credential error (401/403) or a System/Network error.
    // CapacitorHttp throws the response object directly (or stripped), so we check status directly.
    const status = error.status || error.data?.status || error.response?.status;

    if (status === 401 || status === 403) {
      isIncorrectPassword.value = true;
    } else {
      // Show a toast for network/server errors
      const toast = await toastController.create({
        message: 'Unable to connect to server. Please check your internet.',
        duration: 3000,
        color: 'danger',
        position: 'top'
      });
      await toast.present();
    }
  }
};

// Lifecycle: Reset state when leaving
onIonViewDidLeave(() => {
  isLoading.value = false;
  password.value = "";
  isIncorrectPassword.value = false;
});

// Lifecycle: Auto-focus the input when entering
onIonViewDidEnter(() => {
  // Small timeout ensures the animation is finished before focusing
  setTimeout(() => {
    passwordInput.value?.$el?.setFocus();
  }, 150);
});

const forgotPassword = () => {
  authStore.setRegistered(true);
  router.push("/register/method");
};

watch(
  () => password.value,
  () => {
    if (isIncorrectPassword.value) isIncorrectPassword.value = false;
  }
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
            ref="passwordInput"
            v-model="password"
            fill="outline"
            type="password"
            :label="$t('login.password')"
            label-placement="floating"
            enterkeyhint="go" 
            @keyup.enter="login"
            :class="{
              'ion-touched ion-invalid': isIncorrectPassword,
            }"
            :error-text="$t('auth.invalid.password')"
          />
          
          <ion-button
            @click="login"
            class="login-button"
            expand="block"
            :disabled="!password || isLoading"
            shape="round"
          >
            <ion-spinner v-if="isLoading" name="crescent"></ion-spinner>
            <span v-else>{{ $t("login.login") }}</span>
          </ion-button>
        </div>
        
        <p class="login-description ion-text-center">
          {{ $t("login.forgotPassword") }}
          <a @click="forgotPassword" class="login-description-link">
            {{ $t("login.clickHere") }} 
          </a>.
        </p>
      </div>
    </ion-content>
  </ion-page>
</template>

<style lang="scss" scoped>
// Cleaned up unused CSS and organized slightly
.login-wrapper {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 0 15px 24px;

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
}

.login-button {
  margin-top: 24px;
  height: 46px;
}
</style>