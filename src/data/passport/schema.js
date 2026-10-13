/**
 * Product passport schema (founder spec, points 1-16, 33-34).
 *
 * A passport is the FACT layer for one product. ayna-written explanations
 * (summary, clinician synthesis, who it's for) stay in the catalog and are
 * kept apart from facts. Every fact carries where it came from and when it
 * was last checked, so "current" can be told apart from "guessed".
 *
 * Rules this file encodes:
 * - Every field has a source.            (spec 2)
 * - Unknown is a real state.             (spec 4) Not found never becomes false.
 * - Freshness states.                    (spec 14)
 * - QA status per product.               (spec 16)
 * - Completeness is separate from quality (spec 33-34).
 */

/** Source used for every fact derived from the existing in-repo catalog. */
export const CATALOG_SOURCE = 'ayna catalog (unverified)';

/** Where a fact came from (spec 3, source hierarchy, best first). */
export const SOURCE_TYPES = {
  official_label: 'Official label or packaging',
  brand: 'Official brand or product page',
  regulatory: 'Regulatory (FDA, recalls)',
  clinical_guidance: 'Clinical guidance',
  research: 'Published research',
  retailer: 'Retailer listing',
  community: 'Community posts (experience only, never safety)',
  ayna_catalog: 'ayna catalog entry, not yet verified',
  none: 'No reliable source found',
};

/** Freshness of a single fact or a whole passport (spec 14). */
export const FACT_STATUS = ['current', 'needs_review', 'stale', 'unavailable', 'discontinued', 'recalled'];

/** QA status per product (spec 16). */
export const QA_STATUS = {
  not_reviewed: 'Not reviewed',
  in_review: 'In review',
  needs_correction: 'Needs correction',
  verified: 'Verified',
  needs_clinician_review: 'Needs clinician review',
};

/** Evidence labels shown to people (spec 26). */
export const EVIDENCE_TYPES = {
  product_study: 'Product-specific study',
  ingredient_research: 'Ingredient research',
  clinical_guideline: 'Clinical guideline',
  regulatory: 'Regulatory information',
  expert_guidance: 'Expert guidance',
  community: 'Community experience',
  manufacturer: 'Manufacturer information',
};

/** Refresh schedules in days, per field family (spec 12). */
export const REVIEW_INTERVAL_DAYS = {
  pricing: 14,
  availability: 14,
  identity: 180,
  composition: 180,
  safety: 90,
  evidence: 365,
  community: 180,
};

export const UNKNOWN_SOURCE = 'no reliable product-specific information on file';

/**
 * One fact. `known: false` means we do not know, which is different from a
 * known "no". Callers never read `value` without checking `known`.
 * @returns {{ value: any, known: boolean, source: string, source_type: string, verified_at: string|null, status: string, note?: string }}
 */
export function fact(value, { source = CATALOG_SOURCE, source_type = 'ayna_catalog', verified_at = null, status = 'needs_review', note } = {}) {
  const known = !isEmptyValue(value);
  return {
    value: known ? value : null,
    known,
    source: known ? source : UNKNOWN_SOURCE,
    source_type: known ? source_type : 'none',
    verified_at,
    status,
    ...(note ? { note } : {}),
  };
}

/** A fact we looked for and could not find. Never `false`. */
export function unknownFact(note) {
  return fact(null, { note });
}

/** A field that does not apply to this kind of product (e.g. dosage for a pad). */
export function notApplicable(reason) {
  return { value: null, known: false, notApplicable: true, source: reason || 'not applicable', source_type: 'none', verified_at: null, status: 'current' };
}

export function isEmptyValue(value) {
  if (value == null) return true;
  if (typeof value === 'string') {
    const t = value.trim();
    return !t || /^(n\/?a|none|not applicable|unknown|tbd|varies by product\.?|various[^.]*\.?)$/i.test(t);
  }
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

/**
 * Sections for the completeness score (spec 33). `critical` fields are the
 * QA checklist items (spec 15): missing any of them blocks a strong match.
 * `appliesTo(passport)` lets a field drop out for products where it makes no
 * sense (ingredients for a telehealth service), so completeness stays honest.
 */
const isPhysical = (p) => p.kind !== 'digital';
const isIngestibleOrTopical = (p) => ['ingestible', 'topical', 'vaginal_insert'].includes(p.risk.route);

export const PASSPORT_SECTIONS = [
  { id: 'identity', label: 'Identity', fields: [
    { path: 'identity.name', label: 'Exact product name', critical: true },
    { path: 'identity.brand', label: 'Brand', critical: true },
    { path: 'identity.category', label: 'Category', critical: true },
    { path: 'identity.variant', label: 'Exact variant', critical: true, appliesTo: isPhysical },
    { path: 'identity.image', label: 'Product image', critical: true },
    { path: 'identity.purchase_url', label: 'Live purchase URL', critical: true },
  ] },
  { id: 'pricing', label: 'Pricing', fields: [
    { path: 'pricing.price', label: 'Price', critical: true },
    { path: 'pricing.size_count', label: 'Size or count', appliesTo: isPhysical },
    { path: 'pricing.fsa_hsa', label: 'FSA/HSA status' },
    { path: 'pricing.availability', label: 'Where to buy' },
  ] },
  { id: 'composition', label: 'Ingredients', fields: [
    { path: 'composition.ingredients', label: 'Ingredients or materials', critical: true, appliesTo: isPhysical },
    { path: 'composition.active_ingredients', label: 'Active ingredients', appliesTo: isIngestibleOrTopical },
    { path: 'composition.dosage', label: 'Amount per serving', appliesTo: (p) => p.risk.route === 'ingestible' },
    { path: 'composition.allergens', label: 'Allergens', critical: true, appliesTo: isPhysical },
    { path: 'composition.fragrance', label: 'Fragrance status', appliesTo: (p) => isPhysical(p) && p.risk.route !== 'ingestible' },
  ] },
  { id: 'safety', label: 'Safety', fields: [
    { path: 'safety.warnings', label: 'Warnings', critical: true },
    { path: 'safety.side_effects', label: 'Side effects', appliesTo: isPhysical },
    { path: 'safety.regulatory_status', label: 'Regulatory status', appliesTo: isPhysical },
    { path: 'safety.recalls', label: 'Recall check' },
    { path: 'safety.pregnancy', label: 'Pregnancy information', critical: true, appliesTo: isIngestibleOrTopical },
    { path: 'safety.breastfeeding', label: 'Breastfeeding information', appliesTo: isIngestibleOrTopical },
    { path: 'safety.medication_interactions', label: 'Medication interactions', appliesTo: (p) => p.risk.route === 'ingestible' },
    { path: 'safety.age_restriction', label: 'Age restriction', appliesTo: (p) => p.risk.route === 'ingestible' },
    { path: 'safety.privacy', label: 'Data privacy', appliesTo: (p) => p.kind === 'digital' },
  ] },
  { id: 'health', label: 'Health mapping', fields: [
    { path: 'health.uses', label: 'Health uses', critical: true },
    { path: 'health.intended_use', label: 'Intended use' },
    { path: 'health.why_included', label: 'Why it is in ayna' },
  ] },
  { id: 'evidence', label: 'Evidence', fields: [
    { path: 'evidence.sources', label: 'Evidence sources', critical: true },
    { path: 'evidence.claims', label: 'Claim-level evidence' },
    { path: 'evidence.strength', label: 'Evidence strength' },
  ] },
  { id: 'community', label: 'Community', fields: [
    { path: 'community.summary', label: 'Review themes' },
    { path: 'community.sources', label: 'Community sources' },
  ] },
  { id: 'sources', label: 'Sources', fields: [
    { path: 'sources.all', label: 'Source list', critical: true },
    { path: 'explanation.summary', label: 'Plain-language explanation', critical: true },
  ] },
];

export function getPath(obj, path) {
  return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

/** Recall check result a reviewer records (where they checked goes in notes). */
export const RECALL_STATUS = ['none_found', 'recalled', 'unknown'];

/** Passport states that take a product off recommendations and shelves. */
export const OFF_SHELF_STATUSES = ['recalled', 'discontinued', 'unavailable'];

/** Which refresh schedule (REVIEW_INTERVAL_DAYS) a fact path follows. */
export function reviewFamilyFor(path) {
  const [section, field] = String(path || '').split('.');
  if (section === 'pricing') return field === 'availability' ? 'availability' : 'pricing';
  if (section === 'identity') return field === 'purchase_url' ? 'availability' : 'identity';
  if (section === 'composition') return 'composition';
  if (section === 'safety') return 'safety';
  if (section === 'evidence' || section === 'health') return 'evidence';
  if (section === 'community') return 'community';
  return 'identity';
}

const DAY_MS = 86400000;
/** 'YYYY-MM-DD' -> ms (UTC), or NaN. */
export function parseDay(value) {
  if (!value) return NaN;
  const t = Date.parse(String(value).length === 10 ? `${value}T00:00:00Z` : String(value));
  return Number.isFinite(t) ? t : NaN;
}
export function addDays(day, n) {
  const t = parseDay(day);
  return Number.isFinite(t) ? new Date(t + n * DAY_MS).toISOString().slice(0, 10) : null;
}
export function daysBetween(fromDay, toMs) {
  const t = parseDay(fromDay);
  return Number.isFinite(t) ? Math.floor((toMs - t) / DAY_MS) : null;
}

/** Plain label for a fact path ("safety.pregnancy" -> "Pregnancy information"). */
export const FIELD_LABELS = Object.fromEntries(PASSPORT_SECTIONS.flatMap((s) => s.fields.map((f) => [f.path, f.label])));
export function labelForPath(path) {
  if (FIELD_LABELS[path]) return FIELD_LABELS[path];
  const leaf = String(path || '').split('.').pop() || '';
  return leaf.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());
}
