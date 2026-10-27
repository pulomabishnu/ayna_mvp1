/**
 * Human QA decisions per product (spec 16, 35). Empty on purpose: every
 * product starts as "Not reviewed". A reviewer adds an entry when they check
 * a product against its real sources, for example:
 *
 *   'p-cora-disc': {
 *     qa_status: 'verified',            // not_reviewed | in_review | needs_correction | verified | needs_clinician_review
 *     reviewed_by: 'Name, role',
 *     reviewed_at: '2026-10-20',
 *     notes: 'Checked brand page and label photo.',
 *     facts: {                          // verified facts override the catalog-derived ones
 *       'pricing.price': { value: '$10 for 32', source: 'brand website', source_type: 'brand', verified_at: '2026-10-20' },
 *     },
 *   },
 *
 * Never mark a product verified without checking it against a real source.
 */
import batch1 from './reviews/batch-1.js';
import batch2 from './reviews/batch-2.js';
import batch3 from './reviews/batch-3.js';
import batch4 from './reviews/batch-4.js';
import batch5 from './reviews/batch-5.js';
import batch6 from './reviews/batch-6.js';

const EARLIER = { ...batch1, ...batch2, ...batch3, ...batch4, ...batch5 };
// Batch 6 adds facts to a product; it never replaces an earlier review of it.
for (const [id, entry] of Object.entries(batch6)) {
  EARLIER[id] = EARLIER[id] ? { ...EARLIER[id], facts: { ...(EARLIER[id].facts || {}), ...entry.facts } } : entry;
}
export const PASSPORT_REVIEWS = EARLIER;
