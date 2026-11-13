// Writes 301 redirects into vercel.json from old ID product URLs (/product/p-lola-tampon) to the
// readable ones (/product/lola-organic-tampons). Search Console (Nov 12) still shows the old ID
// URLs getting impressions; a 301 moves their ranking to the page the sitemap lists.
// Run after adding products: node scripts/gen-product-redirects.mjs  (a test checks it is current)
import fs from 'node:fs';
import { ALL_PRODUCTS, isTeenProduct } from '../src/data/products.js';
import { productRouteKey } from '../src/utils/productRoute.js';

export function productRedirects() {
  const seen = new Set();
  const out = [];
  for (const p of ALL_PRODUCTS) {
    if (!p?.id || !p?.name || isTeenProduct(p)) continue;
    const slug = productRouteKey(p);
    if (!slug || slug === p.id || seen.has(p.id)) continue;
    seen.add(p.id);
    out.push({ source: `/product/${p.id}`, destination: `/product/${slug}`, permanent: true });
  }
  return out.sort((a, b) => a.source.localeCompare(b.source));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const file = new URL('../vercel.json', import.meta.url);
  const cfg = JSON.parse(fs.readFileSync(file, 'utf8'));
  const keep = (cfg.redirects || []).filter((r) => !/^\/product\/[^/:]+$/.test(r.source));
  cfg.redirects = [...keep, ...productRedirects()];
  fs.writeFileSync(file, `${JSON.stringify(cfg, null, 2)}\n`);
  console.log(`vercel.json: ${cfg.redirects.length} redirects (${cfg.redirects.length - keep.length} product ID redirects)`);
}
