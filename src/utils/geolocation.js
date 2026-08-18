import { Geolocation } from "@capacitor/geolocation";

/**
 * Robust GPS acquisition for check-in / check-out.
 *
 * Fixes the "Locating..." forever symptom by guaranteeing the call always resolves
 * or rejects in bounded time:
 *   - explicit permission check/request first (surfaces "denied" instead of hanging),
 *   - a hard timeout on every attempt (Capacitor's default is none),
 *   - a small maximumAge so a very recent fix can be reused instantly,
 *   - automatic retry, falling back to low-accuracy on the last attempt so a weak
 *     GPS signal still yields *a* position instead of spinning indefinitely.
 *
 * @param {object} [opts]
 * @param {number} [opts.timeout=8000]      per-attempt timeout (ms)
 * @param {number} [opts.maximumAge=15000]  accept a cached fix up to this age (ms)
 * @param {number} [opts.retries=2]         extra attempts after the first
 * @returns {Promise<GeolocationPosition>}  resolves with a Capacitor position
 * @throws  {Error} with .code: 'PERMISSION_DENIED' | 'TIMEOUT' | 'UNAVAILABLE'
 */
export async function getCurrentPositionSafe(opts = {}) {
  const {
    timeout = 8000,
    maximumAge = 15000,
    retries = 2,
  } = opts;

  // 1. Permission gate — turns a silent hang into an actionable error.
  try {
    let perm = await Geolocation.checkPermissions();
    if (perm.location !== "granted" && perm.coarseLocation !== "granted") {
      perm = await Geolocation.requestPermissions();
    }
    if (perm.location === "denied" && perm.coarseLocation === "denied") {
      const err = new Error("Location permission denied");
      err.code = "PERMISSION_DENIED";
      throw err;
    }
  } catch (e) {
    // checkPermissions is unimplemented on some web runtimes — fall through and
    // let getCurrentPosition trigger the browser prompt instead of failing hard.
    if (e && e.code === "PERMISSION_DENIED") throw e;
  }

  let lastError;
  const attempts = retries + 1;
  for (let i = 0; i < attempts; i++) {
    const isLastAttempt = i === attempts - 1;
    try {
      return await Geolocation.getCurrentPosition({
        // Drop to coarse accuracy on the final try so indoor/weak-signal devices
        // still return a position rather than timing out again.
        enableHighAccuracy: !isLastAttempt,
        timeout,
        maximumAge,
      });
    } catch (e) {
      lastError = e;
    }
  }

  const err = new Error(lastError?.message || "Unable to determine location");
  // Capacitor/browser code 1 = permission denied, 3 = timeout.
  err.code =
    lastError?.code === 1
      ? "PERMISSION_DENIED"
      : lastError?.code === 3
        ? "TIMEOUT"
        : "UNAVAILABLE";
  throw err;
}

/**
 * True only for a denied permission — not for TIMEOUT or UNAVAILABLE.
 *
 * Callers need the distinction because "grant location access" is the wrong instruction for a
 * device that simply couldn't get a fix. Accepts the raw browser code 1 as well, for errors
 * that reach a caller without passing through getCurrentPositionSafe.
 */
export const isPermissionDenied = (error) =>
  error?.code === "PERMISSION_DENIED" || error?.code === 1;

/**
 * Base i18n key describing why a position could not be obtained. Each returned key exposes
 * `.title` and `.description`, matching how backend errors fill the toast header and body.
 *
 * Each cause needs its own instruction: granting permission fixes a denial but does nothing
 * for a timeout, and moving outdoors fixes a timeout but not a device with location services
 * switched off. Returns a key rather than text so the copy stays in the locale files.
 */
export const locationErrorKey = (error) => {
  if (isPermissionDenied(error)) return "user.checkin.geolocation";
  if (error?.code === "TIMEOUT") return "user.checkin.locationError.timeout";
  if (error?.code === "UNAVAILABLE") return "user.checkin.locationError.unavailable";
  return "user.checkin.locationError.unknown";
};
