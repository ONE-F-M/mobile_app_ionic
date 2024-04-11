import { defineStore } from "pinia";

export const useLangStore = defineStore("lang", {
  state: () => {
    return {
      lang: null,
    };
  },
  actions: {
    setLang(lang) {
      this.lang = lang;
    }
  }
});
