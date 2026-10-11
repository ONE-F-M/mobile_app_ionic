import { beforeEach, describe, expect, it, vi } from "vitest";
import { Capacitor } from "@capacitor/core";
import { Camera } from "@capacitor/camera";
import { compressImageDataUrl } from "@/utils/compressImage";
import { useFileAttachment } from "@/composable/useFileAttachment";

vi.mock("@capacitor/core", () => ({ Capacitor: { isNativePlatform: vi.fn() } }));
vi.mock("@capacitor/camera", () => ({
  Camera: { getPhoto: vi.fn() },
  CameraResultType: { DataUrl: "dataUrl" },
  CameraSource: { Camera: "CAMERA" },
}));
vi.mock("@/utils/compressImage", () => ({ compressImageDataUrl: vi.fn() }));
vi.mock("@/composable/toast.js", () => ({ useCustomToast: () => ({ showErrorToast: vi.fn() }) }));

describe("useFileAttachment.takePhoto", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Camera.getPhoto.mockResolvedValue({ dataUrl: "data:image/png;base64,ORIGINAL", format: "png" });
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
});
