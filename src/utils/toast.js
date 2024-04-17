import { toastController } from "@ionic/vue";
import {
  closeOutline,
  checkmarkOutline
} from "ionicons/icons";

const commonConfig = {
  position: "top",
  duration: 2000,
  color: "medium",
  buttons: [{ icon: closeOutline, role: "cancel" }]
}

export const showErrorToast = async (t, message) => {
  const errorToast = await toastController.create({
    cssClass: "toast-error",
    header: t("utils.toast.error"),
    message,
    ...commonConfig,
    icon: closeOutline
  });

  return await errorToast.present();
}

export const showSuccessToast = async (t, message) => {
  const successToast = await toastController.create({
    cssClass: "toast-success",
    header: t("utils.toast.success"),
    message,
    ...commonConfig,
    icon: checkmarkOutline
  });

  return await successToast.present();
}
