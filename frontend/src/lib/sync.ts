import { CapacitorHttp } from '@capacitor/core'

/**
 * Finding the laptop without being told where it is.
 *
 * Typing an IP into the phone is the part nobody does twice, so Orbit never
 * asks. Two facts do the work:
 *
 * 1. The build stamps the laptop's own LAN addresses into the bundle
 *    (`__SYNC_HOSTS__`, see vite.config.ts). Whatever is installed on the phone
 *    was built on that laptop, so it already knows where it came from.
 * 2. When the address has moved — a new DHCP lease, a different WiFi — the
 *    subnet almost never has, so we sweep the /24 those addresses sit on.
 *
 * The host that answered last is remembered, so the usual case is one request.
 */

/** LAN sync URLs of the machine that built this bundle, injected by Vite. */
declare const __SYNC_HOSTS__: string[]

const SAVED_HOST = 'orbit.syncHost'

export interface SyncServer {
  /** e.g. `http://192.168.1.4:8787` */
  host:     string
  bundleId: string
}

function savedHost(): string | null {
  try { return localStorage.getItem(SAVED_HOST) } catch { return null }
}

export function rememberHost(host: string): void {
  try { localStorage.setItem(SAVED_HOST, host) } catch { /* private mode — just probe again next time */ }
}

/** Ask one host for its build id. Null for anything that is not our server. */
async function probe(host: string, timeout: number): Promise<string | null> {
  try {
    const res = await CapacitorHttp.get({
      url: `${host}/sync/version`,
      connectTimeout: timeout,
      readTimeout:    timeout,
    })
    if (res.status !== 200) return null
    const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data
    return typeof data?.bundleId === 'string' ? data.bundleId : null
  } catch {
    return null
  }
}

/** Probe a batch at once — the native HTTP plugin runs each on its own thread. */
async function probeAll(hosts: string[], timeout: number): Promise<SyncServer | null> {
  const results = await Promise.all(
    hosts.map(host => probe(host, timeout).then(bundleId => (bundleId ? { host, bundleId } : null))),
  )
  return results.find((r): r is SyncServer => r !== null) ?? null
}

/** The `a.b.c` prefix and port of each known host, deduplicated. */
function subnets(hosts: string[]): { prefix: string; port: string }[] {
  const seen = new Map<string, { prefix: string; port: string }>()
  for (const host of hosts) {
    const m = host.match(/^http:\/\/(\d+\.\d+\.\d+)\.\d+:(\d+)$/)
    if (m) seen.set(`${m[1]}:${m[2]}`, { prefix: m[1], port: m[2] })
  }
  return [...seen.values()]
}

const BATCH = 64

export async function findServer(onProgress: (message: string) => void): Promise<SyncServer | null> {
  const known = [...new Set([savedHost(), ...__SYNC_HOSTS__].filter((h): h is string => !!h))]
  if (!known.length) return null

  onProgress('Looking for your computer…')
  const direct = await probeAll(known, 2500)
  if (direct) return direct

  for (const { prefix, port } of subnets(known)) {
    onProgress(`Scanning ${prefix}.0…`)
    for (let first = 1; first <= 254; first += BATCH) {
      const batch: string[] = []
      for (let i = first; i < Math.min(first + BATCH, 255); i++) batch.push(`http://${prefix}.${i}:${port}`)
      const found = await probeAll(batch, 900)
      if (found) return found
    }
  }
  return null
}
