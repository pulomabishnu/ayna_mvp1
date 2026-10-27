import { normalizeRating } from '../../utils/community/reviewRatings.js';

/**
 * Pure helpers for the product page's "What people say" section. Everything
 * here is worked out from real community rows only; nothing is made up when
 * there are no rows.
 */

/** Count, average and a 5-to-1 star breakdown of the reviews that have a rating. */
export function ratingBreakdown(rows) {
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let sum = 0;
  let count = 0;
  for (const r of rows || []) {
    const n = normalizeRating(r?.rating);
    if (!n) continue;
    counts[n] += 1;
    sum += n;
    count += 1;
  }
  return {
    count,
    average: count ? sum / count : null,
    bars: [5, 4, 3, 2, 1].map((stars) => ({ stars, count: counts[stars], pct: count ? Math.round((counts[stars] / count) * 100) : 0 })),
  };
}

const time = (iso) => { const t = Date.parse(iso || ''); return Number.isFinite(t) ? t : 0; };

/**
 * The reviews to show first: most found helpful, then newest. A review with
 * words beats a stars-only one at the same helpful count.
 */
export function topReviews(rows, n = 3) {
  return (rows || [])
    .filter((r) => r && r.id && normalizeRating(r.rating))
    .slice()
    .sort((a, b) => (Number(b.helpful_count) || 0) - (Number(a.helpful_count) || 0)
      || Number(Boolean(String(b.body || '').trim())) - Number(Boolean(String(a.body || '').trim()))
      || time(b.created_at) - time(a.created_at))
    .slice(0, n);
}

/** One line of text, cut at a word near `max` characters. */
export function snippet(text, max = 200) {
  const t = String(text || '')
    // Community bold / underline / italic marks (**x**, __x__, *x*).
    .replace(/\*+|__/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  const sp = cut.lastIndexOf(' ');
  return `${(sp > max * 0.6 ? cut.slice(0, sp) : cut).replace(/[\s,.;:]+$/, '')}…`;
}

/** Who wrote it, without ever naming an anonymous author. */
export function authorName(row) {
  if (!row || row.is_anonymous || !row.author_id) return 'Anonymous member';
  return row.author_display_name || row.author_username || 'ayna member';
}

/** "Oct 19, 2026", or '' for a missing or bad date. */
export function shortDate(iso) {
  const t = time(iso);
  return t ? new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
}

/** The label a community post carries on the product page. */
export function kindLabel(kind) {
  if (kind === 'question') return 'Question';
  if (kind === 'review') return 'Review';
  return 'Post';
}

export function plural(n, one, many = `${one}s`) {
  return `${n} ${n === 1 ? one : many}`;
}
