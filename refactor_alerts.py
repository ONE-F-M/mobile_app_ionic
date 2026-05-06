import os, re

files = [
    "src/views/resignation/ExtensionCreatePage.vue",
    "src/views/resignation/WithdrawalCreatePage.vue",
    "src/views/resignation/ResignationCorrectionPage.vue",
    "src/composable/useNoticePeriod.ts"
]

for file in files:
    if os.path.exists(file):
        with open(file, 'r') as f:
            content = f.read()

        # Add useConfirmAlert import
        if "useConfirmAlert" not in content:
            if file.endswith('.vue'):
                content = content.replace('import { useI18n } from "vue-i18n";', 'import { useI18n } from "vue-i18n";\nimport { useConfirmAlert } from "@/composable/useConfirmAlert.ts";')
                content = content.replace('const { t } = useI18n();', 'const { t } = useI18n();\nconst { showAcknowledge } = useConfirmAlert();')
            else:
                content = content.replace('import { useI18n } from "vue-i18n";', 'import { useI18n } from "vue-i18n";\nimport { useConfirmAlert } from "@/composable/useConfirmAlert.ts";')
                content = content.replace('const { t } = useI18n();', 'const { t } = useI18n();\n  const { showConfirm } = useConfirmAlert();')

        # Replace alert logic in Vue files (showAcknowledge)
        if "alertController.create({" in content and file.endswith('.vue'):
            if "ResignationCorrectionPage" in file:
                alert_block = r"const alert = await alertController\.create\(\{.*?await alert\.present\(\);"
                new_block = """await showAcknowledge(
      t('resignation.correction_success_title', 'Correction Submitted'),
      t('resignation.correction_success_msg', 'Employee resignation corrected successfully. Please submit the updated signed resignation letter to the Camp Boss.'),
      t('resignation.acknowledge', 'Acknowledge')
    );
    clearForm();
    triggerBack();"""
                content = re.sub(alert_block, new_block, content, flags=re.DOTALL)
            elif "Extension" in file:
                alert_block = r"const alert = await alertController\.create\(\{.*?await alert\.present\(\);"
                new_block = """await showAcknowledge(
      t('resignation.extension_success_title', 'Extension Submitted'),
      t('resignation.extension_success_msg', 'Resignation extension has been submitted successfully.'),
      t('resignation.acknowledge', 'Acknowledge')
    );
    clearForm();
    triggerBack();"""
                content = re.sub(alert_block, new_block, content, flags=re.DOTALL)
            elif "Withdrawal" in file:
                alert_block = r"const alert = await alertController\.create\(\{.*?await alert\.present\(\);"
                new_block = """await showAcknowledge(
      t('resignation.withdrawal_success_title', 'Withdrawal Submitted'),
      t('resignation.withdrawal_success_msg', 'Resignation withdrawal has been submitted successfully.'),
      t('resignation.acknowledge', 'Acknowledge')
    );
    clearForm();
    triggerBack();"""
                content = re.sub(alert_block, new_block, content, flags=re.DOTALL)

        # Replace alert logic in Notice Period (showConfirm)
        if "alertController.create({" in content and not file.endswith('.vue'):
            alert_block = r"const alert = await alertController\.create\(\{.*?const \{ role \} = await alert\.onDidDismiss\(\);"
            new_block = """const isConfirmed = await showConfirm(
        t('resignation.notice_period_header', 'Notice Period'),
        t('resignation.notice_period_warning', 'The requested relieving date does not satisfy the 90 days notice period policy. If approved, the unserved notice period days will be recovered from your final settlement.'),
        t('resignation.action.acknowledge', 'Acknowledge & Proceed'),
        t('resignation.action.cancel', 'Cancel'),
        "custom-alert-danger"
      );
      const role = isConfirmed ? "confirm" : "cancel";"""
            content = re.sub(alert_block, new_block, content, flags=re.DOTALL)

        with open(file, 'w') as f:
            f.write(content)
