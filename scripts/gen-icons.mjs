/**
 * Generates the whole app icon set from one vector master.
 *
 * The bird silhouette lives in src/assets/mark.svg and is the single source of
 * truth — this script only wraps it in the icon tile and rasterises. Run it
 * after touching the mark:
 *
 *   npm run icons
 *
 * Outputs into src-tauri/icons/: the PNG sizes tauri.conf.json references, a
 * multi-resolution .ico for Windows, an .icns for macOS, and a
 * transparent-background icon-transparent.png for anywhere the tile isn't
 * wanted. Neither sharp nor Node can write .ico/.icns, so both containers are
 * assembled by hand below — each just wraps PNGs.
 */

import sharp from 'sharp';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'src-tauri', 'icons');
mkdirSync(outDir, { recursive: true });

const INK = '#F5F5F7';

/** A bird path, lifted straight out of its mark so the two can't drift. */
function birdPath(file) {
  const svg = readFileSync(join(root, 'src', 'assets', file), 'utf8');
  const match = svg.match(/<path[^>]*\sd="([^"]+)"/);
  if (!match) throw new Error(`no <path d="..."> found in src/assets/${file}`);
  return match[1];
}

/**
 * Two glyphs, with bounding boxes as documented in the SVGs.
 *
 * `detailed` carries the wing notch. Below 48px that notch lands on less than a
 * pixel and reads as grey mush, so the small sizes use `simple` instead — the
 * same silhouette with the notch closed up. Standard practice for icon sets,
 * and the difference is invisible at a glance.
 */
const GLYPHS = {
  detailed: { path: birdPath('mark.svg'), bbox: { x: 6, y: 21, w: 91, h: 69 } },
  simple: { path: birdPath('mark-simple.svg'), bbox: { x: 6, y: 21, w: 91, h: 67 } },
};

/**
 * Only the 16px icon drops the wing notch. 32 was simplified too at first, which
 * made the icon in a Properties dialog visibly different from the one in the
 * taskbar — the same app wearing two faces. At 32 the notch survives; at 16 it
 * is noise.
 */
const SIMPLIFY_BELOW = 32;

/** Centres the bird in a `size` box at `coverage` of the box width. */
function birdGroup(size, coverage) {
  const { path, bbox } = size < SIMPLIFY_BELOW ? GLYPHS.simple : GLYPHS.detailed;
  const scale = (size * coverage) / bbox.w;
  const tx = (size - bbox.w * scale) / 2 - bbox.x * scale;
  const ty = (size - bbox.h * scale) / 2 - bbox.y * scale;
  return `<g transform="translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${scale.toFixed(4)})" fill="${INK}">
    <path fill-rule="evenodd" d="${path}"/>
  </g>`;
}

/** Dark squircle tile + bird, matching the reference icon. */
function tiledIcon(size) {
  const r = size * 0.2266; // iOS-ish corner radius
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <defs>
    <linearGradient id="tile" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#212125"/>
      <stop offset="1" stop-color="#0B0B0D"/>
    </linearGradient>
    <linearGradient id="edge" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.16"/>
      <stop offset="0.45" stop-color="#FFFFFF" stop-opacity="0.04"/>
      <stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${r}" fill="url(#tile)"/>
  <rect x="${size * 0.004}" y="${size * 0.004}" width="${size * 0.992}" height="${size * 0.992}"
        rx="${r - size * 0.004}" fill="none" stroke="url(#edge)" stroke-width="${size * 0.007}"/>
  ${birdGroup(size, 0.72)}
</svg>`;
}

/** Same bird, no tile — for surfaces that supply their own background. */
function bareIcon(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  ${birdGroup(size, 0.82)}
</svg>`;
}

const png = (svg, size) =>
  sharp(Buffer.from(svg), { density: 900 }).resize(size, size).png({ compressionLevel: 9 }).toBuffer();

// --------------------------------------------------------------------------
// PNG master + the sizes tauri.conf.json lists
// --------------------------------------------------------------------------

// Each size is authored at its own dimensions rather than downscaled from one
// master, so the glyph choice, corner radius and edge stroke are all resolved
// for that size instead of being interpolated from a 1024px raster.
const sizes = [16, 32, 48, 64, 128, 256, 512, 1024];
const rendered = new Map();
for (const size of sizes) rendered.set(size, await png(tiledIcon(size), size));

const writePng = (name, size) => writeFileSync(join(outDir, name), rendered.get(size));
writePng('32x32.png', 32);
writePng('128x128.png', 128);
writePng('128x128@2x.png', 256);
writePng('icon.png', 512);
writeFileSync(join(outDir, 'icon-transparent.png'), await png(bareIcon(1024), 512));

// --------------------------------------------------------------------------
// .ico — ICONDIR, then one ICONDIRENTRY per image, then the payloads.
//
// ORDER MATTERS, and not for the reason you would expect. Windows picks an
// entry by size and ignores the order, but tauri-codegen takes
// `icon_dir.entries()[0]` verbatim as the window icon — so whichever entry is
// written first is what the taskbar gets. Smallest-first put a 16px image in
// the taskbar, upscaled to mush. Largest first.
//
// Sizes from 64 up are PNG-compressed, which is the modern convention and keeps
// the file to a sane size; the small ones stay as uncompressed DIB for the
// widest compatibility. GNU windres — which tauri-winres shells out to for the
// Windows resource — reads both.
// --------------------------------------------------------------------------

/** One PNG-compressed icon image. Read by Windows Vista and later. */
async function pngEntry(svg, size) {
  return { size, data: await png(svg, size) };
}

/** One DIB icon image: header, bottom-up BGRA, then the 1-bit AND mask. */
async function dibEntry(svg, size) {
  const { data } = await sharp(Buffer.from(svg), { density: 900 })
    .resize(size, size)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const header = Buffer.alloc(40);
  header.writeUInt32LE(40, 0); // biSize
  header.writeInt32LE(size, 4); // biWidth
  header.writeInt32LE(size * 2, 8); // biHeight — colour plus mask
  header.writeUInt16LE(1, 12); // biPlanes
  header.writeUInt16LE(32, 14); // biBitCount
  header.writeUInt32LE(0, 16); // biCompression — BI_RGB

  // RGBA rows, top-down, become BGRA rows, bottom-up.
  const colour = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y += 1) {
    const source = y * size * 4;
    const target = (size - 1 - y) * size * 4;
    for (let x = 0; x < size; x += 1) {
      colour[target + x * 4] = data[source + x * 4 + 2]; // B
      colour[target + x * 4 + 1] = data[source + x * 4 + 1]; // G
      colour[target + x * 4 + 2] = data[source + x * 4]; // R
      colour[target + x * 4 + 3] = data[source + x * 4 + 3]; // A
    }
  }

  // The AND mask is vestigial for 32-bit icons — the alpha channel is what
  // gets used — but it still has to be there, rows padded to 4 bytes.
  const maskStride = Math.ceil(size / 32) * 4;
  const mask = Buffer.alloc(maskStride * size);

  return { size, data: Buffer.concat([header, colour, mask]) };
}

function buildIco(entries) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(entries.length, 4);

  const dir = Buffer.alloc(16 * entries.length);
  let offset = header.length + dir.length;

  entries.forEach(({ size, data }, i) => {
    const at = i * 16;
    dir.writeUInt8(size >= 256 ? 0 : size, at); // 0 means 256
    dir.writeUInt8(size >= 256 ? 0 : size, at + 1);
    dir.writeUInt8(0, at + 2); // palette
    dir.writeUInt8(0, at + 3); // reserved
    dir.writeUInt16LE(1, at + 4); // colour planes
    dir.writeUInt16LE(32, at + 6); // bits per pixel
    dir.writeUInt32LE(data.length, at + 8);
    dir.writeUInt32LE(offset, at + 12);
    offset += data.length;
  });

  return Buffer.concat([header, dir, ...entries.map((e) => e.data)]);
}

const icoEntries = [];
for (const size of [256, 128, 64, 48, 32, 16]) {
  const svg = tiledIcon(size);
  // Only 256 is PNG — that is the convention every Windows icon follows, and a
  // 256 DIB would be 270KB on its own. Everything below stays uncompressed:
  // older decoders (System.Drawing.Icon among them) cannot read a PNG entry at
  // all, and there is no reason to hand them one at sizes where it saves little.
  icoEntries.push(size >= 256 ? await pngEntry(svg, size) : await dibEntry(svg, size));
}
writeFileSync(join(outDir, 'icon.ico'), buildIco(icoEntries));

// --------------------------------------------------------------------------
// .icns — 'icns' magic, total length, then type/length/PNG triples.
// --------------------------------------------------------------------------

function buildIcns(entries) {
  const chunks = entries.map(({ type, data }) => {
    const head = Buffer.alloc(8);
    head.write(type, 0, 4, 'ascii');
    head.writeUInt32BE(data.length + 8, 4);
    return Buffer.concat([head, data]);
  });

  const body = Buffer.concat(chunks);
  const head = Buffer.alloc(8);
  head.write('icns', 0, 4, 'ascii');
  head.writeUInt32BE(body.length + 8, 4);
  return Buffer.concat([head, body]);
}

writeFileSync(
  join(outDir, 'icon.icns'),
  buildIcns([
    { type: 'ic11', data: rendered.get(32) }, // 16pt @2x
    { type: 'ic12', data: rendered.get(64) }, // 32pt @2x
    { type: 'ic07', data: rendered.get(128) },
    { type: 'ic13', data: rendered.get(256) }, // 128pt @2x
    { type: 'ic08', data: rendered.get(256) },
    { type: 'ic09', data: rendered.get(512) },
    { type: 'ic14', data: rendered.get(512) }, // 256pt @2x
    { type: 'ic10', data: rendered.get(1024) },
  ]),
);

console.log('icons written to src-tauri/icons/');
