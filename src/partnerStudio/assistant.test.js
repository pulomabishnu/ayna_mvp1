import { describe, it, expect } from 'vitest';
import { QUESTIONS, answer, matchQuestion, search } from './assistant.js';
import { fixtureSnapshot } from './engine/fixture.js';

const snap = fixtureSnapshot();
const data = { run: snap.run, categories: snap.categories };
const b = { name: 'Demo Brand', ...snap.brands['Demo Brand'] };

describe('Ask Partner Studio', () => {
  it('answers every preset question with numbers from the dashboard only', () => {
    for (const q of QUESTIONS) {
      const a = answer(q.id, data, b);
      expect(a.title.length).toBeGreaterThan(3);
      expect(a.lines.length).toBeGreaterThan(0);
    }
    expect(answer('overall', data, b).lines[0]).toContain(`${b.totals.slotShare.num} of the ${b.totals.slotShare.den}`);
    expect(answer('beating', data, b).lines.join(' ')).toMatch(/Peer Co/);
  });
  it('maps typed questions to presets and falls back gracefully', () => {
    expect(matchQuestion('why am I not recommended')?.id).toBe('missing');
    expect(matchQuestion('what should I fix first')?.id).toBe('fix');
    expect(matchQuestion('')).toBeNull();
    expect(answer('none', data, b).title).toMatch(/Try one/);
  });
  it('handles a brand with nothing in scope', () => {
    expect(answer('overall', data, { ...snap.brands['Out Of Scope Co'], totals: null }).title).toMatch(/Not in a Phase 1/);
  });
  it('searches products, brands and pages by name', () => {
    const r = search('peer', data, b, [['overview', 'Overview']]);
    expect(r.some((x) => x.kind === 'brand' && x.label === 'Peer Co' && x.partner)).toBe(true);
    expect(r.some((x) => x.kind === 'product' && x.label === 'Peer Gel')).toBe(true);
    expect(search('over', data, b, [['overview', 'Overview']])[0]).toMatchObject({ kind: 'screen', id: 'overview' });
    expect(search('x', data, b, [])).toEqual([]);
  });
});
