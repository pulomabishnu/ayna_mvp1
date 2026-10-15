/**
 * One answer per question for a product (pass 5): every place on the site that
 * says something about recalls reads it from here, so the Buy box, the header
 * and the Safety section can never disagree.
 *
 * recallFacts(product) → { status, label, detail }
 *   status 'none'     a recall check found nothing ("No recalls found.")
 *   status 'past'     the record names a recall (e.g. "2021 Lounger recall")
 *   status 'note'     a flagged concern that is not a recall (lawsuit, label note)
 *   status 'unknown'  nothing checked ("N/A", "Check current regulator…",
 *                     or only the brand's own site was read)
 */
const clean = (v) => String(v ?? '').replace(/\s+/g, ' ').trim();

export function recallFacts(product) {
  const text = clean(product?.safety?.recalls);
  if (!text || /^(n\/?a|none|unknown|-)\.?$/i.test(text)) return { status: 'unknown', label: 'Recall check not on file', detail: '' };
  if (text.includes('⚠') || /lawsuit|class[- ]action|settled|not a recall/i.test(text)) return { status: 'note', label: 'Safety note on file', detail: text.replace(/^⚠️?\s*/, '') };
  // Only the brand's own site, or a "check current notices" reminder: not a check.
  if (/^check current/i.test(text) || /mentioned on [a-z0-9.-]+\.[a-z]{2,}/i.test(text) || /no product-specific recall (is listed|source)/i.test(text) || /not yet released/i.test(text)) {
    return { status: 'unknown', label: 'Recall check not on file', detail: '' };
  }
  if (/^no\b[^.]*\brecalls?\b/i.test(text)) return { status: 'none', label: 'No recalls found', detail: text };
  if (/\brecall(ed|s)?\b/i.test(text)) return { status: 'past', label: 'Past recall on file', detail: text };
  return { status: 'unknown', label: 'Recall check not on file', detail: '' };
}
