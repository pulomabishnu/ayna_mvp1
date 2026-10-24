import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ratingBreakdown, topReviews, snippet, authorName, kindLabel } from './peopleSay.js';
import ProductPeopleSay from './ProductPeopleSay.jsx';
import { listProductMentions } from '../../utils/community/communityStore.js';

const review = (id, rating, extra = {}) => ({ id, kind: 'review', product_id: 'p-x', rating, body: `Review ${id}`, author_id: `u-${id}`, author_display_name: `Member ${id}`, created_at: `2026-10-${String(10 + Number(id)).padStart(2, '0')}T12:00:00Z`, helpful_count: 0, ...extra });

describe('ratingBreakdown', () => {
  it('counts only real 1 to 5 ratings', () => {
    const s = ratingBreakdown([review(1, 5), review(2, 4), review(3, 4), review(4, null), review(5, 9)]);
    expect(s.count).toBe(3);
    expect(s.average).toBeCloseTo(13 / 3);
    expect(s.bars.map((b) => b.count)).toEqual([1, 2, 0, 0, 0]);
    expect(s.bars[1].pct).toBe(67);
  });
  it('has no average and empty bars with no reviews', () => {
    const s = ratingBreakdown([]);
    expect(s.count).toBe(0);
    expect(s.average).toBeNull();
    expect(s.bars.every((b) => b.count === 0 && b.pct === 0)).toBe(true);
  });
});

describe('topReviews', () => {
  it('puts most helpful first, then newest', () => {
    const rows = [review(1, 3), review(2, 5, { helpful_count: 4 }), review(3, 4), review(4, 2, { helpful_count: 1 })];
    expect(topReviews(rows, 3).map((r) => r.id)).toEqual([2, 4, 3]);
  });
  it('prefers a review with words over stars only at the same helpful count', () => {
    const rows = [review(5, 4, { body: '' }), review(1, 4)];
    expect(topReviews(rows, 1)[0].id).toBe(1);
  });
});

describe('text helpers', () => {
  it('cuts at a word and drops formatting marks', () => {
    expect(snippet('**Loved** it', 50)).toBe('Loved it');
    const s = snippet('one two three four five six seven eight nine ten', 20);
    expect(s.endsWith('…')).toBe(true);
    expect(s.length).toBeLessThanOrEqual(20);
  });
  it('never names an anonymous author', () => {
    expect(authorName({ is_anonymous: true, author_id: null, author_display_name: 'X' })).toBe('Anonymous member');
    expect(authorName({ author_id: 'u', author_username: 'sam' })).toBe('sam');
    expect(kindLabel('question')).toBe('Question');
    expect(kindLabel('post')).toBe('Post');
  });
});

describe('ProductPeopleSay', () => {
  it('shows one line and Write a review with no reviews, and no made-up rating', () => {
    const html = renderToStaticMarkup(<ProductPeopleSay productId="p-x" reviews={[]} mentions={[]} onWriteReview={() => {}} onSeeAll={() => {}} />);
    expect(html).toContain('What people say');
    expect(html).toContain('No ayna member reviews yet.');
    expect(html).toContain('Write a review');
    expect(html).not.toContain('ayp-wps__bars');
    expect(html).not.toContain('★');
    expect(html).not.toContain('See online reviews');
  });
  it('offers the online reviews link only when there are some', () => {
    const html = renderToStaticMarkup(<ProductPeopleSay productId="p-x" reviews={[]} mentions={[]} hasOnline onSeeAll={() => {}} />);
    expect(html).toContain('See online reviews');
    expect(html).not.toContain('Write a review');
  });
  it('shows the average, bars and the top three of twelve reviews', () => {
    const rows = Array.from({ length: 12 }, (_, i) => review(i + 1, (i % 5) + 1));
    const html = renderToStaticMarkup(<ProductPeopleSay productId="p-x" reviews={rows} mentions={[]} onSeeAll={() => {}} onWriteReview={() => {}} />);
    expect(html).toContain('From 12 ayna member reviews');
    expect(html).toContain('See all 12 reviews');
    expect((html.match(/class="ayp-wps__card"/g) || []).length).toBe(3);
    expect((html.match(/<li/g) || []).length).toBeGreaterThanOrEqual(8);
    expect(html).toContain('href="/community/p/');
  });
  it('labels community posts as member posts, not evidence', () => {
    const html = renderToStaticMarkup(<ProductPeopleSay productId="p-x" reviews={[review(1, 5)]} mentions={[{ id: 'q1', kind: 'question', body: 'Works with an IUD?', author_id: null, is_anonymous: true, created_at: '2026-10-19T00:00:00Z', comment_count: 2 }]} onSeeAll={() => {}} />);
    expect(html).toContain('From the community');
    expect(html).toContain('not evidence');
    expect(html).toContain('Member question');
    expect(html).toContain('Anonymous member');
    expect(html).toContain('2 replies');
    expect(html).toContain('Go to Reviews');
  });
});

function fakeClient(respond) {
  const log = [];
  const from = (table) => {
    const calls = [];
    const builder = new Proxy({}, {
      get(_, prop) {
        if (prop === 'then') {
          log.push({ table, calls });
          const result = respond(calls, log.length);
          return (resolve, reject) => Promise.resolve(result).then(resolve, reject);
        }
        return (...args) => { calls.push([prop, ...args]); return builder; };
      },
    });
    return builder;
  };
  return { from, log };
}

describe('listProductMentions', () => {
  it('matches product_id or a tag, leaves reviews out', async () => {
    const client = fakeClient(() => ({ data: [{ id: 'a', kind: 'question' }, { id: 'b', kind: 'review' }], error: null }));
    const rows = await listProductMentions(client, 'p-saalt-cup');
    expect(rows.map((r) => r.id)).toEqual(['a']);
    const calls = client.log[0].calls;
    expect(client.log[0].table).toBe('community_feed_posts');
    expect(calls).toContainEqual(['neq', 'kind', 'review']);
    expect(calls).toContainEqual(['or', 'product_id.eq.p-saalt-cup,tagged_product_ids.cs.{p-saalt-cup}']);
  });
  it('strips filter syntax from the id', async () => {
    const client = fakeClient(() => ({ data: [], error: null }));
    await listProductMentions(client, 'p-x),kind.eq.(review');
    expect(client.log[0].calls).toContainEqual(['or', 'product_id.eq.p-xkindeqreview,tagged_product_ids.cs.{p-xkindeqreview}']);
  });
  it('falls back to product_id when the view has no tagged_product_ids', async () => {
    const client = fakeClient((calls, n) => (n === 1 ? { data: null, error: { code: '42703', message: 'column community_feed_posts.tagged_product_ids does not exist' } } : { data: [{ id: 'c', kind: 'post' }], error: null }));
    const rows = await listProductMentions(client, 'p-x');
    expect(rows.map((r) => r.id)).toEqual(['c']);
    expect(client.log[1].calls).toContainEqual(['eq', 'product_id', 'p-x']);
  });
  it('returns nothing without a client or id', async () => {
    expect(await listProductMentions(null, 'p-x')).toEqual([]);
    expect(await listProductMentions(fakeClient(() => ({ data: [], error: null })), '')).toEqual([]);
  });
});
