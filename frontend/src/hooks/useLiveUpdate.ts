import { useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { findServer, rememberHost } from '@/lib/sync'

export type SyncStatus = 'idle' | 'working' | 'up-to-date' | 'updated' | 'error'

/**
 * Pull the latest build off the laptop over WiFi — the dev loop without a
 * cable. Finding the laptop is `lib/sync.ts`; swapping the bundle is the
 * live-update plugin, which is only in the app because a USB install put it
 * there.
 */
export function useLiveUpdate() {
  const [status, setStatus]   = useState<SyncStatus>('idle')
  const [message, setMessage] = useState('')

  async function sync() {
    if (!Capacitor.isNativePlatform()) {
      setStatus('error')
      setMessage('Syncing only works in the phone app — the browser build reloads itself.')
      return
    }

    setStatus('working')
    try {
      const server = await findServer(setMessage)
      if (!server) {
        setStatus('error')
        setMessage('No computer found. Run `just sync` on the laptop that built this app, on the same WiFi.')
        return
      }
      rememberHost(server.host)

      const { LiveUpdate } = await import('@capawesome/capacitor-live-update')
      const { bundleId: current } = await LiveUpdate.getCurrentBundle()
      if (current === server.bundleId) {
        setStatus('up-to-date')
        setMessage(`Already on the latest build (${server.host.replace('http://', '')}).`)
        return
      }

      setMessage('Downloading…')
      await LiveUpdate.downloadBundle({ bundleId: server.bundleId, url: `${server.host}/sync/bundle.zip` })
      await LiveUpdate.setBundle({ bundleId: server.bundleId })

      setStatus('updated')
      setMessage('Updated. Reloading…')
      setTimeout(() => { LiveUpdate.reload() }, 1000)
    } catch (err) {
      setStatus('error')
      setMessage(err instanceof Error ? err.message : String(err))
    }
  }

  return { status, message, sync }
}

/** Confirm the bundle booted, so the plugin does not roll it back. */
export async function confirmBundle(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return
  try {
    const { LiveUpdate } = await import('@capawesome/capacitor-live-update')
    await LiveUpdate.ready()
  } catch { /* plugin missing in an older APK — nothing to confirm */ }
}
