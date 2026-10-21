import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";

const iosApp = resolve(__dirname, "../../ios/App");
const read = (relative) => readFileSync(resolve(iosApp, relative), "utf8");

const podfile = read("Podfile");
const appDelegate = read("App/AppDelegate.swift");
const infoPlist = read("App/Info.plist");
const project = read("App.xcodeproj/project.pbxproj");

const PLIST_BUILD_ID = "20EE42E0D9E2981DC886638E";
const PLIST_REF_ID = "1624903F8E6FD87CADE10DDF";

describe("iOS push notifications through FCM", () => {
  test("Podfile adds the FirebaseMessaging pod", () => {
    expect(podfile).toContain("  pod 'FirebaseMessaging', '~> 11.0'");
  });

  test("AppDelegate imports Firebase and configures it at launch", () => {
    expect(appDelegate).toContain("import FirebaseCore");
    expect(appDelegate).toContain("import FirebaseMessaging");
    expect(appDelegate).toContain("FirebaseApp.configure()");
  });

  test("AppDelegate hands the APNs token to Firebase and posts the FCM token", () => {
    expect(appDelegate).toContain("Messaging.messaging().apnsToken = deviceToken");
    expect(appDelegate).toContain("Messaging.messaging().token { token, error in");
    expect(appDelegate).toContain(
      "NotificationCenter.default.post(name: .capacitorDidRegisterForRemoteNotifications, object: token)"
    );
    expect(appDelegate).toContain(
      "NotificationCenter.default.post(name: .capacitorDidFailToRegisterForRemoteNotifications, object: error)"
    );
    expect(appDelegate).not.toContain(
      "NotificationCenter.default.post(name: .capacitorDidRegisterForRemoteNotifications, object: deviceToken)"
    );
  });

  test("Info.plist enables the remote-notification background mode", () => {
    expect(infoPlist).toMatch(
      /<key>UIBackgroundModes<\/key>\s*<array>\s*<string>remote-notification<\/string>\s*<\/array>/
    );
  });

  test("GoogleService-Info.plist is part of the app target's Resources phase", () => {
    expect(project).toContain(
      `${PLIST_BUILD_ID} /* GoogleService-Info.plist in Resources */ = {isa = PBXBuildFile; fileRef = ${PLIST_REF_ID} /* GoogleService-Info.plist */; };`
    );
    expect(project).toContain(`${PLIST_REF_ID} /* GoogleService-Info.plist */ = {isa = PBXFileReference;`);
    expect(project).toMatch(
      new RegExp(`/\\* App \\*/ = \\{[^}]*?children = \\([^)]*?${PLIST_REF_ID} /\\* GoogleService-Info\\.plist \\*/,`)
    );
    const resources = project.match(/isa = PBXResourcesBuildPhase;[\s\S]*?files = \(([\s\S]*?)\);/)[1];
    expect(resources).toContain(`${PLIST_BUILD_ID} /* GoogleService-Info.plist in Resources */,`);
  });
});
