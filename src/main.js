import { createApp } from "vue";
import App from "./App.vue";
import MdiIcon from "@/components/base/MdiIcon.vue";
import router from "./router";
import "dayjs/locale/en";
import "dayjs/locale/ar";

import { initializeFirebase, getFirebaseMessaging } from "@/services/firebase";
import { useLangStore } from "@/store/lang.js";
import { registerServiceWorker } from "@/services/serviceWorker";
import pinia from "@/plugins/pinia.js";
import initI18n from "@/plugins/i18n.js";

import { createAnimation, IonicVue } from "@ionic/vue";

/* Import components */
// REMOVED: VCalendar global registration — moved to local import in Datepicker.vue
// This removes ~80 KB from the initial bundle.

/* Core CSS required for Ionic components to work properly */
import "@ionic/vue/css/core.css";
// REMOVED: @mdi/font webfont (~240 KB). Replaced by tree-shakeable MdiIcon.vue component using @mdi/js.

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

/* Custom styles */
import "./theme/global.scss";

/* Plugins CSS styles */
// REMOVED: v-calendar/style.css — now imported locally in Datepicker.vue
const app = createApp(App);
app.use(pinia);
app.component("MdiIcon", MdiIcon);
// VCalendar removed from global registration — see Datepicker.vue for local usage

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

router.isReady().then(async () => {
  try {
    await registerServiceWorker();
    await getFirebaseMessaging();
  } catch (e) {
    if (e?.message?.includes?.('apiKey')) {
      console.warn("Dev mode: Skipping Firebase/SW initialization due to missing environment keys.");
    } else {
      console.warn("Firebase/SW initialization failed:", e);
      window.__PUSH_NOTIFICATIONS_DISABLED__ = true;
    }
  } finally {
    // ALWAYS mount the app, even if Firebase fails
    app.mount("#app");
  }
});

// Non-blocking background initialization
registerServiceWorker()
  .then(() => getFirebaseMessaging())
  .catch((err) => console.warn('Background init failed:', err));

