import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.appurape.app',
  appName: 'AppuraPe',
  webDir: 'dist/appurape/browser',
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    SocialLogin: {
      providers: {
        google: true,
        facebook: false,
        apple: false,
        twitter: false,
      },
      logLevel: 1,
    },
  },
};

export default config;
