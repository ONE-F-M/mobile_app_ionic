<script setup>
import {
  IonContent,
  IonModal,
  IonPage,
  IonRow,
  IonButton,
  IonText,
  IonSpinner,
  IonProgressBar,
  onIonViewDidEnter,
  onIonViewWillLeave,
  useIonRouter,
  onIonViewDidLeave,
} from "@ionic/vue";
import { Geolocation } from "@capacitor/geolocation";
import { Capacitor } from "@capacitor/core";
import Header from "@/components/Header.vue";
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { GoogleMap } from "@capacitor/google-maps";
import IconScan from "@/components/icon/Scan.vue";
import { useCustomToast } from "@/composable/toast.js";
import checkin from "@/api/checkin";
import IconClose from "@/components/icon/Close.vue";
import { useUserStore } from "@/store/user.js";
import MyLocation from "@/components/icon/MyLocation.vue";
import utils from "@/api/utils";
import { useI18n } from "vue-i18n";
import { Loader } from "@googlemaps/js-api-loader";
import auth from "@/api/authentication";


const router = useIonRouter();

const prevStep = () => {
  router.back();
};
let googleMap;
let myMarker;

const userStore = useUserStore();
const isUserWithinGeofenceRadius = ref(true);
const hasUserRejectedLocation = ref(false);
const faceRecEndpointEnabled = ref(true)
// IN or OUT
const logType = ref("");
const shift = ref(null);
const verifyVideo = ref("");

const coordinates = ref("");
const isOpen = ref(false);
const isLoading = ref(false);
const isLoadingLocation = ref(false);

const progress = ref(0);
const step = 0.01;

//in seconds
const duration = 5;
const instruction = ref("");
const percent = (duration / 100) * 2000;

const defaultSwipeHandler = ref(null);
const site_radius = ref(100);
const site_lat = ref(0);
const site_long = ref(0);

const { showErrorToast, showSuccessToast } = useCustomToast();
const { t } = useI18n();

const updateProgress = () => {
  progress.value += step;

  if (progress.value > 0.4 && progress.value < 0.7) {
    instruction.value = "user.checkin.blink_eyes";
  } else {
    instruction.value = "";
  }
};

const progressWrapper = () => {
  if (progress.value >= 1) {
    saveVideo();
    return;
  }

  updateProgress();
  setTimeout(progressWrapper, percent);
};

const video = ref(null);

let stream = null;
let dataPromise = null;
let recorder = null;
const initializeStream = async () => {
  stream = await navigator.mediaDevices
    .getUserMedia({
      video: {
				width: { ideal: 640 },
				height: { ideal: 360 },
				frameRate: {ideal: 15},
				facingMode: 'user'
			},
      audio: false,
    })
    .catch((err) => console.log("media stream err:", err.name));

  if (!stream) return;

  video.value.srcObject = stream;
  video.value.play();

  let dataResolver;
  dataPromise = new Promise((resolve) => (dataResolver = resolve));
  let recorder_options = { mimeType: 'video/webm;codecs=vp9' };
  recorder = new MediaRecorder(stream,recorder_options);
  recorder.ondataavailable = (event) => dataResolver(event.data);
  recorder.start();

  setTimeout(progressWrapper, percent);
};

const cleanup = async () => {
  
  recorder.stop();
  stream && stream.getTracks().forEach((track) => track.stop());
  stream = null;
  
};

const saveVideo = async () => {
  recorder.stop();

  const chunks = await dataPromise;

  const readerPromise = new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64String = reader.result.split(",")[1]; // Extract base64 part
      resolve(base64String);
    };
    reader.readAsDataURL(chunks);
  });

  verifyVideo.value = await readerPromise;

  isLoading.value = true;
  video.value.pause();

  await verifyCheckin();
  await getSiteLocation();
  
  cleanup();
  isOpen.value = false;
  isLoading.value = false;
  progress.value = 0;
  instruction.value = "";
};

const printCurrentPosition = async () => {
  coordinates.value = await Geolocation.getCurrentPosition({
    enableHighAccuracy: true,
  });
};

const setCenterCamera = async () => {
  await printCurrentPosition();

  if (isIOS.value) {
    myMarker.setMap(null);
  } else {
    await googleMap.removeMarker(myMarker);
  }

  await addInitialMarker(googleMap);

  if (isIOS.value) {
    googleMap.moveCamera({
      center: initialPosition.value,
      zoom: 18,
    });
    return;
  }

  await googleMap.setCamera({
    coordinate: initialPosition.value,
    zoom: 18,
    animate: true,
    animationDuration: 500,
  });
};

const startVerifyPerson = async () => {
  await initializeStream();
  setTimeout(() => {
    isOpen.value = true;
  }, 750);
};
const clickBack = () => {
  isUserWithinGeofenceRadius.value = true;
  hasUserRejectedLocation.value = false;
  router.back();
};

const loadAgainLocation = async () => {
  try {
    isLoadingLocation.value = true;
    await printCurrentPosition();
    await getSiteLocation();
  } finally {
    isLoadingLocation.value = false;
  }
};

const getSiteLocation = async () => {
  try {

    const response = await auth.getUserFaceEnrollment({
    employee_id: userStore.user?.employee_id,
  });
  if(response.data.data.enrolled===false){
    showErrorToast(`You have not enrolled your face,Please Enroll`);
    router.push("/enrollment");
  }
    const { data } = await checkin.getSiteLocation({
      employee_id: userStore.user?.employee_id,
      latitude: coordinates.value?.coords?.latitude,
      longitude: coordinates.value?.coords?.longitude,
    });

    site_radius.value = data.data.geofence_radius;
    site_lat.value = data.data.latitude;
    site_long.value = data.data.longitude;
    userStore.setEndpointStatus(data.data.endpoint_status)
    isUserWithinGeofenceRadius.value = data.data.user_within_geofence_radius;
    faceRecEndpointEnabled.value = data.data.endpoint_status
    logType.value = data.data.log_type;
    shift.value = data.data.shift;
  } catch (error) {
    showErrorToast(error?.data?.message, error?.data?.error, error?.data?.status_code);
  }
};

const verifyCheckin = async () => {
  try {
    const payload = {
      employee_id: userStore.user?.employee_id,
      latitude: Number(coordinates.value?.coords?.latitude),
      longitude: Number(coordinates.value?.coords?.longitude),
      log_type: logType.value,
      skip_attendance: 1,
    }

    
    if(userStore.isEndpointEnabled){
      payload.video = verifyVideo.value
    }
   
    await checkin.verifyCheckin(payload);
    await getSiteLocation();

    const type = logType.value === "OUT" ? "checkin" : "checkout";
    showSuccessToast(`You have ${type} successfully`);
  } catch (error) {
    console.error(error);
    showErrorToast(error?.data?.message, error?.data?.error, error?.data?.status_code);
  }
};

// Function to convert base64 to Blob
const base64ToBlob = async (base64, mimeType) => {
  const res = await fetch(`data:${mimeType};base64,${base64}`);
  const blob = await res.blob();
  return blob;
};


const initialPosition = computed(() => ({
  lat: coordinates.value?.coords?.latitude || 0,
  lng: coordinates.value?.coords?.longitude || 0,
}));
const platform = computed(() => Capacitor.getPlatform());
const isIOS = computed(() => platform.value === "ios");

const addInitialMarker = async (map) => {
  if (isIOS.value) {
    const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

    myMarker = new AdvancedMarkerElement({
      map,
      position: initialPosition.value,
    });
    return;
  }

  myMarker = await map.addMarker({
    coordinate: initialPosition.value,
  });
};

const initializeMap = async () => {
  hasUserRejectedLocation.value = false;
  isLoadingLocation.value = true;
  try {
    await printCurrentPosition();
  } catch (e) {
    hasUserRejectedLocation.value = true;
    return;
  }
  hasUserRejectedLocation.value = false;

  let apiKey = null;
  try {
    const response = await utils.getGoogleMapApiKey();
    apiKey = response.data?.data?.google_map_api;
  } catch (e) {
    showErrorToast(t("user.checkin.apiKeyNotFound"));
    return;
  }

  if (isIOS.value) {
    const loader = new Loader({
      apiKey,
      version: "weekly",
    });
    await loader.load();
    const { Map } = await google.maps.importLibrary("maps");

    googleMap = new Map(document.getElementById("map"), {
      mapId: "my-map",
      center: initialPosition.value,
      panControl: false,
      zoom: 18,
      disableDefaultUI: true,
    });
  } else {
    const mapRef = document.getElementById("map");
    const body = document.querySelector("body.dark");
    body.classList.add("map-transparent");

    googleMap = await GoogleMap.create({
      apiKey, // Your Google Maps API Key
      id: "my-map", // Unique identifier for this map instance
      element: mapRef, // reference to the capacitor-google-map element
      config: {
        // The initial position to be rendered by the map
        center: initialPosition.value,
        panControl: false,
        zoom: 18, // The initial zoom level to be rendered by the map
      },
    });
  }

  await addInitialMarker(googleMap);
  await getSiteLocation();
  await addsitemarker();
  isLoadingLocation.value = false;
};

const addsitemarker = async () =>{
  if (isIOS.value) {
    new google.maps.Circle({
      strokeColor: "#FF0000",
      fillColor: 'red',
      fillOpacity: 0.35,
      map:googleMap,
      center: {lat: site_lat.value, lng: site_long.value},
      radius: site_radius.value,
    });
  }
  else{
    googleMap.addCircles([{
        center: { lat: site_lat.value, lng: site_long.value },
        radius: site_radius.value,
        strokeWidth: 3, 
        strokeColor: '#FF0000', 
        fillColor: 'red',
      }])
  }

}

const disableSwipeBack = () => {
  const ionRouterOutlet = document.querySelector('ion-router-outlet');
  if (ionRouterOutlet) {
    defaultSwipeHandler.value = ionRouterOutlet.swipeHandler;

    ionRouterOutlet.swipeHandler = {
      canStart: () => false,
      onStart: () => {},
      onEnd: () => {},
    }
  }
};

const enableSwipeBack = () => {
  const ionRouterOutlet = document.querySelector('ion-router-outlet');
  if (ionRouterOutlet) {
    ionRouterOutlet.swipeHandler = defaultSwipeHandler.value;
  }
};

onMounted(() => {
  disableSwipeBack();
});

onBeforeUnmount(() => {
  enableSwipeBack();
});

onIonViewDidEnter(async () => {
  await initializeMap();
});

onIonViewWillLeave(() => {
  const body = document.querySelector("body.dark");

  body.classList.remove("map-transparent");

  isLoading.value = false;
  isUserWithinGeofenceRadius.value = true;
  logType.value = "";
  shift.value = null;
});

onIonViewDidLeave(() => {
  googleMap?.destroy();
});
</script>

<template>
  <ion-page>
    <ion-content class="geolocation-page">
      <div class="ion-padding-horizontal geolocation-header">
        <Header with-back-button @goBack="prevStep">
          <slot name="title">
            {{
              logType === "OUT"
                ? $t("user.checkin.checkout")
                : $t("user.checkin.checkin")
            }}
          </slot>
        </Header>
      </div>
      <div style="height: calc(100% - 70px); width: 100%" id="map"></div>

      <div
        class="location-currentLocation"
        :class="{
          'location-currentLocation-shift': shift,
        }"
        @click="setCenterCamera"
      >
        <MyLocation />
      </div>

      <div v-if="shift" class="location-wrapper">
        <ion-row
          class="ion-align-items-center ion-justify-content-between location-wrapper-row"
        >
          <div class="checkin-location-wrapper">
            <p class="checkin-location">Checkin location</p>
            <p class="checkin-shift">{{ shift.shift }}</p>
          </div>
          <ion-button
            v-if="logType"
            @click="startVerifyPerson"
            shape="round"
            class="checkin-button"
            :color="logType === 'IN' ? 'success' : 'danger'"
          >
            {{
              logType === "IN"
                ? $t("user.checkin.checkin")
                : $t("user.checkin.checkout")
            }}
          </ion-button>
        </ion-row>
      </div>

      <div v-if="isLoadingLocation" class="loader">
        <ion-spinner
          class="loader-spinner"
          name="crescent"
        />
      </div>
    </ion-content>

    <ion-modal :is-open="isOpen" keep-contents-mounted>
      <ion-content class="video-verify">
        <video class="video-verify-video-play" autoplay playsinline ref="video"></video>

        <IconScan class="video-verify-icon-scan" />

        <div class="video-verify-progress-wrapper">
          <div>
            <ion-spinner
              v-if="isLoading"
              class="video-verify-loading"
              name="crescent"
              color="primary"
            />
          </div>

          <Transition>
            <div v-if="instruction" class="video-verify-instruction">
              {{ $t(instruction) }}
            </div>
          </Transition>

          <ion-text class="video-verify-hint">
            {{ $t("user.checkin.scan_in_progress") }}
          </ion-text>

          <ion-progress-bar class="video-verify-progress" :value="progress" />
        </div>
      </ion-content>
    </ion-modal>

    <ion-modal :is-open="!isUserWithinGeofenceRadius">
      <ion-row
        class="geolocation-page-outside-location ion-align-items-center ion-justify-content-center"
      >
        <div class="geolocation-page-outside-card">
          <div class="geolocation-page-outside-card-icon-wrapper">
            <IconClose />
          </div>
          <p class="geolocation-page-outside-card-title">
            {{ $t("user.checkin.outside.title") }}
          </p>
          <p class="geolocation-page-outside-card-description">
            {{ $t("user.checkin.outside.description") }}
          </p>
          <ion-row class="ion-justify-content-end">
            <ion-button
              @click="clickBack"
              class="geolocation-page-outside-card-back"
              fill="clear"
            >
              {{ $t("user.checkin.outside.back") }}
            </ion-button>
            <ion-button
              class="geolocation-page-outside-card-try-again"
              fill="clear"
              :disabled="isLoadingLocation"
              @click="loadAgainLocation"
            >
              {{ $t("user.checkin.outside.try_again") }}
            </ion-button>
          </ion-row>
        </div>
      </ion-row>
    </ion-modal>

    <ion-modal :is-open="hasUserRejectedLocation">
      <ion-row
        class="geolocation-page-outside-location ion-align-items-center ion-justify-content-center"
      >
        <div class="geolocation-page-outside-card">
          <div class="geolocation-page-outside-card-icon-wrapper">
            <IconClose />
          </div>
          <p class="geolocation-page-outside-card-title">
            {{ $t("user.checkin.geolocation.title") }}
          </p>
          <p class="geolocation-page-outside-card-description">
            {{ $t("user.checkin.geolocation.description") }}
          </p>
          <ion-row class="ion-justify-content-end">
            <ion-button
              @click="clickBack"
              class="geolocation-page-outside-card-back"
              fill="clear"
            >
              {{ $t("user.checkin.geolocation.back") }}
            </ion-button>
            <ion-button
              class="geolocation-page-outside-card-try-again"
              fill="clear"
              @click="initializeMap"
            >
              {{ $t("user.checkin.geolocation.try_again") }}
            </ion-button>
          </ion-row>
        </div>
      </ion-row>
    </ion-modal>
  </ion-page>
</template>

<style lang="scss" scoped>
.loader {
  display: flex;
  justify-content: center;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);

  &-spinner {
    width: 100px;
    height: 100px;
  }
}

.geolocation-page {
  --padding-top: 0;
  --padding-bottom: 0;
  --padding-start: 0;
  --padding-end: 0;
}

.location-currentLocation {
  display: flex;
  padding: 10px;
  border-radius: 50%;
  position: fixed;
  bottom: 16px;
  right: 16px;
  background: #25353d;
  z-index: 10;

  &-shift {
    bottom: 160px;
  }
}

.geolocation-page-outside-location {
  height: 100%;
}

.geolocation-page-outside-card {
  margin: 8px 20px;
  padding: 18px 16px 10px;
  background: #233036;
  border-radius: 28px;

  &-icon-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 48px;
    width: 48px;
    margin: 0 auto;
    background: #ffb3ac;
    color: #68000a;
    border-radius: 50%;
  }

  &-title {
    text-align: center;
    font-size: 1.5rem;
    line-height: 2rem;
    color: #e0e3e3;
  }

  &-description {
    font-size: 0.925rem;
    line-height: 1rem;
    color: #c0c7cd;
  }

  &-back {
    color: #c0c7cd;
  }

  &-try-again {
    color: #ffb4a9;
  }
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

  &-row {
    flex-wrap: nowrap;
  }

  .checkin-location-wrapper {
    margin-right: 8px;
  }

  [dir="rtl"] .checkin-location-wrapper {
    margin-right: 0;
    margin-left: 8px;
  }

  .checkin-location {
    margin: 0;
    font-size: 0.875rem;
    line-height: 1.25rem;
    color: #c0c7cd;
  }

  .checkin-shift {
    margin-top: 4px;
    color: #e0e3e3;
    font-size: 16px;
    line-height: 1.5rem;
    letter-spacing: 1px;
  }

  .checkin-button {
    margin-bottom: 0;
  }
  .checkin-button::part(native) {
    padding: 8px 35px;
    font-weight: 600;
    font-size: 16px;
    line-height: 1.5rem;
    letter-spacing: 0.1px;
    //color: var(--ion-color-success-contrast);
    font-family: "Readex Pro";
  }
}

.video-verify {
  background: #191c1d;
  position: relative;
  font-size: 0;

  &-video-play {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transform: scaleX(-1);
  }

  &-icon-scan {
    position: absolute;
    height: min(400px, 60%);
    color: #ffffff;
    top: max(36px, 15%);
    left: 50%;
    transform: translateX(-50%);
    width: min(328px, 90%);
    z-index: 10;
  }

  &-progress-wrapper {
    text-align: center;
    position: absolute;
    bottom: 56px;
    left: 50%;
    transform: translateX(-50%);
    width: min(280px, 80%);
    z-index: 10;
  }

  &-loading {
    width: 48px;
    height: 48px;
    margin: 0 auto 20px;
  }

  &-instruction {
    padding: 14px 16px;
    background: #2d3132;
    border-radius: 4px;

    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);

    width: max-content;
    margin: 0 auto 20px;

    font-size: 1rem;
    line-height: 1.5rem;
    letter-spacing: 0.25px;
  }

  &-hint {
    font-size: 1rem;
    line-height: 1.5rem;
    letter-spacing: 0.25px;
  }
  &-progress {
    margin-top: 16px;
  }
}

.v-enter-active,
.v-leave-active {
  transition: opacity 0.5s ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}

ion-modal {
  &::part(content) {
    background: transparent;
  }
}
</style>
