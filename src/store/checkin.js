import { defineStore } from "pinia";

export const useCheckinStore = defineStore("checkin", {
  state: () => {
    return {
      date: null,
    };
  },
  persist: true,
  actions: {
    setDate(date) {
      this.date = date;
    },
  },
});
