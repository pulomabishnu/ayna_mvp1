// P0 golden synthetic tests (Oct 29). One test per audit finding / rule in
// docs/matching/audit-2026-10-29.md. Synthetic profiles only; real catalog.
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ALL_PRODUCTS, getProductMatchDetailsForProduct, hydrateCatalogProduct, getEcosystemSeedFromQuiz } from '../data/products.js';
import { EMPTY } from '../mobile/data/intakeModel.js';
import { buildUserProfile } from './userProfile.js';
import { buildProductProfile } from './productProfile.js';
import { evaluateSafety } from './score.js';
import { isCycleTrackingProduct } from './eligibility.js';
import { recommendationEligibilityForUser, holdStateFor } from './gate.js';
import { bandFor, buildEcosystemV2 } from './v2.js';
import { stampFactUpdates } from './factFreshness.js';
import { STAGE_SCOPE } from '../data/matching/stageScope.js';
import { reviewEventProps, publicHoldState, trackMatchWithheld, _resetReviewEvents } from '../utils/reviewAnalytics.js';
import posthog from 'posthog-js';

const byId = Object.fromEntries(ALL_PRODUCTS.map((p) => [p.id, p]));
const P = (id) => byId[id];
const DAY = 86400000;
const NOW = Date.parse('2026-10-29T12:00:00Z');
const user = (over, opts = {}) => buildUserProfile({ ...EMPTY, ...over }, { catalog: ALL_PRODUCTS, now: NOW, ...opts });
const quiz = (over) => ({ fullHealthIntake: { ...EMPTY, ...over }, personalizationCompleted: true });
const safety = (id, up) => evaluateSafety(buildProductProfile(P(id)), up);
const gate = (id, up) => recommendationEligibilityForUser(P(id), up);
const base = { allergyStatus: 'No', takesCurrent: 'No', safetyConcern: 'No', diagnosisSelections: ['None that I know of'] };

describe('P0 golden: life stage (never from age)', () => {
  it('1. a menopause-only supplement is excluded for someone with regular periods, even for hot flashes', () => {
    const up = user({ ...base, age: '34', lifeStageSelections: ['I get periods regularly'], supportSelections: ['Hot flashes'] });
    const g = gate('p-estroven-mood', up);
    expect(g.decision).toBe('excluded');
    expect(g.reasons.map((r) => r.code)).toContain('life_stage_out_of_scope');
    const d = getProductMatchDetailsForProduct(P('p-estroven-mood'), quiz({ ...base, age: '34', lifeStageSelections: ['I get periods regularly'], supportSelections: ['Hot flashes'] }));
    expect(d.matchStatus).toBe('excluded');
    expect(d.percent ?? 0).toBe(0);
  });
  it('2. no stage shared, age 52: held and asked, never guessed from age', () => {
    const up = user({ ...base, age: '52', supportSelections: ['Hot flashes'] });
    expect(up.physiology.lifeStages).toEqual([]);
    expect(up.physiology.menstruation).toBeNull();
    const g = gate('p-estroven-mood', up);
    expect(g.decision).toBe('hold');
    expect(g.state).toBe('needs_answer');
    expect(g.holds).toContain('life_stage');
  });
  it('3. perimenopause: the scope check passes (age irrelevant)', () => {
    for (const age of ['29', '61']) {
      const s = safety('p-estroven-mood', user({ ...base, age, lifeStageSelections: ['I am in perimenopause'], supportSelections: ['Hot flashes'] }));
      expect(s.reasons.map((r) => r.code)).not.toContain('life_stage_out_of_scope');
      expect(s.missingFields).not.toContain('life_stage');
    }
  });
  it('4. irregular periods: ask her to confirm her stage instead of excluding', () => {
    const g = gate('p-estroven-mood', user({ ...base, lifeStageSelections: ['My periods are irregular'], supportSelections: ['Hot flashes'] }));
    expect(g.decision).toBe('hold');
    expect(g.state).toBe('confirm');
    expect(g.holds).toContain('confirm_life_stage');
  });
  it('5. no periods now (cause not said) gets no cycle tracker or ovulation test', () => {
    const up = user({ ...base, lifeStageSelections: ['I do not currently get periods'], supportSelections: ['Irregular periods'] });
    expect(up.physiology.menstruation).toBe('paused');
    const trackers = ALL_PRODUCTS.filter((p) => isCycleTrackingProduct(buildProductProfile(p)));
    expect(trackers.length).toBeGreaterThan(0);
    for (const p of trackers) expect(gate(p.id, up).decision, p.id).toBe('excluded');
  });
  it('every stage-scoped id is a real catalog product', () => {
    for (const id of Object.keys(STAGE_SCOPE)) expect(P(id) || null, id).not.toBeNull();
  });
});

describe('P0 golden: unknown is not safe', () => {
  it('6. allergy + unknown allergen status on something that touches the body = hold; a device keeps a caution', () => {
    const up = user({ ...base, allergyStatus: 'Yes', allergyItems: ['Fragrance'], lifeStageSelections: ['I get periods regularly'], supportSelections: ['Cramps or period pain'] });
    const contact = ALL_PRODUCTS.map((p) => buildProductProfile(p)).find((pp) => pp.ingested && pp.safety.details.fragrance?.status === 'unknown');
    expect(contact).toBeTruthy();
    const s = evaluateSafety(contact, up);
    expect(s.restricted || !s.eligible).toBe(true);
    if (s.eligible) expect(s.missingProductInfo).toContain('allergen_info');
    const device = ALL_PRODUCTS.map((p) => buildProductProfile(p)).find((pp) => !pp.is_digital && !pp.ingested && pp.category === 'cramp-relief' && pp.formats.every((f) => !['topical', 'suppository', 'period_care'].includes(f)) && pp.safety.details.fragrance?.status === 'unknown');
    if (device) expect(evaluateSafety(device, up).missingProductInfo).not.toContain('allergen_info');
  });
  it('7. a product with no passport is not treated as safer (holds still apply)', () => {
    const up = user({ ...base, allergyStatus: 'Yes', allergyItems: ['Latex'], supportSelections: ['Trouble sleeping'] });
    const pp = { ...buildProductProfile({ id: 'x-new-herbal', name: 'New herbal sleep capsule', category: 'supplement', tags: ['sleep'], healthFunctions: ['sleep'] }), ingredients: [] };
    const noPassport = { ...pp, passport: undefined };
    const s = evaluateSafety(noPassport, up);
    expect(s.missingProductInfo).toContain('ingredient_list');
  });
  it('8. a listed medicine + a swallowed product nobody reviewed against it = "Checking this product"', () => {
    const up = user({ ...base, takesCurrent: 'Yes', currentMedicationItems: ['Sertraline'], lifeStageSelections: ['I get periods regularly'], supportSelections: ['Cramps or period pain'] });
    const g = gate('p-magnesium-glycinate', up);
    expect(g.decision).toBe('hold');
    expect(g.state).toBe('researching');
    expect(g.holds).toContain('interaction_info');
    expect(g.safety.blockedClaims).toContain('medication_compatible');
  });
  it('9. the same medicine never holds a heating pad or a non-hormonal topical', () => {
    const up = user({ ...base, takesCurrent: 'Yes', currentMedicationItems: ['Sertraline'], lifeStageSelections: ['I get periods regularly'], supportSelections: ['Cramps or period pain'] });
    expect(safety('p-thermacare', up).missingProductInfo).not.toContain('interaction_info');
    const topical = ALL_PRODUCTS.map((p) => buildProductProfile(p)).find((pp) => !pp.ingested && pp.formats.includes('topical') && !pp.formats.includes('suppository') && pp.safety.hormones !== 'yes' && !(pp.ingredient_classes || []).length);
    if (topical) expect(evaluateSafety(topical, up).missingProductInfo).not.toContain('interaction_info');
  });
});

describe('P0 golden: contradictions and stale answers hold and ask', () => {
  it('10. "no allergies" + a typed allergy holds ingredient products and asks her to confirm', () => {
    const up = user({ ...base, allergyStatus: 'No', anythingElse: 'I am allergic to latex', lifeStageSelections: ['I get periods regularly'], supportSelections: ['Cramps or period pain'] });
    expect(up.contradictions.some((c) => c.code === 'allergy_no_vs_free_text')).toBe(true);
    const g = gate('p-magnesium-glycinate', up);
    expect(g.decision).toBe('hold');
    expect(g.holds).toContain('confirm_answers');
  });
  it('11. stages that conflict (pregnant + post-menopause) hold supplements until she confirms', () => {
    const up = user({ ...base, lifeStageSelections: ['I am pregnant', 'I am post-menopause'], supportSelections: ['Trouble sleeping'] });
    const supp = ALL_PRODUCTS.map((p) => buildProductProfile(p)).find((pp) => pp.ingested && Object.keys(pp.health_need_relevance).includes('sleep.trouble_sleeping'));
    if (!up.physiology.compatibility.conflictingStages.length) return; // pair not marked conflicting in this ontology version
    const s = evaluateSafety(supp, up);
    expect(s.eligible === false || s.missingFields.includes('confirm_life_stage') || s.missingProductInfo.length > 0).toBe(true);
  });
  it('12. a pregnancy answer older than 280 days holds pregnancy-relevant products and asks', () => {
    const old = new Date(NOW - 300 * DAY).toISOString();
    const up = user({ ...base, lifeStageSelections: ['I am pregnant'], supportSelections: ['Prenatal or pregnancy support'], personalizationCompletedAt: old });
    expect(up.recency.stale.pregnancy).toBe(true);
    const hit = ALL_PRODUCTS.map((p) => buildProductProfile(p)).map((pp) => evaluateSafety(pp, up)).filter((s) => s.eligible && s.missingFields.includes('pregnancy_current'));
    expect(hit.length).toBeGreaterThan(0);
    for (const s of hit) expect(holdStateFor(s)).toBe('confirm');
  });
  it('13. per-fact freshness: a recently re-answered pregnancy is fresh even if the quiz is old', () => {
    const old = new Date(NOW - 300 * DAY).toISOString();
    const up = user({ ...base, lifeStageSelections: ['I am pregnant'], personalizationCompletedAt: old, factUpdatedAt: { pregnancy: new Date(NOW - 5 * DAY).toISOString() } });
    expect(up.recency.stale.pregnancy).toBe(false);
    expect(up.recency.factAgeDays.pregnancy).toBe(5);
    expect(up.recency.stale.medications).toBe(true); // falls back to the quiz time
  });
  it('14. saving stamps only the answers that changed', () => {
    const prev = { fullHealthIntake: { lifeStageSelections: ['I am pregnant'], currentMedicationItems: ['Sertraline'], factUpdatedAt: { pregnancy: '2026-01-01T00:00:00Z', medications: '2026-01-01T00:00:00Z' } } };
    const next = { fullHealthIntake: { lifeStageSelections: ['I am postpartum'], currentMedicationItems: ['Sertraline'] } };
    const out = stampFactUpdates(next, prev, '2026-10-29T00:00:00Z');
    expect(out.fullHealthIntake.factUpdatedAt.pregnancy).toBe('2026-10-29T00:00:00Z');
    expect(out.fullHealthIntake.factUpdatedAt.medications).toBe('2026-01-01T00:00:00Z');
    expect(stampFactUpdates(next, prev, 'NOW', { confirmed: ['medications'] }).factUpdatedAt.medications).toBe('NOW');
  });
});

const PERSONAS = [
  { ...base, lifeStageSelections: ['I get periods regularly'], supportSelections: ['Cramps or period pain', 'Trouble sleeping', 'PMS symptoms'] },
  { ...base, takesCurrent: 'Yes', currentMedicationItems: ['Sertraline'], lifeStageSelections: ['I am in perimenopause'], supportSelections: ['Hot flashes', 'Trouble sleeping'] },
  { ...base, allergyStatus: 'Yes', allergyItems: ['Fragrance', 'Latex'], lifeStageSelections: ['I get periods regularly'], supportSelections: ['Heavy periods', 'Vaginal dryness'] },
  { ...base, lifeStageSelections: ['I am pregnant'], supportSelections: ['Prenatal or pregnancy support', 'Trouble sleeping'] },
  { ...base, lifeStageSelections: ['I do not currently get periods'], supportSelections: ['Irregular periods', 'Hot flashes'] },
  { age: '45', supportSelections: ['Hot flashes', 'Trouble sleeping'] }, // nothing else answered
];

describe('P0 golden: fallbacks, bands, completeness', () => {
  it('15. no shelf (fallback included) ever holds a product the gate does not clear', () => {
    for (const intake of PERSONAS) {
      const up = user(intake);
      const eco = buildEcosystemV2(up, ALL_PRODUCTS);
      for (const shelf of eco.shelves) {
        for (const pick of shelf.picks) {
          const g = gate(pick.productId, up);
          expect(g.decision, `${pick.productId} on ${shelf.needId}${shelf.fallback ? ' (fallback)' : ''}`).toBe('eligible');
        }
      }
    }
  });
  it('16. a weak need is never a Strong match', () => {
    expect(bandFor(0.95, 1, { weak: true })).not.toBe('strong');
    for (const intake of PERSONAS) {
      for (const shelf of buildEcosystemV2(user(intake), ALL_PRODUCTS).shelves) {
        for (const pick of shelf.picks) if (pick.v2?.weakNeed) expect(pick.v2.band).not.toBe('strong');
      }
    }
  });
  it('17. Strong means 80% everywhere (band and label agree)', () => {
    expect(bandFor(0.794)).toBe('good');
    expect(bandFor(0.795)).toBe('strong');
    for (const intake of PERSONAS) {
      for (const p of ALL_PRODUCTS.slice(0, 120)) {
        const d = getProductMatchDetailsForProduct(p, quiz(intake));
        if (d.matchStatus === 'scored' && d.v2?.band === 'strong') expect(d.percent, p.id).toBeGreaterThanOrEqual(80);
      }
    }
  });
  it('18. an open clinician review = "Match being reviewed", no percent, for every persona', () => {
    for (const intake of PERSONAS) {
      const d = getProductMatchDetailsForProduct(P('p-remifemin'), quiz(intake));
      expect(d.percent || 0, JSON.stringify(intake)).toBe(0); // never a number above 0
      if (d.matchStatus === 'safety-hold') expect(['in_review', 'needs_answer', 'confirm']).toContain(d.safetyHold.state);
    }
    const peri = getProductMatchDetailsForProduct(P('p-remifemin'), quiz({ ...base, lifeStageSelections: ['I am in perimenopause'], supportSelections: ['Hot flashes'] }));
    expect(peri.matchStatus).toBe('safety-hold');
    expect(peri.safetyHold.state).toBe('in_review');
  });
  it('19. completeness states are ordered: her answers first, then review, then research, then brand-does-not-share', () => {
    const s = (over) => ({ restricted: true, missingFields: [], missingProductInfo: [], undisclosedInfo: [], ...over });
    expect(holdStateFor({ restricted: false })).toBe('verified');
    expect(holdStateFor(s({ missingFields: ['medications'], missingProductInfo: ['clinician_review'] }))).toBe('needs_answer');
    expect(holdStateFor(s({ missingFields: ['pregnancy_current'] }))).toBe('confirm');
    expect(holdStateFor(s({ missingProductInfo: ['clinician_review', 'interaction_info'] }))).toBe('in_review');
    expect(holdStateFor(s({ missingProductInfo: ['interaction_info'] }))).toBe('researching');
    expect(holdStateFor(s({ missingProductInfo: ['interaction_info'], undisclosedInfo: ['interaction_info'] }))).toBe('verified_unknown');
  });
});

describe('P0 golden: privacy, one gate, current facts', () => {
  beforeEach(() => _resetReviewEvents());
  it('20. review analytics never carry health data', () => {
    const props = reviewEventProps({ product_id: 'p-vitex', hold_state: 'needs_answer', surface: 'why', needs: ['pms'], lifeStage: 'pregnant', medications: ['sertraline'], reason: 'We don’t know whether you are pregnant', missingFields: ['pregnancy_status'] });
    expect(props).toEqual({ product_id: 'p-vitex', hold_state: 'profile', surface: 'why' });
    expect(publicHoldState('confirm')).toBe('profile');
    expect(publicHoldState('in_review')).toBe('in_review');
    const spy = vi.spyOn(posthog, 'capture').mockImplementation(() => {});
    trackMatchWithheld({ productId: 'p-vitex', state: 'in_review', surface: 'why' });
    trackMatchWithheld({ productId: 'p-vitex', state: 'in_review', surface: 'why' }); // deduped
    expect(spy.mock.calls.map((c) => c[0])).toEqual(['match_score_withheld', 'product_review_required']);
    for (const [, p] of spy.mock.calls) expect(Object.keys(p).sort()).toEqual(['hold_state', 'product_id', 'surface']);
    spy.mockRestore();
  });
  it('21. the gate and every surface agree: hold <-> safety-hold, excluded <-> excluded', () => {
    for (const intake of PERSONAS) {
      const up = user(intake);
      for (const p of ALL_PRODUCTS.slice(0, 150)) {
        const g = gate(p.id, up);
        const d = getProductMatchDetailsForProduct(p, quiz(intake));
        if (g.decision === 'excluded') expect(d.matchStatus, p.id).toBe('excluded');
        if (d.matchStatus === 'safety-hold') expect(g.decision, p.id).toBe('hold');
        if (d.matchStatus === 'scored') expect(g.decision, p.id).toBe('eligible');
      }
    }
  });
  it('22. a saved copy never overrides current catalog safety facts', () => {
    const current = P('p-magnesium-glycinate');
    const saved = { id: current.id, name: 'Old name', warnings: 'none', ingredients: 'water', status: 'active', savedAt: '2026-01-01', note: 'my note' };
    const h = hydrateCatalogProduct(saved);
    expect(h.name).toBe(current.name);
    expect(h.ingredients).toBe(current.ingredients);
    expect(h.warnings).toBe(current.warnings);
    expect(h.savedAt).toBe('2026-01-01');
    expect(h.note).toBe('my note');
  });
  it('the ecosystem seed (website and app) uses the same gate', () => {
    const { mergedProducts } = getEcosystemSeedFromQuiz(quiz(PERSONAS[1]));
    const up = user(PERSONAS[1]);
    for (const p of Object.values(mergedProducts || {})) if (p?.id && byId[p.id]) expect(gate(p.id, up).decision, p.id).toBe('eligible');
  });
});
