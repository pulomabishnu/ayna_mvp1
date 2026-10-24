/**
 * Her routines (src/health/routines.js) as a React hook, with the changes
 * she can make and an Undo for the last one. Shared by the app and the
 * website, by the full view (NeedRoutines) and the Today summary
 * (RoutineSummary).
 *
 * Needs come from decisionEngine.activeNeeds (her quiz answers, her daily
 * log), unless the caller passes them (Today already has decision.debug.needs).
 * Matches come from the one engine (getProductMatchDetailsForProduct with
 * the caller's matchOpts), never a second score.
 */
import { useCallback, useMemo, useState } from 'react';
import { ALL_PRODUCTS, getProductMatchDetailsForProduct, useCatalogReady } from '../../data/catalog.js';
import { activeNeeds } from '../../health/decisionEngine.js';
import { readLog, todayKey } from '../../health/dailyLog.js';
import { createTry, dueDay, readTries, recordOutcome, removeTry, saveTry, setTriesOwner } from '../../health/outcomes.js';
import { applyTodayAnswers, profileFromIntake } from '../../health/todayState.js';
import { readToday } from '../../health/todayStore.js';
import { syncUserData } from '../../health/userDataSync.js';
import { FOLLOW_UP_HOUR, localAt, scheduleTodayReminder } from '../../health/todayReminders.js';
import { buildRoutines, changeRoutine, readRoutinePrefs, replaceRoutinePrefs, setRoutinePrefsOwner, START_MAX, tryIdFor } from '../../health/routines.js';

const fmtDay = (day) => new Date(`${day}T12:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

const asMap = (v) => {
  if (!v) return {};
  if (Array.isArray(v)) return Object.fromEntries(v.filter((p) => p?.id).map((p) => [p.id, p]));
  return v;
};

/**
 * @param {object} o
 *   userId, quizAnswers, matchOpts
 *   products     her routine (Ecosystem) products, array or { id: product }
 *   saved, omitted   { id: product } maps (Saved and "Not for me")
 *   have         { id: true } "already have it" from the shopping list (app)
 *   needs        optional activeNeeds() result
 *   onAddToRoutine(product), onToggleSaved(product), onNotForMe(product), onToggleHave(id)
 */
export function useRoutines({
  userId = null, quizAnswers = null, matchOpts = null, products = [], saved = {}, omitted = {}, have = {}, needs: needsProp = null,
  onAddToRoutine = null, onToggleSaved = null, onNotForMe = null, onToggleHave = null, showMatch = true,
} = {}) {
  const today = todayKey();
  const catalogReady = useCatalogReady();
  const [version, setVersion] = useState(0);
  const [note, setNote] = useState(null); // { need, text, undo? }
  const [owner, setOwner] = useState(null);
  if (owner !== (userId || 'device')) { setRoutinePrefsOwner(userId); if (userId) setTriesOwner(userId); setOwner(userId || 'device'); }

  const inRoutine = useMemo(() => asMap(products), [products]);
  const savedMap = useMemo(() => asMap(saved), [saved]);
  const omittedMap = useMemo(() => asMap(omitted), [omitted]);

  const prefs = useMemo(() => readRoutinePrefs(), [version, owner]); // eslint-disable-line react-hooks/exhaustive-deps
  const tries = useMemo(() => readTries({ today }), [version, owner, today]); // eslint-disable-line react-hooks/exhaustive-deps

  const profile = useMemo(() => {
    const p = profileFromIntake(quizAnswers);
    return p ? applyTodayAnswers(p, readToday().answers || {}) : null;
  }, [quizAnswers]);
  const needs = useMemo(() => {
    if (needsProp) return needsProp;
    try { return activeNeeds({ profile, logs: Object.values(readLog() || {}), patterns: [], today }); } catch { return {}; }
  }, [needsProp, profile, today, version]); // eslint-disable-line react-hooks/exhaustive-deps

  const detailsFor = useCallback((p) => {
    if (!quizAnswers || !p) return null;
    try { return getProductMatchDetailsForProduct(p, quizAnswers, null, matchOpts || undefined); } catch { return null; }
  }, [quizAnswers, matchOpts]);

  const routines = useMemo(() => {
    // Her own products first so one already in her routine can lead.
    const seen = new Set();
    const catalog = [...Object.values(inRoutine), ...(catalogReady ? ALL_PRODUCTS : [])].filter((p) => p?.id && !seen.has(p.id) && seen.add(p.id));
    const owned = { ...(prefs.owned || {}), ...(have || {}) };
    const built = buildRoutines({ needs, profile, catalog, inRoutine, detailsFor, tries, prefs: { ...prefs, owned }, today, saved: savedMap, omitted: omittedMap });
    if (showMatch) return built;
    // Signed out, cards show no % (the app's rule), so the routine doesn't either.
    const strip = (list) => list.map((it) => (it.percent == null ? it : { ...it, percent: null }));
    return built.map((r) => ({ ...r, start: strip(r.start), other: strip(r.other) }));
  }, [needs, profile, inRoutine, catalogReady, detailsFor, tries, prefs, have, today, savedMap, omittedMap, showMatch]);

  const bump = () => setVersion((v) => v + 1);
  const sync = () => { if (userId) syncUserData({ userId, force: true }).then(bump).catch(() => {}); };

  // Undo: put the routine changes back exactly as they were, and the try too.
  const snapshot = (need, text, { prevPrefs, tryBefore, tryId, external } = {}) => setNote({
    need, text,
    undo: () => {
      if (prevPrefs) replaceRoutinePrefs(prevPrefs);
      if (tryId) { if (tryBefore) saveTry(tryBefore); else removeTry(tryId); sync(); }
      external?.();
      setNote(null);
      bump();
    },
  });

  const act = {
    add(need, item) {
      const prev = readRoutinePrefs();
      const next = changeRoutine(prev, { op: 'add', need, key: item.key });
      if (next.error === 'full') { setNote({ need, text: `Start here holds ${START_MAX}. Remove one first.` }); return; }
      const addedToRoutine = item.kind === 'product' && !inRoutine[item.ref] && onAddToRoutine;
      if (addedToRoutine) onAddToRoutine(item.product);
      bump();
      snapshot(need, `Added ${item.title} to Start here.`, { prevPrefs: prev, external: addedToRoutine ? () => onAddToRoutine(item.product) : null });
    },
    remove(need, item) {
      const prev = readRoutinePrefs();
      changeRoutine(prev, { op: 'remove', need, key: item.key });
      bump();
      snapshot(need, `Moved ${item.title} to Other options.`, { prevPrefs: prev });
    },
    replace(need, item, withItem) {
      const prev = readRoutinePrefs();
      changeRoutine(prev, { op: 'replace', need, key: item.key, with: withItem.key });
      const addedToRoutine = withItem.kind === 'product' && !inRoutine[withItem.ref] && onAddToRoutine;
      if (addedToRoutine) onAddToRoutine(withItem.product);
      bump();
      snapshot(need, `Swapped ${item.title} for ${withItem.title}.`, { prevPrefs: prev, external: addedToRoutine ? () => onAddToRoutine(withItem.product) : null });
    },
    owned(need, item) {
      // The app's shopping list keeps "I have it" already; use that one store there.
      const was = Boolean(item.owned);
      const prev = readRoutinePrefs();
      if (onToggleHave) onToggleHave(item.ref);
      else changeRoutine(prev, { op: 'owned', need, key: item.key });
      bump();
      snapshot(need, was ? `${item.title} is no longer marked as yours.` : `Marked: you already have ${item.title}.`, { prevPrefs: onToggleHave ? null : prev, external: onToggleHave ? () => onToggleHave(item.ref) : null });
    },
    postpone(need, item, days = 7) {
      const prev = readRoutinePrefs();
      changeRoutine(prev, { op: 'postpone', need, key: item.key, days, today });
      bump();
      snapshot(need, `${item.title} is set aside for ${days === 7 ? 'a week' : `${days} days`}.`, { prevPrefs: prev });
    },
    later(need, item) {
      const prev = readRoutinePrefs();
      changeRoutine(prev, { op: 'later', need, key: item.key });
      const savedNow = item.kind === 'product' && !savedMap[item.ref] && onToggleSaved;
      if (savedNow) onToggleSaved(item.product);
      bump();
      snapshot(need, item.kind === 'product' ? `${item.title} is in your Saved for later.` : `${item.title} is saved for later.`, { prevPrefs: prev, external: savedNow ? () => onToggleSaved(item.product) : null });
    },
    notForMe(need, item) {
      const prev = readRoutinePrefs();
      changeRoutine(prev, { op: 'notForMe', need, key: item.key, today });
      const hide = item.kind === 'product' && !omittedMap[item.ref] && onNotForMe;
      if (hide) onNotForMe(item.product);
      bump();
      snapshot(need, `${item.title} won't be suggested again.`, { prevPrefs: prev, external: hide ? () => onNotForMe(item.product) : null });
    },
    restore(need, item) {
      const prev = readRoutinePrefs();
      changeRoutine(prev, { op: 'restore', need, key: item.key });
      if (item.kind === 'product' && omittedMap[item.ref] && onNotForMe) onNotForMe(item.product);
      bump();
      snapshot(need, `${item.title} is back in your options.`, { prevPrefs: prev });
    },
    /** "I'm trying this": a try that ayna follows up on after the horizon. */
    start(need, item) {
      const id = tryIdFor(need, item.key);
      const before = tries.find((t) => t.id === id) || null;
      const t = saveTry(createTry({ id, kind: item.kind === 'product' ? 'product' : 'action', ref: item.ref, product: item.product, need, startedDay: today, horizonDays: item.horizon?.days, interventionKind: item.horizon?.kind }));
      bump();
      sync();
      if (!t) return;
      const due = dueDay(t);
      if (userId) scheduleTodayReminder({ kind: 'follow_up', sendAt: localAt(due, FOLLOW_UP_HOUR) }).catch(() => {});
      snapshot(need, `Started. ayna will ask how it went on ${fmtDay(due)}.`, { tryBefore: before, tryId: id });
    },
    /** Helped / Didn't help / Not sure yet: an outcome on her try (outcomes.js). */
    outcome(need, item, outcome) {
      const id = tryIdFor(need, item.key);
      const existing = tries.find((t) => t.id === id) || item.lastTry || null;
      const base = existing || createTry({ id, kind: item.kind === 'product' ? 'product' : 'action', ref: item.ref, product: item.product, need, startedDay: today, horizonDays: item.horizon?.days, interventionKind: item.horizon?.kind });
      saveTry(recordOutcome(base, outcome, { day: today }));
      bump();
      sync();
      const words = outcome === 'helpful' ? 'Noted: it helped. ayna keeps it in your routine.' : outcome === 'unsure' ? 'Noted. You can answer later.' : 'Noted: it did not help. ayna will not suggest it again.';
      snapshot(need, words, { tryBefore: existing, tryId: existing?.id || id });
    },
    dismissNote() { setNote(null); },
  };

  return { routines, needs, note, act, today, ready: catalogReady };
}

