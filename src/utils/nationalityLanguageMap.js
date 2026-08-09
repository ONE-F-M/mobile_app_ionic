// Maps an Employee's Nationality (as stored in ERPNext) to the secondary
// language shown alongside English on the resignation-family forms.
// Nationalities not listed here (e.g. Iranian, Pakistani, "Non Kuwaiti") are
// intentionally left English-only -- either not requested, or ambiguous
// (e.g. "Non Kuwaiti" is a residency category, not an actual nationality).
export const NATIONALITY_LANGUAGE_MAP = {
  Nepali: "ne",
  Indian: "hi",
  "Sri Lankan": "si",
  Kenyan: "sw",
  Malawi: "ny",
  Ugandan: "lg",
  Bangladeshi: "bn",
  "Sierra Leonean": "kri",
  "Seirra Leonean": "kri", // matches an existing typo'd Nationality record
  Nigerian: "pcm",
  Philippine: "tl",
  Ghanaian: "tw",
  // "Arabic for all arabic" -- every Arabic-speaking nationality currently
  // in use, not just the three explicitly named.
  Kuwaiti: "ar",
  Yemeni: "ar",
  Lebanese: "ar",
  Bahraini: "ar",
  Egyptian: "ar",
  Iraqi: "ar",
  Jordanian: "ar",
  Moroccan: "ar",
  Palestinian: "ar",
  Saudi: "ar",
  Sudanese: "ar",
  Syrian: "ar",
  Tunisian: "ar",
};

export const getSecondaryLanguageCode = (nationality) =>
  NATIONALITY_LANGUAGE_MAP[nationality] || null;
