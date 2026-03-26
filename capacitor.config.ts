import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.teampayer.app',
  appName: 'TeamPayer',
  // Minimales webDir - App lädt von Remote-Server
  webDir: 'out',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
    hostname: 'teampayer.vercel.app',
    url: 'https://teampayer.vercel.app',
    allowNavigation: ['teampayer.vercel.app', 'https://teampayer.vercel.app', 'http://teampayer.vercel.app'],
    cleartext: false
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#0ea5e9",
      showSpinner: false,
      androidSpinnerStyle: "large",
      iosSpinnerStyle: "small",
      spinnerColor: "#ffffff"
    },
    StatusBar: {
      style: 'default',
      backgroundColor: '#0ea5e9'
    },
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true
    }
  }
};

export default config;
