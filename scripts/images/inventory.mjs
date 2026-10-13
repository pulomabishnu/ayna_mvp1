// Inventory every physical catalog product image (id, brand, name, host, url).
// Usage: node scripts/images/inventory.mjs > /tmp/inventory.json
import { ALL_PRODUCTS } from '../../src/data/products.js';
const rows = ALL_PRODUCTS.map((p) => {
  const image = String(p.image || '').trim();
  let host = '';
  try { host = image.startsWith('/') ? 'local' : new URL(image).host; } catch { host = image ? 'invalid' : ''; }
  return { id: p.id, type: p.type || '', brand: p.brand || '', name: p.name || '', host, image, url: p.url || "" };
});
process.stdout.write(JSON.stringify(rows, null, 1));
