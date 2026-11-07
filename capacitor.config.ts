import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.stitchandscrap.app',
  appName: 'Stitch & Scrap',
  webDir: 'dist',
  server: {
    // For live reload/dev you can set url + cleartext; production APK uses bundled dist.
    androidScheme: 'https',
  },
};

export default config;
