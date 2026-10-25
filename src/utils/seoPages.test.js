import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { SEO_PAGES, HOME_TITLE, HOME_DESCRIPTION, NOINDEX_SECTIONS, isNoindexPath, organizationJsonLd, websiteJsonLd, readBreadcrumbJsonLd } from './seoPages.js';
import { LEGACY_REDIRECTS } from '../components/nav/mainTabs.js';
import { breadcrumbJsonLd } from '../components/pdp/commerce.js';

const vercel = JSON.parse(fs.readFileSync(new URL('../../vercel.json', import.meta.url), 'utf8'));
const robots = fs.readFileSync(new URL('../../public/robots.txt', import.meta.url), 'utf8');
const shell = fs.readFileSync(new URL('../../index.html', import.meta.url), 'utf8');

describe('site page titles and descriptions', () => {
  const all = [[HOME_TITLE, HOME_DESCRIPTION], ...Object.values(SEO_PAGES)];
  it.each(all)('%s', (title, description) => {
    expect(title.length).toBeLessThanOrEqual(62);
    expect(description.length).toBeGreaterThan(20);
    expect(description.length).toBeLessThanOrEqual(160);
    expect(`${title} ${description}`).not.toMatch(/\u2014/);
  });
  it('every title is unique', () => {
    const titles = all.map(([t]) => t);
    expect(new Set(titles).size).toBe(titles.length);
  });
  it('index.html carries the home title and description', () => {
    expect(shell).toContain(`<title>${HOME_TITLE}</title>`);
    expect(shell).toContain(`content="${HOME_DESCRIPTION}"`);
  });
  it('no public page is an old address that now redirects, or a personal page', () => {
    for (const p of Object.keys(SEO_PAGES)) {
      expect(LEGACY_REDIRECTS[p]).toBeUndefined();
      expect(isNoindexPath(p)).toBe(false);
    }
  });
});

describe('personal pages stay out of search', () => {
  it.each(['/today', '/ask', '/you', '/you/ecosystem', '/you/saved', '/community/@someone', '/community/p/abc', '/auth/callback', '/a/abcdefghij'])('%s is noindex', (p) => {
    expect(isNoindexPath(p)).toBe(true);
  });
  it.each(['/', '/explore', '/explore/products', '/community', '/product/saalt-menstrual-cup', '/library/uti-prevention'])('%s is indexable', (p) => {
    expect(isNoindexPath(p)).toBe(false);
  });
  it('vercel.json sends X-Robots-Tag: noindex for every personal section', () => {
    const noindex = vercel.headers.filter((h) => h.headers.some((x) => x.key === 'X-Robots-Tag' && /noindex/.test(x.value))).map((h) => h.source);
    const alt = noindex.map((s) => s.match(/^\/:page\(([^)]+)\)$/)?.[1]).find(Boolean)?.split('|') || [];
    const altRest = noindex.map((s) => s.match(/^\/:page\(([^)]+)\)\/:rest\*$/)?.[1]).find(Boolean)?.split('|') || [];
    for (const s of NOINDEX_SECTIONS) { expect(alt).toContain(s); expect(altRest).toContain(s); }
    expect(noindex).toContain('/community/:rest+');
  });
  it('robots.txt does not block pages whose noindex or redirect crawlers must see', () => {
    const disallowed = [...robots.matchAll(/^Disallow:\s*(\S+)/gm)].map((m) => m[1]);
    expect(disallowed).toEqual(['/api/']);
  });
});

describe('old addresses redirect permanently', () => {
  it.each(Object.entries(LEGACY_REDIRECTS))('%s -> %s', (from, to) => {
    const r = vercel.redirects.find((x) => x.source === from && !x.has);
    expect(r?.destination).toBe(to);
    expect(r?.permanent).toBe(true);
  });
  it('Library reads keep their address (only /library itself redirects)', () => {
    expect(vercel.redirects.some((r) => /^\/library\/./.test(r.source))).toBe(false);
  });
});

describe('structured data', () => {
  it('Organization and WebSite use the production address and only facts on file', () => {
    const org = organizationJsonLd();
    expect(org['@type']).toBe('Organization');
    expect(org.url).toBe('https://www.aynahealth.co/');
    expect(org.sameAs).toBeUndefined();
    const site = websiteJsonLd();
    expect(site.potentialAction.target.urlTemplate).toBe('https://www.aynahealth.co/explore?q={search_term_string}');
  });
  it('a read breadcrumb goes Explore > Resources > read', () => {
    const b = readBreadcrumbJsonLd('uti-prevention', 'UTI Prevention');
    expect(b.itemListElement.map((x) => x.name)).toEqual(['Explore', 'Resources', 'UTI Prevention']);
    expect(b.itemListElement[2].item).toBeUndefined();
  });
  it('a product breadcrumb never points at an old address, and each level has its own', () => {
    const b = breadcrumbJsonLd({ id: 'x', name: 'Test cup', category: 'cup' });
    const items = b.itemListElement.map((x) => x.item).filter(Boolean);
    expect(items.every((u) => !/\/(shop|library|discovery)$/.test(u))).toBe(true);
    expect(new Set(items).size).toBe(items.length);
  });
});
