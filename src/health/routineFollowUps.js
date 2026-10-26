/**
 * "Add to routine" follow-ups (retention checklist d and e, Today audit v2
 * section 12). When she adds a product to her routine:
 *   day 7     a follow-up nudge ("Your ayna check-in is ready")
 *   cycle 3   a second nudge, and from that day Today asks for a review
 *             ("You've used it for 3 cycles. How is it going?")
 * Cycle 3 uses her own average cycle length when ayna has one, else 28 days.
 * The nudges go through /api/today-reminders (kind 'follow_up'), so the lock
 * screen never says what they are about. Which product they are for stays on
 * this device (owner-scoped key, like the rest of Today).
 */
import { addDays, todayKey } from './dailyLog.js';
import { FOLLOW_UP_HOUR, localAt, scheduleTodayReminder } from './todayReminders.js';

export const ROUTINE_FOLLOWUPS_KEY = 'ayna_routine_followups_v1';
export const FIRST_CHECK_DAYS = 7;
export const REVIEW_CYCLES = 3;
const DEFAULT_CYCLE = 28;
const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);

export function readRoutineFollowUps(storage = globalThis.localStorage) {
  try { const v = JSON.parse(storage?.getItem(ROUTINE_FOLLOWUPS_KEY) || '{}'); return isObj(v) ? v : {}; } catch { return {}; }
}
function write(map, storage) {
  try { storage?.setItem(ROUTINE_FOLLOWUPS_KEY, JSON.stringify(map)); } catch { /* storage blocked */ }
  return map;
}

/** The two dates for a product added on `today`. */
export function followUpDays(today, cycleLength = null) {
  const len = Number.isFinite(cycleLength) && cycleLength >= 21 && cycleLength <= 45 ? Math.round(cycleLength) : DEFAULT_CYCLE;
  return { day7: addDays(today, FIRST_CHECK_DAYS), cycle3: addDays(today, REVIEW_CYCLES * len) };
}

/**
 * She added `product` to her routine: remember it and book both nudges.
 * Re-adding the same product keeps the first dates. Returns the record.
 */
export function noteRoutineAdd(product, { today = todayKey(), cycleLength = null, storage = globalThis.localStorage, schedule = scheduleTodayReminder } = {}) {
  if (!product?.id) return null;
  const map = readRoutineFollowUps(storage);
  if (map[product.id] && !map[product.id].removed) return map[product.id];
  const rec = { addedDay: today, ...followUpDays(today, cycleLength), review: null };
  write({ ...map, [product.id]: rec }, storage);
  for (const day of [rec.day7, rec.cycle3]) {
    Promise.resolve(schedule({ kind: 'follow_up', sendAt: localAt(day, FOLLOW_UP_HOUR) })).catch(() => {});
  }
  return rec;
}

/** Taken out of her routine: no review ask for it. */
export function noteRoutineRemove(productId, storage = globalThis.localStorage) {
  const map = readRoutineFollowUps(storage);
  if (!map[productId]) return map;
  return write({ ...map, [productId]: { ...map[productId], removed: true } }, storage);
}

/** 'written' (she opened the review) or 'later' (asked again in 14 days) or 'no' (never again). */
export function markReviewAsk(productId, answer, { today = todayKey(), storage = globalThis.localStorage } = {}) {
  const map = readRoutineFollowUps(storage);
  if (!map[productId]) return map;
  const review = answer === 'later' ? { answer, until: addDays(today, 14) } : { answer };
  return write({ ...map, [productId]: { ...map[productId], review } }, storage);
}

/** Products in her routine for 3 cycles that she has not been asked about (oldest first). */
export function reviewsDue({ today = todayKey(), inRoutine = null, storage = globalThis.localStorage } = {}) {
  const ids = inRoutine ? new Set(inRoutine.map((p) => p?.id).filter(Boolean).map(String)) : null;
  return Object.entries(readRoutineFollowUps(storage))
    .filter(([id, r]) => (!ids || ids.has(id)) && !r.removed && r.cycle3 && r.cycle3 <= today && (!r.review || (r.review.answer === 'later' && r.review.until <= today)))
    .sort((a, b) => a[1].addedDay.localeCompare(b[1].addedDay))
    .map(([id, r]) => ({ productId: id, ...r }));
}
