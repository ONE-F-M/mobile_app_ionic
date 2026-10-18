import { Network } from "@capacitor/network";
import { toastController } from "@ionic/vue";
import { useI18n } from "vue-i18n";

// Keeps one persistent "No internet connection" toast on screen while the device is offline.
// Call useNetworkStatus() from a component's setup, then start() once mounted.
export function useNetworkStatus() {
  const { t } = useI18n();

  let toast = null;
  let listener = null;
  let showing = false;

  const showOffline = async () => {
    if (showing) return;
    showing = true;
    const created = await toastController.create({
      message: t("utils.offline"),
      duration: 0,
      position: "top",
      color: "medium",
    });
    // Connectivity may have returned while the toast was being created.
    if (!showing) {
      await created.dismiss();
      return;
    }
    toast = created;
    await created.present();
  };

  const hideOffline = async () => {
    showing = false;
    if (!toast) return;
    const current = toast;
    toast = null;
    await current.dismiss();
  };

  const apply = (status) => (status?.connected ? hideOffline() : showOffline());

  const start = async () => {
    if (listener) return;
    listener = await Network.addListener("networkStatusChange", apply);
    apply(await Network.getStatus());
  };

  const stop = async () => {
    await listener?.remove();
    listener = null;
    await hideOffline();
  };

  return { start, stop };
}
