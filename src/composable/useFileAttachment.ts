import { ref } from 'vue';
import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

import { useCustomToast } from "@/composable/toast.js";
import { compressImageDataUrl } from "@/utils/compressImage";

export function useFileAttachment() {
  const attachment = ref({ name: null, base64: null });
  const { showErrorToast } = useCustomToast();

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
      attachment.value.base64 = isNative ? photo.dataUrl : await compressImageDataUrl(photo.dataUrl);
      attachment.value.name = `resignation-letter-${Date.now()}.${isNative ? photo.format || 'jpeg' : 'jpeg'}`;
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
