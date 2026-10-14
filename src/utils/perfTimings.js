// Non-sensitive performance timing marks, reported to PostHog.
//
// Each mark is the number of milliseconds between opening the page
// (navigation start) and a named app moment: shell visible, auth resolved,
// ecosystem first render, community feed first render. Nothing else rides
// along: no health answers, no queries, no identifiers, just a name and a
// duration, which is exactly what the founder asked to see in PostHog.
//
// Rules:
//  - fires at most once per page load per mark (first paint-ish moments only)
//  - never throws: analytics must not be able to break the app
//  - only sends when PostHog is initialized AND capturing (main.jsx handles
//    consent/GPC/founder opt-outs; window.posthog is only set in `loaded`)
//  - also records a performance.mark() so the numbers are visible in
//    DevTools/Playwright without PostHog

const sent = new Set();
const pending = [];
let flushTimer = null;

function nowSinceNavStart() {
  try {
    return Math.round(performance.now());
  } catch {
    return null;
  }
}

function posthogReady() {
  try {
    const ph = typeof window !== 'undefined' ? window.posthog : null;
    if (!ph || typeof ph.capture !== 'function') return false;
    // Respect opt-out: has_opted_out_capturing is the SDK's own check.
    if (typeof ph.has_opted_out_capturing === 'function' && ph.has_opted_out_capturing()) return false;
    return true;
  } catch {
    return false;
  }
}

function send(name, ms) {
  try {
    window.posthog.capture('perf_timing', {
      perfMark: name,
      ms,
      // Coarse, non-identifying context that makes the numbers comparable.
      connection: (navigator.connection && navigator.connection.effectiveType) || 'unknown',
    });
    return true;
  } catch {
    return false;
  }
}

function flushPending() {
  if (!posthogReady()) return false;
  while (pending.length) {
    const item = pending.shift();
    send(item.name, item.ms);
  }
  return true;
}

/**
 * Record a named timing mark, once per page load.
 * markPerf('shell_visible') → PostHog event perf_timing { perfMark, ms }.
 *
 * PostHog initializes asynchronously (and may stay off entirely: no key, or
 * consent denied). Marks taken before it is ready are buffered with their
 * TRUE timestamp and flushed on a short retry; if PostHog never comes up the
 * buffer is dropped after ~10s, silently.
 */
export function markPerf(name) {
  try {
    if (!name || sent.has(name)) return;
    sent.add(name);

    const ms = nowSinceNavStart();
    if (ms == null) return;

    try { performance.mark(`ayna:${name}`); } catch { /* older browsers */ }

    if (posthogReady()) {
      flushPending();
      send(name, ms);
      return;
    }

    pending.push({ name, ms });
    if (!flushTimer && typeof window !== 'undefined') {
      let attempts = 0;
      flushTimer = window.setInterval(() => {
        attempts += 1;
        if (flushPending() || attempts >= 20) {
          window.clearInterval(flushTimer);
          flushTimer = null;
          if (attempts >= 20) pending.length = 0; // analytics never came up; drop
        }
      }, 500);
    }
  } catch {
    // Perf reporting must never break the app.
  }
}

/** Test hook: reset module state between vitest cases. */
export function __resetPerfTimingsForTests() {
  sent.clear();
  pending.length = 0;
  if (flushTimer && typeof window !== 'undefined') {
    try { window.clearInterval(flushTimer); } catch { /* jsdom teardown */ }
  }
  flushTimer = null;
}
