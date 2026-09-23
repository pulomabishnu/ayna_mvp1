/* global process */
import { retrieveKnowledgeForIntake, buildKnowledgeContext } from '../src/utils/ragRetrieval.js';
import { verifyUser, claimEcosystemBuild, releaseEcosystemBuild } from './_usageLimit.js';
import { callWithFallback, parseProviderOrder, tryParseJsonCandidate, providerConfigured } from './_llm.js';
import { isPremiumUser, hasLegacyClientPremiumFlag } from './_entitlement.js';
import { routeHealthQuery } from './_healthKnowledge.js';
import {
  loadGroundingCatalog,
  buildCatalogIndex,
  resolveCatalogProduct,
  hydrateFromCatalog,
  formatCatalogForPrompt,
  CATALOG_ONLY_RULES,
} from './_catalogGrounding.js';
import { CONCERN_CONFIG } from '../src/utils/recommendationEngine.js';
import { isRxOnlyProduct } from '../src/data/products.js';

// Hard ceilings on client-supplied work. Without these, one request with 500
// primaryConcerns and batchSize 500 issued 500 sequential LLM calls.
//
// 12 was silently dropping real selections: the "What do you want help
// with?" quiz (CONCERN_AREAS in src/utils/healthIntake.js) has 18 checkbox
// options on its own (16 raised to 18 on 2026-08-25, adding Pregnancy
// support and Postpartum recovery per real beta feedback), before any
// conditions/symptoms/goals-derived concerns are added on top in
// selectedConcerns() below — a user who picked more than 12 checkboxes (not
// an edge case; the quiz explicitly says "Pick as many as you want") had the
// excess truncated with no error, no UI signal, nothing (found live
// 2026-08-25). Raised to comfortably cover all 18 real options plus some
// derived headroom, while still bounding a client that bypasses the UI and
// sends an arbitrarily long primaryConcerns array directly.
const MAX_CONCERNS = 20;
const MAX_BATCH_SIZE = 6;
/** Leave room to serialize and return before the platform kills the function. */
const FUNCTION_BUDGET_MS = 50_000;

function anyApiKeyConfigured() {
  return ['anthropic', 'openai', 'gemini'].some((provider) =>
    providerConfigured(provider)
  );
}

// ─── Intake PII sanitization ──────────────────────────────────────────────────

function ageRange(age) {
  const n = parseInt(age, 10);
  if (!n || isNaN(n)) return 'unknown';
  if (n < 25) return 'under 25';
  if (n < 35) return '25-34';
  if (n < 45) return '35-44';
  if (n < 55) return '45-54';
  return '55+';
}

function zipOnly(location) {
  if (!location) return 'not provided';
  const match = String(location).match(/\b(\d{5})(?:-\d{4})?\b/);
  return match ? match[1] : 'not provided';
}

// Strip PII fields that must never reach Claude; replace age/location with
// privacy-safe equivalents. Applied once at the API boundary in handleRequest.
function sanitizeIntake(raw) {
  if (!raw || typeof raw !== 'object') return raw || {};
  // Destructure to explicitly drop identifying fields
  // eslint-disable-next-line no-unused-vars
  const { email, name, user_id, userId, fullAddress, address, ...rest } = raw;
  return {
    ...rest,
    age: ageRange(raw.age),
    location: zipOnly(raw.location),
  };
}

function selectedConcerns(intake = {}) {
  const blocked = new Set(['general discomfort', 'other']);
  const concerns = new Set();
  const profile =
    intake?.fullHealthIntake && typeof intake.fullHealthIntake === 'object'
      ? intake.fullHealthIntake
      : intake;

  // 1. Explicitly selected by user (plus anything she typed herself —
  // customConcerns was collected by HealthProfileEditor and then never read,
  // so user-authored concerns produced no recommendations at all).
  const explicit = [
    ...(Array.isArray(intake.primaryConcerns) ? intake.primaryConcerns : (intake.primaryConcern ? [intake.primaryConcern] : [])),
    ...(Array.isArray(intake.customConcerns) ? intake.customConcerns : []),
  ];
  for (const c of explicit) {
    const v = String(c || '').trim().slice(0, 120);
    if (v && !blocked.has(v.toLowerCase())) concerns.add(v);
  }

  const rawConditions =
    Array.isArray(profile?.diagnosisSelections) && profile.diagnosisSelections.length > 0
      ? profile.diagnosisSelections
      : (Array.isArray(intake.conditions) ? intake.conditions : []);

  const rawMedications =
    Array.isArray(profile?.currentMedicationItems) && profile.currentMedicationItems.length > 0
      ? profile.currentMedicationItems
      : (intake.currentMedications ? [intake.currentMedications] : []);

  const conditions = rawConditions.map(c => String(c).toLowerCase());
  const symptoms   = (Array.isArray(intake.symptoms) ? intake.symptoms : []).map(s => String(s).toLowerCase());
  const goals      = (Array.isArray(intake.goals) ? intake.goals : []).map(g => String(g).toLowerCase());

  const supportSelections =
    Array.isArray(profile?.supportSelections)
      ? profile.supportSelections.map(s => String(s).toLowerCase())
      : [];

  const allText = [
    ...conditions,
    ...symptoms,
    ...goals,
    ...supportSelections,
    ...rawMedications,
    String(intake.dislikedProductsText || ''),
  ].join(' ').toLowerCase();
  const has = (...terms) => terms.some(t => allText.includes(t));
  const hasConcern = (substr) => [...concerns].some(c => c.toLowerCase().includes(substr));

  // 2. Derive from conditions
  if (conditions.some(c => c.includes('pcos')) && !hasConcern('pcos'))
    concerns.add('PCOS management (supplements, telehealth, apps)');
  if (conditions.some(c => c.includes('endometriosis')) && !hasConcern('endometriosis'))
    concerns.add('Endometriosis management (supplements, devices, telehealth)');
  if (conditions.some(c => c.includes('thyroid') || c.includes('hypothyroid') || c.includes('hyperthyroid')) && !hasConcern('hormone balance'))
    concerns.add('Hormone balance (supplements, lifestyle)');

  // 3. Derive from symptoms
  if (symptoms.some(s => s.includes('bloat')) && !hasConcern('bloat'))
    concerns.add('Hormonal bloating');
  if (symptoms.some(s => s.includes('cramp')) && !hasConcern('cramp'))
    concerns.add('Cramp and pain relief (devices, supplements, heat)');
  if (symptoms.some(s => s.includes('fatigue') || s.includes('energy')) && !hasConcern('sleep'))
    concerns.add('Sleep and energy');
  if (symptoms.some(s => s.includes('mood') || s.includes('anxiety') || s.includes('depression')) && !hasConcern('mental'))
    concerns.add('Mental health and cycle mood support');
  if (symptoms.some(s => s.includes('acne') || s.includes('hair loss') || s.includes('hair thin')) && !hasConcern('skin'))
    concerns.add('Skin and hair (hormone-related)');
  if (symptoms.some(s => s.includes('insomnia') || s.includes('sleep')) && !hasConcern('sleep'))
    concerns.add('Sleep and energy');

  // 4. Derive from signals / other intake fields
  if ((intake.tryingToConceive === 'yes' || has('conceive', 'ttc', 'fertility')) && !hasConcern('fertil'))
    concerns.add('Fertility and conception (supplements, trackers, telehealth)');
  if ((/\buti(s)?\b/.test(allText) || allText.includes('urinary tract')) && !hasConcern('uti'))
    concerns.add('UTI support');
  if (has('vaginal', 'ph balance', 'bacterial vaginosis', 'bv', 'yeast') && !hasConcern('vaginal') && !hasConcern('gut'))
    concerns.add('Gut and vaginal health (probiotics, pH balance)');
  if ((intake.menstrualCycle === 'irregular' || intake.menstrualCycle === 'irregular_perimenopause') && !hasConcern('hormone') && !hasConcern('pcos'))
    concerns.add('Hormone balance (supplements, lifestyle)');
  if ((intake.menstrualCycle === 'no_menopause' || intake.menstrualCycle === 'irregular_perimenopause') && !hasConcern('menopause'))
    concerns.add('Perimenopause and menopause support');

  // 5. Direct goal → concern mapping — every selected goal gets its own product track
  // "find safer products" and "reduce chemical exposure" are NOT separate tracks —
  // they are cross-cutting preferences injected into every prompt instead (see buildPromptForOneConcern).
  // Each entry: [concern label, dedup keyword] — skip if hasConcern(keyword) already true
  const GOAL_CONCERN = {
    'track my cycle':                                    ['Cycle tracking (apps, wearables, devices)', 'cycle tracking'],
    'learn what ingredients to avoid for my conditions': null,
    'find a provider or specialist':                     ['Telehealth and specialist matching', 'telehealth'],
    'find mental health support for cycle symptoms':     ['Mental health and cycle mood support', 'mental health'],
    'improve my gut or vaginal health':                  ['Gut and vaginal health (probiotics, pH balance)', 'gut'],
    'support fertility / ttc':                           ['Fertility and conception (supplements, trackers, telehealth)', 'fertil'],
    'manage perimenopause or menopause':                 ['Perimenopause and menopause support', 'menopause'],
    'build my health routine':                           ['Women\'s health apps and services for building a health routine (cycle tracking, wellness coaching, health platforms)', 'routine'],
    'manage symptoms':                                   null,
    'understand my condition':                           null,
    'find safer products':                               null,
    'reduce chemical exposure':                          null,
  };
  for (const g of goals) {
    const entry = GOAL_CONCERN[g.trim()];
    if (!entry) continue;
    const [concern, dedupKey] = entry;
    if (!hasConcern(dedupKey)) concerns.add(concern);
  }

  const result = [...concerns].filter(c => !blocked.has(c.toLowerCase()));
  return result.length ? result : [];
}

// "Never name prescription medications" is already a prompt rule (see SCOPE
// below), but the model doesn't reliably follow it — tranexamic acid/Lysteda
// kept slipping through despite an explicit prompt line naming it, which is
// why this backstop exists at all. Rather than add one drug at a time as each
// one is spotted live, this covers the classes of Rx drug most likely to come
// up in a women's-health context: hormonal birth control, HRT, PMDD/menopause
// antidepressants, UTI antibiotics, PCOS/metabolic, endometriosis, migraine
// triptans, and GLP-1s, by brand and generic name, plus the literal word
// "prescription" if the model names the requirement itself.
const PRESCRIPTION_DRUG_PATTERN = new RegExp(
  [
    '\\bprescription\\b', 'tranexamic', 'tranexemic', '\\blysteda\\b',
    // Hormonal birth control
    '\\byaz\\b', 'yasmin', '\\bjunel\\b', 'loestrin', 'ortho\\s*tri-?cyclen', '\\bsprintec\\b',
    'nuvaring', 'annovera', '\\bxulane\\b', '\\btwirla\\b', 'nexplanon', '\\bmirena\\b',
    'kyleena', '\\bskyla\\b', 'liletta', 'depo-?provera',
    // Hormone replacement therapy
    '\\bpremarin\\b', '\\bestrace\\b', 'prometrium', 'vivelle', 'climara', '\\bduavee\\b',
    'estring', 'evamist', 'prempro', 'activella', 'bijuva',
    // PMDD / menopause / mood
    '\\bprozac\\b', '\\bsarafem\\b', 'fluoxetine', '\\bzoloft\\b', 'sertraline',
    '\\blexapro\\b', 'escitalopram', '\\bpaxil\\b', 'paroxetine', 'effexor', 'venlafaxine',
    'wellbutrin', 'bupropion', '\\bbrisdelle\\b', '\\bveozah\\b', 'fezolinetant',
    // UTI antibiotics
    '\\bmacrobid\\b', 'nitrofurantoin', '\\bbactrim\\b', '\\bcipro\\b', 'ciprofloxacin',
    '\\bmonurol\\b', 'fosfomycin',
    // PCOS / metabolic
    '\\bmetformin\\b', 'glucophage', 'spironolactone', '\\baldactone\\b',
    // Endometriosis
    '\\borilissa\\b', 'elagolix', 'myfembree',
    // Migraine triptans (sometimes cross-recommended for hormonal headaches)
    '\\bimitrex\\b', 'sumatriptan',
    // GLP-1s (sometimes cross-recommended for PCOS/weight goals)
    '\\bozempic\\b', '\\bwegovy\\b', 'semaglutide', '\\bmounjaro\\b', '\\bzepbound\\b', 'tirzepatide',
  ].join('|'),
  'i'
);

function isBlockedRecommendationProduct(p) {
  if (!p || typeof p !== 'object') return false;
  const text = [
    p.id,
    p.name,
    p.brand,
    p.summary,
    p.whyItWorks,
    p.considerations,
    p.category,
    p.searchTerms,
  ]
    .flat()
    .filter(Boolean)
    .join(' ');
  return PRESCRIPTION_DRUG_PATTERN.test(text);
}

/**
 * PRODUCT INTEGRITY (2026-09-22 audit): a model-returned product is only
 * kept if it resolves to a real catalog record; the returned object IS that
 * catalog record plus the model's personalization prose. Model-supplied
 * names, brands, prices, URLs, images, summaries and safety text are
 * discarded. The id is the catalog id so product pages, links and saved
 * ecosystem rows always point at a real listing.
 */
function enrichProduct(p, catalogIndex) {
  if (!p || typeof p !== 'object') return null;
  const catalogProduct = resolveCatalogProduct(p, catalogIndex);
  if (!catalogProduct) return null;
  if (isRxOnlyProduct(catalogProduct)) return null;
  const hydrated = hydrateFromCatalog(catalogProduct, p, { intakeGenerated: true });
  if (isBlockedRecommendationProduct({ id: hydrated.id, name: hydrated.name, brand: hydrated.brand, category: hydrated.category })) return null;
  return hydrated;
}

function enrichRecommendations(recs, requestedConcern = '', catalogIndex = null) {
  const list = Array.isArray(recs) ? recs : [];
  return list
    .map((entry) => {
      const usedIds = new Set();
      const normalizedTiers = (Array.isArray(entry?.tiers) ? entry.tiers : [])
        .map((tier, tierIdx) => {
          const tierProduct = enrichProduct(tier?.product || tier?.topProduct, catalogIndex);
          if (tierProduct && usedIds.has(tierProduct.id)) return null;
          if (tierProduct) usedIds.add(tierProduct.id);
          if (!tierProduct) return null;
          const tierAlternatives = (Array.isArray(tier?.alternatives) ? tier.alternatives : [])
            .map((alt) => enrichProduct(alt, catalogIndex))
            .filter(Boolean)
            .filter((alt) => alt.id !== tierProduct.id)
            .slice(0, 1);
          const tierName = String(tier?.name || '').trim() || `Option ${tierIdx + 1}`;
          const tierSubcategory = String(tier?.subcategory || '').trim();
          return {
            id: String(tier?.id || `tier-${tierIdx + 1}`).trim(),
            name: tierName,
            subcategory: tierSubcategory || tierName,
            product: tierProduct,
            alternatives: tierAlternatives,
            safetyFlags: Array.isArray(tier?.safetyFlags) ? tier.safetyFlags.slice(0, 5).map((x) => String(x)) : [],
            matchExplanation: String(tier?.matchExplanation || tierProduct?.whyItWorks || '').trim(),
          };
        })
        .filter(Boolean);

      const fallbackTop = enrichProduct(entry?.topProduct, catalogIndex);
      const fallbackAlts = (Array.isArray(entry?.alternatives) ? entry.alternatives : [])
        .map((alt) => enrichProduct(alt, catalogIndex))
        .filter(Boolean)
        .slice(0, 1);

      const tiers = normalizedTiers.length > 0
        ? normalizedTiers
        : (fallbackTop
          ? [{
              id: 'tier-1',
              name: 'Top pick',
              subcategory: 'Top pick',
              product: fallbackTop,
              alternatives: fallbackAlts.filter((alt) => alt.id !== fallbackTop.id),
              safetyFlags: [],
              matchExplanation: String(fallbackTop?.whyItWorks || '').trim(),
            }]
          : []);
      const topProduct = tiers[0]?.product || fallbackTop || null;
      if (!topProduct) return null;
      const alternatives = tiers[0]?.alternatives || fallbackAlts;
      return {
        concern: requestedConcern || String(entry?.concern || '').trim() || 'Recommendations',
        topProduct,
        alternatives,
        notes: Array.isArray(entry?.notes) ? entry.notes.slice(0, 5).map((x) => String(x)) : [],
        tiers,
      };
    })
    .filter(Boolean);
}

// DSLD's free-text search returns its best-effort top hit even when nothing
// in the database is actually a good match — it's search, not verification.
// Blindly trusting hit #1 (the original implementation) matched "Always
// Infinity" (a menstrual pad) to "Rhino Infinity 10K" (an unrelated men's
// supplement) purely because both contain the word "infinity", and that
// wrong supplement's label photo then rendered as the pad's product image —
// confirmed live in production. Score each candidate against the query the
// same way _shopifyProductMatch.js does (token containment, not a plain
// substring/ES-score check) and reject anything that isn't a genuine match.
function normalizeDsldTokens(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .filter((t) => t.length > 2);
}

function dsldMatchScore(queryTokens, candidateName) {
  const candTokens = normalizeDsldTokens(candidateName);
  if (queryTokens.length === 0 || candTokens.length === 0) return { score: 0, overlap: 0 };
  const candSet = new Set(candTokens);
  const querySet = new Set(queryTokens);
  let overlap = 0;
  for (const t of querySet) {
    if (candSet.has(t)) overlap += 1;
  }
  const smaller = Math.min(querySet.size, candSet.size);
  return { score: overlap / smaller, overlap };
}

export async function lookupDsldProduct(name) {
  if (!name || name.length < 3) return null;
  try {
    // WAS `/dsld/v9/label?name=...` — that path returns the API's own HTML
    // docs page (not JSON) for any request; it silently failed every single
    // call and nobody noticed because the try/catch swallowed it and every
    // caller just treated "no DSLD data" as a normal, expected miss. Found by
    // testing the real API live: `/v9/search-filter?q=...` is the endpoint
    // that actually returns real hits, confirmed against a genuine product.
    const url = `https://api.ods.od.nih.gov/dsld/v9/search-filter?q=${encodeURIComponent(name)}&size=5`;
    const r = await fetch(url, {
      headers: { Accept: 'application/json', 'User-Agent': 'Ayna-Health-App/1.0' },
      signal: AbortSignal.timeout(4000),
    });
    if (!r.ok) return null;
    const data = await r.json();
    // Flat `hits: [...]`, not the ES-style nested `hits.hits` the old code
    // assumed — also confirmed live, not guessed.
    const candidates = Array.isArray(data?.hits) ? data.hits : [];
    if (candidates.length === 0) return null;

    const queryTokens = normalizeDsldTokens(name);
    let top = null;
    let bestScore = 0;
    let bestOverlap = 0;
    for (const c of candidates) {
      const src = c?._source;
      if (!src) continue;
      const candidateName = `${src.brandName || ''} ${src.fullName || ''}`.trim();
      const { score, overlap } = dsldMatchScore(queryTokens, candidateName);
      if (score > bestScore) {
        bestScore = score;
        bestOverlap = overlap;
        top = c;
      }
    }
    // Same bar as the Shopify matcher: the smaller token set must be almost
    // fully contained in the other, and at least 2 real tokens in common —
    // this is a fuzzy match against a database that will always return
    // SOMETHING, not a search engine, so err toward no image over a wrong one.
    if (!top || bestScore < 0.75 || bestOverlap < 2) return null;

    const hit = top?._source;
    const dsldId = top?._id ? String(top._id) : '';
    if (!hit || !dsldId) return null;
    // Real field names from the actual response: allIngredients (not
    // dietaryIngredients), each with `name` (not `ingredientName`).
    const ingredients = Array.isArray(hit.allIngredients)
      ? hit.allIngredients.map((i) => i.name).filter(Boolean).slice(0, 8)
      : [];
    // The label JSON has no image field at all — the real photo lives at a
    // predictable S3 thumbnail path keyed by the same id, confirmed by
    // loading a real label page in a browser and reading its actual <img>
    // src rather than guessing a URL shape.
    return {
      verified: true,
      brand: hit.brandName || '',
      ingredients,
      dsldId,
      imageUrl: `https://api.ods.od.nih.gov/dsld/s3/pdf/thumbnails/${dsldId}.jpg`,
      labelUrl: `https://dsld.od.nih.gov/label/${dsldId}`,
    };
  } catch {
    return null;
  }
}

// ─── Internal clinical knowledge lookup (no product search) ─────────────────

async function searchProductsForConcerns(concerns, intake) {
  if (!concerns.length) return null;

  const profile =
    intake?.fullHealthIntake && typeof intake.fullHealthIntake === 'object'
      ? intake.fullHealthIntake
      : intake;

  const rawConditions =
    Array.isArray(profile?.diagnosisSelections) && profile.diagnosisSelections.length > 0
      ? profile.diagnosisSelections
      : (Array.isArray(intake?.conditions) ? intake.conditions : []);
  const conditionsForInternalLookup = rawConditions
    .filter((c) => !['none', 'other', 'none that i know of', 'prefer not to say'].includes(String(c).toLowerCase()))
    .slice(0, 6)
    .join(' ');

  const results = {};
  await Promise.all(
    concerns.map(async (concern) => {
      const cleanConcern = concern.replace(/\(.*?\)/g, '').trim();
      const internalQuery = [cleanConcern, conditionsForInternalLookup].filter(Boolean).join(' ');
      const routing = await routeHealthQuery(internalQuery, { limit: 4 });

      if (routing.internalHits.length) {
        results[concern] = routing.internalHits;
        return;
      }
      // No external web search: products come only from the Ayna catalog,
      // so outside search results would only invite invented products.
    })
  );

  return Object.keys(results).length ? results : null;
}

// ─── Concurrency limiter ──────────────────────────────────────────────────────
async function mapConcurrent(items, fn, limit = 4) {
  const results = new Array(items.length).fill(null);
  let nextIdx = 0;
  async function worker() {
    while (nextIdx < items.length) {
      const i = nextIdx++;
      try {
        results[i] = await fn(items[i], i);
      } catch (e) {
        // Backstop only — fn (the per-concern callback below) already has its
        // own try/catch, so this only fires on a genuine bug in that callback
        // itself. Still returns the same {failed, concern, reason} shape as a
        // normal per-concern failure so it isn't silently dropped from
        // failedConcerns downstream.
        console.error('[llm-recs] task failed:', e?.message);
        results[i] = { failed: true, concern: items[i], reason: e?.message || 'unexpected_error' };
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

// ─── Per-concern search context ───────────────────────────────────────────────
function formatSearchContextForConcern(concern, hits) {
  if (!hits?.length) return '';
  const internal = hits.every((h) => h.sourceType === 'ayna_knowledge');
  const lines = [internal
    ? `\nAYNA INTERNAL HEALTH KNOWLEDGE for "${concern}":`
    : `\nLIVE EXTERNAL SEARCH for "${concern}":`];
  hits.forEach((h, i) => {
    lines.push(`  ${i + 1}. ${h.title}`);
    if (h.snippet) lines.push(`     ${h.snippet}`);
    if (!internal && h.url) lines.push(`     Source: ${h.url}`);
    if (internal && Array.isArray(h.sourceNames) && h.sourceNames.length) {
      lines.push(`     Reviewed sources: ${h.sourceNames.join(', ')}`);
    }
  });
  lines.push(internal
    ? 'Use as clinical context. It is not evidence that a particular commercial product exists.'
    : 'Use as discovery signal only — quality bar still applies.');
  return lines.join('\n');
}

// ─── Catalog candidates per concern ───────────────────────────────────────────
const GENERIC_FORMAT_CATEGORIES = new Set(['supplement', 'telehealth', 'tracker', 'diagnostics', 'app', 'device']);
const CONCERN_STOPWORDS = new Set(['and', 'the', 'for', 'with', 'support', 'management', 'relief', 'care', 'health', 'devices', 'supplements', 'telehealth', 'apps', 'lifestyle', 'related']);

function concernConfigFor(concern) {
  const c = String(concern || '').toLowerCase().trim();
  return CONCERN_CONFIG.find((cfg) => cfg.key.toLowerCase() === c)
    || CONCERN_CONFIG.find((cfg) => {
      const head = cfg.key.toLowerCase().split(' (')[0];
      return c.startsWith(head) || head.startsWith(c);
    })
    || null;
}

/**
 * The slice of the catalog relevant to one concern, so each per-concern
 * prompt stays small (the whole catalog x 20 concerns would blow the shared
 * Anthropic TPM budget). Falls back to the full catalog when nothing matches,
 * so an unusual free-text concern still gets real options to choose from.
 */
export function catalogCandidatesForConcern(catalog, concern, max = 60) {
  const cfg = concernConfigFor(concern);
  const words = String(concern || '').toLowerCase().replace(/\(.*?\)/g, ' ').split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 3 && !CONCERN_STOPWORDS.has(w));
  const cfgTags = new Set((cfg?.tags || []).map((t) => t.toLowerCase()));
  const cfgCats = new Set((cfg?.categories || []).map((t) => t.toLowerCase()));
  const scored = [];
  for (const p of catalog || []) {
    if (isRxOnlyProduct(p)) continue;
    const cat = String(p.category || '').toLowerCase();
    const tags = (Array.isArray(p.tags) ? p.tags : []).map((t) => String(t).toLowerCase());
    const funcs = (Array.isArray(p.healthFunctions) ? p.healthFunctions : []).map((t) => String(t).toLowerCase());
    const text = `${p.name} ${p.brand || ''} ${p.summary || ''} ${tags.join(' ')} ${funcs.join(' ')}`.toLowerCase();
    const tagHit = tags.some((t) => cfgTags.has(t)) || funcs.some((f) => cfgTags.has(f));
    const wordHits = words.filter((w) => text.includes(w)).length;
    let score = 0;
    if (cfgCats.has(cat) && !GENERIC_FORMAT_CATEGORIES.has(cat)) score += 3;
    if (cfgCats.has(cat) && GENERIC_FORMAT_CATEGORIES.has(cat) && (tagHit || wordHits)) score += 2;
    if (tagHit) score += 2;
    score += Math.min(wordHits, 3);
    if (score > 0) scored.push({ p, score });
  }
  scored.sort((a, b) => b.score - a.score);
  const picked = scored.slice(0, max).map((x) => x.p);
  if (picked.length) return picked;
  return (catalog || []).filter((p) => !isRxOnlyProduct(p)).slice(0, max * 2);
}

// ─── Single-concern prompt ────────────────────────────────────────────────────
/** Client-supplied id lists: bounded and stripped of prompt-control characters. */
function capIdList(list, max = 40) {
  if (!Array.isArray(list) || list.length === 0) return 'none';
  return list
    .slice(0, max)
    .map((x) => String(x).replace(/[\r\n`]/g, ' ').trim().slice(0, 80))
    .filter(Boolean)
    .join(', ') || 'none';
}

function buildPromptForOneConcern(concern, intake = {}, feedback = {}, searchHits = null, catalogCandidates = []) {
  const concernFollowup = intake?.concernFollowups?.[concern];
  const profile = intake?.fullHealthIntake && typeof intake.fullHealthIntake === 'object'
    ? intake.fullHealthIntake
    : intake;
  const trustRanking = Array.isArray(profile?.trustRanking) && profile?.trustRankingTouched !== false
    ? profile.trustRanking
    : [];
  const knowledgeChunks = retrieveKnowledgeForIntake({ ...intake, primaryConcerns: [concern] }, 4);
  const knowledgeContext = buildKnowledgeContext(knowledgeChunks);

  const goals = (Array.isArray(intake?.goals) ? intake.goals : []).map(g => String(g).toLowerCase().trim());
  const wantsSaferProducts = goals.some(g => g === 'find safer products' || g === 'reduce chemical exposure' || g === 'learn what ingredients to avoid for my conditions');
  const saferProductsInstruction = wantsSaferProducts
    ? '\nSAFER PRODUCTS PREFERENCE (applies to ALL recommendations): This user wants to avoid chemical exposure and find safer products. For every physical product recommended, prioritize: certified organic, fragrance-free, unbleached/chlorine-free, BPA-free, clean-label options. Flag any ingredient concerns proactively. This is a hard preference across all tracks.'
    : '';

  return `
You are Ayna's clinical recommendation engine. Reason like a skilled OB/GYN or women's health specialist.

You CAN: make clinical inferences, recommend OTC products and supplements grounded in evidence, recommend telehealth specialists, explain mechanisms.
You CANNOT: diagnose, prescribe medications, or guarantee outcomes.

PATIENT PROFILE:
- Age: ${profile?.age || intake?.age || 'unknown'}, Location: ${intake?.location || profile?.zipcode || 'unknown'}
- Life stage: ${(Array.isArray(profile?.lifeStageSelections) ? profile.lifeStageSelections : []).join(', ') || profile?.lifeStage || 'not provided'}
- Pregnancy trimester: ${profile?.pregnancyTrimester || 'not applicable/not provided'}
- Postpartum timing: ${profile?.postpartumTiming || 'not applicable/not provided'}
- Breastfeeding: ${profile?.breastfeedingStatus || 'not applicable/not provided'}
- Perimenopause last period: ${profile?.perimenopauseLastPeriod || 'not applicable/not provided'}
- Period flow: ${profile?.periodFlow || intake?.flowLevel || 'not applicable/not provided'}
- Period pain: ${profile?.periodPain || intake?.painLevel || 'not applicable/not provided'}
- UTI frequency: ${profile?.utiFrequency || 'not applicable/not provided'}
- Insurance type: ${intake?.insuranceType || 'not provided'}, Provider: ${intake?.insurancePlan || 'not provided'}
- FSA/HSA: ${profile?.fsaHsaAnswer || intake?.fsaHsa || 'not provided'}
- All concerns: ${selectedConcerns(intake).join(', ') || (Array.isArray(profile?.supportSelections) ? profile.supportSelections.join(', ') : '') || 'none'}
- Conditions: ${
  (
    Array.isArray(profile?.diagnosisSelections) && profile.diagnosisSelections.length > 0
      ? profile.diagnosisSelections
      : (Array.isArray(intake?.conditions) ? intake.conditions : [])
  ).join(', ') || 'none'
}
- Family history: ${(Array.isArray(intake?.familyHistory) ? intake.familyHistory : []).join(', ') || 'not provided'}
- Symptom duration: ${intake?.symptomDuration || 'not provided'}, Last OB/GYN: ${intake?.lastObgynVisit || 'not provided'}
- Medications, supplements, vitamins, or hormonal birth control: ${
  (
    Array.isArray(profile?.currentMedicationItems) && profile.currentMedicationItems.length > 0
      ? profile.currentMedicationItems
      : (intake?.currentMedications ? [intake.currentMedications] : [])
  ).join(', ') || 'none'
}
- Cycle: ${intake?.menstrualCycle || 'unknown'}, Flow: ${intake?.flowLevel || 'unknown'}, Pain: ${intake?.painLevel ? `${intake.painLevel}/10` : 'unknown'}
- Symptoms: ${(Array.isArray(intake?.symptoms) ? intake.symptoms : []).join(', ') || 'none'}
- TTC: ${intake?.tryingToConceive || 'unknown'}, Birth control: ${intake?.hormonalBirthControl || 'unknown'}${intake?.hormonalBirthControlType ? ` (${intake.hormonalBirthControlType})` : ''}
- Preferred formats: ${(Array.isArray(profile?.preferredFormats) ? profile.preferredFormats : []).join(', ') || 'none'}
- Price range: ${(Array.isArray(profile?.priceRange) ? profile.priceRange : []).join(', ') || 'none'}
- Brand openness: ${profile?.brandOpenness || 'not provided'}
- Trusted brands: ${(Array.isArray(profile?.trustedBrands) ? profile.trustedBrands : []).join(', ') || 'none'}
- Ingredient/material/value preferences: ${(Array.isArray(profile?.avoidIngredients) ? profile.avoidIngredients : []).join(', ') || 'none'}
- Trust ranking, MOST important first: ${trustRanking.join(' > ') || 'not ranked'}
- Products currently using: ${(Array.isArray(intake?.currentProducts) ? intake.currentProducts : []).join(', ') || 'none'}
- Tried and disliked: ${intake?.dislikedProductsText || 'none'} — reason: ${intake?.dislikedReason || 'none'}
- Goals: ${(Array.isArray(intake?.goals) ? intake.goals : []).join(', ') || 'none'}
- Wearable data: ${intake?.wearableSummary?.text || intake?.healthDataText || 'none'}
- Ecosystem (already has): ${capIdList(feedback?.ecosystemProductIds)}
- Hidden products: ${capIdList(feedback?.omittedProductIds)}
${knowledgeContext ? `\nCLINICAL KNOWLEDGE:\n${knowledgeContext}` : ''}${searchHits ? '\n' + formatSearchContextForConcern(concern, searchHits) : ''}

SCOPE: Never name a prescription medication as a product recommendation, in any tier or alternative — this includes hormonal birth control (pills, patches, rings, IUDs, implants), hormone replacement therapy, prescription antidepressants/anxiolytics, prescription antibiotics, prescription weight-loss drugs (GLP-1s), and any other drug that legally requires a doctor's prescription in the US, even if it's commonly discussed for this concern. If the best answer to a concern is a prescription drug, say so only inside a telehealth tier's whyItWorks/matchExplanation text (e.g. "a clinician may discuss birth control options") and let the telehealth PRODUCT itself (the platform/service) be the recommendation — never the drug. If a concern requires diagnosis or labs, lead with telehealth. Pain 8+/10: always include telehealth.${saferProductsInstruction}

QUALITY BAR: Pick catalog products with clinical/scientific support for the mechanism and a genuine fit for this concern. Never add a product that is not in the catalog.

TRUST RANKING:
Use all three trust signals below, but when the patient supplied a Trust ranking above, honor THEIR order when breaking ties and ordering otherwise-comparable products. Their #1 ranked signal matters most, #2 next, #3 least.
- Clinical or scientific evidence: strength and relevance of research supporting the product or intervention.
- Reviews and experiences from other women: predominantly positive, credible community experience.
- Brand reputation or expert recommendations: reputable brand and meaningful clinician/expert support.
This trust ranking is a preference signal only. It must NEVER override safety, contraindications, life-stage appropriateness, or a clearly better goal/profile match.

AYNA CATALOG (the ONLY products you may recommend for this concern):
${formatCatalogForPrompt(catalogCandidates) || '(no catalog products available — return an empty tiers array)'}

${CATALOG_ONLY_RULES}

PERSONALIZATION:
- Explicit allergies, known contraindications, and items the user said to avoid are HARD FILTERS. Other shopping preferences such as format, price, brand openness, sustainability, and trust ranking should influence ordering but should not override safety or clinical relevance.
- FSA/HSA prioritization: if "FSA/HSA" in the profile above is not "not provided", prioritize FSA/HSA-eligible products (physical products/supplements sold as FSA/HSA-eligible in the US) when choosing between otherwise-comparable candidates for a track, and say so briefly in whyItWorks when it's a real factor in the pick. This is a real stated financial constraint, not a soft preference — weight it accordingly — but don't force a clearly worse product into the top spot just because it's eligible when a genuinely better-fit option isn't.
- Never recommend a brand she listed as disliked.
- whyItWorks must be in plain everyday language — no medical jargon. Explain: (1) simply how the product works (mechanism in lay terms), (2) why it fits her specific profile (condition, pain level, preference), (3) what makes it the top pick over the alternatives. A user should read this and immediately understand why you chose THIS product for HER over everything else available.
- CURRENTLY-USED BRAND COMPARISON: If "Products currently using" lists a brand in the same category as your top product recommendation, you MUST include one sentence in whyItWorks explaining what specifically makes your recommended product a better fit than the brand she already uses — whether it is ingredient quality, clinical evidence strength, organic certification, lower cost, better fit for her conditions, or another concrete reason. Be direct: "Compared to [brand she uses], [recommended product] offers [specific advantage] which matters for [her condition/preference]." If her currently-used product is in the catalog, include it as one of the alternatives so she can still choose it.
- Never recommend products she has hidden.
- Never recommend tranexamic acid products.

PRODUCT SPECIFICITY RULES — critical for quality:
- The physical product tier MUST be a health/wellness product specifically designed for this concern. Do NOT use generic consumer items (water bottles, blankets, heating pads for non-cramp concerns) or period collection products (pads, cups, tampons, period underwear) for any concern other than Period Care.
- The telehealth/app tier MUST use the catalog platform most relevant to this specific concern (e.g. a PCOS-specific service only for PCOS). If no catalog telehealth/app fits, omit that tier.
- Do not recommend generic hydration (water bottles) or lifestyle items as health products. Every product must be a purpose-built health, wellness, or medical product.

TASK: Generate recommendations for this ONE concern only: "${concern}"${concernFollowup ? `\nUser context: ${JSON.stringify(concernFollowup)}` : ''}

Generate 3 to 5 clinically relevant DISTINCT solution tracks for this concern whenever at least 3 safe, relevant, real options exist. The primary products across tracks must solve meaningfully different parts of the user's need or use meaningfully different formats. Do NOT fill the list with near-duplicates just because they score similarly.

DIVERSITY RULE:
- Prefer one strong option per distinct solution type before recommending a second product of the same type.
- A different brand of essentially the same product is an alternative, NOT a new primary track.
- Keep every primary product individually safe and relevant. Diversity never overrides safety or fit.
- If fewer than 3 genuinely safe/relevant distinct solution types exist in the catalog, return fewer rather than forcing weak products.
- Each included track should contain 1 primary product + up to 1 brief same-purpose alternative.

PERIOD CARE EXAMPLE:
Use the user's actual flow, spotting, pain, and format preferences. For someone with moderate flow + spotting + cramps, an appropriate diverse set could include a pad, a liner for spotting, an internal collection option such as a tampon/cup/disc if their format preferences allow it, and a purpose-built cramp-relief product. Do not return four pads. If the user prefers or avoids Internal products, honor that preference when ranking the internal option.

The JSON example below demonstrates the tier object schema. The "tiers" array may contain 3, 4, or 5 objects using that same schema.

Return ONLY valid JSON — exactly this shape:
{
  "recommendations": [
    {
      "concern": "${concern}",
      "tiers": [
        {
          "id": "tier-supplement",
          "name": "Supplement or wellness",
          "subcategory": "supplement",
          "matchExplanation": "1 sentence",
          "safetyFlags": [],
          "product": { "catalogId": "exact catalog id", "whyItWorks": "2 sentences: mechanism + personal fit", "considerations": "" },
          "alternatives": [
            { "catalogId": "exact catalog id", "whyItWorks": "1 sentence" }
          ]
        },
        {
          "id": "tier-physical",
          "name": "Physical product or device",
          "subcategory": "physical product",
          "matchExplanation": "1 sentence",
          "safetyFlags": [],
          "product": { "catalogId": "exact catalog id", "whyItWorks": "2 sentences: mechanism + personal fit", "considerations": "" },
          "alternatives": [
            { "catalogId": "exact catalog id", "whyItWorks": "1 sentence" }
          ]
        },
        {
          "id": "tier-digital",
          "name": "App or telehealth",
          "subcategory": "telehealth",
          "matchExplanation": "1 sentence",
          "safetyFlags": [],
          "product": { "catalogId": "exact catalog id", "whyItWorks": "2 sentences: mechanism + personal fit", "considerations": "" },
          "alternatives": [
            { "catalogId": "exact catalog id", "whyItWorks": "1 sentence" }
          ]
        }
      ],
      "notes": []
    }
  ]
}`.trim();
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(204).end();
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Wrap everything so unhandled throws return a useful error instead of Vercel's opaque 500
  try {
    return await handleRequest(req, res);
  } catch (e) {
    console.error('[LLM API] Unhandled error:', e?.message, e?.stack?.slice(0, 400));
    return res.status(500).json({ error: e?.message || String(e), type: 'unhandled_exception' });
  }
}

async function handleRequest(req, res) {

  if (!anyApiKeyConfigured()) {
    return res.status(503).json({
      error: 'not_configured',
      message: 'No LLM API key found. Set ANTHROPIC_API_KEY or OPENAI_API_KEY.',
    });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: 'invalid_json' });
  }

  const rawIntake = body?.intake || {};
  const feedback = body?.feedback || {};

  if (!rawIntake || typeof rawIntake !== 'object') {
    return res.status(400).json({ error: 'missing_intake' });
  }

  // Strip PII (email, name, user_id) and replace exact age/location with
  // privacy-safe equivalents before anything is sent to an LLM or search API.
  const intake = sanitizeIntake(rawIntake);

  // Cap everything the client controls. batchIndex/batchSize were previously
  // unbounded, so `batchSize: 500` issued 500 sequential LLM calls.
  const allConcerns = selectedConcerns(intake).slice(0, MAX_CONCERNS);
  const rawBatchIndex = Number.isInteger(body?.batchIndex) ? body.batchIndex : 0;
  const batchIndex = Math.max(0, Math.min(rawBatchIndex, 50));
  const batchSize = Number.isInteger(body?.batchSize) && body.batchSize > 0
    ? Math.min(body.batchSize, MAX_BATCH_SIZE)
    : null;
  const concerns = batchSize !== null
    ? allConcerns.slice(batchIndex * batchSize, (batchIndex + 1) * batchSize)
    : allConcerns;

  const { user, error: authError, admin } = await verifyUser(req);
  if (!user) return res.status(401).json({ error: authError });
  const isPremium = isPremiumUser(user);
  if (hasLegacyClientPremiumFlag(user)) {
    console.warn(`[llm-recs] user ${user.id} has the legacy client-writable is_premium flag; migrate it to app_metadata`);
  }

  // ── Ecosystem quota ───────────────────────────────────────────────────────
  // Claimed per BUILD, not per request. A build spans several batch requests,
  // so the old `batchIndex === 0` gate both (a) let any client skip the quota by
  // sending batchIndex >= 1 and (b) charged before any work succeeded, which
  // permanently burned the user's single lifetime build on a timeout. The claim
  // is idempotent for a given buildId and is released below if nothing usable
  // came back, so a failed build is retryable.
  const buildId = String(body?.buildId || '').trim().slice(0, 200);
  let claimed = false;
  if (!isPremium) {
    if (!buildId) return res.status(400).json({ error: 'missing_build_id' });
    const { allowed, used, limit } = await claimEcosystemBuild(admin, user.id, buildId);
    if (!allowed) {
      return res.status(429).json({ error: 'ecosystem_limit_reached', used, limit, action: 'ecosystem' });
    }
    claimed = true;
  }

  if (!concerns.length) {
    return res.status(200).json({ recommendations: [], concernsTotal: allConcerns.length, providerUsed: null, generatedAt: new Date().toISOString() });
  }

  const [searchResults, groundingCatalog] = await Promise.all([
    searchProductsForConcerns(concerns, intake),
    loadGroundingCatalog(),
  ]);
  const catalogIndex = buildCatalogIndex(groundingCatalog);
  const order = parseProviderOrder('AI_RECOMMENDATIONS_PROVIDER_ORDER', 'anthropic,openai,gemini');

  // Stop starting new concerns once the function budget is nearly spent, so we
  // return the concerns we DID complete instead of being killed mid-flight and
  // losing all of them.
  const startedAt = Date.now();
  const deadline = AbortSignal.timeout(FUNCTION_BUDGET_MS);
  const budgetExhausted = () => Date.now() - startedAt > FUNCTION_BUDGET_MS - 6000;

  const perConcernResults = await mapConcurrent(
    concerns,
    async (concern, idx) => {
      if (budgetExhausted()) {
        console.warn(`[llm-recs] skipping concern ${idx + 1}/${concerns.length} — function budget exhausted`);
        return { failed: true, concern, reason: 'function_budget_exhausted' };
      }
      const searchHits = searchResults?.[concern] || null;
      const catalogCandidates = catalogCandidatesForConcern(groundingCatalog, concern);
      const prompt = buildPromptForOneConcern(concern, intake, feedback, searchHits, catalogCandidates);
      try {
        const out = await callWithFallback(order, {
          system: 'Return a single valid JSON object only. No markdown code fences.',
          prompt,
          // The OpenAI fallback must keep response_format: json_object — it is
          // what forces parseable output from that provider.
          jsonMode: true,
          // 3-5 primary tracks plus at most 1 brief alternative each fit
          // within this budget while reducing truncation risk.
          maxTokens: 8000,
          timeoutMs: 28_000,
          signal: deadline,
        });
        if (out.truncated) {
          console.warn(`[llm-recs] concern ${idx + 1} hit max_tokens — output truncated`);
        }
        const parsed = tryParseJsonCandidate(out.text);
        console.log(`[llm-recs] concern ${idx + 1}/${concerns.length} | provider: ${out.provider} | bytes: ${out.text.length} | parsed: ${!!parsed}`);
        if (parsed) return { parsed, provider: out.provider, concern };
        return { failed: true, concern, reason: 'unparseable_response' };
      } catch (e) {
        // Carry the actual reason back to the client instead of just the
        // concern's name — a live incident (2026-08-22: "Hormone balance" and
        // "Gut and vaginal health" failed after ~20s) turned out to be
        // undiagnosable after the fact because nothing but this server
        // console.error captured *why*, and Vercel's CLI log retention didn't
        // have it by the time anyone went looking. Now the reason travels
        // with the response so it shows up in the browser console too.
        console.error(`[llm-recs] concern ${idx + 1}/${concerns.length} failed:`, e?.provider || '', e?.status || '', e?.message);
        return { failed: true, concern, reason: e?.status ? `${e.provider || 'llm'}_${e.status}` : (e?.message || 'unknown_error') };
      }
    },
    // Each of the client's NUM_BATCHES=4 invocations (src/components/MyEcosystem.jsx)
    // fires as a SEPARATE, genuinely-parallel HTTP request — Vercel doesn't
    // serialize them, and they share one Anthropic account's rate limit.
    // A prior comment here sized this concurrency (3) against ONE invocation's
    // own token usage (~33K TPM) and called that "comfortably under" a ~50K TPM
    // ceiling — true in isolation, but wrong for the actual traffic pattern:
    // all 4 invocations can fire their first calls within the same second, so
    // real peak load is up to 4x that estimate (~132K TPM), not ~33K. That
    // mismatch is the most likely cause of the "some concerns failed" partial-
    // failure pattern users hit around the ~20s mark (a burst of concurrent
    // 429s that retry+backoff can absorb SOME but not all of within the 28s
    // per-call timeout). Lowered to 2: peak combined load drops to ~4x22K =
    // ~88K TPM — still not a hard guarantee (there's no cross-invocation
    // coordination without a real distributed limiter, which is a bigger
    // change), but a meaningfully smaller blast radius for the same reason a
    // single invocation's own concurrency was capped in the first place.
    // Separately — and this matters more than the exact number here — the
    // OpenAI fallback this code path assumes exists is NOT actually
    // configured (OPENAI_API_KEY is unset in this project's Vercel env as of
    // 2026-08-22), so Anthropic is a single point of failure regardless of
    // this concurrency setting; see AI_RECOMMENDATIONS_PROVIDER_ORDER.
    Math.max(1, Math.min(parseInt(process.env.LLM_CONCERN_CONCURRENCY || '2', 10) || 2, 6))
  );

  const providerUsed = perConcernResults.find((r) => r?.provider)?.provider || '';
  // Every concern now returns a truthy object (success OR failure — see above,
  // failures carry a reason instead of being null) so `.filter(Boolean)` alone
  // would wrongly count failures as successes. Discriminate on the shape.
  const succeeded = perConcernResults.filter((r) => r && !r.failed);
  const failed = perConcernResults.filter((r) => r?.failed);
  const failedConcerns = failed.map((r) => r.concern);
  // Reason travels to the client so a future incident is diagnosable from the
  // browser console / API response alone, without needing server log access.
  const failedConcernReasons = failed.map((r) => ({ concern: r.concern, reason: r.reason }));

  // Enrich PER CONCERN so each entry is stamped with the concern it was actually
  // requested for. Previously flatMap discarded that mapping and the code trusted
  // whatever label the model echoed back — a shortened label broke the client's
  // exact-match sort and mis-bucketed the section.
  const recs = succeeded.flatMap((r) => {
    const entries = Array.isArray(r.parsed?.recommendations) ? r.parsed.recommendations : [];
    // Keep only the first entry per concern; a model returning two produced
    // duplicate sections.
    return enrichRecommendations(entries.slice(0, 1), r.concern, catalogIndex);
  });

  if (!recs.length) {
    // Nothing usable — hand the build back so the user can retry. Without this
    // a failed generation permanently consumed their one lifetime build.
    if (claimed) await releaseEcosystemBuild(admin, user.id, buildId);
    return res.status(502).json({
      recommendations: [],
      providerUsed: providerUsed || null,
      generatedAt: new Date().toISOString(),
      error: 'generation_failed',
      warning: 'parse_error_fallback',
      requested: concerns.length,
      delivered: 0,
      failedConcerns,
      failedConcernReasons,
      message: 'No recommendations could be generated. Please try again.',
    });
  }

  // DSLD verification is applied to the TIER products, which is what the UI
  // actually renders. It previously only rewrote `entry.topProduct` — a separate
  // object reference that MyEcosystem never reads (it renders `tier.product`) —
  // so every NIH round trip was pure latency and the verified brand, label URL
  // and ingredient list were all discarded.
  const applyDsld = (product, dsld) => ({
    ...product,
    brand: dsld.brand || product.brand,
    image: dsld.imageUrl || product.image || '',
    url: dsld.labelUrl || product.url,
    dsldVerified: true,
    dsldId: dsld.dsldId,
    summary:
      dsld.ingredients.length > 0
        ? `${product.summary} Key ingredients: ${dsld.ingredients.slice(0, 4).join(', ')}.`
        : product.summary,
    safety: {
      ...product.safety,
      materials: dsld.ingredients.slice(0, 5).join(', ') || product.safety?.materials || '',
      // NOT a recall clearance — DSLD is a label database. /api/fda-recall is
      // the only thing allowed to make a recall statement.
      recalls: '',
    },
  });

  const isSupplement = (p) =>
    p && p.type !== 'digital' && /(supplement|vitamin|mineral|probiotic)/i.test(p.category || '');

  const verifiedRecs = await Promise.all(
    recs.map(async (entry) => {
      // Verify every supplement tier, not just the first.
      const tiers = Array.isArray(entry.tiers) ? entry.tiers : [];
      const newTiers = await Promise.all(
        tiers.map(async (tier) => {
          // Catalog products already carry reviewed facts; DSLD must never
          // overwrite their brand/url/image/summary.
          if (tier?.product?.catalogVerified || !isSupplement(tier?.product)) return tier;
          const dsld = await lookupDsldProduct(tier.product.name);
          if (!dsld) return tier;
          return { ...tier, product: applyDsld(tier.product, dsld) };
        })
      );
      const next = { ...entry, tiers: newTiers };
      // Keep topProduct in sync with tier 0 for the legacy consumers.
      if (newTiers[0]?.product) next.topProduct = newTiers[0].product;
      return next;
    })
  );

  return res.status(200).json({
    recommendations: verifiedRecs,
    concernsTotal: allConcerns.length,
    requested: concerns.length,
    delivered: recs.length,
    // Non-empty when some concerns failed. The client renders a partial-result
    // notice instead of silently showing fewer sections than were asked for.
    failedConcerns,
    // Same list, but with WHY each one failed (provider+status, or a reason
    // code like 'unparseable_response'/'function_budget_exhausted') — so a
    // future incident is diagnosable from this response / the browser
    // console alone, without needing server log access (which wasn't
    // available when this exact bug was first reported).
    failedConcernReasons,
    partial: failedConcerns.length > 0,
    providerUsed,
    generatedAt: new Date().toISOString(),
  });
}

