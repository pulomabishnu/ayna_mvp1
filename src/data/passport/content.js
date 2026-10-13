/**
 * Product page content, built once for both the website and the app
 * (founder spec 19, 20, 26-29). Simple first, deeper on tap.
 *
 * Every line comes from the catalog or the passport. Nothing is invented: a
 * section with nothing on file is dropped, and gaps go to "What we don't
 * know" instead of being papered over. ayna-written copy is labelled as
 * ayna's, manufacturer copy as the brand's, community copy as people's.
 */
import { HEALTH_FUNCTIONS, CATEGORY_LABELS } from '../products.js';
import { getPassport } from './index.js';
import { formatPrice } from '../../utils/formatPrice.js';
import { getPricePerUnitLabel } from '../../utils/pricePerUnit.js';
import { whyMatch, confidenceNotes, exclusionLines, isClaimBlocked, MIN_BADGE_SCORE } from '../../utils/matchDisplay.js';
import { planGlossaryTerms } from '../glossary.js';

/** No em dashes in anything we show; some catalog copy still has them. */
export function noDash(text) {
  return String(text || '').replace(/\s*\u2014\s*/g, ', ').replace(/^,\s*/, '').trim();
}
const clean = (v) => {
  const t = String(v ?? '').trim();
  return t && !/^(n\/?a|none|not applicable|unknown)$/i.test(t) ? noDash(t) : '';
};
const same = (a, b) => a && b && a.toLowerCase().replace(/[^a-z0-9]/g, '') === b.toLowerCase().replace(/[^a-z0-9]/g, '');
const lowerFirst = (s) => (s && /^[A-Z][a-z]/.test(s) ? s.charAt(0).toLowerCase() + s.slice(1) : s);

const ACRONYMS = { pcos: 'PCOS', ibs: 'IBS', uti: 'UTI', ivf: 'IVF', pms: 'PMS', pmdd: 'PMDD', hrt: 'HRT', iud: 'IUD', bv: 'BV', ob: 'OB' };
export function humanizeTag(tag) {
  return String(tag || '').replace(/[-_]/g, ' ').toLowerCase().split(' ')
    .map((w, i) => ACRONYMS[w] || (i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w)).join(' ');
}

// ---------------------------------------------------------------------------
// Header: one match line, a few facts
// ---------------------------------------------------------------------------

/** "Matches the period product support you selected", only for a need scoring 50+. */
export function matchLine(details) {
  if (!details || details.matchStatus !== 'scored') return '';
  const list = details.needMatches || [];
  const best = list.find((m) => m.needId === details.needId && m.relevant) || list.find((m) => m.relevant) || null;
  if (!best || !(best.score >= MIN_BADGE_SCORE) || !best.label) return '';
  return `Matches the ${lowerFirst(String(best.label).trim())} you selected`;
}

const ATTRIBUTE_TAGS = new Set([
  'organic', 'sustainability', 'comfort', 'privacy', 'non-hormonal', 'hormone-free', 'hormonal',
  'cruelty-free', 'vegan', 'reusable', 'external-only', 'travel-friendly', 'ph-neutral',
  'beginner-friendly', 'wearable', 'warming', 'telehealth', 'single-use', 'non-toxic', 'herbal',
  'graduated-set', 'gentle', 'drug-free', 'clinician-informed', 'dual-stimulation', 'accessory', 'education',
]);
const TAG_LABELS = { sustainability: 'Sustainable', comfort: 'Comfort', privacy: 'Privacy-first' };
const HIDDEN_TAGS = new Set(['cost', 'discomfort', 'non-toxic']);

/** 'safety-concern' means "a pick for people who care what's in it": say what it avoids, or drop it. */
function safetyConcernLabel(product) {
  const text = [product?.safety?.allergens, product?.safety?.materials, product?.summary, product?.ingredients].join(' ').toLowerCase();
  if (/fragrance[- ]free|unscented|no fragrance|free (?:from|of)[^.]*fragrance/.test(text)) return 'Good if you avoid fragrance';
  if (/plastic[- ]free|no plastic|free (?:from|of)[^.]*plastic/.test(text)) return 'Good if you avoid plastic';
  if (/chlorine[- ]free|no chlorine|free (?:from|of)[^.]*chlorine/.test(text)) return 'Good if you avoid chlorine bleach';
  return null;
}

/** Tags from the same text the summary uses, so they never contradict it. Fit first. */
export function buildTypedTags(product) {
  if (!product) return [];
  const summaryText = [product.summary, product.effectiveness].join(' ').toLowerCase();
  const caveats = String(product?.safety?.opinionAlerts || '').toLowerCase();
  const out = [];
  const seen = new Set();
  for (const raw of product.tags || []) {
    const tag = String(raw || '').toLowerCase();
    if (!tag || HIDDEN_TAGS.has(tag)) continue;
    if (tag === 'heavy-flow') {
      const saysLighter = /light(?:-| )to(?:-| )moderate|light flow|lighter flow|moderate flow/.test(summaryText) && !/heavy/.test(summaryText);
      const caveatHeavy = /(less|not) (?:as )?absorbent[^.]*heavy|not enough for heavy/.test(caveats);
      if (saysLighter || caveatHeavy) continue;
    }
    let label;
    let type;
    if (tag === 'safety-concern') {
      label = safetyConcernLabel(product);
      type = 'fit';
      if (!label) continue;
    } else {
      label = TAG_LABELS[tag] || humanizeTag(tag);
      type = ATTRIBUTE_TAGS.has(tag) ? 'attribute' : 'fit';
    }
    if (seen.has(label)) continue;
    seen.add(label);
    out.push({ label, type });
  }
  return [...out.filter((t) => t.type === 'fit'), ...out.filter((t) => t.type === 'attribute')];
}

/** A reviewer badge needs a real, named reviewer on the product. */
export function getNamedReviewer(product) {
  const r = product?.clinicianReviewer || product?.reviewedBy;
  if (!r || typeof r !== 'object') return null;
  const name = String(r.name || '').trim();
  const credential = String(r.credential || r.credentials || '').trim();
  const date = String(r.date || r.reviewedAt || '').trim();
  if (!name || !credential || !date) return null;
  return { name, credential, date, url: r.url || r.profileUrl || null };
}

function shortFda(product) {
  const s = String(product?.safety?.fdaStatus || '').trim();
  if (!s || s.includes('⚠') || s.length > 32) return null;
  return /^fda/i.test(s) ? s : `FDA: ${s}`;
}

/**
 * At most 3 short, meaningful facts for the header: who it suits first, then
 * what we can say about it. Claims the engine could not confirm for her are
 * never shown.
 */
export function headerFacts(product, { blockedClaims = [], max = 3 } = {}) {
  if (!product) return [];
  const passport = getPassport(product);
  const tags = buildTypedTags(product).filter((t) => !isClaimBlocked(t.label, blockedClaims));
  const reviewer = getNamedReviewer(product);
  const recalls = String(product?.safety?.recalls || '');
  const trust = [
    reviewer ? { label: `Reviewed by ${reviewer.name}, ${reviewer.credential}`, type: 'check', url: reviewer.url } : null,
    passport?.pricing.fsa_hsa.value === 'eligible' ? { label: 'FSA/HSA eligible', type: 'check' } : null,
    shortFda(product) ? { label: shortFda(product), type: 'check' } : null,
    String(product?.privacy?.sellsData || '').includes('❌') ? { label: 'Doesn’t sell your data', type: 'check' } : null,
    recalls && !recalls.includes('⚠') ? { label: 'No recalls on file', type: 'check' } : null,
  ].filter(Boolean);
  const fit = tags.filter((t) => t.type === 'fit').slice(0, 2);
  const out = [...fit];
  for (const t of trust) if (out.length < max) out.push(t);
  for (const t of tags.filter((x) => x.type === 'attribute')) if (out.length < max) out.push(t);
  return out.slice(0, max);
}

/** Price line: main + per-unit (only when computable) + small detail. */
export function priceParts(product) {
  const p = formatPrice(product);
  return { main: p.main, sub: p.sub, perUnit: getPricePerUnitLabel(product), known: p.main !== 'Price at retailer' };
}

/** The flagged concern on file (⚠️ convention), shown regardless of section. */
export function safetyAlertText(product) {
  const recalls = product?.safety?.recalls;
  if (!recalls || !String(recalls).includes('⚠️')) return null;
  return noDash(product?.safety?.opinionAlerts || recalls);
}

// ---------------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------------
function countLabel(n, one, many = `${one}s`) {
  return `${n} ${n === 1 ? one : many}`;
}

/**
 * Ordered sections for the product page. Each: { id, title, preview, blocks }.
 * Block types: text, list, steps, chips, facts, alert, note, sources, reviews.
 * @param {object} product
 * @param {{ details?: object, aynaData?: { ratings?: any[], reviews?: any[] }, aynaRating?: number|null, whyMatched?: string, hasProfile?: boolean }} ctx
 */
export function buildProductSections(product, ctx = {}) {
  if (!product) return [];
  const passport = getPassport(product);
  const { details = null, aynaData = null, aynaRating = null, whyMatched = '' } = ctx;
  const sections = [];
  const push = (id, title, blocks, preview = '') => {
    const kept = blocks.filter(Boolean).filter((b) => (b.items ? b.items.length > 0 : b.rows ? b.rows.length > 0 : Boolean(b.text)));
    if (kept.length) sections.push({ id, title, preview, blocks: kept });
  };
  const sources = passport.sources.all.known ? passport.sources.all.value : [];
  const brandSources = sources.filter((s) => s.evidence_type === 'manufacturer');
  const evidenceSources = sources.filter((s) => !['manufacturer', 'community'].includes(s.evidence_type));
  const communitySources = sources.filter((s) => s.evidence_type === 'community');
  const brandVoice = product.clinicianOpinionSource === 'brand';

  // 1. What it is
  const categoryLabel = String(CATEGORY_LABELS[product.category] || product.category || '').replace(/^[^\w]+\s*/, '');
  // "(see LOLA Organic Tampons for the founder story)" becomes a link.
  const xref = String(product.summary || '').match(/\s*\(see ([^()]+?) for (?:the )?([^()]+)\)/i);
  push('what', 'What it is', [
    { type: 'text', text: clean(xref ? String(product.summary).replace(xref[0], '') : product.summary) },
    xref ? { type: 'xref', text: xref[1].trim(), what: xref[2].trim() } : null,
    { type: 'text', text: clean(product.recommendationWhyDetail) },
    { type: 'facts', rows: [
      categoryLabel ? { label: 'Type', value: categoryLabel } : null,
      clean(product.platform) ? { label: 'Available on', value: clean(product.platform) } : null,
    ].filter(Boolean) },
  ]);

  // 2. What it may help with (catalog health tags, not ranked yet)
  const helps = [...new Set((product.healthFunctions || []).map((id) => HEALTH_FUNCTIONS[id]?.label).filter(Boolean))];
  push('helps', 'What it may help with', [{ type: 'chips', items: helps }], helps.slice(0, 3).join(', '));

  // 3. Who it may be for
  const who = (product.whoItsFor || []).map(clean).filter(Boolean);
  push('who', 'Who it may be for', [{ type: 'list', items: who }], countLabel(who.length, 'point'));

  // 4. How to use
  const how = product.howToUse?.steps?.length ? product.howToUse : null;
  push('howto', 'How to use', how ? [
    { type: 'text', text: clean(how.intro) },
    { type: 'steps', items: how.steps.map(clean).filter(Boolean) },
    how.sourceUrl ? { type: 'sources', items: sources.filter((s) => s.url === how.sourceUrl) } : null,
  ] : [], how ? countLabel(how.steps.length, 'step') : '');

  // 5. Ingredients and materials
  const ingredients = clean(product.ingredients);
  const materials = clean(product.safety?.materials);
  const science = (product.ingredientScience || []).filter((i) => i?.name);
  push('inside', product.type === 'digital' ? 'What’s included' : 'Ingredients and materials', [
    science.length ? { type: 'rows', items: science.map((i) => ({ title: noDash(i.name), text: clean(i.text) })) } : null,
    ingredients ? { type: 'text', label: 'Ingredients', text: ingredients, pre: true } : null,
    materials && !same(materials, ingredients) ? { type: 'text', label: 'Materials', text: materials } : null,
    clean(product.safety?.allergens) ? { type: 'text', label: 'Allergens and sensitivities', text: clean(product.safety.allergens) } : null,
  ], science.length ? science.map((i) => noDash(i.name).replace(/\s*\(.*\)$/, '')).slice(0, 3).join(', ') : (ingredients || materials).slice(0, 60));

  // 6. What the evidence says
  const doctorSummary = clean(product.verificationLinks?.doctor?.aiSummary);
  const sciSummary = clean(product.verificationLinks?.scientific?.aiSummary);
  const typeCounts = {};
  evidenceSources.forEach((s) => { typeCounts[s.evidence_label] = (typeCounts[s.evidence_label] || 0) + 1; });
  push('evidence', 'What the evidence says', [
    clean(product.evidenceStrength) ? { type: 'facts', rows: [{ label: 'Evidence on file', value: `${clean(product.evidenceStrength).charAt(0).toUpperCase()}${clean(product.evidenceStrength).slice(1)}` }] } : null,
    { type: 'text', label: 'ayna summary', text: clean(product.effectiveness) },
    !brandVoice ? { type: 'text', label: 'Clinician opinion', text: clean(product.doctorOpinion), note: clean(product.clinicianAttribution) } : null,
    doctorSummary && !same(doctorSummary, clean(product.doctorOpinion)) ? { type: 'text', label: 'What clinical sources say', text: doctorSummary } : null,
    sciSummary ? { type: 'text', label: 'What the research says', text: sciSummary } : null,
    evidenceSources.length && !passport.evidence.product_specific ? { type: 'note', text: 'The research linked here is about the ingredients or this type of product, not this exact product.' } : null,
    { type: 'sources', items: evidenceSources },
  ], Object.entries(typeCounts).map(([k, v]) => `${v} ${k.toLowerCase()}`).slice(0, 2).join(' · '));

  // 7. Safety and things to know
  const pregnancy = passport.safety.pregnancy;
  const breastfeeding = passport.safety.breastfeeding;
  const privacy = product.privacy && typeof product.privacy === 'object' ? product.privacy : null;
  const recalls = clean(product.safety?.recalls);
  const warnings = (product.warnings || []).map(clean).filter(Boolean);
  const alert = safetyAlertText(product);
  push('safety', 'Safety and things to know', [
    alert ? { type: 'alert', text: alert } : null,
    { type: 'list', label: 'Before you use', items: warnings },
    { type: 'text', label: 'Possible side effects', text: clean(product.safety?.sideEffects) },
    pregnancy?.known && !String(product.safety?.sideEffects || '').includes(String(pregnancy.value).slice(0, 40)) ? { type: 'text', label: 'Pregnancy and breastfeeding', text: noDash([pregnancy.value, breastfeeding?.known && breastfeeding.value !== pregnancy.value ? breastfeeding.value : ''].filter(Boolean).join(' ')) } : null,
    !alert && clean(product.safety?.opinionAlerts) ? { type: 'text', label: 'Things people raise', text: clean(product.safety.opinionAlerts) } : null,
    (product.avoidIfSensitivity || []).length ? { type: 'chips', label: 'Skip if you react to', items: product.avoidIfSensitivity.map(humanizeTag) } : null,
    { type: 'facts', rows: [
      clean(product.safety?.fdaStatus) ? { label: 'FDA status', value: clean(product.safety.fdaStatus) } : null,
      recalls && !recalls.includes('⚠') ? { label: 'Recalls', value: recalls } : null,
      privacy && clean(privacy.sellsData) ? { label: 'Sells your data', value: clean(privacy.sellsData).replace(/^[❌✅]\s*/, '') } : null,
      privacy && clean(privacy.dataStorage) ? { label: 'Data storage', value: clean(privacy.dataStorage) } : null,
      privacy && clean(privacy.hipaa) ? { label: 'HIPAA', value: clean(privacy.hipaa) } : null,
      privacy && clean(privacy.keyPolicy) ? { label: 'Privacy policy', value: clean(privacy.keyPolicy) } : null,
    ].filter(Boolean) },
  ], alert ? 'Safety note on file' : warnings.length ? countLabel(warnings.length, 'thing', 'things') + ' to know' : '');

  // 8. Price and value
  const price = priceParts(product);
  push('price', 'Price and value', [
    { type: 'facts', rows: [
      price.known ? { label: 'Price', value: [price.main, price.sub].filter(Boolean).join(' · ') } : null,
      price.perUnit ? { label: 'Per unit', value: price.perUnit } : null,
      passport.pricing.fsa_hsa.known ? { label: 'FSA/HSA', value: passport.pricing.fsa_hsa.value === 'eligible' ? 'Eligible' : 'Not eligible' } : null,
      details?.access?.label ? { label: 'Where', value: details.access.label } : null,
      (product.whereToBuy || []).length ? { label: 'Sold at', value: product.whereToBuy.join(', ') } : null,
    ].filter(Boolean) },
  ], [price.known ? price.main : '', price.perUnit].filter(Boolean).join(' · '));

  // 9. What people say (never overstated, spec 27)
  const reviews = (aynaData?.reviews || []).map((r) => clean(r?.text)).filter(Boolean).slice(0, 3);
  const ratingCount = Array.isArray(aynaData?.ratings) ? aynaData.ratings.length : 0;
  push('people', 'What people say', [
    aynaRating != null ? { type: 'facts', rows: [{ label: 'ayna members', value: `★ ${aynaRating.toFixed(1)} from ${countLabel(ratingCount, 'rating')}` }] } : null,
    reviews.length ? { type: 'reviews', items: reviews } : null,
    { type: 'text', label: 'Summary of public posts', text: clean(product.communityReview), note: 'Not verified, and not a safety finding.' },
    { type: 'note', text: clean(product.ratingNote) },
    { type: 'sources', items: communitySources },
  ], reviews.length ? countLabel(reviews.length, 'review') : communitySources.length ? countLabel(communitySources.length, 'link') : '');

  // 10. What the brand says (manufacturer claims, labelled)
  push('brand', 'What the brand says', [
    brandVoice ? { type: 'text', label: 'Manufacturer information', text: clean(product.doctorOpinion), note: clean(product.clinicianAttribution) } : null,
    (product.badges || []).length ? { type: 'chips', label: 'Labels on file, not independently checked', items: product.badges.map(noDash) } : null,
    { type: 'sources', items: brandSources },
  ], brandSources.length ? countLabel(brandSources.length, 'brand page') : '');

  // 11. What we don't know (spec 29)
  const unknown = [];
  const route = passport.risk.route;
  if (['ingestible', 'topical', 'vaginal_insert'].includes(route) && !pregnancy?.known) unknown.push('We could not find product-specific pregnancy safety information.');
  if (['ingestible', 'topical', 'vaginal_insert'].includes(route) && !breastfeeding?.known) unknown.push('We could not find product-specific breastfeeding information.');
  if (route === 'ingestible' && !passport.safety.medication_interactions.known) unknown.push('We have no information on how it interacts with medicines.');
  if (passport.kind === 'physical' && !passport.composition.ingredients.known) unknown.push('We do not have a full ingredient or materials list.');
  else if (passport.kind === 'physical' && !passport.composition.allergens.known) unknown.push('We do not have an allergen list for it.');
  if (passport.composition.fragrance && !passport.composition.fragrance.known && !passport.composition.fragrance.notApplicable && ['topical', 'external_device', 'internal_device'].includes(route)) unknown.push('We could not confirm whether it contains fragrance.');
  if (!evidenceSources.length) unknown.push('We have no research or clinical sources linked for it yet.');
  else if (!passport.evidence.product_specific) unknown.push('The ingredient or product type has research, but we found no study of this exact product.');
  push('unknown', 'What we don’t know', [
    { type: 'list', items: unknown },
    passport.qa.status !== 'verified' ? { type: 'note', text: 'ayna has not independently verified these product details yet. Check the label before you buy.' } : null,
  ], unknown.length ? countLabel(unknown.length, 'gap') : '');

  // 12. Why ayna matched it to you
  if (details && details.matchStatus && details.matchStatus !== 'no-profile') {
    const why = whyMatch(details);
    const strongNeeds = (details.needMatches || []).filter((m) => m.relevant && m.score >= MIN_BADGE_SCORE && m.needId !== details.needId).map((m) => m.label);
    const notes = details.matchStatus === 'scored' ? confidenceNotes(details, product) : [];
    push('match', 'Why ayna matched it to you', [
      why.reasons.length ? { type: 'list', items: why.reasons.map(noDash) } : { type: 'text', text: matchLine(details) },
      { type: 'text', text: clean(whyMatched) },
      strongNeeds.length ? { type: 'chips', label: 'Also fits', items: strongNeeds } : null,
      notes.length ? { type: 'chips', label: 'Good to know', items: notes } : null,
      details.matchStatus === 'excluded' ? { type: 'list', items: exclusionLines(details) } : null,
    ], details.matchStatus === 'scored' && Number.isFinite(details.percent) ? `${details.percent}% match` : '');
  }

  // 13. Sources
  push('sources', 'Sources', [{ type: 'sources', items: sources, grouped: true }], countLabel(sources.length, 'source'));

  return sections;
}

/** Which hard words to underline, in reading order, once each (spec 24). */
export function planSectionGlossary(sections, max = 6) {
  const blocks = [];
  sections.forEach((s) => s.blocks.forEach((b, i) => {
    if (b.type === 'text' || b.type === 'alert' || b.type === 'note') blocks.push({ key: `${s.id}:${i}`, text: b.text });
    if (b.type === 'list' || b.type === 'steps') b.items.forEach((t, j) => blocks.push({ key: `${s.id}:${i}:${j}`, text: t }));
    if (b.type === 'rows') b.items.forEach((r, j) => blocks.push({ key: `${s.id}:${i}:${j}`, text: r.text }));
  }));
  return planGlossaryTerms(blocks, max);
}
