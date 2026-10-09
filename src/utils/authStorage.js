import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";

const SESSION_KEYS = ["auth", "user"];
const isNative = Capacitor.getPlatform() !== "web";
const snapshot = {};

const loadSnapshot = async () => {
  try {
    for (const key of SESSION_KEYS) {
      const { value } = await Preferences.get({ key });
      if (value !== null) snapshot[key] = value;
    }
  } catch (err) {
    // The app still starts; the worker signs in again.
    console.error("Could not read the saved session:", err);
  }
};

const preferencesStorage = {
  getItem: (key) => snapshot[key] ?? null,
  setItem: (key, value) => {
    snapshot[key] = value;
    Preferences.set({ key, value }).catch((err) => console.error("Could not save the session:", err));
  },
  removeItem: (key) => {
    delete snapshot[key];
    Preferences.remove({ key }).catch((err) => console.error("Could not clear the session:", err));
  },
};

// Resolves once the native session is in memory; the router waits for it before its first guard.
export const authStorageReady = isNative ? loadSnapshot() : Promise.resolve();

// Preferences survives reboots and WebView storage eviction; the web build keeps localStorage.
export const authStorage = isNative ? preferencesStorage : localStorage;

export const clearAuthStorage = () => SESSION_KEYS.forEach((key) => authStorage.removeItem(key));
