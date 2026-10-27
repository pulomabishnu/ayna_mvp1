import { describe, expect, it } from 'vitest';
import { draftKey, normalizeDraft, isDraftEmpty, loadDraft, saveDraft, clearDraft, submitDraft, photosFromDraft } from './composerDraft.js';

const memoryStore = () => {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { m.set(k, String(v)); },
    removeItem: (k) => { m.delete(k); },
    has: (k) => m.has(k),
  };
};
const KEY = draftKey('web', 'user-1');
const DRAFT = { kind: 'post', body: 'Heat patches help on day 2 https://example.com/heat', productId: 'p-thermacare', rating: null, anonymous: true, playlistTitle: '', friendIds: [] };

describe('composer draft storage', () => {
  it('keys drafts by surface and person', () => {
    expect(draftKey('web', 'a')).not.toBe(draftKey('app', 'a'));
    expect(draftKey('web', 'a')).not.toBe(draftKey('web', 'b'));
    expect(draftKey('web', 'a', 'pdp-review-p1')).toContain('pdp-review-p1');
  });

  it('round-trips text, link, product and settings', () => {
    const store = memoryStore();
    expect(saveDraft(KEY, DRAFT, store)).toBe(true);
    const back = loadDraft(KEY, store);
    expect(back).toMatchObject({ kind: 'post', body: DRAFT.body, productId: 'p-thermacare', anonymous: true });
  });

  it('keeps photos that fit and drops only the photos when they do not', () => {
    const store = memoryStore();
    const small = { name: 'a.png', type: 'image/png', dataUrl: 'data:image/png;base64,iVBORw0KGgo=' };
    saveDraft(KEY, { ...DRAFT, photos: [small] }, store);
    expect(loadDraft(KEY, store).photos).toHaveLength(1);
    const huge = { name: 'b.jpg', type: 'image/jpeg', dataUrl: `data:image/jpeg;base64,${'A'.repeat(3 * 1024 * 1024)}` };
    saveDraft(KEY, { ...DRAFT, photos: [huge] }, store);
    const back = loadDraft(KEY, store);
    expect(back.body).toBe(DRAFT.body);
    expect(back.photos).toHaveLength(0);
  });

  it('falls back to text only when storage is full', () => {
    const store = memoryStore();
    const real = store.setItem;
    store.setItem = (k, v) => { if (v.includes('data:image')) throw new Error('QuotaExceededError'); real(k, v); };
    const small = { name: 'a.png', type: 'image/png', dataUrl: 'data:image/png;base64,iVBORw0KGgo=' };
    expect(saveDraft(KEY, { ...DRAFT, photos: [small] }, store)).toBe(true);
    expect(loadDraft(KEY, store).body).toBe(DRAFT.body);
  });

  it('never throws when storage is blocked', () => {
    const blocked = { getItem: () => { throw new Error('denied'); }, setItem: () => { throw new Error('denied'); }, removeItem: () => { throw new Error('denied'); } };
    expect(loadDraft(KEY, blocked)).toBeNull();
    expect(saveDraft(KEY, DRAFT, blocked)).toBe(false);
    expect(() => clearDraft(KEY, blocked)).not.toThrow();
  });

  it('ignores damaged or empty drafts', () => {
    const store = memoryStore();
    store.setItem(KEY, '{not json');
    expect(loadDraft(KEY, store)).toBeNull();
    saveDraft(KEY, { kind: 'post', body: '   ' }, store);
    expect(store.has(KEY)).toBe(false);
    expect(isDraftEmpty(normalizeDraft({ body: '', photos: [{ dataUrl: 'javascript:alert(1)' }] }))).toBe(true);
  });

  it('turns stored photos back into files for upload', () => {
    const files = photosFromDraft([{ name: 'a.png', type: 'image/png', dataUrl: 'data:image/png;base64,iVBORw0KGgo=' }]);
    expect(files).toHaveLength(1);
    expect(files[0].name).toBe('a.png');
    expect(files[0].type).toBe('image/png');
    expect(files[0].size).toBe(8);
  });
});

describe('posting with a draft', () => {
  it('keeps the draft and returns the error when the post fails', async () => {
    const store = memoryStore();
    saveDraft(KEY, DRAFT, store);
    const error = new Error('network down');
    const out = await submitDraft({ key: KEY, store, save: () => Promise.reject(error) });
    expect(out).toEqual({ ok: false, error });
    expect(loadDraft(KEY, store).body).toBe(DRAFT.body);
  });

  it('clears the draft only after the post saves', async () => {
    const store = memoryStore();
    saveDraft(KEY, DRAFT, store);
    let seenDuringSave = null;
    const out = await submitDraft({ key: KEY, store, save: async () => { seenDuringSave = loadDraft(KEY, store); return { id: 'post-1' }; } });
    expect(seenDuringSave?.body).toBe(DRAFT.body);
    expect(out).toEqual({ ok: true, result: { id: 'post-1' } });
    expect(loadDraft(KEY, store)).toBeNull();
  });
});
