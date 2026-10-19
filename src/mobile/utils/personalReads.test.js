import { describe, expect, it } from 'vitest';
import { ARTICLES } from '../../components/Articles.jsx';
import { buildLibrary, rankReadsForProfile, hasQuizAnswers } from './personalReads.js';

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
  it('reads answers saved at the top level too (not only fullHealthIntake)', () => {
    const answers = { age: 24, lifeStageSelections: ['I have regular periods'], supportSelections: ['Cramps or period pain'] };
    expect(hasQuizAnswers(answers)).toBe(true);
    expect(buildLibrary(ARTICLES, answers).forYou.length).toBeGreaterThan(0);
  });
  it('puts the menopause read last for a 24-year-old with regular periods', () => {
    const ranked = rankReadsForProfile(ARTICLES, { age: 24, lifeStageSelections: ['I have regular periods'] }).map((a) => a.id);
    expect(ranked.slice(0, 3)).not.toContain('menopause-basics');
    expect(ranked.indexOf('menopause-basics')).toBeGreaterThan(ranked.length - 3);
    const midlife = rankReadsForProfile(ARTICLES, { age: 48, lifeStageSelections: ['I am in perimenopause'] }).map((a) => a.id);
    expect(midlife.slice(0, 3)).toContain('menopause-basics');
  });
});
