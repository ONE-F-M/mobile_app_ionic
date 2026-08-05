import { ref } from 'vue';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

import { useCustomToast } from "@/composable/toast.js";

export function useFileAttachment() {
  const attachment = ref({ name: null, base64: null });
  const { showErrorToast } = useCustomToast();

  const takePhoto = async () => {
    try {
      const photo = await Camera.getPhoto({
        quality: 80,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
      });
      attachment.value.base64 = photo.dataUrl;
      attachment.value.name = `resignation-letter-${Date.now()}.${photo.format || 'jpeg'}`;
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
