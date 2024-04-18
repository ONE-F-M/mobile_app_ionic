import { checkmarkOutline, closeOutline } from "ionicons/icons";
import { useI18n } from "vue-i18n";
import { toastController } from "@ionic/vue";

export const useCustomToast = () => {
  const commonConfig = {
    position: "top",
    duration: 2000,
    color: "medium",
    buttons: [{ icon: closeOutline, role: "cancel" }],
  };

  const { t } = useI18n();

  const showErrorToast = async (message) => {
    const errorToast = await toastController.create({
      cssClass: "toast-error",
      header: t("utils.toast.error"),
      message,
      ...commonConfig,
      icon: closeOutline,
    });

    return await errorToast.present();
  };

  const showSuccessToast = async (message) => {
    const successToast = await toastController.create({
      cssClass: "toast-success",
      header: t("utils.toast.success"),
      message,
      ...commonConfig,
      icon: checkmarkOutline,
    });

    return await successToast.present();
  };

  return {
    showErrorToast,
    showSuccessToast,
  };
};
