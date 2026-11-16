import dayjs from "dayjs";
import { describe, expect, it } from "vitest";
import {
  PENALTY_CATEGORIES,
  blankPenaltyForm,
  buildPenaltyPayload,
  validatePenaltyForm,
} from "@/utils/penaltyIssuance";

const NOW = dayjs("2026-11-12T12:00:00");

const filledForm = () => ({
  ...blankPenaltyForm(),
  penalty_occurence_time: "2026-11-12T09:30",
  penalty_location: "  Gate 3 ",
  employee: { name: "HR-EMP-00001", employee_id: "1301001KW", employee_name: "A", designation: "Guard" },
  penalty_type: "Late",
  exact_notes: " came late ",
  attachment: { name: "p.png", dataUrl: "data:image/png;base64,AAAA" },
});

describe("penalty categories", () => {
  it("maps Accommodation to the DocType spelling", () => {
    expect(PENALTY_CATEGORIES.map((c) => c.value)).toEqual([
      "Performance",
      "Accomodation",
      "Transportation",
    ]);
  });
});

describe("buildPenaltyPayload", () => {
  it("sends one employee and one penalty type", () => {
    expect(buildPenaltyPayload(filledForm())).toEqual({
      penalty_category: "Performance",
      penalty_occurence_time: "2026-11-12 09:30:00",
      penalty_location: "Gate 3",
      employee: "HR-EMP-00001",
      penalty_type: "Late",
      exact_notes: "came late",
      third_party_damage: 0,
      attachment: { attachment_name: "p.png", attachment: "AAAA" },
    });
  });

  it("leaves the attachment out when none is picked", () => {
    const form = { ...filledForm(), attachment: null, third_party_damage: true };
    const payload = buildPenaltyPayload(form);
    expect(payload).not.toHaveProperty("attachment");
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
      employee: "penalty.errors.employee_required",
      penalty_type: "penalty.errors.penalty_type_required",
    });
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
