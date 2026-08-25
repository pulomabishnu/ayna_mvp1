#!/usr/bin/env node
/**
 * Rewrites doctorOpinion / communityReview / effectiveness for every live
 * product into content that's actually substantive and distinct per field,
 * instead of 1-2 generic throwaway sentences that often read near-identical
 * across "Ayna summary" and "Social Media" (found live on Poise, flagged by
 * Aditi 2026-08-24: "the social media summary and ayna summary are the same
 * ... it shouldn't be like 1-2 sentences").
 *
 * SAME ANTI-FABRICATION DISCIPLINE AS THE REST OF THIS CATALOG'S PIPELINE
 * (api/discover-products.js, api/search-suggestions.js): every claim in the
 * output must be grounded in a REAL search result actually returned for that
 * product, or in well-established general medical knowledge — never invented
 * quotes, invented studies, or invented Reddit sentiment. When real search
 * coverage for a product is thin, the model is instructed to say so honestly
 * (short and true) rather than pad with generic filler — concise-but-honest
 * beats long-but-invented every time.
 *
 * Read-only against Supabase (public /api/products). This script has no DB
 * write credentials (none are available locally in this environment) — it
 * only WRITES A SQL FILE for a human to run in the Supabase SQL Editor, same
 * pattern as every other catalog change this session.
 *
 * Usage:
 *   set -a; source .env.local; set +a
 *   node scripts/enrich-product-content.mjs [--limit N] [--start-after ID] [--ids id1,id2,...]
 *
 * Requires SERPER_API_KEY and (ANTHROPIC_API_KEY or OPENAI_API_KEY) in env.
 * Progress is checkpointed to .enrich-progress.json (repo-root, gitignored)
 * so an interrupted run can resume with --start-after instead of re-paying
 * for products already done.
 */
import { writeFileSync, readFileSync, existsSync, appendFileSync } from 'node:fs';
import { callWithFallback, parseProviderOrder, tryParseJsonCandidate } from '../api/_llm.js';

const PRODUCTS_URL = 'https://aynamvp1.vercel.app/api/products';
const OUT_SQL_PATH = 'supabase/seed/product_content_depth_rewrite.sql';
const PROGRESS_PATH = '.enrich-progress.json';
const CONCURRENCY = 4;

function parseArgs(argv) {
  const out = { limit: Infinity, startAfter: null, ids: null };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--limit') out.limit = Number(argv[++i]) || Infinity;
    if (argv[i] === '--start-after') out.startAfter = argv[++i];
    // Retarget the run at specific product ids only — for retrying the
    // handful that failed mid-run (e.g. a billing lapse) without re-paying
    // for everything already done. Takes precedence over --start-after/--limit.
    if (argv[i] === '--ids') out.ids = new Set(argv[++i].split(',').map((s) => s.trim()).filter(Boolean));
  }
  return out;
}

async function serperSearch(query) {
  const key = process.env.SERPER_API_KEY;
  if (!key) return [];
  try {
    const r = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: { 'X-API-KEY': key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: query, num: 8, gl: 'us' }),
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) return [];
    const data = await r.json();
    return (data?.organic || [])
      .filter((h) => h.title && h.snippet)
      .slice(0, 6)
      .map((h) => ({ title: h.title, snippet: String(h.snippet).slice(0, 300), url: h.link || '' }));
  } catch {
    return [];
  }
}

/** Best-effort platform tag from the hit's own URL — lets the model (and a
 * human skimming this prompt) know which results are actually Reddit vs.
 * TikTok vs. neither, instead of guessing from the search query alone. */
function platformOf(url) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    if (host === 'reddit.com' || host.endsWith('.reddit.com')) return 'Reddit';
    if (host === 'tiktok.com' || host.endsWith('.tiktok.com')) return 'TikTok';
    return null;
  } catch {
    return null;
  }
}

function formatHits(label, hits) {
  if (!hits.length) return `${label}: (no results found — treat as genuinely no public coverage, do not invent any)`;
  return `${label}:\n${hits.map((h, i) => {
    const platform = platformOf(h.url);
    return `${i + 1}. ${platform ? `[${platform}] ` : ''}${h.title} — ${h.snippet} (${h.url})`;
  }).join('\n')}`;
}

function sqlString(s) {
  return `'${String(s || '').replace(/'/g, "''")}'`;
}

function buildPrompt(product, communityHits, clinicalHits) {
  return `
You are rewriting three fields on a women's health product catalog page (Ayna) to be
substantive and genuinely useful for a purchase decision, not generic filler. This
product already exists in the catalog — you are improving its content, not inventing
the product.

PRODUCT: ${product.name}${product.brand ? ` (brand: ${product.brand})` : ''}
CATEGORY: ${product.category || 'unknown'}
EXISTING SUMMARY: ${product.summary || '(none)'}
EXISTING SAFETY NOTES: ${JSON.stringify(product.safety || {})}

${formatHits('REAL COMMUNITY/SOCIAL SEARCH RESULTS', communityHits)}

${formatHits('REAL CLINICAL/SCIENTIFIC SEARCH RESULTS', clinicalHits)}

ANTI-FABRICATION RULES — this is the most important part:
- Every specific claim (a study finding, a named source, a recurring community theme,
  a named subreddit or platform) MUST come from the search results actually shown
  above. Do not invent a study, a statistic, a Reddit thread, or a specific complaint
  that isn't grounded in what's shown.
- General, well-established medical knowledge (e.g. how a product category works,
  broadly accepted clinical guidance) is fine to state without a specific citation.
- If the community search results are empty or clearly unrelated to this exact
  product, SAY SO HONESTLY in communityReview (e.g. "Limited public discussion of
  this specific product") rather than inventing sentiment. Same for clinical results.
- Being concise is fine. Being vague is not. A short, honest, specific field beats a
  long, padded, generic one — but the current problem across this catalog is fields
  that are only 1-2 throwaway sentences with almost no real information. Aim for
  3-5 sentences of real substance when the search results support it.

WRITE THREE DISTINCT FIELDS, each in a different voice:

1. doctorOpinion — clinical reasoning: what this product actually does mechanically/
   physiologically, who it's appropriate for, and anything real search results or
   general medical knowledge suggest a clinician would flag (when to see a doctor
   instead of just using this, a real safety consideration, etc). Do NOT just restate
   the summary.

2. communityReview — synthesized REAL sentiment from the community search results,
   ATTRIBUTED TO ITS ACTUAL PLATFORM: each hit above is tagged [Reddit], [TikTok], or
   untagged (some other site) — say specifically where a theme came from ("Users on
   Reddit note that...", "On TikTok, several reviewers highlight...") rather than a
   vague "some users say." If both Reddit and TikTok have real coverage, mention both
   by name. If only one does, name that one and don't imply the other exists. Cover
   recurring positive themes AND recurring complaints, in the voice of "here's what
   real people say," not a product description. If results are thin or untagged
   (neither platform identifiable), say so honestly instead of padding or guessing
   a platform.

3. effectiveness — an honest evidence-based read: is there a real study of this exact
   product (only if actually shown in results)? If not, what does the honest
   category-level evidence say? Never claim this product outperforms others without
   real data for that.

Return ONLY valid JSON, exactly this shape:
{
  "doctorOpinion": "...",
  "communityReview": "...",
  "effectiveness": "...",
  "citations": [
    { "type": "scientific" or "community", "platform": "reddit" or "tiktok" (only for community, else omit), "url": "...", "text": "short label", "summary": "one sentence, specific to what THIS source actually said — not a restatement of communityReview" }
  ]
}
"citations" should only include URLs that actually appeared in the search results above — up to 2 total, only the most relevant. When both a real Reddit result and a real TikTok result are relevant, prefer citing one of each over two from the same platform. Omit entirely (empty array) if none of the results are worth citing.
`.trim();
}

async function enrichOne(product, order) {
  const redditQuery = `${product.brand || ''} ${product.name} review reddit`.trim();
  const tiktokQuery = `${product.brand || ''} ${product.name} review tiktok`.trim();
  const clinicalQuery = `${product.name} ${product.category || ''} clinical evidence safety women's health`.trim();
  const [redditHits, tiktokHits, clinicalHits] = await Promise.all([
    serperSearch(redditQuery),
    serperSearch(tiktokQuery),
    serperSearch(clinicalQuery),
  ]);
  // Dedup by URL — the reddit- and tiktok-flavored queries can both surface
  // the same off-platform result (e.g. a roundup article), and platformOf()
  // already tags each hit from its own URL, so query intent doesn't matter
  // once merged.
  const seen = new Set();
  const communityHits = [...redditHits, ...tiktokHits].filter((h) => {
    if (!h.url || seen.has(h.url)) return false;
    seen.add(h.url);
    return true;
  });

  const prompt = buildPrompt(product, communityHits, clinicalHits);
  const out = await callWithFallback(order, {
    system: 'Return a single valid JSON object only. No markdown code fences.',
    prompt,
    jsonMode: true,
    maxTokens: 1600,
    timeoutMs: 25_000,
  });
  const parsed = tryParseJsonCandidate(out.text);
  if (!parsed || !parsed.doctorOpinion || !parsed.communityReview || !parsed.effectiveness) {
    throw new Error('LLM did not return the expected fields');
  }
  return parsed;
}

function toSqlUpdate(product, result) {
  const citations = Array.isArray(result.citations) ? result.citations.slice(0, 2) : [];
  const scientific = citations.filter((c) => c.type === 'scientific');
  const community = citations.filter((c) => c.type === 'community');

  let extraSql = 'extra';
  if (scientific.length) {
    const json = JSON.stringify({ links: scientific.map((c) => ({ url: c.url, text: c.text, summary: c.summary, justification: 'Cited during 2026-08-24 content-depth pass — see search grounding in scripts/enrich-product-content.mjs.' })) });
    extraSql = `jsonb_set(${extraSql}, '{verificationLinks,scientific}', ${sqlString(json)}::jsonb, true)`;
  }
  if (community.length) {
    const json = JSON.stringify({ links: community.map((c) => ({ platform: c.platform || 'reddit', url: c.url, text: c.text, summary: c.summary })) });
    extraSql = `jsonb_set(${extraSql}, '{verificationLinks,community}', ${sqlString(json)}::jsonb, true)`;
  }

  const setClauses = [
    `doctor_opinion = ${sqlString(result.doctorOpinion)}`,
    `community_review = ${sqlString(result.communityReview)}`,
    `effectiveness = ${sqlString(result.effectiveness)}`,
  ];
  if (extraSql !== 'extra') setClauses.push(`extra = ${extraSql}`);

  return `UPDATE product_catalog SET\n  ${setClauses.join(',\n  ')}\nWHERE id = ${sqlString(product.id)};\n`;
}

async function main() {
  const { limit, startAfter, ids } = parseArgs(process.argv.slice(2));

  if (!process.env.SERPER_API_KEY) {
    console.error('SERPER_API_KEY not set. set -a; source .env.local; set +a');
    process.exit(2);
  }
  if (!process.env.ANTHROPIC_API_KEY && !process.env.OPENAI_API_KEY) {
    console.error('Need ANTHROPIC_API_KEY or OPENAI_API_KEY. set -a; source .env.local; set +a');
    process.exit(2);
  }

  const res = await fetch(PRODUCTS_URL);
  const { products } = await res.json();
  console.log(`Fetched ${products.length} live products.`);

  let queue = products;
  if (ids) {
    queue = queue.filter((p) => ids.has(p.id));
  } else {
    if (startAfter) {
      const idx = queue.findIndex((p) => p.id === startAfter);
      if (idx >= 0) queue = queue.slice(idx + 1);
    }
    queue = queue.slice(0, limit);
  }
  console.log(`Processing ${queue.length} products (concurrency ${CONCURRENCY}).`);

  const order = parseProviderOrder('AI_DISCOVERY_PROVIDER_ORDER', 'anthropic,openai');

  if (!existsSync(OUT_SQL_PATH)) {
    writeFileSync(OUT_SQL_PATH, '-- Catalog-wide content-depth rewrite (2026-08-24). Generated by scripts/enrich-product-content.mjs.\n-- Real Serper-grounded doctorOpinion / communityReview / effectiveness for every live product.\n\n');
  }

  const results = { done: 0, failed: [] };
  let idx = 0;
  async function worker() {
    while (idx < queue.length) {
      const product = queue[idx++];
      try {
        const enriched = await enrichOne(product, order);
        appendFileSync(OUT_SQL_PATH, toSqlUpdate(product, enriched) + '\n');
        results.done += 1;
        appendFileSync(PROGRESS_PATH, JSON.stringify({ id: product.id, ok: true }) + '\n');
        console.log(`[${results.done}/${queue.length}] OK  ${product.id}`);
      } catch (e) {
        results.failed.push({ id: product.id, error: e?.message });
        appendFileSync(PROGRESS_PATH, JSON.stringify({ id: product.id, ok: false, error: e?.message }) + '\n');
        console.warn(`[${results.done}/${queue.length}] FAIL ${product.id}: ${e?.message}`);
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  console.log(`\nDone. ${results.done} succeeded, ${results.failed.length} failed.`);
  if (results.failed.length) {
    console.log('Failed IDs:', results.failed.map((f) => f.id).join(', '));
    console.log(`Resume the tail with: node scripts/enrich-product-content.mjs --start-after ${queue[queue.length - 1]?.id || ''}`);
  }
  console.log(`SQL written to ${OUT_SQL_PATH}`);
}

main().catch((e) => {
  console.error('Fatal:', e);
  process.exit(1);
});
