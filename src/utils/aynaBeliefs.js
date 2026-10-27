// "See and edit what ayna believes about you" (UX spec section 29, master
// prompt section 151, the trust center). One list, built from what ayna
// actually uses: her answers (stated), what the matcher worked out from them
// or from what she wrote (inferred), quick answers she gave on Today, and
// connected health data. Every row says where it came from and how to change
// it. Nothing here is guessed: a field she left empty is listed as missing.
import { buildUserProfile } from '../matching/userProfile.js';
import { AVOID_PAIRS, LIFE_STAGE_EXCLUSIVE, LIFE_STAGE_LABELS, buildSnapshot, reconstructIntakeFromSnapshot } from '../mobile/data/intakeModel.js';
import { mapIntakeToLegacyQuizProfile } from './healthIntake.js';
import { HEALTH_SOURCES } from '../mobile/data/healthConnections.js';

export const SOURCE_LABELS = {
  stated: 'You told us',
  words: 'From what you wrote',
  first_quiz: 'From your first quiz',
  today: 'From a Today question',
  inferred: 'Worked out from your answers',
  data: 'From connected data',
};

const arr = (v) => (Array.isArray(v) ? v.filter((x) => String(x ?? '').trim() !== '') : v ? [v] : []);
const NEED_SOURCE = { selected: 'stated', custom: 'words', free_text: 'words', legacy: 'first_quiz' };

/** Remove one value from a list field, through the wizard shape so every derived field stays in step. */
function withoutValue(snapshot, key, value) {
  const drop = new Set(Array.isArray(value) ? value : [value]);
  const wiz = reconstructIntakeFromSnapshot(snapshot);
  const list = Array.isArray(wiz[key]) ? wiz[key] : [];
  const next = { ...wiz, [key]: list.filter((x) => !drop.has(x)) };
  if (key === 'lifeStageSelections') next.lifeStage = next.lifeStageSelections.find((v) => !LIFE_STAGE_EXCLUSIVE.includes(v)) || '';
  if (key === 'allergyItems' && !next.allergyItems.length) next.allergyStatus = '';
  if (key === 'currentMedicationItems' && !next.currentMedicationItems.length) next.takesCurrent = '';
  return buildSnapshot(next);
}
function clearing(snapshot, patch) {
  return buildSnapshot({ ...reconstructIntakeFromSnapshot(snapshot), ...patch });
}

/**
 * Groups of rows: [{ id, title, note?, rows: [{ id, label, value?, source, step?, remove?: () => snapshot, missing? }] }].
 * `snapshot` is quizAnswers.fullHealthIntake (buildSnapshot output).
 * `todayAnswers` is the Today store's quick answers; `connected` the connected sources.
 */
export function aynaBeliefs(snapshot, { todayAnswers = null, connected = [] } = {}) {
  const groups = [];
  if (!snapshot || typeof snapshot !== 'object') {
    return [{ id: 'empty', title: 'Nothing yet', rows: [] }];
  }
  let profile = null;
  try { profile = buildUserProfile(snapshot); } catch { profile = null; }

  // What she wants help with: needs, each with where it came from.
  const support = arr(snapshot.supportSelections);
  const needRows = (profile?.healthIntent?.needs || []).map((n) => {
    const src = NEED_SOURCE[n.source] || 'inferred';
    const raw = n.raw && support.includes(n.raw) ? n.raw : null;
    return {
      id: `need:${n.id}`,
      label: n.label,
      value: src === 'words' && n.raw ? `“${n.raw}”` : '',
      source: src,
      step: 'support',
      remove: raw ? () => withoutValue(snapshot, 'supportSelections', raw) : null,
    };
  });
  groups.push({
    id: 'needs',
    title: 'What you want help with',
    note: 'These decide your matches and what Today talks about.',
    rows: needRows.length ? needRows : [{ id: 'need:none', label: support.includes('Nothing right now') ? 'Nothing specific right now' : 'Nothing picked yet', source: 'stated', step: 'support', missing: !support.length }],
  });

  const topics = arr(snapshot.helpTopics);
  const goals = arr(snapshot.goals);
  if (topics.length || goals.length) {
    groups.push({
      id: 'interests',
      title: 'Topics and goals',
      note: 'Interests, not health history. They never change a match.',
      rows: [
        ...topics.map((t) => ({ id: `topic:${t}`, label: t, value: 'Topic', source: 'stated', step: 'helpTopics', remove: () => clearing(snapshot, { helpTopics: topics.filter((x) => x !== t) }) })),
        ...goals.map((g) => ({ id: `goal:${g}`, label: g, value: 'Goal', source: 'stated', step: 'goals', remove: () => clearing(snapshot, { goals: goals.filter((x) => x !== g) }) })),
      ],
    });
  }

  // Life stage and the details that go with it.
  const stages = arr(snapshot.lifeStageSelections).length ? arr(snapshot.lifeStageSelections) : arr(snapshot.lifeStage);
  const stageRows = [
    { id: 'age', label: 'Age', value: snapshot.age ? String(snapshot.age) : '', source: 'stated', step: 'age', missing: !snapshot.age },
    ...stages.map((s) => ({ id: `stage:${s}`, label: LIFE_STAGE_LABELS[s] || s, value: 'Life stage', source: 'stated', step: 'lifeStage', remove: () => withoutValue(snapshot, 'lifeStageSelections', s) })),
    ...(!stages.length ? [{ id: 'stage:none', label: 'Life stage', value: '', source: 'stated', step: 'lifeStage', missing: true }] : []),
    ...[
      ['periodFlow', 'Period flow'], ['periodPain', 'Period pain'], ['utiFrequency', 'How often UTI-like symptoms come'],
      ['ttcDuration', 'Trying to conceive for'], ['postpartumTiming', 'Gave birth'], ['pregnancyTrimester', 'Pregnancy'],
      ['breastfeedingStatus', 'Breastfeeding or pumping'], ['perimenopauseLastPeriod', 'Periods now'],
    ].filter(([k]) => snapshot[k]).map(([k, label]) => ({ id: k, label, value: snapshot[k], source: 'stated', step: k === 'breastfeedingStatus' ? 'lifeStage' : k === 'perimenopauseLastPeriod' ? 'lifeStage' : k, remove: () => clearing(snapshot, { [k]: '' }) })),
  ];
  groups.push({ id: 'stage', title: 'Age and life stage', rows: stageRows });

  // Safety details: stated answers plus quick answers from Today.
  const dx = arr(snapshot.diagnosisSelections);
  const safetyRows = [
    ...dx.map((d) => ({ id: `dx:${d}`, label: ['None that I know of', 'Prefer not to say'].includes(d) ? 'Diagnosed conditions' : d, value: ['None that I know of', 'Prefer not to say'].includes(d) ? d : 'Condition', source: 'stated', step: 'conditions', remove: () => withoutValue(snapshot, 'diagnosisSelections', d) })),
    ...(!dx.length ? [{ id: 'dx:none', label: 'Diagnosed conditions', value: '', source: 'stated', step: 'conditions', missing: true }] : []),
    ...(snapshot.allergyStatus === 'Yes'
      ? arr(snapshot.allergyItems).map((a) => ({ id: `allergy:${a}`, label: a, value: 'Allergy', source: 'stated', step: 'allergies', remove: () => withoutValue(snapshot, 'allergyItems', a) }))
      : [{ id: 'allergy', label: 'Allergies', value: snapshot.allergyStatus || '', source: 'stated', step: 'allergies', missing: !snapshot.allergyStatus }]),
    ...(snapshot.takesCurrent === 'Yes'
      ? arr(snapshot.currentMedicationItems).map((m) => ({ id: `med:${m}`, label: m, value: 'Medicine or supplement', source: 'stated', step: 'medications', remove: () => withoutValue(snapshot, 'currentMedicationItems', m) }))
      : [{ id: 'med', label: 'Medicines and supplements', value: snapshot.takesCurrent || '', source: 'stated', step: 'medications', missing: !snapshot.takesCurrent }]),
  ];
  const TODAY_WORDS = { pregnancy: 'Could be pregnant', medications: 'Regular medicines', conditions: 'Health conditions', allergies: 'Reacted to a pain reliever', breastfeeding: 'Breastfeeding or pumping' };
  const VALUE_WORDS = { no: 'No', yes: 'Yes', not_sure: 'Not sure', none: 'None' };
  for (const [k, label] of Object.entries(TODAY_WORDS)) {
    if (todayAnswers && todayAnswers[k]) safetyRows.push({ id: `today:${k}`, label, value: VALUE_WORDS[todayAnswers[k]] || todayAnswers[k], source: 'today', todayField: k });
  }
  groups.push({ id: 'safety', title: 'Safety details', note: 'Used to leave out products that may not be safe for you.', rows: safetyRows });

  // Preferences.
  const prefs = [
    ...arr(snapshot.preferredFormats).map((f) => ({ id: `format:${f}`, label: f, value: 'Format', source: 'stated', step: 'formats', remove: () => withoutValue(snapshot, 'preferredFormats', f) })),
    ...arr(snapshot.priceRange).map((p) => ({ id: `price:${p}`, label: p, value: 'Budget', source: 'stated', step: 'priceRange', remove: () => withoutValue(snapshot, 'priceRange', p) })),
    ...arr(snapshot.avoidIngredients).filter((x) => !/-free$/.test(x) || !arr(snapshot.avoidIngredients).some((y) => `${y.toLowerCase()}-free` === x.toLowerCase())).map((a) => ({ id: `avoid:${a}`, label: a, value: 'Ingredient preference', source: 'stated', step: 'avoidIngredients', remove: () => withoutValue(snapshot, 'avoidIngredients', [a, AVOID_PAIRS[a]].filter(Boolean)) })),
    ...(snapshot.fsaHsa ? [{ id: 'fsa', label: 'FSA or HSA', value: { fsa: 'FSA', hsa: 'HSA', both: 'Both', none: 'No', unsure: 'Not sure' }[snapshot.fsaHsa] || '', source: 'stated', step: 'fsaHsa', remove: () => clearing(snapshot, { fsaHsaAnswer: '' }) }] : []),
    ...(arr(snapshot.trustRanking).length ? [{ id: 'trust', label: 'What matters most', value: snapshot.trustRanking[0], source: 'stated', step: 'trust' }] : []),
  ];
  groups.push({ id: 'prefs', title: 'Preferences', rows: prefs.length ? prefs : [{ id: 'prefs:none', label: 'No preferences yet', source: 'stated', step: 'formats', missing: true }] });

  // Inferred: contexts the matcher worked out from her own answers.
  const inferred = Object.values(profile?.contexts || {})
    .filter((c) => c.sources?.[0]?.type !== 'life_stage')
    .map((c) => ({ id: `ctx:${c.id}`, label: `Treated as ${c.phrase}`, value: `Because of ${c.sources.map((s) => s.phrase).filter(Boolean).slice(0, 2).join(' and ')}`, source: 'inferred', step: 'support' }));
  if (inferred.length) groups.push({ id: 'inferred', title: 'What ayna worked out', note: 'Only from your own answers, never from what you read or browse.', rows: inferred });

  // Connected data.
  groups.push({
    id: 'data',
    title: 'Connected health data',
    rows: connected.length
      ? connected.map((c) => { const key = c.source || c.id || c; return { id: `src:${key}`, label: HEALTH_SOURCES.find((h) => h.id === key)?.name || c.name || String(key), value: 'Connected', source: 'data', manage: true }; })
      : [{ id: 'src:none', label: 'Nothing connected', value: 'Optional', source: 'data', manage: true, missing: true }],
  });
  return groups;
}

/** The legacy quiz profile for a changed snapshot (what the app and website store as quizAnswers). */
export function profileFromSnapshot(snapshot) {
  return mapIntakeToLegacyQuizProfile(snapshot);
}
