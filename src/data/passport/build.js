/**
 * Builds the initial passport for a catalog product, using ONLY data already
 * in the repo. Every fact is sourced "ayna catalog (unverified)" with
 * verified_at null, so every product starts as Not reviewed with an honest
 * completeness score. Nothing here looks anything up or guesses: a field we
 * cannot read from the catalog is `unknown`, never `false`.
 */
import {
  fact, unknownFact, notApplicable, isEmptyValue, CATALOG_SOURCE, PASSPORT_SECTIONS, QA_STATUS, getPath, EVIDENCE_TYPES,
  REVIEW_INTERVAL_DAYS, reviewFamilyFor, addDays, daysBetween, parseDay, labelForPath,
} from './schema.js';
import { parseIngredients, listedIngredientIds, classesForIds } from './ingredients.js';
import { lintProductCopy } from './wording.js';
import { PASSPORT_REVIEWS } from './reviews.js';
import { LINK_STATUS, linkRecord } from './linkStatus.js';
import { getVerificationLinks, hostLabel } from '../../utils/verificationLinks.js';
import { getCatalogPurchaseUrl as getBuyUrl } from '../../mobile/data/buyUrl.js';
import { brandOf } from '../../mobile/data/brandFallback.js';
import { isPlaceholderProductImage } from '../../utils/resolveProductImage.js';
import { getPricePerUnitLabel } from '../../utils/pricePerUnit.js';

const str = (v) => (typeof v === 'string' ? v.trim() : '');
const meaningful = (v) => (isEmptyValue(v) ? '' : str(v));

/** Sentences in `text` that match `re`. */
function sentencesMatching(text, re) {
  return String(text || '')
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s && re.test(s));
}

function hostOf(url) {
  try { return new URL(url).hostname.replace(/^www\./, '').toLowerCase(); } catch { return ''; }
}

// ---------------------------------------------------------------------------
// What kind of product is this? Drives which fields apply and how much
// scrutiny it needs (spec 31-32).
// ---------------------------------------------------------------------------
const INGESTIBLE_RE = /\b(capsules?|softgels?|tablets?|gummies|gummy|powder|drink mix|tea|chewables?|supplement|vitamins?|prenatal)\b/i;
const INSERT_RE = /\b(suppositor(?:y|ies)|vaginal insert|ovules?|melts?)\b/i;
const TOPICAL_RE = /\b(wash|cleanser|lube|lubricant|moisturi[sz]er|gel|balm|oil|lotion|cream|serum|wipes?|spray|mist|patch(?:es)?|roll-on)\b/i;

export function classifyRoute(product) {
  if (product?.type === 'digital') return 'none';
  const cat = String(product?.category || '');
  const text = `${product?.name || ''} ${product?.summary || ''} ${product?.ingredients || ''}`;
  if (INSERT_RE.test(text) || /boric acid/i.test(product?.ingredients || '')) return 'vaginal_insert';
  if (['supplement', 'sleep'].includes(cat)) return 'ingestible';
  if (['tampon', 'cup', 'disc'].includes(cat)) return 'internal_device';
  if (['pad', 'period-underwear', 'incontinence', 'cup-steamer'].includes(cat)) return 'external_device';
  if (INGESTIBLE_RE.test(`${product?.name || ''} ${product?.ingredients || ''}`) && !TOPICAL_RE.test(product?.name || '')) return 'ingestible';
  if (TOPICAL_RE.test(product?.name || '') || cat === 'intimate-care') return 'topical';
  return 'external_device';
}

/** Clinician-review flags (spec 31). Each flag has a reason a reviewer can check. */
export function clinicianReviewFlags(product, { route, ingredients, wording }) {
  const flags = [];
  const add = (id, reason) => { if (!flags.some((f) => f.id === id)) flags.push({ id, reason }); };
  const text = [product?.name, product?.summary, product?.ingredients, product?.safety?.sideEffects, ...(product?.warnings || [])].join(' ').toLowerCase();
  const fns = product?.healthFunctions || [];
  const tags = product?.tags || [];
  if (route === 'ingestible') add('ingestible', 'Taken by mouth (supplement or ingestible).');
  if (route === 'vaginal_insert') add('vaginal-insert', 'Vaginal suppository or insert with an active ingredient.');
  if (ingredients.some((i) => i.classes.includes('hormone') || i.classes.includes('hormone-active') || i.classes.includes('phytoestrogen')) || tags.includes('hormonal') || /\b(progesterone|estrogen|estradiol|hormonal)\b/.test(text)) add('hormonal', 'Contains or acts on hormones.');
  if (ingredients.some((i) => i.classes.includes('drug-active') || i.classes.includes('nsaid'))) add('drug-active', 'Contains an over-the-counter drug ingredient.');
  if (/\b(interact|blood thinner|anticoagulant|warfarin|ssri|medication)\b/.test(text)) add('medication-interaction', 'Catalog text mentions medicines or interactions.');
  if (['pregnancy', 'postpartum'].includes(product?.category) || /\b(prenatal|pregnan|breastfeed|nursing|lactation)\b/.test(String(product?.name || '').toLowerCase())) add('pregnancy', 'Made for pregnancy, postpartum or breastfeeding.');
  if (fns.includes('fertility') || tags.includes('fertility') || tags.includes('ttc')) add('fertility', 'Fertility or trying-to-conceive product.');
  if (wording.some((w) => w.severity === 'high')) add('treatment-claim', 'Copy makes a treatment, cure, prevention or safety claim.');
  return flags;
}

// ---------------------------------------------------------------------------
// Evidence typing (spec 26). Heuristic from the source's host and title; the
// label says what KIND of source it is, never how strong it is.
// ---------------------------------------------------------------------------
const GUIDELINE_HOSTS = ['acog.org', 'who.int', 'nice.org.uk', 'menopause.org', 'aafp.org', 'auanet.org', 'endocrine.org', 'idsociety.org', 'rcog.org.uk', 'asrm.org', 'uspreventiveservicestaskforce.org'];
const REGULATORY_HOSTS = ['fda.gov', 'accessdata.fda.gov', 'recalls.gov', 'cpsc.gov', 'ftc.gov'];
const EXPERT_HOSTS = ['mayoclinic.org', 'clevelandclinic.org', 'my.clevelandclinic.org', 'hopkinsmedicine.org', 'nhs.uk', 'medlineplus.gov', 'cdc.gov', 'womenshealth.gov', 'health.harvard.edu', 'uptodate.com', 'webmd.com', 'healthline.com', 'verywellhealth.com'];
const RESEARCH_HOSTS = ['pubmed.ncbi.nlm.nih.gov', 'ncbi.nlm.nih.gov', 'pmc.ncbi.nlm.nih.gov', 'ods.od.nih.gov', 'nccih.nih.gov', 'nih.gov', 'doi.org', 'jamanetwork.com', 'thelancet.com', 'nejm.org', 'bmj.com', 'sciencedirect.com', 'springer.com', 'wiley.com', 'nature.com', 'mdpi.com', 'frontiersin.org', 'cochranelibrary.com', 'academic.oup.com', 'journals.lww.com', 'tandfonline.com'];
const COMMUNITY_HOSTS = ['reddit.com', 'tiktok.com', 'youtube.com', 'instagram.com', 'facebook.com', 'amazon.com', 'twitter.com', 'x.com'];
const hostIn = (host, list) => list.some((h) => host === h || host.endsWith(`.${h}`));

export function evidenceTypeFor(source, product) {
  const host = hostOf(source.url);
  const brandHosts = new Set([product?.url, product?.productUrl, product?.faqUrl, product?.affiliateUrl].map(hostOf).filter(Boolean));
  const brandSlug = String(brandOf(product) || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (source.kind === 'community' || hostIn(host, COMMUNITY_HOSTS)) return 'community';
  if (brandHosts.has(host) || (brandSlug.length >= 3 && host.replace(/[^a-z0-9]/g, '').includes(brandSlug))) return 'manufacturer';
  if (hostIn(host, REGULATORY_HOSTS)) return 'regulatory';
  if (hostIn(host, GUIDELINE_HOSTS)) return 'clinical_guideline';
  if (hostIn(host, EXPERT_HOSTS)) return 'expert_guidance';
  if (hostIn(host, RESEARCH_HOSTS)) {
    // Product-specific only when the title names this product or brand.
    const title = String(source.title || '').toLowerCase();
    const name = String(product?.name || '').toLowerCase();
    const brand = String(brandOf(product) || '').toLowerCase();
    if ((brand.length >= 3 && title.includes(brand)) || (name.length >= 6 && title.includes(name))) return 'product_study';
    return 'ingredient_research';
  }
  return 'expert_guidance';
}

/** Every source the catalog cites for this product, typed and deduped by URL. */
export function collectSources(product) {
  const seen = new Set();
  const out = [];
  const add = (url, { title, summary, kind, year }) => {
    if (!url || seen.has(url) || !/^https?:\/\//i.test(url)) return;
    const publisher = hostLabel(url);
    if (!publisher) return;
    seen.add(url);
    const src = { url, title: str(title) || publisher, publisher, summary: str(summary) || null, year: year || null, kind };
    src.evidence_type = evidenceTypeFor(src, product);
    src.evidence_label = EVIDENCE_TYPES[src.evidence_type];
    out.push(src);
  };
  for (const key of ['doctor', 'scientific']) {
    for (const l of getVerificationLinks(product, key)) add(l?.url || l?.href, { title: l.text, summary: l.summary, kind: key, year: l.year });
  }
  for (const c of product?.scientificCitations || []) add(c.url, { title: c.text, summary: c.summary, kind: 'scientific', year: c.year });
  for (const c of product?.doctorOpinionCitations || []) add(c.url, { title: c.label, kind: 'doctor', year: c.year });
  for (const item of product?.ingredientScience || []) {
    for (const c of item.citations || []) add(c.url, { title: c.label || `${item.name} fact sheet`, kind: 'ingredient', year: c.year });
  }
  if (product?.howToUse?.sourceUrl) add(product.howToUse.sourceUrl, { title: product.howToUse.sourceLabel || 'How to use', kind: 'how-to' });
  if (product?.faqUrl) add(product.faqUrl, { title: 'Brand FAQ', kind: 'brand' });
  if (product?.communityReviewSourceUrl) add(product.communityReviewSourceUrl, { title: product.communityReviewSourceLabel, kind: 'community' });
  for (const l of getVerificationLinks(product, 'community')) add(l?.url || l?.href, { title: l.text, summary: l.summary, kind: 'community' });
  return out;
}

// ---------------------------------------------------------------------------
// Field readers. Each returns a fact(); unknown when the catalog is silent.
// ---------------------------------------------------------------------------
function readSizeCount(product) {
  const p = str(product?.price);
  const m = p.match(/\bfor\s+(\d+)\b/i) || p.match(/\bpack of\s+(\d+)\b/i) || p.match(/\b(\d+)\s*(?:-|\s)?(?:count|ct|pack|pads?|tampons?|capsules|softgels|tablets|gummies|liners)\b/i);
  return m ? fact(`${m[1]}`, { note: 'parsed from the catalog price text' }) : unknownFact('size or count not on file');
}

function readFragrance(product, ingredients) {
  const text = [product?.safety?.allergens, product?.safety?.materials, product?.ingredients, product?.summary].join(' ').toLowerCase();
  if (/scented versions?|fragrance[- ]free (?:version|option)s? available|unscented (?:version|option)s? available/.test(text)) return fact('varies by variant', { note: 'catalog text says some versions are scented' });
  if (/fragrance[- ]free|unscented|no (?:added )?fragrance|without fragrance|free (?:from|of)[^.]{0,40}fragrance/.test(text)) return fact('fragrance-free', { note: 'catalog text says fragrance-free' });
  if (ingredients.some((i) => i.id === 'fragrance')) return fact('contains fragrance', { note: 'fragrance or essential oils in the ingredient list' });
  return unknownFact('fragrance status not on file');
}

function readLatex(product, ingredients) {
  const text = [product?.safety?.allergens, product?.safety?.materials, product?.ingredients, product?.summary].join(' ').toLowerCase();
  if (/latex[- ]free|no latex|free (?:from|of)[^.]{0,40}latex/.test(text)) return fact('latex-free');
  if (ingredients.some((i) => i.id === 'latex')) return fact('contains latex');
  return unknownFact('latex status not on file');
}

function safetyText(product) {
  const s = product?.safety || {};
  return [s.allergens, s.sideEffects, s.opinionAlerts, s.recalls, ...(product?.warnings || []), product?.doctorOpinion].filter(Boolean).join(' ');
}

function mentionFact(product, re, what) {
  const hits = sentencesMatching(safetyText(product), re);
  return hits.length
    ? fact(hits.slice(0, 2).join(' '), { note: `mention in catalog safety text, not a ${what} determination` })
    : unknownFact(`no product-specific ${what} information on file`);
}

// ---------------------------------------------------------------------------
// The passport
// ---------------------------------------------------------------------------
export function buildPassport(product, { now = Date.now(), reviews = PASSPORT_REVIEWS, links = LINK_STATUS } = {}) {
  if (!product) return null;
  const kind = product.type === 'digital' ? 'digital' : 'physical';
  const route = classifyRoute(product);
  const isPhysical = kind === 'physical';
  const ingText = meaningful(product.ingredients);
  const materials = meaningful(product?.safety?.materials);
  const ingredients = parseIngredients(ingText || materials);
  const wording = lintProductCopy(product);
  const brand = brandOf(product);
  const buyUrl = getBuyUrl(product);
  const image = str(product.image);
  const sources = collectSources(product);
  const evidenceSources = sources.filter((s) => s.evidence_type !== 'community');
  const communitySources = sources.filter((s) => s.evidence_type === 'community');
  const recallsText = meaningful(product?.safety?.recalls);
  // A "⚠" catalog note mixes lawsuits, historical recalls and labeling
  // concerns. It is a concern to review, never an active recall by itself.
  const flagged = recallsText.includes('⚠');

  const ingestibleOrTopical = ['ingestible', 'topical', 'vaginal_insert'].includes(route);
  const nonExcipient = ingredients.filter((i) => i.id && !i.classes.some((c) => ['excipient', 'capsule'].includes(c)));
  const actives = (product.ingredientScience || []).map((i) => i.name).filter(Boolean);
  const dosage = ingredients.filter((i) => i.amount).map((i) => i.raw);

  const passport = {
    id: product.id,
    kind,
    risk: { route },
    identity: {
      name: fact(str(product.name)),
      brand: brand
        ? fact(brand, product.brand ? {} : { source: 'ayna brand lookup from the product name (unverified)' })
        : unknownFact('brand not on file'),
      variant: unknownFact('exact variant (size, absorbency, scent, formula) not recorded'),
      category: fact(str(product.category)),
      format: fact(kind === 'digital' ? 'digital service' : route.replace(/_/g, ' ')),
      image: image && !isPlaceholderProductImage(image, kind === 'digital') ? fact(image) : unknownFact('no real product image on file'),
      purchase_url: buyUrl ? fact(buyUrl, { note: 'link format checked, not checked live' }) : unknownFact('no exact product link on file'),
    },
    pricing: {
      price: /\d|free|covered/i.test(str(product.price)) ? fact(str(product.price)) : unknownFact('no price on file'),
      size_count: isPhysical ? readSizeCount(product) : notApplicable('service'),
      price_per_unit: getPricePerUnitLabel(product) ? fact(getPricePerUnitLabel(product), { note: 'computed from price text' }) : unknownFact(),
      fsa_hsa: product.fsaHsaEligible === true ? fact('eligible') : product.fsaHsaEligible === false ? fact('not eligible') : unknownFact('FSA/HSA status not on file'),
      availability: Array.isArray(product.whereToBuy) && product.whereToBuy.length ? fact(product.whereToBuy) : unknownFact(),
    },
    composition: {
      ingredients: isPhysical ? (ingText || materials ? fact(ingText || materials) : unknownFact('ingredients or materials not on file')) : notApplicable('service'),
      structured: ingredients,
      active_ingredients: ingestibleOrTopical
        ? (actives.length ? fact(actives, { note: 'from ingredient science notes' }) : route === 'ingestible' && nonExcipient.length ? fact(nonExcipient.map((i) => i.name), { note: 'ingredient list minus capsule and excipients' }) : unknownFact('active ingredients not separated'))
        : notApplicable(),
      inactive_ingredients: ingredients.filter((i) => i.classes.some((c) => ['excipient', 'capsule'].includes(c))).map((i) => i.raw),
      dosage: route === 'ingestible' ? (dosage.length ? fact(dosage) : unknownFact('amount per serving not on file')) : notApplicable(),
      allergens: isPhysical ? (meaningful(product?.safety?.allergens) ? fact(meaningful(product.safety.allergens)) : unknownFact('allergens not on file')) : notApplicable('service'),
      fragrance: isPhysical && route !== 'ingestible' ? readFragrance(product, ingredients) : notApplicable(),
      latex: isPhysical ? readLatex(product, ingredients) : notApplicable(),
      botanicals: ingredients.filter((i) => i.classes.includes('botanical')).map((i) => i.name),
      preservatives: ingredients.filter((i) => i.classes.includes('preservative')).map((i) => i.name),
      materials: materials ? fact(materials) : unknownFact(),
    },
    safety: {
      warnings: Array.isArray(product.warnings) && product.warnings.length ? fact(product.warnings) : unknownFact('no warnings list on file'),
      side_effects: isPhysical ? (meaningful(product?.safety?.sideEffects) ? fact(meaningful(product.safety.sideEffects)) : unknownFact()) : notApplicable('service'),
      regulatory_status: isPhysical ? (meaningful(product?.safety?.fdaStatus) ? fact(meaningful(product.safety.fdaStatus)) : unknownFact()) : notApplicable('service'),
      recalls: recallsText ? fact({ text: recallsText, flagged }, { note: flagged ? 'flagged concern on file' : 'catalog recall note, not a live recall check' }) : unknownFact('no recall check on file'),
      concern: flagged ? fact(meaningful(product?.safety?.opinionAlerts) || recallsText) : unknownFact(),
      pregnancy: ingestibleOrTopical ? mentionFact(product, /pregnan|prenatal/i, 'pregnancy safety') : notApplicable(),
      breastfeeding: ingestibleOrTopical ? mentionFact(product, /breastfe|nursing|lactat/i, 'breastfeeding safety') : notApplicable(),
      medication_interactions: route === 'ingestible' ? mentionFact(product, /interact|blood thinner|anticoagul|medication|medicine/i, 'medication interaction') : notApplicable(),
      age_restriction: route === 'ingestible' ? mentionFact(product, /\b(?:1[2-8]\+|under 1[2-8]|adults? only|children)\b/i, 'age restriction') : notApplicable(),
      privacy: kind === 'digital' ? (product.privacy ? fact(product.privacy) : unknownFact('privacy practices not on file')) : notApplicable(),
      avoid_if: Array.isArray(product.avoidIfSensitivity) && product.avoidIfSensitivity.length ? fact(product.avoidIfSensitivity) : unknownFact(),
    },
    health: {
      // Catalog tags, not yet ranked direct / strong / secondary / adjacent (spec 8).
      uses: (product.healthFunctions || []).length
        ? fact((product.healthFunctions || []).map((id) => ({ id, relevance: 'unranked', reason: 'catalog healthFunctions tag' })))
        : unknownFact(),
      tags: product.tags || [],
      ranked_uses: unknownFact('health uses not yet ranked with reasons'),
      intended_use: unknownFact('intended use not separately recorded'),
      why_included: meaningful(product.recommendationWhyDetail) ? fact(meaningful(product.recommendationWhyDetail)) : unknownFact('why ayna includes it not written yet'),
    },
    evidence: {
      sources: evidenceSources.length ? fact(evidenceSources) : unknownFact('no evidence sources linked'),
      product_specific: evidenceSources.some((s) => s.evidence_type === 'product_study'),
      claims: unknownFact('claim-level evidence not recorded yet'),
      strength: meaningful(product.evidenceStrength) ? fact(meaningful(product.evidenceStrength)) : unknownFact(),
    },
    community: {
      summary: meaningful(product.communityReview) ? fact(meaningful(product.communityReview), { source_type: 'community', note: 'summary of public posts, not verified' }) : unknownFact(),
      sources: communitySources.length ? fact(communitySources, { source_type: 'community' }) : unknownFact(),
      rating_note: meaningful(product.ratingNote) ? fact(meaningful(product.ratingNote)) : unknownFact(),
    },
    // ayna-written explanation layer, kept apart from facts (spec 1).
    explanation: {
      summary: meaningful(product.summary) ? fact(meaningful(product.summary), { source_type: 'ayna_catalog', note: 'ayna-written' }) : unknownFact(),
      effectiveness: meaningful(product.effectiveness) || null,
      clinician: meaningful(product.doctorOpinion) ? { text: meaningful(product.doctorOpinion), source: product.clinicianOpinionSource || null, attribution: meaningful(product.clinicianAttribution) || null } : null,
    },
    sources: { all: sources.length ? fact(sources) : unknownFact() },
    dates: { first_verified: null, last_verified: null, next_review_due: null },
    wording,
  };

  passport.flags = { clinician_review: clinicianReviewFlags(product, { route, ingredients, wording }) };
  const review = (reviews && reviews[product.id]) || null;
  passport.qa = {
    status: review?.qa_status || 'not_reviewed',
    label: QA_STATUS[review?.qa_status || 'not_reviewed'] || QA_STATUS.not_reviewed,
    reviewed_by: review?.reviewed_by || null,
    reviewed_at: review?.reviewed_at || null,
    notes: review?.notes || null,
  };
  applyReviewedFacts(passport, review, now);
  passport.corrections = normalizeCorrections(review?.corrections);
  passport.recall = recallFor(product, review);
  if (passport.recall.status !== 'unknown' && !passport.safety.recalls.reviewed) {
    passport.safety.recalls = fact({ text: passport.recall.status === 'recalled' ? 'Active recall found' : 'No recall found', flagged: passport.recall.status === 'recalled' }, {
      source: passport.recall.source, source_type: passport.recall.status === 'recalled' ? 'regulatory' : 'ayna_catalog', verified_at: passport.recall.checked_at, status: 'current',
    });
  }
  passport.dates = datesFor(passport, review);
  passport.freshness = freshnessOf(passport, now);
  passport.links = linksFor(passport, links);
  if (passport.links.purchase) {
    const l = passport.links.purchase;
    passport.pricing.link_check = fact({ state: l.state, http_status: l.status ?? null, final_url: l.final_url || null, checked_at: l.checked_at || null },
      { source: 'automated link check (scripts/passport/check-links.mjs)', source_type: 'retailer', verified_at: l.checked_at || null, status: l.state === 'unavailable' ? 'unavailable' : 'current' });
  }
  passport.ingredient_ids = ingredientIdsFor(passport);
  passport.ingredient_classes = classesForIds(passport.ingredient_ids);
  passport.status = statusFor(product, passport, review);
  passport.completeness = computeCompleteness(passport);
  passport.confidence = computeConfidence(passport);
  return passport;
}

/**
 * Reviewed facts from reviews.js replace the catalog-derived ones. Each keeps
 * its source and source_url; a fact past its refresh schedule is 'stale'.
 */
function applyReviewedFacts(passport, review, now) {
  for (const [path, f] of Object.entries(review?.facts || {})) {
    if (!f || typeof f !== 'object') continue;
    const keys = path.split('.');
    const parent = getPath(passport, keys.slice(0, -1).join('.'));
    if (!parent || typeof parent !== 'object') continue;
    const verified = f.verified_at || review.last_checked || review.reviewed_at || null;
    const due = verified ? addDays(verified, REVIEW_INTERVAL_DAYS[reviewFamilyFor(path)] ?? 180) : null;
    const overdue = due ? daysBetween(due, now) > 0 : false;
    parent[keys[keys.length - 1]] = {
      known: !isEmptyValue(f.value),
      ...f,
      source_url: f.source_url || null,
      verified_at: verified,
      review_due: due,
      status: f.status || (overdue ? 'stale' : 'current'),
      reviewed: true,
    };
  }
}

function normalizeCorrections(list) {
  return (Array.isArray(list) ? list : []).filter((c) => c && typeof c === 'object').map((c) => ({
    field: c.field || null,
    catalog: c.catalog ?? null,
    source_says: c.source_says ?? null,
    source_url: c.source_url || null,
    note: c.note || null,
  }));
}

const RECALL_FIELDS = (product) => product?.recall?.active === true || product?.activeRecall === true || product?.isRecalled === true
  || /recall/i.test(String(product?.status || product?.listingStatus || product?.availabilityStatus || ''));

/** Recall state: only a reviewer's recall check or a structured catalog field, never free text. */
function recallFor(product, review) {
  if (RECALL_FIELDS(product)) return { status: 'recalled', source: 'catalog status field', checked_at: null };
  const rs = review?.recall_status;
  if (rs === 'recalled' || rs === 'none_found') {
    return { status: rs, source: 'ayna review recall check (see notes)', checked_at: review.last_checked || review.reviewed_at || null };
  }
  return { status: 'unknown', source: null, checked_at: null };
}

/** first_verified / last_verified / next_review_due (spec 12). */
function datesFor(passport, review) {
  const verified = [];
  const walk = (o) => {
    if (!o || typeof o !== 'object') return;
    if ('known' in o && 'source' in o) { if (o.reviewed && o.verified_at) verified.push(o.verified_at); return; }
    Object.values(o).forEach(walk);
  };
  ['identity', 'pricing', 'composition', 'safety', 'health', 'evidence', 'community'].forEach((k) => walk(passport[k]));
  if (review?.last_checked) verified.push(review.last_checked);
  if (review?.reviewed_at) verified.push(review.reviewed_at);
  const sorted = verified.filter((d) => Number.isFinite(parseDay(d))).sort();
  const first = review?.first_verified || sorted[0] || null;
  const last = review?.last_checked || sorted[sorted.length - 1] || null;
  let next = review?.next_review_due || null;
  if (!next && last) {
    // Earliest refresh among the fact families this review covers.
    const families = new Set(Object.keys(review?.facts || {}).map(reviewFamilyFor));
    const days = families.size ? Math.min(...[...families].map((f) => REVIEW_INTERVAL_DAYS[f] ?? 180)) : REVIEW_INTERVAL_DAYS.pricing;
    next = addDays(last, days);
  }
  return { first_verified: first, last_verified: last, next_review_due: next };
}

/**
 * Data freshness (spec 14): 'unverified' (never checked), 'current',
 * 'stale' (past next_review_due). Stale lowers confidence, never the match.
 */
export function freshnessOf(passport, now = Date.now()) {
  const { last_verified: last, next_review_due: due } = passport.dates || {};
  if (!last) return { state: 'unverified', last_verified: null, next_review_due: null, days_overdue: null, age_days: null };
  const overdue = due ? daysBetween(due, now) : null;
  return {
    state: overdue != null && overdue > 0 ? 'stale' : 'current',
    last_verified: last,
    next_review_due: due,
    days_overdue: overdue != null && overdue > 0 ? overdue : 0,
    age_days: daysBetween(last, now),
  };
}

/** Link check results for this product's purchase and source URLs (scripts/passport/check-links.mjs). */
function linksFor(passport, links) {
  const purchaseUrl = passport.identity.purchase_url?.known ? String(passport.identity.purchase_url.value) : null;
  const purchase = purchaseUrl ? linkRecord(links, purchaseUrl) : null;
  const sourceUrls = new Set();
  (passport.sources.all.known ? passport.sources.all.value : []).forEach((s) => s.url && sourceUrls.add(s.url));
  const walk = (o) => {
    if (!o || typeof o !== 'object') return;
    if (Array.isArray(o)) { o.forEach(walk); return; }
    if (o.source_url) sourceUrls.add(o.source_url);
    if (o.url && /^https?:/.test(o.url)) sourceUrls.add(o.url);
    Object.values(o).forEach((v) => { if (v && typeof v === 'object') walk(v); });
  };
  ['identity', 'pricing', 'composition', 'safety', 'health', 'evidence'].forEach((k) => walk(passport[k]));
  if (purchaseUrl) sourceUrls.delete(purchaseUrl);
  const sources = [...sourceUrls].map((url) => linkRecord(links, url)).filter(Boolean);
  return {
    checked_at: links?.generated_at || null,
    purchase,
    sources,
    broken: [purchase, ...sources].filter((l) => l && l.state === 'unavailable'),
    changed: [purchase, ...sources].filter((l) => l && l.changed),
  };
}

/** Canonical ingredient ids from the reviewed (or catalog) ingredient and materials lists. */
function flattenText(v) {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  if (Array.isArray(v)) return v.map(flattenText).join(', ');
  if (typeof v === 'object') return Object.values(v).map(flattenText).join(', ');
  return String(v);
}
function ingredientIdsFor(passport) {
  const c = passport.composition;
  const ids = new Set();
  [c.ingredients, c.active_ingredients, c.materials].filter((f) => f?.known)
    .forEach((f) => listedIngredientIds(flattenText(f.value)).forEach((id) => ids.add(id)));
  return [...ids].sort();
}

/**
 * Passport status (spec 14), most serious first:
 * recalled > discontinued > unavailable (purchase link 404/410) > stale >
 * needs_review (never checked, or a source page changed) > current.
 */
function statusFor(product, passport, review) {
  if (passport.recall.status === 'recalled') return 'recalled';
  const raw = String(product?.status || product?.listingStatus || product?.availabilityStatus || '').toLowerCase();
  if (review?.status === 'discontinued' || product?.discontinued === true || product?.isDiscontinued === true || /discontinued/.test(raw)) return 'discontinued';
  if (review?.status === 'unavailable' || product?.removed === true || product?.isRemoved === true || /removed|delisted/.test(raw)) return 'unavailable';
  if (passport.links.purchase?.state === 'unavailable') return 'unavailable';
  if (passport.freshness.state === 'stale') return 'stale';
  if (passport.freshness.state === 'unverified' || passport.links.changed.length) return 'needs_review';
  return review?.status && ['current', 'needs_review', 'stale'].includes(review.status) ? review.status : 'current';
}

/** Flat list of every fact on a passport, with its source (for the PDP and the audit page). */
export function passportFacts(passport) {
  if (!passport) return [];
  const out = [];
  const walk = (o, path) => {
    if (!o || typeof o !== 'object' || Array.isArray(o)) return;
    if ('known' in o && 'source' in o) {
      if (o.notApplicable) return;
      out.push({
        path,
        section: path.split('.')[0],
        label: labelForPath(path),
        value: o.value,
        known: Boolean(o.known),
        source: o.source || null,
        source_url: o.source_url || null,
        source_type: o.source_type || null,
        verified_at: o.verified_at || null,
        status: o.status || null,
        reviewed: Boolean(o.reviewed),
        note: o.note || null,
      });
      return;
    }
    for (const [k, v] of Object.entries(o)) walk(v, path ? `${path}.${k}` : k);
  };
  for (const k of ['identity', 'pricing', 'composition', 'safety', 'health', 'evidence', 'community', 'explanation']) walk(passport[k], k);
  return out;
}

// ---------------------------------------------------------------------------
// Completeness (spec 33). Separate from quality (spec 34): a complete
// passport can still describe a product with weak evidence.
// ---------------------------------------------------------------------------
export function computeCompleteness(passport) {
  const sections = [];
  const missing = [];
  const missingCritical = [];
  let got = 0;
  let total = 0;
  for (const section of PASSPORT_SECTIONS) {
    let sGot = 0;
    let sTotal = 0;
    for (const field of section.fields) {
      if (field.appliesTo && !field.appliesTo(passport)) continue;
      const f = getPath(passport, field.path);
      if (f?.notApplicable) continue;
      const w = field.critical ? 2 : 1;
      sTotal += w;
      if (f?.known) sGot += w;
      else {
        missing.push({ section: section.label, field: field.label, path: field.path, critical: Boolean(field.critical) });
        if (field.critical) missingCritical.push(field.label);
      }
    }
    if (sTotal === 0) continue;
    got += sGot;
    total += sTotal;
    sections.push({ id: section.id, label: section.label, percent: Math.round((sGot / sTotal) * 100) });
  }
  return { overall: total ? Math.round((got / total) * 100) : 0, sections, missing, missingCritical };
}

function level(pct, verified) {
  if (!verified) return 'Unverified';
  return pct >= 85 ? 'High' : pct >= 60 ? 'Moderate' : 'Low';
}

/** ayna's confidence in the product data (spec 11). Mostly internal. */
export function computeConfidence(passport) {
  const sec = (id) => passport.completeness.sections.find((s) => s.id === id)?.percent ?? 0;
  const verified = passport.qa.status === 'verified';
  return {
    metadata_completeness: passport.completeness.overall,
    safety_data: level(sec('safety'), verified),
    evidence: level(sec('evidence'), verified),
    price_freshness: passport.pricing.price.verified_at ? `Verified ${passport.pricing.price.verified_at}` : 'Not verified',
    data_freshness: passport.freshness?.state || 'unverified',
    source: passport.qa.status === 'not_reviewed' ? CATALOG_SOURCE : 'ayna review (see sources per fact)',
  };
}
