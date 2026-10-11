const MAX_WIDTH = 1600;
const JPEG_QUALITY = 0.7;

// Matches the native camera's resize so browser uploads are not full-size originals
export const compressImageDataUrl = (dataUrl, maxWidth = MAX_WIDTH, quality = JPEG_QUALITY) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const scale = Math.min(1, maxWidth / image.width);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(image.width * scale);
      canvas.height = Math.round(image.height * scale);
      canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    image.onerror = () => reject(new Error("Could not read the photo"));
    image.src = dataUrl;
  });
