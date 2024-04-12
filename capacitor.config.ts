import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "io.ionic.onefm",
  appName: "one_facilities",
  webDir: "dist",
  server: {
    androidScheme: "https",
    allowNavigation: ["https://staging.one-fm.com/*"],
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
  },
};

export default config;
