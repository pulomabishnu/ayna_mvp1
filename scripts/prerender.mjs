// Runs after `vite build`. Writes one HTML file per public page into dist/ so
// each address has its own title, description, canonical link and share card
// (link previews in iMessage, Slack, Instagram and LinkedIn don't run
// JavaScript, so before this every shared ayna link looked the same).
// Also writes dist/404.html, which Vercel serves with a real 404 status for
// any address that isn't a page (see the rewrites in vercel.json).
// The app itself is unchanged: React renders over the same shell as before.
import fs from 'node:fs';
import path from 'node:path';
import { ALL_PRODUCTS, isTeenProduct } from '../src/data/products.js';
import { productHref } from '../src/utils/productRoute.js';
import { productSeoTitle, productSeoDescription } from '../src/utils/seoMeta.js';
import { productJsonLd, breadcrumbJsonLd } from '../src/components/pdp/commerce.js';
import { resolveBuyUrl } from '../src/utils/buyLink.js';
import { buildHeroSeed } from '../src/components/pdp/heroSeed.js';
import { SEO_PAGES, HOME_TITLE, organizationJsonLd, websiteJsonLd, readBreadcrumbJsonLd } from '../src/utils/seoPages.js';

const SITE = 'https://www.aynahealth.co';
const DIST = new URL('../dist/', import.meta.url);
const shell = fs.readFileSync(new URL('index.html', DIST), 'utf8');

// Titles and descriptions for the site's own pages live in src/utils/seoPages.js
// (the app's title effect uses the same list). /shop and /library are permanent
// redirects (vercel.json) to Explore > Products and Resources, so they have no page.
const PAGES = SEO_PAGES;
// Personal pages get a noindex page of their own as well as the X-Robots-Tag
// header (vercel.json), so the rule is in the HTML even without that header.
const NOINDEX_PAGES = {
  '/today': ['Today | ayna', 'Today with ayna: what matters for you today, and your daily log.'],
  '/ask': ['Ask ayna', 'Ask ayna about your health and the products you use.'],
  '/you': ['You | ayna', 'Your profile, saved products, ecosystem and settings on ayna.'],
};

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const clip = (s, n = 160) => { const t = String(s || '').replace(/\s+/g, ' ').trim(); return t.length > n ? `${t.slice(0, n - 1).replace(/\s+\S*$/, '')}…` : t; };

// JSON-LD for <head>. "<" is escaped so catalog text can never close the tag.
// The id matches what the page itself sets on load (useJsonLd), so React
// replaces this copy instead of adding a second one.
const jsonLdTag = (id, data) => {
  const list = (data || []).filter(Boolean);
  if (!list.length) return '';
  return `<script type="application/ld+json" id="${id}">${JSON.stringify(list.length === 1 ? list[0] : list).replace(/</g, '\\u003c')}</script>`;
};

function page(url, title, description, { image = null, noindex = false, jsonLd = '', body = '', ogType = '' } = {}) {
  let html = shell;
  // Replacement functions, not strings: catalog text has "$" (prices), which a replacement string would read as a group reference.
  const set = (re, tag) => { html = re.test(html) ? html.replace(re, () => tag) : html.replace('</head>', () => `  ${tag}\n</head>`); };
  set(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`);
  set(/<meta name="description"[^>]*>/, `<meta name="description" content="${esc(description)}" />`);
  set(/<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${esc(title)}" />`);
  set(/<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${esc(description)}" />`);
  if (image) set(/<meta property="og:image"[^>]*>/, `<meta property="og:image" content="${esc(image)}" />`);
  if (ogType) set(/<meta property="og:type"[^>]*>/, `<meta property="og:type" content="${esc(ogType)}" />`);
  if (url) {
    set(/<meta property="og:url"[^>]*>/, `<meta property="og:url" content="${esc(SITE + url)}" />`);
    set(/<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${esc(SITE + (url === '/' ? '/' : url))}" />`);
  }
  if (noindex) set(/<meta name="robots"[^>]*>/, '<meta name="robots" content="noindex" />');
  if (jsonLd) html = html.replace('</head>', () => `  ${jsonLd}\n</head>`);
  // Readable without JavaScript (crawlers that don't run it); React replaces it on load.
  if (url && url !== '/' && !noindex) html = html.replace(/<body([^>]*)>/, (_, attrs) => `<body${attrs}>\n  <noscript>${body || `<h1>${esc(title.replace(/ \| ayna( Library)?$/, ''))}</h1><p>${esc(description)}</p>`}</noscript>`);
  return html;
}

function write(url, html) {
  const file = path.join(DIST.pathname, url.replace(/^\//, ''), 'index.html');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
}

// Route chunks to fetch in parallel with the entry script (perf, pass 2):
// without these, the Shop and product page code only starts downloading after
// the entry has run. Found by the chunk name Vite gives each lazy import.
const ASSETS = fs.existsSync(new URL('assets/', DIST)) ? fs.readdirSync(new URL('assets/', DIST)) : [];
// A chunk plus the chunks it imports statically (read from its own import
// lines), so the whole route arrives in one round trip instead of a waterfall.
const staticDeps = (file, seen = new Set()) => {
  if (seen.has(file)) return seen;
  seen.add(file);
  let code = '';
  try { code = fs.readFileSync(new URL(`assets/${file}`, DIST), 'utf8').slice(0, 4000); } catch { return seen; }
  for (const m of code.matchAll(/(?:import|from)\s*["']\.\/([\w.-]+\.js)["']/g)) if (!/^(index|vendor-)/.test(m[1])) staticDeps(m[1], seen);
  return seen;
};
const chunkLinks = (name) => {
  const own = ASSETS.filter((f) => f.startsWith(`${name}-`) && /\.(js|css)$/.test(f));
  const js = new Set(own.filter((f) => f.endsWith('.js')).flatMap((f) => [...staticDeps(f)]));
  return [...[...js].map((f) => `<link rel="modulepreload" crossorigin href="/assets/${f}" />`), ...own.filter((f) => f.endsWith('.css')).map((f) => `<link rel="preload" as="style" href="/assets/${f}" />`)].join('\n  ');
};
// Everything Vite loads for a lazy page: its JS and CSS, read from the entry's
// __vite__mapDeps table. Vite waits for a lazy page's CSS before running it,
// so CSS it doesn't preload here (the shared chunks' styles) starts late and
// holds the page back (perf: about 0.4s on a throttled phone's product page).
// The catalog chunk (products-*.js) is in these lists, so it downloads with the entry.
const entryFile = (shell.match(/<script type="module"[^>]*src="\/assets\/([^"]+\.js)"/) || [])[1];
const entryCode = entryFile ? fs.readFileSync(new URL(`assets/${entryFile}`, DIST), 'utf8') : '';
const depTable = (() => { try { return JSON.parse((entryCode.match(/m\.f=(\[[^\]]*\])/) || [])[1] || 'null'); } catch { return null; } })();
const inShell = new Set([...shell.matchAll(/(?:src|href)="\/(assets\/[^"]+)"/g)].map((m) => m[1]));
const routeLinks = (name, { cssRel = 'preload' } = {}) => {
  const m = depTable && entryCode.match(new RegExp(`import\\("\\./(${name}-[\\w-]+\\.js)"\\),__vite__mapDeps\\(\\[([\\d,]+)\\]\\)`));
  if (!m) return chunkLinks(name);
  const files = [...new Set([`assets/${m[1]}`, ...m[2].split(',').map((i) => depTable[Number(i)])])].filter((f) => f && !inShell.has(f));
  return [
    ...files.filter((f) => f.endsWith('.js')).map((f) => `<link rel="modulepreload" crossorigin href="/${f}" />`),
    ...files.filter((f) => f.endsWith('.css')).map((f) => (cssRel === 'stylesheet' ? `<link rel="stylesheet" crossorigin href="/${f}" />` : `<link rel="preload" as="style" href="/${f}" />`)),
  ].join('\n  ');
};
const withHead = (html, extra) => (extra ? html.replace('</head>', () => `  ${extra}\n</head>`) : html);
// Shop on a phone shows its first products on the first screen (final layout
// pass, P1-3), so the catalog chunk is that page's LCP path: it starts with the
// HTML instead of after the entry has run (it was 1.5s late on a throttled phone).
const CATALOG_CHUNK = ASSETS.find((f) => /^products-[\w-]+\.js$/.test(f));
// The Shop grid also waits for the search engine (utils/search/index.js, its own
// index-*.js chunk that imports the catalog), so it starts with the HTML too.
const SEARCH_CHUNK = CATALOG_CHUNK && ASSETS.find((f) => { if (!/^index-[\w-]+\.js$/.test(f)) return false; try { const head = fs.readFileSync(new URL(`assets/${f}`, DIST), 'utf8').slice(0, 3000); return head.includes(`from"./${CATALOG_CHUNK}"`) && head.includes('naturalLanguageSearch'); } catch { return false; } });
const SHOP_PRELOAD = [routeLinks('Discovery'), ...[CATALOG_CHUNK, SEARCH_CHUNK].filter(Boolean).map((f) => `<link rel="modulepreload" crossorigin href="/assets/${f}" />`)].join('\n  ');
// Product pages paint their hero before the page code runs (ProductHeroPreview),
// so the product page styles apply from the start (about 37KB, beside index.css).
const PDP_PRELOAD = routeLinks('ProductModal', { cssRel: 'stylesheet' });

// Home (dist/index.html, also the shell for app-only routes). The old hero
// photo preload (/landing/pink-stripe-floor*.avif) is gone: the landing hero is
// the product scatter now and no page shows that photo, so the preload only
// competed with what the page does paint. The new animated hero should add its
// own preload here only for an image that is its largest paint.
{
  const shellFile = new URL('index.html', DIST);
  let html = fs.readFileSync(shellFile, 'utf8');
  // Who runs the site and what it is called (Google uses the WebSite name as the site name).
  // These two describe the site, so they hold on any route the shell serves.
  if (!html.includes('id="ay-site-jsonld"')) html = withHead(html, jsonLdTag('ay-site-jsonld', [organizationJsonLd(), websiteJsonLd()]));
  fs.writeFileSync(shellFile, html);
}

let count = 0;
for (const [url, [title, desc]] of Object.entries(PAGES)) { write(url, withHead(page(url, title, desc), url === '/explore/products' ? SHOP_PRELOAD : '')); count += 1; }
for (const [url, [title, desc]] of Object.entries(NOINDEX_PAGES)) { write(url, page(url, title, desc, { noindex: true })); count += 1; }

const absImage = (src) => (!src ? null : /^https?:/i.test(src) ? src : `${SITE}${src.startsWith('/') ? '' : '/'}${src}`);
const asList = (v) => (Array.isArray(v) ? v : v ? [v] : []).map((x) => String(x ?? '').trim()).filter(Boolean);
const section = (heading, inner) => (inner ? `<h2>${esc(heading)}</h2>${inner}` : '');
const ul = (items) => (items.length ? `<ul>${items.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : '');

// The product page's own text (catalog fields, unchanged), one H1 and an H2
// per section, so a crawler without JavaScript reads the same page.
function productBody(p, description) {
  const how = p.howToUse && typeof p.howToUse === 'object' && !Array.isArray(p.howToUse) ? p.howToUse : { steps: asList(p.howToUse) };
  const howHtml = [how.intro ? `<p>${esc(how.intro)}</p>` : '', asList(how.steps).length ? `<ol>${asList(how.steps).map((t) => `<li>${esc(t)}</li>`).join('')}</ol>` : ''].join('');
  return [
    `<h1>${esc(p.name)}</h1>`,
    `<p>${esc(description)}</p>`,
    section('What it is', p.summary ? `<p>${esc(p.summary)}</p>` : ''),
    section("Who it's for", ul(asList(p.whoItsFor))),
    section('How to use it', howHtml),
    section('Safety notes', ul(asList(p.warnings))),
  ].join('');
}

const titles = new Map();
const descriptions = new Map();
for (const p of ALL_PRODUCTS) {
  if (!p?.id || !p?.name || isTeenProduct(p)) continue;
  const url = productHref(p);
  if (!url || url === '/') continue;
  // Same words the page sets when it loads (App.jsx uses the same helpers).
  const title = productSeoTitle(p);
  const description = productSeoDescription(p);
  titles.set(title, [...(titles.get(title) || []), p.id]);
  descriptions.set(description, [...(descriptions.get(description) || []), p.id]);
  let buyUrl = null;
  try { buyUrl = resolveBuyUrl(p); } catch { buyUrl = null; }
  const jsonLd = jsonLdTag('ay-pdp-jsonld', [
    productJsonLd(p, { origin: SITE, buyUrl, url: `${SITE}${url}` }),
    breadcrumbJsonLd(p, { origin: SITE }),
  ]);
  // The hero the page paints first (ProductHeroPreview), worked out with
  // ProductModal's own helpers. "<" escaped so catalog text can't close the tag.
  const seed = buildHeroSeed(p);
  const seedTag = seed ? `<script type="application/json" id="ay-product-seed">${JSON.stringify(seed).replace(/</g, '\\u003c')}</script>` : '';
  // The product photo is the page's largest paint: fetch it with the entry, not after it
  // (the same address the hero shows, which can be a cleaned-up studio photo).
  const heroSrc = seed?.image || (typeof p.image === 'string' ? p.image : '');
  const heroImg = heroSrc && /^(\/|https:\/\/)/.test(heroSrc) && !/\.svg(\?|$)/i.test(heroSrc) ? `<link rel="preload" as="image" fetchpriority="high" href="${esc(heroSrc)}" />` : '';
  write(url, withHead(page(url, title, description, { image: absImage(p.image), jsonLd, body: productBody(p, description) }), [PDP_PRELOAD, heroImg, seedTag].filter(Boolean).join('\n  ')));
  count += 1;
}
const dupes = (m) => [...m.entries()].filter(([, ids]) => ids.length > 1);
for (const [t, ids] of dupes(titles)) console.warn(`prerender: duplicate product title "${t}" (${ids.join(', ')})`);
for (const [d, ids] of dupes(descriptions)) console.warn(`prerender: duplicate product description (${ids.join(', ')}): ${d.slice(0, 60)}`);

const articlesSrc = fs.readFileSync(new URL('../src/components/Articles.jsx', import.meta.url), 'utf8');
const start = articlesSrc.indexOf('const ARTICLES = [');
// One chunk per article, so a title is never paired with another article's teaser.
const chunks = articlesSrc.slice(start).split(/\n {2}\{\s*\n\s*id: '/).slice(1);
const unq = (t) => String(t || '').replace(/\\'/g, "'");
// Visible text of a JSX snippet from Articles.jsx: tags, attributes and {' '} gaps removed.
const jsxText = (src) => src.replace(/\{' '\}/g, ' ').replace(/<[^>]*>/g, '').replace(/\{[^{}]*\}/g, '').replace(/\s+/g, ' ').trim();
for (const chunk of chunks) {
  const id = chunk.match(/^([^']+)'/)?.[1];
  const title = chunk.match(/\n\s*title: '((?:[^'\\]|\\.)+)',/)?.[1];
  const teaser = chunk.match(/\n\s*teaser: '((?:[^'\\]|\\.)+)',/)?.[1] || '';
  const image = chunk.match(/\n\s*image: '([^']+)',/)?.[1] || '';
  const tags = [...(chunk.match(/\n\s*tags: \[([^\]]*)\]/)?.[1] || '').matchAll(/'([^']+)'/g)].map((m) => m[1]);
  if (!id || !title) continue;
  const url = `/library/${id}`;
  const headline = unq(title);
  const description = clip(unq(teaser));
  // Author only when the read names its writer ("Written by Geena Yousry, MS1, ...").
  // Reads without a named writer are credited to ayna. No dates are on file, so none are claimed.
  const writer = chunk.match(/Written by ([^<.]+?)(?:, [^<.]*)?\.\s*</)?.[1]?.trim();
  const paras = [...chunk.matchAll(/<p>([\s\S]*?)<\/p>/g)].map((m) => jsxText(m[1])).filter((t) => t && !/^Sources:?$/.test(t));
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: headline.length > 110 ? clip(headline, 110) : headline,
    description,
    url: SITE + url,
    mainEntityOfPage: SITE + url,
    ...(image ? { image: [absImage(image)] } : {}),
    author: writer ? { '@type': 'Person', name: writer } : { '@type': 'Organization', name: 'ayna', url: SITE },
    publisher: { '@type': 'Organization', name: 'ayna', url: SITE, logo: { '@type': 'ImageObject', url: `${SITE}/ayna-app-icon-512.png` } },
    ...(tags.length ? { keywords: tags.join(', ') } : {}),
    isPartOf: { '@type': 'WebSite', name: 'ayna', url: SITE },
  };
  const body = `<h1>${esc(headline)}</h1>${writer ? `<p>By ${esc(writer)}</p>` : ''}${paras.slice(0, 2).map((t) => `<p>${esc(t)}</p>`).join('')}`;
  write(url, page(url, `${headline} | ayna Library`, description, { image: absImage(image), ogType: 'article', jsonLd: jsonLdTag('ay-read-jsonld', [ld, readBreadcrumbJsonLd(id, headline)]), body }));
  count += 1;
}

// Real 404 page: same app shell (it shows ayna's "Page not found"), never indexed.
fs.writeFileSync(new URL('404.html', DIST), page(null, 'Page not found | ayna', "This page doesn't exist on ayna.", { noindex: true }));
console.log(`prerender: ${count} pages + 404.html (home keeps the shell title: ${HOME_TITLE})`);
