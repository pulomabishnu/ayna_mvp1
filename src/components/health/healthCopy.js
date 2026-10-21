/**
 * Plain words for how health data changed her matches. Shared by the website
 * and the app (HealthShapedNote, HealthBackedBadge, Why this match).
 * Rules: sentence case, no em dashes, say what changed, never why she has a symptom.
 */
import { SOURCE_NAMES } from '../../mobile/data/healthConnections.js';
import { PERIOD_TIMING_SOURCE } from '../../health/insights.js';
import { usableForMatching } from '../../health/policy.js';

export { PERIOD_TIMING_SOURCE };

export const sourceName = (id) => SOURCE_NAMES[id] || id;

export function joinNames(names) {
  const list = [...new Set(names.filter(Boolean))];
  if (list.length <= 1) return list[0] || '';
  return `${list.slice(0, -1).join(', ')} and ${list[list.length - 1]}`;
}

/** Sources behind the changes, in order, deduped. */
export function changeSources(changes = []) {
  return [...new Set(changes.flatMap((c) => c.sources || []))];
}

const lower = (s) => String(s || '').charAt(0).toLowerCase() + String(s || '').slice(1);

/** One line per change: { lead, effect }. */
export function changeLine(change) {
  if (!change) return null;
  const label = change.label || 'This goal';
  const lead = `${change.summary}.`;
  let effect;
  if (change.kind === 'timing') {
    effect = change.picksReordered ? `${label} now leads with what you use around your period.`
      : change.shelfMovedUp ? `${label} moved up your list.`
        : `It backs up your ${lower(label)} picks.`;
  } else {
    effect = change.shelfMovedUp ? `${label} moved up your list.`
      : change.picksReordered ? `${label} picks that help come before trackers.`
        : `It backs up your ${lower(label)} picks.`;
  }
  return { lead, effect };
}

/** Plain text of a change line (for aria labels and tests). */
export const changeText = (change) => { const l = changeLine(change); return l ? `${l.lead} ${l.effect}` : ''; };

const SECTION_WORD = { sleep: 'sleep', cycle: 'cycle', heart: 'heart', recovery: 'recovery' };

/** "Backed by your sleep data". Null for trackers (her data moved those down). */
export function backedText(backed) {
  if (!backed || backed.tracker) return null;
  return `Backed by your ${SECTION_WORD[backed.section] || 'health'} data`;
}

/** Connected sources that can shape matches, and ones that only show insights (Oura for now). */
export function splitSources(connected = []) {
  const ids = [...new Set(connected.map((c) => c.source).filter(Boolean))];
  return {
    matching: ids.filter((id) => usableForMatching({ source: id })),
    insightsOnly: ids.filter((id) => !usableForMatching({ source: id })),
  };
}
