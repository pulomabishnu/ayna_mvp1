/**
 * One pattern for every async action (web and app): a request can never hang
 * forever, and when the network is the problem she gets a plain sentence, not
 * "Failed to fetch" / "Load failed" (Safari/WKWebView) or an endless spinner.
 *
 * Callers keep their own try/catch and keep the form's input in state; this
 * only guarantees the promise settles and that err.message is readable.
 * "Try again" is the caller's existing submit button.
 */

export const DEFAULT_TIMEOUT_MS = 30000;
/** Model-backed routes run up to 60s on Vercel (vercel.json maxDuration). */
export const AI_TIMEOUT_MS = 65000;

export const OFFLINE_MESSAGE = "You're offline. Nothing you typed was lost. Try again when you're connected.";
export const TIMEOUT_MESSAGE = 'This is taking longer than it should. Check your connection and try again.';
export const UNREACHABLE_MESSAGE = "We couldn't reach ayna. Check your connection and try again.";

export class NetworkError extends Error {
  constructor(kind, message, cause) {
    super(message);
    this.name = 'NetworkError';
    this.kind = kind; // 'offline' | 'timeout' | 'unreachable'
    this.cause = cause;
  }
}

function isOffline() {
  try { return typeof navigator !== 'undefined' && navigator.onLine === false; } catch { return false; }
}

/** True for the errors fetch throws when the request never got a response. */
export function isNetworkError(err) {
  if (!err) return false;
  if (err instanceof NetworkError) return true;
  if (err.name === 'AbortError' || err.name === 'TimeoutError') return true;
  // Chrome "Failed to fetch", Safari/WKWebView "Load failed", Firefox "NetworkError when attempting…"
  return err.name === 'TypeError' && /fetch|load failed|network/i.test(String(err.message || ''));
}

/** A sentence she can act on for any error; falls back to the caller's copy. */
export function friendlyErrorMessage(err, fallback = 'Something went wrong. Try again.') {
  if (err instanceof NetworkError) return err.message;
  if (isOffline()) return OFFLINE_MESSAGE;
  if (err?.name === 'AbortError' || err?.name === 'TimeoutError') return TIMEOUT_MESSAGE;
  if (isNetworkError(err)) return UNREACHABLE_MESSAGE;
  return err?.message || fallback;
}

function toNetworkError(err, timedOut) {
  if (isOffline()) return new NetworkError('offline', OFFLINE_MESSAGE, err);
  if (timedOut) return new NetworkError('timeout', TIMEOUT_MESSAGE, err);
  return new NetworkError('unreachable', UNREACHABLE_MESSAGE, err);
}

/**
 * fetch() that always settles: aborts after `timeoutMs` (default 30s) and
 * turns network failures into a NetworkError with a readable message. A
 * caller's own AbortSignal is respected (its abort is passed through as-is,
 * so a deliberate cancel is not reported as a network problem).
 */
const AI_ROUTES = /\/api\/(ask-ayna|product-chat|llm-recommendations|product-insights|search-suggestions|health-extract|research-product)\b/;

/** Default ceiling for a URL: model-backed routes get the longer one. */
export function timeoutFor(input) {
  const url = typeof input === 'string' ? input : input?.url || '';
  return AI_ROUTES.test(url) ? AI_TIMEOUT_MS : DEFAULT_TIMEOUT_MS;
}

export async function fetchWithTimeout(input, init = {}, timeoutMs = timeoutFor(input), fetchImpl) {
  const doFetch = fetchImpl || globalThis.fetch.bind(globalThis);
  if (isOffline()) throw new NetworkError('offline', OFFLINE_MESSAGE);
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs);
  const outer = init?.signal;
  const onOuterAbort = () => controller.abort();
  if (outer) {
    if (outer.aborted) controller.abort();
    else outer.addEventListener('abort', onOuterAbort, { once: true });
  }
  try {
    return await doFetch(input, { ...init, signal: controller.signal });
  } catch (err) {
    if (outer?.aborted && !timedOut) throw err;
    if (timedOut || isNetworkError(err)) throw toNetworkError(err, timedOut);
    throw err;
  } finally {
    clearTimeout(timer);
    if (outer) outer.removeEventListener('abort', onOuterAbort);
  }
}

/**
 * The fetch handed to supabase-js (global.fetch), so every database, auth
 * and storage call has a ceiling too. Uploads get longer than queries.
 */
export function supabaseFetch(input, init) {
  const url = typeof input === 'string' ? input : input?.url || '';
  const ms = /\/storage\/v1\//.test(url) ? 90000 : DEFAULT_TIMEOUT_MS;
  return fetchWithTimeout(input, init, ms);
}
