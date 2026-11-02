import { describe, expect, test } from "vitest";
import { canWithdrawResignation, isWithdrawalPending } from "@/utils/resignationConstants";

describe("canWithdrawResignation", () => {
  test("offers withdrawal while the resignation is still under review", () => {
    for (const state of ["Pending Supervisor", "Pending Line Manager", "Pending Project Manager", "Approved"]) {
      expect(canWithdrawResignation({ workflow_state: state })).toBe(true);
    }
  });

  test("offers withdrawal in Draft so the employee can discard it", () => {
    expect(canWithdrawResignation({ workflow_state: "Draft" })).toBe(true);
  });

  test("does not offer it when there is no resignation", () => {
    expect(canWithdrawResignation(null)).toBe(false);
  });
});

describe("isWithdrawalPending", () => {
  test("is pending until the withdrawal is approved or rejected", () => {
    expect(isWithdrawalPending({ withdrawal_state: "Pending Supervisor" })).toBe(true);
    expect(isWithdrawalPending({ withdrawal_state: "Approved" })).toBe(false);
    expect(isWithdrawalPending({ withdrawal_state: "Rejected" })).toBe(false);
    expect(isWithdrawalPending({ withdrawal_state: null })).toBe(false);
  });
});
