import dayjs from "dayjs";
import { describe, expect, it } from "vitest";
import {
  PENALTY_CATEGORIES,
  blankPenaltyForm,
  buildPenaltyPayload,
  hasEmployee,
  setCategory,
  validatePenaltyForm,
} from "@/utils/penaltyIssuance";

const NOW = dayjs("2026-11-12T12:00:00");

const filledForm = () => ({
  ...blankPenaltyForm(),
  penalty_occurence_time: "2026-11-12T09:30",
  penalty_location: "  Gate 3 ",
  shift: "SHIFT-1",
  site: "SITE-1",
  project: "PRJ-1",
  site_location: "Kuwait City",
  employees: [
    { name: "HR-EMP-00001", employee_id: "1301001KW", employee_name: "A", designation: "Guard" },
  ],
  violations: [
    {
      penalty_type: "Late",
      penalty_type_arabic: "تأخير",
      exact_notes: " came late ",
      attachment: { name: "p.png", dataUrl: "data:image/png;base64,AAAA" },
    },
    { penalty_type: "Absent", exact_notes: "", attachment: null },
  ],
});

describe("penalty categories", () => {
  it("maps Accommodation to the DocType spelling", () => {
    expect(PENALTY_CATEGORIES.map((c) => c.value)).toEqual([
      "Performance",
      "Accomodation",
      "Transportation",
    ]);
  });

  it("clears the site fields when leaving Performance", () => {
    const form = filledForm();
    setCategory(form, "Accomodation");
    expect(form.penalty_category).toBe("Accomodation");
    expect([form.shift, form.site, form.project, form.site_location]).toEqual(["", "", "", ""]);
  });

  it("keeps the site fields when Performance is chosen", () => {
    const form = filledForm();
    setCategory(form, "Performance");
    expect(form.shift).toBe("SHIFT-1");
  });
});

describe("buildPenaltyPayload", () => {
  it("uses the Penalty Issuance fieldnames", () => {
    expect(buildPenaltyPayload(filledForm())).toEqual({
      penalty_category: "Performance",
      penalty_occurence_time: "2026-11-12 09:30:00",
      penalty_location: "Gate 3",
      shift: "SHIFT-1",
      site: "SITE-1",
      project: "PRJ-1",
      site_location: "Kuwait City",
      third_party_damage: 0,
      employees: [{ employee_id: "HR-EMP-00001" }],
      penalty_issuance_details: [
        {
          penalty_type: "Late",
          exact_notes: "came late",
          attachments: { attachment_name: "p.png", attachment: "AAAA" },
        },
        { penalty_type: "Absent", exact_notes: "" },
      ],
    });
  });

  it("sends no site fields after switching away from Performance", () => {
    const form = filledForm();
    setCategory(form, "Transportation");
    form.third_party_damage = true;
    const payload = buildPenaltyPayload(form);
    ["shift", "site", "project", "site_location"].forEach((field) =>
      expect(payload).not.toHaveProperty(field),
    );
    expect(payload.third_party_damage).toBe(1);
  });
});

describe("validatePenaltyForm", () => {
  it("passes a complete form", () => {
    expect(validatePenaltyForm(filledForm(), NOW)).toEqual({});
  });

  it("names every missing field", () => {
    expect(validatePenaltyForm(blankPenaltyForm(), NOW)).toEqual({
      penalty_occurence_time: "penalty.errors.occurrence_required",
      penalty_location: "penalty.errors.location_required",
      shift: "penalty.errors.shift_required",
      employees: "penalty.errors.employees_required",
      violations: "penalty.errors.violations_required",
    });
  });

  it("does not ask for a shift outside Performance", () => {
    const form = filledForm();
    setCategory(form, "Accomodation");
    expect(validatePenaltyForm(form, NOW)).toEqual({});
  });

  it("rejects future and older-than-10-days occurrences", () => {
    const form = filledForm();
    form.penalty_occurence_time = "2026-11-12T13:00";
    expect(validatePenaltyForm(form, NOW).penalty_occurence_time).toBe(
      "penalty.errors.occurrence_future",
    );
    form.penalty_occurence_time = "2026-11-01T12:00";
    expect(validatePenaltyForm(form, NOW).penalty_occurence_time).toBe(
      "penalty.errors.occurrence_too_old",
    );
  });
});

describe("hasEmployee", () => {
  it("matches on the Employee record name", () => {
    const form = filledForm();
    expect(hasEmployee(form, { name: "HR-EMP-00001" })).toBe(true);
    expect(hasEmployee(form, { name: "HR-EMP-00002" })).toBe(false);
  });
});
