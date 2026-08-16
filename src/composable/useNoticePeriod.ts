import { alertController } from "@ionic/vue";

const NOTICE_PERIOD_DAYS = 90;
import { useCustomToast } from "@/composable/toast.js";
import { useI18n } from "vue-i18n";
import { useConfirmAlert } from "@/composable/useConfirmAlert.ts";
import { useSecondaryLanguage } from "@/composable/useSecondaryLanguage";

export const useNoticePeriod = () => {
  const { showErrorToast } = useCustomToast();
  const { t } = useI18n();
  const { showConfirm } = useConfirmAlert();
  const { bilingual, bilingualInline } = useSecondaryLanguage();

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
      showErrorToast(bilingualInline(
        t('resignation.validation.relieving_before_initiation', 'Relieving date cannot be before initiation date'),
        'resignation.validation.relieving_before_initiation'
      ));
      return false;
    }

    if (diffDays < NOTICE_PERIOD_DAYS) {
      const isConfirmed = await showConfirm(
        bilingual(t('resignation.notice_period_header', 'Notice Period'), 'resignation.notice_period_header'),
        bilingual(t('resignation.notice_period_warning', 'The requested relieving date does not satisfy the 90 days notice period policy. If approved, the unserved notice period days will be recovered from your final settlement.'), 'resignation.notice_period_warning'),
        bilingualInline(t('resignation.action.acknowledge', 'Acknowledge & Proceed'), 'resignation.action.acknowledge'),
        bilingualInline(t('resignation.action.cancel', 'Cancel'), 'resignation.action.cancel'),
        "custom-alert-danger"
      );
      const role = isConfirmed ? "confirm" : "cancel";
      
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
