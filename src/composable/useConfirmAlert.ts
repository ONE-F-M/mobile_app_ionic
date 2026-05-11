import { alertController } from "@ionic/vue";

export function useConfirmAlert() {
  /**
   * Show a confirmation alert and return true if user confirmed, false if cancelled.
   */
  const showConfirm = async (header, message, confirmText = "Proceed", cancelText = "Cancel", cssClass = "bright-md3-alert") => {
    const alert = await alertController.create({
      header,
      message,
      cssClass,
      backdropDismiss: false,
      buttons: [
        { text: cancelText, role: "cancel" },
        { text: confirmText, role: "confirm" },
      ],
    });
    await alert.present();
    const { role } = await alert.onDidDismiss();
    return role === "confirm";
  };

  /**
   * Show a single-button acknowledgement alert (no cancel option).
   */
  const showAcknowledge = async (header, message, buttonText = "Acknowledge", cssClass = "bright-md3-alert") => {
    const alert = await alertController.create({
      header,
      message,
      cssClass,
      backdropDismiss: false,
      buttons: [{ text: buttonText, role: "confirm" }],
    });
    await alert.present();
    await alert.onDidDismiss();
  };

  return { showConfirm, showAcknowledge };
}
