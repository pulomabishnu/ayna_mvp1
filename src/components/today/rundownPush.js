/**
 * The one daily notification, "Your daily rundown is ready." (retention
 * checklist b, Today audit v2 section 12: push opt-in roughly doubles
 * retention). Asked once, after her first Daily Rundown, never at sign-up.
 * Her answer and the time she picked stay on this device; the reminder
 * itself goes through /api/today-reminders (kind 'rundown'), one day at a
 * time: each Rundown she opens books the next morning at her time. The
 * server keeps one per local day and respects her notification settings
 * (notification_preferences: notifications off, quiet hours).
 */
import { addDays } from '../../health/dailyLog.js';
import { localAt, scheduleTodayReminder } from '../../health/todayReminders.js';

export const RUNDOWN_PUSH_KEY = 'ayna_rundown_push_v1';
// Nov 3: any half hour from 5:00 am to 11:30 pm (default 8:00 am).
export const RUNDOWN_TIMES = Array.from({ length: 38 }, (_, i) => { const m = 300 + i * 30; return `${String(Math.floor(m / 60)).padStart(2, '0')}:${m % 60 ? '30' : '00'}`; });
export const DEFAULT_RUNDOWN_TIME = '08:00';
export const PUSH_ASK_EVENT = 'ayna:push-ask';

export function readRundownPush(storage = globalThis.localStorage) {
  try {
    const v = JSON.parse(storage?.getItem(RUNDOWN_PUSH_KEY) || 'null');
    // Nov 3 (founder: daily, default 8 am): on unless she turns it off. In the app it still
    // needs the phone's permission, asked in context; the website never books it by default.
    if (!v || typeof v !== 'object') return { answered: false, on: true, time: DEFAULT_RUNDOWN_TIME };
    return { answered: Boolean(v.answered), on: Boolean(v.on), time: RUNDOWN_TIMES.includes(v.time) ? v.time : DEFAULT_RUNDOWN_TIME };
  } catch { return { answered: false, on: true, time: DEFAULT_RUNDOWN_TIME }; }
}

export function writeRundownPush(next, storage = globalThis.localStorage) {
  const v = { ...readRundownPush(storage), ...next };
  try { storage?.setItem(RUNDOWN_PUSH_KEY, JSON.stringify(v)); } catch { /* storage blocked */ }
  return v;
}

/** "8:00 am" from "08:00". */
export function timeLabel(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`;
}

/** Book tomorrow's Rundown notification at her time. @returns the status from scheduleTodayReminder. */
export function bookTomorrow(today, time = DEFAULT_RUNDOWN_TIME, deps = {}) {
  const [h, m] = time.split(':').map(Number);
  return scheduleTodayReminder({ kind: 'rundown', sendAt: localAt(addDays(today, 1), h, m) }, deps);
}

/** After a Rundown opens: if she turned the notification on, book the next one. */
export function rebookIfOn(today, storage = globalThis.localStorage) {
  const p = readRundownPush(storage);
  // In the app: one repeating reminder on the phone (src/mobile/utils/localRundown.js). After
  // her first Rundown is the moment to ask for permission (Apple HIG: ask in context).
  return import('../../mobile/utils/localRundown.js').then(async ({ localRundownAvailable, syncRundownReminder }) => {
    if (localRundownAvailable()) {
      const status = await syncRundownReminder({ ask: !p.answered, pref: p });
      if (!p.answered && status !== 'unavailable') writeRundownPush({ answered: true, on: status === 'scheduled' }, storage);
      return status;
    }
    // Website: the server reminder only when she turned it on herself.
    if (!p.on || !p.answered) return null;
    return bookTomorrow(today, p.time).catch(() => 'error');
  }).catch(() => null);
}

/** Settings: turn the reminder on or off, or change the time. Uses the phone's own reminder in the app. */
export async function applyRundownPref(today, next, storage = globalThis.localStorage) {
  const pref = writeRundownPush({ answered: true, ...next }, storage);
  try {
    const { localRundownAvailable, syncRundownReminder } = await import('../../mobile/utils/localRundown.js');
    if (localRundownAvailable()) return syncRundownReminder({ ask: pref.on, pref });
  } catch { /* fall through to the server reminder */ }
  if (!pref.on) return 'off';
  return bookTomorrow(today, pref.time).catch(() => 'error');
}
