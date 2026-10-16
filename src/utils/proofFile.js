import { Filesystem, Directory } from "@capacitor/filesystem";
import { FileOpener } from "@capacitor-community/file-opener";

const MIME_TYPES = {
  pdf: "application/pdf",
  txt: "text/plain",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  png: "image/png",
};

export const mimeTypeFor = (name) => {
  const extension = String(name ?? "").split(".").pop().toLowerCase();
  return MIME_TYPES[extension] || "application/octet-stream";
};

export const openOnDevice = async (name, base64) => {
  await Filesystem.writeFile({
    path: name,
    data: base64,
    directory: Directory.Cache,
  });
  const { uri } = await Filesystem.getUri({
    path: name,
    directory: Directory.Cache,
  });
  await FileOpener.open({ filePath: uri, contentType: mimeTypeFor(name) });
};
