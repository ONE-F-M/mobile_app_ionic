import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { compressImageDataUrl } from "@/utils/compressImage";

let imageSize = { width: 0, height: 0, fail: false };
let canvas;

class FakeImage {
  set src(_value) {
    this.width = imageSize.width;
    this.height = imageSize.height;
    queueMicrotask(() => (imageSize.fail ? this.onerror() : this.onload()));
  }
}

describe("compressImageDataUrl", () => {
  beforeEach(() => {
    vi.stubGlobal("Image", FakeImage);
    canvas = {
      width: 0,
      height: 0,
      drawImage: vi.fn(),
      getContext: vi.fn(() => ({ drawImage: canvas.drawImage })),
      toDataURL: vi.fn(() => "data:image/jpeg;base64,COMPRESSED"),
    };
    const createElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag) => (tag === "canvas" ? canvas : createElement(tag)));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("scales a large phone photo down to 1600px wide as a 70% JPEG", async () => {
    imageSize = { width: 4000, height: 3000, fail: false };

    const result = await compressImageDataUrl("data:image/jpeg;base64,ORIGINAL");

    expect([canvas.width, canvas.height]).toEqual([1600, 1200]);
    expect(canvas.toDataURL).toHaveBeenCalledWith("image/jpeg", 0.7);
    expect(result).toBe("data:image/jpeg;base64,COMPRESSED");
  });

  it("does not enlarge a photo that is already small", async () => {
    imageSize = { width: 800, height: 600, fail: false };

    await compressImageDataUrl("data:image/jpeg;base64,SMALL");

    expect([canvas.width, canvas.height]).toEqual([800, 600]);
  });

  it("rejects when the photo cannot be read", async () => {
    imageSize = { width: 0, height: 0, fail: true };

    await expect(compressImageDataUrl("data:image/jpeg;base64,BROKEN")).rejects.toThrow("Could not read the photo");
  });
});
