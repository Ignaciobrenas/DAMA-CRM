import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.damacrm.app',
  appName: 'DAMA CRM',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https',
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#020617',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#2563EB',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#2563EB',
    },
  },
};

export default config;
