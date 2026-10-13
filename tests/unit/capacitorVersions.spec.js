import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const RUNTIME_PACKAGES = ['@capacitor/core', '@capacitor/ios', '@capacitor/android'];

const major = (range) => parseInt(String(range).replace(/^[\^~]/, '').split('.')[0], 10);

const declared = (pkg, name) => (pkg.dependencies || {})[name] ?? (pkg.devDependencies || {})[name];

const mismatches = (pkg) => {
  const cliMajor = major(declared(pkg, '@capacitor/cli'));
  return RUNTIME_PACKAGES.filter((name) => major(declared(pkg, name)) !== cliMajor);
};

const pkg = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf8'));

describe('Capacitor versions', () => {
  it('declares @capacitor/cli and every runtime package', () => {
    [...RUNTIME_PACKAGES, '@capacitor/cli'].forEach((name) => {
      expect(declared(pkg, name), name).toBeTruthy();
    });
  });

  it('keeps the @capacitor/cli major equal to core, ios and android', () => {
    const cliMajor = major(declared(pkg, '@capacitor/cli'));
    RUNTIME_PACKAGES.forEach((name) => {
      expect(major(declared(pkg, name)), `${name} vs @capacitor/cli`).toBe(cliMajor);
    });
  });

  it('would fail with the cli at 5.6.0', () => {
    const broken = {
      dependencies: pkg.dependencies,
      devDependencies: { ...pkg.devDependencies, '@capacitor/cli': '5.6.0' },
    };
    expect(mismatches(broken).length).toBeGreaterThan(0);
  });
});
