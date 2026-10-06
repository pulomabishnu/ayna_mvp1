import { describe, it, expect } from 'vitest';
import {
  getViewerTags,
  rankStartups,
  matchesStartupFilter,
  badgeLabel,
  safeHttpUrl,
  formatCategoryLabel,
} from './earlyStartups';

// Synthetic fixtures in the /api/startups client shape (rowToClientStartup).
const a = { id: 'a', name: 'A', tags: ['cramps'], badges: [], stage: 'Seed' };
const b = { id: 'b', name: 'B', tags: ['pcos', 'irregular'], badges: ['Doctor-Founded'], stage: 'Pre-Seed', womenFounded: true };
const c = { id: 'c', name: 'C', tags: [], badges: ['FDA-Cleared'], featured: true };

describe('getViewerTags', () => {
  it('maps quiz frustrations to tags', () => {
    expect([...getViewerTags({ frustrations: ['PCOS symptoms', 'Irregular cycles'] })]).toEqual(['pcos', 'irregular']);
  });
  it('tolerates missing/partial inputs', () => {
    expect(getViewerTags(null, null).size).toBe(0);
    expect(getViewerTags({}, {}).size).toBe(0);
  });
});

describe('rankStartups', () => {
  it('keeps API order (featured first) with no viewer signal', () => {
    expect(rankStartups([a, b, c], new Set()).map((s) => s.id)).toEqual(['c', 'a', 'b']);
  });
  it('ranks by overlapping symptom tags', () => {
    expect(rankStartups([a, b, c], new Set(['pcos', 'irregular'])).map((s) => s.id)).toEqual(['b', 'c', 'a']);
  });
  it('never adds or drops entries', () => {
    expect(rankStartups([a, b, c], new Set(['cramps']))).toHaveLength(3);
    expect(rankStartups(undefined, new Set())).toEqual([]);
  });
});

describe('matchesStartupFilter', () => {
  const viewer = new Set(['cramps']);
  it('filters by clinical badges', () => {
    expect([a, b, c].filter((s) => matchesStartupFilter(s, 'clinical', viewer)).map((s) => s.id)).toEqual(['b', 'c']);
  });
  it('filters women-founded, pre-seed, and for-you', () => {
    expect(matchesStartupFilter(b, 'women', viewer)).toBe(true);
    expect(matchesStartupFilter(a, 'preseed', viewer)).toBe(false);
    expect(matchesStartupFilter(a, 'for-you', viewer)).toBe(true);
    expect(matchesStartupFilter(b, 'for-you', viewer)).toBe(false);
  });
});

describe('display helpers', () => {
  it('attributes FDA badges to the brand', () => {
    expect(badgeLabel('FDA-Cleared')).toBe('FDA-Cleared (per the brand)');
    expect(badgeLabel('Doctor-Founded')).toBe('Doctor-Founded');
  });
  it('only allows http(s) URLs', () => {
    expect(safeHttpUrl('https://x.com')).toBe('https://x.com');
    expect(safeHttpUrl('x.com/path')).toBe('https://x.com/path');
    expect(safeHttpUrl('javascript:alert(1)')).toBeNull();
    expect(safeHttpUrl(null)).toBeNull();
  });
  it('formats category slugs', () => {
    expect(formatCategoryLabel('hormone-monitoring')).toBe('Hormone Monitoring');
  });
});
