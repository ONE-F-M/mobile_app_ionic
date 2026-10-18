import { alertController, useBackButton } from "@ionic/vue";

export const MIN_WEBVIEW_MAJOR = 89;

export function webViewMajor(userAgent) {
  const match = /Chrome\/(\d+)/.exec(userAgent || "");
  return match ? parseInt(match[1], 10) : null;
}

export function isWebViewTooOld(userAgent, platform) {
  if (platform !== "android") return false;
  const major = webViewMajor(userAgent);
  return major !== null && major < MIN_WEBVIEW_MAJOR;
}

export function webViewStoreUrl(userAgent) {
  const match = /Android (\d+)/.exec(userAgent || "");
  const androidMajor = match ? parseInt(match[1], 10) : null;
  if (androidMajor !== null && androidMajor >= 7 && androidMajor <= 9) {
    return "market://details?id=com.android.chrome";
  }
  return "market://details?id=com.google.android.webview";
}

export async function showWebViewGate(t, userAgent) {
  // Swallow the hardware back button while the gate is up.
  const unregister = useBackButton(101, () => {});

  const alert = await alertController.create({
    header: t("utils.webview_outdated.title"),
    message: t("utils.webview_outdated.message"),
    backdropDismiss: false,
    buttons: [
      {
        text: t("utils.webview_outdated.update"),
        handler: () => {
          window.open(webViewStoreUrl(userAgent), "_system");
          return false;
        },
      },
      {
        text: t("utils.webview_outdated.retry"),
        handler: () => {
          window.location.reload();
        },
      },
    ],
  });

  alert.onDidDismiss().then(() => {
    if (typeof unregister === "function") unregister();
    else if (unregister && typeof unregister.unregister === "function") unregister.unregister();
  });

  await alert.present();
  return alert;
}
