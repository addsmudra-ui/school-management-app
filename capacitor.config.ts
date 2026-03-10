import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mandalpulse.app',
  appName: 'MandalPulse',
  webDir: 'out',
  server: {
    androidScheme: 'https'
  }
};

export default config;