import { alertController } from "@ionic/vue";

const NOTICE_PERIOD_DAYS = 90;
import { useCustomToast } from "@/composable/toast.js";
import { useI18n } from "vue-i18n";

export const useNoticePeriod = () => {
  const { showErrorToast } = useCustomToast();
  const { t } = useI18n();

  /**
   * Validates the notice period between initiation and relieving date.
   * Returns true if valid/acknowledged, false if rejected/invalid.
   */
  const checkNoticePeriod = async (initDateStr, relDateStr) => {
    if (!initDateStr || !relDateStr) return false;
    
    const init = new Date(initDateStr);
    const rel = new Date(relDateStr);
    const diffTime = rel.getTime() - init.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      showErrorToast(t('resignation.validation.relieving_before_initiation', 'Relieving date cannot be before initiation date'));
      return false;
    }

    if (diffDays < NOTICE_PERIOD_DAYS) {
      const alert = await alertController.create({
        header: t('resignation.notice_period_header', 'Notice Period'),
        message: t('resignation.notice_period_warning', 'The requested relieving date does not satisfy the 90 days notice period policy. If approved, the unserved notice period days will be recovered from your final settlement.'),
        buttons: [
          { text: t('resignation.action.cancel', 'Cancel'), role: "cancel" },
          { text: t('resignation.action.acknowledge', 'Acknowledge & Proceed'), role: "confirm" }
        ],
        cssClass: "custom-alert-danger",
      });
      await alert.present();
      const { role } = await alert.onDidDismiss();
      
      if (role !== "confirm") {
        return false;
      }
    }

    return true;
  };

  return {
    checkNoticePeriod
  };
};
