import { createI18n } from "vue-i18n";
import messages from "@/locale/index.js";

const initI18n = (locale = "en") => {
  return createI18n({
    locale, // set locale
    fallbackLocale: "en", // set fallback locale
    messages, // set locale messages
    legacy: false,
  });
};
export default initI18n;
