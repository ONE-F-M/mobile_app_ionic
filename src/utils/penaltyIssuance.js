import dayjs from "dayjs";

// value is the Penalty Issuance.penalty_category option; the DocType spells it "Accomodation".
export const PENALTY_CATEGORIES = [
  { key: "performance", value: "Performance" },
  { key: "accommodation", value: "Accomodation" },
  { key: "transportation", value: "Transportation" },
];

export const PERFORMANCE = "Performance";
export const EMPLOYEE_SEARCH_MIN_CHARS = 3;
// The desk form refuses penalties older than this.
export const MAX_DAYS_BACK = 10;

export const SITE_FIELDS = ["shift", "site", "project", "site_location"];

export const blankPenaltyForm = () => ({
  penalty_category: PERFORMANCE,
  penalty_occurence_time: "",
  penalty_location: "",
  shift: "",
  site: "",
  project: "",
  site_location: "",
  third_party_damage: false,
  employees: [],
  violations: [],
});

/** Switch category; site fields only belong to Performance, so they are dropped on any other. */
export const setCategory = (form, category) => {
  form.penalty_category = category;
  if (category !== PERFORMANCE) SITE_FIELDS.forEach((field) => (form[field] = ""));
};

/** The Employee link value: search rows carry the record name plus the badge employee_id. */
export const employeeKey = (employee) => employee.name || employee.employee_id;

export const hasEmployee = (form, employee) =>
  form.employees.some((row) => employeeKey(row) === employeeKey(employee));

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
  if (form.penalty_category === PERFORMANCE && !form.shift) {
    errors.shift = "penalty.errors.shift_required";
  }
  if (!form.employees.length) errors.employees = "penalty.errors.employees_required";
  if (!form.violations.length) errors.violations = "penalty.errors.violations_required";

  return errors;
};

/** Body for submit_penalty_issuance, using the Penalty Issuance fieldnames. */
export const buildPenaltyPayload = (form) => {
  const isPerformance = form.penalty_category === PERFORMANCE;

  return {
    penalty_category: form.penalty_category,
    penalty_occurence_time: dayjs(form.penalty_occurence_time).format("YYYY-MM-DD HH:mm:ss"),
    penalty_location: form.penalty_location.trim(),
    ...(isPerformance
      ? Object.fromEntries(SITE_FIELDS.map((field) => [field, form[field] || null]))
      : {}),
    third_party_damage: form.third_party_damage ? 1 : 0,
    employees: form.employees.map((row) => ({ employee_id: employeeKey(row) })),
    penalty_issuance_details: form.violations.map((row) => ({
      penalty_type: row.penalty_type,
      exact_notes: row.exact_notes?.trim() || "",
      ...(row.attachment
        ? {
            attachments: {
              attachment_name: row.attachment.name,
              // Base64 without the data-URL prefix, which is what the server decodes.
              attachment: row.attachment.dataUrl.split(",")[1],
            },
          }
        : {}),
    })),
  };
};
