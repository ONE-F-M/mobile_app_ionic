import { beforeEach, describe, expect, it, vi } from "vitest";
import { Capacitor } from "@capacitor/core";
import { compressImageDataUrl } from "@/utils/compressImage";

const { getPhoto, showErrorToast } = vi.hoisted(() => ({
  getPhoto: vi.fn(),
  showErrorToast: vi.fn(),
}));

vi.mock("@capacitor/core", () => ({ Capacitor: { isNativePlatform: vi.fn() } }));
vi.mock("@capacitor/camera", () => ({
  Camera: { getPhoto },
  CameraResultType: { DataUrl: "dataUrl" },
  CameraSource: { Prompt: "PROMPT", Camera: "CAMERA", Photos: "PHOTOS" },
}));
vi.mock("@/utils/compressImage", () => ({ compressImageDataUrl: vi.fn() }));
vi.mock("@/composable/toast.js", () => ({ useCustomToast: () => ({ showErrorToast }) }));
vi.mock("vue-i18n", () => ({ useI18n: () => ({ t: (key) => key }) }));

import { useFileAttachment } from "@/composable/useFileAttachment";

describe("useFileAttachment.pickPhoto", () => {
  beforeEach(() => {
    getPhoto.mockReset();
    showErrorToast.mockReset();
  });

  it("uses the Prompt source by default and returns name and dataUrl", async () => {
    getPhoto.mockResolvedValue({ dataUrl: "data:image/png;base64,AAA", format: "png" });

    const { pickPhoto } = useFileAttachment();
    const result = await pickPhoto("profile");

    expect(getPhoto).toHaveBeenCalledWith({
      source: "PROMPT",
      resultType: "dataUrl",
      quality: 80,
      width: 1600,
      height: 1600,
    });
    expect(result.dataUrl).toBe("data:image/png;base64,AAA");
    expect(result.name).toMatch(/^profile-\d+\.png$/);
    expect(showErrorToast).not.toHaveBeenCalled();
  });

  it("passes an explicit source through to getPhoto", async () => {
    getPhoto.mockResolvedValue({ dataUrl: "data:image/jpeg;base64,BBB", format: "jpeg" });

    const { pickPhoto } = useFileAttachment();
    const result = await pickPhoto("leave-proof", "CAMERA");

    expect(getPhoto).toHaveBeenCalledWith(expect.objectContaining({ source: "CAMERA" }));
    expect(result.name).toMatch(/^leave-proof-\d+\.jpeg$/);
  });

  it("returns null without a toast when the user cancels", async () => {
    getPhoto.mockRejectedValue(new Error("User cancelled photos app"));

    const { pickPhoto } = useFileAttachment();

    expect(await pickPhoto("profile")).toBeNull();
    expect(showErrorToast).not.toHaveBeenCalled();
  });

  it("shows the error toast and returns null on any other error", async () => {
    getPhoto.mockRejectedValue(new Error("Camera unavailable"));

    const { pickPhoto } = useFileAttachment();

    expect(await pickPhoto("profile")).toBeNull();
    expect(showErrorToast).toHaveBeenCalledTimes(1);
  });
});

describe("useFileAttachment.takePhoto", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getPhoto.mockResolvedValue({ dataUrl: "data:image/png;base64,ORIGINAL", format: "png" });
    compressImageDataUrl.mockResolvedValue("data:image/jpeg;base64,COMPRESSED");
  });

  it("compresses the photo in the browser", async () => {
    Capacitor.isNativePlatform.mockReturnValue(false);
    const { attachment, takePhoto } = useFileAttachment();

    await takePhoto();

    expect(compressImageDataUrl).toHaveBeenCalledWith("data:image/png;base64,ORIGINAL");
    expect(attachment.value.base64).toBe("data:image/jpeg;base64,COMPRESSED");
    expect(attachment.value.name).toMatch(/\.jpeg$/);
  });

  it("keeps the native camera photo as it is", async () => {
    Capacitor.isNativePlatform.mockReturnValue(true);
    const { attachment, takePhoto } = useFileAttachment();

    await takePhoto();

    expect(compressImageDataUrl).not.toHaveBeenCalled();
    expect(attachment.value.base64).toBe("data:image/png;base64,ORIGINAL");
    expect(attachment.value.name).toMatch(/\.png$/);
  });

  it("uploads the original photo when the browser cannot redraw it", async () => {
    Capacitor.isNativePlatform.mockReturnValue(false);
    getPhoto.mockResolvedValue({ dataUrl: "data:image/heic;base64,ORIGINAL", format: "heic" });
    compressImageDataUrl.mockRejectedValue(new Error("Could not read the photo"));
    const { attachment, takePhoto } = useFileAttachment();

    await takePhoto();

    expect(attachment.value.base64).toBe("data:image/heic;base64,ORIGINAL");
    expect(attachment.value.name).toMatch(/\.heic$/);
    expect(showErrorToast).not.toHaveBeenCalled();
  });

  it("refuses a photo over 5 MB and says why", async () => {
    Capacitor.isNativePlatform.mockReturnValue(true);
    getPhoto.mockResolvedValue({ dataUrl: "x".repeat(5 * 1024 * 1024 + 1), format: "jpeg" });
    const { attachment, takePhoto } = useFileAttachment();

    await takePhoto();

    expect(attachment.value.base64).toBeNull();
    expect(showErrorToast).toHaveBeenCalledWith(null, "resignation.photo_too_large");
  });
});
