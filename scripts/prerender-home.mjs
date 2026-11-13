// Prerenders the website home page (/) into dist/index.html, so a guest sees the real landing,
// headline first, as soon as the stylesheet arrives instead of after ~4 MB of JavaScript has run
// (PageSpeed mobile, Nov 12: LCP 5.9s, the headline was drawn by JavaScript).
//
// Loads App.jsx through Vite's own SSR loader (JSX, CSS imports and import.meta.env, like the app build).
// The markup sits in <div data-ay-pre> inside #root. It is shown only when boot.js marks the
// page as "guest on /" (html.ay-pre): dist/index.html is also the shell for app-only routes and
// for the iOS app, and a signed-in visitor gets their own landing, so those never see it.
// React then renders the page as usual and replaces it (same markup, same rain seed, no shift).
import fs from 'node:fs';
import { JSDOM } from 'jsdom';
import Beasties from 'beasties';
import { createServer } from 'vite';

const DIST = new URL('../dist/', import.meta.url);
const file = new URL('index.html', DIST);

const dom = new JSDOM('<!doctype html><html><head></head><body><div id="root"></div></body></html>', { url: 'https://www.aynahealth.co/', pretendToBeVisual: true });
const w = dom.window;
const g = globalThis;
const put = (k, v) => { try { Object.defineProperty(g, k, { value: v, configurable: true, writable: true }); } catch { /* read-only global */ } };
for (const k of ['window', 'document', 'localStorage', 'sessionStorage', 'location', 'history', 'screen', 'HTMLElement', 'Element', 'Node', 'getComputedStyle', 'CustomEvent', 'Event', 'navigator']) put(k, w[k]);
const noopObserver = class { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } };
w.matchMedia = () => ({ matches: false, media: '', addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
put('matchMedia', w.matchMedia);
put('IntersectionObserver', noopObserver); w.IntersectionObserver = noopObserver;
put('ResizeObserver', noopObserver); w.ResizeObserver = noopObserver;
put('requestAnimationFrame', (f) => setTimeout(f, 0)); put('cancelAnimationFrame', clearTimeout);

const quiet = console.warn; console.warn = () => {};
let html = '';
try {
  const vite = await createServer({ root: new URL('..', import.meta.url).pathname, logLevel: 'silent', appType: 'custom', server: { middlewareMode: true, hmr: false, watch: null }, optimizeDeps: { noDiscovery: true, include: [] } });
  const React = (await import('react')).default;
  const { prerenderToNodeStream } = await import('react-dom/static');
  const App = (await vite.ssrLoadModule('/src/App.jsx')).default;
  const { prelude } = await prerenderToNodeStream(React.createElement(App));
  for await (const chunk of prelude) html += chunk;
} catch (e) {
  console.warn = quiet;
  console.warn(`prerender-home: skipped (${e?.message || e}). The home page still works, it just paints after the code loads.`);
  process.exit(0);
}
console.warn = quiet;

// Only ship it if it is the guest landing with its headline (never a skeleton or an error page).
if (!/<h1[^>]*id="hm-hero-title"/.test(html) || /ay-home-skeleton/.test(html)) {
  console.warn('prerender-home: skipped (the render was not the guest landing).');
  process.exit(0);
}
// Hoisted <title>/<meta>/<link> tags belong to the head the shell already has.
html = html.replace(/<title>[^<]*<\/title>|<meta\b[^>]*>|<link\b[^>]*>/g, '');

// Images load lazily inside the prerendered copy, so a visitor who never sees it (signed in, another
// route, the iOS app: it stays display:none) doesn't download the hero's product photos for nothing.
// For a guest on / they are on screen, so lazy loading fetches them straight away.
html = html.replace(/<img\b([^>]*?)\s*\/?>/g, (m, attrs) => `<img${attrs.replace(/\sloading="[^"]*"/, '')} loading="lazy">`);

let page = fs.readFileSync(file, 'utf8');
if (!page.includes('<div id="root">') || page.includes('data-ay-pre')) { console.warn('prerender-home: skipped (no #root, or already prerendered).'); process.exit(0); }
// Before the loading dots (#ay-boot), which a guest on / no longer needs to see.
page = page.replace('<div id="root">', () => `<div id="root"><div data-ay-pre>${html}</div>`);
page = page.replace('</head>', () => '  <style>html:not(.ay-pre) [data-ay-pre]{display:none}html.ay-pre #ay-boot{display:none}</style>\n</head>');

// Critical CSS (beasties): the rules this landing uses go inline, before the stylesheet link so
// the full stylesheet still wins in its own order. The full stylesheet (2 MB) then loads without
// blocking the first paint: media="print" until it arrives, switched on by boot.js (guest on /)
// or awaited by main.jsx before React renders anything else (other routes, the iOS app).
const css = page.match(/<link rel="stylesheet" crossorigin href="(\/assets\/index-[^"]+\.css)">/);
if (css) {
  const beasties = new Beasties({ path: DIST.pathname, publicPath: '/', preload: false, inlineFonts: false, pruneSource: false, reduceInlineStyles: false, compress: true, logLevel: 'silent' });
  const before = page.length;
  page = await beasties.process(page);
  page = page.replace(css[0], () => `<link rel="stylesheet" crossorigin href="${css[1]}" media="print" data-ay-css>`);
  console.log(`prerender-home: ${Math.round((page.length - before) / 1024)} KB of critical CSS inline; the full stylesheet no longer blocks the first paint`);
}
fs.writeFileSync(file, page);
console.log(`prerender-home: / painted from HTML (${Math.round(html.length / 1024)} KB of markup)`);
process.exit(0);
