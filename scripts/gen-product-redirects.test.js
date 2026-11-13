import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { productRedirects } from './gen-product-redirects.mjs';

describe('old product ID URLs 301 to the readable URL (Search Console, Nov 12)', () => {
  const cfg = JSON.parse(fs.readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));
  const inConfig = cfg.redirects.filter((r) => /^\/product\/[^/:]+$/.test(r.source));
  it('vercel.json is current: run node scripts/gen-product-redirects.mjs after adding products', () => {
    expect(inConfig).toEqual(productRedirects());
  });
  it('the URLs Google already shows go to the page in the sitemap', () => {
    const to = Object.fromEntries(inConfig.map((r) => [r.source, r.destination]));
    expect(to['/product/p-proof-period']).toBe('/product/proof-period-underwear');
    expect(to['/product/p-lola-tampon']).toBe('/product/lola-organic-tampons');
    const sitemap = fs.readFileSync(new URL('../public/sitemap.xml', import.meta.url), 'utf8');
    for (const r of inConfig) expect(sitemap).toContain(`https://www.aynahealth.co${r.destination}<`);
    expect(inConfig.every((r) => !inConfig.some((x) => x.destination === r.source))).toBe(true);
  });
});
