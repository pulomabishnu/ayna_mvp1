// TEMPORARY (2026-09-16) — debugging the native Google sign-in hang.
// Logs to console AND persists to localStorage in a rolling buffer, so the
// full trace survives across app relaunches / a Web Inspector console that
// wasn't open yet when the earliest lines fired. Dump it anytime with:
//   JSON.parse(localStorage.getItem('ayna_debug_log_v1')).map(e => new Date(e.t).toISOString() + ' ' + e.msg).join('\n')
// Remove this whole file (and its call sites) once the real cause is found.
const KEY = 'ayna_debug_log_v1';
const MAX_ENTRIES = 300;

export function debugLog(...args) {
  console.log('[AYNA-DEBUG]', ...args);
  try {
    const msg = args
      .map((a) => (typeof a === 'string' ? a : JSON.stringify(a)))
      .join(' ');
    const existing = JSON.parse(localStorage.getItem(KEY) || '[]');
    existing.push({ t: Date.now(), msg });
    localStorage.setItem(KEY, JSON.stringify(existing.slice(-MAX_ENTRIES)));
  } catch {
    /* private mode / storage full — console.log above still ran */
  }
}
