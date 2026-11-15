/**
 * "What's changed": the last 30 times her matches changed, on this phone only (never analytics).
 * Each entry keeps the diff (ids, names, ranks and %, never her answers), so the recap can replay.
 */
import { diffLines } from '../matching/personalizationDiff.js';

export const CHANGES_KEY = 'ayna_changes_v1';
export const CHANGES_EVENT = 'ayna:changes';
const MAX = 30;

export function readChanges(storage = globalThis.localStorage) {
  try { const v = JSON.parse(storage?.getItem(CHANGES_KEY) || '[]'); return Array.isArray(v) ? v : []; } catch { return []; }
}

export function addChange(diff, { storage = globalThis.localStorage, now = new Date() } = {}) {
  if (!diff || diff.level === 0) return null;
  const { after, ...rest } = diff; // the full new snapshot isn't needed to replay
  // Her answers themselves (medicines, conditions) are never kept in the history: only which part changed.
  rest.profile = (rest.profile || []).map((f) => ({ label: f.label, count: (f.added?.length || 0) + (f.removed?.length || 0) }));
  const entry = { id: `c_${now.getTime().toString(36)}`, at: now.toISOString(), source: diff.source, level: diff.level, lines: diffLines(diff), diff: rest, seen: diff.level < 3 };
  const list = [entry, ...readChanges(storage)].slice(0, MAX);
  try { storage?.setItem(CHANGES_KEY, JSON.stringify(list)); } catch { return null; }
  try { globalThis.dispatchEvent?.(new CustomEvent(CHANGES_EVENT)); } catch { /* not a browser */ }
  return entry;
}

export function markSeen(id, storage = globalThis.localStorage) {
  const list = readChanges(storage).map((e) => (e.id === id ? { ...e, seen: true } : e));
  try { storage?.setItem(CHANGES_KEY, JSON.stringify(list)); } catch { /* storage off */ }
}

export function clearChanges(storage = globalThis.localStorage) {
  try { storage?.removeItem(CHANGES_KEY); } catch { /* storage off */ }
  try { globalThis.dispatchEvent?.(new CustomEvent(CHANGES_EVENT)); } catch { /* not a browser */ }
}
