/**
 * Scale an image data URL down so its long side is at most maxSide pixels.
 * Returns a JPEG data URL (quality 0.8). An image already within the limit is
 * returned unchanged.
 */
export function resizeDataUrl(dataUrl, maxSide = 1600) {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      const width = img.naturalWidth || img.width;
      const height = img.naturalHeight || img.height;
      const longSide = Math.max(width, height);

      if (longSide <= maxSide) {
        resolve(dataUrl);
        return;
      }

      const scale = maxSide / longSide;
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);

      const context = canvas.getContext("2d");
      context.drawImage(img, 0, 0, canvas.width, canvas.height);

      resolve(canvas.toDataURL("image/jpeg", 0.8));
    };

    img.onerror = () => reject(new Error("Unable to load image for resizing"));
    img.src = dataUrl;
  });
}
