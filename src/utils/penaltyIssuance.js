import dayjs from "dayjs";

// value is the Penalty Issuance.penalty_category option; the DocType spells it "Accomodation".
export const PENALTY_CATEGORIES = [
  { key: "performance", value: "Performance" },
  { key: "accommodation", value: "Accomodation" },
  { key: "transportation", value: "Transportation" },
];

export const EMPLOYEE_SEARCH_MIN_CHARS = 3;
// The desk form refuses penalties older than this.
export const MAX_DAYS_BACK = 10;

/** One employee and one penalty type per issuance. */
export const blankPenaltyForm = () => ({
  penalty_category: PENALTY_CATEGORIES[0].value,
  penalty_occurence_time: "",
  penalty_location: "",
  employee: null,
  penalty_type: "",
  exact_notes: "",
  attachment: null,
  third_party_damage: false,
});

/** The Employee link value: search rows carry the record name plus the badge employee_id. */
export const employeeKey = (employee) => employee.name || employee.employee_id;

/** Field -> i18n key of the first problem found. Order matches the form, top to bottom. */
export const validatePenaltyForm = (form, now = dayjs()) => {
  const errors = {};
  const occurred = form.penalty_occurence_time ? dayjs(form.penalty_occurence_time) : null;

  if (!occurred || !occurred.isValid()) {
    errors.penalty_occurence_time = "penalty.errors.occurrence_required";
  } else if (occurred.isAfter(now)) {
    errors.penalty_occurence_time = "penalty.errors.occurrence_future";
  } else if (occurred.isBefore(now.subtract(MAX_DAYS_BACK, "day"))) {
    errors.penalty_occurence_time = "penalty.errors.occurrence_too_old";
  }
  if (!form.penalty_location?.trim()) errors.penalty_location = "penalty.errors.location_required";
  if (!form.employee) errors.employee = "penalty.errors.employee_required";
  if (!form.penalty_type) errors.penalty_type = "penalty.errors.penalty_type_required";

  return errors;
};

/** Body for submit_penalty_issuance. */
export const buildPenaltyPayload = (form) => ({
  penalty_category: form.penalty_category,
  penalty_occurence_time: dayjs(form.penalty_occurence_time).format("YYYY-MM-DD HH:mm:ss"),
  penalty_location: form.penalty_location.trim(),
  employee: employeeKey(form.employee),
  penalty_type: form.penalty_type,
  exact_notes: form.exact_notes?.trim() || "",
  third_party_damage: form.third_party_damage ? 1 : 0,
  ...(form.attachment
    ? {
        attachment: {
          attachment_name: form.attachment.name,
          // Base64 without the data-URL prefix, which is what the server decodes.
          attachment: form.attachment.dataUrl.split(",")[1],
        },
      }
    : {}),
});
