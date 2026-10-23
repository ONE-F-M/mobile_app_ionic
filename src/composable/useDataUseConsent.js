import { Preferences } from "@capacitor/preferences";

// Bump this when the notice changes: workers who accepted an older version see it again.
export const DATA_USE_POLICY_VERSION = "2026-10-22";

const CONSENT_KEY = "data_use_consent";

export async function hasDataUseConsent() {
  try {
    const { value } = await Preferences.get({ key: CONSENT_KEY });
    return value === DATA_USE_POLICY_VERSION;
  } catch {
    // If the stored answer cannot be read, treat it as not accepted.
    return false;
  }
}

export async function saveDataUseConsent() {
  await Preferences.set({ key: CONSENT_KEY, value: DATA_USE_POLICY_VERSION });
}
