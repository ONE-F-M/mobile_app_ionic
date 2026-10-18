import { defineStore } from "pinia";
import { loadLocaleFonts } from "@/utils/localeFonts.js";

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
      loadLocaleFonts([lang]);
    },
    resetLang() {
      this.lang = null;
      this.rtl = false;
    }
  },
});
