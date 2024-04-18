import { defineStore } from "pinia";

export const useUserStore = defineStore(
  "user",
  {
    state: () => {
      return {
        user: null,
        token: null,
      };
    },
    persist: true,
    actions: {
      setUser(user) {
        this.user = user;
      },

      setToken(token) {
        this.token = token;
      },

      logout() {
        this.user = null;
        this.token = null;
      },
    },
  },
  {
    persist: true,
  },
);
