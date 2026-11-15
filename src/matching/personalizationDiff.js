/**
 * What really changed when her profile changed (founder brief Nov 15: "a Spotify Wrapped-style
 * personalization update", three levels of feedback, slides built only from real before/after
 * differences). Pure and tested; the app builds the two snapshots with the same engine and options.
 *
 * Snapshot = { needs: [{ id, label }], matches: [{ id, name, brand, needId, percent }] } (ranked).
 *
 * Levels (never louder than the change):
 *   0  nothing she would notice changed      -> toast "Saved. Your matches stay the same."
 *   1  small: re-ordering, a % or one new pick -> toast with "See"
 *   2  a new #1, or 2 new / removed matches   -> pop-up
 *   3  a need added or removed, 3+ new matches, or a full quiz retake with any change -> full recap
 */
const TOP = 6; // what she sees as "your matches" on Home and Explore

/** The answers people recognise, with the word ayna uses for each (her own values are shown back to her, never stored in the history). */
export const PROFILE_FIELDS = [
  ['lifeStageSelections', 'Life stage'],
  ['supportSelections', 'What you want help with'],
  ['vasomotorTimingSelections', 'When hot flashes happen'],
  ['diagnosisSelections', 'Conditions you shared'],
  ['allergySelections', 'Sensitivities'],
  ['allergyItems', 'Sensitivities'],
  ['currentMedicationItems', 'Medicines and supplements'],
  ['avoidIngredients', 'Ingredients to avoid'],
  ['preferredFormats', 'Product types you like'],
  ['priceRange', 'Budget'],
];
const asList = (v) => (Array.isArray(v) ? v.map((x) => (typeof x === 'string' ? x : x?.name || x?.label || '')).filter(Boolean) : v ? [String(v)] : []);

/** What she changed in her answers, field by field (added / removed values). */
export function profileChanges(before = {}, after = {}) {
  const out = [];
  for (const [key, label] of PROFILE_FIELDS) {
    const b = asList(before?.[key]);
    const a = asList(after?.[key]);
    const added = a.filter((x) => !b.includes(x));
    const removed = b.filter((x) => !a.includes(x));
    if (!added.length && !removed.length) continue;
    const prev = out.find((o) => o.label === label);
    if (prev) { prev.added.push(...added); prev.removed.push(...removed); } else out.push({ label, added, removed });
  }
  return out;
}

/** One small thing to try for a need she just added: a preset goal (with its .gov tip), never auto-added. */
export function goalSuggestion(needsAdded = [], presets = [], existingGoals = []) {
  const have = new Set(existingGoals.map((g) => String(g.text || '').toLowerCase()));
  for (const n of needsAdded) {
    const p = presets.find((x) => x.needId === n.id && !have.has(x.text.toLowerCase()));
    if (p) return { ...p, forNeed: n.label };
  }
  return null;
}

export function snapshotOf({ needs = [], matches = [] } = {}) {
  return {
    needs: needs.filter((n) => n?.id).map((n) => ({ id: n.id, label: n.label || n.phrase || n.id })),
    matches: matches.filter((p) => p?.id).map((p) => ({ id: p.id, name: p.name || '', brand: p.brand || '', needId: p.needId || null, percent: Number.isFinite(p.percent) ? Math.round(p.percent) : null })),
  };
}

export function diffPersonalization(before, after, { source = 'answer', top = TOP, profile = [], goal = null } = {}) {
  const b = snapshotOf(before || {});
  const a = snapshotOf(after || {});
  const bNeeds = new Map(b.needs.map((n) => [n.id, n]));
  const aNeeds = new Map(a.needs.map((n) => [n.id, n]));
  const needsAdded = a.needs.filter((n) => !bNeeds.has(n.id));
  const needsRemoved = b.needs.filter((n) => !aNeeds.has(n.id));

  const bTop = b.matches.slice(0, top);
  const aTop = a.matches.slice(0, top);
  const bRank = new Map(bTop.map((p, i) => [p.id, i]));
  const aRank = new Map(aTop.map((p, i) => [p.id, i]));
  const matchesAdded = aTop.filter((p) => !bRank.has(p.id)).map((p) => ({ ...p, rank: aRank.get(p.id) + 1 }));
  const matchesRemoved = bTop.filter((p) => !aRank.has(p.id)).map((p) => ({ ...p, rank: bRank.get(p.id) + 1 }));
  const moved = aTop.filter((p) => bRank.has(p.id) && bRank.get(p.id) !== aRank.get(p.id))
    .map((p) => ({ ...p, from: bRank.get(p.id) + 1, to: aRank.get(p.id) + 1 }))
    .sort((x, y) => Math.abs(y.from - y.to) - Math.abs(x.from - x.to));
  const bPct = new Map(b.matches.map((p) => [p.id, p.percent]));
  const percentChanges = aTop.filter((p) => p.percent != null && bPct.get(p.id) != null && Math.abs(p.percent - bPct.get(p.id)) >= 3)
    .map((p) => ({ ...p, from: bPct.get(p.id), to: p.percent }));
  const newTop = aTop[0] && bTop[0] && aTop[0].id !== bTop[0].id ? { ...aTop[0], was: bTop[0] } : null;

  const changes = needsAdded.length + needsRemoved.length + matchesAdded.length + matchesRemoved.length + moved.length + percentChanges.length;
  let level = 0;
  if (changes > 0) level = 1;
  if (newTop || matchesAdded.length >= 2 || matchesRemoved.length >= 2) level = 2;
  if (needsAdded.length || needsRemoved.length || matchesAdded.length >= 3 || (source === 'quiz' && (newTop || matchesAdded.length))) level = 3;

  return { source, level, needsAdded, needsRemoved, matchesAdded, matchesRemoved, moved, percentChanges, newTop, changes, after: a, profile, goal };
}

const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** Plain-language lines for the toast, the pop-up and the history. Only what changed. */
export function diffLines(d) {
  const out = [];
  if (d.needsAdded.length) out.push(`Now covering: ${d.needsAdded.map((n) => n.label).join(', ')}`);
  if (d.needsRemoved.length) out.push(`No longer covering: ${d.needsRemoved.map((n) => n.label).join(', ')}`);
  if (d.newTop) out.push(`New #1 match: ${d.newTop.name}`);
  if (d.matchesAdded.length) out.push(`${plural(d.matchesAdded.length, 'new match', 'new matches')}`);
  if (d.matchesRemoved.length) out.push(`${plural(d.matchesRemoved.length, 'match', 'matches')} no longer in your top ${TOP}`);
  const bigMoves = d.moved.filter((m) => Math.abs(m.from - m.to) >= 2 && !(d.newTop && m.id === d.newTop.id));
  if (bigMoves.length) out.push(`${plural(bigMoves.length, 'match', 'matches')} moved`);
  if (!out.length && d.percentChanges.length) out.push(`${plural(d.percentChanges.length, 'match score')} changed`);
  return out;
}

/** The toast text for levels 0 and 1. */
export function toastFor(d) {
  if (d.level === 0) return 'Saved. Your matches stay the same.';
  const lines = diffLines(d);
  return `Updated. ${lines[0] || 'Your matches changed a little'}.`;
}

/**
 * The full-screen recap's slides, built only from the diff (no slide for something that didn't change).
 * kinds: intro, profile, needs, top, added, moved, removed, try, done
 */
export function recapSlides(d) {
  const slides = [{ kind: 'intro' }];
  if (d.profile?.length) slides.push({ kind: 'profile', fields: d.profile.slice(0, 4) });
  if (d.needsAdded.length || d.needsRemoved.length) slides.push({ kind: 'needs', added: d.needsAdded, removed: d.needsRemoved });
  if (d.newTop) slides.push({ kind: 'top', product: d.newTop, was: d.newTop.was });
  const added = d.matchesAdded.filter((p) => !(d.newTop && p.id === d.newTop.id));
  if (added.length) slides.push({ kind: 'added', products: added });
  const moves = d.moved.filter((m) => !(d.newTop && m.id === d.newTop.id)).slice(0, 4);
  if (moves.length || d.percentChanges.length) slides.push({ kind: 'moved', moves, percents: d.percentChanges.slice(0, 4) });
  if (d.matchesRemoved.length) slides.push({ kind: 'removed', products: d.matchesRemoved });
  if (d.goal) slides.push({ kind: 'try', goal: d.goal });
  slides.push({ kind: 'done' });
  return slides;
}

export const SOURCE_LABEL = { quiz: 'You updated your quiz', answer: 'You changed an answer', checkin: 'Your monthly check-in', health: 'New health data' };
