<script setup>
import {
  IonPage,
  IonContent,
  IonProgressBar,
  IonIcon,
  IonSpinner,
  onIonViewDidLeave,
} from "@ionic/vue";
import { arrowBackOutline, arrowForwardOutline } from "ionicons/icons";
import {
  ref,
  onMounted,
  onUnmounted,
  onActivated,
  onDeactivated,
  shallowRef,
} from "vue";
import { useFaceRecorder } from "@/composable/useFaceRecorder.js";

const emit = defineEmits(["completed"]);

const showVideo = shallowRef(false);
const instruction = ref("");
const video = ref(null);

const saveVideo = async () => {
  instruction.value = "enrollment.almost_done";

  const result = await finish();
  if (!result) return;

  video.value?.pause();
  emit("completed", result.base64, result.mimeType);
};

const { progress, start, finish, cleanup, reset } = useFaceRecorder({
  videoBitsPerSecond: 250000,
  duration: 5,
  swapInPortrait: true,
  onFinished: saveVideo,
});

const initializeStream = async () => {
  const started = await start(video.value);
  if (!started) return false;

  instruction.value = "enrollment.instructions.look_straight";
  return true;
};

const startAndShow = async () => {
  if (await initializeStream()) {
    showVideo.value = true;
  }
};

const stopAll = () => {
  cleanup();
  showVideo.value = false;
};

onMounted(startAndShow);
onActivated(startAndShow);

onUnmounted(stopAll);
onDeactivated(stopAll);

onIonViewDidLeave(() => {
  stopAll();
  reset();
  instruction.value = "";
  video.value = null;
});
</script>

<template>
  <ion-page>
    <ion-content class="relative">
      <Transition>
        <div class="centered">
          <div class="video-wrapper">
            <!-- v-show is important since video tag is used as a ref -->
            <video v-show="showVideo" class="video" autoplay playsinline ref="video" />
          </div>

          <ion-text
            class="command ion-align-items-center ion-d-flex"
            
          >
            
            <span>{{ $t(instruction) }}</span>
            
          </ion-text>

          <template v-if="progress < 1">
            <ion-text class="scan">
              {{ $t("enrollment.scan_in_progress") }}
            </ion-text>

            <ion-progress-bar class="bar" :value="progress" />
          </template>

          <div v-if="instruction === 'enrollment.almost_done'" class="loader">
            <ion-spinner
              class="enrollment-spinner-almost-done"
              name="crescent"
              color="primary"
            ></ion-spinner>
          </div>
        </div>
      </Transition>
    </ion-content>
  </ion-page>
</template>

<style lang="scss" scoped>
.centered {
  padding-top: 96px;
  width: 100%;
  height: 100%;
  display: flex;
  flex-flow: column;
  align-items: center;
}

.video-wrapper {
  position: relative;
  width: 230px;
  height: 280px;
  border-radius: 50%;
  overflow: hidden;

  .video {
    width: 100%;
    height: 100%;
    object-fit: cover;
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translateX(-50%) translateY(-50%) scaleX(-1);
  }
}

.command {
  position: relative;
  margin-top: 42px;
  display: flex;
  align-items: center;
  letter-spacing: 0.75px;
  padding-bottom: 9px;

  & > span {
    margin: 0;
  }

  &-instruction-arrow {
    margin: 32px auto 0;
    padding-bottom: 0;
  }

  &-left {

    .command-icon {
      margin-right: 16px;
    }
  }

  &-right {

    .command-icon {
      margin-left: 16px;
    }
  }

  &-icon {
    height: 38px;
    width: 38px;
  }
}

.scan {
  margin-top: 69px;
  font-size: 1rem;
  line-height: 1.5rem;
  letter-spacing: 0.25px;
}

.bar {
  margin-top: 26px;
  width: min(280px, 80%);
}

ion-progress-bar {
  --background: var(--ion-color-medium);
  --progress-background: var(--ion-color-primary);
}

.loader {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}
.test-buttons {
  position: absolute;
  bottom: 60px;
  width: 100%;
  display: flex;
  justify-content: space-around;
}

.relative {
  position: relative;
}

.enrollment-spinner-almost-done {
  margin-top: 68px;
}
</style>
