import { describe, expect, it } from "vitest";
import { getFrappeErrorMessage } from "@/utils/frappeError";

const IN_PROGRESS =
  "Withdrawal request HR-ERW-202610-00005 for this employee is still in progress. Please wait until it is Approved or Rejected before submitting another.";

describe("getFrappeErrorMessage", () => {
  it("reads the frappe.throw message from _server_messages", () => {
    const error = {
      status: 417,
      data: {
        exc_type: "ValidationError",
        _server_messages: JSON.stringify([JSON.stringify({ message: IN_PROGRESS, title: "Message" })]),
      },
    };
    expect(getFrappeErrorMessage(error)).toBe(IN_PROGRESS);
  });

  it("strips html tags from server messages", () => {
    const error = {
      data: { _server_messages: JSON.stringify([JSON.stringify({ message: "Employee <b>X</b> not found" })]) },
    };
    expect(getFrappeErrorMessage(error)).toBe("Employee X not found");
  });

  it("falls back to the exception text without the exception class", () => {
    const error = { data: { exception: `frappe.exceptions.ValidationError: ${IN_PROGRESS}` } };
    expect(getFrappeErrorMessage(error)).toBe(IN_PROGRESS);
  });

  it("returns null for a non-Frappe body such as a gateway timeout page", () => {
    expect(getFrappeErrorMessage({ status: 504, data: "<html>504 Gateway Time-out</html>" })).toBeNull();
    expect(getFrappeErrorMessage(new Error("Failed to fetch"))).toBeNull();
  });
});
