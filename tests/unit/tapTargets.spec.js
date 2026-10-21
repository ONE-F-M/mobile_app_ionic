import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";

const root = resolve(__dirname, "../..");
const read = (path) => readFileSync(resolve(root, path), "utf8");
const style = (path) => read(path).split("<style")[1];

describe("small controls are at least 44 by 44", () => {
  test.each([
    "src/components/Header.vue",
    "src/components/checkin/Header.vue",
    "src/views/enrollment/EnrollmentStartPage.vue",
  ])("header buttons in %s", (path) => {
    expect(style(path)).toMatch(/ion-button \{[^}]*min-width: 44px;\s*min-height: 44px;/);
  });

  test("Employee ID Next button", () => {
    expect(read("src/views/authentication/EmployeeId.vue")).toMatch(/<ion-button\s+class="login-wrapper-next"/);
    expect(style("src/views/authentication/EmployeeId.vue")).toMatch(/&-next \{\s*min-height: 44px;/);
  });

  test("Login forgot-password link", () => {
    expect(style("src/views/authentication/LoginPage.vue")).toMatch(/\n\.login-description-link \{\s*display: inline-block;\s*padding: 12px 0;/);
  });
});

describe("fonts", () => {
  test("fonts.scss imports no font sheet", () => {
    expect(read("src/theme/fonts.scss")).not.toMatch(/@import/);
  });
});
