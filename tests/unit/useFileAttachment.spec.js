import { describe, it, expect, vi, beforeEach } from "vitest";

const { getPhoto, showErrorToast } = vi.hoisted(() => ({
  getPhoto: vi.fn(),
  showErrorToast: vi.fn(),
}));

vi.mock("@capacitor/camera", () => ({
  Camera: { getPhoto },
  CameraResultType: { DataUrl: "dataUrl" },
  CameraSource: { Prompt: "PROMPT", Camera: "CAMERA", Photos: "PHOTOS" },
}));

vi.mock("@/composable/toast.js", () => ({
  useCustomToast: () => ({ showErrorToast }),
}));

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
