import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import {
  normalizeRating, ratingLabel, summarizeReviewRows, statsFromViewRows, loadProductReviewStats,
  mergeReviewBuckets, requestProductTab, takeProductTab,
} from './reviewRatings.js';
import { createPost, updatePost, deletePost, listProductReviews } from './communityStore.js';
import { getAynaRating, getAynaRatingCount } from '../../data/aynaReviews.js';
import { RatingStars } from '../../components/community/RatingStars.jsx';

// A tiny in-memory stand-in for the Supabase client: community_posts is the
// table, community_feed_posts the view (visible rows only), and the stats view
// is "not created yet" unless `withStatsView` is set.
function fakeSupabase({ withStatsView = false } = {}) {
  const posts = [];
  let nextId = 1;
  const visible = () => posts.filter((p) => p.status === 'visible');
  const query = (table) => {
    const filters = [];
    let op = 'select';
    let payload = null;
    const rowsFor = () => {
      if (table === 'community_product_review_stats') {
        const s = summarizeReviewRows(visible().filter((p) => p.kind === 'review'));
        return Object.entries(s).map(([product_id, v]) => ({ product_id, review_count: v.count, average_rating: v.average, ...Object.fromEntries([1, 2, 3, 4, 5].map((n) => [`rating_${n}`, v.histogram[n]])) }));
      }
      const base = table === 'community_feed_posts' ? visible() : posts;
      return base.filter((r) => filters.every(([k, v]) => String(r[k]) === String(v)));
    };
    const run = () => {
      if (table === 'community_product_review_stats' && !withStatsView) return { data: null, error: { code: 'PGRST205', message: "Could not find the table 'public.community_product_review_stats' in the schema cache" } };
      if (op === 'insert') {
        const row = { id: `p${nextId++}`, status: 'visible', created_at: new Date(Date.now() + nextId).toISOString(), ...payload };
        posts.push(row);
        return { data: row, error: null };
      }
      if (op === 'update') {
        const hit = rowsFor();
        hit.forEach((r) => Object.assign(r, payload));
        return { data: hit.map((r) => ({ id: r.id })), error: null };
      }
      if (op === 'delete') {
        const hit = rowsFor();
        hit.forEach((r) => posts.splice(posts.indexOf(r), 1));
        return { data: hit.map((r) => ({ id: r.id })), error: null };
      }
      return { data: rowsFor(), error: null };
    };
    const q = {
      select: () => q, order: () => q, limit: () => q,
      eq: (k, v) => { filters.push([k, v]); return q; },
      insert: (row) => { op = 'insert'; payload = row; return q; },
      update: (patch) => { op = 'update'; payload = patch; return q; },
      delete: () => { op = 'delete'; return q; },
      single: () => Promise.resolve(run()),
      then: (resolve, reject) => Promise.resolve(run()).then(resolve, reject),
    };
    return q;
  };
  return { from: query, posts };
}

describe('review stars', () => {
  it('reads the rating as whole stars from 1 to 5', () => {
    expect(normalizeRating(4)).toBe(4);
    expect(normalizeRating('5')).toBe(5);
    expect(normalizeRating(null)).toBe(0);
    expect(normalizeRating(9)).toBe(0);
    expect(ratingLabel(4)).toBe('Rated 4 out of 5');
  });

  it('fills exactly the chosen number of stars and labels them', () => {
    const html = renderToStaticMarkup(createElement(RatingStars, { value: 4 }));
    expect(html).toContain('aria-label="Rated 4 out of 5"');
    expect(html.match(/class="is-on"/g)).toHaveLength(4);
    expect(html.match(/fill="currentColor"/g)).toHaveLength(4);
    expect(html.match(/fill="none"/g)).toHaveLength(1);
  });

  it('refuses to save a review without a star rating', async () => {
    const db = fakeSupabase();
    await expect(createPost(db, 'u1', { kind: 'review', body: 'ok', productId: 'pad-1', rating: null })).rejects.toThrow(/star rating/);
    expect(db.posts).toHaveLength(0);
  });
});

describe('product averages follow edits and deletes', () => {
  it('recomputes from live reviews when a rating is edited or a review deleted', async () => {
    const db = fakeSupabase();
    const a = await createPost(db, 'u1', { kind: 'review', body: 'Loved it', productId: 'pad-1', rating: 5 });
    await createPost(db, 'u2', { kind: 'review', body: 'Fine', productId: 'pad-1', rating: 3 });
    await createPost(db, 'u3', { kind: 'question', body: 'Anyone tried?', productId: null });

    let stats = await loadProductReviewStats(db);
    expect(stats['pad-1']).toMatchObject({ count: 2, average: 4 });

    await updatePost(db, a.id, { body: 'Changed my mind', rating: 1 });
    stats = await loadProductReviewStats(db);
    expect(stats['pad-1']).toMatchObject({ count: 2, average: 2 });
    expect((await listProductReviews(db, 'pad-1')).find((r) => r.id === a.id).rating).toBe(1);

    await deletePost(db, a.id, 'u1');
    stats = await loadProductReviewStats(db);
    expect(stats['pad-1']).toMatchObject({ count: 1, average: 3 });

    // A review moderation hides drops out too.
    db.posts.forEach((p) => { p.status = 'hidden'; });
    expect(await loadProductReviewStats(db)).toEqual({});
  });

  it('uses the stats view when it exists and gives the same numbers', async () => {
    const db = fakeSupabase({ withStatsView: true });
    await createPost(db, 'u1', { kind: 'review', body: 'Good', productId: 'cup-1', rating: 4 });
    await createPost(db, 'u2', { kind: 'review', body: 'Great', productId: 'cup-1', rating: 5 });
    const stats = await loadProductReviewStats(db);
    expect(stats['cup-1']).toMatchObject({ count: 2, average: 4.5 });
    expect(stats['cup-1'].histogram).toEqual({ 1: 0, 2: 0, 3: 0, 4: 1, 5: 1 });
  });

  it('rejects an edit to a rating outside 1 to 5', async () => {
    const db = fakeSupabase();
    const a = await createPost(db, 'u1', { kind: 'review', body: 'x', productId: 'pad-1', rating: 4 });
    await expect(updatePost(db, a.id, { rating: 0.2 })).rejects.toThrow(/star rating/);
    expect(db.posts[0].rating).toBe(4);
  });

  it('skips rows without a product or a usable rating', () => {
    expect(summarizeReviewRows([{ product_id: 'a', rating: 4 }, { product_id: 'a', rating: null }, { product_id: null, rating: 5 }])).toEqual({ a: { count: 1, average: 4, histogram: { 1: 0, 2: 0, 3: 0, 4: 1, 5: 0 } } });
    expect(statsFromViewRows([{ product_id: 'a', review_count: 0, average_rating: null }])).toEqual({});
  });
});

describe('product cards read live stats, not the old stored copy', () => {
  it('drops stale per-user ratings and keeps her own notes', () => {
    const own = { 'pad-1': { ratings: [5, 5, 5], reviews: [{ text: 'mine' }] }, 'pad-2': { ratings: [2], reviews: [] } };
    const merged = mergeReviewBuckets(own, { 'pad-1': { count: 1, average: 3, histogram: { 1: 0, 2: 0, 3: 1, 4: 0, 5: 0 } } });
    expect(getAynaRating(null, merged['pad-1'])).toBe(3);
    expect(getAynaRatingCount(merged['pad-1'])).toBe(1);
    expect(merged['pad-1'].reviews).toEqual([{ text: 'mine' }]);
    // Her review of pad-2 was deleted: no stars left behind.
    expect(getAynaRating(null, merged['pad-2'])).toBeNull();
    expect(getAynaRatingCount(merged['pad-2'])).toBe(0);
  });

  it('hands the Reviews tab to the next product page once, and only briefly', () => {
    requestProductTab('reviews', 1000);
    expect(takeProductTab(1500)).toBe('reviews');
    expect(takeProductTab(1600)).toBeNull();
    requestProductTab('reviews', 1000);
    expect(takeProductTab(9000)).toBeNull();
  });
});
