import * as Sentry from "@sentry/capacitor";
import { actionSheetController, alertController, toastController } from "@ionic/vue";
import { useI18n } from "vue-i18n";
import { useUserStore } from "@/store/user";

export const TESTER_ROLE = "Mobile App Tester";
export const TAPS_TO_OPEN = 7;

// Seven taps on the version line open crash-reporting checks, for users with the tester role only.
export function useDebugMenu() {
  const { t } = useI18n();
  const userStore = useUserStore();
  let taps = 0;

  const sendTestError = async () => {
    Sentry.addBreadcrumb({
      category: "debug-menu",
      message: "GET v1.example?employee_id=TEST-0000&token=fake-test-token",
    });
    Sentry.captureException(new Error("Sentry test error from the debug menu"));
    const toast = await toastController.create({ message: t("user.profile.debug_menu.sent"), duration: 2000 });
    await toast.present();
  };

  const confirmNativeCrash = async () => {
    const alert = await alertController.create({
      header: t("user.profile.debug_menu.crash_title"),
      message: t("user.profile.debug_menu.crash_message"),
      buttons: [
        { text: t("user.profile.debug_menu.cancel"), role: "cancel" },
        { text: t("user.profile.debug_menu.crash_confirm"), role: "destructive", handler: () => Sentry.nativeCrash() },
      ],
    });
    await alert.present();
  };

  const onVersionTap = async () => {
    if (!(userStore.user?.roles || []).includes(TESTER_ROLE)) return;
    taps += 1;
    if (taps < TAPS_TO_OPEN) return;
    taps = 0;
    const sheet = await actionSheetController.create({
      header: t("user.profile.debug_menu.title"),
      buttons: [
        { text: t("user.profile.debug_menu.test_error"), handler: sendTestError },
        { text: t("user.profile.debug_menu.native_crash"), role: "destructive", handler: confirmNativeCrash },
        { text: t("user.profile.debug_menu.cancel"), role: "cancel" },
      ],
    });
    await sheet.present();
  };

  return { onVersionTap };
}
