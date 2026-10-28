/**
 * "Add to routine" follow-ups. When she adds a product to her routine:
 *   day 7     a follow-up nudge
 *   cycle 3   a second nudge and review ask
 *
 * Analytics records only product/catalog ids and the action. It never records
 * cycle dates, health answers, reminder text, or review text.
 */
import { addDays, todayKey } from './dailyLog.js';
import { FOLLOW_UP_HOUR, localAt, scheduleTodayReminder } from './todayReminders.js';
import { EVENTS, analyticsId, eventSurface, trackEvent } from '../utils/analyticsEvents.js';

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

/** She added `product` to her routine. Re-adding keeps the first dates. */
export function noteRoutineAdd(product, { today = todayKey(), cycleLength = null, storage = globalThis.localStorage, schedule = scheduleTodayReminder } = {}) {
  if (!product?.id) return null;
  const map = readRoutineFollowUps(storage);
  if (map[product.id] && !map[product.id].removed) return map[product.id];
  const rec = { addedDay: today, ...followUpDays(today, cycleLength), review: null };
  write({ ...map, [product.id]: rec }, storage);
  trackEvent(EVENTS.ROUTINE_PRODUCT_ADDED, {
    surface: eventSurface(),
    product_id: String(product.id),
    brand_id: analyticsId(product.brand),
    category: analyticsId(product.category),
  });
  for (const day of [rec.day7, rec.cycle3]) {
    Promise.resolve(schedule({ kind: 'follow_up', sendAt: localAt(day, FOLLOW_UP_HOUR) })).catch(() => {});
  }
  return rec;
}

/** Taken out of her routine: no review ask for it. */
export function noteRoutineRemove(productId, storage = globalThis.localStorage) {
  const map = readRoutineFollowUps(storage);
  if (!map[productId]) return map;
  const out = write({ ...map, [productId]: { ...map[productId], removed: true } }, storage);
  trackEvent(EVENTS.ROUTINE_PRODUCT_REMOVED, { surface: eventSurface(), product_id: String(productId) });
  return out;
}

/** 'written' (opened review), 'later' (ask again in 14 days), or 'no'. */
export function markReviewAsk(productId, answer, { today = todayKey(), storage = globalThis.localStorage } = {}) {
  const map = readRoutineFollowUps(storage);
  if (!map[productId]) return map;
  const review = answer === 'later' ? { answer, until: addDays(today, 14) } : { answer };
  return write({ ...map, [productId]: { ...map[productId], review } }, storage);
}

/** Products in her routine for 3 cycles that she has not been asked about. */
export function reviewsDue({ today = todayKey(), inRoutine = null, storage = globalThis.localStorage } = {}) {
  const ids = inRoutine ? new Set(inRoutine.map((p) => p?.id).filter(Boolean).map(String)) : null;
  return Object.entries(readRoutineFollowUps(storage))
    .filter(([id, r]) => (!ids || ids.has(id)) && !r.removed && r.cycle3 && r.cycle3 <= today && (!r.review || (r.review.answer === 'later' && r.review.until <= today)))
    .sort((a, b) => a[1].addedDay.localeCompare(b[1].addedDay))
    .map(([id, r]) => ({ productId: id, ...r }));
}
