import { defineStore } from "pinia";
import { useAuthStore } from "@/store/auth.js";

export const useUserStore = defineStore("user", {
  state: () => {
    return {
      user: null,
      token: null,
      isEndpointEnabled:null,
    };
  },
  persist: true,
  actions: {
    setEndpointStatus(status){
      this.isEndpointEnabled = status;
    },
    setUser(user) {
      this.user = user;
    },

    setToken(token) {
      this.token = token;
    },

    logout() {
      const authStore = useAuthStore();

      authStore.reset();

      this.user = null;
      this.token = null;
      this.isEndpointEnabled = null;
    },
  },
});
