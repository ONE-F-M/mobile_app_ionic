import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { isLowEndDevice, pickMimeType, useFaceRecorder } from "@/composable/useFaceRecorder.js";

const platform = vi.hoisted(() => ({ current: "web" }));
vi.mock("@capacitor/core", () => ({ Capacitor: { getPlatform: () => platform.current } }));

const setAgent = ({ userAgent, touchPoints = 0 }) => {
  Object.defineProperty(navigator, "userAgent", { value: userAgent, configurable: true });
  Object.defineProperty(navigator, "maxTouchPoints", { value: touchPoints, configurable: true });
};
const ANDROID_UA = "Mozilla/5.0 (Linux; Android 13; Pixel 6) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36";
const IPHONE_UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148";
const IPADOS_UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/17.0 Safari/605.1.15";

const supported = new Set();
const track = () => ({ stop: vi.fn() });
let lastRecorder = null;

class FakeRecorder {
  constructor(stream, options) {
    this.options = options;
    this.mimeType = options.mimeType || "video/webm";
    this.state = "inactive";
    lastRecorder = this;
  }
  start() {
    this.state = "recording";
  }
  stop() {
    this.state = "inactive";
    this.ondataavailable({ data: new Blob(["clip"], { type: this.mimeType }) });
  }
  static isTypeSupported(type) {
    return supported.has(type);
  }
}

const setDevice = ({ cores, memory }) => {
  Object.defineProperty(navigator, "hardwareConcurrency", { value: cores, configurable: true });
  Object.defineProperty(navigator, "deviceMemory", { value: memory, configurable: true });
};

beforeEach(() => {
  supported.clear();
  lastRecorder = null;
  globalThis.MediaRecorder = FakeRecorder;
  setDevice({ cores: 8, memory: 8 });
  navigator.mediaDevices = { getUserMedia: vi.fn(async () => ({ getTracks: () => [track(), track()] })) };
});

afterEach(() => {
  vi.useRealTimers();
});

describe("pickMimeType", () => {
  test("prefers webm vp9 over h264 and mp4 on Android WebView", () => {
    supported.add("video/mp4").add("video/webm;codecs=h264").add("video/webm;codecs=vp8").add("video/webm;codecs=vp9");
    expect(pickMimeType()).toBe("video/webm;codecs=vp9");
  });

  test("uses vp8 before mp4 and h264 when vp9 is missing", () => {
    supported.add("video/mp4").add("video/webm;codecs=h264").add("video/webm;codecs=vp8");
    expect(pickMimeType()).toBe("video/webm;codecs=vp8");
  });

  test("uses mp4 where webm cannot be recorded, as on WKWebView", () => {
    supported.add("video/mp4");
    expect(pickMimeType()).toBe("video/mp4");
  });

  test("returns empty when nothing in the list is supported", () => {
    expect(pickMimeType()).toBe("");
  });
});

describe("isLowEndDevice", () => {
  test("flags phones with 4 cores or 3 GB or less", () => {
    setDevice({ cores: 4, memory: 8 });
    expect(isLowEndDevice()).toBe(true);
    setDevice({ cores: 8, memory: 2 });
    expect(isLowEndDevice()).toBe(true);
    setDevice({ cores: 8, memory: 8 });
    expect(isLowEndDevice()).toBe(false);
  });
});

describe("useFaceRecorder", () => {
  test("cleanup is safe before anything started", () => {
    const { cleanup } = useFaceRecorder({ videoBitsPerSecond: 150000 });
    expect(() => cleanup()).not.toThrow();
  });

  test("records with the chosen format and returns it with the clip", async () => {
    supported.add("video/webm;codecs=vp8");
    const recorder = useFaceRecorder({ videoBitsPerSecond: 150000 });
    expect(await recorder.start(null)).toBe(true);
    expect(lastRecorder.options).toEqual({ videoBitsPerSecond: 150000, mimeType: "video/webm;codecs=vp8" });

    const result = await recorder.finish();
    expect(result.mimeType).toBe("video/webm;codecs=vp8");
    expect(result.size).toBeGreaterThan(0);
    expect(typeof result.base64).toBe("string");
  });

  test("asks low-end phones for 480x360 at 15 fps", async () => {
    setDevice({ cores: 2, memory: 1 });
    const recorder = useFaceRecorder({ videoBitsPerSecond: 150000 });
    await recorder.start(null);
    const constraints = navigator.mediaDevices.getUserMedia.mock.calls[0][0].video;
    expect(constraints.width).toEqual({ ideal: 480 });
    expect(constraints.height).toEqual({ ideal: 360 });
    expect(constraints.frameRate).toEqual({ ideal: 15, max: 15 });
  });

  test("cleanup stops every camera track", async () => {
    const tracks = [track(), track()];
    navigator.mediaDevices.getUserMedia = vi.fn(async () => ({ getTracks: () => tracks }));
    const recorder = useFaceRecorder({ videoBitsPerSecond: 150000 });
    await recorder.start(null);
    recorder.cleanup();
    for (const t of tracks) expect(t.stop).toHaveBeenCalled();
  });

  test("a refused camera returns false without throwing", async () => {
    navigator.mediaDevices.getUserMedia = vi.fn(async () => {
      throw Object.assign(new Error("denied"), { name: "NotAllowedError" });
    });
    const recorder = useFaceRecorder({ videoBitsPerSecond: 150000 });
    expect(await recorder.start(null)).toBe(false);
  });
});
