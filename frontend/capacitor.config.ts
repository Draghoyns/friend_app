import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId:   'com.portfolio.orbit',
  appName: 'Orbit',
  webDir:  'dist',
  plugins: {
    LiveUpdate: {
      // Only used by the dev-only WiFi sync (sidebar → Update over WiFi).
      // Old bundles are swept up once a new one has booted successfully.
      autoDeleteBundles: true,
    },
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
