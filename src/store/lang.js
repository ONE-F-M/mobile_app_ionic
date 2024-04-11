import { defineStore } from "pinia";

export const useLangStore = defineStore("lang", {
  state: () => {
    return {
      lang: null,
      rtl: false,
    };
  },
  persist: true,
  actions: {
    setLang(lang) {
      this.lang = lang;

      this.rtl = lang === "ar";
    },
  },
});
