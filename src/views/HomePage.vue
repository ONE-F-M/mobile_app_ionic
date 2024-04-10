<template>
  <ion-header collapse="condense">
    <ion-toolbar>
      <ion-title size="large">Blank</ion-title>
    </ion-toolbar>
  </ion-header>

  <div id="container">
    <strong>Ready to create an app?</strong>
    <p>
      Start with Ionic
      <a
        target="_blank"
        rel="noopener noreferrer"
        href="https://ionicframework.com/docs/components"
      >
        UI Components
      </a>
    </p>
    <p>Navigate to <router-link to="/login">Login</router-link></p>
    <img :src="imageSrc" />
    <ion-button @click="takePhoto()">Take Photo</ion-button>
  </div>
</template>

<script setup>
import { IonHeader, IonTitle, IonToolbar } from "@ionic/vue";
import { ref } from "vue";
import { Camera, CameraResultType } from "@capacitor/camera";

const imageSrc = ref("");
const takePhoto = async () => {
  const image = await Camera.getPhoto({
    quality: 90,
    allowEditing: true,
    resultType: CameraResultType.Uri,
  });

  imageSrc.value = image.webPath;
};
</script>
