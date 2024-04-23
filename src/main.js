import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";

import { useLangStore } from "@/store/lang.js";

import pinia from "@/plugins/pinia.js";
import initI18n from "@/plugins/i18n.js";

import { createAnimation, IonicVue } from "@ionic/vue";

/* Core CSS required for Ionic components to work properly */
import "@ionic/vue/css/core.css";

/* Basic CSS for apps built with Ionic */
import "@ionic/vue/css/normalize.css";
import "@ionic/vue/css/structure.css";
import "@ionic/vue/css/typography.css";

/* Optional CSS utils that can be commented out */
import "@ionic/vue/css/padding.css";
import "@ionic/vue/css/float-elements.css";
import "@ionic/vue/css/text-alignment.css";
import "@ionic/vue/css/text-transformation.css";
import "@ionic/vue/css/flex-utils.css";
import "@ionic/vue/css/display.css";

/* Theme variables */
import "./theme/variables.css";
import "./theme/fonts.scss";

const app = createApp(App);

app.use(pinia);

const animationPage = (baseEl, opts) => {
  const { enteringEl, leavingEl } = opts;

  const enteringPage = createAnimation("entering-page-animation")
    .addElement(enteringEl)
    .fromTo("opacity", 0.2, 1);

  const leavingPage = createAnimation("leaving-page-animation")
    .addElement(leavingEl)
    .fromTo("opacity", 1, 0);

  return createAnimation("root-transition")
    .duration(300)
    .easing("ease-in-out")
    .addAnimation([enteringPage, leavingPage]);
};

app
  .use(IonicVue, {
    navAnimation: animationPage,
  })
  .use(router);

const langStore = useLangStore();

const lang = langStore.lang || "en";

const i18n = initI18n(lang);

app.use(i18n);

router.isReady().then(() => {
  app.mount("#app");
});
