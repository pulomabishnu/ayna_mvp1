#!/usr/bin/env node
/**
 * Every link on the website and in the app, checked.
 *
 *   node scripts/audit-all-links.mjs                 # external + internal
 *   node scripts/audit-all-links.mjs --external      # external URLs only
 *   node scripts/audit-all-links.mjs --internal      # internal pages only
 *   node scripts/audit-all-links.mjs --list          # print the URL list, fetch nothing
 *   SITE=https://preview.example node scripts/audit-all-links.mjs --internal
 *
 * External: every http(s) URL in src/, api/ and public/ (tests excluded):
 * buy links, product images, research sources, footer and social links.
 * Each gets a GET with a browser user agent. A site that blocks bots
 * (401/403/429/503, or a timeout) is opened again in headless Chrome, which
 * reports the real page status and looks for "page not found" text.
 *
 * Internal: every page in public/sitemap.xml plus every app route in
 * App.jsx (VIEW_TO_PATH), rendered in headless Chrome on SITE (default
 * https://www.aynahealth.co). The app answers 200 for any route, so a page
 * counts as broken when it renders the 404 state (.ay-404).
 *
 * Writes reports/link-audit.json and reports/link-audit.md.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const SITE = (process.env.SITE || 'https://www.aynahealth.co').replace(/\/$/, '');
const doExternal = !args.includes('--internal');
const doInternal = !args.includes('--external');
const listOnly = args.includes('--list');

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
const TIMEOUT_MS = 20000;
const CONCURRENCY = 10;
const PER_HOST_GAP_MS = 800;

// Strings that look like URLs but are not links a person follows: XML
// namespaces, API endpoints that need keys or POST, and template prefixes.
const NOT_LINKS = [
  /^https?:\/\/(www\.)?w3\.org\//, /^https?:\/\/schema\.org/, /sitemaps\.org\/schemas/, /'\)/, /\$$/, /\.\.\./, /^https?:\/\/json-schema\.org/,
  /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)/, /example\.(com|org)/,
  /api\.anthropic\.com/, /api\.openai\.com/, /generativelanguage\.googleapis\.com/, /\.supabase\.co/,
  /(us|eu)\.i\.posthog\.com/, /(us|eu)-assets\.i\.posthog\.com/, /api\.fda\.gov\/(device|drug)\/[a-z0-9]+\.json$/,
  /google\.serper\.dev/, /api\.stripe\.com/, /hooks\.slack\.com/, /api\.twilio\.com/, /eutils\.ncbi\.nlm\.nih\.gov\/entrez\/eutils\/?$/,
  /\$\{/, /[{}<>`]/, /\/\.\.\.$/, /^https?:\/\/[^/.]+$/,
];
const isLink = (u) => !NOT_LINKS.some((re) => re.test(u));

// ─── Collect ────────────────────────────────────────────────────────────────
function walkFiles(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (!['node_modules', 'dist', '.git'].includes(e.name)) walkFiles(p, out); continue; }
    if (/\.test\.(js|jsx|mjs)$/.test(e.name)) continue;
    if (/\.(js|jsx|mjs|json|html|xml|css|txt|md)$/.test(e.name)) out.push(p);
  }
  return out;
}

export function collectExternal() {
  const where = new Map();
  for (const dir of ['src', 'api', 'public']) {
    const abs = path.join(root, dir);
    if (!fs.existsSync(abs)) continue;
    for (const file of walkFiles(abs)) {
      const text = fs.readFileSync(file, 'utf8');
      for (const m of text.matchAll(/https?:\/\/[A-Za-z0-9._~:/?#@!$&'()*+,;=%-]+/g)) {
        let u = m[0].replace(/[)'",;.:]+$/, '').replace(/&amp;/g, '&');
        if (!isLink(u)) continue;
        try { new URL(u); } catch { continue; }
        if (new URL(u).hostname.replace(/^www\./, '') === new URL(SITE).hostname.replace(/^www\./, '')) continue; // internal: rendered below
        if (!where.has(u)) where.set(u, new Set());
        where.get(u).add(path.relative(root, file));
      }
    }
  }
  return [...where].map(([url, files]) => ({ url, files: [...files].slice(0, 5) }));
}

export function collectInternal() {
  const paths = new Set(['/']);
  const sitemap = path.join(root, 'public/sitemap.xml');
  if (fs.existsSync(sitemap)) for (const m of fs.readFileSync(sitemap, 'utf8').matchAll(/<loc>https?:\/\/[^/<]+(\/[^<]*)<\/loc>/g)) paths.add(m[1] || '/');
  const app = fs.readFileSync(path.join(root, 'src/App.jsx'), 'utf8');
  const block = app.slice(app.indexOf('const VIEW_TO_PATH = {'), app.indexOf('};', app.indexOf('const VIEW_TO_PATH = {')));
  for (const m of block.matchAll(/:\s*'(\/[^']*)'/g)) paths.add(m[1]);
  // Every aynahealth.co link written into the code (footers, emails, OG tags).
  for (const dir of ['src', 'api', 'public']) for (const file of walkFiles(path.join(root, dir))) {
    for (const m of fs.readFileSync(file, 'utf8').matchAll(/https?:\/\/(?:www\.)?aynahealth\.co(\/[A-Za-z0-9._~/?#@!$&+,;=%-]*)?/g)) {
      const p = (m[1] || '/').replace(/[).,;]+$/, '');
      if (!/[{}$`']/.test(p) && !p.startsWith('/api/') && !/\.(png|jpe?g|webp|svg|xml|html)$/.test(p)) paths.add(p);
    }
  }
  return [...paths].sort();
}

// ─── Check ──────────────────────────────────────────────────────────────────
const lastHit = new Map();
async function politeWait(url) {
  const host = new URL(url).hostname;
  const wait = (lastHit.get(host) || 0) + PER_HOST_GAP_MS - Date.now();
  lastHit.set(host, Math.max(Date.now(), (lastHit.get(host) || 0) + PER_HOST_GAP_MS));
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
}

async function fetchStatus(url) {
  await politeWait(url);
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { redirect: 'follow', signal: ctrl.signal, headers: { 'user-agent': UA, accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/*,*/*;q=0.8', 'accept-language': 'en-US,en;q=0.9' } });
    let snippet = '';
    if ((res.headers.get('content-type') || '').includes('text/html')) snippet = (await res.text()).slice(0, 200000);
    else res.body?.cancel?.();
    return { status: res.status, final_url: res.url, snippet };
  } catch (e) {
    return { status: 0, error: String(e.cause?.code || e.name || e.message) };
  } finally { clearTimeout(t); }
}

// Soft 404s: a 200 page that says the thing is gone.
const SOFT_404 = /(page (you('| a)re looking for )?(could ?n[o']t be found|not found|doesn['’]t exist|no longer exists)|we couldn['’]t find (that|this) page|sorry! we couldn['’]t find|this item is no longer available|product (is )?no longer available|this page isn['’]t available|404 not found|error 404)/i;

function classify(r) {
  if (r.status === 404 || r.status === 410) return 'broken';
  if (r.status >= 200 && r.status < 400) return r.snippet && SOFT_404.test(r.snippet.replace(/<script[\s\S]*?<\/script>/g, '')) ? 'soft_404' : 'ok';
  if (r.status === 0 && /ENOTFOUND|EAI_AGAIN|ECONNREFUSED|CERT|ERR_TLS/.test(r.error || '')) return 'broken';
  if ([401, 403, 405, 406, 429, 503, 999].includes(r.status) || r.status === 0) return 'blocked';
  return 'broken'; // 5xx and other errors
}

async function pool(items, n, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) { const k = i++; out[k] = await fn(items[k], k); } }));
  return out;
}

async function launchBrowser() {
  const { default: puppeteer } = await import('puppeteer');
  return puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
}

async function browserCheck(browser, url) {
  const page = await browser.newPage();
  try {
    await page.setUserAgent(UA);
    const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await new Promise((r) => setTimeout(r, 2500));
    const status = res?.status() ?? 0;
    const text = await page.evaluate(() => document.body?.innerText?.slice(0, 20000) || '');
    const captcha = /captcha|are you a robot|verify you are human|unusual traffic|access denied|press & hold/i.test(text);
    let state = status === 404 || status === 410 ? 'broken' : SOFT_404.test(text) ? 'soft_404' : status >= 200 && status < 400 ? 'ok' : 'blocked';
    if (state === 'ok' && captcha) state = 'blocked';
    return { status, state, final_url: page.url(), captcha };
  } catch (e) {
    return { status: 0, state: 'blocked', error: String(e.message).slice(0, 120) };
  } finally { await page.close().catch(() => {}); }
}

async function internalCheck(browser, p) {
  const page = await browser.newPage();
  const url = SITE + p;
  try {
    await page.setUserAgent(UA);
    const res = await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
    await page.waitForFunction(() => document.querySelector('#root')?.children.length, { timeout: 15000 }).catch(() => {});
    await new Promise((r) => setTimeout(r, 1500));
    const is404 = await page.evaluate(() => Boolean(document.querySelector('.ay-404')) || /^page not found/i.test(document.title));
    const status = res?.status() ?? 0;
    // Broken images on the page.
    const badImages = await page.evaluate(() => [...document.images].filter((im) => im.complete && im.naturalWidth === 0 && im.src && !im.src.startsWith('data:')).map((im) => im.src).slice(0, 20));
    return { path: p, status, state: status === 404 || is404 ? 'broken' : status >= 200 && status < 400 ? 'ok' : 'broken', badImages };
  } catch (e) {
    return { path: p, status: 0, state: 'error', error: String(e.message).slice(0, 120), badImages: [] };
  } finally { await page.close().catch(() => {}); }
}

// ─── Run ────────────────────────────────────────────────────────────────────
async function main() {
  const report = { generated_at: new Date().toISOString(), site: SITE, external: [], internal: [] };
  const external = doExternal ? collectExternal() : [];
  const internal = doInternal ? collectInternal() : [];
  if (listOnly) {
    external.forEach((e) => console.log(e.url));
    internal.forEach((p) => console.log(SITE + p));
    console.error(`${external.length} external, ${internal.length} internal`);
    return;
  }

  if (doExternal) {
    console.log(`Checking ${external.length} external URLs`);
    const first = await pool(external, CONCURRENCY, async (e) => { const r = await fetchStatus(e.url); return { ...e, ...r, snippet: undefined, state: classify(r), via: 'fetch' }; });
    const retry = first.filter((r) => r.state === 'blocked' || r.state === 'soft_404');
    console.log(`Re-checking ${retry.length} in headless Chrome`);
    if (retry.length) {
      const browser = await launchBrowser();
      await pool(retry, 3, async (r) => { await politeWait(r.url); Object.assign(r, await browserCheck(browser, r.url), { via: 'browser' }); });
      await browser.close();
    }
    report.external = first;
  }

  if (doInternal) {
    console.log(`Rendering ${internal.length} internal pages on ${SITE}`);
    const browser = await launchBrowser();
    report.internal = await pool(internal, 4, (p) => internalCheck(browser, p));
    await browser.close();
  }

  const bad = report.external.filter((r) => r.state === 'broken' || r.state === 'soft_404');
  const unverified = report.external.filter((r) => r.state === 'blocked');
  const badPages = report.internal.filter((r) => r.state !== 'ok');
  const badImgs = report.internal.flatMap((r) => r.badImages.map((src) => ({ page: r.path, src })));
  report.summary = { external: report.external.length, external_broken: bad.length, external_unverified: unverified.length, internal: report.internal.length, internal_broken: badPages.length, broken_images_on_pages: badImgs.length };

  fs.mkdirSync(path.join(root, 'reports'), { recursive: true });
  fs.writeFileSync(path.join(root, 'reports/link-audit.json'), JSON.stringify(report, null, 1));
  const md = [
    `# Link audit ${report.generated_at}`, '', '```', JSON.stringify(report.summary, null, 1), '```', '',
    '## Broken external links', ...bad.map((r) => `- ${r.state} ${r.status} ${r.url} (${r.files.join(', ')})`), '',
    '## Broken internal pages', ...badPages.map((r) => `- ${r.state} ${r.status} ${r.path}`), '',
    '## Broken images on pages', ...badImgs.map((r) => `- ${r.page}: ${r.src}`), '',
    '## Could not verify (bot blocked)', ...unverified.map((r) => `- ${r.status} ${r.url}`),
  ].join('\n');
  fs.writeFileSync(path.join(root, 'reports/link-audit.md'), md);
  console.log(JSON.stringify(report.summary));
}

main().catch((e) => { console.error(e); process.exit(1); });
