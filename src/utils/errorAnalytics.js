/**
 * Error details for PostHog that are useful for debugging but safe in a health
 * product. Raw error messages can carry user-entered text (a search, a
 * symptom), so every message goes through redactErrorMessage first:
 * quoted strings, URLs/query strings, emails, long numbers and ids are
 * replaced, and the result is capped. The key is `errorMessage`, not
 * `message`: main.jsx's before_send strips any property named `message`.
 */

const MAX_MESSAGE = 160;

export function redactErrorMessage(raw) {
  if (raw == null) return '';
  let s = String(raw);
  s = s.replace(/\s+/g, ' ').trim();
  // Quoted text is where user input ends up ("Cannot find 'vaginal dryness'").
  s = s.replace(/"[^"]*"|'[^']*'|`[^`]*`|“[^”]*”|‘[^’]*’/g, '"…"');
  s = s.replace(/\b[\w.+-]+@[\w-]+\.[\w.-]+\b/g, '[email]');
  s = s.replace(/\b(?:https?|capacitor|file):\/\/\S+/gi, '[url]');
  s = s.replace(/\?\S*/g, '?[query]');
  s = s.replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, '[id]');
  s = s.replace(/\d{4,}/g, '[n]');
  if (s.length > MAX_MESSAGE) s = `${s.slice(0, MAX_MESSAGE - 1)}…`;
  return s;
}

/**
 * Nearest named React component from an ErrorBoundary componentStack,
 * e.g. "\n    at ProductCard (…)\n    at Discovery (…)" -> "ProductCard".
 * Minified production names (one or two letters) are skipped.
 */
export function componentFromStack(componentStack) {
  if (!componentStack) return '';
  const lines = String(componentStack).split('\n');
  for (const line of lines) {
    const m = line.match(/^\s*(?:at|in)\s+([A-Za-z_$][\w$.]*)/);
    if (!m) continue;
    const name = m[1];
    if (/^(Suspense|ErrorBoundary|StrictMode|Fragment|Lazy|div|span|main|section)$/.test(name)) continue;
    if (name.length <= 2) continue;
    return name.slice(0, 64);
  }
  return '';
}

/** Properties for an app_error event. $pathname comes from posthog-js. */
// Production builds minify component names, so the stack often has none.
// The app records its current screen (App.jsx / MobileApp.jsx set
// window.__aynaView) and that is used when the stack gives nothing.
export function appErrorProperties(error, info, { isChunkLoadError = false, view = '' } = {}) {
  const screen = String(view || '').slice(0, 64);
  const props = {
    errorName: String(error?.name || 'Error').slice(0, 64),
    errorMessage: redactErrorMessage(error?.message),
    component: componentFromStack(info?.componentStack) || screen || 'unknown',
    view: screen || 'unknown',
    isChunkLoadError: Boolean(isChunkLoadError),
  };
  if (error?.code != null) props.errorCode = String(error.code).slice(0, 64);
  if (Number.isFinite(Number(error?.status))) props.status = Number(error.status);
  return props;
}
