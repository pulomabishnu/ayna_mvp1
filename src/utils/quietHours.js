/**
 * Quiet-hours helpers for Settings. Times are 'HH:MM' 24-hour local strings,
 * the exact format api/notification-preferences.js accepts (TIME_HHMM) and
 * supabase/notification_preferences.sql checks. A window may wrap past
 * midnight (22:00 -> 07:00).
 */

export const QUIET_TIME_PATTERN = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;

export function isValidQuietTime(value) {
  return typeof value === 'string' && QUIET_TIME_PATTERN.test(value);
}

/**
 * <input type="time"> can hand back 'HH:MM:SS' (some browsers / step values)
 * or '' while the field is half-typed. Returns 'HH:MM' or null.
 */
export function normalizeTimeInput(value) {
  if (typeof value !== 'string') return null;
  const m = value.trim().match(/^(\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?$/);
  if (!m) return null;
  const hhmm = `${m[1]}:${m[2]}`;
  return isValidQuietTime(hhmm) ? hhmm : null;
}

/** null when the window is usable, otherwise an error code. */
export function validateQuietHours(start, end) {
  if (!isValidQuietTime(start) || !isValidQuietTime(end)) return 'invalid_time';
  if (start === end) return 'same_time';
  return null;
}

function toMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

/** Length of the window in minutes, wrapping past midnight. 0 if invalid. */
export function quietHoursDurationMinutes(start, end) {
  if (validateQuietHours(start, end)) return 0;
  const diff = toMinutes(end) - toMinutes(start);
  return diff > 0 ? diff : diff + 24 * 60;
}

/** '22:00' -> '10 PM', '07:30' -> '7:30 AM'. Returns the input if invalid. */
export function formatTime12h(hhmm) {
  if (!isValidQuietTime(hhmm)) return hhmm;
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h < 12 ? 'AM' : 'PM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${h12} ${suffix}` : `${h12}:${String(m).padStart(2, '0')} ${suffix}`;
}

export function formatQuietHoursSummary(enabled, start, end) {
  if (!enabled) return 'Off';
  if (validateQuietHours(start, end)) return 'Pick a start and end time';
  const mins = quietHoursDurationMinutes(start, end);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const length = m === 0 ? `${h} h` : `${h} h ${m} min`;
  return `${formatTime12h(start)} – ${formatTime12h(end)} (${length})`;
}
