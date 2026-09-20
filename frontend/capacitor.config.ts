import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId:   'com.portfolio.orbit',
  appName: 'Orbit',
  webDir:  'dist',
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_launcher_foreground',
      iconColor: '#38bdf8',
      sound:     'default',
    },
  },
}

export default config
