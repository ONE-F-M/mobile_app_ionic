const READEX_ROBOTO = "family=Readex+Pro:wght@160..700&family=Roboto:ital,wght@0,400;0,500;0,700;1,400;1,500;1,700";

export const FONT_URLS = {
  en: `https://fonts.googleapis.com/css2?family=Inter:wght@100..900&${READEX_ROBOTO}&display=swap`,
  ar: `https://fonts.googleapis.com/css2?family=Cairo:wght@200..1000&${READEX_ROBOTO}&display=swap`,
};

export const loadLocaleFonts = (langs) => {
  langs.forEach((lang) => {
    if (document.head.querySelector(`link[data-locale-font="${lang}"]`)) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = FONT_URLS[lang];
    link.dataset.localeFont = lang;
    document.head.appendChild(link);
  });
};
