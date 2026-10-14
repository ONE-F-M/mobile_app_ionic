import { ref } from 'vue';
import { useI18n } from "vue-i18n";
import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

import { useCustomToast } from "@/composable/toast.js";
import { compressImageDataUrl } from "@/utils/compressImage";

// Base64 payloads sent to the server are capped at 5 MB
const MAX_PHOTO_BASE64_LENGTH = 5 * 1024 * 1024;

export function useFileAttachment() {
  const attachment = ref({ name: null, base64: null });
  const { showErrorToast } = useCustomToast();
  const { t } = useI18n();

  const takePhoto = async () => {
    try {
      const photo = await Camera.getPhoto({
        quality: 80,
        width: 1600,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
      });
      // The web camera ignores width and quality and returns the original photo
      const isNative = Capacitor.isNativePlatform();
      // A photo the browser cannot redraw (such as HEIC) is uploaded as it was taken
      const compressed = isNative ? null : await compressImageDataUrl(photo.dataUrl).catch(() => null);
      const base64 = compressed || photo.dataUrl;
      if (base64.length > MAX_PHOTO_BASE64_LENGTH) {
        clearAttachment();
        showErrorToast(null, t("resignation.photo_too_large", "The photo is larger than 5 MB. Please take it again."));
        return;
      }
      attachment.value.base64 = base64;
      attachment.value.name = `resignation-letter-${Date.now()}.${compressed ? 'jpeg' : photo.format || 'jpeg'}`;
    } catch (error) {
      // User backed out of the camera -- not an error worth surfacing.
      if (error?.message?.toLowerCase().includes('cancel')) return;
      showErrorToast(null, "Unable to take photo. Please try again.");
    }
  };

  const clearAttachment = () => {
    attachment.value.name = null;
    attachment.value.base64 = null;
  };

  return {
    attachment,
    takePhoto,
    clearAttachment
  };
}
