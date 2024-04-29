<script setup>
import {
  IonContent,
  IonModal,
  IonPage,
  IonProgressBar,
  onIonViewDidEnter,
  onIonViewWillLeave,
  useIonRouter,
} from "@ionic/vue";
import { Geolocation } from "@capacitor/geolocation";
import Header from "@/components/Header.vue";
import { ref } from "vue";
import { GoogleMap } from "@capacitor/google-maps";
import useConfig from "@/composable/useConfig";
import IconScan from "@/components/icon/Scan.vue";
import { useCustomToast } from "@/composable/toast.js";
import checkin from "@/api/checkin";
import IconClose from "@/components/icon/Close.vue";
import { useUserStore } from "@/store/user.js";

const router = useIonRouter();

const { mapApiKey } = useConfig();

const prevStep = () => {
  router.back();
};
let googleMap;

const userStore = useUserStore();
const isUserWithinGeofenceRadius = ref(true);

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
const percent = (duration / 100) * 1000;

const { showErrorToast, showSuccessToast } = useCustomToast();

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
      video: true,
      audio: false,
    })
    .catch((err) => console.log("media stream err:", err.name));

  if (!stream) return;

  video.value.srcObject = stream;
  video.value.play();

  let dataResolver;
  dataPromise = new Promise((resolve) => (dataResolver = resolve));

  recorder = new MediaRecorder(stream);
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
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(chunks);
  });

  verifyVideo.value = await readerPromise;

  isLoading.value = true;

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

const startVerifyPerson = () => {
  isOpen.value = true;
  initializeStream();
};
const clickBack = () => {
  isUserWithinGeofenceRadius.value = false;
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
    const { data } = await checkin.getSiteLocation({
      employee_id: userStore.user?.employee_id,
      latitude: coordinates.value?.coords?.latitude,
      longitude: coordinates.value?.coords?.longitude,
    });

    isUserWithinGeofenceRadius.value = data.data.user_within_geofence_radius;
    logType.value = data.data.log_type;
    shift.value = data.data.shift;
  } catch (error) {
    showErrorToast(error.data.error);
  }
};

const verifyCheckin = async () => {
  try {
    await checkin.verifyCheckin({
      employee_id: userStore.user?.employee_id,
      video: verifyVideo.value,
      latitude: Number(coordinates.value?.coords?.latitude),
      longitude: Number(coordinates.value?.coords?.longitude),
      log_type: logType.value,
      skip_attendance: 1,
    });
    await getSiteLocation();
    showSuccessToast("You have checkin successfully");
  } catch (error) {
    showErrorToast(error.data.error?.message || error.data.message);
  }
};

onIonViewDidEnter(async () => {
  await printCurrentPosition();

  const mapRef = document.getElementById("map");

  const body = document.querySelector("body.dark");

  body.classList.add("map-transparent");

  googleMap = await GoogleMap.create({
    id: "my-map", // Unique identifier for this map instance
    element: mapRef, // reference to the capacitor-google-map element
    apiKey: mapApiKey, // Your Google Maps API Key
    config: {
      center: {
        // The initial position to be rendered by the map
        lat: coordinates.value?.coords?.latitude,
        lng: coordinates.value?.coords?.longitude,
      },
      panControl: false,
      zoom: 18, // The initial zoom level to be rendered by the map
    },
  });

  await googleMap.addMarker({
    coordinate: {
      lat: coordinates.value?.coords?.latitude,
      lng: coordinates.value?.coords?.longitude,
    },
  });

  await getSiteLocation();
});

onIonViewWillLeave(() => {
  const body = document.querySelector("body.dark");

  body.classList.remove("map-transparent");

  isLoading.value = false;
  isUserWithinGeofenceRadius.value = true;
  logType.value = "";
  shift.value = null;
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
      <div v-if="shift" class="location-wrapper">
        <ion-row
          class="ion-align-items-center ion-justify-content-between location-wrapper-row"
        >
          <div>
            <p>Checkin location</p>
            <p>{{ shift.shift }}</p>
          </div>
          <ion-button
            v-if="logType"
            @click="startVerifyPerson"
            shape="round"
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
    </ion-content>
    <ion-modal :is-open="isOpen">
      <ion-content class="video-verify">
        <video class="video-verify-video-play" autoplay ref="video"></video>

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
  </ion-page>
</template>

<style lang="scss" scoped>
.geolocation-page {
  --padding-top: 0;
  --padding-bottom: 0;
  --padding-start: 0;
  --padding-end: 0;
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
}

.video-verify {
  background: #191c1d;
  position: relative;
  font-size: 0;

  &-video-play {
    width: 100%;
    height: 100%;
    object-fit: cover;
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
</style>
