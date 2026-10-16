import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { resizeDataUrl } from "@/utils/resizeImage.js";

let imageSize;
let canvas;
let context;

class FakeImage {
  set src(value) {
    this._src = value;
    this.width = imageSize.width;
    this.height = imageSize.height;
    // Fire onload asynchronously, like a real image.
    Promise.resolve().then(() => this.onload && this.onload());
  }
}

describe("resizeDataUrl", () => {
  beforeEach(() => {
    context = { drawImage: vi.fn() };
    canvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => context),
      toDataURL: vi.fn(() => "data:image/jpeg;base64,RESIZED"),
    };

    vi.stubGlobal("Image", FakeImage);
    vi.stubGlobal("document", { createElement: vi.fn(() => canvas) });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("scales a landscape image so the long side is the limit", async () => {
    imageSize = { width: 4000, height: 3000 };

    const result = await resizeDataUrl("data:image/png;base64,ORIGINAL");

    expect(canvas.width).toBe(1600);
    expect(canvas.height).toBe(1200);
    expect(context.drawImage).toHaveBeenCalled();
    expect(canvas.toDataURL).toHaveBeenCalledWith("image/jpeg", 0.8);
    expect(result).toBe("data:image/jpeg;base64,RESIZED");
  });

  it("scales a portrait image by its height", async () => {
    imageSize = { width: 3000, height: 6000 };

    await resizeDataUrl("data:image/png;base64,ORIGINAL", 1000);

    expect(canvas.width).toBe(500);
    expect(canvas.height).toBe(1000);
  });

  it("returns an image already within the limit unchanged", async () => {
    imageSize = { width: 800, height: 1600 };

    const result = await resizeDataUrl("data:image/png;base64,ORIGINAL");

    expect(result).toBe("data:image/png;base64,ORIGINAL");
    expect(canvas.toDataURL).not.toHaveBeenCalled();
  });
});
