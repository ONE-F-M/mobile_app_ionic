import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@capacitor/filesystem", () => ({
  Filesystem: {
    writeFile: vi.fn(),
    getUri: vi.fn(),
  },
  Directory: { Cache: "CACHE", Documents: "DOCUMENTS" },
}));

vi.mock("@capacitor-community/file-opener", () => ({
  FileOpener: { open: vi.fn() },
}));

import { Filesystem } from "@capacitor/filesystem";
import { FileOpener } from "@capacitor-community/file-opener";
import { mimeTypeFor, openOnDevice } from "@/utils/proofFile";

describe("mimeTypeFor", () => {
  it("maps pdf", () => {
    expect(mimeTypeFor("proof.pdf")).toBe("application/pdf");
  });

  it("is case-insensitive for JPG", () => {
    expect(mimeTypeFor("photo.JPG")).toBe("image/jpeg");
  });

  it("maps png", () => {
    expect(mimeTypeFor("scan.png")).toBe("image/png");
  });

  it("falls back to octet-stream for unknown extensions", () => {
    expect(mimeTypeFor("archive.xyz")).toBe("application/octet-stream");
  });
});

describe("openOnDevice", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Filesystem.writeFile.mockResolvedValue({});
    Filesystem.getUri.mockResolvedValue({ uri: "file:///cache/proof.pdf" });
    FileOpener.open.mockResolvedValue(undefined);
  });

  it("writes to the cache directory and opens the uri with the right content type", async () => {
    await openOnDevice("proof.pdf", "QUJD");

    expect(Filesystem.writeFile).toHaveBeenCalledWith({
      path: "proof.pdf",
      data: "QUJD",
      directory: "CACHE",
    });
    expect(Filesystem.getUri).toHaveBeenCalledWith({
      path: "proof.pdf",
      directory: "CACHE",
    });
    expect(FileOpener.open).toHaveBeenCalledWith({
      filePath: "file:///cache/proof.pdf",
      contentType: "application/pdf",
    });
  });

  it("throws the FileOpener error to the caller", async () => {
    const error = new Error("No app can open this file");
    FileOpener.open.mockRejectedValue(error);

    await expect(openOnDevice("proof.pdf", "QUJD")).rejects.toBe(error);
  });
});
