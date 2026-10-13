#!/usr/bin/env node
/**
 * Product passport link check (founder spec 13, 15, 35).
 *
 *   node scripts/passport/check-links.mjs                  # check every link, write link-status.json
 *   node scripts/passport/check-links.mjs --limit 20       # first 20 URLs only (smoke test)
 *   node scripts/passport/check-links.mjs --only purchase  # purchase links only (or: source)
 *   node scripts/passport/check-links.mjs --dry-run        # list URLs, fetch nothing
 *   node scripts/passport/check-links.mjs --out file.json  # write somewhere else
 *
 * For every product passport: the purchase URL and every source URL (catalog
 * citations, reviewed fact source_url, evidence sources and claims). Each URL
 * gets a HEAD (GET when HEAD is refused) with a timeout and a polite user
 * agent, 4 at a time and at most one request per host per second.
 *
 * Brand pages (purchase links and manufacturer/brand sources) are fetched with
 * GET and their visible text is hashed. The hash is compared with the previous
 * run's link-status.json: a different hash marks the page `changed`, which
 * puts the product back into review (passport status needs_review).
 *
 * Results feed the passport through src/data/passport/linkStatus.js:
 * 404 / 410 on a purchase URL -> passport status 'unavailable' (never
 * recommended). 401 / 403 / 429 / timeouts are "unverified", never unavailable.
 *
 * Needs Node 18+ (global fetch). No secrets, no writes anywhere but --out.
 */
import { build } from 'esbuild';
import { createHash } from 'node:crypto';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2);
const argOf = (flag, fallback) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : fallback; };
const outPath = resolve(argOf('--out', join(root, 'scripts/passport/link-status.json')));
const limit = Number(argOf('--limit', 0)) || 0;
const only = argOf('--only', null);
const dryRun = args.includes('--dry-run');

export const USER_AGENT = 'aynaLinkCheck/1.0 (+https://aynahealth.co; weekly product link check)';
const CONCURRENCY = 4;
const TIMEOUT_MS = 15000;
const PER_HOST_GAP_MS = 1000;
const MAX_BYTES = 2_000_000;

// ─── Collect URLs from the passports ────────────────────────────────────────
async function loadCatalog() {
  const dir = mkdtempSync(join(tmpdir(), 'ayna-links-'));
  const entry = join(dir, 'entry.js');
  writeFileSync(entry, `
export { ALL_PRODUCTS } from ${JSON.stringify(join(root, 'src/data/products.js'))};
export { getPassport, passportFacts } from ${JSON.stringify(join(root, 'src/data/passport/index.js'))};
`);
  const bundle = join(dir, 'bundle.mjs');
  await build({ entryPoints: [entry], bundle: true, format: 'esm', platform: 'node', outfile: bundle, logLevel: 'error', loader: { '.jsx': 'jsx' } });
  const lib = await import(pathToFileURL(bundle).href);
  rmSync(dir, { recursive: true, force: true });
  return lib;
}

const isHttp = (u) => typeof u === 'string' && /^https?:\/\//i.test(u);
// Big retailers render per-visitor pages (ads, prices, bot walls): a hash would
// "change" every run, so only their status is checked.
const NO_HASH_HOSTS = /(^|\.)(amazon\.[a-z.]+|amzn\.to|walmart\.com|target\.com|cvs\.com|walgreens\.com|ulta\.com|costco\.com|kroger\.com|riteaid\.com)$/i;
function hashable(url) {
  try { return !NO_HASH_HOSTS.test(new URL(url).hostname); } catch { return false; }
}

/** url -> { kinds:Set, product_ids:Set, hash:boolean } */
export function collectUrls(products, getPassport) {
  const urls = new Map();
  const add = (url, kind, productId, hash) => {
    if (!isHttp(url)) return;
    const u = url.trim();
    const row = urls.get(u) || { kinds: new Set(), product_ids: new Set(), hash: false };
    row.kinds.add(kind);
    row.product_ids.add(productId);
    row.hash = row.hash || (hash && hashable(u));
    urls.set(u, row);
  };
  for (const product of products) {
    const p = getPassport(product);
    if (!p) continue;
    if (p.identity.purchase_url?.known) add(String(p.identity.purchase_url.value), 'purchase', p.id, true);
    for (const s of p.sources.all.known ? p.sources.all.value : []) add(s.url, 'source', p.id, s.evidence_type === 'manufacturer');
    const walk = (o) => {
      if (!o || typeof o !== 'object') return;
      if (Array.isArray(o)) { o.forEach(walk); return; }
      if (o.source_url) add(o.source_url, 'source', p.id, o.source_type === 'brand' || o.source_type === 'official_label');
      if (isHttp(o.url) && o !== p) add(o.url, 'source', p.id, o.evidence_type === 'manufacturer');
      Object.values(o).forEach((v) => { if (v && typeof v === 'object') walk(v); });
    };
    ['identity', 'pricing', 'composition', 'safety', 'health', 'evidence'].forEach((k) => walk(p[k]));
  }
  return urls;
}

// ─── Fetching ───────────────────────────────────────────────────────────────
const lastHit = new Map();
const sleep = (ms) => new Promise((r) => { setTimeout(r, ms); });
async function politeWait(url) {
  let host = '';
  try { host = new URL(url).host; } catch { return; }
  for (;;) {
    const last = lastHit.get(host) || 0;
    const wait = last + PER_HOST_GAP_MS - Date.now();
    if (wait <= 0) { lastHit.set(host, Date.now()); return; }
    await sleep(wait);
  }
}

async function request(url, method) {
  await politeWait(url);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method,
      redirect: 'follow',
      signal: ctrl.signal,
      headers: { 'user-agent': USER_AGENT, accept: 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8' },
    });
    let body = null;
    if (method === 'GET') {
      const reader = res.body?.getReader?.();
      if (reader) {
        const chunks = [];
        let size = 0;
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          size += value.length;
          chunks.push(value);
          if (size > MAX_BYTES) { await reader.cancel(); break; }
        }
        body = Buffer.concat(chunks.map((c) => Buffer.from(c))).toString('utf8');
      }
    }
    return { status: res.status, ok: res.ok, final_url: res.url || url, redirected: Boolean(res.redirected), body, content_type: res.headers.get('content-type') || null };
  } finally {
    clearTimeout(timer);
  }
}

/** Visible text only, so script nonces and tracking ids do not count as a change. */
export function pageFingerprint(body) {
  const text = String(body || '')
    .replace(/<(script|style|noscript|svg|template)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return createHash('sha256').update(text).digest('hex');
}

export async function checkUrl(url, { hash }) {
  const checked_at = new Date().toISOString();
  try {
    let r = hash ? await request(url, 'GET') : await request(url, 'HEAD');
    // Many stores refuse HEAD (403/405/501) or answer it differently: retry once with GET.
    if (!hash && (!r.ok || r.status === 405)) r = await request(url, 'GET');
    return {
      status: r.status,
      ok: r.ok,
      final_url: r.final_url !== url ? r.final_url : null,
      redirected: r.redirected,
      content_hash: hash && r.ok && r.body ? pageFingerprint(r.body) : null,
      checked_at,
      error: null,
    };
  } catch (e) {
    return { status: null, ok: false, final_url: null, redirected: false, content_hash: null, checked_at, error: e?.name === 'AbortError' ? 'timeout' : String(e?.message || e).slice(0, 160) };
  }
}

async function pool(items, n, fn) {
  const out = new Array(items.length);
  let i = 0;
  const worker = async () => { while (i < items.length) { const k = i; i += 1; out[k] = await fn(items[k], k); } };
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, worker));
  return out;
}

// ─── Main ───────────────────────────────────────────────────────────────────
async function main() {
  const { ALL_PRODUCTS, getPassport } = await loadCatalog();
  const all = collectUrls(ALL_PRODUCTS, getPassport);
  let entries = [...all.entries()].sort(([a], [b]) => a.localeCompare(b));
  if (only) entries = entries.filter(([, row]) => row.kinds.has(only));
  if (limit) entries = entries.slice(0, limit);
  console.log(`${all.size} URLs across ${ALL_PRODUCTS.length} products; checking ${entries.length}${dryRun ? ' (dry run)' : ''}`);
  if (dryRun) {
    entries.forEach(([url, row]) => console.log(`${[...row.kinds].join('+').padEnd(15)} ${row.hash ? 'hash ' : '     '} ${url}`));
    return;
  }

  const previous = existsSync(outPath) ? JSON.parse(readFileSync(outPath, 'utf8')) : null;
  let done = 0;
  const results = await pool(entries, CONCURRENCY, async ([url, row]) => {
    const r = await checkUrl(url, row);
    done += 1;
    if (done % 25 === 0) console.log(`  ${done}/${entries.length}`);
    const prev = previous?.urls?.[url] || null;
    const previous_hash = prev?.content_hash || null;
    return [url, {
      kinds: [...row.kinds].sort(),
      product_ids: [...row.product_ids].sort(),
      ...r,
      previous_hash,
      changed: Boolean(r.content_hash && previous_hash && r.content_hash !== previous_hash),
    }];
  });

  const urls = Object.fromEntries(results.sort(([a], [b]) => a.localeCompare(b)));
  // Keep earlier results for URLs not checked this run (--limit / --only), so partial runs never erase data.
  for (const [url, rec] of Object.entries(previous?.urls || {})) if (!urls[url] && all.has(url)) urls[url] = rec;
  const out = {
    generated_at: new Date().toISOString(),
    previous_generated_at: previous?.generated_at || null,
    user_agent: USER_AGENT,
    urls,
  };
  writeFileSync(outPath, `${JSON.stringify(out, null, 2)}\n`);

  const vals = results.map(([, v]) => v);
  const count = (fn) => vals.filter(fn).length;
  console.log(`ok ${count((v) => v.ok)} · 404/410 ${count((v) => v.status === 404 || v.status === 410)} · blocked/other ${count((v) => !v.ok && v.status && v.status !== 404 && v.status !== 410)} · errors ${count((v) => v.error)} · changed pages ${count((v) => v.changed)}`);
  for (const [url, v] of results) {
    if (v.kinds.includes('purchase') && (v.status === 404 || v.status === 410)) console.log(`  UNAVAILABLE ${v.status} ${url} (${v.product_ids.join(', ')})`);
    if (v.changed) console.log(`  CHANGED ${url} (${v.product_ids.join(', ')})`);
  }
  console.log(`wrote ${outPath}`);
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
