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

const { showErrorToast } = useCustomToast();

const serviceGroups = ref([]);
const services = ref([]);

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
    services.value = [];
  }
};

const fetchServices = async () => {
  try {
    const { data } = await configuration.getServices();

    data.data.forEach((service) => {
      const group = serviceGroups.value.find(
        (group) => group.name === service.service_group,
      );

      console.log("group", group);

      if (group) {
        group.services.push(service);
      }
    });
    services.value = data.data;
  } catch (error) {
    showErrorToast(error.error);
    services.value = [];
  }
};

onIonViewDidEnter(async () => {
  await fetchGroups();
  await fetchServices();
});

onIonViewDidLeave(() => {
  selectedGroup.value = "";
});
</script>

<template>
  <ion-page>
    <ion-content class="ion-padding">
      <h3 class="home-title ion-text-center">
        {{ $t("user.service.title") }}
      </h3>
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
            />
          </ion-col>
        </ion-row>
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
</style>
