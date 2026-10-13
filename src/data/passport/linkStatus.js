/**
 * Results of the weekly link check (scripts/passport/check-links.mjs), read
 * from scripts/passport/link-status.json when that file exists. When it does
 * not (fresh checkout, or plain Node without Vite), every link is simply
 * "not checked": nothing is marked unavailable without a real check.
 *
 * File shape (written by the script):
 *   { generated_at, previous_generated_at, urls: { [url]: {
 *       kinds: ['purchase'|'source'], product_ids: [], status, ok, final_url,
 *       redirected, content_hash, previous_hash, changed, checked_at, error } } }
 */
// Vite (app, vitest) replaces this call at build time; in plain Node it throws and we fall back to none.
let files = {};
try {
  files = import.meta.glob('../../../scripts/passport/link-status.json', { eager: true, import: 'default' });
} catch {
  files = {};
}

export const LINK_STATUS = Object.values(files)[0] || null;

/** HTTP status -> link state. Bot blocks (401/403/429) and timeouts are "unverified", never "unavailable". */
export function linkStateFor(rec) {
  if (!rec) return 'not_checked';
  if (rec.status === 404 || rec.status === 410) return 'unavailable';
  if (rec.ok || (rec.status >= 200 && rec.status < 400)) return 'live';
  return 'unverified';
}

/** The link-check record for one URL in a link-status file, or null when not checked. */
export function linkRecord(links, url) {
  if (!url) return null;
  const rec = links?.urls?.[url];
  if (!rec) return null;
  return {
    url,
    state: linkStateFor(rec),
    status: rec.status ?? null,
    final_url: rec.final_url || null,
    redirected: Boolean(rec.redirected),
    changed: Boolean(rec.changed),
    content_hash: rec.content_hash || null,
    checked_at: rec.checked_at || links.generated_at || null,
    error: rec.error || null,
  };
}
