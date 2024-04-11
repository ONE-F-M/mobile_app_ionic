<script setup>
  import { useUserStore } from "@/store/user";
  import { useLangStore } from "@/store/lang";
  import { useIonRouter } from "@ionic/vue";

  const router = useIonRouter();

  const userStore = useUserStore();
  const langStore = useLangStore();

  if (userStore.user && langStore.lang) {
    console.log("going home");
    router.push("/home");
  }

  const selectArabic = () => langStore.setLang("ar");
  const selectEnglish = () => langStore.setLang("en");
</script>

<template>
  <div>
    <div @click="selectArabic">
      continue arabic
    </div>

    <div @click="selectEnglish">
      continue english
    </div>

    {{ langStore.lang }}
  </div>
</template>

