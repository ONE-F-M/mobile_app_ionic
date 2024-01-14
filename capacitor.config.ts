import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'mobile_app_ionic',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
