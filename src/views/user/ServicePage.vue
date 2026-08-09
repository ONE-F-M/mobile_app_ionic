<script setup>
import {
  IonCol,
  IonContent,
  IonPage,
  IonRow,
  onIonViewDidEnter,
  onIonViewDidLeave,
  useIonRouter,
} from "@ionic/vue";
import configuration from "@/api/configuration";
import { getServiceRoute, RESIGNATION_SUB_SERVICES } from "@/utils/serviceRouteMap";
import { useCustomToast } from "@/composable/toast";
import { ref } from "vue";
import ServiceGroupCard from "@/components/service/GroupCard.vue";
import Header from "@/components/Header.vue";
import { useI18n } from "vue-i18n";

const { locale } = useI18n();

const getLocalizedServiceName = (service) => {
  return locale.value === "ar" ? service.name_ar || service.name : service.name;
};


const { showErrorToast } = useCustomToast();

const serviceGroups = ref([]);
const userServices = ref([]);
const router = useIonRouter();

const selectedGroup = ref("");

const goToServicePage = (service) => {
  const route = getServiceRoute(service);
  if (route !== "/service") {
    router.push(route);
  }
};

const fetchGroups = async () => {
  try {
    const { data } = await configuration.getServicesGroups();
    serviceGroups.value = data.data.map((group) => ({
      ...group,
      services: [],
      name: getLocalizedServiceName(group), 
    }));
  } catch (error) {
    showErrorToast(error?.data?.message, error?.data?.error, error?.data?.status_code);
    serviceGroups.value = [];
  }
};


const fetchServices = async () => {
  try {
    const { data } = await configuration.getServices();

    data.data.forEach((service) => {
    // Withdrawal/Extension are actions inside Employee Resignation, not
    // separate features -- don't list them as their own manageable service.
    if (RESIGNATION_SUB_SERVICES.includes(service.name)) return;

    const group = serviceGroups.value.find((group) => {
      const groupName = locale.value === "ar" ? group.name_ar : group.name;
      return groupName === (locale.value === "ar" ? service.service_group_ar : service.service_group);
    });

      const addedService = userServices.value.find(
        (userService) =>{const serviceName = locale.value === "ar" ? service.name_ar : service.name;
        return locale.value === "ar" ? userService.service_ar === serviceName: userService.service === serviceName;    
        }
      );

      if (group) {
        group.services.push({
          ...service,
          // Employee Resignation is a required HR feature -- it must always
          // stay on the home screen, so it can't be toggled off here. Checked
          // against the raw (pre-localization) name, since it's stable across
          // languages unlike the display name set just below.
          locked: service.name === "Employee Resignation",
          name: getLocalizedServiceName(service),
          added: !!addedService,
        });
      }
    });
  } catch (error) {
    showErrorToast(error?.data?.message, error?.data?.error, error?.data?.status_code);
  }
};

const fetchUserServices = async () => {
  try {
    const { data } = await configuration.getUserServices();
    userServices.value = data.data.service_detail;
  } catch (error) {
    showErrorToast(error?.data?.message, error?.data?.error, error?.data?.status_code);
    userServices.value = [];
  }
};

const removeService = async (service) => {
  if (service.locked) return;
  try {
    const updatedService = [
      ...userServices.value
        .map((service) => ({
          service:locale.value === "ar" ?service.service_ar:service.service,
        }))
        .filter((userService) => userService.service !== service.name),
    ];

    const payload = {
      service_detail: JSON.stringify(updatedService),
    };

    await configuration.updateServices(payload);
    await fetchUserServices();

    service.added = false;
  } catch (error) {
    showErrorToast(error?.data?.message, error?.data?.error, error?.data?.status_code);
  }
};
const addService = async (service) => {
  try {
    const updatedService = [
      ...userServices.value.map((userService) => ({
        service: userService.service,
      })),
      { service: service.name },
    ];

    const payload = {
      service_detail: JSON.stringify(updatedService),
    };

    await configuration.updateServices(payload);

    await fetchUserServices();
    service.added = true;
  } catch (error) {
    showErrorToast(error?.data?.message, error?.data?.error, error?.data?.status_code);
  }
};

onIonViewDidEnter(async () => {
  await fetchGroups();
  await fetchUserServices();
  await fetchServices();
});

onIonViewDidLeave(() => {
  selectedGroup.value = "";
});
</script>

<template>
  <ion-page>
    <ion-content class="ion-padding services-page">
      <Header>{{ $t("user.service.title") }}</Header>
      <div class="services">
        <ion-row>
          <ion-col
            v-for="serviceGroup in serviceGroups"
            :key="serviceGroup.name"
            size="12"
          >
            <ServiceGroupCard
              v-model="selectedGroup"
              :service-group="serviceGroup"
              @open-service="goToServicePage"
              @remove-service="removeService($event)"
              @add-service="addService($event)"
            />
          </ion-col>
        </ion-row>
      </div>
    </ion-content>
  </ion-page>
</template>

<style lang="scss" scoped>
.services {
  margin-top: 7px;
  margin-left: -4px;
  width: calc(100% + 8px);
}

.services-page {
  --padding-top: 0;
  --padding-bottom: 24px;
  --padding-start: 15px;
  --padding-end: 15px;
}
</style>