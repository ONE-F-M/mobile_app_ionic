<script setup>
import { IonContent, IonPage, useIonRouter } from "@ionic/vue";
import { Geolocation } from "@capacitor/geolocation";
import Header from "@/components/Header.vue";
import { onMounted, ref } from "vue";
import { GoogleMap } from "@capacitor/google-maps";

const router = useIonRouter();

const prevStep = () => {
  router.back();
};

const coordinates = ref("test");

const printCurrentPosition = async () => {
  coordinates.value = await Geolocation.getCurrentPosition();
  console.log("Current position:", coordinates.value);
};

const apiKey = "TOKEN";

onMounted(async () => {
  await printCurrentPosition();

  const mapRef = document.getElementById("map");

  const newMap = await GoogleMap.create({
    id: "my-map", // Unique identifier for this map instance
    element: mapRef, // reference to the capacitor-google-map element
    apiKey: apiKey, // Your Google Maps API Key
    config: {
      center: {
        // The initial position to be rendered by the map
        lat: coordinates.value?.coords?.latitude,
        lng: coordinates.value?.coords?.longitude,
      },
      zoom: 18, // The initial zoom level to be rendered by the map
    },
  });

  const markerId = await newMap.addMarker({
    coordinate: {
      lat: coordinates.value?.coords?.latitude,
      lng: coordinates.value?.coords?.longitude,
    },
  });

  console.log("newMap", newMap);
});
</script>

<template>
  <ion-page>
    <ion-content class="checkin-page">
      <Header with-back-button @goBack="prevStep">
        <slot name="title">
          {{ $t("user.checkin.checkin") }}
        </slot>
      </Header>
      Test Map
      <div style="height: calc(100% - 70px); width: 100%" id="map"></div>
    </ion-content>
  </ion-page>
</template>

<style lang="scss">
.checkin-page {
}
</style>
