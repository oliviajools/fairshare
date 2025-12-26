import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.teampayer.app',
  appName: 'TeamPayer',
  webDir: '.next',
  server: {
    androidScheme: 'https',
    // Für Entwicklung: Dev-Server URL - später durch Produktions-URL ersetzen
    url: 'https://teampayer.vercel.app',
    cleartext: true
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
