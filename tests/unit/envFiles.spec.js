import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import dotenv from "dotenv";
import { describe, expect, test } from "vitest";
import { resolveMode } from "../../swEnvBuild.js";

const HOSTS = {
  production: "https://one-fm.com",
  staging: "https://staging.one-fm.com",
  "test-production": "https://test-production.one-fm.com",
};

const readEnv = (mode) => dotenv.parse(readFileSync(resolve(__dirname, `../../.env.${mode}`)));

describe(".env.<mode> files", () => {
  for (const [mode, host] of Object.entries(HOSTS)) {
    test(`${mode} calls ${host} over HTTPS with the v1 path prefix`, () => {
      const env = readEnv(mode);
      expect(env.VITE_BASE_API_URL).toBe(host);
      // Request paths already start with "v1.", so the prefix must end at "one_fm.api.".
      expect(env.VITE_API_PREFIX).toBe("/api/method/one_fm.api.");
      expect(env.VITE_BASE_URL).toBe("/");
      expect(env.VITE_FIREBASE_PROJECT_ID).toBe("one-fm-70641");
    });
  }
});

describe("resolveMode", () => {
  test("reads --mode <name> and --mode=<name>", () => {
    expect(resolveMode(["node", "swEnvBuild.js", "--mode", "staging"])).toBe("staging");
    expect(resolveMode(["node", "swEnvBuild.js", "--mode=test-production"])).toBe("test-production");
  });

  test("defaults to production like vite build", () => {
    const previous = process.env.MODE;
    delete process.env.MODE;
    expect(resolveMode(["node", "swEnvBuild.js"])).toBe("production");
    if (previous !== undefined) process.env.MODE = previous;
  });
});
