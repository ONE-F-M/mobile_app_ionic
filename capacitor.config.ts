import { CapacitorConfig } from "@capacitor/cli";
import { KeyboardResize } from '@capacitor/keyboard';

const config: CapacitorConfig = {
  appId: "com.onefacilitiesmanagement.ios.apps",
  appName: "onefacilitiesmanagement",
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
