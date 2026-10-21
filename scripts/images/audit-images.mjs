// Audit every catalog product image: id, name, brand, the image the site shows
// (local packshot, official override or the stored field), and for each one
// HTTP status, content type, bytes and pixel size. Flags missing, placeholder,
// low-res (< 400px short side) and unreachable images.
//
// Usage: node scripts/images/audit-images.mjs [--offline] > /tmp/image-audit.json
//   --offline  skip remote fetches (sandboxes without network): remote rows
//              are listed with status "not-checked".
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { ALL_PRODUCTS } from '../../src/data/products.js';
import { applyCatalogCorrections } from '../../src/data/catalogCorrections.js';
import { PRODUCT_IMAGE_OVERRIDES } from '../../src/data/productImageOverrides.js';
import { OFFICIAL_IMAGE_OVERRIDES } from '../../src/data/imageOverrides.js';
import { isPlaceholderProductImage } from '../../src/utils/resolveProductImage.js';

const PUBLIC = fileURLToPath(new URL('../../public/', import.meta.url));
const offline = process.argv.includes('--offline');

/** Width x height from PNG, JPEG, GIF or WebP bytes; null when unknown. */
export function imageSize(b) {
  if (b.length > 24 && b.readUInt32BE(0) === 0x89504e47) return [b.readUInt32BE(16), b.readUInt32BE(20)];
  if (b.length > 10 && b.toString('ascii', 0, 3) === 'GIF') return [b.readUInt16LE(6), b.readUInt16LE(8)];
  if (b.length > 30 && b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') {
    const kind = b.toString('ascii', 12, 16);
    if (kind === 'VP8X') return [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)];
    if (kind === 'VP8 ') return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
    if (kind === 'VP8L') { const n = b.readUInt32LE(21); return [1 + (n & 0x3fff), 1 + ((n >> 14) & 0x3fff)]; }
  }
  if (b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) { i += 1; continue; }
      const m = b[i + 1];
      if (m >= 0xc0 && m <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(m)) return [b.readUInt16BE(i + 7), b.readUInt16BE(i + 5)];
      i += 2 + b.readUInt16BE(i + 2);
    }
  }
  return null;
}

async function check(src) {
  if (!src) return { status: 'missing' };
  if (src.startsWith('/')) {
    const file = PUBLIC + src.split('?')[0].replace(/^\//, '');
    if (!existsSync(file)) return { status: 404 };
    const b = readFileSync(file);
    return { status: 200, bytes: b.length, size: imageSize(b) };
  }
  if (offline) return { status: 'not-checked' };
  try {
    const r = await fetch(src, { signal: AbortSignal.timeout(15000), headers: { Accept: 'image/*' } });
    const b = Buffer.from(await r.arrayBuffer());
    return { status: r.status, type: r.headers.get('content-type') || '', bytes: b.length, size: imageSize(b) };
  } catch (e) {
    return { status: 'error', error: String(e?.cause?.code || e?.message || e) };
  }
}

const rows = [];
for (const raw of ALL_PRODUCTS) {
  const p = applyCatalogCorrections(raw);
  const local = PRODUCT_IMAGE_OVERRIDES[p.id];
  const official = OFFICIAL_IMAGE_OVERRIDES[p.id];
  const shown = (typeof local === 'string' ? local : local?.cover) || official?.src || String(p.image || '').trim();
  const via = local ? 'local-packshot' : official ? 'official-override' : 'stored';
  const res = await check(shown);
  const flags = [];
  if (!shown) flags.push('missing');
  else if (isPlaceholderProductImage(shown, p.type === 'digital')) flags.push('placeholder');
  if (res.status !== 200 && res.status !== 'not-checked' && shown) flags.push('unreachable');
  if (res.size && Math.min(...res.size) < 400) flags.push('low-res');
  rows.push({ id: p.id, name: p.name, brand: p.brand || '', type: p.type || '', via, image: shown, ...res, flags });
}
process.stdout.write(`${JSON.stringify(rows, null, 1)}\n`);
const flagged = rows.filter((r) => r.flags.length);
console.error(`${rows.length} products, ${flagged.length} flagged`);
for (const r of flagged) console.error(`  ${r.id}: ${r.flags.join(', ')}`);
