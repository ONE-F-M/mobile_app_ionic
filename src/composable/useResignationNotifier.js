import { useI18n } from "vue-i18n";
import { Haptics, NotificationType } from "@capacitor/haptics";
import { useUserStore } from "@/store/user";
import { useResignationStore } from "@/store/resignation.ts";
import { useConfirmAlert } from "@/composable/useConfirmAlert.ts";
import { useSecondaryLanguage } from "@/composable/useSecondaryLanguage";
import { playNotificationSound } from "@/utils/notificationSound";

// States the employee needs to know about right away -- either they owe an
// action (a supervisor-requested date correction) or it's a final outcome
// (approved). Purely internal routing between approvers isn't included here,
// since the employee has nothing to do about those.
const RESIGNATION_NOTICES = {
  "Pending Relieving Date Correction": {
    titleKey: "resignation.notify.correction_requested_title",
    titleFallback: "Date Change Requested",
    msgKey: "resignation.notify.correction_requested_msg",
    msgFallback: "Your supervisor has requested a correction to your resignation dates.",
  },
  "Approved": {
    titleKey: "resignation.notify.approved_title",
    titleFallback: "Resignation Approved",
    msgKey: "resignation.notify.approved_msg",
    msgFallback: "Your resignation has been approved.",
  },
};

const WITHDRAWAL_NOTICES = {
  "Approved": {
    titleKey: "resignation.notify.withdrawal_approved_title",
    titleFallback: "Withdrawal Approved",
    msgKey: "resignation.notify.withdrawal_approved_msg",
    msgFallback: "Your resignation withdrawal has been approved.",
  },
  "Rejected": {
    titleKey: "resignation.notify.withdrawal_rejected_title",
    titleFallback: "Withdrawal Rejected",
    msgKey: "resignation.notify.withdrawal_rejected_msg",
    msgFallback: "Your resignation withdrawal request has been rejected.",
  },
};

const EXTENSION_NOTICES = {
  "Approved": {
    titleKey: "resignation.notify.extension_approved_title",
    titleFallback: "Extension Approved",
    msgKey: "resignation.notify.extension_approved_msg",
    msgFallback: "Your resignation date extension has been approved.",
  },
};

// Covers a resignation appearing where there wasn't one before -- whether
// the employee created it themselves elsewhere, or someone else (HR, a
// supervisor) entered it directly in ERPNext on their behalf. Either way,
// the employee otherwise has no way to know it exists until they happen to
// open the app and look, so this is the one case checked regardless of
// which specific state it landed in.
const NEW_RESIGNATION_NOTICE = {
  titleKey: "resignation.notify.new_resignation_title",
  titleFallback: "Resignation On File",
  msgKey: "resignation.notify.new_resignation_msg",
  msgFallback: "A resignation has been recorded for you. Open Employee Resignation to review the details.",
};

export function useResignationNotifier() {
  const userStore = useUserStore();
  const resignationStore = useResignationStore();
  const { t } = useI18n();
  const { showAcknowledge } = useConfirmAlert();
  const { bilingual, bilingualInline } = useSecondaryLanguage();

  const showNotice = async (notice) => {
    playNotificationSound();
    Haptics.notification({ type: NotificationType.Success }).catch(() => {});

    await showAcknowledge(
      bilingual(t(notice.titleKey, notice.titleFallback), notice.titleKey),
      bilingual(t(notice.msgKey, notice.msgFallback), notice.msgKey),
      bilingualInline(t("resignation.acknowledge", "Acknowledge"), "resignation.acknowledge")
    );
  };

  const checkForUpdates = async () => {
    if (!userStore.user?.employee_id || !userStore.token) return;

    const hadFetchedBefore = resignationStore.hasFetchedOnce;
    const previous = {
      name: resignationStore.activeResignation?.name,
      workflow_state: resignationStore.activeResignation?.workflow_state,
      withdrawal_state: resignationStore.activeResignation?.withdrawal_state,
      extension_state: resignationStore.activeResignation?.extension_state,
    };

    await resignationStore.fetchActiveResignation();

    const current = resignationStore.activeResignation;
    if (!current) return;

    // First time this device has ever confirmed a baseline -- nothing to
    // compare against yet, so don't notify. Without this, a fresh
    // install/login would always look like "a resignation just appeared"
    // even for one that's been on file for weeks.
    if (!hadFetchedBefore) return;

    const notices = [];
    if (current.name !== previous.name) {
      notices.push(NEW_RESIGNATION_NOTICE);
    } else if (current.workflow_state !== previous.workflow_state) {
      const notice = RESIGNATION_NOTICES[current.workflow_state];
      if (notice) notices.push(notice);
    }

    if (current.withdrawal_state !== previous.withdrawal_state) {
      const notice = WITHDRAWAL_NOTICES[current.withdrawal_state];
      if (notice) notices.push(notice);
    }
    if (current.extension_state !== previous.extension_state) {
      const notice = EXTENSION_NOTICES[current.extension_state];
      if (notice) notices.push(notice);
    }

    for (const notice of notices) {
      await showNotice(notice);
    }
  };

  return { checkForUpdates };
}
