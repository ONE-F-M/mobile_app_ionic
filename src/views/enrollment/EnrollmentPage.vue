<script setup>
  import {
    IonPage,
    IonContent,
    IonProgressBar,
    IonButton,
    IonIcon,
    IonSpinner
  } from "@ionic/vue";
  import { ref, onMounted } from "vue";
  import {
    arrowBackOutline,
    arrowForwardOutline
  } from "ionicons/icons";

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
  const percent = duration / 100 * 1000;
  const interval = 1 / instructions.length
  const curr_step = ref(1);

  const updateProgress = () => {
    progress.value += step;

    if (progress.value > curr_step.value * interval
        && instructions[curr_step.value]) {
      instruction.value = instructions[curr_step.value];
      curr_step.value += 1;
    }
  }

  const saveVideo = async () => {
    instruction.value = "enrollment.almost_done";
    const promise = new Promise((resolve) => setTimeout(resolve, 1500));

    await promise;
  }

  const progressWrapper = () => {
    if (progress.value >= 1) {
      saveVideo();
      return;
    }

    updateProgress();
    setTimeout(progressWrapper, percent);
  }

  const video = ref(null);


  onMounted(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({video: true})
        .catch(err => console.log("media stream err:", err))

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

          <ion-text class="command ion-align-items-center ion-d-flex">
            <ion-icon
              v-if="instruction === 'enrollment.instructions.face_left'"
              class="icon-arrow-back"
              color="light"
              size="large"
              :icon="arrowBackOutline"
            />
            <span>{{ $t(instruction) }}</span>
            <ion-icon
              v-if="instruction === 'enrollment.instructions.face_right'"
              class="icon-arrow-back"
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
            <ion-spinner name="crescent"></ion-spinner>
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
  width: 100%;
  height: 100%;
  display: flex;
  flex-flow: column;
  align-items: center;
  justify-content: center;
}

.video-wrapper {
  width: 230px;
  height: 280px;
  border-radius: 50%;
  overflow: hidden;

  .video {
    height: 100%;
  }
}

.command {
  margin-top: 44px;
  display: flex;
  align-items: center;

  & > span {
    margin: 0 10px;
  }
}

.scan {
  margin-top: 78px;
}

.bar {
  margin-top: 24px;
  width: 80%;
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
</style>

