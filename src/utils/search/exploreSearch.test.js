import { describe, it, expect } from 'vitest';
import { searchExplore, matchTopics, HEALTH_TOPICS, isService } from './exploreSearch.js';
import { ALL_PRODUCTS } from '../../data/products.js';
import { RELEASED_STARTUPS } from '../../data/startups.js';
import { ARTICLES } from '../../components/Articles.jsx';

const items = [...ALL_PRODUCTS, ...RELEASED_STARTUPS.map((s) => ({ ...s, type: 'digital' }))];

describe('Explore search', () => {
  it('lists health topics from the Community topic graph, without the non-health ones', () => {
    expect(HEALTH_TOPICS.some((t) => t.key === 'pcos')).toBe(true);
    expect(HEALTH_TOPICS.some((t) => t.key === 'budget' || t.key === 'college')).toBe(false);
  });
  it('groups one query into topics, products, services and resources', () => {
    const r = searchExplore('cramps', { items, articles: ARTICLES });
    expect(r.topics.map((t) => t.key)).toContain('cramps');
    expect(r.products.length).toBeGreaterThan(0);
    expect(r.products.every((p) => !isService(p))).toBe(true);
    expect(r.services.every((p) => isService(p))).toBe(true);
    expect(r.resources.length).toBeGreaterThan(0);
  });
  it('finds services for care-type searches', () => {
    const r = searchExplore('telehealth', { items, articles: ARTICLES });
    expect(r.services.length).toBeGreaterThan(0);
  });
  it('returns nothing for a one-letter query', () => {
    expect(searchExplore('a', { items, articles: ARTICLES }).total).toBe(0);
    expect(matchTopics('')).toEqual([]);
  });
});
