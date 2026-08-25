/* global process */
/**
 * Admin-triggered brand catalog import — pulls a brand's REAL product feed
 * instead of asking an LLM to guess at what it sells.
 *
 * WHY THIS EXISTS: twice in one session (2026-08-24), a real partner brand
 * (Oboo, Winx Health) turned out to have only 1 of its real N products in
 * the catalog, because api/discover-products.js's LLM-generation path
 * suggests a handful of plausible products per CATEGORY — it has no notion
 * of "this specific brand sells N products, go get all of them." Both gaps
 * were fixed by hand: find the brand's Shopify store, pull
 * `{domain}/products.json` (a complete, authoritative, zero-hallucination-
 * risk product list — real prices, real images, real URLs), filter out
 * bundles/prescriptions/merch, and write catalog rows. This endpoint
 * automates exactly that manual process.
 *
 * TRIGGER — deliberately admin-triggered (POST from a known brand/domain),
 * not fully autonomous. When someone (Aditi, or later a review workflow)
 * notices a "brand shows too few products" gap, hitting this endpoint with
 * that brand's domain does the research automatically instead of by hand.
 * A fully autonomous version — e.g. api/search-suggestions.js's live Serper
 * grounding (searchWebForQuery) noticing a query resolves to a Shopify
 * domain and firing this off itself — was deliberately NOT built here: any
 * search becoming a trigger for a bulk catalog write is a real abuse/cost
 * surface (rate limiting, dedup-across-users, "is this actually the brand's
 * real store" verification all need to be solid before that's safe to wire
 * up unattended). If that's built later, the natural hook is right after
 * searchWebForQuery resolves a hit whose hostname matches the query brand —
 * check it's a Shopify store with isShopifyStore(), then call
 * fetchAndImportBrandCatalog() with heavy rate limiting/dedup, same as this
 * endpoint does internally.
 *
 * SAFETY CONTRACT — identical bar to api/discover-products.js, reused
 * directly rather than re-implemented: every row lands as
 * source='discovered', is_active=false, review_status='pending' UNLESS it
 * clears isAutoApprovable() (clean FDA recall check + a URL verifyUrlIsLive
 * actually confirms resolves to the same domain) — see that file's own
 * SAFETY CONTRACT comment for why this bar exists at all. A product this
 * endpoint can't confidently classify into a real category NEVER
 * auto-approves regardless of recall/URL status (see categoryConfident
 * below) — an ambiguous product is exactly the kind of "not actually sure
 * this belongs here" case a human should see before it's shown to users.
 *
 * Same CRON_SECRET Bearer-auth pattern as api/discover-products.js — this
 * is a privileged background-operation endpoint, not a public one, even
 * though it's triggered by a person rather than a cron schedule.
 */
import { createClient } from '@supabase/supabase-js';
import { checkRecallsForProduct } from './fda-recall.js';
import { slugify, normalizeKey, toRow, isAutoApprovable, verifyUrlIsLive } from './discover-products.js';
import { HEALTH_FUNCTIONS } from '../src/data/products.js';

const VALID_HEALTH_FUNCTIONS = new Set(Object.keys(HEALTH_FUNCTIONS));

// Broader than discover-products.js's own CATEGORIES (that array is just the
// LLM-generation rotation list) — this is the actual category vocabulary
// product_catalog rows use across the app (e.g. 'diagnostics', used by the
// Winx Health test-kit products added by hand earlier this session).
export const VALID_CATEGORIES = new Set([
  'pad', 'tampon', 'cup', 'disc', 'period-underwear', 'supplement', 'tracker',
  'telehealth', 'mental-health', 'fitness', 'diagnostics', 'hormone-monitoring',
  'menopause', 'fertility', 'pelvic-floor', 'cramp-relief', 'postpartum',
  'pregnancy', 'sex-tech', 'intimate-care', 'contraception', 'other',
]);

// Mirrors PRESCRIPTION_DRUG_PATTERN in api/llm-recommendations.js and
// api/search-suggestions.js — keep all three in sync. A Shopify feed also
// commonly says this in plain English in the title itself (found live,
// Winx Health: "UTI Antibiotics Online Prescription") — \bprescription\b
// alone already catches every one of those without needing the brand/drug
// list, but the full list stays here too in case a title names the drug
// without the word "prescription" (e.g. a store selling Zofran by name).
const PRESCRIPTION_DRUG_PATTERN = new RegExp(
  [
    '\\bprescription\\b', '\\brx\\b', 'tranexamic', 'tranexemic', '\\blysteda\\b',
    '\\byaz\\b', 'yasmin', '\\bjunel\\b', 'loestrin', 'ortho\\s*tri-?cyclen', '\\bsprintec\\b',
    'nuvaring', 'annovera', '\\bxulane\\b', '\\btwirla\\b', 'nexplanon', '\\bmirena\\b',
    'kyleena', '\\bskyla\\b', 'liletta', 'depo-?provera',
    '\\bpremarin\\b', '\\bestrace\\b', 'prometrium', 'vivelle', 'climara', '\\bduavee\\b',
    'estring', 'evamist', 'prempro', 'activella', 'bijuva',
    '\\bprozac\\b', '\\bsarafem\\b', 'fluoxetine', '\\bzoloft\\b', 'sertraline',
    '\\blexapro\\b', 'escitalopram', '\\bpaxil\\b', 'paroxetine', 'effexor', 'venlafaxine',
    'wellbutrin', 'bupropion', '\\bbrisdelle\\b', '\\bveozah\\b', 'fezolinetant',
    '\\bmacrobid\\b', 'nitrofurantoin', '\\bbactrim\\b', '\\bcipro\\b', 'ciprofloxacin',
    '\\bmonurol\\b', 'fosfomycin', '\\bzofran\\b', 'ondansetron',
    '\\bmetformin\\b', 'glucophage', 'spironolactone', '\\baldactone\\b',
    '\\borilissa\\b', 'elagolix', 'myfembree',
    '\\bimitrex\\b', 'sumatriptan',
    '\\bozempic\\b', '\\bwegovy\\b', 'semaglutide', '\\bmounjaro\\b', '\\bzepbound\\b', 'tirzepatide',
    // Emergency contraception is technically OTC in the US, but Winx Health's
    // own "Restart(TM)" line is sold bundled with a required telehealth
    // consult on their site (same "Online Prescription"-adjacent pattern as
    // their explicitly-Rx SKUs) — excluded here for the same reason: this
    // endpoint imports standalone shoppable SKUs, not
    // prescription/consult-gated ones, regardless of legal OTC status.
    'morning-after', 'emergency contracept',
  ].join('|'),
  'i'
);

// Shopify's own product_type field is the strongest signal when a store
// tags it (confirmed live: Oboo tags every kit/bundle product_type==='Bundle'
// exactly). Title-based fallback covers stores that don't tag consistently.
// "kit"/"combo"/"set"/"duo" alone is NOT enough — some brands use those words
// for a genuinely single-purpose product (Oboo's "Moon Anal Training Kit" is
// one real SKU, not a bundle of other SKUs on the same feed) — so those only
// downgrade a product out of auto-approval eligibility (see
// categoryConfident) rather than excluding it outright; only the
// high-confidence words below are hard exclusions.
const BUNDLE_EXCLUDE_PATTERN = /\b(value pack|bundle|donation|gift card)\b/i;
const BUNDLE_SOFT_PATTERN = /\b(kit|combo|duo|starter set)\b/i;

const MERCH_EXCLUDE_PATTERN = /\b(crewneck|hoodie|t-?shirt|tote\s*bag|baseball cap|beanie|sticker|mug|tumbler|apparel|tee\b)\b/i;

/**
 * Ordered keyword classifier: title/body/product_type/tags -> Ayna category
 * + health functions. Deliberately rule-based (not an LLM call per product)
 * — transparent, free, fast, and testable; a brand's full feed can be
 * dozens of SKUs and this runs on every one of them per request.
 *
 * Order matters: earlier rules win. "Test"/"diagnostic" language is checked
 * first because a pregnancy or UTI test should land in 'diagnostics', not
 * 'pregnancy'/'supplement' just because those words also appear.
 *
 * Returns { category, healthFunctions, confident }. confident=false means
 * nothing matched clearly (category fell back to 'other') — these still get
 * inserted (pending review can still be useful), but categoryConfident
 * being false additionally blocks auto-approval regardless of recall/URL
 * status, on top of isAutoApprovable's own checks.
 */
export function classifyShopifyProduct({ title = '', bodyText = '', productType = '', tags = [] }) {
  const haystack = [title, bodyText, productType, (Array.isArray(tags) ? tags.join(' ') : String(tags || ''))]
    .join(' ')
    .toLowerCase();
  const has = (re) => re.test(haystack);

  const rules = [
    { test: /\b(test|testing|diagnostic|strip)\b/, category: 'diagnostics', healthFunctions: [] },
    { test: /period underwear|leakproof underwear|period panties|period brief/, category: 'period-underwear', healthFunctions: ['menstrual-collection'] },
    { test: /\btampons?\b/, category: 'tampon', healthFunctions: ['menstrual-collection'] },
    { test: /menstrual cup|period cup/, category: 'cup', healthFunctions: ['menstrual-collection'] },
    { test: /menstrual disc|period disc/, category: 'disc', healthFunctions: ['menstrual-collection'] },
    { test: /\bpads?\b|sanitary napkin/, category: 'pad', healthFunctions: ['menstrual-collection'] },
    { test: /pelvic floor|kegel/, category: 'pelvic-floor', healthFunctions: [] },
    { test: /postpartum|nursing pad|breastfeeding|c-section recovery/, category: 'postpartum', healthFunctions: [] },
    { test: /prenatal|pregnan(t|cy)/, category: 'pregnancy', healthFunctions: ['fertility'] },
    { test: /menopause|perimenopause|hot flash/, category: 'menopause', healthFunctions: ['perimenopause'] },
    { test: /fertility|ovulation|ttc\b/, category: 'fertility', healthFunctions: ['fertility'] },
    { test: /condom|diaphragm|birth control|contracept/, category: 'contraception', healthFunctions: ['contraception'] },
    { test: /vibrator|massager\b|wand\b|dildo|sex toy/, category: 'sex-tech', healthFunctions: ['sexual-health'] },
    { test: /vulva|vaginal|yoni|feminine wash|intimate wash/, category: 'intimate-care', healthFunctions: ['vaginal-health'] },
    { test: /\bcramp|period pain|heating pad/, category: 'cramp-relief', healthFunctions: ['cramp-relief'] },
    { test: /uti\b|urinary tract|bladder health/, category: 'supplement', healthFunctions: ['uti-prevention'] },
    { test: /tracker|wearable ring|smart ring/, category: 'tracker', healthFunctions: ['cycle-tracking'] },
    { test: /mood|stress relief|anxiety|sleep aid/, category: 'mental-health', healthFunctions: ['mental-health'] },
    { test: /supplement|vitamin|gumm(y|ies)|capsule|tablet|probiotic|tincture|herbal/, category: 'supplement', healthFunctions: [] },
  ];

  for (const rule of rules) {
    if (has(rule.test)) {
      const healthFunctions = rule.healthFunctions.filter((h) => VALID_HEALTH_FUNCTIONS.has(h));
      return { category: rule.category, healthFunctions, confident: true };
    }
  }
  return { category: 'other', healthFunctions: [], confident: false };
}

/** True when a Shopify product should never be imported at all (not just downgraded). */
export function shouldExcludeShopifyProduct({ title = '', bodyText = '', productType = '', tags = [] }) {
  const haystack = [title, bodyText, productType, (Array.isArray(tags) ? tags.join(' ') : String(tags || ''))].join(' ');
  if (PRESCRIPTION_DRUG_PATTERN.test(haystack)) return 'prescription';
  if (String(productType).trim().toLowerCase() === 'bundle') return 'bundle';
  if (BUNDLE_EXCLUDE_PATTERN.test(haystack)) return 'bundle';
  if (MERCH_EXCLUDE_PATTERN.test(haystack)) return 'merch';
  if (!title.trim()) return 'no_title';
  return null;
}

function stripHtml(html) {
  return String(html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Normalizes a raw hostname/URL input into a bare hostname, or null if unusable. */
export function normalizeDomain(input) {
  const raw = String(input || '').trim();
  if (!raw) return null;
  try {
    const withProto = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    // Strips a leading "www." so "www.oboo.love" and "oboo.love" (or an https
    // URL with either) all normalize to the same bare domain — otherwise the
    // same brand submitted two slightly different ways would import twice.
    const host = new URL(withProto).hostname.toLowerCase().replace(/^www\./, '');
    return host || null;
  } catch {
    return null;
  }
}

/**
 * Fetches {domain}/products.json and returns the raw product array, or null
 * if this isn't a Shopify store (or the fetch fails). Shape-checked, not
 * just status-checked — a non-Shopify site typically 404s or serves its
 * normal HTML at this path with a 200, neither of which is
 * `{ products: [...] }` JSON with the fields a real Shopify feed always has.
 */
export async function fetchShopifyProducts(domain) {
  const url = `https://${domain}/products.json?limit=250`;
  let res;
  try {
    res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: AbortSignal.timeout(10_000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
        Accept: 'application/json',
      },
    });
  } catch {
    return null;
  }
  if (!res.ok) return null;
  let data;
  try {
    data = await res.json();
  } catch {
    return null;
  }
  if (!data || !Array.isArray(data.products)) return null;
  // Shape check beyond "has a products array": a real Shopify product has a
  // title and a variants array with a price. An empty store (0 products) is
  // still a valid Shopify store — genuinely nothing to import, not an error.
  if (data.products.length > 0) {
    const sample = data.products[0];
    const looksReal = typeof sample?.title === 'string' && Array.isArray(sample?.variants) && sample.variants.length > 0;
    if (!looksReal) return null;
  }
  return data.products;
}

/** One Shopify product -> the { name, brand, category, ... } shape toRow() expects, or null if excluded. */
export function shopifyProductToCandidate(product, { domain, brand }) {
  const title = String(product?.title || '').trim();
  const bodyText = stripHtml(product?.body_html);
  const productType = String(product?.product_type || '');
  const tags = Array.isArray(product?.tags) ? product.tags : typeof product?.tags === 'string' ? product.tags.split(',') : [];

  const excludeReason = shouldExcludeShopifyProduct({ title, bodyText, productType, tags });
  if (excludeReason) return { excluded: excludeReason, title };

  const variant = Array.isArray(product?.variants) ? product.variants[0] : null;
  const priceNum = variant?.price != null ? Number(variant.price) : null;
  const price = Number.isFinite(priceNum) ? `$${priceNum % 1 === 0 ? priceNum : priceNum.toFixed(2)}` : null;
  const handle = String(product?.handle || '').trim();
  if (!handle) return { excluded: 'no_handle', title };
  const url = `https://${domain}/products/${handle}`;
  const image = Array.isArray(product?.images) && product.images[0]?.src ? String(product.images[0].src) : null;

  const { category, healthFunctions, confident } = classifyShopifyProduct({ title, bodyText, productType, tags });
  const softBundleMatch = BUNDLE_SOFT_PATTERN.test(`${title} ${productType}`);

  return {
    excluded: null,
    candidate: {
      name: title.slice(0, 200),
      brand: brand.slice(0, 100),
      type: 'physical',
      summary: bodyText.slice(0, 500) || `A ${brand} product.`,
      price,
      url,
      image,
      healthFunctions,
      tags: [],
      whereToBuy: [],
      safety: {
        fdaStatus: category === 'diagnostics'
          ? 'Consumer diagnostic test; verify current FDA status and any bundled prescription-treatment terms directly with the brand.'
          : category === 'supplement'
            ? 'Dietary supplement; not evaluated by the FDA.'
            : 'Verify current FDA/regulatory status directly with the brand.',
        materials: 'See product packaging for full ingredient/material list.',
        recalls: '',
        sideEffects: 'Consult a clinician before use if pregnant, nursing, or taking medications.',
        opinionAlerts: `Imported from ${domain}'s own product catalog; description and any claims are the brand's own, not independently verified.`,
      },
      clinicianOpinionSource: 'brand',
      clinicianAttribution: `Sourced from ${brand}'s own site catalog, not independent clinical literature.`,
      doctorOpinion: '',
      effectiveness: `Positioned by the brand for its stated use; no independent clinical study of the product was found.`,
    },
    category,
    categoryConfident: confident && !softBundleMatch,
  };
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error('[discover-brand-catalog] CRON_SECRET is not set; refusing all requests.');
    return res.status(401).json({ error: 'unauthorized' });
  }
  const authHeader = req.headers.authorization || '';
  if (authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('[discover-brand-catalog] Supabase env not configured.');
    return res.status(503).json({ error: 'not_configured' });
  }
  const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: 'invalid_json' });
  }

  const domain = normalizeDomain(body?.domain);
  const brand = String(body?.brand || '').trim().slice(0, 100);
  if (!domain) return res.status(400).json({ error: 'invalid_domain' });
  if (!brand) return res.status(400).json({ error: 'missing_brand' });

  const rawProducts = await fetchShopifyProducts(domain);
  if (rawProducts === null) {
    return res.status(200).json({
      domain, brand, isShopify: false,
      message: `${domain} doesn't look like a Shopify store (no valid /products.json feed found) — nothing imported.`,
    });
  }
  if (rawProducts.length === 0) {
    return res.status(200).json({ domain, brand, isShopify: true, found: 0, message: 'Shopify store found, but it has zero products.' });
  }

  const excludedCounts = {};
  const candidates = [];
  for (const raw of rawProducts) {
    const result = shopifyProductToCandidate(raw, { domain, brand });
    if (result.excluded) {
      excludedCounts[result.excluded] = (excludedCounts[result.excluded] || 0) + 1;
      continue;
    }
    candidates.push(result);
  }

  if (!candidates.length) {
    return res.status(200).json({
      domain, brand, isShopify: true, found: rawProducts.length, excluded: excludedCounts,
      inserted: 0, message: 'Nothing left to import after filtering.',
    });
  }

  // Dedup against the entire existing catalog (not scoped to one category —
  // a brand's products can land in several), same key function the LLM
  // discovery path uses.
  const { data: existingRows, error: existingError } = await admin
    .from('product_catalog')
    .select('id, review_status');
  if (existingError) {
    return res.status(500).json({ error: 'discovery_failed', message: `could not read existing catalog: ${existingError.message}` });
  }
  const existingIds = new Map((existingRows || []).map((r) => [r.id, r.review_status]));

  const seenThisRun = new Set();
  const rows = [];
  let duplicateCount = 0;
  for (const { candidate, category, categoryConfident } of candidates) {
    const id = `disc-${slugify(candidate.brand)}-${slugify(candidate.name)}`.slice(0, 120);
    const key = normalizeKey(candidate.name, candidate.brand);
    if (seenThisRun.has(key)) continue;
    seenThisRun.add(key);
    if (existingIds.has(id)) {
      duplicateCount += 1;
      continue; // never touch an id a human (or an earlier run) has already reviewed
    }

    const recall = await checkRecallsForProduct({ name: candidate.name, brand: candidate.brand, category }).catch(() => null);
    if (!recall || recall.status === 'failed') continue; // unknown safety state — skip this run, pick up next time

    const row = toRow(
      { ...candidate, safety: { ...candidate.safety, recalls: recall.hasRecalls ? '⚠️ Active FDA recall record(s) found — review before approving.' : 'No recalls found.' } },
      { category, searchHits: [], provider: 'shopify-feed' }
    );
    row.id = id;
    // toRow() only fills these from `candidate` for the fields the
    // LLM-generation path already sets on its own candidates — the rest
    // (clinician_opinion_source, clinician_attribution, effectiveness) it
    // hardcodes to null regardless of input, so they're set here instead,
    // matching the honest-brand-sourced style established by hand for
    // Oboo/Winx Health earlier this session.
    row.health_functions = candidate.healthFunctions;
    row.clinician_opinion_source = candidate.clinicianOpinionSource || null;
    row.clinician_attribution = candidate.clinicianAttribution || null;
    row.effectiveness = candidate.effectiveness || null;
    row.discovery_meta = {
      discoveredAt: new Date().toISOString(),
      provider: 'shopify-feed',
      sourceDomain: domain,
      recallCheck: { status: recall.status, hasRecalls: recall.hasRecalls, checkedAt: recall.checkedAt },
      categoryConfident,
    };
    rows.push({ row, categoryConfident });
  }

  const toInsert = await Promise.all(
    rows.map(async ({ row, categoryConfident }) => {
      // categoryConfident gates auto-approval on top of isAutoApprovable's
      // own recall+URL checks — a product this classifier couldn't place
      // confidently should never silently go live even if otherwise clean.
      if (!categoryConfident || !isAutoApprovable(row)) return row;
      const urlIsLive = await verifyUrlIsLive(row.url);
      if (!urlIsLive) return row;
      return {
        ...row,
        review_status: 'approved',
        is_active: true,
        discovery_meta: { ...row.discovery_meta, autoApproved: true, autoApprovedAt: new Date().toISOString() },
      };
    })
  );

  let inserted = 0;
  if (toInsert.length) {
    const { error: insertError } = await admin.from('product_catalog').insert(toInsert);
    if (insertError) {
      return res.status(500).json({ error: 'discovery_failed', message: `insert failed: ${insertError.message}` });
    }
    inserted = toInsert.length;
  }

  return res.status(200).json({
    domain, brand, isShopify: true,
    found: rawProducts.length,
    excluded: excludedCounts,
    duplicates: duplicateCount,
    inserted,
    autoApproved: toInsert.filter((r) => r.discovery_meta?.autoApproved).length,
    insertedIds: toInsert.map((r) => r.id),
  });
}
