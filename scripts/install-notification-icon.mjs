#!/usr/bin/env node
/**
 * Install the Android notification icon into the generated native project.
 *
 * `capacitor-assets` does not produce this one. Android's status bar throws
 * away every colour in a small icon and redraws the alpha channel in the tint
 * from capacitor.config.ts — so this must be a white silhouette on
 * transparency, which frontend/assets/notification.png already is. Point a
 * full-colour image at it and you get a featureless white blob.
 *
 * frontend/android/ is generated and gitignored, so this re-runs after
 * `npx cap add` rather than the files being committed.
 */
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { existsSync, mkdirSync } from 'node:fs'

const root  = join(dirname(fileURLToPath(import.meta.url)), '..')
const sharp = createRequire(join(root, 'frontend/package.json'))('sharp')

const source = join(root, 'frontend/assets/notification.png')
const res    = join(root, 'frontend/android/app/src/main/res')

/** Notification icons are 24dp; these are that at each density bucket. */
const DENSITIES = { mdpi: 24, hdpi: 36, xhdpi: 48, xxhdpi: 72, xxxhdpi: 96 }

if (!existsSync(res)) {
  console.log('· no android project yet — run `just add-platforms` first, skipping')
  process.exit(0)
}

for (const [density, px] of Object.entries(DENSITIES)) {
  const dir = join(res, `drawable-${density}`)
  mkdirSync(dir, { recursive: true })
  await sharp(source)
    .resize(px, px, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(join(dir, 'ic_stat_orbit.png'))
}

console.log(`✔ Android: ic_stat_orbit installed at ${Object.keys(DENSITIES).length} densities`)
