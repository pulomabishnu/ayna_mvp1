/**
 * Today, as a React hook: her real data in, decide() out, and the small
 * actions Today offers (Useful, Not relevant, Show options, answers,
 * outcomes, Try this, Remind me tonight).
 *
 * Local first: the daily log and tries live on the device (useDailyLog,
 * outcomes.js) and sync when she is signed in; Today's own memory (seen,
 * dismissed, triage, answers) stays on the device (todayStore.js).
 * Analytics carry no health details (todayAnalytics.js).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { decide, dismiss, markInteracted, markShown } from './decisionEngine.js';
import { INTERVENTION_CLASSES } from './interventions.js';
import { addDays, todayKey } from './dailyLog.js';
import { createTry, dueDay, readTries, recordOutcome, saveTry } from './outcomes.js';
import { useDailyLog } from './useDailyLog.js';
import { syncUserData } from './userDataSync.js';
import { readToday, setTodayOwner, writeToday } from './todayStore.js';
import { buildTodayState, daysLogged } from './todayState.js';
import { historyBucket, trackToday } from './todayAnalytics.js';
import { FOLLOW_UP_HOUR, localAt, scheduleTodayReminder, tonightAt } from './todayReminders.js';
import { ALL_PRODUCTS, useCatalogReady } from '../data/catalog.js';

const fmtDay = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
const REMIND_NOTE = {
  scheduled: 'We will send “Your ayna check-in is ready” to your phone tonight, if notifications are on in the ayna app.',
  signed_out: 'Sign in to get a reminder on your phone.',
  offline: 'You are offline, so we could not set the reminder. Try again when you are back online.',
  error: 'We could not set the reminder. Try again in a moment.',
};

export function useToday({ userId = null, intake = null, healthRows = [], cycle = null, hormonalBC = false, products = [], today: todayProp = null, fixture = null } = {}) {
  const today = todayProp || todayKey();
  const daily = useDailyLog(userId);
  const log = fixture?.log || daily.log;
  const [store, setStore] = useState(() => { setTodayOwner(userId); return readToday(); });
  const [ownerSeen, setOwnerSeen] = useState(userId);
  if (ownerSeen !== userId) { setTodayOwner(userId); setOwnerSeen(userId); setStore(readToday()); }
  const [triesVersion, setTriesVersion] = useState(0);
  const [intent, setIntent] = useState(null);
  const [notes, setNotes] = useState({});
  const catalogReady = useCatalogReady();

  // Re-read tries whenever the log hook syncs (it rewrites both) or we change one.
  const tries = useMemo(() => fixture?.tries || readTries({ today }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [today, triesVersion, daily.log, fixture]);
  // The catalog only matters once she asked for options (products stay out otherwise).
  const catalog = intent?.showOptions && catalogReady ? ALL_PRODUCTS : products;

  const state = useMemo(() => buildTodayState({
    today, log, tries, intake, healthRows, cycle, hormonalBC, store: fixture?.store ? { ...store, ...fixture.store } : store, intent, products: catalog,
  }), [today, log, tries, intake, healthRows, cycle, hormonalBC, store, intent, catalog, fixture]);
  const decision = useMemo(() => decide(state), [state]);

  const put = useCallback((part, value) => setStore(writeToday(part, value)), []);
  const note = useCallback((id, text) => setNotes((n) => ({ ...n, [id]: text })), []);
  const sync = useCallback(() => { if (userId) syncUserData({ userId, force: true }).then(() => setTriesVersion((v) => v + 1)).catch(() => {}); }, [userId]);

  // Shown: remember it (novelty decay) and log the decision, once per distinct set.
  const shownKey = `${today}|${decision.output}|${decision.items.map((i) => i.id).join(',')}`;
  const logged = useRef(null);
  useEffect(() => {
    if (logged.current === shownKey) return;
    logged.current = shownKey;
    if (decision.items.length) setStore(writeToday('seen', markShown(readToday().seen, decision.items, today)));
    trackToday('today_items_shown', {
      count: decision.items.length,
      types: [...new Set(decision.items.map((i) => i.type))],
      tiers: [...new Set(decision.items.map((i) => i.tier))],
      output: decision.output,
      history: historyBucket(daysLogged(log)),
    });
    const due = decision.items.filter((i) => i.type === 'follow_up').length;
    if (due) trackToday('followup_due', { count: due });
  }, [shownKey, decision, today, log]);

  const action = (item, name) => trackToday('today_item_action', { type: item.type, action: name });

  const api = {
    useful(item) {
      put('seen', markInteracted(store.seen, item.id, today));
      note(item.id, 'Thanks. ayna will keep this in mind.');
      action(item, 'useful');
    },
    notRelevant(item) {
      setStore(writeToday('dismissed', dismiss(store.dismissed, item, today)));
      put('seen', markInteracted(readToday().seen, item.id, today));
      action(item, 'not_relevant');
    },
    showOptions(item, need) {
      setIntent({ showOptions: true, need: need || item?.need || undefined });
      if (item) { put('seen', markInteracted(store.seen, item.id, today)); action(item, 'show_options'); }
    },
    answerTriage(item, answers) {
      put('triage', { ...answers, day: today });
      action(item, 'answer');
    },
    answerSafety(item, field, value) {
      put('answers', { ...store.answers, [field]: value, at: new Date().toISOString() });
      action(item, 'answer');
    },
    recordOutcome(item, outcome) {
      const t = tries.find((x) => x.id === item.basis?.tryId);
      if (!t) return;
      saveTry(recordOutcome(t, outcome, { day: today }));
      setTriesVersion((v) => v + 1);
      sync();
      trackToday('followup_completed', { completed: true });
      action(item, 'answer');
    },
    startTry(item, act) {
      const cls = INTERVENTION_CLASSES[act.classId];
      if (!cls) return;
      const saved = saveTry(createTry({ kind: 'action', ref: cls.id, need: act.need, startedDay: today, horizonDays: act.horizonDays || cls.followUpDays }));
      setTriesVersion((v) => v + 1);
      sync();
      action(item, 'start_try');
      if (!saved) return;
      const due = dueDay(saved);
      note(item.id, `Started. ayna will ask how it went on ${fmtDay(due)}.`);
      if (userId) scheduleTodayReminder({ kind: 'follow_up', sendAt: localAt(due, FOLLOW_UP_HOUR) }).catch(() => {});
    },
    async remindTonight(item) {
      action(item, 'remind');
      const already = store.reminders?.[today]?.tonight;
      if (already) { note(item.id, REMIND_NOTE.scheduled); return; }
      const status = await scheduleTodayReminder({ kind: 'tonight', sendAt: tonightAt(today) });
      if (status === 'scheduled') put('reminders', { ...Object.fromEntries(Object.entries(store.reminders || {}).filter(([d]) => d >= addDays(today, -7))), [today]: { tonight: true } });
      note(item.id, REMIND_NOTE[status] || REMIND_NOTE.error);
    },
    opened(item) { action(item, 'open'); },
  };

  return {
    today, decision, notes, intent, store,
    log, saveLog: daily.save, saveState: daily.saveState,
    remindedTonight: Boolean(store.reminders?.[today]?.tonight),
    ...api,
  };
}
