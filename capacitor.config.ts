import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.teampayer.app',
  appName: 'TeamPayer',
  webDir: 'out',
  server: {
    url: 'https://teampayer.de',
    androidScheme: 'https',
    iosScheme: 'https',
    cleartext: false,
    allowNavigation: [
      'teampayer.de',
      '*.teampayer.de',
      'appleid.apple.com',
      '*.apple.com',
      'accounts.google.com',
      'login.microsoftonline.com'
    ]
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#0ea5e9",  // Sky blue for standard app
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
    },
    AppleSignIn: {
      clientId: 'com.teampayer.app'
    }
  }
};

export default config;
