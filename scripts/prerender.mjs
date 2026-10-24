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

const SITE = 'https://www.aynahealth.co';
const DIST = new URL('../dist/', import.meta.url);
const shell = fs.readFileSync(new URL('index.html', DIST), 'utf8');

const DEFAULT_TITLE = "ayna | Personalized Women's Health Product Discovery";
const PAGES = {
  // /shop and /library are permanent redirects now (vercel.json): Explore > Products and Resources.
  '/explore': ['Explore | ayna', "Explore women's health: search products, symptoms, topics, services and plain-language reads."],
  '/explore/products': ['Products | ayna', "Shop women's health products ranked by how well they fit you: period care, intimate care, fertility, menopause and more."],
  '/explore/resources': ['Resources | ayna', "Plain-language guides to women's health topics, with sources, from the ayna Library."],
  '/community': ['Community | ayna', "Real experiences with women's health products from the ayna community."],
  '/about': ['About | ayna', "Women's wellness products matched to your needs, with the research and reviews beside them. Meet ayna's founders and advisors."],
  '/how-it-works': ['How it works | ayna', 'How ayna matches products to you: your profile, the market, the evidence and your shop.'],
  '/how-we-make-money': ['How we make money | ayna', 'How ayna earns money, and why it never changes your matches.'],
  '/partners': ['Partner brands | ayna', 'The brands ayna works with, and how partnerships are disclosed.'],
  '/contact': ['Contact | ayna', 'Get in touch with the ayna team.'],
  '/privacy-policy': ['Privacy Policy | ayna', 'How ayna collects, uses and protects your information.'],
  '/terms-of-use': ['Terms of Use | ayna', 'The terms for using ayna.'],
  '/consumer-health-data': ['Consumer Health Data Privacy Notice | ayna', 'How ayna handles consumer health data.'],
  '/campus-resources': ['Campus resources | ayna', 'Find verified sexual assault support, advocacy, reporting, medical, and campus resources for your college or university.'],
  '/quiz': ['Get matched | ayna', 'Answer six questions and get health products matched to your body.'],
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

function page(url, title, description, { image = null, noindex = false, jsonLd = '', body = '' } = {}) {
  let html = shell;
  // Replacement functions, not strings: catalog text has "$" (prices), which a replacement string would read as a group reference.
  const set = (re, tag) => { html = re.test(html) ? html.replace(re, () => tag) : html.replace('</head>', () => `  ${tag}\n</head>`); };
  set(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`);
  set(/<meta name="description"[^>]*>/, `<meta name="description" content="${esc(description)}" />`);
  set(/<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${esc(title)}" />`);
  set(/<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${esc(description)}" />`);
  if (image) set(/<meta property="og:image"[^>]*>/, `<meta property="og:image" content="${esc(image)}" />`);
  if (url) {
    set(/<meta property="og:url"[^>]*>/, `<meta property="og:url" content="${esc(SITE + url)}" />`);
    set(/<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${esc(SITE + (url === '/' ? '/' : url))}" />`);
  }
  if (noindex) set(/<meta name="robots"[^>]*>/, '<meta name="robots" content="noindex" />');
  if (jsonLd) html = html.replace('</head>', () => `  ${jsonLd}\n</head>`);
  // Readable without JavaScript (crawlers that don't run it); React replaces it on load.
  if (url && url !== '/') html = html.replace(/<body([^>]*)>/, (_, attrs) => `<body${attrs}>\n  <noscript>${body || `<h1>${esc(title.replace(/ \| ayna( Library)?$/, ''))}</h1><p>${esc(description)}</p>`}</noscript>`);
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

// Home: the first hero photo starts with the HTML (the right width via imagesrcset).
// dist/index.html is also the shell for routes without their own page, so it
// is a small AVIF (15KB at 390w, 20KB at 480w, 49KB at 736w; the source is 736px).
{
  const shellFile = new URL('index.html', DIST);
  const heroPreload = '<link rel="preload" as="image" type="image/avif" fetchpriority="high" imagesrcset="/landing/pink-stripe-floor-390.avif 390w, /landing/pink-stripe-floor-480.avif 480w, /landing/pink-stripe-floor.avif 736w" imagesizes="(max-width: 767px) 68vw, (max-width: 1279px) 40vw, 460px" />';
  const html = fs.readFileSync(shellFile, 'utf8');
  if (!html.includes('pink-stripe-floor-480.avif') && fs.existsSync(new URL('landing/pink-stripe-floor-480.avif', DIST))) fs.writeFileSync(shellFile, withHead(html, heroPreload));
}

let count = 0;
for (const [url, [title, desc]] of Object.entries(PAGES)) { write(url, withHead(page(url, title, desc), url === '/explore/products' ? SHOP_PRELOAD : '')); count += 1; }

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
  write(url, page(url, `${headline} | ayna Library`, description, { image: absImage(image), jsonLd: jsonLdTag('ay-read-jsonld', [ld]), body }));
  count += 1;
}

// Real 404 page: same app shell (it shows ayna's "Page not found"), never indexed.
fs.writeFileSync(new URL('404.html', DIST), page(null, 'Page not found | ayna', "This page doesn't exist on ayna.", { noindex: true }));
console.log(`prerender: ${count} pages + 404.html (default title kept for /: ${DEFAULT_TITLE})`);
