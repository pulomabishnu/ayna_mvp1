import { addDays } from './dailyLog.js';

/**
 * Her logging streak from the days she logged (Home, founder Oct 26: "how many
 * days you logged, like a log streak"). Consecutive days ending today, or
 * ending yesterday when today is not logged yet (the streak is still alive).
 * Also the last 7 days for the dot row, oldest first.
 *
 *   logStreak(['2026-10-25', '2026-10-26'], '2026-10-27') -> { count: 2, loggedToday: false, week: [{ day, on, today }] }
 */
export function logStreak(days = [], today) {
  const set = new Set(days);
  const loggedToday = set.has(today);
  let count = 0;
  let d = loggedToday ? today : addDays(today, -1);
  while (set.has(d)) { count += 1; d = addDays(d, -1); }
  const week = Array.from({ length: 7 }, (_, i) => { const day = addDays(today, i - 6); return { day, on: set.has(day), today: day === today }; });
  return { count, loggedToday, week };
}
