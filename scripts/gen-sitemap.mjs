// Writes public/sitemap.xml before each build: public pages, every listed
// product, and every Library read. Product URLs use the same route keys as the
// site (src/utils/productRoute.js). Account pages are left out.
import fs from 'node:fs';
import { ALL_PRODUCTS, isTeenProduct } from '../src/data/products.js';
import { productHref } from '../src/utils/productRoute.js';

const SITE = 'https://www.aynahealth.co';
const STATIC = ['/', '/shop', '/library', '/community', '/about', '/how-it-works', '/how-we-make-money', '/partners', '/contact', '/privacy-policy', '/terms-of-use', '/consumer-health-data', '/quiz'];
const articlesSrc = fs.readFileSync(new URL('../src/components/Articles.jsx', import.meta.url), 'utf8');
const start = articlesSrc.indexOf('const ARTICLES = [');
const articleIds = start < 0 ? [] : [...articlesSrc.slice(start).matchAll(/\n {2}\{\s*\n?\s*id: '([^']+)'/g)].map((m) => m[1]);
const products = ALL_PRODUCTS.filter((p) => p?.id && p?.name && !isTeenProduct(p));
const urls = [...new Set([
  ...STATIC,
  ...products.map((p) => productHref(p)).filter((u) => u && u !== '/'),
  ...articleIds.map((id) => `/library/${encodeURIComponent(id)}`),
])];
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${esc(SITE + u)}</loc></url>`).join('\n')}\n</urlset>\n`;
fs.writeFileSync(new URL('../public/sitemap.xml', import.meta.url), xml);
console.log(`sitemap.xml: ${urls.length} urls (${products.length} products, ${articleIds.length} reads)`);
