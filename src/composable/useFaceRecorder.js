import { ref } from "vue";
import { Capacitor } from "@capacitor/core";

// Preferred first. Safari/WKWebView only records mp4; Chromium records webm.
export const MIME_PREFERENCE = [
  "video/mp4",
  "video/webm;codecs=h264",
  "video/webm;codecs=vp8",
  "video/webm;codecs=vp9",
];

export const pickMimeType = () => {
  if (typeof MediaRecorder === "undefined" || !MediaRecorder.isTypeSupported) {
    return "";
  }
  return MIME_PREFERENCE.find((type) => MediaRecorder.isTypeSupported(type)) || "";
};

// Phones with few cores or little memory get a smaller, slower stream.
export const isLowEndDevice = () =>
  (typeof navigator.hardwareConcurrency === "number" &&
    navigator.hardwareConcurrency <= 4) ||
  (typeof navigator.deviceMemory === "number" && navigator.deviceMemory <= 3);

export const blobToBase64 = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1]);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });

/**
 * Shared face-video recorder for enrollment and check-in.
 *
 * options:
 *  - videoBitsPerSecond: 150000 for check-in, 250000 for enrollment
 *  - duration: seconds to record (default 5)
 *  - step: progress increment per tick (default 0.01)
 *  - swapInPortrait: request width/height swapped when the screen is portrait
 *  - onProgress(progress): called on every tick, progress is 0..1
 *  - onFinished(): called once when progress reaches 1; call finish() from it
 */
export function useFaceRecorder({
  videoBitsPerSecond,
  duration = 5,
  step = 0.01,
  swapInPortrait = false,
  onProgress,
  onFinished,
} = {}) {
  const progress = ref(0);
  const mimeType = ref("");

  const totalTicks = Math.round(1 / step);
  const tickMs = (duration * 1000) / totalTicks;

  let stream = null;
  let recorder = null;
  let dataPromise = null;
  let videoEl = null;
  let timer = null;
  let ticks = 0;
  let session = 0; // bumped by cleanup() so a start() still awaiting the camera aborts

  const clearTimer = () => {
    if (timer) clearTimeout(timer);
    timer = null;
  };

  const buildConstraints = () => {
    const isPortrait = !!window.screen?.orientation?.type?.includes("portrait");
    let width = 640;
    let height = 360;
    let frameRate = { min: 15, ideal: 20, max: 30 };

    if (isLowEndDevice()) {
      width = 480;
      height = 360;
      frameRate = { ideal: 15, max: 15 };
    }

    if (swapInPortrait && isPortrait) {
      [width, height] = [height, width];
    }

    return {
      facingMode: "user",
      frameRate,
      width: { ideal: width },
      height: { ideal: height },
    };
  };

  const tick = () => {
    ticks += 1;
    progress.value = Math.min(1, ticks / totalTicks);
    if (onProgress) onProgress(progress.value);

    if (ticks >= totalTicks) {
      timer = null;
      if (onFinished) onFinished();
      return;
    }
    timer = setTimeout(tick, tickMs);
  };

  // Safe to call at any time, including when nothing was ever started.
  const cleanup = () => {
    session += 1;
    clearTimer();

    try {
      if (recorder && recorder.state !== "inactive") recorder.stop();
    } catch (err) {
      console.log("recorder stop err:", err?.name);
    }
    recorder = null;

    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    stream = null;

    if (videoEl) {
      try {
        videoEl.srcObject = null;
      } catch (err) {
        // element may already be gone
      }
    }
    videoEl = null;
  };

  const reset = () => {
    ticks = 0;
    progress.value = 0;
  };

  // Returns true once the camera is open and recording has started.
  const start = async (videoElement) => {
    cleanup();
    reset();
    const mySession = session;

    const media = await navigator.mediaDevices
      .getUserMedia({ video: buildConstraints(), audio: false })
      .catch((err) => console.log("media stream err:", err?.name));

    if (!media) return false;

    // cleanup() ran while the camera permission/stream was pending.
    if (mySession !== session) {
      media.getTracks().forEach((track) => track.stop());
      return false;
    }
    stream = media;

    if (videoElement) {
      videoEl = videoElement;
      videoEl.srcObject = stream;
      videoEl.play();
    }

    const chosen = pickMimeType();
    const options = { videoBitsPerSecond };
    if (chosen) options.mimeType = chosen;

    try {
      recorder = new MediaRecorder(stream, options);
    } catch (err) {
      console.log("recorder create err:", err?.name);
      cleanup();
      return false;
    }

    // If nothing in the list is supported the browser picks; report what it picked.
    mimeType.value =
      chosen ||
      recorder.mimeType ||
      (Capacitor.getPlatform() === "ios" ? "video/mp4" : "video/webm");

    let dataResolver;
    dataPromise = new Promise((resolve) => (dataResolver = resolve));
    recorder.ondataavailable = (event) => dataResolver(event.data);
    recorder.start();

    timer = setTimeout(tick, tickMs);
    return true;
  };

  // Stops recording and resolves { base64, mimeType, size }, or null if not recording.
  const finish = async () => {
    clearTimer();
    const activeRecorder = recorder;
    const pending = dataPromise;
    if (!activeRecorder || !pending) return null;

    if (activeRecorder.state !== "inactive") activeRecorder.stop();

    const blob = await pending;
    const base64 = await blobToBase64(blob);
    return { base64, mimeType: mimeType.value, size: blob.size };
  };

  return { progress, mimeType, start, finish, cleanup, reset };
}

export default useFaceRecorder;
