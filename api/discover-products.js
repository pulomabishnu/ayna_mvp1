/* global process */
/**
 * Background AI product discovery.
 *
 * WHY THIS EXISTS: Discovery's grid was capped at the bundled ~158-product
 * catalog + 39 released startups — a fixed number no matter how many real
 * women's health products actually exist. This endpoint uses the same
 * search-grounded, anti-hallucination-disciplined generation approach as
 * api/llm-recommendations.js (which already does this well, just scoped to
 * one user's on-demand quiz results) to find REAL products the catalog is
 * missing, and grows the catalog over time instead of shipping a fixed list.
 *
 * SAFETY CONTRACT — read before changing anything in this file.
 *
 * Every row this endpoint writes goes in as source='discovered',
 * is_active=false, review_status='pending', UNLESS it clears the narrow
 * auto-approval gate in isAutoApprovable() (a fully-answered, clean FDA
 * recall check AND a real https source URL the model was confident enough to
 * name) — see that function for exactly what "narrow" means. Everything else
 * stays pending until a human runs scripts/review-discovered-products.mjs and
 * explicitly approves it (which flips is_active=true). The is_active=false
 * default (and the auto-approval gate's conditions) are enforced twice —
 * here, and again in supabase/product_catalog_discovery.sql's RLS policy —
 * because the site's own How We Make Money page promises every product
 * passes the same clinical/safety review, partner or not. An AI search
 * result is a candidate, not a review — auto-approval is a policy decision
 * (Aditi, 2026-08-23) to let the two strongest confidence signals already
 * collected stand in for a human on the clearest cases, not a loosening of
 * that promise for anything the pipeline is less than fully sure about.
 *
 * Cron-triggered only, same CRON_SECRET Bearer-auth pattern as
 * api/fda-recall.js's sweep mode — see that file's header comment for why the
 * secret must be set at all before anything runs, not just checked.
 */
import { createClient } from '@supabase/supabase-js';
import { ALL_PRODUCTS } from '../src/data/products.js';
import { callWithFallback, parseProviderOrder, tryParseJsonCandidate } from './_llm.js';
import { checkRecallsForProduct } from './fda-recall.js';
import { lookupDsldProduct } from './llm-recommendations.js';

// One category discovered per run, rotated deterministically across
// RUN_HOURS_UTC.length runs/day — not every category every run. A full sweep
// every run would mean N categories x (1 search + 1 LLM call + up to 8 recall
// lookups + DSLD lookups) every single invocation, most of it re-discovering
// the same handful of real brands in a slow-moving market. Rotating means the
// whole list gets a pass roughly every CATEGORIES.length / RUN_HOURS_UTC.length
// days — this is a deliberately conservative cost/quality tradeoff, not a
// technical limit, and the slot count is the throughput knob: more slots/day
// means faster catalog growth at proportionally higher LLM/search cost.
export const CATEGORIES = [
  { category: 'pad', label: 'menstrual pads' },
  { category: 'tampon', label: 'tampons' },
  { category: 'cup', label: 'menstrual cups' },
  { category: 'period-underwear', label: 'period underwear' },
  { category: 'supplement', label: 'women\'s health supplements' },
  { category: 'pelvic-floor', label: 'pelvic floor devices' },
  { category: 'postpartum', label: 'postpartum recovery products' },
  { category: 'pregnancy', label: 'pregnancy support products' },
  { category: 'menopause', label: 'menopause and perimenopause products' },
  { category: 'intimate-care', label: 'intimate care products' },
  { category: 'cramp-relief', label: 'cramp relief products' },
  { category: 'sex-tech', label: 'sexual wellness products' },
  { category: 'tracker', label: 'cycle and health trackers' },
  { category: 'telehealth', label: 'women\'s health telehealth services' },
  { category: 'mental-health', label: 'cycle-related mental health support' },
];

const MAX_CANDIDATES_PER_RUN = 12;
const FUNCTION_BUDGET_MS = 45_000;

// Matches the discover-products cron schedule in vercel.json. Keep both in
// sync when changing cadence: this array is what makes each same-day run
// land on a different category instead of re-running the same one.
export const RUN_HOURS_UTC = [6, 14, 22];

let _admin = null;
function getAdmin() {
  if (_admin) return _admin;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  _admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return _admin;
}

export function dayOfYear(d = new Date()) {
  const start = Date.UTC(d.getUTCFullYear(), 0, 0);
  const diff = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - start;
  return Math.floor(diff / 86_400_000);
}

/**
 * Which of today's RUN_HOURS_UTC slots this run is. Matches on the exact
 * scheduled hour (cron always fires on the hour); a manual/off-schedule
 * invocation falls back to the nearest slot by even division of the day, so
 * it still deterministically lands somewhere sane instead of throwing.
 */
export function slotOfDay(d = new Date()) {
  const h = d.getUTCHours();
  const exact = RUN_HOURS_UTC.indexOf(h);
  if (exact >= 0) return exact;
  return Math.floor(h / (24 / RUN_HOURS_UTC.length)) % RUN_HOURS_UTC.length;
}

export function pickCategory(req, now = new Date()) {
  const requested = String(req.query?.category || '').trim().toLowerCase();
  const match = CATEGORIES.find((c) => c.category === requested);
  if (match) return match;
  const slot = dayOfYear(now) * RUN_HOURS_UTC.length + slotOfDay(now);
  return CATEGORIES[slot % CATEGORIES.length];
}

export function slugify(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

/**
 * Dedup key from "brand name" concatenated into ONE slug, not two separate
 * fields joined by a delimiter. A lot of this catalog's older entries fold
 * the brand into `name` with no separate `brand` field at all (e.g.
 * `{ name: 'LOLA Organic Cotton Pads' }`, no `brand` key) — a discovered
 * candidate with `{ brand: 'LOLA', name: 'Organic Cotton Pads' }` is the same
 * real product, but a two-part "brand::name" key never collides across that
 * split. Concatenating first means both produce the identical slug.
 */
export function normalizeKey(name, brand) {
  return slugify(`${brand || ''} ${name || ''}`);
}

async function searchForCategory(categoryLabel) {
  const serperKey = process.env.SERPER_API_KEY;
  if (!serperKey) return [];
  try {
    const r = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: { 'X-API-KEY': serperKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: `best ${categoryLabel} brands women 2025 2026`, num: 10, gl: 'us' }),
      signal: AbortSignal.timeout(6000),
    });
    if (!r.ok) return [];
    const data = await r.json();
    return (data?.organic || [])
      .filter((h) => h.title && h.snippet)
      .slice(0, 8)
      .map((h) => ({ title: h.title, snippet: String(h.snippet).slice(0, 200), url: h.link || '' }));
  } catch (e) {
    console.warn('[discover-products] search failed:', e?.message);
    return [];
  }
}

function buildDiscoveryPrompt({ category, label, searchHits, excludeNames }) {
  const searchContext = searchHits.length
    ? `\nLIVE SEARCH RESULTS for "${label}":\n${searchHits.map((h, i) => `${i + 1}. ${h.title}\n   ${h.snippet}\n   Source: ${h.url}`).join('\n')}\n`
    : '';
  return `
You are helping Ayna, a women's health product discovery platform, find REAL products the catalog is missing.

CATEGORY: ${label} (internal category key: "${category}")
${searchContext}
ALREADY IN CATALOG — do not suggest any of these, or an obvious variant of them (same brand+product):
${excludeNames.slice(0, 120).join(', ') || 'none'}

ANTI-HALLUCINATION — this is the most important rule:
- ONLY name a brand you are CERTAIN exists and currently sells in the US. Test: can you state the real website domain? If not, do not include it.
- Never invent a product line or SKU. Never combine a real brand with a product it doesn't actually make.
- Every product must be something a woman could search for right now and find for sale.

QUALITY BAR — only include a product if it plausibly has: majority positive reviews from real women, a real US-available brand, and no obvious red flags. Do not include anything you're not confident is real and currently sold.

TASK: Suggest up to ${MAX_CANDIDATES_PER_RUN} real, currently-sold products in this category that are NOT in the exclusion list above. Fewer is fine if you're not confident about more — never pad the list with a guess.

Return ONLY valid JSON, exactly this shape:
{
  "products": [
    {
      "name": "Product Name",
      "brand": "Brand Name",
      "category": "${category}",
      "type": "physical",
      "summary": "1-2 sentence factual description of what it is and who it's for.",
      "price": "$XX (or a realistic range)",
      "url": "https://brand-domain.com/product-page",
      "isSupplement": false
    }
  ]
}`.trim();
}

/** True when a candidate collides with an existing bundled or DB catalog entry. */
export function buildExclusionSet(category, dbRows) {
  const names = [];
  const keys = new Set();
  for (const p of ALL_PRODUCTS) {
    if (p.category !== category) continue;
    names.push(`${p.brand || ''} ${p.name}`.trim());
    keys.add(normalizeKey(p.name, p.brand));
  }
  for (const r of dbRows) {
    if (r.category !== category) continue;
    names.push(`${r.brand || ''} ${r.name}`.trim());
    keys.add(normalizeKey(r.name, r.brand));
  }
  return { names, keys };
}

/** Enrich one candidate with a real recall check, and DSLD ingredients if it claims to be a supplement. */
async function enrichCandidate(candidate, category) {
  const recall = await checkRecallsForProduct({ name: candidate.name, brand: candidate.brand, category });
  // 'failed' means we know NOTHING about this product's recall status — same
  // three-state contract as fda-recall.js's own header comment. Don't insert
  // a health-product row with an unknown safety state; skip it this run, it
  // can be picked up again next rotation.
  if (recall.status === 'failed') return null;

  let dsldIngredients = '';
  if (candidate.isSupplement) {
    const dsld = await lookupDsldProduct(candidate.name).catch(() => null);
    if (dsld?.ingredients?.length) dsldIngredients = dsld.ingredients.join(', ');
  }

  return {
    ...candidate,
    safety: {
      recalls: recall.hasRecalls
        ? `⚠️ Active FDA recall record(s) found — review before approving.`
        : 'No recalls found.',
      materials: dsldIngredients,
      sideEffects: '',
      opinionAlerts: '',
    },
    _recallCheck: {
      status: recall.status,
      hasRecalls: recall.hasRecalls,
      checkedAt: recall.checkedAt,
    },
  };
}

export function toRow(candidate, { category, searchHits, provider }) {
  const id = `disc-${slugify(candidate.brand)}-${slugify(candidate.name)}`.slice(0, 120);
  const safeUrl = /^https:\/\//i.test(candidate.url || '') ? candidate.url : null;
  return {
    id,
    name: String(candidate.name || '').slice(0, 200),
    brand: String(candidate.brand || '').slice(0, 100) || null,
    category,
    product_type: candidate.type === 'digital' ? 'digital' : 'physical',
    summary: String(candidate.summary || '').slice(0, 500),
    price: String(candidate.price || '').slice(0, 100) || null,
    image: null,
    url: safeUrl,
    tags: [],
    health_functions: [],
    where_to_buy: safeUrl ? ['Brand site'] : [],
    where_to_buy_in_stock: {},
    safety: candidate.safety || {},
    doctor_opinion: null,
    community_review: null,
    effectiveness: null,
    clinician_opinion_source: null,
    clinician_attribution: null,
    source: 'discovered',
    internal: false,
    requires_prescription: false,
    user_rating: null,
    is_active: false,
    review_status: 'pending',
    extra: {},
    discovery_meta: {
      discoveredAt: new Date().toISOString(),
      provider,
      recallCheck: candidate._recallCheck || null,
      searchHits: searchHits.slice(0, 3),
    },
  };
}

/**
 * A candidate auto-approves ONLY when BOTH of the strongest confidence
 * signals already collected for it are clean — everything else stays
 * pending, exactly as before this gate existed:
 *
 *   1. The FDA recall check fully answered (status === 'ok', not 'partial')
 *      AND found nothing active. 'partial' means some dataset failed to
 *      respond — it could be hiding a real recall, so it does not qualify no
 *      matter how confident the rest of the candidate looks.
 *   2. The model named a real, verifiable https source URL. No URL means the
 *      model wasn't confident enough to point at where this is actually
 *      sold — that's exactly the kind of shakier candidate a human should
 *      still look at.
 *
 * This is deliberately narrow, not a general "looks fine, ship it" filter —
 * see the SAFETY CONTRACT note at the top of this file for why.
 */
export function isAutoApprovable(row) {
  const recall = row.discovery_meta?.recallCheck;
  return recall?.status === 'ok' && recall?.hasRecalls === false && !!row.url;
}

function autoApprove(row) {
  return {
    ...row,
    review_status: 'approved',
    is_active: true,
    discovery_meta: {
      ...row.discovery_meta,
      autoApproved: true,
      autoApprovedAt: new Date().toISOString(),
    },
  };
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error('[discover-products] CRON_SECRET is not set; refusing all requests.');
    return res.status(401).json({ error: 'unauthorized' });
  }
  const authHeader = req.headers.authorization || '';
  if (authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const admin = getAdmin();
  if (!admin) {
    console.error('[discover-products] Supabase env not configured.');
    return res.status(503).json({ error: 'not_configured' });
  }
  if (!process.env.ANTHROPIC_API_KEY && !process.env.OPENAI_API_KEY) {
    return res.status(503).json({ error: 'not_configured', message: 'No LLM API key found.' });
  }

  const startedAt = Date.now();
  const { category, label } = pickCategory(req);

  try {
    const { data: dbRows, error: dbError } = await admin
      .from('product_catalog')
      .select('id, name, brand, category')
      .eq('category', category);
    if (dbError) throw new Error(`could not read existing catalog: ${dbError.message}`);

    const { names: excludeNames, keys: excludeKeys } = buildExclusionSet(category, dbRows || []);
    const searchHits = await searchForCategory(label);
    const prompt = buildDiscoveryPrompt({ category, label, searchHits, excludeNames });
    const order = parseProviderOrder('AI_DISCOVERY_PROVIDER_ORDER', 'anthropic,openai');

    const out = await callWithFallback(order, {
      system: 'Return a single valid JSON object only. No markdown code fences.',
      prompt,
      jsonMode: true,
      maxTokens: 3000,
      timeoutMs: 25_000,
      signal: AbortSignal.timeout(FUNCTION_BUDGET_MS - 8000),
    });

    const parsed = tryParseJsonCandidate(out.text);
    const rawCandidates = Array.isArray(parsed?.products) ? parsed.products : [];

    // Dedup against the catalog, THEN against each other within this same
    // response — a model asked for "up to 8" has repeated the same product
    // under a slightly different name more than once in testing.
    const seenThisRun = new Set();
    const fresh = rawCandidates.filter((c) => {
      if (!c?.name || !c?.brand) return false;
      const key = normalizeKey(c.name, c.brand);
      if (excludeKeys.has(key) || seenThisRun.has(key)) return false;
      seenThisRun.add(key);
      return true;
    }).slice(0, MAX_CANDIDATES_PER_RUN);

    const budgetExhausted = () => Date.now() - startedAt > FUNCTION_BUDGET_MS - 5000;
    const enriched = [];
    for (const candidate of fresh) {
      if (budgetExhausted()) {
        console.warn('[discover-products] function budget exhausted, stopping enrichment early');
        break;
      }
      const result = await enrichCandidate(candidate, category).catch((e) => {
        console.error('[discover-products] enrichment failed for', candidate.name, e?.message);
        return null;
      });
      if (result) enriched.push(result);
    }

    if (!enriched.length) {
      return res.status(200).json({
        category, label, provider: out?.provider || null,
        found: rawCandidates.length, afterDedup: fresh.length, inserted: 0,
        message: 'Nothing new to insert this run.',
      });
    }

    const rows = enriched.map((c) => toRow(c, { category, searchHits, provider: out.provider }));
    // Upsert on the deterministic id (brand+name slug) — reinserting the same
    // discovered product on a later rotation updates its discovery_meta
    // instead of creating a duplicate row. Never overwrites review_status: if
    // a human already approved or rejected this id, a later re-discovery must
    // not silently reset it back to pending.
    const { data: existingReviewed } = await admin
      .from('product_catalog')
      .select('id, review_status')
      .in('id', rows.map((r) => r.id));
    const alreadyReviewed = new Map((existingReviewed || []).map((r) => [r.id, r.review_status]));

    // Auto-approval only ever applies to brand-new rows, never to
    // toUpdateMetaOnly — a human's prior verdict on an id is never touched.
    const toInsert = rows
      .filter((r) => !alreadyReviewed.has(r.id))
      .map((r) => (isAutoApprovable(r) ? autoApprove(r) : r));
    const toUpdateMetaOnly = rows.filter((r) => alreadyReviewed.has(r.id));

    let inserted = 0;
    if (toInsert.length) {
      const { error: insertError } = await admin.from('product_catalog').insert(toInsert);
      if (insertError) throw new Error(`insert failed: ${insertError.message}`);
      inserted = toInsert.length;
    }
    for (const r of toUpdateMetaOnly) {
      await admin.from('product_catalog')
        .update({ discovery_meta: r.discovery_meta })
        .eq('id', r.id)
        .then(({ error }) => {
          if (error) console.warn('[discover-products] meta refresh failed for', r.id, error.message);
        });
    }

    return res.status(200).json({
      category, label, provider: out?.provider || null,
      found: rawCandidates.length,
      afterDedup: fresh.length,
      inserted,
      autoApproved: toInsert.filter((r) => r.discovery_meta?.autoApproved).length,
      metaRefreshed: toUpdateMetaOnly.length,
      insertedIds: toInsert.map((r) => r.id),
    });
  } catch (e) {
    console.error('[discover-products] failed:', e?.message);
    return res.status(500).json({ error: 'discovery_failed', message: e?.message, category, label });
  }
}
