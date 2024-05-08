<script setup>
import {
  IonCol,
  IonContent,
  IonPage,
  IonRow,
  onIonViewDidEnter,
  onIonViewDidLeave,
} from "@ionic/vue";
import configuration from "@/api/configuration";
import { useCustomToast } from "@/composable/toast";
import { ref } from "vue";
import ServiceGroupCard from "@/components/service/GroupCard.vue";
import Header from "@/components/Header.vue";

const { showErrorToast } = useCustomToast();

const serviceGroups = ref([]);
const userServices = ref([]);

const selectedGroup = ref("");

const fetchGroups = async () => {
  try {
    const { data } = await configuration.getServicesGroups();

    serviceGroups.value = data.data.map((group) => ({
      ...group,
      services: [],
    }));
  } catch (error) {
    showErrorToast(error.error);
    serviceGroups.value = [];
  }
};

const fetchServices = async () => {
  try {
    const { data } = await configuration.getServices();

    data.data.forEach((service) => {
      const group = serviceGroups.value.find(
        (group) => group.name === service.service_group,
      );

      const addedService = userServices.value.find(
        (userService) => userService.service === service.name,
      );

      if (group) {
        group.services.push({
          ...service,
          added: !!addedService,
        });
      }
    });
  } catch (error) {
    showErrorToast(error.error);
  }
};

const fetchUserServices = async () => {
  try {
    const { data } = await configuration.getUserServices();

    userServices.value = data.data.service_detail;
  } catch (error) {
    showErrorToast(error.error);
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
    showErrorToast(error.error);
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
    showErrorToast(error.error);
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
