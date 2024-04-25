<script setup>
import {
  IonContent,
  IonPage,
  onIonViewDidEnter,
  useIonRouter,
} from "@ionic/vue";
import { useUserStore } from "@/store/user";
import configuration from "@/api/configuration";
import { useCustomToast } from "@/composable/toast";
import { ref } from "vue";

const router = useIonRouter();
const userStore = useUserStore();

const { showErrorToast } = useCustomToast();

const services = ref([]);

const logout = () => {
  userStore.logout();
  router.push("/");
};

if (!userStore.user || !userStore.token) {
  logout();
}

const goToServicePage = (service) => {
  switch (service) {
    case "Checkin/Checkout":
      router.push("/checkin");
      break;
    default:
      break;
  }
};

const fetchServices = async () => {
  try {
    const { data } = await configuration.getUserServices();

    services.value = data.data.service_detail;
  } catch (error) {
    showErrorToast(error.error);
    services.value = [];
  }
};

onIonViewDidEnter(() => {
  fetchServices();
});
</script>

<template>
  <ion-page>
    <ion-content class="ion-padding">
      <h3 class="home-title ion-text-center">
        {{ $t("user.home.title") }}
      </h3>
      <div class="services">
        <div
          v-for="service in services"
          class="services-item"
          :key="service.service"
          @click="goToServicePage(service.service)"
        >
          <div class="services-item-icon-wrapper">
            <span class="mdi" :class="`mdi-${service.service_icon}`" />
          </div>
          <div class="services-item-label">
            {{ service.service }}
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<style lang="scss" scoped>
.home {
  &-title {
    margin-top: 2px;
    margin-bottom: 35px;
  }
}

.services {
  display: flex;
  flex-wrap: wrap;
  margin-left: -4px;
  width: calc(100% + 8px);

  &-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 25%;
    padding: 0 2.5px;
    margin-bottom: 22px;

    &-icon {
      width: 24px;
      height: 24px;
      object-fit: contain;

      &-wrapper {
        width: 66px;
        height: 62px;
        border-radius: 13px;
        font-size: 24px;
        color: #003549;
        background-color: var(--ion-color-primary);
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }

    &-label {
      max-width: 65px;
      margin-top: 8px;
      text-align: center;
      font-size: 14px;
      line-height: 20px;
    }
  }
}
</style>
