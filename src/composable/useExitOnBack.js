import { useBackButton } from "@ionic/vue";
import { App } from "@capacitor/app";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useCustomToast } from "@/composable/toast.js";

// /enrollment is the first screen after login for new users; popping it would land on the guest login page.
export const EXIT_ROUTES = ["/", "/employee-id", "/login", "/dashboard", "/enrollment"];
export const EXIT_WINDOW_MS = 2000;

// Asks for a second back press within 2 s before leaving the app from an entry screen.
export function useExitOnBack() {
  const router = useRouter();
  const { t } = useI18n();
  const { showToast } = useCustomToast();
  let lastPress = 0;

  // With no listener, Android only walks WebView history; any listener hands back presses to Ionic's handlers.
  App.addListener("backButton", () => {});

  useBackButton(10, (processNextHandler) => {
    if (!EXIT_ROUTES.includes(router.currentRoute.value.path)) {
      processNextHandler();
    } else if (Date.now() - lastPress < EXIT_WINDOW_MS) {
      App.exitApp();
    } else {
      lastPress = Date.now();
      showToast({ message: t("utils.press_back_again_to_exit"), duration: EXIT_WINDOW_MS });
    }
  });
}

export default useExitOnBack;
