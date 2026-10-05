import { describe, it, expect } from 'vitest';
import { rankForYou, scorePostForViewer, postProductIds, averageMatch } from './ranking.js';
import { parseCommunityRoute, communityHref, isCommunityPath } from './route.js';
import { sanitizeCommunityProps } from './analytics.js';
import { sanitizeSearch, friendshipState, friendIdsFrom, nextCursor, friendlyError } from './communityStore.js';
import { topicsForTags, isCycleTopic, suggestTopicsForProducts } from './topics.js';
import { getProfileInterestSignals } from '../../data/products.js';

const NOW = Date.parse('2026-10-05T12:00:00Z');
const post = (over) => ({ id: Math.random().toString(36).slice(2), topics: [], helpful_count: 0, comment_count: 0, created_at: '2026-10-05T10:00:00Z', ...over });

describe('community ranking', () => {
  it('surfaces topics the viewer cares about', () => {
    const pcos = post({ id: 'pcos', topics: ['pcos'] });
    const sleep = post({ id: 'sleep', topics: ['sleep'] });
    const ranked = rankForYou([sleep, pcos], { interest: ['pcos', 'hormone-balance'] }, NOW);
    expect(ranked[0].id).toBe('pcos');
  });

  it('pushes period-only topics down for someone who is postmenopausal', () => {
    const period = post({ id: 'period', topics: ['periods'], helpful_count: 3 });
    const meno = post({ id: 'meno', topics: ['menopause'] });
    const ranked = rankForYou([period, meno], { interest: ['menopause'], lifeStage: { postMenopause: true } }, NOW);
    expect(ranked.map((p) => p.id)).toEqual(['meno', 'period']);
  });

  it('uses the viewer\'s own match % for tagged products', () => {
    const good = post({ id: 'good', tagged_product_ids: ['a'] });
    const bad = post({ id: 'bad', tagged_product_ids: ['b'] });
    const matchFor = (id) => (id === 'a' ? 95 : 10);
    expect(rankForYou([bad, good], { matchFor }, NOW)[0].id).toBe('good');
  });

  it('keeps server order for ties (stable)', () => {
    const a = post({ id: 'a' });
    const b = post({ id: 'b' });
    expect(rankForYou([a, b], {}, NOW).map((p) => p.id)).toEqual(['a', 'b']);
  });

  it('boosts followed authors and products the viewer owns', () => {
    const base = scorePostForViewer(post({ author_id: 'u1', product_id: 'x' }), {}, NOW);
    const boosted = scorePostForViewer(post({ author_id: 'u1', product_id: 'x' }), { followingIds: new Set(['u1']), ownedProductIds: new Set(['x']) }, NOW);
    expect(boosted).toBeGreaterThan(base);
  });

  it('collects review and tagged product ids without duplicates', () => {
    expect(postProductIds({ product_id: 'a', tagged_product_ids: ['a', 'b'] })).toEqual(['a', 'b']);
  });

  it('averages only known match values', () => {
    expect(averageMatch(['a', 'b', 'c'], (id) => ({ a: 90, b: 70 })[id] ?? null)).toBe(80);
    expect(averageMatch(['z'], () => null)).toBeNull();
  });
});

describe('community routes', () => {
  it('round-trips every sub-route', () => {
    const routes = [
      { name: 'post', id: 'abc' },
      { name: 'profile', username: 'puloma' },
      { name: 'playlist', id: 'p1' },
      { name: 'recommendation', id: 'r1' },
      { name: 'notifications' },
      { name: 'feed', tab: 'reviews' },
      { name: 'feed', tab: 'for-you', product: 'p-lola-pad' },
    ];
    for (const r of routes) {
      const href = communityHref(r);
      const [path, search] = href.split('?');
      expect(isCommunityPath(path)).toBe(true);
      expect(parseCommunityRoute(path, search ? `?${search}` : '')).toEqual(r);
    }
  });

  it('defaults unknown tabs to For You and ignores unrelated paths', () => {
    expect(parseCommunityRoute('/community', '?tab=nope')).toEqual({ name: 'feed', tab: 'for-you' });
    expect(isCommunityPath('/communityx')).toBe(false);
    expect(isCommunityPath('/product/community')).toBe(false);
  });
});

describe('community privacy guards', () => {
  it('drops anything that is not an allowlisted structural analytics property', () => {
    const out = sanitizeCommunityProps({ filter: 'for-you', topics: ['pcos'], body: 'my diagnosis…', productId: 'p1', matchPercent: 92, is_anonymous: true });
    expect(out).toEqual({ filter: 'for-you', is_anonymous: true });
  });

  it('strips PostgREST filter syntax from search input', () => {
    expect(sanitizeSearch('acne%),author_id.eq.x')).not.toMatch(/[%(),]/);
    expect(sanitizeSearch('  hormonal   acne ')).toBe('hormonal acne');
  });

  it('derives friendship state from the viewer\'s own rows', () => {
    const rows = [
      { id: 1, requester_id: 'me', addressee_id: 'a', status: 'accepted' },
      { id: 2, requester_id: 'me', addressee_id: 'b', status: 'pending' },
      { id: 3, requester_id: 'c', addressee_id: 'me', status: 'pending' },
    ];
    expect(friendshipState(rows, 'me', 'a').state).toBe('friends');
    expect(friendshipState(rows, 'me', 'b').state).toBe('requested');
    expect(friendshipState(rows, 'me', 'c').state).toBe('incoming');
    expect(friendshipState(rows, 'me', 'd').state).toBe('none');
    expect(friendIdsFrom(rows, 'me')).toEqual(['a']);
  });

  it('builds keyset and offset cursors', () => {
    expect(nextCursor([{ created_at: 't', id: 'x' }], 'recent')).toEqual({ created_at: 't', id: 'x' });
    expect(nextCursor([{}, {}], 'helpful', { offset: 20 })).toEqual({ offset: 22 });
    expect(nextCursor([], 'recent')).toBeNull();
  });

  it('maps database errors to friendly copy', () => {
    expect(friendlyError({ message: 'community_rate_limited' })).toMatch(/posting a lot/);
    expect(friendlyError({ code: '23503', message: 'fk' })).toMatch(/catalog/);
  });
});

describe('community topics', () => {
  it('maps engine tags onto topics', () => {
    expect(topicsForTags(['pcos-management', 'cramps'])).toEqual(expect.arrayContaining(['pcos', 'cramps']));
    expect(isCycleTopic('periods')).toBe(true);
    expect(isCycleTopic('menopause')).toBe(false);
    expect(suggestTopicsForProducts([{ tags: ['uti'] }])).toEqual(['uti']);
  });

  it('reads interests from the same intake the match engine uses', () => {
    const signals = getProfileInterestSignals({
      fullHealthIntake: {
        primaryConcerns: ['PCOS symptoms'],
        lifeStageSelections: ['I am post-menopause'],
      },
    });
    expect(signals.tags).toEqual(expect.arrayContaining(['pcos']));
    expect(signals.lifeStage.postMenopause).toBe(true);
    expect(signals.hasProfile).toBe(true);
    expect(getProfileInterestSignals(null).hasProfile).toBe(false);
  });
});
