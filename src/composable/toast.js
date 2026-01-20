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

  const showErrorToast = async (message, error, statusCode) => {
    const errorMessage = error ? error : getStatusMessage(statusCode);
    const errorTitle = message ? message : t("utils.toast.error");

    const errorToast = await toastController.create({
      cssClass: "toast-error",
      header: errorTitle,
      message: errorMessage,
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

  const getStatusMessage = (statusCode) => {
    if (statusCode >= 100 && statusCode < 200) {
      return "Informational response received.";
    } else if (statusCode >= 200 && statusCode < 300) {
      return "Success, but no detailed message provided.";
    } else if (statusCode >= 300 && statusCode < 400) {
      return "Redirection detected. Additional action needed.";
    } else if (statusCode >= 400 && statusCode < 500) {
      return "Client error occurred. Please check your request.";
    } else if (statusCode >= 500 && statusCode < 600) {
      return "Server error occurred. Please try again later.";
    }
  };

  return {
    showErrorToast,
    showSuccessToast,
  };
};
