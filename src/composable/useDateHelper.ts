import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useLangStore } from "../store/lang";

dayjs.extend(relativeTime);
export default function useDateHelper() {
  const langStore = useLangStore();

  const formatDate = (inputDateStr: string = "", format = "YYYY-MM-D") => {
    const formattedDate = dayjs(inputDateStr).locale(langStore.lang);

    if (formattedDate.isValid()) {
      return formattedDate.format(format);
    }

    return null;
  };

  return {
    dayjs,
    formatDate,
  };
}
