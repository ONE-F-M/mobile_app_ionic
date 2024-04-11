import { defineStore } from "pinia";

export const useUserStore = defineStore(
  "user",
  {
    state: () => {
      return {
        user: null,
      };
    },
    persist: true,
    actions: {
      setUser(user) {
        this.user = user;
      },
    },
  },
  {
    persist: true,
  },
);
