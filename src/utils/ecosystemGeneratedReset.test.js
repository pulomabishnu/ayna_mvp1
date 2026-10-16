import { describe, it, expect, vi } from 'vitest';
import { isGeneratedPick, clearGeneratedPicksForUser } from './ecosystemStore.js';

function fakeSupabase(rows) {
  const calls = { update: null, ids: null, deleted: false };
  const builder = () => {
    const q = {
      _mode: 'select',
      select() { q._mode = 'select'; return q; },
      update(v) { q._mode = 'update'; calls.update = v; return q; },
      delete() { calls.deleted = true; return q; },
      eq() { return q; },
      in(...args) { calls.ids = args[1]; return q; },
      then(res) { return Promise.resolve(q._mode === 'select' ? { data: rows, error: null } : { error: null }).then(res); },
    };
    return q;
  };
  return { client: { from: vi.fn(builder) }, calls };
}

describe('generated-pick reset', () => {
  it('only counts ayna picks she has not made her own', () => {
    expect(isGeneratedPick({ intakeGenerated: true })).toBe(true);
    expect(isGeneratedPick({ llmGenerated: true })).toBe(true);
    expect(isGeneratedPick({ intakeGenerated: true, _userSwapped: true })).toBe(false);
    expect(isGeneratedPick({ llmGenerated: true, userAdded: true })).toBe(false);
    expect(isGeneratedPick({ id: 'x' })).toBe(false);
  });
  it('never touches products she added and never deletes', async () => {
    const { client, calls } = fakeSupabase([
      { product_id: 'mine', product_data: { id: 'mine' } },
      { product_id: 'gen', product_data: { id: 'gen', intakeGenerated: true } },
    ]);
    const r = await clearGeneratedPicksForUser(client, 'u1');
    expect(r.cleared).toBe(1);
    expect(calls.ids).toEqual(['gen']);
    expect(calls.update.in_ecosystem).toBe(false);
    expect(calls.deleted).toBe(false);
  });
});
