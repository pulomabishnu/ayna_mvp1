/**
 * "ayna at a glance": the consolidated product information that is the hero
 * of the product page (website + app). One model, two renderers.
 *
 * Everything comes from the catalog entry and its passport
 * (src/data/passport). Nothing is invented:
 * - a field we cannot read is shown as "Not on file", never as a "no";
 * - community copy is labelled as people's, manufacturer copy as the brand's,
 *   ayna-written copy as ayna's;
 * - ratings only come from real ayna members (aynaData), never the catalog's
 *   unsourced userRating;
 * - sources are numbered once and cited inline like footnotes.
 */
import { HEALTH_FUNCTIONS, CATEGORY_LABELS } from '../../data/products.js';
import { commerceCardPrice } from '../../commerce/router.js';
import { commerceContext } from '../../commerce/platform.js';
import { getPassport, EVIDENCE_TYPES } from '../../data/passport/index.js';
import { priceParts, safetyAlertText, humanizeTag, noDash, matchLine, buildTypedTags } from '../../data/passport/content.js';
import { whyMatch, confidenceNotes, exclusionLines, isClaimBlocked, MIN_BADGE_SCORE } from '../../utils/matchDisplay.js';
import { planGlossaryTerms } from '../../data/glossary.js';
import { brandOf } from '../../mobile/data/brandFallback.js';

export const NOT_ON_FILE = 'Not on file';
const GENERIC_USES = new Set(['supplement', 'telehealth']);
/** Products where fragrance actually matters (worn against or put inside the body). */
const FRAGRANCE_CATS = new Set(['pad', 'tampon', 'incontinence', 'period-underwear', 'intimate-care', 'postpartum']);

const clean = (v) => {
  const t = String(v ?? '').trim();
  return t && !/^(n\/?a|none|not applicable|unknown|varies)\.?$/i.test(t) ? noDash(t) : '';
};
const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const same = (a, b) => Boolean(a && b && norm(a) === norm(b));
const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const sentences = (text) => String(text || '').split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);

/** Category label without the emoji some labels carry. */
export function categoryLabel(product) {
  return String(CATEGORY_LABELS[product?.category] || product?.category || '')
    .replace(/^[^\w]+\s*/, '')
    .replace(/-/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase());
}

// ---------------------------------------------------------------------------
// Size, count, per unit
// ---------------------------------------------------------------------------
const UNIT_WORDS = {
  pad: ['pad', 'pads'],
  tampon: ['tampon', 'tampons'],
  incontinence: ['piece', 'pieces'],
};
const COUNT_RE = /\b(\d+)\s*(capsules?|softgels?|tablets?|gummies|gummy|caps|sachets?|packets?|stick packs?|servings?|pads?|tampons?|liners?|wipes?|patches|patch|suppositories|suppository|count|ct|pack)\b/i;

/** "60 capsules", "32 pads", or null. Read from the catalog price text only. */
export function sizeCount(product) {
  const passport = getPassport(product);
  const verified = passport?.pricing?.size_count;
  if (verified?.known && verified.source_type !== 'ayna_catalog') {
    const text = noDash(String(verified.value));
    const m = text.match(COUNT_RE);
    const word = m && !/^(count|ct|pack)$/i.test(m[2]) ? m[2].toLowerCase().replace(/^caps$/, 'capsules') : null;
    return { text, n: Number.parseInt(text, 10) || null, word, fact: verified };
  }
  const p = String(product?.price || '');
  const m = p.match(COUNT_RE);
  if (m) {
    const n = Number(m[1]);
    let word = m[2].toLowerCase();
    if (/^(count|ct|pack)$/.test(word)) word = (UNIT_WORDS[product?.category] || ['unit', 'units'])[n === 1 ? 0 : 1];
    if (word === 'caps') word = 'capsules';
    return { text: `${n} ${word}`, n, word, fact: verified };
  }
  const f = p.match(/\bfor\s+(\d+)\b/i) || p.match(/\bpack of\s+(\d+)\b/i);
  if (f) {
    const n = Number(f[1]);
    const [one, many] = UNIT_WORDS[product?.category] || ['unit', 'units'];
    return { text: `${n} ${n === 1 ? one : many}`, n, word: n === 1 ? one : many, fact: verified };
  }
  return null;
}

/** "$0.30 per capsule" from a single catalog price and a count. Never from ranges. */
export function perUnitLabel(product) {
  const fromUtil = priceParts(product).perUnit;
  if (fromUtil) return fromUtil.replace(' / ', ' per ');
  if (commerceCardPrice(product, commerceContext())) return ''; // shown price isn't the catalog text
  const p = String(product?.price || '');
  if (!p || /[-–]\s*\$?\d|\bfrom\b|\/\s*(mo|month|year|yr)|per (month|session|visit)|subscription/i.test(p)) return '';
  const amount = p.match(/\$\s*(\d+(?:\.\d+)?)/);
  const size = sizeCount(product);
  if (!amount || !size?.n || size.n < 2) return '';
  const each = Number(amount[1]) / size.n;
  if (!Number.isFinite(each) || each <= 0) return '';
  const unit = String(size.word || 'unit').replace(/(ies)$/, 'y').replace(/(ches)$/, 'ch').replace(/s$/, '');
  return `$${each.toFixed(2)} per ${unit === 'gummy' ? 'gummy' : unit}`;
}

const FORM_RE = /\b(capsules?|softgels?|tablets?|gummies|powder|tea|drink mix|liquid|tincture|spray|mist|gel|cream|oil|balm|lotion|serum|wash|cleanser|wipes?|suppositor(?:y|ies)|patch(?:es)?|roll-on)\b/i;
/** Format: the category, plus the physical form when the catalog names one. */
export function formatLabel(product) {
  const cat = categoryLabel(product);
  if (product?.type === 'digital') return [cat, 'digital service'].filter(Boolean).join(' · ');
  const m = `${product?.price || ''} ${product?.name || ''}`.match(FORM_RE);
  const form = m ? m[1].toLowerCase().replace(/^capsule$/, 'capsules').replace(/^softgel$/, 'softgels').replace(/^tablet$/, 'tablets') : '';
  return [cat, form && !norm(cat).includes(norm(form)) ? form : ''].filter(Boolean).join(' · ');
}

/** Short ingredients or materials headline for the facts grid. */
export function ingredientHeadline(product, max = 72) {
  const science = (product?.ingredientScience || []).map((i) => noDash(i?.name || '').replace(/\s*\(.*?\)\s*/g, ' ').trim()).filter(Boolean);
  if (science.length) return science.slice(0, 3).join(', ');
  const text = clean(product?.ingredients) || clean(product?.safety?.materials);
  if (!text || /^various|^varies/i.test(text)) return '';
  const firstLine = text.split(/\n/)[0].replace(/\.$/, '');
  return firstLine.length > max ? `${firstLine.slice(0, max).replace(/[\s,;:]+\S*$/, '')}…` : firstLine;
}

// ---------------------------------------------------------------------------
// Sources: one numbered list for the whole page
// ---------------------------------------------------------------------------
const SOURCE_ORDER = ['product_study', 'clinical_guideline', 'regulatory', 'ingredient_research', 'expert_guidance', 'manufacturer', 'retailer', 'community'];
// Not an evidence type: where a price or pack size was checked.
const EXTRA_LABELS = { retailer: 'Retailer listing' };

function numberSources(passport) {
  const all = passport?.sources?.all?.known ? passport.sources.all.value : [];
  const extra = [];
  // Verified facts from reviews may carry their own source link.
  const seen = new Set(all.map((s) => s.url));
  const visit = (obj, path = '') => {
    if (!obj || typeof obj !== 'object') return;
    if (obj.known && (obj.url || obj.source_url) && obj.verified_at) {
      const url = obj.url || obj.source_url;
      if (/^https?:\/\//i.test(url) && !seen.has(url)) {
        seen.add(url);
        const type = obj.source_type === 'retailer' ? 'retailer' : obj.source_type === 'brand' || obj.source_type === 'official_label' ? 'manufacturer' : obj.source_type === 'regulatory' ? 'regulatory' : obj.source_type === 'research' ? 'ingredient_research' : obj.source_type === 'clinical_guidance' ? 'clinical_guideline' : obj.source_type === 'community' ? 'community' : 'expert_guidance';
        extra.push({ url, title: obj.source || path, publisher: hostOf(url), summary: null, evidence_type: type, evidence_label: EVIDENCE_TYPES[type] || EXTRA_LABELS[type] });
      }
      return;
    }
    for (const [k, v] of Object.entries(obj)) if (v && typeof v === 'object' && !Array.isArray(v) && k !== 'structured') visit(v, path ? `${path}.${k}` : k);
  };
  ['identity', 'pricing', 'composition', 'safety'].forEach((k) => visit(passport?.[k], k));
  const list = [...all, ...extra]
    .map((s, i) => ({ ...s, _i: i }))
    .sort((a, b) => (SOURCE_ORDER.indexOf(a.evidence_type) - SOURCE_ORDER.indexOf(b.evidence_type)) || (a._i - b._i))
    .map((s, i) => ({
      n: i + 1,
      url: s.url,
      title: noDash(s.title || s.publisher || 'Source'),
      publisher: s.publisher || hostOf(s.url),
      type: s.evidence_type,
      label: s.evidence_label || EVIDENCE_TYPES[s.evidence_type] || EXTRA_LABELS[s.evidence_type] || 'Source',
      summary: clean(s.summary),
      year: s.year || null,
    }));
  return list;
}
function hostOf(url) {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return ''; }
}

// ---------------------------------------------------------------------------
// Facts grid
// ---------------------------------------------------------------------------
function verifiedNote(f) {
  return f?.known && f.verified_at ? `Verified ${f.verified_at}` : '';
}

function refsFor(sources, url) {
  if (!url) return [];
  const s = sources.find((x) => x.url === url);
  return s ? [s.n] : [];
}

/**
 * Key facts. Unknown critical fields show "Not on file" so she knows we
 * looked; fields that do not apply (a pad has no dosage) are left out.
 */
export function buildKeyFacts(product, { passport, sources, details } = {}) {
  const pp = passport || getPassport(product);
  const isDigital = product?.type === 'digital';
  const facts = [];
  const add = (id, label, value, extra = {}) => {
    const v = clean(value);
    facts.push({ id, label, value: v || NOT_ON_FILE, unknown: !v, ...extra });
  };
  const factRefs = (f) => refsFor(sources || [], f?.url || f?.source_url);

  add('format', 'Format', formatLabel(product));
  if (isDigital) {
    add('platform', 'Available on', product.platform);
    add('pricing', 'Pricing', priceParts(product).known ? [priceParts(product).main, priceParts(product).sub].filter(Boolean).join(' · ') : clean(product.price));
    const privacy = product.privacy && typeof product.privacy === 'object' ? product.privacy : {};
    add('hipaa', 'HIPAA', clean(privacy.hipaa).replace(/^[✅❌]\s*/, ''));
    add('data', 'Sells your data', clean(privacy.sellsData).replace(/^[✅❌]\s*/, ''));
  } else {
    const size = sizeCount(product);
    add('size', 'Size or count', size?.text || '', { note: verifiedNote(size?.fact), refs: factRefs(size?.fact) });
    const per = perUnitLabel(product);
    if (per || ['pad', 'tampon', 'supplement', 'incontinence'].includes(product?.category)) add('perunit', 'Price per unit', per, { note: per && !priceParts(product).perUnit ? 'Worked out from the listed price' : '' });
    add('inside', 'Ingredients or materials', ingredientHeadline(product), { jump: 'inside' });
  }
  const fsa = pp?.pricing?.fsa_hsa;
  add('fsa', 'FSA/HSA', fsa?.known ? (fsa.value === 'eligible' ? 'Eligible' : 'Not eligible') : '', { note: verifiedNote(fsa), refs: factRefs(fsa) });
  const where = (product?.whereToBuy || []).map(clean).filter(Boolean);
  add('where', isDigital ? 'Where to get it' : 'Where to buy', where.join(', ') || (details?.access?.label || ''));
  if (!isDigital) {
    const reg = pp?.safety?.regulatory_status;
    if (reg?.known) add('fda', 'Regulatory status', String(reg.value).replace(/⚠️?/g, '').trim(), { note: verifiedNote(reg), refs: factRefs(reg) });
  }
  return facts;
}

// ---------------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------------
const LONG_TEXT = 320;

/**
 * Safety rows. Identical text found under two labels (pregnancy and
 * breastfeeding often share one sentence) is shown once, labels joined.
 */
function safetyRows(product, pp) {
  const route = pp.risk.route;
  const rows = [];
  const applies = (f) => f && !f.notApplicable;
  const val = (f) => (f?.known ? noDash(Array.isArray(f.value) ? f.value.join(', ') : String(f.value)) : '');
  const preg = pp.safety.pregnancy;
  const bf = pp.safety.breastfeeding;
  const meds = pp.safety.medication_interactions;
  if (applies(preg)) rows.push({ label: 'Pregnancy', value: val(preg) || NOT_ON_FILE, unknown: !preg.known });
  if (applies(bf)) rows.push({ label: 'Breastfeeding', value: val(bf) || NOT_ON_FILE, unknown: !bf.known });
  if (applies(meds)) rows.push({ label: 'Medicines', value: val(meds) || NOT_ON_FILE, unknown: !meds.known });
  if (applies(pp.composition.allergens)) {
    const a = clean(product?.safety?.allergens);
    rows.push({ label: 'Allergens', value: a || NOT_ON_FILE, unknown: !a });
  }
  const frag = pp.composition.fragrance;
  if (applies(frag) && (frag.known || ['topical', 'vaginal_insert'].includes(route) || FRAGRANCE_CATS.has(product?.category))) {
    rows.push({ label: 'Fragrance', value: frag.known ? String(frag.value).replace(/^\w/, (c) => c.toUpperCase()) : NOT_ON_FILE, unknown: !frag.known });
  }
  const latex = pp.composition.latex;
  if (applies(latex) && latex.known && !/latex/i.test(String(product?.safety?.allergens || ''))) rows.push({ label: 'Latex', value: String(latex.value).replace(/^\w/, (c) => c.toUpperCase()) });
  // Merge rows that say exactly the same thing.
  const merged = [];
  for (const r of rows) {
    const twin = merged.find((m) => !m.unknown && !r.unknown && same(m.value, r.value));
    if (twin) twin.label = `${twin.label} and ${r.label.toLowerCase()}`;
    else merged.push({ ...r });
  }
  merged.forEach((m) => { m.label = m.label.replace(/ and (.*) and /, ', $1 and '); });
  return merged;
}

/** Ordered sections for the panel. Empty ones are dropped. */
export function buildGlance(product, ctx = {}) {
  if (!product) return null;
  const pp = getPassport(product);
  const { details = null, aynaData = null, aynaRating = null, whyMatched = '' } = ctx;
  const ingredientRoute = ['ingestible', 'topical', 'vaginal_insert'].includes(pp.risk.route);
  const sources = numberSources(pp).map((s) => (s.type === 'ingredient_research' && !ingredientRoute ? { ...s, label: 'Product-type research' } : s));
  const byType = (types) => sources.filter((s) => types.includes(s.type));
  const evidenceSources = byType(['product_study', 'clinical_guideline', 'regulatory', 'ingredient_research', 'expert_guidance']);
  const brandSources = byType(['manufacturer']);
  const communitySources = byType(['community']);
  const brandVoice = product.clinicianOpinionSource === 'brand';
  const isDigital = product.type === 'digital';

  // What it is + who it's for
  const xref = String(product.summary || '').match(/\s*\(see ([^()]+?) for (?:the )?([^()]+)\)/i);
  const summaryText = clean(xref ? String(product.summary).replace(xref[0], '') : product.summary);
  const what = {
    text: summaryText,
    detail: clean(product.recommendationWhyDetail),
    xref: xref ? { name: xref[1].trim(), what: xref[2].trim() } : null,
  };
  const whoItems = (product.whoItsFor || []).map(clean).filter(Boolean);
  // Catalog fit tags first (same ones the cards use), then its health uses.
  // Claims the engine could not confirm for her are left out.
  const blocked = details?.blockedClaims || [];
  const fit = buildTypedTags(product).filter((t) => t.type === 'fit' && !isClaimBlocked(t.label, blocked)).map((t) => t.label);
  const uses = (product.healthFunctions || []).filter((id) => !GENERIC_USES.has(id)).map((id) => HEALTH_FUNCTIONS[id]?.label).filter(Boolean);
  const tidy = (t) => { const l = String(t).toLowerCase().replace(/\b(pms|pmdd|pcos|ibs|uti|bv|hrt|iud|ivf|fsa|hsa)\b/g, (m) => m.toUpperCase()); return l.charAt(0).toUpperCase() + l.slice(1); };
  const helps = [...new Set([...uses, ...fit].map(tidy))].slice(0, 6);
  const who = { items: whoItems, helps };

  const facts = buildKeyFacts(product, { passport: pp, sources, details });

  const sections = [];
  const push = (id, title, kind, blocks, extra = {}) => {
    const kept = blocks.filter(Boolean).filter((b) => (b.type === 'rating' ? true : b.items ? b.items.length > 0 : b.rows ? b.rows.length > 0 : Boolean(b.text)));
    if (kept.length) sections.push({ id, title, kind, blocks: kept, ...extra });
  };

  // Evidence
  const typeCounts = {};
  evidenceSources.forEach((s) => { typeCounts[s.label] = (typeCounts[s.label] || 0) + 1; });
  const strength = clean(product.evidenceStrength);
  const doctorSummary = clean(product.verificationLinks?.doctor?.aiSummary);
  const sciSummary = clean(product.verificationLinks?.scientific?.aiSummary);
  push('evidence', 'What the evidence says', 'evidence', [
    (strength || evidenceSources.length) ? { type: 'tags', items: [
      ...(strength ? [{ text: `Evidence on file: ${strength.toLowerCase()}`, tone: 'strong' }] : []),
      ...Object.entries(typeCounts).map(([label, n]) => ({ text: `${n} ${label.toLowerCase()}${n === 1 || /(research|guidance|information|experience)$/i.test(label) ? '' : 's'}`, tone: 'type' })),
    ] } : null,
    { type: 'text', label: 'ayna summary', text: clean(product.effectiveness) },
    !brandVoice ? { type: 'text', label: 'Clinical view', text: clean(product.doctorOpinion), note: clean(product.clinicianAttribution), refs: byType(['clinical_guideline', 'expert_guidance', 'regulatory']).map((s) => s.n) } : null,
    doctorSummary && !same(doctorSummary, clean(product.doctorOpinion)) ? { type: 'text', label: 'What clinical sources say', text: doctorSummary, refs: byType(['clinical_guideline', 'expert_guidance']).map((s) => s.n) } : null,
    sciSummary ? { type: 'text', label: 'What the research says', text: sciSummary, refs: byType(['product_study', 'ingredient_research']).map((s) => s.n) } : null,
    evidenceSources.length && !pp.evidence.product_specific ? { type: 'note', text: 'The research linked here is about the ingredients or this type of product, not this exact product.' } : null,
    { type: 'cites', items: evidenceSources },
  ]);

  // Safety
  const alert = safetyAlertText(product);
  const warnings = (product.warnings || []).map(clean).filter(Boolean);
  const rows = isDigital ? [] : safetyRows(product, pp);
  const shown = rows.map((r) => r.value).join(' ');
  const sideEffects = sentences(clean(product.safety?.sideEffects)).filter((s) => !shown.includes(s)).join(' ');
  const privacy = product.privacy && typeof product.privacy === 'object' ? product.privacy : null;
  const recalls = clean(product.safety?.recalls);
  push('safety', isDigital ? 'Safety and privacy' : 'Safety and things to know', 'safety', [
    alert ? { type: 'alert', text: alert } : null,
    { type: 'rows', rows },
    { type: 'list', label: 'Before you use', items: warnings },
    { type: 'text', label: isDigital ? 'Things to know' : 'Possible side effects', text: sideEffects },
    (product.avoidIfSensitivity || []).length ? { type: 'chips', label: 'Skip if you react to', items: product.avoidIfSensitivity.map(humanizeTag) } : null,
    { type: 'rows', rows: [
      recalls && !recalls.includes('⚠') ? { label: 'Recalls', value: recalls } : null,
      privacy && clean(privacy.dataStorage) ? { label: 'Data storage', value: clean(privacy.dataStorage) } : null,
      privacy && clean(privacy.keyPolicy) ? { label: 'Privacy', value: clean(privacy.keyPolicy) } : null,
    ].filter(Boolean) },
  ]);

  // Ingredients and materials
  const ingredients = clean(product.ingredients);
  const materials = clean(product.safety?.materials);
  const science = (product.ingredientScience || []).filter((i) => i?.name);
  const dosage = pp.composition.dosage;
  push('inside', isDigital ? 'What’s included' : 'Ingredients and materials', 'facts', [
    science.length ? { type: 'science', items: science.map((i) => ({ title: noDash(i.name), text: clean(i.text) })) } : null,
    ingredients ? { type: 'text', label: ['ingestible', 'topical', 'vaginal_insert'].includes(pp.risk.route) ? 'Ingredients' : 'Made of', text: ingredients, pre: true } : null,
    materials && pp.risk.route !== 'ingestible' && !norm(ingredients).includes(norm(materials)) && !norm(materials).includes(norm(ingredients) || '~') && !/^various|^varies/i.test(materials) ? { type: 'text', label: 'Materials', text: materials } : null,
    dosage?.known && Array.isArray(dosage.value) && dosage.value.length ? { type: 'list', label: 'Amount per serving', items: dosage.value.map(noDash) } : null,
  ]);

  // How to use
  const how = product.howToUse?.steps?.length ? product.howToUse : null;
  if (how) {
    push('howto', 'How to use', 'facts', [
      { type: 'text', text: clean(how.intro) },
      { type: 'steps', items: how.steps.map(clean).filter(Boolean), refs: refsFor(sources, how.sourceUrl) },
    ]);
  }

  // What people say (spec 27: never overstated)
  const reviews = (aynaData?.reviews || []).map((r) => clean(r?.text)).filter(Boolean).slice(0, 3);
  const ratingCount = Array.isArray(aynaData?.ratings) ? aynaData.ratings.length : 0;
  push('people', 'What people say', 'people', [
    aynaRating != null && ratingCount > 0 ? { type: 'rating', value: aynaRating, count: ratingCount } : null,
    reviews.length ? { type: 'reviews', items: reviews } : null,
    { type: 'text', label: 'Summary of public posts', text: clean(product.communityReview), note: 'Not verified, and not a safety finding.', refs: communitySources.map((s) => s.n) },
    !alert ? { type: 'text', label: 'Things people raise', text: clean(product.safety?.opinionAlerts) } : null,
    { type: 'note', text: clean(product.ratingNote) },
  ]);

  // What the brand says (manufacturer claims, labelled)
  push('brand', 'What the brand says', 'brand', [
    brandVoice ? { type: 'text', label: 'Manufacturer information', text: clean(product.doctorOpinion), note: clean(product.clinicianAttribution), refs: brandSources.map((s) => s.n) } : null,
    (product.badges || []).length ? { type: 'chips', label: 'Claims and labels, not independently checked', items: product.badges.map(noDash) } : null,
    !brandVoice && brandSources.length ? { type: 'cites', items: brandSources } : null,
  ]);

  // What we don't know (spec 29)
  const unknown = [];
  const route = pp.risk.route;
  const ingestOrTopical = ['ingestible', 'topical', 'vaginal_insert'].includes(route);
  if (ingestOrTopical && !pp.safety.pregnancy?.known) unknown.push('We could not find product-specific pregnancy safety information.');
  if (ingestOrTopical && !pp.safety.breastfeeding?.known) unknown.push('We could not find product-specific breastfeeding information.');
  if (route === 'ingestible' && !pp.safety.medication_interactions?.known) unknown.push('We have no information on how it interacts with medicines.');
  if (pp.kind === 'physical' && !pp.composition.ingredients?.known) unknown.push('We do not have a full ingredient or materials list.');
  else if (pp.kind === 'physical' && !pp.composition.allergens?.known) unknown.push('We do not have an allergen list for it.');
  if (pp.composition.fragrance && !pp.composition.fragrance.known && !pp.composition.fragrance.notApplicable && (route === 'topical' || FRAGRANCE_CATS.has(product.category))) unknown.push('We could not confirm whether it contains fragrance.');
  if (pp.kind === 'physical' && !pp.identity.variant?.known && ['pad', 'tampon', 'period-underwear', 'supplement', 'incontinence', 'intimate-care'].includes(product.category)) unknown.push('We have not recorded the exact version (size, absorbency, scent or formula), so check the one you pick.');
  if (!evidenceSources.length) unknown.push('We have no research or clinical sources linked for it yet.');
  else if (!pp.evidence.product_specific) unknown.push('The ingredient or product type has research, but we found no study of this exact product.');
  if (pp.kind === 'physical' && !pp.pricing.fsa_hsa?.known) unknown.push('We have not confirmed whether it is FSA/HSA eligible.');
  push('unknown', 'What we don’t know', 'unknown', [
    { type: 'list', items: unknown },
    pp.qa.status !== 'verified' ? { type: 'note', text: 'ayna has not independently verified these product details yet. Check the label before you buy.' } : null,
  ]);

  // Why ayna matched it to you
  if (details && details.matchStatus && details.matchStatus !== 'no-profile') {
    const why = whyMatch(details);
    const strongNeeds = (details.needMatches || []).filter((m) => m.relevant && m.score >= MIN_BADGE_SCORE && m.needId !== details.needId).map((m) => m.label);
    const notes = details.matchStatus === 'scored' ? confidenceNotes(details, product) : [];
    push('match', 'Why ayna matched it to you', 'match', [
      why.reasons.length ? { type: 'list', items: why.reasons.map(noDash) } : { type: 'text', text: matchLine(details) },
      { type: 'text', text: clean(whyMatched) },
      strongNeeds.length ? { type: 'chips', label: 'Also fits', items: strongNeeds } : null,
      notes.length ? { type: 'chips', label: 'Good to know', items: notes } : null,
      details.matchStatus === 'excluded' ? { type: 'list', items: exclusionLines(details) } : null,
    ]);
  }

  // Sections with nothing on file still say so, for the core four.
  const core = { evidence: 'What the evidence says', inside: 'Ingredients and materials', people: 'What people say' };
  for (const [id, title] of Object.entries(core)) {
    if (id === 'inside' && isDigital) continue;
    if (!sections.some((s) => s.id === id)) {
      const empty = id === 'evidence' ? 'We have no research or clinical sources linked for it yet.' : id === 'inside' ? 'We do not have a full ingredient or materials list.' : 'No ayna member reviews or community notes on file yet.';
      sections.push({ id, title, kind: id === 'inside' ? 'facts' : id, blocks: [{ type: 'empty', text: empty }] });
    }
  }
  const ORDER = ['evidence', 'safety', 'inside', 'howto', 'people', 'brand', 'unknown', 'match'];
  sections.sort((a, b) => ORDER.indexOf(a.id) - ORDER.indexOf(b.id));

  const nav = [
    { id: 'glance', label: 'At a glance' },
    ...sections.map((s) => ({ id: s.id, label: NAV_LABELS[s.id] || s.title })),
    ...(sources.length ? [{ id: 'sources', label: `Sources (${sources.length})` }] : []),
  ];

  return {
    brand: brandOf(product),
    what,
    who,
    facts,
    sections,
    sources,
    nav,
    verified: pp.qa.status === 'verified',
    // Research has checked at least some facts against sources, but a human
    // has not signed the product off yet.
    researched: pp.qa.status !== 'not_reviewed' || Boolean(pp.dates?.last_verified),
    alert,
    glossary: planGlossary({ what, who, sections }),
  };
}

const NAV_LABELS = {
  evidence: 'Evidence',
  safety: 'Safety',
  inside: 'Ingredients',
  howto: 'How to use',
  people: 'People say',
  brand: 'Brand says',
  unknown: 'Unknowns',
  match: 'Why it matched',
};

/** Hard words to underline, once each, in reading order (spec 24). */
function planGlossary({ what, who, sections }) {
  const blocks = [{ key: 'what', text: what.text }, { key: 'what:detail', text: what.detail }];
  who.items.forEach((t, j) => blocks.push({ key: `who:${j}`, text: t }));
  sections.forEach((s) => s.blocks.forEach((b, i) => {
    const k = `${s.id}:${i}`;
    if (b.type === 'text' || b.type === 'alert' || b.type === 'note') blocks.push({ key: k, text: b.text });
    if (b.type === 'list' || b.type === 'steps') b.items.forEach((t, j) => blocks.push({ key: `${k}:${j}`, text: t }));
    if (b.type === 'science') b.items.forEach((r, j) => blocks.push({ key: `${k}:${j}`, text: r.text }));
  }));
  return planGlossaryTerms(blocks, 6);
}

export { LONG_TEXT, plural };
