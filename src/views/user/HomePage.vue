<script setup>
import { useUserStore } from "@/store/user.js";

const userStore = useUserStore();
</script>

<template>
  <div style="overflow: auto">
    <ion-text color="primary">
      <h3 class="ion-padding">User</h3>
      <pre>{{ userStore.user }}</pre>
    </ion-text>
  </div>
</template>
