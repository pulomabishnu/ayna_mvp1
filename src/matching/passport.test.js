// Product passport -> matching engine. Passport data changes eligibility and
// confidence; it never lowers the displayed match percent (ASK2 C).
import { describe, it, expect } from 'vitest';
import { ALL_PRODUCTS, getRecommendationMatchesAndRest, getProductMatchDetailsForProduct, getListingStatus } from '../data/products.js';
import { EMPTY } from '../mobile/data/intakeModel.js';
import { buildPassport, primePassport } from '../data/passport/index.js';
import { buildUserProfile } from './userProfile.js';
import { buildProductProfile } from './productProfile.js';
import { scoreProductForNeed, evaluateSafety, evidenceFor, requiredFieldsFor } from './score.js';
import { buildEcosystem } from './ecosystem.js';

const byId = Object.fromEntries(ALL_PRODUCTS.map((p) => [p.id, p]));
const user = (over) => buildUserProfile({ ...EMPTY, ...over }, { catalog: ALL_PRODUCTS });
const cramps = { supportSelections: ['Cramps or period pain'] };
const NOW = Date.parse('2026-10-05T00:00:00Z');

let seq = 0;
/** A copy of a catalog product with its own id and a passport built from `review` (and optional link results). */
function withPassport(product, review, { links = null, now = NOW, passport } = {}) {
  seq += 1;
  const copy = { ...product, id: `${product.id}-t${seq}` };
  primePassport(copy, passport !== undefined ? passport : buildPassport(copy, { reviews: review ? { [copy.id]: review } : {}, links, now }));
  return copy;
}
const fresh = (facts = {}, over = {}) => ({
  qa_status: 'in_review', reviewed_at: '2026-10-01', last_checked: '2026-10-01', next_review_due: '2026-10-15', recall_status: 'none_found', facts, ...over,
});
const fact = (value, source_url = 'https://example.org/label') => ({ value, source: 'Label', source_url, source_type: 'official_label', verified_at: '2026-10-01' });

describe('passport status: recalled / discontinued / unavailable are never recommended', () => {
  const thermacare = byId['p-thermacare'];
  const up = user(cramps);

  it.each([
    ['recalled', fresh({}, { recall_status: 'recalled' }), {}],
    ['discontinued', fresh({}, { status: 'discontinued' }), {}],
  ])('%s -> excluded, off the shelf, flagged for Shop', (state, review) => {
    const p = withPassport(thermacare, review);
    expect(buildProductProfile(p).status.state).toBe(state);
    const s = evaluateSafety(p, up);
    expect(s.eligible).toBe(false);
    expect(s.reasons[0].code).toBe(`status_${state}`);
    const shelf = buildEcosystem(up, [p, ...ALL_PRODUCTS], { picksPerNeed: 10 }).shelves.find((x) => x.needId === 'pain.menstrual_cramp');
    expect(shelf.picks.map((x) => x.productId)).not.toContain(p.id);
    expect(getListingStatus(p)).toMatchObject({ state, offShelf: true });
    expect(getListingStatus(p).notice).toBeTruthy();
  });

  it('404 on the purchase link (link-status.json) -> unavailable', () => {
    const url = 'https://brand.example/thermacare';
    const p = withPassport({ ...thermacare, url, productUrl: url, affiliateUrl: url }, fresh(), {
      links: { generated_at: '2026-10-04', urls: { [url]: { kinds: ['purchase'], status: 404, ok: false } } },
    });
    expect(buildProductProfile(p).passport.status).toBe('unavailable');
    expect(evaluateSafety(p, up).reasons[0].code).toBe('status_unavailable');
  });

  it('a catalog product with a structured recall field is excluded, and Shop gets it in offShelf', () => {
    const recalled = byId['p-thermacare'];
    const copy = withPassport(recalled, fresh({}, { recall_status: 'recalled' }));
    const d = getProductMatchDetailsForProduct(copy, { fullHealthIntake: { ...EMPTY, ...cramps } });
    expect(d.eligibility).toBe('excluded');
    expect(d.percent).toBe(0);
    expect(d.listingStatus.offShelf).toBe(true);
    const lists = getRecommendationMatchesAndRest({ fullHealthIntake: { ...EMPTY, ...cramps } });
    expect(Array.isArray(lists.offShelf)).toBe(true);
    expect(lists.matches.every((x) => !getListingStatus(x).offShelf)).toBe(true);
  });

  it('an active passport changes nothing for an ordinary product', () => {
    expect(buildProductProfile(byId['p-thermacare']).status.state).toBe('active');
  });
});

describe('safety unknowns from the passport restrict, never mark safe', () => {
  const herb = { id: 't-herb', name: 'Test Black Cohosh Capsules', category: 'supplement', type: 'physical', ingredients: 'Black cohosh extract 40mg, cellulose capsule', tags: ['menopause'], healthFunctions: ['menopause'], safety: {}, summary: 'A black cohosh capsule.' };

  it('pregnant + hormone-active supplement with no pregnancy facts -> restricted (product info), not excluded', () => {
    const p = withPassport(herb, null);
    const pregnant = user({ lifeStageSelections: ['I am pregnant'], takesCurrent: 'No' });
    const s = evaluateSafety(p, pregnant);
    expect(s.eligible).toBe(true);
    expect(s.restricted).toBe(true);
    expect(s.missingProductInfo).toContain('pregnancy_info');
    expect(s.blockedClaims).toContain('pregnancy_safe');
  });

  it('a reviewed label "do not use if pregnant" excludes for a pregnant user and requires the life stage otherwise', () => {
    const p = withPassport(herb, fresh({ 'safety.pregnancy': fact('Do not use if pregnant or nursing.') }));
    expect(buildProductProfile(p).pregnancy.overall).toBe('contraindicated');
    expect(evaluateSafety(p, user({ lifeStageSelections: ['I am pregnant'], takesCurrent: 'No' })).reasons.map((r) => r.code)).toContain('pregnancy_contraindicated');
    const unknownStage = evaluateSafety(p, user({ takesCurrent: 'No' }));
    expect(unknownStage.missingFields).toContain('pregnancy_status');
  });

  it('"consult your physician if pregnant" on a reviewed label reads as caution', () => {
    const p = withPassport(herb, fresh({ 'safety.pregnancy': fact('Consult your physician before use if pregnant.') }));
    expect(buildProductProfile(p).pregnancy.overall).toBe('caution');
  });

  it('she takes medicines + hormone-active supplement with no interaction facts -> restricted', () => {
    const p = withPassport(herb, null);
    const s = evaluateSafety(p, user({ takesCurrent: 'Yes', currentMedicationItems: ['Sertraline'], lifeStageSelections: ['I get periods regularly'] }));
    expect(s.missingProductInfo).toContain('interaction_info');
    expect(s.blockedClaims).toContain('medication_compatible');
  });

  it('reviewed interaction text: requires the medicines answer, and names her medicine as a caution', () => {
    const mag = byId['p-magnesium-glycinate'];
    const p = withPassport(mag, fresh({ 'safety.medication_interactions': fact('Magnesium can reduce absorption of levothyroxine; separate doses by 4 hours.') }));
    expect(requiredFieldsFor(buildProductProfile(p))).toContain('medications');
    const s = evaluateSafety(p, user({ ...cramps, takesCurrent: 'Yes', currentMedicationItems: ['Levothyroxine'], lifeStageSelections: ['I get periods regularly'] }));
    expect(s.cautions.map((c) => c.code)).toContain('medication_label_interaction');
  });

  it('specific allergy + topical with no ingredient or allergen facts -> restricted; a pad is not', () => {
    const wash = { id: 't-wash', name: 'Test Intimate Wash', category: 'intimate-care', type: 'physical', safety: {}, summary: 'A wash.' };
    const p = withPassport(wash, null);
    const allergic = user({ allergyStatus: 'Yes', allergyItems: ['Latex'] });
    expect(evaluateSafety(p, allergic).missingProductInfo).toContain('ingredient_list');
    expect(evaluateSafety(byId['p-rael-organic-pad'], allergic).missingProductInfo || []).not.toContain('ingredient_list');
  });

  it('restricted by product info keeps the same percent', () => {
    const plain = withPassport(herb, null);
    const up1 = user({ supportSelections: ['Hot flashes'], lifeStageSelections: ['I am pregnant'], takesCurrent: 'No' });
    const r = scoreProductForNeed(plain, up1, 'menopause.body_changes');
    expect(r.relevance).toBeGreaterThan(0);
    expect(r.eligibility).toBe('restricted');
    const noPassport = withPassport(herb, null, { passport: null });
    const n = scoreProductForNeed(noPassport, up1, 'menopause.body_changes');
    expect(n.eligibility).toBe('eligible');
    expect(n.score).toBe(r.score);
  });
});

describe('allergen and leave-out filters compare canonical ingredient ids', () => {
  it('aspirin allergy excludes a sodium salicylate product the text rules miss', () => {
    const p = withPassport({ id: 't-sal', name: 'Test Urinary Pain Relief Tablets', category: 'supplement', type: 'physical', ingredients: 'Sodium salicylate 162.5 mg, methenamine 162 mg', safety: {} }, null);
    const pp = buildProductProfile(p);
    expect(pp.ingredient_ids).toContain('sodium-salicylate');
    expect(pp.safety.aspirin).toBe('yes');
    expect(evaluateSafety(p, user({ allergyStatus: 'Yes', allergyItems: ['Aspirin'] })).reasons.map((r) => r.code)).toContain('allergen_conflict');
  });

  it('reviewed ingredient list names latex -> latex allergy excluded', () => {
    const p = withPassport({ id: 't-glove', name: 'Test Wrap', category: 'pelvic-floor', type: 'physical', safety: {} }, fresh({ 'composition.ingredients': fact('Natural rubber latex, polyester') }));
    expect(buildProductProfile(p).safety.latex).toBe('yes');
  });

  it('"free of" and "-free" never read as presence', () => {
    const p = withPassport({ id: 't-free', name: 'Test Pad', category: 'pad', type: 'physical', ingredients: 'Organic cotton. Free of latex, fragrance and dyes.', safety: {} }, null);
    expect(buildProductProfile(p).safety.latex).not.toBe('yes');
  });
});

describe('passport completeness and freshness lower confidence, never the match', () => {
  const thermacare = byId['p-thermacare'];
  const up = user({ ...cramps, preferredFormats: ['Patches'] });

  it('stale passport -> passport_stale; same score as a current one', () => {
    const current = withPassport(thermacare, fresh());
    const stale = withPassport(thermacare, fresh(), { now: Date.parse('2027-03-01T00:00:00Z') });
    const a = scoreProductForNeed(current, up, 'pain.menstrual_cramp');
    const b = scoreProductForNeed(stale, up, 'pain.menstrual_cramp');
    expect(b.confidenceReasons.map((c) => c.code)).toContain('passport_stale');
    expect(a.confidenceReasons.map((c) => c.code)).not.toContain('passport_stale');
    expect(b.confidence).toBeLessThan(a.confidence);
    expect(b.score).toBe(a.score);
  });

  it('critical gaps -> passport_critical_gaps; same score as with no passport at all', () => {
    const gappy = withPassport(thermacare, null);
    const none = withPassport(thermacare, null, { passport: null });
    const a = scoreProductForNeed(gappy, up, 'pain.menstrual_cramp');
    const b = scoreProductForNeed(none, up, 'pain.menstrual_cramp');
    expect(a.confidenceReasons.map((c) => c.code)).toContain('passport_critical_gaps');
    expect(a.score).toBe(b.score);
    expect(a.confidence).toBeLessThan(b.confidence);
  });
});

describe('claim-level evidence from the passport', () => {
  const thermacare = byId['p-thermacare'];
  const clinicalFirst = user({ ...cramps, trustRanking: ['Clinical or scientific evidence', 'Reviews and experiences from other women', 'Brand reputation or expert recommendations'], trustRankingTouched: true });
  const claim = (over) => fresh({ 'evidence.claims': fact([{ claim: 'Heat wraps relieve period cramps (dysmenorrhea)', strength: 'strong', evidence_type: 'product_study', source_url: 'https://pubmed.ncbi.nlm.nih.gov/1', product_specific: true, ...over }]) });

  it('a matching product-specific claim beats an ingredient-level one, which beats none', () => {
    const none = scoreProductForNeed(withPassport(thermacare, fresh()), clinicalFirst, 'pain.menstrual_cramp');
    const ingredient = scoreProductForNeed(withPassport(thermacare, claim({ product_specific: false, evidence_type: 'ingredient_research' })), clinicalFirst, 'pain.menstrual_cramp');
    const product = scoreProductForNeed(withPassport(thermacare, claim()), clinicalFirst, 'pain.menstrual_cramp');
    expect(product.components.evidence).toBeGreaterThan(ingredient.components.evidence);
    expect(ingredient.components.evidence).toBeGreaterThanOrEqual(none.components.evidence);
    expect(product.evidence.level).toBe('product_specific');
    // Main's catalog evidence adds a 2026 heat-therapy systematic review to
    // ThermaCare, so its category-level evidence now reads as guideline-level,
    // which already outranks an ingredient-only passport claim.
    expect(ingredient.evidence.level).toBe('guideline');
  });

  it('a claim about a different need does not count for this one', () => {
    const p = withPassport(thermacare, claim({ claim: 'Improves fertility' }));
    const pp = buildProductProfile(p);
    expect(pp.passport.claim_evidence['pain.menstrual_cramp']).toBeUndefined();
    expect(evidenceFor(pp, 'pain.menstrual_cramp').passportClaims).toEqual([]);
  });

  it('strength "none" adds nothing', () => {
    const pp = buildProductProfile(withPassport(thermacare, claim({ strength: 'none' })));
    expect(pp.passport.claim_evidence['pain.menstrual_cramp']).toBeUndefined();
  });
});
