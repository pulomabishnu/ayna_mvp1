import { describe, expect, it } from 'vitest';
import { EMPTY } from '../mobile/data/intakeModel.js';
import { buildUserProfile } from '../matching/userProfile.js';
import {
  decide, activeNeeds, markShown, markInteracted, dismiss, addDays, daysBetween,
  MAX_ITEMS, NOTHING_TODAY, OUTPUTS,
} from './decisionEngine.js';
import {
  INTERVENTION_CLASSES, CLASS_IDS, evaluateClassSafety, productMatchesClass, productsForClass,
} from './interventions.js';

const TODAY = '2026-10-24';
const profile = (over = {}) => buildUserProfile({ ...EMPTY, ...over });
// A fully answered, low-risk intake: nothing unknown for the OTC gates.
const CLEAR = {
  age: '27', lifeStageSelections: ['I get periods regularly'], lifeStage: 'I get periods regularly',
  supportSelections: ['Cramps or period pain'], diagnosisSelections: ['None that I know of'],
  allergyStatus: 'No', takesCurrent: 'No', safetyConcern: 'No',
};
const log = (day, over = {}) => ({ day, pain: null, flow: null, pms: null, sleep: null, mood: null, skin: null, ...over });
const fullLog = (day, over = {}) => log(day, { pain: 0, flow: 'none', pms: 0, sleep: 2, mood: 2, skin: 2, ...over });
const sleepPattern = { id: 'p-sleep-pre', metric: 'sleep', window: 'premenstrual', text: 'Your sleep was lower in the days before your period in 3 of your last 4 cycles.', basis: { cycles: 3, of: 4 }, direction: 'down' };
const HEAT = [
  { id: 'p-thermacare', category: 'cramp-relief', name: 'ThermaCare Menstrual Pain Therapy HeatWraps, 4 Count' },
  { id: 'p-viboos-heating-pad', category: 'cramp-relief', name: 'VIBOOS Electric Heating Pad' },
  { id: 'p-sootheher-elaris-pod', category: 'cramp-relief', name: "SootheHer's Elaris Pod" },
  { id: 'p-advil-ibuprofen-200', category: 'medication', name: 'Advil Ibuprofen 200 mg Tablets' },
  { id: 'd-eight-sleep', category: 'sleep', name: 'Eight Sleep Pod 4' },
];

describe('interventions', () => {
  it('every class has a label, needs, sources, a follow-up horizon and gates', () => {
    for (const id of CLASS_IDS) {
      const c = INTERVENTION_CLASSES[id];
      expect(c.id).toBe(id);
      expect(c.label).toBeTruthy();
      expect(c.needs.length).toBeGreaterThan(0);
      expect(c.sources.length).toBeGreaterThan(0);
      c.sources.forEach((s) => expect(s.url).toMatch(/^https:\/\//));
      expect(c.followUpDays).toBeGreaterThan(0);
      expect(typeof c.gates).toBe('function');
      expect(`${c.label} ${c.summary} ${c.caution || ''}`).not.toMatch(/—/);
    }
  });

  it('only heat can carry products, and only heat products', () => {
    expect(productsForClass(HEAT, 'heat').map((p) => p.id)).toEqual(['p-thermacare', 'p-viboos-heating-pad']);
    expect(productsForClass(HEAT, 'otc_pain_relief')).toEqual([]); // information only
    expect(productsForClass(HEAT, 'sleep_routine')).toEqual([]);
    expect(productMatchesClass(HEAT[3], 'heat')).toBe(false);
  });

  it('unknown is "ask", never safe', () => {
    const r = evaluateClassSafety('otc_pain_relief', null);
    expect(r.verdict).toBe('ask');
    expect(r.asks.map((a) => a.code)).toEqual(expect.arrayContaining(['pregnancy_unknown', 'medications_unknown', 'conditions_unknown', 'allergies_unknown']));
  });

  it('a fully answered low-risk profile passes OTC', () => {
    expect(evaluateClassSafety('otc_pain_relief', profile(CLEAR)).verdict).toBe('pass');
  });

  it.each([
    ['pregnancy', { lifeStageSelections: ['I am pregnant'], lifeStage: 'I am pregnant', pregnancyTrimester: 'Second trimester' }],
    ['nsaid_allergy', { allergyStatus: 'Yes', allergyItems: ['NSAIDs such as ibuprofen'] }],
    ['medication_interaction', { takesCurrent: 'Yes', currentMedicationItems: ['Zoloft'] }],
    ['condition', { diagnosisSelections: ['Stomach ulcer or stomach bleeding'] }],
    ['condition', { diagnosisSelections: ['Kidney disease'] }],
  ])('OTC is blocked for %s', (code, over) => {
    const r = evaluateClassSafety('otc_pain_relief', profile({ ...CLEAR, ...over }));
    expect(r.verdict).toBe('block');
    expect(r.blocks.map((b) => b.code)).toContain(code);
    expect(r.blocks.find((b) => b.code === code).source.url).toMatch(/nhs\.uk/);
  });

  it.each(['warfarin', 'Eliquis'])('blood thinner (%s) is a medication block', (med) => {
    const r = evaluateClassSafety('otc_pain_relief', profile({ ...CLEAR, takesCurrent: 'Yes', currentMedicationItems: [med] }));
    expect(r.verdict).toBe('block');
    expect(r.blocks.find((b) => b.code === 'medication_interaction').reason).toMatch(/blood thinner/);
  });

  it('an unrecognized medicine asks first', () => {
    const r = evaluateClassSafety('otc_pain_relief', profile({ ...CLEAR, takesCurrent: 'Yes', currentMedicationItems: ['zzqx unknown'] }));
    expect(r.asks.map((a) => a.code)).toContain('medications_unrecognized');
  });

  it('breastfeeding asks first', () => {
    const r = evaluateClassSafety('otc_pain_relief', profile({ ...CLEAR, lifeStageSelections: ['I am postpartum'], lifeStage: 'I am postpartum', postpartumTiming: '3–6 months ago', breastfeedingStatus: 'Yes' }));
    expect(r.asks.map((a) => a.code)).toContain('breastfeeding');
  });
});

describe('decide: golden scenarios', () => {
  it('no data at all: a check-in, never an option', () => {
    const d = decide({ today: TODAY });
    expect(d.output).toBe('monitor');
    expect(d.items.map((i) => i.type)).toEqual(['check_in']);
  });

  it('today fully logged and nothing else: no action, zero items', () => {
    const d = decide({ today: TODAY, logs: [fullLog(TODAY)], profile: profile(CLEAR) });
    expect(d.output).toBe('no_action');
    expect(d.items).toEqual([]);
    expect(d.empty).toBe(NOTHING_TODAY);
  });

  it('3 of 4 premenstrual sleep pattern: an insight, no options or products by default', () => {
    const d = decide({ today: TODAY, logs: [fullLog(TODAY)], patterns: [sleepPattern], profile: profile(CLEAR), products: HEAT });
    expect(d.output).toBe('answer');
    expect(d.items[0]).toMatchObject({ id: 'insight:p-sleep-pre', type: 'insight', title: 'Your sleep dips before your period', reason: 'Seen in 3 of your last 4 cycles.' });
    expect(d.items[0].basis).toMatchObject({ cycles: 3, of: 4 });
    expect(d.items[0].actions.map((a) => a.id)).toContain('show_options');
    expect(d.items.some((i) => i.type === 'option' || i.productIds)).toBe(false);
  });

  it('a weak pattern (1 of 4) is not shown', () => {
    const d = decide({ today: TODAY, logs: [fullLog(TODAY)], patterns: [{ ...sleepPattern, basis: { cycles: 1, of: 4 } }] });
    expect(d.items).toEqual([]);
    expect(d.debug.removed[0]).toMatchObject({ code: 'weak_pattern' });
  });

  it('a due follow-up comes first', () => {
    const tries = [{ id: 't1', kind: 'action', ref: 'heat', need: 'period_pain', startedDay: '2026-09-19', horizonDays: 35, status: 'due', outcome: null }];
    const d = decide({ today: TODAY, logs: [log(TODAY)], patterns: [sleepPattern], tries, profile: profile(CLEAR) });
    expect(d.items[0]).toMatchObject({ id: 'follow_up:t1', type: 'follow_up', title: 'Did heat help?' });
    expect(d.items[0].actions.map((a) => a.id)).toEqual(['outcome:helpful', 'outcome:no_change', 'outcome:worse', 'outcome:side_effect', 'outcome:unsure', 'outcome:stopped']);
    expect(d.output).toBe('monitor');
  });

  it('a pending try past its horizon counts as due; a recorded one does not', () => {
    const pending = [{ id: 't2', kind: 'product', ref: 'p-thermacare', startedDay: '2026-09-01', horizonDays: 35, status: 'pending', outcome: null }];
    expect(decide({ today: TODAY, tries: pending, labels: { 'p-thermacare': 'ThermaCare' } }).items[0]).toMatchObject({ id: 'follow_up:t2', title: 'Did ThermaCare help?' });
    const recorded = [{ ...pending[0], status: 'recorded', outcome: 'helpful' }];
    expect(decide({ today: TODAY, tries: recorded, logs: [fullLog(TODAY)] }).items).toEqual([]);
  });

  it('pregnant + pain: OTC (and period-care classes) removed with reasons, care leads', () => {
    const p = profile({ ...CLEAR, lifeStageSelections: ['I am pregnant'], lifeStage: 'I am pregnant', pregnancyTrimester: 'First trimester' });
    const logs = [fullLog(TODAY, { pain: 2 }), fullLog('2026-10-23', { pain: 2 })];
    const d = decide({ today: TODAY, logs, profile: p, intent: { showOptions: true, need: 'period_pain' } });
    const otc = d.debug.removedBySafety.find((r) => r.classId === 'otc_pain_relief');
    expect(otc).toBeTruthy();
    expect(otc.reasons.map((r) => r.code)).toContain('pregnancy');
    expect(otc.reasons.find((r) => r.code === 'pregnancy').reason).toMatch(/pregnan/i);
    expect(d.items.some((i) => i.classId === 'otc_pain_relief')).toBe(false);
    expect(d.items[0]).toMatchObject({ id: 'care:pregnancy_pain', type: 'care' });
    expect(d.output).toBe('escalate');
  });

  it('red flag: escalate, shown alone, cannot be dismissed or decayed', () => {
    const base = { today: TODAY, redFlags: ['rf.toxic_shock_severe'], patterns: [sleepPattern], tries: [{ id: 't1', ref: 'heat', status: 'due', startedDay: '2026-09-01', horizonDays: 35 }] };
    const d = decide(base);
    expect(d.output).toBe('escalate');
    expect(d.items).toHaveLength(1);
    expect(d.items[0]).toMatchObject({ id: 'care:rf.toxic_shock_severe', type: 'care', level: 'urgent', title: 'Call 911' });
    const again = decide({ ...base, dismissed: dismiss({}, d.items[0], TODAY), seen: markShown(markShown({}, d.items, '2026-10-22'), d.items, '2026-10-23') });
    expect(again.items[0].id).toBe('care:rf.toxic_shock_severe');
  });

  it('a "not relevant" dismissal suppresses the item for the period, then it can return', () => {
    const base = { today: TODAY, logs: [fullLog(TODAY)], patterns: [sleepPattern] };
    const first = decide(base);
    const dismissed = dismiss({}, first.items[0], TODAY);
    const d = decide({ ...base, today: addDays(TODAY, 1), logs: [fullLog(addDays(TODAY, 1))], dismissed });
    expect(d.items.find((i) => i.id === 'insight:p-sleep-pre')).toBeUndefined();
    expect(d.debug.suppressed).toEqual([expect.objectContaining({ id: 'insight:p-sleep-pre', why: 'dismissed' })]);
    const later = addDays(TODAY, 31);
    expect(decide({ ...base, today: later, logs: [fullLog(later)], dismissed }).items[0].id).toBe('insight:p-sleep-pre');
  });

  it('a dismissed pattern comes back early if the pattern itself changed', () => {
    const dismissed = dismiss({}, decide({ today: TODAY, patterns: [sleepPattern] }).items.find((i) => i.type === 'insight'), TODAY);
    const changed = { ...sleepPattern, basis: { cycles: 4, of: 4 } };
    const d = decide({ today: addDays(TODAY, 2), logs: [fullLog(addDays(TODAY, 2))], patterns: [changed], dismissed });
    expect(d.items[0].id).toBe('insight:p-sleep-pre');
  });

  it('never more than 3 items', () => {
    const tries = ['a', 'b', 'c', 'd'].map((id) => ({ id, kind: 'action', ref: 'heat', startedDay: '2026-09-01', horizonDays: 35, status: 'due' }));
    const patterns = [sleepPattern, { id: 'p-pain', metric: 'pain', window: 'period', text: 'Pain on period days', basis: { cycles: 4, of: 4 } }];
    const d = decide({ today: TODAY, tries, patterns, logs: [log(TODAY, { pain: 3 }), log('2026-10-20', { pain: 3 })], profile: profile(CLEAR), intent: { showOptions: true } });
    expect(d.items.length).toBe(MAX_ITEMS);
    expect(OUTPUTS).toContain(d.output);
  });
});

describe('decide: readiness, products and the information gap', () => {
  const painLogs = [fullLog(TODAY, { pain: 2 }), fullLog('2026-10-23', { pain: 2 })];

  it('after "show options": approved classes, products only inside heat', () => {
    const d = decide({ today: TODAY, logs: painLogs, profile: profile(CLEAR), products: HEAT, intent: { showOptions: true, need: 'period_pain' } });
    expect(d.output).toBe('show_options');
    expect(d.items.map((i) => i.classId)).toEqual(['heat', 'movement', 'otc_pain_relief']);
    expect(d.items[0].productIds).toEqual(['p-thermacare', 'p-viboos-heating-pad']);
    expect(d.items.find((i) => i.classId === 'otc_pain_relief').productIds).toBeUndefined();
    d.items.forEach((i) => expect(i.basis.sources.length).toBeGreaterThan(0));
  });

  it('with unknown safety facts, asks the one question that changes the decision, and holds OTC back', () => {
    const d = decide({ today: TODAY, logs: painLogs, intent: { showOptions: true, need: 'period_pain' } });
    expect(d.output).toBe('ask_more');
    expect(d.items[0]).toMatchObject({ id: 'ask:pregnancy', type: 'ask', title: 'Could you be pregnant?' });
    expect(d.items.filter((i) => i.type === 'ask')).toHaveLength(1);
    expect(d.items.some((i) => i.classId === 'otc_pain_relief')).toBe(false);
    expect(d.debug.removedBySafety.find((r) => r.classId === 'otc_pain_relief').pendingAnswer).toBe(true);
  });

  it('without readiness there is no question and no option', () => {
    const d = decide({ today: TODAY, logs: painLogs });
    expect(d.items.some((i) => i.type === 'ask' || i.type === 'option')).toBe(false);
  });

  it('readiness stage "comparing" also counts', () => {
    const d = decide({ today: TODAY, logs: painLogs, profile: profile(CLEAR), products: HEAT, readiness: 'comparing' });
    expect(d.items.some((i) => i.productIds?.length)).toBe(true);
    expect(decide({ today: TODAY, logs: painLogs, profile: profile(CLEAR), products: HEAT, readiness: 'discovering' }).items.some((i) => i.type === 'option')).toBe(false);
  });

  it('abstains when she asks for options and every class is unsafe', () => {
    const p = profile({ ...CLEAR, lifeStageSelections: ['I am pregnant'], lifeStage: 'I am pregnant' });
    const state = { today: TODAY, logs: [fullLog(TODAY)], profile: p, intent: { showOptions: true, need: 'period_pain' } };
    const d = decide(state);
    // Only tracking survives safety for pain in pregnancy.
    expect(d.items.map((i) => i.classId)).toEqual(['tracking']);
    expect(d.debug.removedBySafety.map((r) => r.classId)).toEqual(['heat', 'movement', 'otc_pain_relief']);
    // She already said tracking is not relevant: nothing safe is left, so abstain.
    const none = decide({ ...state, dismissed: dismiss({}, 'option:tracking:period_pain', TODAY) });
    expect(none.output).toBe('abstain');
    expect(none.items).toEqual([]);
  });
});

describe('decide: care rules', () => {
  it('severe pain on several days suggests a visit', () => {
    const d = decide({ today: TODAY, logs: [fullLog(TODAY, { pain: 3 }), fullLog('2026-10-22', { pain: 3 })], profile: profile(CLEAR) });
    expect(d.items[0]).toMatchObject({ id: 'care:severe_period_pain', level: 'routine' });
    expect(d.output).toBe('escalate');
  });

  it('pain relievers made no difference: care suggestion', () => {
    const tries = [{ id: 't9', kind: 'action', ref: 'otc_pain_relief', status: 'recorded', outcome: 'no_change', startedDay: '2026-09-01', horizonDays: 35 }];
    expect(decide({ today: TODAY, tries, logs: [fullLog(TODAY)] }).items[0].id).toBe('care:otc_not_enough:t9');
  });

  it('bleeding after menopause is flagged', () => {
    const p = profile({ ...CLEAR, lifeStageSelections: ['I am post-menopause'], lifeStage: 'I am post-menopause', supportSelections: ['Hot flashes'] });
    expect(decide({ today: TODAY, profile: p, logs: [fullLog(TODAY, { flow: 'spotting' })] }).items[0].id).toBe('care:postmenopausal_bleeding');
  });
});

describe('decide: novelty decay', () => {
  const base = { today: TODAY, logs: [fullLog(TODAY)], patterns: [sleepPattern] };

  it('an insight shown on recent days without interaction loses priority and can drop out', () => {
    const first = decide(base);
    let seen = markShown({}, first.items, '2026-10-22');
    seen = markShown(seen, first.items, '2026-10-23');
    const d = decide({ ...base, seen });
    expect(d.debug.suppressed).toEqual([expect.objectContaining({ id: 'insight:p-sleep-pre', why: 'novelty', shownRecently: 2 })]);
    expect(d.items).toEqual([]);
    expect(d.output).toBe('no_action');
  });

  it('interaction keeps it, and a due follow-up never decays', () => {
    const first = decide(base);
    let seen = markShown({}, first.items, '2026-10-22');
    seen = markInteracted(seen, 'insight:p-sleep-pre', '2026-10-22');
    expect(decide({ ...base, seen }).items[0].id).toBe('insight:p-sleep-pre');
    const tries = [{ id: 't1', ref: 'heat', status: 'due', startedDay: '2026-09-01', horizonDays: 35 }];
    const fu = decide({ today: TODAY, tries, logs: [fullLog(TODAY)] });
    const seen2 = markShown(markShown({}, fu.items, '2026-10-22'), fu.items, '2026-10-23');
    expect(decide({ today: TODAY, tries, logs: [fullLog(TODAY)], seen: seen2 }).items[0].id).toBe('follow_up:t1');
  });

  it('shown long ago does not decay', () => {
    const seen = markShown({}, decide(base).items, '2026-09-01');
    expect(decide({ ...base, seen }).items[0].id).toBe('insight:p-sleep-pre');
  });
});

describe('interest is not history (section 39)', () => {
  it('browsing, saves and reading never create a need or an item', () => {
    const p = buildUserProfile({ ...EMPTY, ...CLEAR, supportSelections: [] }, { behavior: { viewed: { 'p-thermacare': 9 }, saved: ['p-thermacare', 'p-viboos-heating-pad'] } });
    const state = { today: TODAY, logs: [fullLog(TODAY)], profile: p, products: HEAT, behavior: { viewed: { 'p-thermacare': 20 } }, community: { readTopics: ['period-pain', 'endometriosis'] }, intent: { showOptions: true } };
    expect(activeNeeds(state)).toEqual({});
    const d = decide(state);
    expect(d.items).toEqual([]);
  });
});

describe('date helpers', () => {
  it('adds and diffs days', () => {
    expect(addDays('2026-10-24', 30)).toBe('2026-11-23');
    expect(daysBetween('2026-10-24', '2026-11-23')).toBe(30);
  });
});

describe('copy rules', () => {
  it('no em dashes or percent match in anything a user sees', () => {
    const states = [
      { today: TODAY },
      { today: TODAY, patterns: [sleepPattern] },
      { today: TODAY, redFlags: ['rf.preeclampsia', 'rf.toxic_shock'] },
      { today: TODAY, logs: [fullLog(TODAY, { pain: 3 }), fullLog('2026-10-23', { pain: 3 })], intent: { showOptions: true } },
      { today: TODAY, logs: [fullLog(TODAY, { pain: 2 }), fullLog('2026-10-23', { pain: 2 })], profile: profile(CLEAR), intent: { showOptions: true } },
    ];
    for (const s of states) {
      const text = JSON.stringify(decide(s).items.map(({ title, body, reason, actions }) => ({ title, body, reason, actions })));
      expect(text).not.toMatch(/—/);
      expect(text).not.toMatch(/\d+\s*%\s*match/i);
    }
  });
});
