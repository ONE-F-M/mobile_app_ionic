<script setup>
import {
  IonPage,
  IonContent,
  IonProgressBar,
  IonButton,
  IonIcon,
  IonSpinner,
} from "@ionic/vue";
import { ref, onMounted } from "vue";
import { arrowBackOutline, arrowForwardOutline } from "ionicons/icons";

const progress = ref(0);
const step = 0.01;

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

const saveVideo = async () => {
  instruction.value = "enrollment.almost_done";
  const promise = new Promise((resolve) => setTimeout(resolve, 1500));

  await promise;
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

onMounted(async () => {
  const stream = await navigator.mediaDevices
    .getUserMedia({ video: true })
    .catch((err) => console.log("media stream err:", err));

  video.value.srcObject = stream;
  video.value.play();

  instruction.value = "enrollment.instructions.look_straight";
  setTimeout(progressWrapper, percent);
});
</script>

<template>
  <ion-page>
    <ion-content class="relative">
      <Transition>
        <div class="centered">
          <div class="video-wrapper">
            <video class="video" autoplay ref="video"></video>
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
            ></ion-spinner>
          </div>
        </div>
      </Transition>

      <template v-if="progress >= 1">
        <div class="test-buttons">
          <router-link to="/enroll-success">
            <ion-button>Success</ion-button>
          </router-link>
          <router-link to="/enroll-failure">
            <ion-button>Failure</ion-button>
          </router-link>
        </div>
      </template>
    </ion-content>
  </ion-page>
</template>

<style lang="scss" scoped>
.centered {
  margin-top: 96px;
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
    height: 100%;
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
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
    margin-top: 32px;
    margin-bottom: 0;
    padding-bottom: 0;
  }

  &-left {
    margin-left: -26px;

    .command-icon {
      margin-right: 16px;
    }
  }

  &-right {
    margin-right: -26px;

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
