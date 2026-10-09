import { CapacitorConfig } from "@capacitor/cli";
import { KeyboardResize } from '@capacitor/keyboard';

const config: CapacitorConfig = {
  // iOS bundle id; Android uses applicationId com.onefacilitiesmanagement.android.app in android/app/build.gradle.
  appId: "com.onefacilitiesmanagement.ios.apps",
  appName: "OneFMMobile",
  webDir: "dist",
  server: {
    hostname: "localhost",
    androidScheme: "https",
    iosScheme: "https",
    allowNavigation: ["https://staging.one-fm.com/*"],
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    Keyboard: {
      resize: KeyboardResize.None,
    }
  },
};

export default config;
