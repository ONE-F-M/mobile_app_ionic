import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";

const iosApp = resolve(__dirname, "../../ios/App");
const exportOptions = readFileSync(resolve(iosApp, "ExportOptions.plist"), "utf8");
const project = readFileSync(resolve(iosApp, "App.xcodeproj/project.pbxproj"), "utf8");

const PROFILE = "ONE FM App Store 2026";
const appTargetConfig = (name) =>
  project.match(new RegExp(`/\\* Pods-App\\.${name}\\.xcconfig \\*/;\\s*buildSettings = \\{([\\s\\S]*?)\\};`))[1];

describe("iOS release signing", () => {
  test("export uses the App Store profile and Apple Distribution certificate", () => {
    expect(exportOptions).toMatch(
      new RegExp(`<key>com\\.onefacilitiesmanagement\\.ios\\.apps</key>\\s*<string>${PROFILE}</string>`)
    );
    expect(exportOptions).toMatch(/<key>signingCertificate<\/key>\s*<string>Apple Distribution<\/string>/);
    expect(exportOptions).toMatch(/<key>signingStyle<\/key>\s*<string>manual<\/string>/);
  });

  test("release archive signs manually with the same profile, debug stays automatic", () => {
    const release = appTargetConfig("release");
    expect(release).toContain("CODE_SIGN_STYLE = Manual;");
    expect(release).toContain(`PROVISIONING_PROFILE_SPECIFIER = "${PROFILE}";`);
    expect(release).toContain(`"CODE_SIGN_IDENTITY[sdk=iphoneos*]" = "Apple Distribution";`);
    expect(appTargetConfig("debug")).toContain("CODE_SIGN_STYLE = Automatic;");
  });
});
