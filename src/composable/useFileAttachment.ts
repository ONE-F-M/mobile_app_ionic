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
        width: 1600,
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

  /**
   * Generic native picker: camera, gallery or the system prompt, depending on source.
   * Resolves { name, dataUrl } or null when the user cancels or the picker fails.
   */
  const pickPhoto = async (prefix, source = CameraSource.Prompt) => {
    try {
      const photo = await Camera.getPhoto({
        source,
        resultType: CameraResultType.DataUrl,
        quality: 80,
        width: 1600,
      });
      return {
        name: `${prefix}-${Date.now()}.${photo.format || 'jpeg'}`,
        dataUrl: photo.dataUrl,
      };
    } catch (error) {
      // User backed out of the picker -- not an error worth surfacing.
      if (error?.message?.toLowerCase().includes('cancel')) return null;
      showErrorToast(null, "Unable to take photo. Please try again.");
      return null;
    }
  };

  const clearAttachment = () => {
    attachment.value.name = null;
    attachment.value.base64 = null;
  };

  return {
    attachment,
    takePhoto,
    pickPhoto,
    clearAttachment
  };
}
