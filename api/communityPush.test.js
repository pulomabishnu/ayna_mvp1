import { describe, it, expect, vi } from 'vitest';
import { communityPushFor, communitySweep } from './_communityPush.js';

describe('community phone notifications (Nov 16)', () => {
  it('says who did what, never what a post says', () => {
    expect(communityPushFor({ type: 'follow' }, { display_name: 'Maya' }).body).toBe('Maya followed you.');
    expect(communityPushFor({ type: 'friend_request' }, { username: 'maya.k' }).body).toBe('@maya.k sent you a friend request.');
    expect(communityPushFor({ type: 'comment' }, null).body).toBe('Someone replied to your post.');
    expect(communityPushFor({ type: 'unknown_kind' })).toBeNull();
    expect(communityPushFor({ type: 'follow' }).data.route).toBe('community');
  });
  it('pushes each row once and marks it, skipping people who turned notifications off', async () => {
    const updates = [];
    const rows = [{ id: 'a', recipient_id: 'u1', actor_id: 'x', type: 'follow' }, { id: 'b', recipient_id: 'u2', actor_id: 'x', type: 'comment' }];
    const q = (data) => { const o = { select: () => o, is: () => o, gte: () => o, order: () => o, limit: async () => ({ data, error: null }), in: async () => ({ data: [{ user_id: 'x', display_name: 'Maya' }] }), update: (v) => ({ eq: async (_c, id) => { updates.push([id, v]); } }) }; return o; };
    const admin = { from: (t) => (t === 'community_notifications' ? q(rows) : q([])) };
    const push = vi.fn(async () => ({ sent: 1 }));
    const prefsFor = async () => new Map([['u2', { notificationsEnabled: false }]]);
    const stats = await communitySweep(admin, { push, prefsFor, inQuiet: () => false });
    expect(push).toHaveBeenCalledTimes(1);
    expect(push.mock.calls[0][2].body).toBe('Maya followed you.');
    expect(updates.map((u) => u[0]).sort()).toEqual(['a', 'b']);
    expect(stats).toMatchObject({ found: 2, sent: 1, dropped: 1 });
  });
});
