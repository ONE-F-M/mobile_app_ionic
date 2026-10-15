import { ref } from "vue";
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import configuration from "@/api/configuration";
import { isOlder } from "@/utils/appVersion";

export const DISMISSED_KEY = "app_update_banner_dismissed_on";

// State is shared so App.vue can run the check while AppUpdateGate renders the result.
const blocked = ref(false);
const showBanner = ref(false);
const storeUrl = ref("");

const today = () => new Date().toISOString().slice(0, 10);

const dismissedToday = () => {
  try {
    return localStorage.getItem(DISMISSED_KEY) === today();
  } catch {
    return false;
  }
};

const reset = () => {
  blocked.value = false;
  showBanner.value = false;
  storeUrl.value = "";
};

// Compares the installed version with the server's minimum and latest. Any failure or
// empty value lets the user in: no block and no banner.
async function checkAppVersion() {
  try {
    const platform = Capacitor.getPlatform();
    if (platform !== "android" && platform !== "ios") return;

    const { version } = await App.getInfo();
    const response = await configuration.getAppVersion();
    const info = response?.data?.data?.[platform];
    if (!version || !info) {
      reset();
      return;
    }

    blocked.value = isOlder(version, info.minimum_app_version);
    showBanner.value =
      !blocked.value &&
      isOlder(version, info.latest_app_version) &&
      !dismissedToday();
    storeUrl.value = info.store_url || "";
  } catch (err) {
    console.error("App version check failed: ", err);
    reset();
  }
}

function dismissBanner() {
  try {
    localStorage.setItem(DISMISSED_KEY, today());
  } catch {
    // Storage unavailable: the banner is only hidden for this session.
  }
  showBanner.value = false;
}

export function useAppVersion() {
  return { blocked, showBanner, storeUrl, checkAppVersion, dismissBanner };
}

export default useAppVersion;
