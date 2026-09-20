#!/usr/bin/env node
/**
 * Turn the two hand-drawn JPEGs in frontend/assets/source into the PNG sources
 * `capacitor-assets` and the notification icon need.
 *
 * The JPEGs have no alpha — everything sits on white. Android needs the
 * opposite for two of the four outputs, so we key the white out and rebuild an
 * alpha channel from luminance: the darker a pixel was, the more opaque it is.
 */
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
// sharp lives in frontend/node_modules (it ships with @capacitor/assets), and
// this script sits outside it, so resolve from there explicitly.
const sharp = createRequire(join(root, 'frontend/package.json'))('sharp')
const src  = join(root, 'frontend/assets/source')
const out  = join(root, 'frontend/assets')

const SIZE = 1024
/**
 * How much of the canvas the artwork fills.
 *
 * `capacitor-assets` already insets both adaptive layers by 16.7%, which lands
 * them exactly on the 72-of-108dp region every launcher mask is guaranteed to
 * show. So this is breathing room inside that, not the safe zone itself —
 * insetting hard here as well leaves the icon looking shrunken in the tray.
 */
const SAFE = 0.82

/**
 * Alpha from darkness: white → transparent, black → opaque.
 *
 * `ramp` is how many luminance levels below pure white count as a full fade-in.
 * 255 gives a smooth gradient, which suits the notification icon — its colour
 * is thrown away, so the gradient is the only shading it gets. A small ramp
 * keeps artwork fully opaque and drops only the paper it was drawn on, which
 * is what the launcher foreground needs: anything semi-transparent there gets
 * lightened again by the white layer behind it and turns to mush.
 */
async function alphaFromLuminance(file, { white = false, ramp = 255 } = {}) {
  const img = sharp(file).resize(SIZE, SIZE, { fit: 'contain', background: '#ffffff' })
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true })
  const px = info.width * info.height
  const rgba = Buffer.alloc(px * 4)
  for (let i = 0; i < px; i++) {
    const r = data[i * info.channels], g = data[i * info.channels + 1], b = data[i * info.channels + 2]
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
    const a = Math.min(255, Math.round(((255 - lum) / ramp) * 255))
    // A notification icon is drawn entirely in the tint colour, so the RGB is
    // thrown away — write pure white and let the alpha carry the shape.
    rgba[i * 4]     = white ? 255 : r
    rgba[i * 4 + 1] = white ? 255 : g
    rgba[i * 4 + 2] = white ? 255 : b
    rgba[i * 4 + 3] = a
  }
  return sharp(rgba, { raw: { width: info.width, height: info.height, channels: 4 } }).png()
}

/** Scale art down into the centre of a transparent SIZE×SIZE canvas. */
async function inset(pngBuffer, fraction) {
  const inner = Math.round(SIZE * fraction)
  const art = await sharp(pngBuffer).resize(inner, inner, { fit: 'contain',
    background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer()
  return sharp({ create: { width: SIZE, height: SIZE, channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: art, gravity: 'centre' }])
    .png()
}

// 1 — the plain icon: art on white, full bleed. iOS forbids alpha here.
await sharp(join(src, 'app_icon.jpg'))
  .resize(SIZE, SIZE, { fit: 'contain', background: '#ffffff' })
  .flatten({ background: '#ffffff' })
  .png().toFile(join(out, 'icon.png'))

// 2 — adaptive background: the same white the art was drawn on.
await sharp({ create: { width: SIZE, height: SIZE, channels: 4, background: '#ffffff' } })
  .png().toFile(join(out, 'icon-background.png'))

// 3 — adaptive foreground: art keyed off white, inset into the safe zone.
const keyed = await (await alphaFromLuminance(join(src, 'app_icon.jpg'), { ramp: 40 })).toBuffer()
await (await inset(keyed, SAFE)).toFile(join(out, 'icon-foreground.png'))

// 4 — notification icon: white silhouette, alpha only, inset a little so it
//     does not touch the edges of its 24dp box.
const mono = await (await alphaFromLuminance(join(src, 'notification_icon.jpg'), { white: true })).toBuffer()
await (await inset(mono, 0.92)).toFile(join(out, 'notification.png'))

console.log('wrote icon.png, icon-background.png, icon-foreground.png, notification.png')
