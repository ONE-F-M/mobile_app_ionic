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
  switch (service) {
    case "Checkin Checkout":
      router.push("/checkin");
      break;
    case "Leaves":
      router.push("/leaves");
      break;
    case "New Leave Application":
      router.push("/leaves/add");
      break;
    default:
      break;
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
      const group = serviceGroups.value.find(
        (group) => group.name === getLocalizedServiceName({ name: service.service_group, name_ar: service.service_group_ar })
      );

      const addedService = userServices.value.find(
        (userService) => userService.service === service.name,
      );

      if (group) {
        group.services.push({
          ...service,
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
  try {
    const updatedService = [
      ...userServices.value
        .map((service) => ({
          service: service.service,
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
            @open-service="(service) => goToServicePage(getLocalizedServiceName(service))"
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
