import { ref } from 'vue';

import { useCustomToast } from "@/composable/toast.js";

export function useFileAttachment() {
  const fileInput = ref(null);
  const attachment = ref({ name: null, base64: null });
  const maxFileSize = 5 * 1024 * 1024; // 5MB
  const { showErrorToast } = useCustomToast();

  const onFileUpload = async (event) => {
    const uploadFile = event.target.files[0];
    if (!uploadFile) return;

    if (uploadFile.size > maxFileSize) {
      showErrorToast("File size exceeds 5MB limit.");
      if (fileInput.value) fileInput.value.value = null;
      return;
    }

    const base64Data = await toBase64(uploadFile);
    attachment.value.name = uploadFile.name;
    attachment.value.base64 = base64Data;
  };

  const toBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });

  const triggerFileUpload = () => {
    if (fileInput.value) {
      fileInput.value.click();
    }
  };

  const clearAttachment = () => {
    attachment.value.name = null;
    attachment.value.base64 = null;
    if (fileInput.value) {
      fileInput.value.value = null;
    }
  };

  return {
    fileInput,
    attachment,
    onFileUpload,
    triggerFileUpload,
    clearAttachment
  };
}
