import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mediavault.downloader',
  appName: 'MediaVault',
  webDir: 'dist/frontend/browser',
  server: {
    androidScheme: 'https',
    cleartext: true
  },
  plugins: {
    Filesystem: {},
    Toast: {}
  }
};

export default config;
