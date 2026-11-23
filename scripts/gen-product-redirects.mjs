// Writes 301 redirects into vercel.json from old ID product URLs (/product/p-lola-tampon) to the
// readable ones (/product/lola-organic-tampons). Search Console (Nov 12) still shows the old ID
// URLs getting impressions; a 301 moves their ranking to the page the sitemap lists.
// Run after adding products: node scripts/gen-product-redirects.mjs  (a test checks it is current)
import fs from 'node:fs';
import { ALL_PRODUCTS, isTeenProduct } from '../src/data/products.js';
import { productRouteKey } from '../src/utils/productRoute.js';

/** Product renames after launch (old readable slug -> product id), so shared links keep working. */
export const RENAMED_SLUGS = {
  // "The Lava Ritual Bundle" -> "Lava Ritual Bundle" (Eliz, 2026-11-24); the old URL was in the sitemap for a day.
  'lava-the-lava-ritual-bundle': 'p-lava-ritual-bundle',
};

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
  // Readable URLs that were live before a product was renamed: old slug -> product id.
  for (const [oldSlug, id] of Object.entries(RENAMED_SLUGS)) {
    const p = ALL_PRODUCTS.find((x) => x.id === id);
    const slug = p && productRouteKey(p);
    if (slug && slug !== oldSlug) out.push({ source: `/product/${oldSlug}`, destination: `/product/${slug}`, permanent: true });
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
