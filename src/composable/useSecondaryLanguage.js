import { computed, onMounted } from "vue";
import { useUserStore } from "@/store/user";
import profile from "@/api/profile";
import { getSecondaryLanguageCode } from "@/utils/nationalityLanguageMap";
import resignationSecondary from "@/locale/resignationSecondary";

// Shows a second, nationality-based translation underneath the English
// label on the resignation-family forms -- independent of the app's own
// English/Arabic language setting. E.g. a Kenyan employee sees "Resignation
// Initiation Date" with the Swahili translation directly below it, no
// matter which app language they picked at login.
export function useSecondaryLanguage() {
  const userStore = useUserStore();

  const ensureNationality = async () => {
    if (userStore.nationality || !userStore.user?.employee_id) return;
    try {
      const { data } = await profile.getUserProfile({
        employee_id: userStore.user.employee_id,
      });
      if (data?.message?.Nationality) {
        userStore.setNationality(data.message.Nationality);
      }
    } catch {
      // Silent failure -- the secondary-language line is a helpful extra,
      // not something that should block or error out the resignation flow.
    }
  };

  onMounted(ensureNationality);

  const secondaryLangCode = computed(() =>
    getSecondaryLanguageCode(userStore.nationality)
  );

  const secondaryText = (key) => {
    const code = secondaryLangCode.value;
    if (!code) return null;
    return resignationSecondary[code]?.[key] || null;
  };

  // For non-template contexts (alerts, toasts) where BilingualText can't be
  // used directly -- pairs already-resolved primary text with its secondary
  // line. Ionic's alert here doesn't render HTML in header/message (no
  // innerHTMLTemplatesEnabled), so a <br> just shows as literal text -- and
  // plain alert markup has no white-space: pre-line either, so a real
  // newline would just silently collapse. Joined on one line instead, same
  // as bilingualInline.
  const bilingual = (primaryText, key, separator = " / ") => {
    const secondary = secondaryText(key);
    return secondary ? `${primaryText}${separator}${secondary}` : primaryText;
  };

  const bilingualInline = bilingual;

  return { secondaryLangCode, secondaryText, bilingual, bilingualInline };
}
