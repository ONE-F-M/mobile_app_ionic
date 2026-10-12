import { ref } from "vue";
import { Capacitor } from "@capacitor/core";
import { useBackButton } from "@ionic/vue";

// Preferred first. Android WebView's h264 encoder can return an empty clip, so webm VP9/VP8 lead and mp4 serves WKWebView.
export const MIME_PREFERENCE = [
  "video/webm;codecs=vp9",
  "video/webm;codecs=vp8",
  "video/mp4",
  "video/webm;codecs=h264",
];

export const pickMimeType = () => {
  if (typeof MediaRecorder === "undefined" || !MediaRecorder.isTypeSupported) {
    return "";
  }
  return MIME_PREFERENCE.find((type) => MediaRecorder.isTypeSupported(type)) || "";
};

// Native iOS, or a web view/browser on iPhone/iPad. iPadOS reports "Macintosh" but has touch points.
export const isIOSDevice = () => {
  if (Capacitor.getPlatform() === "ios") return true;
  const ua = typeof navigator.userAgent === "string" ? navigator.userAgent : "";
  if (/iPhone|iPad|iPod/i.test(ua)) return true;
  return /Macintosh/i.test(ua) && navigator.maxTouchPoints > 1;
};

// Phones with few cores or little memory get a smaller, slower stream.
// iPhones report a low core count even when they are fast, so iOS skips the core rule.
export const isLowEndDevice = () =>
  (!isIOSDevice() &&
    typeof navigator.hardwareConcurrency === "number" &&
    navigator.hardwareConcurrency <= 4) ||
  (typeof navigator.deviceMemory === "number" && navigator.deviceMemory <= 3);

export const blobToBase64 = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1]);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });

// Records one face clip for enrollment or check-in; finish() resolves { base64, mimeType, size }.
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
  let backGuard = null;

  const releaseBackButton = () => {
    backGuard?.unregister();
    backGuard = null;
  };

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
    releaseBackButton();

    try {
      if (recorder && recorder.state !== "inactive") recorder.stop();
    } catch (err) {
      console.warn("Could not stop the recorder:", err?.name);
    }
    recorder = null;

    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    stream = null;

    if (videoEl) videoEl.srcObject = null;
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
      .catch((err) => console.warn("Could not open the camera:", err?.name));

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
      console.warn("Could not start recording:", err?.name);
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
    // Back is ignored while the clip records; Ionic overlays still close first.
    backGuard = useBackButton(20, () => {});

    timer = setTimeout(tick, tickMs);
    return true;
  };

  // Stops recording and resolves { base64, mimeType, size }, or null if not recording.
  const finish = async () => {
    clearTimer();
    releaseBackButton();
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
