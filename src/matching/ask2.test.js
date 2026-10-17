// Founder spec ASK2: UI categories are not causes (A), improvements without
// new questions (B), missing data never equals a bad match (C).
import { describe, it, expect } from 'vitest';
import { ALL_PRODUCTS } from '../data/products.js';
import { EMPTY, SUPPORT_GROUPS } from '../mobile/data/intakeModel.js';
import { buildUserProfile } from './userProfile.js';
import { buildProductProfile, productSimilarity } from './productProfile.js';
import { scoreProductForNeed, scoreProduct, evaluateSafety, healthSentence } from './score.js';
import { buildEcosystem, diversify, assignRoles, compareResults } from './ecosystem.js';
import { NEEDS, NEED_POLICY, NEED_KINDS, needIdForOption, canonicalNeedId, canonicalize, LEGACY_CONCERN_NEEDS, LEGACY_FRUSTRATION_NEEDS } from './ontology.js';
import { extractFreeText, summarizeFreeText } from './freeText.js';

const byId = Object.fromEntries(ALL_PRODUCTS.map((p) => [p.id, p]));
const P = (id) => byId[id];
const user = (over, opts = {}) => buildUserProfile({ ...EMPTY, ...over }, { catalog: ALL_PRODUCTS, ...opts });
const shelf = (up, needId, opts = {}) => buildEcosystem(up, ALL_PRODUCTS, { picksPerNeed: 10, ...opts }).shelves.find((s) => s.needId === needId);
const shelfIds = (up, needId, opts) => shelf(up, needId, opts).picks.map((p) => p.productId);

// Products positioned for menopause (catalog classification).
const MENOPAUSE_POSITIONED = ALL_PRODUCTS.filter((p) => {
  const pp = buildProductProfile(p);
  return pp.life_stage.menopause === 'designed_for' && !['sleep'].includes(pp.category);
}).map((p) => p.id);
const DIAGNOSIS_WORDS = /\b(suggests?|caused by|because you are likely|likely entering|sign of|you (probably|may) have|due to your)\b/i;

describe('A. symptoms, diagnoses and life stages are separate kinds', () => {
  it('every intake support option has a canonical need, a kind and an audited policy', () => {
    const options = SUPPORT_GROUPS.flatMap((g) => g.items).filter((o) => o !== 'Nothing right now');
    for (const option of options) {
      const id = needIdForOption(option);
      expect(id, option).toBeTruthy();
      const policy = NEED_POLICY[id];
      expect(policy, id).toBeTruthy();
      expect(Object.keys(NEED_KINDS)).toContain(policy.kind);
      expect(Array.isArray(policy.prohibited)).toBe(true);
    }
    for (const n of NEEDS) expect(NEED_POLICY[n.id], n.id).toBeTruthy();
  });

  it('every contextual product relationship requires a context the need policy allows', () => {
    for (const p of ALL_PRODUCTS) {
      for (const [needId, e] of Object.entries(buildProductProfile(p).health_need_relevance)) {
        for (const c of e.contextual || []) c.requires.forEach((ctx) => expect(NEED_POLICY[needId].unlocks, `${p.id} ${needId} ${ctx}`).toContain(ctx));
      }
    }
  });

  it('no need id or family is named after the UI section it sits under', () => {
    expect(needIdForOption('Night sweats')).toBe('vasomotor.night_sweats');
    expect(needIdForOption('Hot flashes')).toBe('vasomotor.hot_flashes');
    expect(canonicalNeedId('menopause.night_sweats')).toBe('vasomotor.night_sweats');
    for (const option of ['Night sweats', 'Hot flashes', 'Joint aches', 'Acne', 'Nausea', 'Fatigue or low energy', 'Brain fog', 'Vaginal dryness', 'Frequent urination', 'Irregular periods', 'Heavy periods', 'Pelvic pain']) {
      expect(NEED_POLICY[needIdForOption(option)].kind, option).toBe('symptom');
    }
  });

  it('selecting a symptom never creates a diagnosis or a life stage (every option)', () => {
    const options = SUPPORT_GROUPS.flatMap((g) => g.items);
    const up = user({ supportSelections: options, age: '47' });
    expect(up.safety.conditions).toEqual([]);
    expect(up.physiology.lifeStages).toEqual([]);
    expect(up.safety.pregnant).toBe(false);
    // Contexts may only come from options that NAME the context themselves.
    for (const ctx of Object.values(up.contexts)) {
      ctx.sources.forEach((src) => expect(src.type).toBe('need'));
    }
    expect(up.contexts.menopause_transition.sources.map((s) => s.id)).toEqual(['menopause.body_changes']);
  });

  it('irregular periods + acne + facial hair stays three symptoms, not PCOS', () => {
    const up = user({ supportSelections: ['Irregular periods', 'Acne', 'Excess facial or body hair'] });
    expect(up.safety.conditions).toEqual([]);
    expect(up.contexts.pcos).toBeUndefined();
    expect(up.healthIntent.reinforcement).toEqual({});
  });

  it('legacy broad areas map only to needs they name (no "vaginal" -> UTI, no menopause -> hot flashes)', () => {
    expect(LEGACY_CONCERN_NEEDS['Gut and vaginal health (probiotics, pH balance)']).toEqual([]);
    expect(LEGACY_CONCERN_NEEDS['Perimenopause and menopause support']).toEqual(['menopause.body_changes']);
    expect(LEGACY_FRUSTRATION_NEEDS['Menopause symptoms']).toEqual(['menopause.body_changes']);
    expect(LEGACY_CONCERN_NEEDS['Sexual health and comfort (lubricants, pelvic floor)']).toEqual(['sexual.wellness']);
  });
});

describe('A. night sweats (the founder example)', () => {
  const young = user({ age: '24', lifeStageSelections: ['I get periods regularly'], supportSelections: ['Night sweats'] });

  it('night sweats at 24 with regular periods gets no menopause products', () => {
    const ids = shelfIds(young, 'vasomotor.night_sweats');
    MENOPAUSE_POSITIONED.forEach((id) => expect(ids, id).not.toContain(id));
    expect(young.contexts.menopause_transition).toBeUndefined();
    for (const id of ['p-womaness-me', 'd-midi-health', 'p-gennev-care', 'p-remifemin']) {
      if (!byId[id]) continue;
      expect(scoreProductForNeed(P(id), young, 'vasomotor.night_sweats').score, id).toBe(0);
    }
  });

  it('a cooling product is a DIRECT-type match for night sweats with no life stage needed', () => {
    const r = scoreProductForNeed(P('d-eight-sleep'), young, 'vasomotor.night_sweats');
    expect(r.relevance).toBeGreaterThanOrEqual(0.8);
    expect(r.explanations[0]).toBe('Matches the night sweats you selected');
    expect(r.explanations.join(' ')).not.toMatch(/menopause/i);
  });

  it('night sweats + explicit perimenopause unlocks contextual products, with an honest explanation', () => {
    const peri = user({ age: '48', lifeStageSelections: ['I am in perimenopause', 'My periods are irregular'], supportSelections: ['Night sweats', 'Hot flashes'] });
    const r = scoreProductForNeed(P('p-womaness-me'), peri, 'vasomotor.night_sweats');
    expect(r.score).toBeGreaterThanOrEqual(65);
    expect(r.contextual).toBe(true);
    expect(r.explanations[0]).toBe('Matches your night sweats and the perimenopause stage you shared');
  });

  it('context multiplier: the same cooling product gains about 0.10 with explicit perimenopause, nothing without', () => {
    const peri = user({ lifeStageSelections: ['I am in perimenopause'], supportSelections: ['Night sweats'] });
    const a = scoreProductForNeed(P('d-eight-sleep'), young, 'vasomotor.night_sweats');
    const b = scoreProductForNeed(P('d-eight-sleep'), peri, 'vasomotor.night_sweats');
    expect(b.components.health - a.components.health).toBeCloseTo(0.1, 5);
    const noStage = user({ supportSelections: ['Night sweats'], age: '52' });
    expect(scoreProductForNeed(P('d-eight-sleep'), noStage, 'vasomotor.night_sweats').components.health).toBeCloseTo(a.components.health, 5);
  });

  it('age alone never activates menopause context', () => {
    const up = user({ age: '55', supportSelections: ['Night sweats', 'Brain fog', 'Joint aches'] });
    expect(up.contexts).toEqual({});
    expect(scoreProductForNeed(P('p-womaness-me'), up, 'vasomotor.night_sweats').score).toBe(0);
  });

  it('free text: "I wake up drenched in sweat" -> night sweats only; "night sweats from menopause" -> reported context', () => {
    const plain = summarizeFreeText(extractFreeText('I wake up drenched in sweat'));
    expect(plain.mentioned_needs.map((n) => n.id)).toEqual(['vasomotor.night_sweats']);
    expect(plain.reported_contexts).toEqual([]);
    const ctx = summarizeFreeText(extractFreeText('My night sweats from menopause are awful'));
    expect(ctx.reported_contexts.map((r) => r.stage)).toEqual(['menopause']);
    expect(summarizeFreeText(extractFreeText('could this be menopause?')).reported_contexts).toEqual([]);
    expect(summarizeFreeText(extractFreeText('I am not pregnant')).reported_contexts).toEqual([]);
    const up = user({ supportSelections: ['Night sweats'], anythingElse: 'My night sweats from menopause are awful' });
    expect(up.contexts.menopause_transition.sources[0]).toMatchObject({ type: 'free_text', id: 'menopause' });
    expect(up.physiology.lifeStages).toEqual([]);
    expect(up.safety.pregnancyStatus).toBe('unknown');
    const r = scoreProductForNeed(P('p-womaness-me'), up, 'vasomotor.night_sweats');
    expect(r.score).toBeGreaterThan(0);
    expect(r.explanations[0]).toBe('Matches your night sweats and the menopause you mentioned');
    expect(up.freeText.raw ?? 'kept').toBeTruthy();
  });
});

describe('A. other symptoms never imply a cause', () => {
  it('acne alone never infers PCOS; acne + PCOS diagnosis can boost PCOS-specific products', () => {
    const acne = user({ supportSelections: ['Acne'] });
    const both = { id: 't-pcos-acne', name: 'Test PCOS acne support', category: 'supplement', tags: ['pcos', 'acne'] };
    const a = scoreProductForNeed(both, acne, 'skin.acne');
    expect(a.explanations.join(' ')).not.toMatch(/PCOS/);
    const withDx = user({ supportSelections: ['Acne'], diagnosisSelections: ['PCOS'] });
    expect(scoreProductForNeed(both, withDx, 'skin.acne').score).toBeGreaterThan(a.score);
  });

  it('fatigue alone does not unlock iron; an explicit anemia diagnosis does', () => {
    const iron = P('p-nature-made-iron-65mg');
    expect(scoreProductForNeed(iron, user({ supportSelections: ['Fatigue or low energy'] }), 'energy.fatigue').relevance).toBe(0);
    const dx = user({ supportSelections: ['Fatigue or low energy'], diagnosisSelections: ['Anemia or iron deficiency'] });
    const r = scoreProductForNeed(iron, dx, 'energy.fatigue');
    expect(r.relevance).toBeGreaterThan(0);
    expect(r.explanations[0]).toMatch(/low energy and the iron deficiency diagnosis you shared/);
  });

  it('frequent urination alone does not make UTI products strong matches', () => {
    const up = user({ supportSelections: ['Frequent urination'] });
    for (const id of ['p-azo-test', 'p-winx-uti-test-treat', 'p-d-mannose-now', 'p-cranberry-supplement']) {
      if (!byId[id]) continue;
      expect(scoreProductForNeed(P(id), up, 'urinary.frequency').relevance, id).toBeLessThan(0.8);
    }
  });

  it('nausea alone never sets pregnancy', () => {
    const up = user({ supportSelections: ['Nausea'] });
    expect(up.safety.pregnant).toBe(false);
    expect(up.contexts.pregnancy).toBeUndefined();
  });

  it('vaginal options stay separate; cycle vs digestive bloating stay separate; pain types stay separate', () => {
    const up = user({ supportSelections: ['Vaginal dryness', 'Vaginal itching or irritation', 'Unusual vaginal discharge', 'Vaginal odor', 'BV concerns', 'Yeast infection concerns', 'Cycle-related bloating', 'Digestive bloating', 'Pelvic pain', 'Cramps or period pain', 'Pain or discomfort during sex', 'Joint aches', 'Abdominal discomfort'] });
    expect(new Set(up.healthIntent.needs.map((n) => n.id)).size).toBe(13);
    expect(up.healthIntent.needs.some((n) => n.id.startsWith('urinary.'))).toBe(false);
    // A moisturizer is direct for dryness only.
    const m = scoreProduct(P('p-neycher-vaginal-moisturizer'), up);
    const by = Object.fromEntries(m.needs.map((n) => [n.needId, n.relevance]));
    expect(by['vaginal.dryness']).toBe(1);
    expect(by['vaginal.bv'] || 0).toBeLessThan(0.55);
    expect(by['vaginal.discharge'] || 0).toBe(0);
    // A heat patch is direct for cramps, not for joint aches or pain during sex.
    const h = Object.fromEntries(scoreProduct(P('p-thermacare'), up).needs.map((n) => [n.needId, n.relevance]));
    expect(h['pain.menstrual_cramp']).toBe(1);
    expect(h['pain.joint'] || 0).toBe(0);
    expect(h['pain.sexual'] || 0).toBe(0);
  });

  it('broad marketing words count almost nothing', () => {
    const broad = { id: 't-broad', name: 'Hormone Balance Gummies', category: 'supplement', tags: ['hormonal'], healthFunctions: ['hormone-balance'], summary: "Women's wellness detox for hormone balance, metabolism and cycle support. Reproductive support for feminine wellness." };
    const pp = buildProductProfile(broad);
    Object.values(pp.health_need_relevance).forEach((e) => expect(e.score).toBeLessThanOrEqual(0.1));
    const up = user({ supportSelections: ['Hormone-related symptoms', 'Metabolism or weight support', 'Irregular periods', 'Acne'] });
    scoreProduct(broad, up).needs.forEach((n) => expect(n.score).toBeLessThan(50));
  });

  it('explanations state what matched, never why she has a symptom', () => {
    const up = user({ age: '30', lifeStageSelections: ['I am in perimenopause'], diagnosisSelections: ['PCOS'], supportSelections: ['Night sweats', 'Acne', 'Cramps or period pain', 'Hot flashes', 'Vaginal dryness', 'Fatigue or low energy', 'Brain fog'] });
    for (const p of ALL_PRODUCTS) {
      for (const r of scoreProduct(p, up).needs) r.explanations.forEach((e) => expect(e, `${p.id}: ${e}`).not.toMatch(DIAGNOSIS_WORDS));
    }
    expect(healthSentence('direct', 'vasomotor.night_sweats', 'selected', null)).toBe('Matches the night sweats you selected');
    expect(healthSentence('strong', 'vasomotor.night_sweats', 'selected', { type: 'life_stage', id: 'perimenopause', phrase: 'perimenopause' })).toBe('Matches your night sweats and the perimenopause stage you shared');
  });
});

describe('C. missing data never equals a bad match', () => {
  const cramps = { supportSelections: ['Cramps or period pain'] };

  it('skipping budget, brands, formats, trust and history does not lower the match', () => {
    const sparse = user(cramps);
    const full = user({ ...cramps, priceRange: ['Price is not a major factor for me'], brandOpenness: 'No preference', preferredFormats: ['No preference'], allergyStatus: 'No', takesCurrent: 'No', diagnosisSelections: ['None that I know of'], lifeStageSelections: ['I get periods regularly'] });
    for (const id of ['p-thermacare', 'p-portable-heating']) {
      const a = scoreProductForNeed(P(id), sparse, 'pain.menstrual_cramp');
      const b = scoreProductForNeed(P(id), full, 'pain.menstrual_cramp');
      expect(a.score, id).toBeGreaterThanOrEqual(90);
      expect(b.score, id).toBe(a.score);
      expect(a.confidence, id).toBeLessThan(b.confidence);
    }
  });

  it('dynamic denominator: only known dimensions count', () => {
    const r = scoreProductForNeed(P('p-thermacare'), user({ ...cramps, preferredFormats: ['Patches'] }), 'pain.menstrual_cramp');
    expect(r.dimensions.known).toEqual(['format']);
    expect(r.dimensions.unknown).toEqual(expect.arrayContaining(['price', 'brand', 'values', 'evidence']));
    expect(r.score).toBeGreaterThanOrEqual(90);
    expect(r.confidenceLevel).not.toBe('high');
  });

  it('profile completeness never multiplies the match', () => {
    const a = user(cramps);
    const b = user({ ...cramps, age: '30', zipcode: '10026', fsaHsaAnswer: 'No', safetyConcern: 'No', diagnosisSelections: ['None that I know of'] });
    expect(b.completeness).toBeGreaterThan(a.completeness);
    expect(scoreProductForNeed(P('p-thermacare'), b, 'pain.menstrual_cramp').score).toBe(scoreProductForNeed(P('p-thermacare'), a, 'pain.menstrual_cramp').score);
  });

  it('answer states: explicit no, not sure, prefer not to say and skipped are different', () => {
    const skipped = user(cramps);
    const no = user({ ...cramps, allergyStatus: 'No', takesCurrent: 'No' });
    const unsure = user({ ...cramps, allergyStatus: "I'm not sure" });
    const prefer = user({ ...cramps, diagnosisSelections: ['Prefer not to say'] });
    expect(skipped.answers.allergies).toBe('skipped');
    expect(no.answers.allergies).toBe('explicit_no');
    expect(unsure.answers.allergies).toBe('not_sure');
    expect(prefer.answers.conditions).toBe('prefer_not');
    expect(no.answers.medications).toBe('explicit_no');
    const s = (up) => scoreProductForNeed(P('p-thermacare'), up, 'pain.menstrual_cramp');
    expect(new Set([s(skipped).score, s(no).score, s(unsure).score, s(prefer).score]).size).toBe(1);
    expect(s(no).confidence).toBeGreaterThan(s(skipped).confidence);
    expect(s(unsure).confidenceReasons.map((c) => c.code)).toContain('allergy_status_unsure');
  });

  it('not selected is not denied: other symptoms never count against a product', () => {
    const one = user({ supportSelections: ['Vaginal dryness'] });
    const many = user({ supportSelections: ['Vaginal dryness', 'Acne', 'Anxiety', 'Hot flashes'] });
    expect(scoreProductForNeed(P('p-kindra-lotion'), many, 'vaginal.dryness').score).toBe(scoreProductForNeed(P('p-kindra-lotion'), one, 'vaginal.dryness').score);
  });

  it('adhesive allergy excludes an adhesive patch; the next product takes its place', () => {
    const before = user({ ...cramps, preferredFormats: ['Patches', 'Devices or wearables'] });
    const after = user({ ...cramps, preferredFormats: ['Patches', 'Devices or wearables'], allergyStatus: 'Yes', allergyItems: ['Adhesives'] });
    expect(buildProductProfile(P('p-thermacare')).safety.adhesives).toBe('yes');
    expect(scoreProductForNeed(P('p-thermacare'), before, 'pain.menstrual_cramp').score).toBeGreaterThanOrEqual(90);
    const r = scoreProductForNeed(P('p-thermacare'), after, 'pain.menstrual_cramp');
    expect(r.safety.eligible).toBe(false);
    expect(r.safety.reasons[0].code).toBe('allergen_conflict');
    const ids = shelfIds(after, 'pain.menstrual_cramp');
    expect(ids).not.toContain('p-thermacare');
    expect(ids.length).toBeGreaterThan(0);
  });

  it('pregnancy unknown + pregnancy-caution supplement -> restricted / limited, not a low percent', () => {
    const supp = P('p-winx-uti-daily-defense');
    expect(['caution', 'contraindicated']).toContain(buildProductProfile(supp).pregnancy.overall);
    const unknown = user({ supportSelections: ['Recurrent UTI-like symptoms'], takesCurrent: 'No' });
    const known = user({ supportSelections: ['Recurrent UTI-like symptoms'], takesCurrent: 'No', lifeStageSelections: ['I get periods regularly'] });
    const a = scoreProductForNeed(supp, unknown, 'urinary.recurrent_uti');
    const b = scoreProductForNeed(supp, known, 'urinary.recurrent_uti');
    expect(a.eligibility).toBe('restricted');
    expect(a.safety.status).toBe('insufficient_information');
    expect(a.safety.missingFields).toContain('pregnancy_status');
    expect(a.confidenceLevel).toBe('limited');
    expect(a.score).toBe(b.score);
    expect(b.eligibility).toBe('eligible');
    // Held back from shelves and counted, never shown as a low match.
    const s = shelf(unknown, 'urinary.recurrent_uti');
    expect(s.picks.map((p) => p.productId)).not.toContain('p-winx-uti-daily-defense');
    expect(s.restrictedCount).toBeGreaterThan(0);
    expect(s.missingSafetyText.join(' ')).toMatch(/pregnant/);
  });

  it('a supplement with known interactions needs the medicines answer; "No" is real information', () => {
    const mag = P('p-magnesium-glycinate');
    const skipped = scoreProductForNeed(mag, user(cramps), 'pain.menstrual_cramp');
    expect(skipped.eligibility).toBe('restricted');
    expect(skipped.safety.missingFields).toEqual(['medications']);
    const none = scoreProductForNeed(mag, user({ ...cramps, takesCurrent: 'No' }), 'pain.menstrual_cramp');
    expect(none.eligibility).toBe('eligible');
    expect(none.score).toBe(skipped.score);
  });

  it('a period pad needs none of those answers', () => {
    const r = scoreProductForNeed(P('p-rael-organic-pad'), user({ supportSelections: ['Period product support'] }), 'period.product_support');
    expect(r.eligibility).toBe('eligible');
    expect(r.score).toBeGreaterThanOrEqual(85);
  });
});

describe('B. signals, recency, contradictions, behavior', () => {
  it('every signal carries explicit vs inferred and a confidence', () => {
    const up = user({ supportSelections: ['Acne', 'hair falling out like crazy'], diagnosisSelections: ['PCOS'], lifeStageSelections: ['I get periods regularly'] });
    expect(up.signals.length).toBeGreaterThan(3);
    up.signals.forEach((s) => { expect(typeof s.explicit).toBe('boolean'); expect(s.confidence).toBeGreaterThan(0); });
    expect(canonicalize('my hormones are insane', { kinds: ['need'] })).toMatchObject({ canonical_id: 'hormonal.general', specificity: 'low', contextual_only: true });
    expect(user({ supportSelections: ['my hormones are insane'] }).healthIntent.needs).toEqual([]);
  });

  it('recency: an old pregnancy answer lowers confidence; postpartum timing advances with time', () => {
    const now = Date.parse('2026-10-13');
    const fresh = user({ lifeStageSelections: ['I am pregnant'], supportSelections: ['Prenatal or pregnancy support'], personalizationCompletedAt: '2026-10-01' }, { now });
    const old = user({ lifeStageSelections: ['I am pregnant'], supportSelections: ['Prenatal or pregnancy support'], personalizationCompletedAt: '2025-09-01' }, { now });
    expect(old.recency.stale.pregnancy).toBe(true);
    expect(fresh.recency.stale.pregnancy).toBe(false);
    const prenatal = ALL_PRODUCTS.find((p) => /prenatal/i.test(p.name) && buildProductProfile(p).pregnancy.overall !== 'not_applicable');
    const a = scoreProductForNeed(prenatal, fresh, 'pregnancy.prenatal');
    const b = scoreProductForNeed(prenatal, old, 'pregnancy.prenatal');
    expect(b.confidence).toBeLessThan(a.confidence);
    const pp = user({ lifeStageSelections: ['I am postpartum'], postpartumTiming: 'Less than 6 weeks ago', personalizationCompletedAt: '2026-06-01' }, { now });
    expect(pp.physiology.postpartumTiming).toBe('3_6m');
  });

  it('contradictions are detected and lower confidence instead of picking one at random', () => {
    const up = user({ supportSelections: ['Period product support'], lifeStageSelections: ['I am post-menopause'], allergyStatus: 'No', anythingElse: 'I am allergic to latex' });
    const codes = up.contradictions.map((c) => c.code);
    expect(codes).toEqual(expect.arrayContaining(['period_need_vs_stage', 'allergy_no_vs_free_text']));
    expect(up.safety.allergies.map((a) => a.id)).toContain('latex'); // safety first
    const r = scoreProductForNeed(P('p-rael-organic-pad'), up, 'period.product_support');
    expect(r.confidenceReasons.map((c) => c.code)).toContain('answer_contradiction');
    const fmt = user({ preferredFormats: ['Gummies'], anythingElse: 'I hate gummies' });
    expect(fmt.shopping.formats.disliked).toEqual([]);
    expect(fmt.contradictions.map((c) => c.code)).toContain('format_preferred_vs_free_text');
  });

  it('behavior: saves beat clicks, old clicks fade, negatives count, health context never changes', () => {
    const now = Date.parse('2026-10-13');
    const base = user({ supportSelections: ['Cramps or period pain'] }, { now });
    const saved = user({ supportSelections: ['Cramps or period pain'] }, { now, behavior: { saved: { 'p-thermacare': '2026-10-10' } } });
    const clicked = user({ supportSelections: ['Cramps or period pain'] }, { now, behavior: { clicked: { 'p-thermacare': '2026-10-10' } } });
    const oldClick = user({ supportSelections: ['Cramps or period pain'] }, { now, behavior: { clicked: { 'p-thermacare': '2026-02-01' } } });
    const returned = user({ supportSelections: ['Cramps or period pain'] }, { now, behavior: { returned: { 'p-thermacare': '2026-09-01' } } });
    const pts = (up) => scoreProductForNeed(P('p-thermacare'), up, 'pain.menstrual_cramp').points.behavior;
    expect(pts(saved)).toBeGreaterThan(pts(clicked));
    expect(pts(clicked)).toBeGreaterThan(pts(oldClick));
    expect(pts(oldClick)).toBeLessThan(0.02);
    expect(pts(returned)).toBeLessThan(0);
    expect(pts(base)).toBe(0);
    const browsedMenopause = user({ supportSelections: ['Night sweats'] }, { behavior: { saved: ['p-womaness-me', 'd-midi-health'], clicked: ['p-remifemin'] } });
    expect(browsedMenopause.contexts).toEqual({});
    expect(browsedMenopause.physiology.lifeStages).toEqual([]);
    expect(scoreProductForNeed(P('p-womaness-me'), browsedMenopause, 'vasomotor.night_sweats').score).toBe(0);
  });

  it('stop reasons move the right dimension: expensive -> price, format -> format, did not help -> health', () => {
    const hist = (reason) => user({ supportSelections: ['Cramps or period pain'], priceRange: ['Under $25'], productHistory: [{ name: 'Comfytemp Portable Heating Pad', current: 'No', worked: '', reaction: 'No', stopReasons: [reason] }] });
    const target = P('p-sootheher-elaris-pod');
    const base = scoreProductForNeed(target, user({ supportSelections: ['Cramps or period pain'], priceRange: ['Under $25'] }), 'pain.menstrual_cramp');
    const expensive = scoreProductForNeed(target, hist('It was too expensive'), 'pain.menstrual_cramp');
    expect(expensive.dimensions.values.price).toBeLessThanOrEqual(base.dimensions.values.price);
    expect(expensive.components.health).toBe(base.components.health);
    const format = scoreProductForNeed(target, hist('I did not like the format'), 'pain.menstrual_cramp');
    expect(format.dimensions.known).toContain('format');
    expect(format.components.health).toBe(base.components.health);
  });

  it('facet similarity separates format, ingredients, price and brand', () => {
    const a = buildProductProfile(P('p-rael-organic-pad'));
    const b = buildProductProfile(P('p-rael-overnight'));
    const c = buildProductProfile(P('p-thermacare'));
    const ab = productSimilarity(a, b);
    expect(ab.brand).toBe(1);
    expect(ab.format).toBe(1);
    expect(productSimilarity(a, c).format).toBe(0);
    expect(productSimilarity(a, c).use_case).toBe(0);
  });

  it('effort and true cost over time come only from catalog text', () => {
    const cup = buildProductProfile(P('p-saalt-cup'));
    expect(cup.pricing.reusable).toBe(true);
    expect(cup.pricing.per_month).toBeLessThan(1);
    expect(buildProductProfile(P('p-thermacare')).pricing.per_month).toBe(null);
    expect(buildProductProfile(P('p-magnesium-glycinate')).effort.level).toBe('daily');
    expect(buildProductProfile(P('d-midi-health')).effort.level).toBe('appointment');
    // A $29 reusable cup is not penalized like a one-off $29 item for an "under $25" budget.
    const up = user({ supportSelections: ['Period product support'], priceRange: ['Under $25'] });
    const r = scoreProductForNeed(P('p-saalt-cup'), up, 'period.product_support');
    expect(r.dimensions.values.price).toBeGreaterThanOrEqual(0.85);
    expect(r.explanations).toContain('Costs less over time than the upfront price');
  });

  it('claim-level evidence separates product-specific from ingredient-only and other claims', () => {
    const pp = buildProductProfile(P('p-saalt-cup'));
    expect(pp.claim_evidence['period.product_support']).toBeTruthy();
    const up = user({ supportSelections: ['Period product support'] });
    const ev = scoreProductForNeed(P('p-saalt-cup'), up, 'period.product_support').evidence;
    expect(['product_specific', 'guideline', 'ingredient_only']).toContain(ev.level);
    expect(scoreProductForNeed(P('p-saalt-cup'), up, 'period.heavy').evidence.forThisNeed).toBe(null);
  });

  it('recalled or removed listings are suppressed regardless of personalization', () => {
    const recalled = { ...P('p-thermacare'), id: 't-recalled', status: 'recalled' };
    const up = user({ supportSelections: ['Cramps or period pain'], trustedBrands: ['ThermaCare'] });
    const s = evaluateSafety(recalled, up);
    expect(s.eligible).toBe(false);
    expect(s.reasons[0].code).toBe('status_recalled');
    expect(buildProductProfile(P('p-thermacare')).status.state).toBe('active');
  });

  it('category-specific trust: clinical-first matters more for supplements than for pads', () => {
    const clinical = user({ supportSelections: ['Cramps or period pain', 'Period product support'], trustRanking: ['Clinical or scientific evidence', 'Reviews and experiences from other women', 'Brand reputation or expert recommendations'], trustRankingTouched: true, takesCurrent: 'No' });
    const supp = scoreProductForNeed(P('p-magnesium-glycinate'), clinical, 'pain.menstrual_cramp');
    expect(supp.dimensions.known).toContain('evidence');
  });

  it('conditional preferences: a preferred format cannot lift a weakly relevant product over a direct one', () => {
    const up = user({ supportSelections: ['Cramps or period pain'], preferredFormats: ['Pills or capsules'], takesCurrent: 'No' });
    const pill = scoreProductForNeed(P('p-magnesium-glycinate'), up, 'pain.menstrual_cramp');
    const heat = scoreProductForNeed(P('p-thermacare'), up, 'pain.menstrual_cramp');
    expect(pill.dimensions.values.format).toBe(1);
    expect(heat.dimensions.values.format).toBeLessThan(1);
    expect(heat.score).toBeGreaterThan(pill.score);
  });
});

describe('B. shelves: diversity, roles, explainability and "do we have a good recommendation?"', () => {
  it('returns zero products rather than filler when nothing is good enough', () => {
    const s = shelf(user({ supportSelections: ['Joint aches'] }), 'pain.joint');
    expect(s.picks).toHaveLength(0);
    expect(s.quality).toBe('none');
    // Pain relievers can fit joint aches now, but wait for her medicines answer first.
    expect(s.qualityNote).toMatch(/not showing filler|safety details/);
  });

  it('only explainable products (at least a secondary relationship) can rank as matches', () => {
    const up = user({ supportSelections: ['Pelvic pain'] });
    for (const p of ALL_PRODUCTS) {
      const r = scoreProductForNeed(p, up, 'pain.pelvic');
      if (!r.explainable) expect(r.score, p.id).toBeLessThan(50);
    }
  });

  it('diversity: a shelf does not stack one brand when an equally good alternative exists', () => {
    const up = user({ supportSelections: ['Period product support'] });
    const s = shelf(up, 'period.product_support', { picksPerNeed: 4 });
    const brands = s.picks.map((p) => buildProductProfile(P(p.productId)).brand.key);
    expect(new Set(brands).size).toBeGreaterThan(1);
    // The pure helper keeps the top product first.
    const profiles = new Map(ALL_PRODUCTS.map((p) => [p.id, buildProductProfile(p)]));
    const rows = ['p-rael-organic-pad', 'p-rael-overnight', 'p-cora-organic-pads'].map((id, i) => ({ productId: id, score: 90 - i, components: {}, confidence: 0.6 }));
    const out = diversify(rows, profiles, up, 3).map((r) => r.productId);
    expect(out[0]).toBe('p-rael-organic-pad');
    expect(out[1]).toBe('p-cora-organic-pads');
  });

  it('best-for roles are only assigned when true', () => {
    const up = user({ supportSelections: ['Cramps or period pain'], preferredFormats: ['Patches'], takesCurrent: 'No' });
    const s = shelf(up, 'pain.menstrual_cramp');
    expect(s.roles.best_overall).toBe(s.picks[0].productId);
    expect(s.roles.preferred_format).toBe('p-thermacare');
    const profiles = new Map(ALL_PRODUCTS.map((p) => [p.id, buildProductProfile(p)]));
    expect(assignRoles([], profiles, up)).toEqual({});
  });

  it('pairwise: says why one pick is above the next', () => {
    const up = user({ supportSelections: ['Cramps or period pain'], preferredFormats: ['Patches'] });
    const a = scoreProductForNeed(P('p-thermacare'), up, 'pain.menstrual_cramp');
    const b = scoreProductForNeed(P('p-sootheher-elaris-pod'), up, 'pain.menstrual_cramp');
    expect(compareResults(a, b).map((x) => x.dimension)).toContain('format');
  });

  it('cold start: with almost no answers products still rank by relevance, with limited confidence', () => {
    const up = user({ supportSelections: ['Vaginal dryness'] });
    const s = shelf(up, 'vaginal.dryness');
    expect(s.picks.length).toBeGreaterThan(0);
    expect(s.picks[0].score).toBeGreaterThanOrEqual(80);
    expect(up.completeness).toBeLessThan(0.2);
  });

  it('night sweats shelf care links are not menopause links unless she shared that stage', () => {
    const calls = [];
    const fake = (q) => { calls.push(q.frustrations); return { telehealthLinks: [], clinicLinks: [] }; };
    buildEcosystem(user({ supportSelections: ['Night sweats'], safetyConcern: 'Not sure' }), ALL_PRODUCTS, { getCareResourceBundle: fake });
    calls.forEach((f) => expect(f).not.toContain('Menopause symptoms'));
  });
});
