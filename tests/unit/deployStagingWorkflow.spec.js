import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";

const root = resolve(__dirname, "../..");
const workflow = readFileSync(resolve(root, ".github/workflows/deploy-staging.yml"), "utf8");
const viteConfig = readFileSync(resolve(root, "vite.config.ts"), "utf8");

describe("staging deploy workflow", () => {
  test("deploys the checkout the mobile-staging service runs from", () => {
    expect(workflow).toMatch(/^\s+cd \/home\/frappe\/mobile_app_ionic$/m);
    expect(workflow).toContain("git checkout -f -B staging origin/staging");
    expect(workflow).toContain("sudo supervisorctl restart mobile-staging");
  });

  test("installs with the Yarn version that wrote yarn.lock and builds against the staging API", () => {
    expect(readFileSync(resolve(root, "yarn.lock"), "utf8")).toMatch(/^__metadata:\n  version: 6$/m);
    expect(workflow).toContain("corepack yarn@3.8.7 install --immutable");
    expect(workflow).toContain("corepack yarn@3.8.7 build --mode staging");
    expect(workflow).not.toMatch(/^\s+yarn (install|build)/m);
  });

  test("vite preview accepts the staging host", () => {
    expect(viteConfig).toMatch(/preview: \{\s*allowedHosts: \['mobile-staging\.one-fm\.com'\]/);
  });
});
