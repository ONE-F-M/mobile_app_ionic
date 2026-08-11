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
  onIonViewWillLeave,
  useIonRouter,
  onIonViewDidLeave,
} from "@ionic/vue";
import {
  getCurrentPositionSafe,
  isPermissionDenied,
  locationErrorKey,
} from "@/utils/geolocation.js";
import Header from "@/components/Header.vue";
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { buildStaticMapUrl } from "@/utils/staticMap";
import IconScan from "@/components/icon/Scan.vue";
import { useCustomToast } from "@/composable/toast.js";
import checkin from "@/api/checkin";
import IconClose from "@/components/icon/Close.vue";
import { useUserStore } from "@/store/user.js";
import MyLocation from "@/components/icon/MyLocation.vue";
import utils from "@/api/utils";
import { useI18n } from "vue-i18n";
import auth from "@/api/authentication";
import { useRoute } from "vue-router";

const router = useIonRouter();
const route = useRoute();

const prevStep = () => {
  router.back();
};
const mapApiKey = ref(null);
const isMapVisible = ref(false);
const mapContainer = ref(null);
const mapSize = ref({ width: 0, height: 0 });

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
const isSubmitting = ref(false);

const progress = ref(0);
const step = 0.01;

//in seconds
const duration = 5;
const instruction = ref("");
const percent = (duration / 100) * 1000;

const defaultSwipeHandler = ref(null);
const site_radius = ref(100);
const site_lat = ref(0);
const site_long = ref(0);
const siteName = ref("");

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
  let videoConstraints = {
    facingMode: 'user',
    frameRate: { min: 15, ideal: 20, max: 30 }
  };

  if (window.screen.orientation && window.screen.orientation.type.includes('portrait')) {
    // Portrait mode: height > width
    videoConstraints.width = { ideal: 640 };
    videoConstraints.height = { ideal: 360 };
  } else {
    // Landscape mode: width > height
    videoConstraints.width = { ideal: 640 };
    videoConstraints.height = { ideal: 360 };
  }
  stream = await navigator.mediaDevices
    .getUserMedia({
      video: videoConstraints,
      audio: false,
    })
    .catch((err) => console.log("media stream err:", err.name));

  if (!stream) return;
  const isAppleDevice = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  let recorder_options
  if (isAppleDevice) {
    recorder_options = {
      mimeType: 'video/mp4',
      videoBitsPerSecond: 150000, // Lower bitrate for smaller file size
    };
  }
  else {
    recorder_options = {
      mimeType: 'video/webm;codecs=vp9',
      videoBitsPerSecond: 150000,
      // 150 kbps for video
    };
  }
  video.value.srcObject = stream;
  video.value.play();

  let dataResolver;
  dataPromise = new Promise((resolve) => (dataResolver = resolve));

  if (!MediaRecorder.isTypeSupported(recorder_options.mimeType)) {
    recorder_options = {
      mimeType: 'video/mp4', videoBitsPerSecond: 200000, // 200 kbps for video
      codecs: 'avc1.42E01E, mp4a.40.2'
    }; // Fallback for browsers that don't support MP4
  }
  recorder = new MediaRecorder(stream, recorder_options);
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
  // await getSiteLocation();

  cleanup();
  isOpen.value = false;
  isLoading.value = false;
  progress.value = 0;
  instruction.value = "";
};

const printCurrentPosition = async (forceFresh = false) => {
  // forceFresh skips the query-param shortcut — a refresh needs a real fix, not the position
  // the user arrived with.
  if (!forceFresh && route.query.lat && route.query.lng) {
      coordinates.value = {
        coords: {
            latitude: Number(route.query.lat),
            longitude: Number(route.query.lng)
        }
      };
      return; 
  }

  // Bounded, retrying acquisition — this call previously had no timeout and could
  // spin on "Locating..." indefinitely on weak GPS.
  //
  // forceFresh also has to defeat the platform's position cache: without maximumAge 0 a
  // retry re-serves the same fix that just failed the geofence check, so the "try again"
  // button cannot recover for as long as that fix stays cached.
  coordinates.value = await getCurrentPositionSafe(
    forceFresh ? { maximumAge: 0 } : {},
  );
};

const startVerifyPerson = async () => {
  if (isSubmitting.value) return; // Prevent multiple clicks
  isSubmitting.value = true;
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

// Header + body, the same shape the backend errors use.
const showLocationError = (error) => {
  const key = locationErrorKey(error);
  showErrorToast(t(`${key}.title`), t(`${key}.description`));
};

const loadAgainLocation = async () => {
  if (isLoadingLocation.value) return;

  try {
    isLoadingLocation.value = true;
    await printCurrentPosition(true);
    await getSiteLocation();

    // User may have moved inside the geofence — show the map that was withheld.
    revealMap();
  } catch (error) {
    console.error("Location refresh failed", error);
    // getSiteLocation swallows and reports its own backend errors, so anything here is GPS.
    showLocationError(error);
  } finally {
    isLoadingLocation.value = false;
  }
};

const getSiteLocation = async () => {
  try {
    const now = Date.now();
    const cacheTimeout = 2 * 60 * 1000;
    const isCacheFresh = now - userStore.lastGeolocationFetch < cacheTimeout;

    // 1. Check Face Enrollment Cache
    let enrollmentData = null;
    if (isCacheFresh && userStore.cachedFaceEnrollment) {
      enrollmentData = userStore.cachedFaceEnrollment;
    } else {
      const response = await auth.getUserFaceEnrollment({
        employee_id: userStore.user?.employee_id,
      });
      enrollmentData = response.data.data;
    }

    if (enrollmentData?.enrolled === false) {
      showErrorToast(`You have not enrolled your face. Please enroll.`);
      router.push("/enrollment");
      return false;
    }

    // 2. Check Site Location Cache
    if (isCacheFresh && userStore.cachedGeolocationData) {
      const data = userStore.cachedGeolocationData;
      site_radius.value = data.geofence_radius;
      siteName.value = data.site_name || "";
      site_lat.value = data.latitude;
      site_long.value = data.longitude;
      userStore.setEndpointStatus(data.endpoint_status);
      isUserWithinGeofenceRadius.value = data.user_within_geofence_radius;
      faceRecEndpointEnabled.value = data.endpoint_status;
      shift.value = data.shift;
    } else {
      const payload = {
        employee_id: userStore.user?.employee_id,
        latitude: coordinates.value?.coords?.latitude,
        longitude: coordinates.value?.coords?.longitude,
        log_type: logType.value || "IN",
      };

      if (route.query.shift && route.query.shift !== 'None' && route.query.shift !== 'undefined') {
        payload.shift = route.query.shift;
      }

      const { data } = await checkin.getSiteLocation(payload);

      site_radius.value = data.data.geofence_radius;
      siteName.value = data.data.site_name || "";
      site_lat.value = data.data.latitude;
      site_long.value = data.data.longitude;
      userStore.setEndpointStatus(data.data.endpoint_status);
      isUserWithinGeofenceRadius.value = data.data.user_within_geofence_radius;
      faceRecEndpointEnabled.value = data.data.endpoint_status;
      shift.value = data.data.shift;
    }

    return true;
  } catch (error) {
    // Robust Error Handling
    const msg = error?.data?.message || error?.message || "Unable to retrieve site location";
    const detail = error?.data?.error || null;
    const code = error?.data?.status_code || 0;
    showErrorToast(msg, detail, code);
    return false;
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

    if (route.query.shift && route.query.shift !== 'None' && route.query.shift !== 'undefined') {
      payload.shift = route.query.shift
    }


    if (userStore.isEndpointEnabled) {
      payload.video = verifyVideo.value
    }

    await checkin.verifyCheckin(payload);
    userStore.prefetchCheckins(userStore.user?.employee_id);
    userStore.prefetchGeolocation(userStore.user?.employee_id);
    // await getSiteLocation();

    const type = logType.value === "OUT" ? "checkout" : "checkin";

    showSuccessToast(`You have ${type} successfully`);

    router.push("/dashboard");
  } catch (error) {
    console.error("Checkin Error:", error);
    // Robust Error Handling
    const msg = error?.data?.message || error?.message || "Checkin failed";
    const detail = error?.data?.error || null;
    const code = error?.data?.status_code || 0;
    showErrorToast(msg, detail, code);
  }
  finally {
    isSubmitting.value = false; // Re-enable button
  }
};

const initialPosition = computed(() => ({
  lat: coordinates.value?.coords?.latitude || 0,
  lng: coordinates.value?.coords?.longitude || 0,
}));
// A ref written once per refresh, NOT a computed: a refresh mutates position, site data and
// size across separate await boundaries, so a computed reassigned the <img> src two or three
// times — aborting each in-flight load and billing a request for every one.
const staticMapUrl = ref("");

const renderStaticMap = () => {
  const canRender =
    isMapVisible.value &&
    mapApiKey.value &&
    mapSize.value.width &&
    (initialPosition.value.lat || initialPosition.value.lng);

  const next = canRender
    ? buildStaticMapUrl({
        apiKey: mapApiKey.value,
        center: initialPosition.value,
        marker: initialPosition.value,
        circle: {
          lat: site_lat.value,
          lng: site_long.value,
          radiusM: site_radius.value,
        },
        size: mapSize.value,
      })
    : "";

  // An identical value doesn't re-render, so no request is made.
  if (next === staticMapUrl.value) return;

  staticMapUrl.value = next;
};

// Returns the key, or null if GPS or the key request failed — the matching error state is
// raised here, so callers only need the null check.
const ensureLocation = async () => {
  // allSettled, not all, so a key failure stays distinguishable from a GPS failure.
  const [gpsResult, apiKeyResult] = await Promise.allSettled([
    printCurrentPosition(),
    utils.getGoogleMapApiKey(),
  ]);

  if (gpsResult.status === "rejected") {
    // Only a denied permission warrants the modal — it tells the user to grant access, which
    // is the wrong instruction for a timeout or a device that simply has no fix.
    if (isPermissionDenied(gpsResult.reason)) {
      hasUserRejectedLocation.value = true;
    } else {
      showLocationError(gpsResult.reason);
    }
    return null;
  }

  const apiKey =
    apiKeyResult.status === "fulfilled"
      ? apiKeyResult.value?.data?.data?.google_map_api
      : null;

  // Covers both a failed request and a 200 that carried no key.
  if (!apiKey) {
    showErrorToast(t("user.checkin.apiKeyNotFound"));
    return null;
  }

  return apiKey;
};

// Outside the geofence a blocking modal covers the map; with no shift the check-in button
// never renders. Either way there is nothing worth paying for.
const canUseMap = () => isUserWithinGeofenceRadius.value && !!shift.value;

// Static API caps each dimension at 640px; scaling proportionally keeps the container's aspect
// ratio so object-fit has nothing meaningful to crop.
const MAX_STATIC_PX = 640;

// Quantised: mobile browsers resize the viewport as the address bar collapses, and unrounded
// drift produces a new URL — another paid request for a visually identical image.
const SIZE_STEP_PX = 16;

const measureMapSize = () => {
  const width = mapContainer.value?.clientWidth || window.innerWidth;
  const height = mapContainer.value?.clientHeight || window.innerHeight;
  const factor = Math.min(1, MAX_STATIC_PX / Math.max(width, height));
  const quantise = (px) =>
    Math.max(SIZE_STEP_PX, Math.round((px * factor) / SIZE_STEP_PX) * SIZE_STEP_PX);

  mapSize.value = { width: quantise(width), height: quantise(height) };
};

// Shows or hides the map once eligibility is known — the retry paths use it too, so someone
// who moves inside the geofence gets the map that was withheld.
const revealMap = () => {
  measureMapSize();
  isMapVisible.value = canUseMap();

  // Built once here, after position, site data and size have all settled.
  renderStaticMap();
};

const handleStaticMapError = (event) => {
  // A load superseded by a newer src reports as an error — only surface the current one.
  if (event?.target?.src && event.target.src !== staticMapUrl.value) return;

  console.error("Static map failed to load", staticMapUrl.value);
  showErrorToast(t("user.checkin.staticMapFailed"));
};

const initializeMap = async () => {
  hasUserRejectedLocation.value = false;
  isLoadingLocation.value = true;

  try {
    const apiKey = await ensureLocation();
    if (!apiKey) return;

    hasUserRejectedLocation.value = false;
    mapApiKey.value = apiKey;

    // Eligibility first: an unenrolled user navigates away and never sees the map.
    const hasSiteLocation = await getSiteLocation();
    if (!hasSiteLocation) return;

    revealMap();
  } catch (e) {
    console.error("Map or Site Location Error", e);
  } finally {
    isLoadingLocation.value = false;
  }
};

// "Try again" on the permission-denied modal.
const retryLocation = async () => {
  isLoadingLocation.value = true;

  try {
    const apiKey = await ensureLocation();
    if (!apiKey) return;

    hasUserRejectedLocation.value = false;
    mapApiKey.value = apiKey;

    await getSiteLocation();
    revealMap();
  } catch (e) {
    console.error("Map or Site Location Error", e);
  } finally {
    isLoadingLocation.value = false;
  }
};

const disableSwipeBack = () => {
  const ionRouterOutlet = document.querySelector('ion-router-outlet');
  if (ionRouterOutlet) {
    defaultSwipeHandler.value = ionRouterOutlet.swipeHandler;

    ionRouterOutlet.swipeHandler = {
      canStart: () => false,
      onStart: () => { },
      onEnd: () => { },
    }
  }
};

const enableSwipeBack = () => {
  const ionRouterOutlet = document.querySelector('ion-router-outlet');
  if (ionRouterOutlet) {
    ionRouterOutlet.swipeHandler = defaultSwipeHandler.value;
  }
};

// --- LIFECYCLE OPTIMIZATION ---

onMounted(async () => {
  disableSwipeBack();

  // Set logType from query parameter if available
  if (route.query.log_type) {
    logType.value = route.query.log_type;
  }

  // Start map init IMMEDIATELY (parallel with transition)
  await initializeMap();
});

onBeforeUnmount(() => {
  enableSwipeBack();
});

onIonViewWillLeave(() => {
  isLoading.value = false;
  isUserWithinGeofenceRadius.value = true;
  logType.value = "";
  shift.value = null;
});

onIonViewDidLeave(() => {
  isMapVisible.value = false;
  staticMapUrl.value = "";
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
      <div ref="mapContainer" class="map-wrapper">
        <img v-if="isMapVisible && staticMapUrl" :src="staticMapUrl" class="map-static" alt=""
          @error="handleStaticMapError" />
      </div>

      <div class="location-currentLocation" :class="{
        'location-currentLocation-shift': shift,
        'location-currentLocation-busy': isLoadingLocation,
      }" @click="loadAgainLocation">
        <MyLocation />
      </div>

      <div v-if="shift" class="location-wrapper">
        <ion-row class="ion-align-items-center ion-justify-content-between location-wrapper-row">
          <div class="checkin-location-wrapper">
            <p class="checkin-location">Checkin location</p>
            <p class="checkin-shift">{{ siteName || shift.shift }}</p>
          </div>
          <ion-button v-if="logType" @click="startVerifyPerson" shape="round" class="checkin-button"
            :color="logType === 'IN' ? 'success' : 'danger'" :disabled="isSubmitting">
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
        <video class="video-verify-video-play" autoplay playsinline ref="video"></video>

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
            <ion-button class="geolocation-page-outside-card-try-again" fill="clear" :disabled="isLoadingLocation"
              @click="loadAgainLocation">
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
            <ion-button class="geolocation-page-outside-card-try-again" fill="clear" :disabled="isLoadingLocation"
              @click="retryLocation">
              {{ $t("user.checkin.geolocation.try_again") }}
            </ion-button>
          </ion-row>
        </div>
      </ion-row>
    </ion-modal>
  </ion-page>
</template>

<style lang="scss" scoped>
.map-wrapper {
  position: relative;
  height: calc(100% - 70px);
  width: 100%;
}

.map-static {
  display: block;
  height: 100%;
  width: 100%;
  object-fit: cover;
}

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

  &-busy {
    opacity: 0.5;
    pointer-events: none;
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

  .video {

    transform: translateX(-50%) translateY(-50%) scaleX(-1);
  }

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