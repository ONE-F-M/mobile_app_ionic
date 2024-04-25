import dayjs from "dayjs";

export default function useDateHelper() {
  const formatDate = (inputDateStr: string = "", format = "YYYY-MM-D") => {
    const formattedDate = dayjs(inputDateStr);

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