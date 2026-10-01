#!/usr/bin/env node
/**
 * Renders Currio's brand mark (the same geometry as <BrandMark />) to PNG
 * icons with no dependencies: signed-distance shapes, 4×4 supersampling and
 * a hand-rolled PNG encoder on top of node:zlib.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';

const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '../public/icons');
const SIZES = [16, 32, 48, 128];
const BRAND = [11, 138, 99];
const SAMPLES = 4;

// Geometry in a 32×32 design space.
const RADIUS = 9;
const ARC = { cx: 16, cy: 16, r: 7.5, half: 1.7, gap: Math.atan2(4.8, 5.5) };
const ARC_ENDS = [[21.5, 11.2], [21.5, 20.8]];
const DOT = { cx: 23.2, cy: 16, r: 1.9 };

function inRoundedRect(x, y) {
  const qx = Math.abs(x - 16) - (16 - RADIUS);
  const qy = Math.abs(y - 16) - (16 - RADIUS);
  const outside = Math.hypot(Math.max(qx, 0), Math.max(qy, 0));
  return outside + Math.min(Math.max(qx, qy), 0) - RADIUS <= 0;
}

function inMark(x, y) {
  const dx = x - ARC.cx;
  const dy = y - ARC.cy;
  const onRing = Math.abs(Math.hypot(dx, dy) - ARC.r) <= ARC.half;
  const angle = Math.atan2(dy, dx);
  if (onRing && Math.abs(angle) >= ARC.gap) return true;
  if (ARC_ENDS.some(([ex, ey]) => Math.hypot(x - ex, y - ey) <= ARC.half)) return true;
  return Math.hypot(x - DOT.cx, y - DOT.cy) <= DOT.r;
}

function render(size) {
  const pixels = Buffer.alloc(size * size * 4);
  const scale = 32 / size;
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let bg = 0;
      let fg = 0;
      for (let sy = 0; sy < SAMPLES; sy++) {
        for (let sx = 0; sx < SAMPLES; sx++) {
          const x = (px + (sx + 0.5) / SAMPLES) * scale;
          const y = (py + (sy + 0.5) / SAMPLES) * scale;
          if (!inRoundedRect(x, y)) continue;
          if (inMark(x, y)) fg++;
          else bg++;
        }
      }
      const total = SAMPLES * SAMPLES;
      const alpha = (bg + fg) / total;
      const i = (py * size + px) * 4;
      if (alpha === 0) continue;
      const white = fg / (bg + fg);
      for (let c = 0; c < 3; c++) pixels[i + c] = Math.round(BRAND[c] * (1 - white) + 255 * white);
      pixels[i + 3] = Math.round(alpha * 255);
    }
  }
  return encodePng(size, size, pixels);
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePng(width, height, rgba) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8; // bit depth
  header[9] = 6; // RGBA
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0; // filter: none
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

mkdirSync(OUT, { recursive: true });
for (const size of SIZES) {
  writeFileSync(resolve(OUT, `icon-${size}.png`), render(size));
  console.log(`icons/icon-${size}.png`);
}
