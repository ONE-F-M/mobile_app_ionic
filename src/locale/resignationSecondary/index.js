// Secondary-language translations shown alongside English on the
// resignation-family forms, based on the logged-in employee's Nationality --
// independent of whichever app language (English/Arabic) they picked at
// login. See src/utils/nationalityLanguageMap.js for the nationality -> code
// mapping, and src/composable/useSecondaryLanguage.js for how this is
// consumed.
//
// Each file's keys are flat (e.g. "resignation.withdrawal.title") and looked
// up directly by useSecondaryLanguage() -- unlike src/locale/en|ar, these do
// NOT go through vue-i18n, so they intentionally don't use its nested-path
// convention.
import ar from "./ar";
import bn from "./bn";
import hi from "./hi";
import kri from "./kri";
import lg from "./lg";
import ne from "./ne";
import ny from "./ny";
import pcm from "./pcm";
import si from "./si";
import sw from "./sw";
import tl from "./tl";
import tw from "./tw";

export default {
  ar,
  bn,
  hi,
  kri,
  lg,
  ne,
  ny,
  pcm,
  si,
  sw,
  tl,
  tw,
};
