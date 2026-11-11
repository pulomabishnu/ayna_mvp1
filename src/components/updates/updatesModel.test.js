import { describe, it, expect } from 'vitest';
import { buildUpdates, hasUnseen, communityText } from './updatesModel.js';

describe('updates bell (founder, Nov 10)', () => {
  it('shows nothing it does not have a source for', () => {
    expect(buildUpdates({})).toEqual([]);
  });
  it('groups check-ins and old answers under For you, replies under Community, news under From ayna', () => {
    const items = buildUpdates({
      facts: [{ key: 'medications', title: 'Still taking the same medicines?', said: 'You listed iron.', when: '7 months ago' }],
      checkinDue: true, checkinMonth: '2026-11-01',
      community: [{ id: 'n1', type: 'comment', created_at: '2026-11-09T10:00:00Z', read_at: null }],
      news: { title: 'New: cramp relief picks', body: 'We checked 22 products.' },
    });
    expect(items.map((i) => [i.group, i.go])).toEqual([['you', 'home'], ['you', 'checkin'], ['community', 'community'], ['ayna', 'news']]);
    expect(items[0].body).toBe('You listed iron. You told us 7 months ago.');
    expect(items[2].title).toBe('Someone replied to your post.');
  });
  it('lights the dot for unseen items and unread replies only', () => {
    const items = buildUpdates({ news: { title: 'A' } });
    expect(hasUnseen(items, new Set())).toBe(true);
    expect(hasUnseen(items, new Set(['news:A']))).toBe(false);
    expect(hasUnseen([], new Set(), 2)).toBe(true);
  });
  it('uses the row message when there is one', () => {
    expect(communityText({ message: 'Maya replied: same here' })).toBe('Maya replied: same here');
    expect(communityText({ type: 'something_new' })).toBe('Something new.');
  });
});
