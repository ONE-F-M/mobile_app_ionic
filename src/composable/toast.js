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
    // 1. Start with the specific error from the backend (if any)
    let errorMessage = error;

    // 2. Determine the Title (Header)
    // If backend provided a 'message', use it. Otherwise use generic "Error!"
    const errorTitle = message ? message : t("utils.toast.error");

    // 3. Fallback Logic (Refined)
    // Only look for a status code message or generic fallback 
    // IF we have absolutely no information (no specific error AND no specific title).
    // This prevents "You are not assigned to a shift" (Title) from showing "Unexpected error" (Body).

    if (!errorMessage) {
      // If we don't have a body, but we DO have a descriptive title (like "You are not assigned..."),
      // we leave the body empty. It looks cleaner.

      // Only if the title is also missing (or is just "Error!") do we force a body text.
      if (!message || message === t("utils.toast.error") || message === "Error!") {
        errorMessage = getStatusMessage(statusCode);

        if (!errorMessage) {
          errorMessage = "An unexpected error occurred. Please check your connection.";
        }
      }
    }

    const errorToast = await toastController.create({
      cssClass: "toast-error",
      header: errorTitle,
      message: errorMessage, // If this is null, Ionic simply hides the body area
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
    if (!statusCode) return null;

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
    return null;
  };

  return {
    showErrorToast,
    showSuccessToast,
  };
};