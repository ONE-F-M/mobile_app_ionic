import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (path) => readFileSync(resolve(process.cwd(), path), 'utf8');

const pkg = JSON.parse(read('package.json'));
const variables = read('android/variables.gradle');
const podfile = read('ios/App/Podfile');
const pbxproj = read('ios/App/App.xcodeproj/project.pbxproj');
const apkWorkflow = read('.github/workflows/build-production-apk.yml');
const iosWorkflow = read('.github/workflows/build-production-ios.yml');
const manifest = read('android/app/src/main/AndroidManifest.xml');

const major = (range) => parseInt(String(range).replace(/^[\^~]/, '').split('.')[0], 10);

describe('Capacitor 8 upgrade', () => {
  it('has every @capacitor/* runtime dependency and file-opener on major 8', () => {
    const names = Object.keys(pkg.dependencies).filter(
      (name) => name.startsWith('@capacitor/') || name === '@capacitor-community/file-opener',
    );
    expect(names.length).toBeGreaterThanOrEqual(14);
    names.forEach((name) => {
      expect(major(pkg.dependencies[name]), name).toBe(8);
    });
  });

  it('keeps the CLI on major 8 too', () => {
    expect(major(pkg.devDependencies['@capacitor/cli'])).toBe(8);
  });

  it('raises the Android SDK floors in variables.gradle', () => {
    expect(variables).toMatch(/minSdkVersion = 24\b/);
    expect(variables).toMatch(/compileSdkVersion = 36\b/);
    expect(variables).toMatch(/targetSdkVersion = 36\b/);
  });

  it('sets the iOS platform to 15.0 in the Podfile', () => {
    expect(podfile).toContain("platform :ios, '15.0'");
  });

  it('has four IPHONEOS_DEPLOYMENT_TARGET = 15.0 and no 13.0 in project.pbxproj', () => {
    expect(pbxproj.match(/IPHONEOS_DEPLOYMENT_TARGET = 15\.0;/g)).toHaveLength(4);
    expect(pbxproj).not.toMatch(/IPHONEOS_DEPLOYMENT_TARGET = 13\.0;/);
  });

  it('builds the production workflows on Node 22, and the APK one on Java 21', () => {
    expect(apkWorkflow).toContain("node-version: '22'");
    expect(iosWorkflow).toContain("node-version: '22'");
    expect(apkWorkflow).toMatch(/java-version: 21\b/);
  });

  it('lists density in the MainActivity configChanges', () => {
    const changes = manifest.match(/android:configChanges="([^"]*)"/)?.[1].split('|');
    expect(changes).toContain('density');
    expect(changes).toContain('navigation');
  });
});
