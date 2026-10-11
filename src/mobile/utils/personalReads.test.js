import { describe, expect, it } from 'vitest';
import { ARTICLES } from '../../components/Articles.jsx';
import { buildLibrary } from './personalReads.js';

describe('buildLibrary', () => {
  it('puts matching reads first from the mobile intake and never repeats an article', () => {
    const { forYou, rows } = buildLibrary(ARTICLES, { fullHealthIntake: { supportSelections: ['Recurrent UTI-like symptoms'], periodPain: 'Severe' } });
    expect(forYou.map((a) => a.id)).toContain('uti-prevention');
    const all = [...forYou, ...rows.flatMap((r) => r.items)].map((a) => a.id);
    expect(new Set(all).size).toBe(all.length);
    expect(all.length).toBe(ARTICLES.length);
  });
  it('has no "for you" without a profile', () => {
    expect(buildLibrary(ARTICLES, null).forYou).toHaveLength(0);
  });
});
