<template>
  <ion-page>
    <ion-content :fullscreen="false">
      <div id="container">
        <strong>{{ $t("home.description") }}</strong>
        <p>
          langStore.lang = {{ langStore.lang }}
          {{ $t("home.title") }}
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://ionicframework.com/docs/components"
          >
            UI Components
          </a>
        </p>
        <p>Navigate to <router-link to="/login">Login</router-link></p>
        <p>Navigate to <router-link to="/welcome">Welcome</router-link></p>
        <img :src="imageSrc" />
        <ion-button @click="takePhoto()">Take Photo</ion-button>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { IonPage, IonContent, IonButton } from "@ionic/vue";
import { ref } from "vue";
import { Camera, CameraResultType } from "@capacitor/camera";
import { useLangStore } from "@/store/lang.js";

const imageSrc = ref("");
const langStore = useLangStore();

const takePhoto = async () => {
  const image = await Camera.getPhoto({
    quality: 90,
    allowEditing: true,
    resultType: CameraResultType.Uri,
  });

  imageSrc.value = image.webPath;
};
</script>
