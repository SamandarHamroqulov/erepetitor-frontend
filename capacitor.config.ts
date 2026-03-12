// capacitor.config.ts
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.erepetitor.app',
  appName: 'eRepetitor',
  webDir: 'dist',
  server: {
    // MUHIM: Bu yerga serveringiz URL'ini yozing
    url: 'http:///10.111.31.132:4000',
    cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#4f46e5',
      showSpinner: false,
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#4f46e5',
    },
  },
};

export default config;