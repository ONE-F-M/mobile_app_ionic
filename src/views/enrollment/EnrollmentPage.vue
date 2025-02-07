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
import { Filesystem, Directory } from '@capacitor/filesystem';
import {
  ref,
  onMounted,
  onUnmounted,
  onActivated,
  onDeactivated,
  shallowRef,
} from "vue";

const emit = defineEmits(["completed"]);

const progress = ref(0);
const step = 0.01;
const showVideo = shallowRef(false);

//in seconds
const duration = 10;
const instructions = [
  "enrollment.instructions.look_straight",
  "enrollment.instructions.face_left",
  "enrollment.instructions.face_right",
];
const instruction = ref("");
const percent = (duration / 100) * 1000;
const interval = 1 / instructions.length;
const curr_step = ref(1);

const updateProgress = () => {
  progress.value += step;

  if (
    progress.value > curr_step.value * interval &&
    instructions[curr_step.value]
  ) {
    instruction.value = instructions[curr_step.value];
    curr_step.value += 1;
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
				frameRate: {ideal: 12},//, max: 20},
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
  
  instruction.value = "enrollment.instructions.look_straight";
    setTimeout(progressWrapper, percent);
};

const cleanup = async () => {
  recorder.stop(); //just in case
  stream && stream.getTracks().forEach((track) => track.stop());
  stream = null;
  showVideo.value = false;
};

const saveVideo = async () => {
    instruction.value = "enrollment.almost_done";
  recorder.stop();

  const chunks = await dataPromise;
  
  const readerPromise = new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64String = reader.result.split(",")[1];

      resolve(base64String);
    }; 
    reader.readAsDataURL(chunks);
  });

  const converted = await readerPromise;
    video.value.pause();
  emit("completed", converted);
};

onMounted(async () => {
  await initializeStream();
  showVideo.value = true;
});
onActivated(async () => {
  await initializeStream();
  showVideo.value = true;
});

onUnmounted(cleanup);
onDeactivated(cleanup);

onIonViewDidLeave(() => {
  if (recorder) {
    cleanup();
  }
  progress.value = 0;
  instruction.value = "";
  curr_step.value = 1;
  video.value = null;
  showVideo.value = false;
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
            :class="{
              'command-instruction-arrow':
                instruction === 'enrollment.instructions.face_left' ||
                instruction === 'enrollment.instructions.face_right',
              'command-left':
                instruction === 'enrollment.instructions.face_left',
              'command-right':
                instruction === 'enrollment.instructions.face_right',
            }"
          >
            <ion-icon
              v-if="instruction === 'enrollment.instructions.face_left'"
              class="icon-arrow-back command-icon"
              color="light"
              size="large"
              :icon="arrowBackOutline"
            />
            <span>{{ $t(instruction) }}</span>
            <ion-icon
              v-if="instruction === 'enrollment.instructions.face_right'"
              class="icon-arrow-back command-icon"
              color="light"
              size="large"
              :icon="arrowForwardOutline"
            />
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
