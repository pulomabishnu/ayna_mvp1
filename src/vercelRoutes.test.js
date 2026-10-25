import { describe, it, expect } from 'vitest';
import fs from 'node:fs';

// Real 404s (audit B2): vercel.json no longer sends EVERY address to the app,
// only the app's own pages. Any page added to App.jsx must be listed there too,
// or it would 404 in production. This test fails if one is missing.
const app = fs.readFileSync(new URL('./App.jsx', import.meta.url), 'utf8');
const vercel = JSON.parse(fs.readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));

describe('vercel.json serves every app route', () => {
  const block = app.slice(app.indexOf('const VIEW_TO_PATH = {'), app.indexOf('};', app.indexOf('const VIEW_TO_PATH = {')));
  const paths = new Set([...block.matchAll(/:\s*'(\/[^']*)'/g)].map((m) => m[1]));
  for (const m of app.matchAll(/PATH_TO_VIEW\['(\/[^']*)'\]/g)) paths.add(m[1]);
  ['/product/some-product', '/library/heavy-bleeding', '/community/@ameera', '/community/p/abc', '/mobile-preview'].forEach((p) => paths.add(p));
  paths.delete('/');
  const pages = vercel.rewrites.filter((r) => r.destination === '/index.html').map((r) => r.source.match(/^\/:page\(([^)]+)\)/)?.[1].split('|') || []).flat();
  it.each([...paths])('%s', (p) => {
    expect(pages).toContain(p.replace(/^\//, '').split('/')[0]);
  });
  it('has no catch-all rewrite (unknown addresses get a real 404)', () => {
    expect(vercel.rewrites.some((r) => r.source === '/(.*)')).toBe(false);
  });
});

describe('one origin for sign-in', () => {
  it('sends aynahealth.co to www.aynahealth.co, keeping the path', () => {
    const r = (vercel.redirects || []).find((x) => x.has?.some((h) => h.type === 'host' && h.value === 'aynahealth.co'));
    expect(r).toMatchObject({ source: '/:path*', destination: 'https://www.aynahealth.co/:path*', permanent: true });
  });
  it('the page itself also moves an apex visit to www', () => {
    const main = fs.readFileSync(new URL('./main.jsx', import.meta.url), 'utf8');
    expect(main).toMatch(/hostname === 'aynahealth\.co'/);
  });
});
