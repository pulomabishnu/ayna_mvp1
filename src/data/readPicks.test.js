import { describe, it, expect } from 'vitest';
import { ARTICLES } from '../components/Articles.jsx';
import { READ_SUMMARIES, pickReadForYou } from './readPicks.js';

describe('readPicks', () => {
  it('copies titles and teasers exactly from the Library', () => {
    for (const [id, r] of Object.entries(READ_SUMMARIES)) {
      const a = ARTICLES.find((x) => x.id === id);
      expect(a, id).toBeTruthy();
      expect(r.title).toBe(a.title);
      expect(r.teaser).toBe(a.teaser);
    }
  });
  it('picks a read from her answers and nothing without them', () => {
    expect(pickReadForYou({ fullHealthIntake: { supportSelections: ['Cramps or period pain'], diagnoses: ['Endometriosis'] } })?.id).toBe('endometriosis-basics');
    expect(pickReadForYou(null)).toBeNull();
    expect(pickReadForYou({ fullHealthIntake: { supportSelections: ['Trouble sleeping'] } })).toBeNull();
  });
});
