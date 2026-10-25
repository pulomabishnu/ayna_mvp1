import { describe, expect, it } from 'vitest';
import { EMPTY } from '../mobile/data/intakeModel.js';
import { buildUserProfile } from '../matching/userProfile.js';
import { createTry, recordOutcome } from './outcomes.js';
import {
  decide, activeNeeds, needsWindow, patternBeforePregnancy, markShown, markInteracted, dismiss, addDays, daysBetween,
  MAX_ITEMS, NOTHING_TODAY, OUTPUTS, CLINICAL_REVIEW_REQUIRED, RANKING_HEURISTICS, TIERS,
} from './decisionEngine.js';
import {
  INTERVENTION_CLASSES, CLASS_IDS, evaluateClassSafety, productMatchesClass, productsForClass, productSafety, safetyContextFrom,
  AYNA_POLICY_MIN_AGE_FOR_MEDICINE_INFO,
} from './interventions.js';

const TODAY = '2026-10-24';
const profile = (over = {}) => buildUserProfile({ ...EMPTY, ...over });
const CLEAR = {
  age: '27', lifeStageSelections: ['I get periods regularly'], lifeStage: 'I get periods regularly',
  supportSelections: ['Cramps or period pain'], diagnosisSelections: ['None that I know of'],
  allergyStatus: 'No', takesCurrent: 'No', safetyConcern: 'No',
};
const PREGNANT = (trimester = 'Second trimester') => ({ ...CLEAR, lifeStageSelections: ['I am pregnant'], lifeStage: 'I am pregnant', pregnancyTrimester: trimester, supportSelections: [] });
const log = (day, over = {}) => ({ day, pain: null, flow: null, pms: null, sleep: null, mood: null, skin: null, ...over });
const fullLog = (day, over = {}) => log(day, { pain: 0, flow: 'none', pms: 0, sleep: 2, mood: 2, skin: 2, ...over });
const sleepPattern = { id: 'sleep:premenstrual', metric: 'sleep', window: 'premenstrual', text: 'Sleep was rougher in the 3 days before your period than the rest of the cycle, in 3 of the 4 cycles you logged.', basis: { cycles: 3, of: 4 }, direction: 'harder' };
const HEAT = [
  { id: 'p-thermacare', category: 'cramp-relief', name: 'ThermaCare Menstrual Pain Therapy HeatWraps, 4 Count' },
  { id: 'p-viboos-heating-pad', category: 'cramp-relief', name: 'VIBOOS Electric Heating Pad' },
  { id: 'p-sootheher-elaris-pod', category: 'cramp-relief', name: "SootheHer's Elaris Pod" },
  { id: 'p-advil-ibuprofen-200', category: 'medication', name: 'Advil Ibuprofen 200 mg Tablets' },
];
const ids = (d) => d.items.map((i) => i.id);
// 30 quiet days of logs before today (enough history for "new" and "worse than usual").
const history = (days = 30, over = {}) => Array.from({ length: days }, (_, i) => fullLog(addDays(TODAY, -(i + 1)), over));

describe('interventions', () => {
  it('every class cites only .gov sources (founder rule, Oct 24); tracking asks for three cycles', () => {
    for (const c of Object.values(INTERVENTION_CLASSES)) {
      for (const src of [...c.sources, ...(c.sourcesPregnancy || [])]) expect(new URL(src.url).hostname).toMatch(/\.gov$/);
    }
    expect(INTERVENTION_CLASSES.tracking.summary).toMatch(/three cycles/);
    expect(INTERVENTION_CLASSES.tracking.followUpDays).toBe(84);
  });
  it('every class has a label, needs, sources, a follow-up horizon and gates; medicine classes name their drug class', () => {
    for (const id of CLASS_IDS) {
      const c = INTERVENTION_CLASSES[id];
      expect(c.id).toBe(id);
      expect(c.label).toBeTruthy();
      expect(c.sources.length).toBeGreaterThan(0);
      expect(c.followUpDays).toBeGreaterThan(0);
      expect(`${c.label} ${c.summary} ${c.caution || ''} ${c.cautionPregnancy || ''}`).not.toMatch(/—/);
    }
    expect(INTERVENTION_CLASSES.nsaid_pain_relief.drugClass).toBe('nsaid');
    expect(INTERVENTION_CLASSES.acetaminophen_pain_relief.drugClass).toBe('acetaminophen');
    expect(INTERVENTION_CLASSES.otc_pain_relief).toBeUndefined();
  });

  it('only heat carries products; medicines are information only', () => {
    expect(productsForClass(HEAT, 'heat').map((p) => p.id)).toEqual(['p-thermacare', 'p-viboos-heating-pad']);
    expect(productsForClass(HEAT, 'nsaid_pain_relief')).toEqual([]);
    expect(productMatchesClass(HEAT[3], 'nsaid_pain_relief')).toBe(false);
  });

  it('unknown facts are "ask", never safe', () => {
    for (const id of ['nsaid_pain_relief', 'acetaminophen_pain_relief']) {
      const r = evaluateClassSafety(id, null);
      expect(r.verdict).toBe('ask');
      expect(r.asks.map((a) => a.code)).toEqual(expect.arrayContaining(['pregnancy_unknown', 'medications_unknown', 'conditions_unknown', 'allergies_unknown']));
    }
  });

  it('a fully answered low-risk profile passes both', () => {
    expect(evaluateClassSafety('nsaid_pain_relief', profile(CLEAR)).verdict).toBe('pass');
    expect(evaluateClassSafety('acetaminophen_pain_relief', profile(CLEAR)).verdict).toBe('pass');
  });

  describe('NSAID tree: do not use vs ask a doctor first', () => {
    it.each([
      ['do_not_use_allergy', { allergyStatus: 'Yes', allergyItems: ['NSAIDs such as ibuprofen'] }],
      ['do_not_use_allergy', { allergyStatus: 'Yes', allergyItems: ['Acetaminophen'] }],
      ['pregnancy_20_weeks', PREGNANT('Second trimester')],
      ['pregnancy_20_weeks', PREGNANT('Not sure')],
    ])('block: %s', (code, over) => {
      const r = evaluateClassSafety('nsaid_pain_relief', profile({ ...CLEAR, ...over }));
      expect(r.verdict).toBe('block');
      expect(r.blocks.map((b) => b.code)).toContain(code);
    });
    it('the 20-week block cites the FDA', () => {
      const r = evaluateClassSafety('nsaid_pain_relief', profile(PREGNANT('Third trimester')));
      expect(r.blocks.find((b) => b.code === 'pregnancy_20_weeks').source.url).toMatch(/fda\.gov/);
    });
    it.each([
      ['ask_doctor_condition', { diagnosisSelections: ['Stomach ulcer or stomach bleeding'] }],
      ['ask_doctor_condition', { diagnosisSelections: ['Kidney disease'] }],
      ['ask_doctor_condition', { diagnosisSelections: ['High blood pressure'] }],
      ['ask_doctor_condition', { diagnosisSelections: ['Asthma'] }],
      ['ask_doctor_medicine', { takesCurrent: 'Yes', currentMedicationItems: ['warfarin'] }],
      ['ask_doctor_medicine', { takesCurrent: 'Yes', currentMedicationItems: ['Eliquis'] }],
      ['ask_doctor_medicine', { takesCurrent: 'Yes', currentMedicationItems: ['prednisone'] }],
      ['ask_doctor_medicine', { takesCurrent: 'Yes', currentMedicationItems: ['furosemide'] }],
      ['ask_doctor_medicine', { takesCurrent: 'Yes', currentMedicationItems: ['Naproxen'] }],
      ['pregnancy_early', PREGNANT('First trimester')],
    ])('consult: %s', (code, over) => {
      const r = evaluateClassSafety('nsaid_pain_relief', profile({ ...CLEAR, ...over }));
      expect(r.verdict).toBe('consult');
      expect(r.consults.map((b) => b.code)).toContain(code);
    });
  });

  describe('acetaminophen tree', () => {
    it.each([
      ['consult', 'ask_doctor_condition', { diagnosisSelections: ['Liver disease'] }],
      ['consult', 'ask_doctor_medicine', { takesCurrent: 'Yes', currentMedicationItems: ['warfarin'] }],
      ['consult', 'pregnancy', PREGNANT('Second trimester')],
      ['block', 'do_not_use_allergy', { allergyStatus: 'Yes', allergyItems: ['Acetaminophen'] }],
      ['block', 'do_not_use_duplicate', { takesCurrent: 'Yes', currentMedicationItems: ['Acetaminophen'] }],
    ])('%s: %s', (verdict, code, over) => {
      const r = evaluateClassSafety('acetaminophen_pain_relief', profile({ ...CLEAR, ...over }));
      expect(r.verdict).toBe(verdict);
      expect([...r.blocks, ...r.consults].map((b) => b.code)).toContain(code);
    });
    it('kidney disease does not touch acetaminophen (different tree)', () => {
      expect(evaluateClassSafety('acetaminophen_pain_relief', profile({ ...CLEAR, diagnosisSelections: ['Kidney disease'] })).verdict).toBe('pass');
    });
  });

  it('under 18 is labelled ayna safety policy, not an FDA cutoff', () => {
    expect(AYNA_POLICY_MIN_AGE_FOR_MEDICINE_INFO).toBe(18);
    for (const id of ['nsaid_pain_relief', 'acetaminophen_pain_relief']) {
      const r = evaluateClassSafety(id, profile({ ...CLEAR, age: '16' }));
      const b = r.blocks.find((x) => x.code === 'ayna_policy_under_18');
      expect(b.reason).toMatch(/^ayna safety policy/);
      expect(b.reason).not.toMatch(/FDA/);
    }
    expect(evaluateClassSafety('heat', profile({ ...CLEAR, age: '16' })).verdict).toBe('pass');
  });

  it('heat products in pregnancy are held back by the product label, not "heat unsafe"', () => {
    const ctx = safetyContextFrom(profile(PREGNANT()));
    expect(productSafety(HEAT[0], ctx)).toMatchObject({ ok: false, code: 'product_label_pregnancy' });
    expect(productSafety(HEAT[0], ctx).source.label).toMatch(/ThermaCare/);
    expect(productSafety(HEAT[1], ctx)).toMatchObject({ ok: false, code: 'product_label_not_checked' });
    expect(productSafety(HEAT[0], safetyContextFrom(profile(CLEAR)))).toMatchObject({ ok: true });
    expect(productSafety(HEAT[0], safetyContextFrom(profile({ ...CLEAR, diagnosisSelections: ['Diabetes'] })))).toMatchObject({ ok: false, code: 'product_label_condition' });
  });

  it('ThermaCare label: typed poor circulation or rheumatoid arthritis holds it back; other autoimmune conditions do not', () => {
    const typed = (t) => safetyContextFrom(profile({ ...CLEAR, conditionOtherText: t }));
    expect(productSafety(HEAT[0], typed('poor circulation'))).toMatchObject({ ok: false, code: 'product_label_condition' });
    expect(productSafety(HEAT[0], typed("Raynaud's"))).toMatchObject({ ok: false, code: 'product_label_condition' });
    expect(productSafety(HEAT[0], typed('rheumatoid arthritis'))).toMatchObject({ ok: false, code: 'product_label_condition' });
    expect(typed('rheumatoid arthritis').conditionIds.has('autoimmune')).toBe(true);
    expect(productSafety(HEAT[0], typed('lupus'))).toMatchObject({ ok: true });
    expect(productSafety(HEAT[0], safetyContextFrom(profile({ ...CLEAR, diagnosisSelections: ['Heart disease'] })))).toMatchObject({ ok: false, code: 'product_label_condition' });
  });

  it('heat is fine outside pregnancy; pregnancy alone does not block movement', () => {
    expect(evaluateClassSafety('heat', profile(CLEAR)).verdict).toBe('pass');
    expect(evaluateClassSafety('movement', profile(PREGNANT()), 'pregnancy_pain').verdict).toBe('pass');
  });
});

describe('window (rule 8)', () => {
  it('cycle-aware: current cycle plus 2 previous when starts are known', () => {
    const logs = ['2026-07-30', '2026-08-28', '2026-09-26', '2026-10-24'].map((d) => log(d, { flow: 'medium' }));
    const w = needsWindow({ logs, today: TODAY });
    expect(w).toMatchObject({ basis: 'cycles', from: '2026-08-28' });
  });
  it('90-day fallback when cycle boundaries are unknown, labelled a ranking heuristic', () => {
    expect(needsWindow({ logs: [], today: TODAY })).toMatchObject({ basis: 'days', days: 90, from: addDays(TODAY, -89) });
    expect(RANKING_HEURISTICS).toMatchObject({ dismissDays: 30, noveltyWindowDays: 7, fallbackWindowDays: 90 });
  });
  it('pain from 60 days ago still counts (the old 45-day window would miss it)', () => {
    const logs = [log(addDays(TODAY, -60), { pain: 2 }), log(addDays(TODAY, -59), { pain: 2 })];
    expect(activeNeeds({ logs, today: TODAY }).period_pain).toBeTruthy();
  });
});

describe('decide: golden scenarios', () => {
  it('no data: a check-in', () => {
    const d = decide({ today: TODAY });
    expect(d.output).toBe('monitor');
    expect(d.items.map((i) => i.type)).toEqual(['check_in']);
  });

  it('today logged, nothing else: no action, zero items', () => {
    const d = decide({ today: TODAY, logs: [fullLog(TODAY)], profile: profile(CLEAR) });
    expect(d.output).toBe('no_action');
    expect(d.items).toEqual([]);
    expect(d.empty).toBe(NOTHING_TODAY);
  });

  it('3 of 4 premenstrual sleep pattern: an insight, no options or products by default', () => {
    const d = decide({ today: TODAY, logs: [fullLog(TODAY)], patterns: [sleepPattern], profile: profile(CLEAR), products: HEAT });
    expect(d.output).toBe('answer');
    expect(d.items[0]).toMatchObject({ id: 'insight:sleep:premenstrual', title: 'Sleep is rougher before your period', reason: 'Seen in 3 of your last 4 cycles.' });
    expect(d.items.some((i) => i.type === 'option' || i.type === 'products')).toBe(false);
  });

  it('a pattern under the data agent minimum (2 of 3) is not shown', () => {
    const d = decide({ today: TODAY, logs: [fullLog(TODAY)], patterns: [{ ...sleepPattern, basis: { cycles: 2, of: 3 } }] });
    expect(d.items).toEqual([]);
    expect(d.debug.removed[0].code).toBe('weak_pattern');
  });

  it('a due follow-up (real outcomes.js try) comes before wellness items', () => {
    const t = createTry({ id: 't1', kind: 'action', ref: 'heat', need: 'period_pain', startedDay: '2026-09-19', horizonDays: 28 });
    const d = decide({ today: TODAY, logs: [log(TODAY)], patterns: [sleepPattern], tries: [t], profile: profile(CLEAR) });
    expect(d.items[0]).toMatchObject({ id: 'follow_up:t1', title: 'Did heat help?' });
    expect(d.items[0].actions.map((a) => a.label)).toContain('Helpful');
  });

  it('never more than 3 non-protected items', () => {
    const tries = ['a', 'b', 'c', 'd'].map((id) => ({ id, kind: 'action', ref: 'heat', startedDay: '2026-09-01', horizonDays: 28, status: 'due' }));
    const d = decide({ today: TODAY, tries, patterns: [sleepPattern], logs: [fullLog(TODAY)], profile: profile(CLEAR), intent: { showOptions: true } });
    expect(d.items.length).toBe(MAX_ITEMS);
    expect(OUTPUTS).toContain(d.output);
  });
});

describe('rule 1: priority order and protected items', () => {
  it('order is safety > care > symptom > wellness > products', () => {
    expect(TIERS.safety).toBeGreaterThan(TIERS.care);
    expect(TIERS.care).toBeGreaterThan(TIERS.symptom);
    expect(TIERS.symptom).toBeGreaterThan(TIERS.wellness);
    expect(TIERS.wellness).toBeGreaterThan(TIERS.products);
  });

  it('more than 3 care items all show, and push out everything else', () => {
    const tries = [
      { id: 'x1', kind: 'action', ref: 'nsaid_pain_relief', status: 'recorded', outcome: 'no_change', startedDay: '2026-09-01', horizonDays: 28 },
      { id: 'x2', kind: 'action', ref: 'heat', status: 'recorded', outcome: 'side_effect', startedDay: '2026-09-01', horizonDays: 28 },
      { id: 'x3', kind: 'action', ref: 'movement', status: 'recorded', outcome: 'worse', startedDay: '2026-09-01', horizonDays: 28 },
    ];
    const d = decide({ today: TODAY, tries, logs: [fullLog(TODAY, { pain: 3 })], patterns: [sleepPattern], profile: profile({ ...CLEAR, safetyConcern: 'Yes' }) });
    const care = d.items.filter((i) => i.type === 'care');
    expect(care.length).toBeGreaterThan(3);
    expect(d.items.every((i) => i.tier === 'care' || i.tier === 'safety')).toBe(true);
    expect(d.output).toBe('escalate');
  });

  it('care ignores "not relevant" and novelty decay', () => {
    const base = { today: TODAY, logs: [...history(), fullLog(TODAY, { pain: 3 })], profile: profile(CLEAR) };
    const first = decide(base);
    expect(first.items[0].id).toBe('care:pain_today');
    const seen = markShown(markShown({}, first.items, '2026-10-22'), first.items, '2026-10-23');
    const again = decide({ ...base, seen, dismissed: dismiss({}, first.items[0], TODAY) });
    expect(again.items[0].id).toBe('care:pain_today');
    expect(again.debug.suppressed.find((s) => s.id === 'care:pain_today')).toBeUndefined();
  });

  it('options rank above products; products only after she asks', () => {
    const logs = [fullLog(TODAY, { pain: 2 }), fullLog('2026-10-23', { pain: 2 })];
    const d = decide({ today: TODAY, logs, profile: profile(CLEAR), products: HEAT, intent: { showOptions: true, need: 'period_pain' } });
    expect(d.output).toBe('show_options');
    const kinds = d.items.map((i) => i.type);
    expect(kinds.lastIndexOf('option')).toBeLessThan(kinds.indexOf('products') === -1 ? 99 : kinds.indexOf('products'));
    const all = decide({ today: TODAY, logs, profile: profile(CLEAR), products: HEAT, intent: { showOptions: true, need: 'period_pain' } }).debug.ranked;
    const prod = all.find((r) => r.type === 'products');
    expect(prod.tier).toBe('products');
    expect(decide({ today: TODAY, logs, profile: profile(CLEAR), products: HEAT }).items.some((i) => i.type === 'products')).toBe(false);
  });
});

describe('rule 2: pain worth checking today, on a single day', () => {
  it('one severe day is enough', () => {
    const d = decide({ today: TODAY, logs: [fullLog(TODAY, { pain: 3 })], profile: profile(CLEAR) });
    expect(d.items[0]).toMatchObject({ id: 'care:pain_today', level: 'prompt' });
    expect(d.items[0].basis.triggers).toContain('severe');
    expect(d.output).toBe('escalate');
  });
  it.each([
    ['sudden', { severity: 'moderate', sudden: true }],
    ['worse_than_usual', { severity: 'moderate', worseThanUsual: true }],
    ['stops_activities', { severity: 'moderate', stopsActivities: true }],
    ['self_care_not_helping', { severity: 'moderate', selfCareNotHelping: true }],
  ])('triage answer %s triggers care today', (trigger, triage) => {
    const d = decide({ today: TODAY, logs: [fullLog(TODAY, { pain: 2 })], profile: profile(CLEAR), triage: { day: TODAY, ...triage } });
    expect(d.items[0].id).toBe('care:pain_today');
    expect(d.items[0].basis.triggers).toContain(trigger);
  });
  it('new pain and worse-than-usual pain are read from her own logs', () => {
    const newPain = decide({ today: TODAY, logs: [...history(), fullLog(TODAY, { pain: 2 })], profile: profile(CLEAR) });
    expect(newPain.items[0].basis.triggers).toContain('new');
    const usualMild = history(30).map((l, i) => (i % 7 === 0 ? { ...l, pain: 1 } : l));
    const worse = decide({ today: TODAY, logs: [...usualMild, fullLog(TODAY, { pain: 2 })], profile: profile(CLEAR) });
    expect(worse.items[0].basis.triggers).toContain('worse_than_usual');
  });
  it('mild pain within her usual range: no care', () => {
    const usual = history(30).map((l, i) => (i % 5 === 0 ? { ...l, pain: 2 } : l));
    const d = decide({ today: TODAY, logs: [...usual, fullLog(TODAY, { pain: 1 })], profile: profile(CLEAR) });
    expect(d.items.some((i) => i.type === 'care')).toBe(false);
  });
  it('severe on 2+ days is an extra signal, and alone gives routine care', () => {
    const two = decide({ today: TODAY, logs: [fullLog('2026-10-20', { pain: 3 }), fullLog(TODAY, { pain: 3 })], profile: profile(CLEAR) });
    expect(two.items[0].basis.signals).toContain('severe_repeat');
    const past = decide({ today: TODAY, logs: [fullLog('2026-10-10', { pain: 3 }), fullLog('2026-10-11', { pain: 3 }), fullLog(TODAY, { pain: 0 })], profile: profile(CLEAR) });
    expect(past.items[0]).toMatchObject({ id: 'care:severe_pattern', level: 'routine' });
  });
});

describe('rule 3: immediate red-flag overrides', () => {
  const tri = (flags, over = {}) => ({ day: TODAY, flags, ...over });
  it.each([
    [['fever_pelvic_pain'], 'care:fever_pelvic_pain', 'urgent', /medlineplus/],
    [['foul_discharge'], 'care:foul_discharge', 'urgent', /medlineplus/],
    [['sudden_severe_pain'], 'care:sudden_severe_pain', 'prompt', /medlineplus/],
    [['heavy_bleeding'], 'care:heavy_bleeding', 'prompt', /cdc\.gov/],
    [['heavy_bleeding', 'dizzy_faint'], 'care:rf.ectopic_rupture', 'urgent', /medlineplus\.gov\/ency\/article\/000895/],
    [['sudden_severe_pain', 'shoulder_tip_pain'], 'care:rf.ectopic_rupture', 'urgent', /medlineplus\.gov\/ency\/article\/000895/],
    [['dizzy_faint'], 'care:dizzy_faint', 'prompt', /medlineplus/],
  ])('%j -> %s', (flags, id, level, src) => {
    const d = decide({ today: TODAY, logs: [fullLog(TODAY)], patterns: [sleepPattern], profile: profile(CLEAR), triage: tri(flags) });
    const it0 = d.items.find((i) => i.id === id);
    expect(it0).toMatchObject({ level, tier: 'safety' });
    expect(JSON.stringify(it0.basis.sources)).toMatch(src);
    expect(d.output).toBe('escalate');
    if (level === 'urgent') expect(d.items.every((i) => i.tier === 'safety' || i.tier === 'care')).toBe(true);
  });
  it('pregnancy: bleeding, fluid leaking and contractions', () => {
    const p = profile(PREGNANT());
    expect(ids(decide({ today: TODAY, profile: p, triage: tri(['bleeding']) }))).toContain('care:pregnancy_bleeding_now');
    expect(ids(decide({ today: TODAY, profile: p, triage: tri(['bleeding', 'sudden_severe_pain']) }))).toContain('care:rf.ectopic_suspected');
    expect(ids(decide({ today: TODAY, profile: p, triage: tri(['fluid_leak']) }))).toContain('care:pregnancy_labour_signs');
    expect(ids(decide({ today: TODAY, profile: p, triage: tri(['regular_contractions']) }))).toContain('care:pregnancy_labour_signs');
  });
  it('postpartum heavy bleeding maps to the existing postpartum hemorrhage red flag', () => {
    const p = profile({ ...CLEAR, lifeStageSelections: ['I am postpartum'], lifeStage: 'I am postpartum', postpartumTiming: 'Less than 6 weeks ago', breastfeedingStatus: 'No' });
    expect(decide({ today: TODAY, profile: p, triage: tri(['heavy_bleeding']) }).items[0]).toMatchObject({ id: 'care:rf.postpartum_hemorrhage', level: 'urgent' });
  });
  it('.gov checks (Oct 24): sudden or severe pain is "right away"; dizziness in pregnancy is "now"', () => {
    const d = decide({ today: TODAY, logs: [fullLog(TODAY)], profile: profile(CLEAR), triage: tri(['sudden_severe_pain']) });
    expect(d.items.find((i) => i.id === 'care:sudden_severe_pain').title).toMatch(/right away/);
    const dz = decide({ today: TODAY, profile: profile(PREGNANT()), triage: tri(['dizzy_faint']) }).items.find((i) => i.id === 'care:dizzy_faint');
    expect(dz.title).toMatch(/now$/);
    expect(JSON.stringify(dz.basis.sources)).toMatch(/cdc\.gov\/hearher/);
    const dzc = decide({ today: TODAY, profile: profile(CLEAR), triage: tri(['dizzy_faint']) }).items.find((i) => i.id === 'care:dizzy_faint');
    expect(dzc.title).toMatch(/today$/);
  });
  it('toxic shock and postpartum psychosis are "go to the ER" (FDA, MedlinePlus, NIMH), not "call today"', () => {
    for (const id of ['rf.toxic_shock', 'rf.postpartum_psychosis']) {
      expect(decide({ today: TODAY, redFlags: [id] }).items[0]).toMatchObject({ id: `care:${id}`, level: 'urgent' });
    }
  });
  it('postpartum hemorrhage follows CDC Hear Her: warning signs apply in the year after delivery, not 12 weeks', async () => {
    const flags = (await import('../data/matching/redFlags.research.json')).default;
    const pph = flags.find((f) => f.id === 'rf.postpartum_hemorrhage');
    expect(pph.condition).toMatch(/year after birth/);
    expect(pph.condition).not.toMatch(/12 weeks/);
    expect(JSON.stringify(pph.ayna_policy_signs)).not.toMatch(/12 weeks/);
    expect(pph.source_url).toMatch(/cdc\.gov\/hearher/);
  });
  it('every red flag cites a .gov page', () => {
    const d = decide({ today: TODAY, redFlags: ['rf.ectopic_rupture', 'rf.ectopic_suspected', 'rf.postpartum_hemorrhage', 'rf.preeclampsia', 'rf.toxic_shock_severe', 'rf.hyperemesis'] });
    for (const it of d.items.filter((i) => i.basis?.kind === 'red_flag')) {
      for (const src of it.basis.sources) expect(new URL(src.url).hostname).toMatch(/\.gov$/);
    }
  });
  it('reported red-flag ids still work, and are never dismissed', () => {
    const base = { today: TODAY, redFlags: ['rf.toxic_shock_severe'] };
    const d = decide(base);
    expect(d.items[0]).toMatchObject({ id: 'care:rf.toxic_shock_severe', level: 'urgent', title: 'Call 911' });
    expect(decide({ ...base, dismissed: dismiss({}, d.items[0], TODAY) }).items[0].id).toBe('care:rf.toxic_shock_severe');
  });
});

describe('rule 4: pregnancy + pain', () => {
  const p = profile(PREGNANT());
  const painLogs = [fullLog(TODAY, { pain: 1 })];

  it('never treated as cramps: triage question first, no period-pain items', () => {
    const d = decide({ today: TODAY, logs: painLogs, profile: p, intent: { showOptions: true, need: 'period_pain' } });
    expect(d.items[0]).toMatchObject({ id: 'ask:pregnancy_triage', type: 'ask', tier: 'safety' });
    expect(d.output).toBe('ask_more');
    const fields = d.items[0].actions[0].questions.map((q) => q.field);
    expect(fields).toEqual(['severity', 'flags:bleeding', 'flags:dizzy_faint', 'flags:fluid_leak', 'flags:regular_contractions', 'worsening']);
    expect(d.items.some((i) => i.need === 'period_pain')).toBe(false);
    expect(activeNeeds({ profile: p, logs: painLogs, today: TODAY })).toHaveProperty('pregnancy_pain');
  });

  it('severe, persistent or worsening -> care today; severe -> now (CDC)', () => {
    for (const triage of [{ severity: 'severe' }, { severity: 'mild', persistent: true }, { severity: 'mild', worsening: true }]) {
      const d = decide({ today: TODAY, logs: painLogs, profile: p, triage: { day: TODAY, ...triage } });
      expect(d.items[0]).toMatchObject({ id: 'care:pregnancy_pain_today', type: 'care' });
      expect(d.items[0].title).toMatch(triage.severity === 'severe' ? /now$/ : /today$/);
    }
  });

  it('mild, no red flags -> gentle movement may show, with the stop-if-worse caution; OTC and heat removed with reasons', () => {
    const d = decide({ today: TODAY, logs: painLogs, profile: p, products: HEAT, triage: { day: TODAY, severity: 'mild' }, intent: { showOptions: true } });
    expect(d.output).toBe('show_options');
    const move = d.items.find((i) => i.classId === 'movement');
    expect(move.body).toMatch(/Stop if it makes the pain worse/);
    expect(JSON.stringify(move.basis.sources)).toMatch(/womenshealth\.gov/);
    const removed = Object.fromEntries(d.debug.removedBySafety.map((r) => [r.classId, r.reasons.map((x) => x.code)]));
    expect(removed.nsaid_pain_relief).toEqual(expect.arrayContaining(['pregnancy_20_weeks', 'pregnancy_pain_clinician']));
    expect(removed.acetaminophen_pain_relief).toContain('pregnancy_pain_clinician');
    expect(removed.heat).toContain('pregnancy_heat_not_reviewed');
    expect(d.items.some((i) => i.type === 'products')).toBe(false);
  });

  it('moderate -> routine care plus gentle options', () => {
    const d = decide({ today: TODAY, logs: painLogs, profile: p, triage: { day: TODAY, severity: 'moderate' }, intent: { showOptions: true } });
    expect(d.items[0].id).toBe('care:pregnancy_pain_mention');
    expect(d.items.some((i) => i.classId === 'movement')).toBe(true);
  });

  it('logged bleeding in pregnancy is always care', () => {
    expect(ids(decide({ today: TODAY, logs: [fullLog(TODAY, { flow: 'spotting' })], profile: p }))).toContain('care:pregnancy_bleeding');
  });
});

describe('rule 5: heat products and pregnancy', () => {
  it('outside pregnancy heat products show after she asks; in pregnancy they are removed with a product-label reason', () => {
    const logs = [fullLog(TODAY, { pain: 2 }), fullLog('2026-10-23', { pain: 2 })];
    const ok = decide({ today: TODAY, logs, profile: profile(CLEAR), products: HEAT, intent: { showOptions: true, need: 'period_pain' } });
    expect(ok.debug.ranked.some((r) => r.id === 'products:heat:period_pain')).toBe(true);
    const ctx = safetyContextFrom(profile(PREGNANT()));
    const removed = [];
    expect(productsForClass(HEAT, 'heat', { ctx, removed })).toEqual([]);
    expect(removed.find((r) => r.productId === 'p-thermacare').reasons[0].code).toBe('product_label_pregnancy');
  });
});

describe('rule 6: each medicine output names its drug class', () => {
  it('NSAID and acetaminophen show as separate options with their class', () => {
    const logs = [fullLog(TODAY, { pain: 2 }), fullLog('2026-10-23', { pain: 2 })];
    const d = decide({ today: TODAY, logs, profile: profile({ ...CLEAR, diagnosisSelections: ['Kidney disease'] }), intent: { showOptions: true, need: 'period_pain' } });
    const ranked = d.debug.ranked.map((r) => r.id);
    expect(ranked).toEqual(expect.arrayContaining(['option:nsaid_pain_relief:period_pain', 'option:acetaminophen_pain_relief:period_pain']));
    const all = decide({ today: TODAY, logs, profile: profile({ ...CLEAR, diagnosisSelections: ['Kidney disease'] }), intent: { showOptions: true, need: 'period_pain' }, dismissed: dismiss(dismiss({}, 'option:heat:period_pain', TODAY), 'option:movement:period_pain', TODAY) });
    const nsaid = all.items.find((i) => i.classId === 'nsaid_pain_relief');
    expect(nsaid.drugClass).toBe('nsaid');
    expect(nsaid.title).toMatch(/NSAID/);
    expect(nsaid.body).toMatch(/^Ask a doctor or pharmacist before using this/);
    expect(nsaid.actions.some((a) => a.id === 'try_this')).toBe(false);
    expect(nsaid.basis.consult[0].code).toBe('ask_doctor_condition');
    expect(nsaid.productIds).toBeUndefined();
  });
  it('with unknown safety facts, asks the one question first and holds both medicines back', () => {
    const d = decide({ today: TODAY, logs: [fullLog(TODAY, { pain: 2 }), fullLog('2026-10-23', { pain: 2 })], intent: { showOptions: true, need: 'period_pain' } });
    expect(d.items.find((i) => i.type === 'ask')).toMatchObject({ id: 'ask:pregnancy', title: 'Could you be pregnant?' });
    expect(d.items.some((i) => i.drugClass)).toBe(false);
  });
});

describe('rule 9 and copy', () => {
  it('exports the clinical review list', () => {
    expect(CLINICAL_REVIEW_REQUIRED.length).toBeGreaterThan(5);
    expect(CLINICAL_REVIEW_REQUIRED.map((r) => r.id)).toEqual(expect.arrayContaining(['care:pain_today', 'red_flags', 'ask:pregnancy_triage', 'ayna_policy_under_18']));
  });
  it('no em dashes or percent match in anything a user sees', () => {
    const states = [
      { today: TODAY },
      { today: TODAY, patterns: [sleepPattern] },
      { today: TODAY, triage: { day: TODAY, flags: ['fever_pelvic_pain', 'heavy_bleeding', 'dizzy_faint'] } },
      { today: TODAY, logs: [fullLog(TODAY, { pain: 3 })], intent: { showOptions: true } },
      { today: TODAY, logs: [fullLog(TODAY, { pain: 1 })], profile: profile(PREGNANT()) },
      { today: TODAY, logs: [fullLog(TODAY, { pain: 2 }), fullLog('2026-10-23', { pain: 2 })], profile: profile({ ...CLEAR, takesCurrent: 'Yes', currentMedicationItems: ['warfarin'] }), products: HEAT, intent: { showOptions: true } },
    ];
    for (const s of states) {
      const text = JSON.stringify(decide(s).items.map(({ title, body, reason, actions }) => ({ title, body, reason, actions })));
      expect(text).not.toMatch(/—/);
      expect(text).not.toMatch(/\d+\s*%\s*match/i);
    }
  });
});

describe('non-safety suppression', () => {
  const base = { today: TODAY, logs: [fullLog(TODAY)], patterns: [sleepPattern] };
  it('dismissal hides a wellness item for 30 days, then it returns', () => {
    const dismissed = dismiss({}, decide(base).items[0], TODAY);
    const next = addDays(TODAY, 1);
    expect(decide({ ...base, today: next, logs: [fullLog(next)], dismissed }).items).toEqual([]);
    const later = addDays(TODAY, 31);
    expect(decide({ ...base, today: later, logs: [fullLog(later)], dismissed }).items[0].id).toBe('insight:sleep:premenstrual');
  });
  it('novelty decay fades it; interaction keeps it; long ago does not count', () => {
    const first = decide(base);
    const seen = markShown(markShown({}, first.items, '2026-10-22'), first.items, '2026-10-23');
    expect(decide({ ...base, seen }).output).toBe('no_action');
    expect(decide({ ...base, seen: markInteracted(markShown({}, first.items, '2026-10-22'), first.items[0].id, '2026-10-22') }).items[0].id).toBe(first.items[0].id);
    expect(decide({ ...base, seen: markShown({}, first.items, '2026-09-01') }).items[0].id).toBe(first.items[0].id);
  });
  it('a recorded outcome closes the follow-up', () => {
    const t = recordOutcome(createTry({ id: 't5', kind: 'action', ref: 'heat', startedDay: '2026-09-01', horizonDays: 28 }), 'helpful', { day: TODAY });
    expect(decide({ today: TODAY, tries: [t], logs: [fullLog(TODAY)] }).items).toEqual([]);
  });
});

describe('interest is not history (section 39)', () => {
  it('browsing, saves and reading never create a need or an item', () => {
    const p = buildUserProfile({ ...EMPTY, ...CLEAR, supportSelections: [] }, { behavior: { viewed: { 'p-thermacare': 9 }, saved: ['p-thermacare'] } });
    const state = { today: TODAY, logs: [fullLog(TODAY)], profile: p, products: HEAT, behavior: { viewed: { 'p-thermacare': 20 } }, community: { readTopics: ['period-pain'] }, intent: { showOptions: true } };
    expect(activeNeeds(state)).toEqual({});
    expect(decide(state).items).toEqual([]);
  });
});

it('date helpers come from dailyLog', () => {
  expect(addDays('2026-10-24', 30)).toBe('2026-11-23');
  expect(daysBetween('2026-10-24', '2026-11-23')).toBe(30);
});

describe('cycle patterns and pregnancy', () => {
  const PREG = buildUserProfile({ ...EMPTY, ...CLEAR, lifeStageSelections: ['I am pregnant'], lifeStage: 'I am pregnant', pregnancyTrimester: 'Second trimester', supportSelections: [] });
  const pat = { ...sleepPattern, observed: { from: '2026-01-05', to: '2026-04-02' } };
  it('pregnancy start unknown: no cycle pattern shows', () => {
    const d = decide({ today: TODAY, logs: [fullLog(TODAY)], patterns: [pat], profile: PREG });
    expect(d.items.some((i) => i.type === 'insight')).toBe(false);
    expect(d.debug.removed).toEqual([expect.objectContaining({ id: 'insight:sleep:premenstrual', code: 'pregnancy_pattern' })]);
  });
  it('a pattern observed before the pregnancy started is not shown', () => {
    const d = decide({ today: TODAY, logs: [fullLog(TODAY)], patterns: [pat], profile: PREG, pregnancyStartDay: '2026-05-01' });
    expect(d.items.some((i) => i.type === 'insight')).toBe(false);
  });
  it('one observed after the start may show; not pregnant: unchanged', () => {
    const later = { ...pat, observed: { from: '2026-06-01', to: '2026-10-01' } };
    expect(patternBeforePregnancy(later, { pregnant: true, pregnancyStartDay: '2026-05-01' })).toBe(false);
    expect(decide({ today: TODAY, logs: [fullLog(TODAY)], patterns: [pat], profile: profile(CLEAR) }).items[0].type).toBe('insight');
  });
});

describe('bleeding after menopause picked in setup (founder, Oct 24)', () => {
  it('shows the prompt-evaluation care item without any log', async () => {
    const { buildTodayState } = await import('./todayState.js');
    const { decide: run } = await import('./decisionEngine.js');
    const intake = { age: '57', lifeStageSelections: ['I am post-menopause'], supportSelections: ['Spotting between periods'] };
    const d = run(buildTodayState({ today: '2026-10-25', intake }));
    const item = d.items.find((i) => i.id === 'care:postmenopausal_bleeding');
    expect(item).toBeTruthy();
    expect(item.body).toMatch(/checked promptly by an ob-gyn/);
    expect(item.basis.sources[0].url).toMatch(/medlineplus\.gov/);
  });
});
