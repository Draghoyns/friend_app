import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId:   'com.portfolio.orbit',
  appName: 'Orbit',
  webDir:  'dist',
  plugins: {
    LocalNotifications: {
      // Must be the white-on-transparent silhouette, not the launcher icon:
      // Android discards the colours and redraws the alpha in `iconColor`, so a
      // full-colour drawable shows up as a white blob. See
      // scripts/install-notification-icon.mjs.
      smallIcon: 'ic_stat_orbit',
      iconColor: '#38bdf8',
      sound:     'default',
    },
  },
}

export default config
