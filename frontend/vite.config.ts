import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import os from 'os'
import { writeFileSync } from 'fs'

/** Port `scripts/sync-server.mjs` listens on. Keep the two in step. */
const SYNC_PORT = 8787

/**
 * Every LAN address this machine has, as sync URLs.
 *
 * The phone cannot ask where the laptop is, so the build stamps its own
 * addresses into the bundle it produces: whatever is installed already knows
 * where it came from, and nobody has to type an IP. `lib/sync.ts` falls back to
 * sweeping these subnets when the router has handed out a new lease since.
 */
function lanHosts(): string[] {
  const hosts: string[] = []
  for (const list of Object.values(os.networkInterfaces())) {
    for (const iface of list ?? []) {
      if (iface.family === 'IPv4' && !iface.internal) hosts.push(`http://${iface.address}:${SYNC_PORT}`)
    }
  }
  return hosts
}

export default defineConfig({
  plugins: [
    react(),
    {
      // The sync server serves this file so the phone can tell, before
      // downloading 250kB of zip, whether it already has this build.
      name: 'orbit-sync-version',
      closeBundle() {
        const version = { bundleId: Date.now().toString(), buildTime: new Date().toISOString() }
        writeFileSync('dist/version.json', JSON.stringify(version, null, 2))
      },
    },
  ],
  define: {
    __SYNC_HOSTS__: JSON.stringify(lanHosts()),
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: { port: 5174 },
})
