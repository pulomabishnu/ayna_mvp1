// Daily 3-tap check-in (beta users, Oct 4 meeting): sleep, mood and skin, each
// on a 3-point scale, one answer per day. Kept on this device only (private by
// default, nothing is sent anywhere), so it works signed out and offline.
// Shared by the website (You) and the app (You).

export const CHECKIN_KEY = 'ayna_daily_checkin_v1';
export const CHECKIN_ITEMS = [
  { id: 'sleep', label: 'Sleep', options: ['Rough', 'Okay', 'Good'] },
  { id: 'mood', label: 'Mood', options: ['Low', 'Okay', 'Good'] },
  { id: 'skin', label: 'Skin', options: ['Flared', 'Okay', 'Clear'] },
];

export function dayKey(date = new Date()) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function readCheckins(storage = globalThis.localStorage) {
  try {
    const raw = JSON.parse(storage?.getItem(CHECKIN_KEY) || '{}');
    return raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  } catch {
    return {};
  }
}

/** Saves one answer (1-3) for today; returns the new map. Keeps 120 days. */
export function saveCheckin(itemId, score, { date = new Date(), storage = globalThis.localStorage } = {}) {
  const all = readCheckins(storage);
  const key = dayKey(date);
  const next = { ...all, [key]: { ...(all[key] || {}), [itemId]: score } };
  const keep = Object.keys(next).sort().slice(-120);
  const trimmed = Object.fromEntries(keep.map((k) => [k, next[k]]));
  try { storage?.setItem(CHECKIN_KEY, JSON.stringify(trimmed)); } catch { /* storage blocked: still shown this session */ }
  return trimmed;
}

/** The last 7 days (oldest first) for one item: [{ day, score|null }]. */
export function lastWeek(all, itemId, today = new Date()) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - 6 + i);
    const key = dayKey(d);
    const v = all?.[key]?.[itemId];
    return { day: key, date: d, score: Number.isInteger(v) && v >= 1 && v <= 3 ? v : null };
  });
}

/**
 * One plain-language takeaway for the week (Apple's chart guidance: say what
 * the numbers mean). Needs at least 3 answered days for an item; otherwise a
 * neutral line. Never alarming, never a diagnosis.
 */
export function weekTakeaway(all, today = new Date()) {
  const lines = [];
  for (const item of CHECKIN_ITEMS) {
    const scores = lastWeek(all, item.id, today).map((d) => d.score).filter((s) => s != null);
    if (scores.length < 3) continue;
    const half = Math.floor(scores.length / 2);
    const early = scores.slice(0, half);
    const late = scores.slice(scores.length - half);
    const avg = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
    const diff = avg(late) - avg(early);
    const spread = Math.max(...scores) - Math.min(...scores);
    if (diff >= 0.5) lines.push({ item, text: `${item.label} has been better lately.` });
    else if (diff <= -0.5) lines.push({ item, text: `${item.label} has been rougher lately.` });
    else if (spread === 0) lines.push({ item, text: `${item.label} has been steady this week.` });
  }
  if (lines.length) return lines[0].text;
  const answered = Object.keys(all || {}).length;
  return answered ? 'A few more days and your week will show a pattern.' : 'Three taps a day. Your week shows up here.';
}
