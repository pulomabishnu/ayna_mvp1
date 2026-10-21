import { describe, it, expect } from 'vitest';
import { relTime, splitHighlight, pickMemberQuote, isOnlyStarter, applyToggle, avatarTone } from './notes.js';

const NOW = new Date('2026-10-21T15:00:00').getTime();
const ago = (ms) => new Date(NOW - ms).toISOString();

describe('relTime', () => {
  it('reads like a person', () => {
    expect(relTime(ago(10 * 1000), NOW)).toBe('Just now');
    expect(relTime(ago(5 * 60 * 1000), NOW)).toBe('5m');
    expect(relTime(ago(3 * 3600 * 1000), NOW)).toBe('3h');
    expect(relTime(new Date('2026-10-20T09:00:00').toISOString(), NOW)).toBe('Yesterday');
    expect(relTime(new Date('2026-10-17T09:00:00').toISOString(), NOW)).toBe('4d');
    expect(relTime(new Date('2026-09-02T09:00:00').toISOString(), NOW)).toBe('Sep 2');
    expect(relTime(new Date('2025-09-02T09:00:00').toISOString(), NOW)).toBe('Sep 2, 2025');
    expect(relTime(null, NOW)).toBe('');
  });
  it('never goes negative for a clock that runs ahead', () => {
    expect(relTime(new Date(NOW + 60000).toISOString(), NOW)).toBe('Just now');
  });
});

describe('splitHighlight', () => {
  it('keeps a short quote whole', () => {
    expect(splitHighlight('Heat patches saved my exams.')).toEqual({ lead: 'Heat patches saved my exams.', rest: '' });
  });
  it('highlights the first sentence of a longer one', () => {
    const r = splitHighlight('The cup took three cycles to get right. After that I never went back to pads, and my skin is calmer too.');
    expect(r.lead).toBe('The cup took three cycles to get right.');
    expect(r.rest.startsWith('After that')).toBe(true);
  });
});

describe('pickMemberQuote', () => {
  const p = (o) => ({ id: Math.random().toString(36), kind: 'post', body: 'A real member post that is long enough.', helpful_count: 0, created_at: ago(1000), ...o });
  it('returns null when nothing qualifies (no fake quotes)', () => {
    expect(pickMemberQuote([p({ helpful_count: 1 }), p({ kind: 'question', helpful_count: 9 })])).toBeNull();
    expect(pickMemberQuote([])).toBeNull();
  });
  it('picks the most helpful short post', () => {
    const a = p({ helpful_count: 3 });
    const b = p({ helpful_count: 7, kind: 'review' });
    const long = p({ helpful_count: 50, body: 'x'.repeat(400) });
    expect(pickMemberQuote([a, b, long]).post).toBe(b);
  });
  it('skips blocked authors', () => {
    const a = p({ helpful_count: 3, author_id: 'u1' });
    expect(pickMemberQuote([a], { isBlocked: (id) => id === 'u1' })).toBeNull();
  });
});

describe('composer helpers', () => {
  it('treats an untouched starter as empty', () => {
    expect(isOnlyStarter('Unpopular opinion: ', 'Unpopular opinion: ')).toBe(true);
    expect(isOnlyStarter('Unpopular opinion: brunch is fine', 'Unpopular opinion: ')).toBe(false);
    expect(isOnlyStarter('  ', '')).toBe(true);
  });
  it('applies helpful and save toggles without going below zero', () => {
    expect(applyToggle({ helpful_count: 2, viewer_found_helpful: false }, 'helpful', true)).toMatchObject({ helpful_count: 3, viewer_found_helpful: true });
    expect(applyToggle({ helpful_count: 0, viewer_found_helpful: true }, 'helpful', false)).toMatchObject({ helpful_count: 0, viewer_found_helpful: false });
    expect(applyToggle({ viewer_saved: false }, 'save', true)).toMatchObject({ viewer_saved: true });
  });
  it('gives every name a stable avatar tone', () => {
    expect(avatarTone('Maya K')).toBe(avatarTone('Maya K'));
    expect(['pink', 'sky', 'butter']).toContain(avatarTone(''));
  });
});
