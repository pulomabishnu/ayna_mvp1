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

const SITE = 'https://www.aynahealth.co';
const DIST = new URL('../dist/', import.meta.url);
const shell = fs.readFileSync(new URL('index.html', DIST), 'utf8');

const DEFAULT_TITLE = "ayna | Personalized Women's Health Product Discovery";
const PAGES = {
  '/shop': ['Shop | ayna', "Shop women's health products ranked by how well they fit you: period care, intimate care, fertility, menopause and more."],
  '/library': ['Library | ayna', "Plain-language guides to women's health topics, with sources, from the ayna Library."],
  '/community': ['Community | ayna', "Real experiences with women's health products from the ayna community."],
  '/about': ['About | ayna', "Women's wellness discovery, shaped around you. Meet the founders of ayna."],
  '/how-it-works': ['How It Works | ayna', 'How ayna matches products to you: your profile, the market, the evidence and your shop.'],
  '/how-we-make-money': ['How We Make Money | ayna', 'How ayna earns money, and why it never changes your matches.'],
  '/partners': ['Partner brands | ayna', 'The brands ayna works with, and how partnerships are disclosed.'],
  '/contact': ['Contact | ayna', 'Get in touch with the ayna team.'],
  '/privacy-policy': ['Privacy Policy | ayna', 'How ayna collects, uses and protects your information.'],
  '/terms-of-use': ['Terms of Use | ayna', 'The terms for using ayna.'],
  '/consumer-health-data': ['Consumer Health Data Privacy Notice | ayna', 'How ayna handles consumer health data.'],
  '/campus-resources': ['Campus Resources | ayna', 'Find verified sexual assault support, advocacy, reporting, medical, and campus resources for your college or university.'],
  '/quiz': ['Get matched | ayna', 'Answer six questions and get health products matched to your body.'],
};

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const clip = (s, n = 160) => { const t = String(s || '').replace(/\s+/g, ' ').trim(); return t.length > n ? `${t.slice(0, n - 1).replace(/\s+\S*$/, '')}…` : t; };

function page(url, title, description, { image = null, noindex = false } = {}) {
  let html = shell;
  const set = (re, tag) => { html = re.test(html) ? html.replace(re, tag) : html.replace('</head>', `  ${tag}\n</head>`); };
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
  // Readable without JavaScript (crawlers that don't run it); React replaces it on load.
  if (url && url !== '/') html = html.replace(/<body([^>]*)>/, `<body$1>\n  <noscript><h1>${esc(title.replace(/ \| ayna( Library)?$/, ''))}</h1><p>${esc(description)}</p></noscript>`);
  return html;
}

function write(url, html) {
  const file = path.join(DIST.pathname, url.replace(/^\//, ''), 'index.html');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
}

let count = 0;
for (const [url, [title, desc]] of Object.entries(PAGES)) { write(url, page(url, title, desc)); count += 1; }

const absImage = (src) => (!src ? null : /^https?:/i.test(src) ? src : `${SITE}${src.startsWith('/') ? '' : '/'}${src}`);
for (const p of ALL_PRODUCTS) {
  if (!p?.id || !p?.name || isTeenProduct(p)) continue;
  const url = productHref(p);
  if (!url || url === '/') continue;
  const brand = p.brand && !String(p.name).toLowerCase().startsWith(String(p.brand).toLowerCase()) ? `${p.brand} ` : '';
  write(url, page(url, `${brand}${p.name} | ayna`, clip(p.summary || `${p.name} on ayna: fit, research and safety in one place.`), { image: absImage(p.image) }));
  count += 1;
}

const articlesSrc = fs.readFileSync(new URL('../src/components/Articles.jsx', import.meta.url), 'utf8');
const start = articlesSrc.indexOf('const ARTICLES = [');
// One chunk per article, so a title is never paired with another article's teaser.
const chunks = articlesSrc.slice(start).split(/\n {2}\{\s*\n\s*id: '/).slice(1);
for (const chunk of chunks) {
  const id = chunk.match(/^([^']+)'/)?.[1];
  const title = chunk.match(/\n\s*title: '((?:[^'\\]|\\.)+)',/)?.[1];
  const teaser = chunk.match(/\n\s*teaser: '((?:[^'\\]|\\.)+)',/)?.[1] || '';
  if (!id || !title) continue;
  const url = `/library/${id}`;
  write(url, page(url, `${title.replace(/\\'/g, "'")} | ayna Library`, clip(teaser.replace(/\\'/g, "'"))));
  count += 1;
}

// Real 404 page: same app shell (it shows ayna's "Page not found"), never indexed.
fs.writeFileSync(new URL('404.html', DIST), page(null, 'Page Not Found | ayna', "This page doesn't exist on ayna.", { noindex: true }));
console.log(`prerender: ${count} pages + 404.html (default title kept for /: ${DEFAULT_TITLE})`);
