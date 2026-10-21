import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";

const app = resolve(__dirname, "../../android/app");
const read = (path) => readFileSync(resolve(app, path), "utf8");
const APP_ID = "com.onefacilitiesmanagement.android.app";

describe("Android application identity", () => {
  test("namespace matches the store application id", () => {
    const gradle = read("build.gradle");
    expect(gradle).toContain(`applicationId "${APP_ID}"`);
    expect(gradle).toContain(`namespace = "${APP_ID}"`);
  });

  test("MainActivity lives in the application package", () => {
    const source = read(`src/main/java/${APP_ID.replaceAll(".", "/")}/MainActivity.java`);
    expect(source).toMatch(new RegExp(`^package ${APP_ID.replaceAll(".", "\\.")};`));
  });

  test("string resources carry no Ionic starter id", () => {
    const strings = read("src/main/res/values/strings.xml");
    expect(strings).not.toContain("io.ionic.starter");
    expect(strings).toContain(`<string name="package_name">${APP_ID}</string>`);
    expect(strings).toContain(`<string name="custom_url_scheme">${APP_ID}</string>`);
  });

  test("launcher and notifications show ONE FM", () => {
    const strings = read("src/main/res/values/strings.xml");
    expect(strings).toContain('<string name="app_name">ONE FM</string>');
    expect(strings).toContain('<string name="title_activity_main">ONE FM</string>');
  });

  test("FCM notifications use a white ONE FM status bar icon", () => {
    expect(read("src/main/AndroidManifest.xml")).toMatch(
      /android:name="com\.google\.firebase\.messaging\.default_notification_icon"\s*android:resource="@drawable\/ic_stat_onefm"/
    );
    const icon = read("src/main/res/drawable/ic_stat_onefm.xml");
    expect([...icon.matchAll(/android:fillColor="([^"]+)"/g)].map((m) => m[1])).toEqual(["#FFFFFF", "#FFFFFF"]);
  });

  test("google-services.json has a client for the application id", () => {
    const clients = JSON.parse(read("google-services.json")).client;
    expect(clients.map((c) => c.client_info.android_client_info.package_name)).toContain(APP_ID);
  });
});
