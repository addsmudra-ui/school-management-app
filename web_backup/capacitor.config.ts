import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.newspulse.app',
  appName: 'News Pulse',
  webDir: 'out',
  server: {
    androidScheme: 'https'
  }
};

export default config;
