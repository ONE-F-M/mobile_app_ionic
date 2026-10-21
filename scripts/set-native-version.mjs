// Writes the version from package.json and a build number into the native projects.
// Usage: node scripts/set-native-version.mjs <build>
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export function applyVersion(gradle, pbxproj, version, build) {
  const nextGradle = gradle
    .replace(/^([ \t]*)versionCode[ \t]+.*$/m, (_, indent) => `${indent}versionCode ${build}`)
    .replace(/^([ \t]*)versionName[ \t]+.*$/m, (_, indent) => `${indent}versionName "${version}"`);

  const nextPbxproj = pbxproj
    .replace(/MARKETING_VERSION = [^;]*;/g, () => `MARKETING_VERSION = ${version};`)
    .replace(/CURRENT_PROJECT_VERSION = [^;]*;/g, () => `CURRENT_PROJECT_VERSION = ${build};`);

  return { gradle: nextGradle, pbxproj: nextPbxproj };
}

function main() {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const build = process.argv[2];

  if (!build || !/^\d+$/.test(build)) {
    console.error("Usage: node scripts/set-native-version.mjs <build>  (build must be a whole number)");
    process.exit(1);
  }

  const { version } = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));
  if (!version) {
    console.error("package.json has no version");
    process.exit(1);
  }

  const gradlePath = resolve(root, "android/app/build.gradle");
  const pbxprojPath = resolve(root, "ios/App/App.xcodeproj/project.pbxproj");

  const result = applyVersion(
    readFileSync(gradlePath, "utf8"),
    readFileSync(pbxprojPath, "utf8"),
    version,
    build,
  );

  writeFileSync(gradlePath, result.gradle);
  writeFileSync(pbxprojPath, result.pbxproj);
  console.log(`Set version ${version} (build ${build})`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
