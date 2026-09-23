#!/usr/bin/env node
// Serves the built frontend to the phone over WiFi, so a change can be tested
// without a USB cable. Dev-only: nothing here ships in the app, and the app
// itself still makes no network calls of its own.
//
//   node scripts/sync-server.mjs      (or `just sync`, which builds first)
//
// Two endpoints, matching what @capawesome/capacitor-live-update expects:
//   GET /sync/version     → { bundleId, buildTime } written by the Vite build
//   GET /sync/bundle.zip  → frontend/dist as a zip
import { createServer } from 'node:http'
import { execFileSync } from 'node:child_process'
import { createReadStream, existsSync, readFileSync, rmSync, statSync } from 'node:fs'
import { networkInterfaces, tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

/** Keep in step with SYNC_PORT in frontend/vite.config.ts — the build stamps
 *  this port into the bundle, which is how the phone finds us. */
const PORT = 8787
const DIST = join(dirname(fileURLToPath(import.meta.url)), '..', 'frontend', 'dist')

/** Zip the build once per bundle, not once per request. */
let cached = { bundleId: null, file: null }

function version() {
  const file = join(DIST, 'version.json')
  if (!existsSync(file)) return null
  return JSON.parse(readFileSync(file, 'utf8'))
}

function bundleZip(bundleId) {
  if (cached.bundleId === bundleId && cached.file && existsSync(cached.file)) return cached.file
  const file = join(tmpdir(), `orbit-bundle-${bundleId}.zip`)
  rmSync(file, { force: true })
  // `zip` ships with macOS and every Linux distro, which beats pulling in a
  // dependency for the one thing Node's stdlib cannot do.
  execFileSync('zip', ['-q', '-r', file, '.'], { cwd: DIST })
  cached = { bundleId, file }
  return file
}

function fail(res, code, message) {
  res.writeHead(code, { 'content-type': 'application/json' })
  res.end(JSON.stringify({ error: message }))
}

const server = createServer((req, res) => {
  const path = (req.url ?? '').split('?')[0]
  const build = version()

  if (path === '/sync/version') {
    if (!build) return fail(res, 404, 'No build yet — run `just build` first')
    res.writeHead(200, { 'content-type': 'application/json' })
    return res.end(JSON.stringify(build))
  }

  if (path === '/sync/bundle.zip') {
    if (!build) return fail(res, 404, 'No build yet — run `just build` first')
    let file
    try {
      file = bundleZip(build.bundleId)
    } catch (err) {
      return fail(res, 500, `Could not zip the build: ${err.message}`)
    }
    console.log(`→ ${req.socket.remoteAddress} is downloading build ${build.bundleId}`)
    res.writeHead(200, {
      'content-type': 'application/zip',
      'content-length': statSync(file).size,
    })
    return createReadStream(file).pipe(res)
  }

  fail(res, 404, 'Not found')
})

server.listen(PORT, '0.0.0.0', () => {
  const addresses = Object.values(networkInterfaces())
    .flat()
    .filter(i => i && i.family === 'IPv4' && !i.internal)
    .map(i => `http://${i.address}:${PORT}`)

  console.log('Orbit sync server — leave this running, then tap "Sync now" in the app sidebar.')
  for (const address of addresses) console.log(`  ${address}`)
  if (!addresses.length) console.log('  (no LAN address — is WiFi on?)')
  const build = version()
  console.log(build ? `  serving build ${build.bundleId} (${build.buildTime})` : '  no build yet — run `just build`')
})
