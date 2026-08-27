import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.antigravity.batchmate',
  appName: 'Batchmate',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
}

export default config
