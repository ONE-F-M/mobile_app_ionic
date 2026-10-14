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
const { showErrorToast } = vi.hoisted(() => ({ showErrorToast: vi.fn() }));

vi.mock("@/utils/compressImage", () => ({ compressImageDataUrl: vi.fn() }));
vi.mock("@/composable/toast.js", () => ({ useCustomToast: () => ({ showErrorToast }) }));
vi.mock("vue-i18n", () => ({ useI18n: () => ({ t: (key) => key }) }));

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

  it("uploads the original photo when the browser cannot redraw it", async () => {
    Capacitor.isNativePlatform.mockReturnValue(false);
    Camera.getPhoto.mockResolvedValue({ dataUrl: "data:image/heic;base64,ORIGINAL", format: "heic" });
    compressImageDataUrl.mockRejectedValue(new Error("Could not read the photo"));
    const { attachment, takePhoto } = useFileAttachment();

    await takePhoto();

    expect(attachment.value.base64).toBe("data:image/heic;base64,ORIGINAL");
    expect(attachment.value.name).toMatch(/\.heic$/);
    expect(showErrorToast).not.toHaveBeenCalled();
  });

  it("refuses a photo over 5 MB and says why", async () => {
    Capacitor.isNativePlatform.mockReturnValue(true);
    Camera.getPhoto.mockResolvedValue({ dataUrl: "x".repeat(5 * 1024 * 1024 + 1), format: "jpeg" });
    const { attachment, takePhoto } = useFileAttachment();

    await takePhoto();

    expect(attachment.value.base64).toBeNull();
    expect(showErrorToast).toHaveBeenCalledWith(null, "resignation.photo_too_large");
  });
});
