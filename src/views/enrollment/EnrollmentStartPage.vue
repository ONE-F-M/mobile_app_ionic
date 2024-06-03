<script setup>
import {
  IonIcon,
  IonRow,
  IonCol,
  IonButton,
  IonPage,
  IonContent,
  useIonRouter,
} from "@ionic/vue";
import { arrowBackOutline } from "ionicons/icons";
import { useUserStore } from "@/store/user";
import { ref } from "vue";
import { enroll } from "@/api/face_recognition";

import EnrollmentPage from "@/views/enrollment/EnrollmentPage.vue";
import { useAuthStore } from "@/store/auth.js";

const userStore = useUserStore();
const authStore = useAuthStore();
const router = useIonRouter();

const inProgress = ref(false);

const logout = () => {
  userStore.logout();
  router.push("/");
};
const startEnrollment = () => {
  inProgress.value = true;
};

const handleVideo = async (video) => {
  const employeeId = authStore.employeeId;

  try {
    await enroll({ employee_id: employeeId, video });
    router.push("/enroll-success");
  } catch (error) {
    router.push({
      path: "/enroll-failure",
      query: {
        error: error?.data?.error,
      },
    });
  } finally {
    inProgress.value = false;
  }
};
</script>

<template>
  <template v-if="inProgress">
    <EnrollmentPage @completed="handleVideo" />
  </template>
  <template v-else>
    <ion-page>
      <ion-content>
        <Transition>
          <div class="ion-justify-content-between login-wrapper">
            <div>
              <ion-row class="login-header-wrapper">
                <ion-col class="login-wrapper-back-button" size="3">
                  <ion-button
                    @click="logout"
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
                      {{ $t("enrollment.start_screen.title") }}
                    </h3>
                  </ion-text>
                </ion-col>
              </ion-row>
              <p class="enrollment-wrapper-hello">
                {{ $t("enrollment.start_screen.welcome_text") }}
              </p>
            </div>

            <div class="enrollment-wrapper-description">
              <h5>{{ $t("enrollment.start_screen.description_title") }}</h5>
              <p>{{ $t("enrollment.start_screen.description_text") }}</p>
              <ion-button
                @click="startEnrollment"
                class="login-button"
                expand="block"
                shape="round"
              >
                {{ $t("enrollment.start_screen.button") }}
              </ion-button>
            </div>
          </div>
        </Transition>
      </ion-content>
    </ion-page>
  </template>
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
    padding: 0 14px 32px;

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
      left: -3px;
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
    font-weight: 700;
    font-size: 1rem;
    line-height: 1.5rem;
    letter-spacing: 0.5px;
  }
}

.enrollment {
  &-wrapper {
    &-hello {
      margin-top: 22px;
      font-size: 1.5rem;
      line-height: 2rem;
      letter-spacing: 0.85px;
      font-weight: 400;
      color: var(--ion-color-dark-contrast);
    }

    &-description {
      h5 {
        font-size: 1.375rem;
        line-height: 1.75rem;
        font-weight: 400;
        margin-bottom: 12px;
        color: var(--ion-color-secondary);
      }

      p {
        margin-top: 12px;
        font-size: 1rem;
        line-height: 1.5rem;
        font-weight: 400;
        letter-spacing: 0.5px;
        color: var(--ion-color-dark-contrast);
      }
    }

    ion-button {
      --color: var(--ion-color-primary-contrast);
    }
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
