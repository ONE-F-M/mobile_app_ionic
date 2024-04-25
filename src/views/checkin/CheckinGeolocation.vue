<script setup>
import {
  IonContent,
  IonPage,
  onIonViewDidEnter,
  onIonViewWillLeave,
  useIonRouter,
} from "@ionic/vue";
// import { Geolocation } from "@capacitor/geolocation";
import Header from "@/components/Header.vue";
import { ref } from "vue";
// import { GoogleMap } from "@capacitor/google-maps";

const router = useIonRouter();

const prevStep = () => {
  router.back();
};

const coordinates = ref("test");

// const printCurrentPosition = async () => {
//   coordinates.value = await Geolocation.getCurrentPosition();
// };

const apiKey = "TOKEN";
// let googleMap;

onIonViewDidEnter(async () => {
  // await printCurrentPosition();
  //
  // const mapRef = document.getElementById("map");
  //
  // const body = document.querySelector("body.dark");
  //
  // body.classList.toggle("map-transparent");
  //
  // googleMap = await GoogleMap.create({
  //   id: "my-map", // Unique identifier for this map instance
  //   element: mapRef, // reference to the capacitor-google-map element
  //   apiKey: apiKey, // Your Google Maps API Key
  //   config: {
  //     center: {
  //       // The initial position to be rendered by the map
  //       lat: coordinates.value?.coords?.latitude,
  //       lng: coordinates.value?.coords?.longitude,
  //     },
  //     panControl: false,
  //     zoom: 18, // The initial zoom level to be rendered by the map
  //   },
  // });
  //
  // const markerId = await googleMap.addMarker({
  //   coordinate: {
  //     lat: coordinates.value?.coords?.latitude,
  //     lng: coordinates.value?.coords?.longitude,
  //   },
  // });
});

onIonViewWillLeave(() => {
  // const body = document.querySelector("body.dark");
  //
  // body.classList.toggle("map-transparent");
});
</script>

<template>
  <ion-page>
    <ion-content class="geolocation-page">
      <div class="ion-padding-horizontal geolocation-header">
        <Header with-back-button @goBack="prevStep">
          <slot name="title">
            {{ $t("user.checkin.checkin") }}
          </slot>
        </Header>
      </div>
      <div style="height: calc(100% - 70px); width: 100%" id="map"></div>
      <div class="location-wrapper">
        <ion-row class="ion-align-items-center ion-justify-content-between">
          <div>
            <p>Checkin location</p>
            <p>Head Office @ Burj Hamoud</p>
          </div>
          <ion-button shape="round" color="success">Checkin</ion-button>
        </ion-row>
      </div>
    </ion-content>
  </ion-page>
</template>

<style lang="scss" scoped>
.geolocation-page {
  --padding-top: 0;
  --padding-bottom: 0;
  --padding-start: 0;
  --padding-end: 0;
}

.geolocation-header {
  background: #191c1d;
}

.location-wrapper {
  border-radius: 16px 16px 0 0;
  padding: 24px 16px 8px;
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: #191c1d;
}
</style>
