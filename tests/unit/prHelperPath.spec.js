import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";

const NEW_PATH = ".claude/open-pr-via-github-app.sh";
const OLD_PATH = "scripts/claude-pr.sh";
const repo = (path) => resolve(__dirname, "../..", path);

describe("PR helper path", () => {
  test("the helper lives in .claude and the old file is gone", () => {
    expect(existsSync(repo(NEW_PATH))).toBe(true);
    expect(existsSync(repo(OLD_PATH))).toBe(false);
  });

  test("settings allow and ask name the new path", () => {
    const { permissions } = JSON.parse(readFileSync(repo(".claude/settings.json"), "utf8"));
    expect(permissions.allow).toEqual([`Bash(bash ${NEW_PATH}:*)`]);
    expect(permissions.ask).toEqual([`Bash(bash ${NEW_PATH} --update:*)`]);
  });

  test("CLAUDE.md names only the new path", () => {
    const text = readFileSync(repo("CLAUDE.md"), "utf8");
    expect(text).toContain(NEW_PATH);
    expect(text).not.toContain(OLD_PATH);
  });
});
