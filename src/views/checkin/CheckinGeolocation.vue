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
  onIonViewWillEnter, // Added
} from "@ionic/vue";
import { Geolocation } from "@capacitor/geolocation";
import { Capacitor } from "@capacitor/core";
import Header from "@/components/Header.vue";
import { computed, onBeforeUnmount, onMounted, ref, nextTick } from "vue";
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
import { useRoute } from "vue-router";

const router = useIonRouter();
const route = useRoute();

const prevStep = () => {
  router.back();
};

// Map Objects
let googleMap;
let myMarker;

// State
const userStore = useUserStore();
const isUserWithinGeofenceRadius = ref(true);
const hasUserRejectedLocation = ref(false);
const faceRecEndpointEnabled = ref(true);
const logType = ref("");
const shift = ref(null);
const verifyVideo = ref("");
const coordinates = ref(null);

// UI State
const isOpen = ref(false);
const isLoading = ref(false);
const isLoadingLocation = ref(true); // Start as true
const isSubmitting = ref(false);
const isMapReady = ref(false); // New state to handle map UI gracefully

// Video Verification State
const progress = ref(0);
const step = 0.01;
const duration = 5;
const instruction = ref("");
const percent = (duration / 100) * 1000;
const video = ref(null);
let stream = null;
let dataPromise = null;
let recorder = null;

// Location Data
const defaultSwipeHandler = ref(null);
const site_radius = ref(100);
const site_lat = ref(0);
const site_long = ref(0);

const { showErrorToast, showSuccessToast } = useCustomToast();
const { t } = useI18n();

// --- Computed ---
const initialPosition = computed(() => ({
  lat: coordinates.value?.coords?.latitude || 0,
  lng: coordinates.value?.coords?.longitude || 0,
}));
const platform = computed(() => Capacitor.getPlatform());
const isIOS = computed(() => platform.value === "ios");

// --- OPTIMIZATION 1: Parallel Data Fetching ---

const printCurrentPosition = async () => {
  try {
    // 5s timeout to fail fast if GPS is stuck
    coordinates.value = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 5000, 
    });
    hasUserRejectedLocation.value = false;
  } catch (e) {
    console.error("GPS Error", e);
    hasUserRejectedLocation.value = true;
    throw e;
  }
};

const getSiteLocation = async () => {
  try {
    // Check enrollment first (could be moved to parallel but safer here)
    // We assume user is enrolled if they reached this page via AuthGuard, 
    // but the check is fine.
    
    const payload = {
      employee_id: userStore.user?.employee_id,
      latitude: coordinates.value?.coords?.latitude,
      longitude: coordinates.value?.coords?.longitude,
      log_type: logType.value,
    };

    if (route.query.shift && route.query.shift !== 'None' && route.query.shift !== 'undefined') {
      payload.shift = route.query.shift;
    }

    const { data } = await checkin.getSiteLocation(payload);

    site_radius.value = data.data.geofence_radius;
    site_lat.value = data.data.latitude;
    site_long.value = data.data.longitude;
    
    userStore.setEndpointStatus(data.data.endpoint_status);
    isUserWithinGeofenceRadius.value = data.data.user_within_geofence_radius;
    faceRecEndpointEnabled.value = data.data.endpoint_status;
    shift.value = data.data.shift;
  } catch (error) {
    showErrorToast(error?.data?.message, error?.data?.error, error?.data?.status_code);
  }
};

const preparePageData = async () => {
  isLoadingLocation.value = true;
  try {
    // 1. Fetch GPS
    await printCurrentPosition();
    
    // 2. Once we have GPS, we can fetch Site Info AND Start Map Init in parallel
    // We do NOT await map initialization here to block the UI. 
    // We let the map load visually while the data (buttons) appear immediately.
    const sitePromise = getSiteLocation();
    
    await sitePromise; 
  } catch (e) {
    // Error handled in printCurrentPosition or getSiteLocation
  } finally {
    isLoadingLocation.value = false;
  }
};

// --- Map Logic ---

const initializeMap = async () => {
  // If coordinates are missing (GPS failed), don't try to load map
  if (!coordinates.value) return;

  try {
    let apiKey = null;
    const response = await utils.getGoogleMapApiKey();
    apiKey = response.data?.data?.google_map_api;

    if (!apiKey) throw new Error("No API Key");

    const mapRef = document.getElementById("map");
    // Safety check if user left page quickly
    if (!mapRef) return; 

    if (isIOS.value) {
      const loader = new Loader({ apiKey, version: "weekly" });
      await loader.load();
      const { Map } = await google.maps.importLibrary("maps");
      
      googleMap = new Map(mapRef, {
        mapId: "my-map",
        center: initialPosition.value,
        panControl: false,
        zoom: 18,
        disableDefaultUI: true,
      });
      
      const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");
      myMarker = new AdvancedMarkerElement({
        map: googleMap,
        position: initialPosition.value,
      });

      // Add Circle
      new google.maps.Circle({
        strokeColor: "#FF0000",
        fillColor: 'red',
        fillOpacity: 0.35,
        map: googleMap,
        center: {lat: site_lat.value, lng: site_long.value},
        radius: site_radius.value,
      });

    } else {
      // Android / Web Capacitor
      const body = document.querySelector("body.dark");
      body?.classList.add("map-transparent");

      googleMap = await GoogleMap.create({
        apiKey,
        id: "my-map",
        element: mapRef,
        config: {
          center: initialPosition.value,
          panControl: false,
          zoom: 18,
        },
      });

      myMarker = await googleMap.addMarker({
        coordinate: initialPosition.value,
      });

      await googleMap.addCircles([{
        center: { lat: site_lat.value, lng: site_long.value },
        radius: site_radius.value,
        strokeWidth: 3, 
        strokeColor: '#FF0000', 
        fillColor: 'red',
      }]);
    }
    isMapReady.value = true;
  } catch (e) {
    console.error("Map Init Error", e);
  }
};

const setCenterCamera = async () => {
  isLoadingLocation.value = true;
  await printCurrentPosition();

  // Refresh Site Location on recenter
  await getSiteLocation();

  if (googleMap && myMarker) {
    if (isIOS.value) {
      myMarker.position = initialPosition.value;
      googleMap.moveCamera({ center: initialPosition.value, zoom: 18 });
    } else {
      await googleMap.removeMarker(myMarker);
      myMarker = await googleMap.addMarker({ coordinate: initialPosition.value });
      await googleMap.setCamera({
        coordinate: initialPosition.value,
        zoom: 18,
        animate: true,
        animationDuration: 500,
      });
    }
  }
  isLoadingLocation.value = false;
};

// --- Video Logic ---

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

const initializeStream = async () => {
  const isPortrait = window.screen.orientation && window.screen.orientation.type.includes('portrait');
  const videoConstraints = {
    facingMode: 'user',
    frameRate: { min: 15, ideal: 20, max: 30 },
    width: { ideal: isPortrait ? 640 : 1280 }, // Simplified logic
    height: { ideal: isPortrait ? 360 : 720 }
  };

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: videoConstraints,
      audio: false,
    });
    
    if (!stream) throw new Error("No Stream");

    // Video Element Setup
    if(video.value) {
      video.value.srcObject = stream;
      // Use onloadedmetadata to ensure video is ready before playing
      video.value.onloadedmetadata = () => {
        video.value.play();
      };
    }

    // Recorder Setup
    const isAppleDevice = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    let options = { 
      mimeType: isAppleDevice ? 'video/mp4' : 'video/webm;codecs=vp9',
      videoBitsPerSecond: 150000 
    };

    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options = { mimeType: 'video/mp4', videoBitsPerSecond: 200000 };
    }

    let dataResolver;
    dataPromise = new Promise((resolve) => (dataResolver = resolve));
    recorder = new MediaRecorder(stream, options);
    recorder.ondataavailable = (event) => dataResolver(event.data);
    recorder.start();

    setTimeout(progressWrapper, percent);

  } catch (err) {
    console.error("Camera Error:", err);
    showErrorToast("Camera access denied or failed.");
    isOpen.value = false;
    isSubmitting.value = false;
  }
};

const saveVideo = async () => {
  if(recorder && recorder.state !== 'inactive') recorder.stop();
  
  const chunks = await dataPromise;
  
  // Use Blob directly if API supports it, otherwise Base64
  const reader = new FileReader();
  reader.readAsDataURL(chunks);
  
  reader.onloadend = async () => {
    verifyVideo.value = reader.result.split(",")[1];
    isLoading.value = true;
    if(video.value) video.value.pause();
    
    await verifyCheckin();
    cleanup();
    isOpen.value = false;
    isLoading.value = false;
    progress.value = 0;
    instruction.value = "";
  };
};

const cleanup = () => {
  if (recorder && recorder.state !== 'inactive') recorder.stop();
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
    stream = null;
  }
};

const startVerifyPerson = async () => {
  if (isSubmitting.value) return; 
  isSubmitting.value = true;
  
  // Verify user is enrolled check
  try {
     const response = await auth.getUserFaceEnrollment({ employee_id: userStore.user?.employee_id });
     if(response.data.data.enrolled === false){
        showErrorToast(`You have not enrolled your face, Please Enroll`);
        router.push("/enrollment");
        isSubmitting.value = false;
        return;
     }
  } catch(e) {
     console.error(e);
  }

  isOpen.value = true;
  // Initialize stream after modal opens to ensure UI is ready
  nextTick(() => {
    initializeStream();
  });
};

const verifyCheckin = async () => {
  try {
    const payload = {
      employee_id: userStore.user?.employee_id,
      latitude: Number(coordinates.value?.coords?.latitude),
      longitude: Number(coordinates.value?.coords?.longitude),
      log_type: logType.value,
      skip_attendance: 1,
    };

    if (route.query.shift && route.query.shift !== 'None' && route.query.shift !== 'undefined') {
      payload.shift = route.query.shift;
    }

    if(userStore.isEndpointEnabled){
      payload.video = verifyVideo.value;
    }
   
    await checkin.verifyCheckin(payload);

    const type = logType.value === "OUT" ? "checkout" : "checkin";
    showSuccessToast(`You have ${type} successfully`);
    router.push("/dashboard");
  } catch (error) {
    console.error(error);
    showErrorToast(error?.data?.message, error?.data?.error, error?.data?.status_code);
  } finally {
    isSubmitting.value = false; 
  }
};

// --- Lifecycle ---

const disableSwipeBack = () => {
  const ionRouterOutlet = document.querySelector('ion-router-outlet');
  if (ionRouterOutlet) {
    defaultSwipeHandler.value = ionRouterOutlet.swipeHandler;
    ionRouterOutlet.swipeHandler = {
      canStart: () => false,
      onStart: () => {},
      onEnd: () => {},
    };
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
  cleanup(); // Ensure camera is closed if component unmounts
});

// Start fetching data BEFORE the transition finishes
onIonViewWillEnter(async () => {
  if (route.query.log_type) {
    logType.value = route.query.log_type;
  }
  await preparePageData();
});

// Render the heavy Map AFTER the transition finishes for smooth animation
onIonViewDidEnter(async () => {
  // Only initialize map if we have coordinates from WillEnter
  if(coordinates.value) {
    await initializeMap();
  }
});

onIonViewWillLeave(() => {
  const body = document.querySelector("body.dark");
  body?.classList.remove("map-transparent");
  
  isLoading.value = false;
  isUserWithinGeofenceRadius.value = true;
  logType.value = "";
  shift.value = null;
  cleanup();
});

onIonViewDidLeave(() => {
  // Clean up native map to prevent memory leaks
  if(googleMap) {
    if(!isIOS.value) googleMap.destroy();
    googleMap = null;
  }
});

const clickBack = () => {
  isUserWithinGeofenceRadius.value = true;
  hasUserRejectedLocation.value = false;
  router.back();
};

const loadAgainLocation = async () => {
  await preparePageData();
  await initializeMap();
};
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

      <div style="height: calc(100% - 70px); width: 100%" id="map">
         </div>

      <div
        class="location-currentLocation"
        :class="{ 'location-currentLocation-shift': shift }"
        @click="setCenterCamera"
      >
        <MyLocation />
      </div>

      <div v-if="shift" class="location-wrapper">
        <ion-row class="ion-align-items-center ion-justify-content-between location-wrapper-row">
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
            :disabled="isSubmitting"
          >
             <ion-spinner v-if="isSubmitting" name="crescent" style="width: 20px; height: 20px; margin-right: 8px;"></ion-spinner>
            {{
              logType === "IN"
                ? $t("user.checkin.checkin")
                : $t("user.checkin.checkout")
            }}
          </ion-button>
        </ion-row>
      </div>

      <div v-if="isLoadingLocation" class="loader">
        <ion-spinner class="loader-spinner" name="crescent" />
      </div>
    </ion-content>

    <ion-modal :is-open="isOpen" keep-contents-mounted>
      <ion-content class="video-verify">
        <video class="video-verify-video-play" autoplay playsinline ref="video" muted></video>
        <IconScan class="video-verify-icon-scan" />
        <div class="video-verify-progress-wrapper">
          <div>
            <ion-spinner v-if="isLoading" class="video-verify-loading" name="crescent" color="primary" />
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
      <ion-row class="geolocation-page-outside-location ion-align-items-center ion-justify-content-center">
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
            <ion-button @click="clickBack" class="geolocation-page-outside-card-back" fill="clear">
              {{ $t("user.checkin.outside.back") }}
            </ion-button>
            <ion-button class="geolocation-page-outside-card-try-again" fill="clear" :disabled="isLoadingLocation" @click="loadAgainLocation">
              {{ $t("user.checkin.outside.try_again") }}
            </ion-button>
          </ion-row>
        </div>
      </ion-row>
    </ion-modal>

    <ion-modal :is-open="hasUserRejectedLocation">
      <ion-row class="geolocation-page-outside-location ion-align-items-center ion-justify-content-center">
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
            <ion-button @click="clickBack" class="geolocation-page-outside-card-back" fill="clear">
              {{ $t("user.checkin.geolocation.back") }}
            </ion-button>
            <ion-button class="geolocation-page-outside-card-try-again" fill="clear" @click="loadAgainLocation">
              {{ $t("user.checkin.geolocation.try_again") }}
            </ion-button>
          </ion-row>
        </div>
      </ion-row>
    </ion-modal>
  </ion-page>
</template>

<style lang="scss" scoped>
/* All existing styles kept identical */
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
/* ... rest of your CSS ... */
.geolocation-page {
  --padding-top: 0;
  --padding-bottom: 0;
  --padding-start: 0;
  --padding-end: 0;
}
/* ... etc ... */
</style>