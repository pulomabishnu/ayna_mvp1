/**
 * chunkReload.js
 *
 * A tab left open across a deploy still points at the old hashed chunks, so
 * the next lazy import 404s ("Failed to fetch dynamically imported module").
 * We reload once to pick up the new deploy. These helpers keep that to ONE
 * reload: the flag lives in sessionStorage and is only cleared after the page
 * has stayed up for STABLE_AFTER_MS, so a deploy that is really broken shows
 * the error screen instead of reloading forever.
 *
 * Before (Nov 13): the ErrorBoundary cleared the flag the moment it mounted,
 * which happens before a lazy chunk fails, so a chunk that kept failing could
 * reload in a loop. If sessionStorage can't be written, we don't reload at
 * all, for the same reason.
 */

export const CHUNK_RELOAD_KEY = 'ayna_chunk_reload_attempted';
export const STABLE_AFTER_MS = 10000;

export function isChunkLoadError(error) {
  return /Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed|Unable to preload CSS/i.test(
    String(error?.message || error || '')
  );
}

/**
 * True if this page may reload now (and records that it did). False if it
 * already reloaded in this tab recently, or storage is unavailable.
 */
export function claimChunkReload(storage) {
  try {
    if (!storage || storage.getItem(CHUNK_RELOAD_KEY) === '1') return false;
    storage.setItem(CHUNK_RELOAD_KEY, '1');
    return storage.getItem(CHUNK_RELOAD_KEY) === '1';
  } catch {
    return false;
  }
}

/** After the page has stayed up a while, allow a later stale-deploy reload. */
export function scheduleChunkReloadReset(storage, setTimer = setTimeout) {
  return setTimer(() => {
    try { storage?.removeItem(CHUNK_RELOAD_KEY); } catch { /* storage unavailable */ }
  }, STABLE_AFTER_MS);
}
