import { describe, it, expect, beforeEach } from 'vitest';
import {
  recordPostView, getPostViewCounts, getLikerPreviews, listPostLikers, maskLiker,
  getViewDeviceId, resetSentViews, viewsLabel, moreLabel, utcDay,
} from './postEngagement.js';

const P1 = '11111111-1111-4111-8111-111111111111';
const P2 = '22222222-2222-4222-8222-222222222222';
const U1 = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const U2 = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const MISSING_FN = { code: 'PGRST202', message: 'Could not find the function public.community_post_view_counts in the schema cache' };

function fakeClient(rpc) {
  const log = [];
  return { log, rpc: async (name, args) => { log.push({ name, args }); return rpc(name, args); } };
}
function memoryStorage(initial = {}) {
  const data = { ...initial };
  return { getItem: (k) => (k in data ? data[k] : null), setItem: (k, v) => { data[k] = String(v); }, data };
}

beforeEach(() => resetSentViews());

describe('recordPostView', () => {
  it('sends the device id only when signed out, and only once per day per post', async () => {
    const supabase = fakeClient(() => ({ data: 7, error: null }));
    const now = new Date('2026-10-21T10:00:00Z');
    await expect(recordPostView(supabase, P1, { deviceId: 'device-0123456789abcdef', now })).resolves.toEqual({ available: true, count: 7 });
    await recordPostView(supabase, P1, { deviceId: 'device-0123456789abcdef', now });
    expect(supabase.log).toHaveLength(1);
    expect(supabase.log[0]).toEqual({ name: 'community_record_post_view', args: { p_post_id: P1, p_device_key: 'device-0123456789abcdef' } });
    await recordPostView(supabase, P1, { userId: U1, now });
    expect(supabase.log[1].args).toEqual({ p_post_id: P1, p_device_key: null });
    // Next day counts again.
    await recordPostView(supabase, P1, { userId: U1, now: new Date('2026-10-22T10:00:00Z') });
    expect(supabase.log).toHaveLength(3);
  });
  it('reports unavailable before the migration and lets a later try send again', async () => {
    let missing = true;
    const supabase = fakeClient(() => (missing ? { data: null, error: MISSING_FN } : { data: 1, error: null }));
    await expect(recordPostView(supabase, P1, { userId: U1 })).resolves.toEqual({ available: false, count: null });
    missing = false;
    await expect(recordPostView(supabase, P1, { userId: U1 })).resolves.toEqual({ available: true, count: 1 });
  });
  it('ignores ids that are not post ids', async () => {
    const supabase = fakeClient(() => ({ data: 1, error: null }));
    await recordPostView(supabase, 'not-a-uuid', { userId: U1 });
    expect(supabase.log).toHaveLength(0);
  });
  it('throws other errors', async () => {
    const supabase = fakeClient(() => ({ data: null, error: { code: '42501', message: 'permission denied' } }));
    await expect(recordPostView(supabase, P1, { userId: U1 })).rejects.toMatchObject({ code: '42501' });
  });
});

describe('getViewDeviceId', () => {
  it('keeps one random id per browser', () => {
    const store = memoryStorage();
    const id = getViewDeviceId(store);
    expect(id).toMatch(/^[A-Za-z0-9-]{16,64}$/);
    expect(getViewDeviceId(store)).toBe(id);
  });
  it('still works when storage throws', () => {
    const broken = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } };
    expect(getViewDeviceId(broken)).toMatch(/^[A-Za-z0-9-]{16,64}$/);
  });
});

describe('getPostViewCounts', () => {
  it('maps counts and keeps today only for her own posts', async () => {
    const supabase = fakeClient(() => ({ data: [
      { post_id: P1, view_count: 128, views_today: 12 },
      { post_id: P2, view_count: 3, views_today: null },
    ], error: null }));
    const { available, counts } = await getPostViewCounts(supabase, [P1, P2, P1, 'junk']);
    expect(available).toBe(true);
    expect(supabase.log[0].args).toEqual({ p_post_ids: [P1, P2] });
    expect(counts.get(P1)).toEqual({ views: 128, today: 12 });
    expect(counts.get(P2)).toEqual({ views: 3, today: null });
  });
  it('hides counts before the migration', async () => {
    const supabase = fakeClient(() => ({ data: null, error: MISSING_FN }));
    const res = await getPostViewCounts(supabase, [P1]);
    expect(res.available).toBe(false);
    expect(res.counts.size).toBe(0);
  });
});

describe('maskLiker', () => {
  it('never shows a name, handle or photo for an anonymous liker', () => {
    const leaked = { user_id: U2, username: 'maya.k', display_name: 'Maya', avatar_url: 'avatars/x.jpg', is_anonymous: true, is_me: false };
    expect(maskLiker(leaked)).toEqual({ key: null, userId: null, username: null, name: 'Anonymous', avatarPath: null, isAnonymous: true, isMe: false });
    expect(maskLiker({ user_id: null, is_anonymous: false }).name).toBe('Anonymous');
  });
  it('labels her own like "You"', () => {
    const me = maskLiker({ user_id: U1, username: 'ameera', display_name: 'Ameera', avatar_url: 'avatars/me.jpg', is_anonymous: false, is_me: true });
    expect(me).toMatchObject({ name: 'You', isMe: true, isAnonymous: false, userId: U1 });
  });
  it('uses the display name, then the handle', () => {
    expect(maskLiker({ user_id: U2, username: 'maya.k', display_name: 'Maya K', is_anonymous: false }).name).toBe('Maya K');
    expect(maskLiker({ user_id: U2, username: 'maya.k', display_name: '', is_anonymous: false }).name).toBe('@maya.k');
  });
});

describe('likers', () => {
  const rows = [
    { post_id: P1, user_id: U1, username: 'ameera', display_name: 'Ameera', avatar_url: null, is_anonymous: false, is_me: true, total_count: 9 },
    { post_id: P1, user_id: null, username: null, display_name: null, avatar_url: null, is_anonymous: true, is_me: false, total_count: 9 },
    { post_id: P1, user_id: U2, username: 'maya.k', display_name: 'Maya', avatar_url: 'avatars/m.jpg', is_anonymous: false, is_me: false, total_count: 9 },
  ];
  it('groups previews per post with the total for "+N more"', async () => {
    const supabase = fakeClient(() => ({ data: rows, error: null }));
    const { available, likers } = await getLikerPreviews(supabase, [P1, P2]);
    expect(available).toBe(true);
    expect(supabase.log[0]).toEqual({ name: 'community_post_likers_preview', args: { p_post_ids: [P1, P2], p_per_post: 5 } });
    const entry = likers.get(P1);
    expect(entry.total).toBe(9);
    expect(entry.rows.map((r) => r.name)).toEqual(['You', 'Anonymous', 'Maya']);
    expect(new Set(entry.rows.map((r) => r.key)).size).toBe(3);
    expect(likers.has(P2)).toBe(false);
    expect(moreLabel(entry.total, entry.rows.length)).toBe('+6 more');
  });
  it('lists everyone and masks anonymous rows', async () => {
    const supabase = fakeClient((name, args) => ({ data: name === 'community_post_likers' && args.p_post_id === P1 ? rows : [], error: null }));
    const res = await listPostLikers(supabase, P1);
    expect(res.total).toBe(9);
    expect(res.rows[1]).toMatchObject({ name: 'Anonymous', userId: null, username: null, avatarPath: null });
    expect(res.rows[2]).toMatchObject({ name: 'Maya', username: 'maya.k', userId: U2 });
  });
  it('hides likers before the migration', async () => {
    const supabase = fakeClient(() => ({ data: null, error: { code: 'PGRST202', message: 'Could not find the function' } }));
    await expect(listPostLikers(supabase, P1)).resolves.toEqual({ available: false, total: 0, rows: [] });
    await expect(getLikerPreviews(supabase, [P1])).resolves.toMatchObject({ available: false });
  });
});

describe('labels', () => {
  it('reads plainly', () => {
    expect(viewsLabel(1)).toBe('1 view');
    expect(viewsLabel(128)).toBe('128 views');
    expect(viewsLabel(1250)).toBe('1.2k views');
    expect(viewsLabel(24000)).toBe('24k views');
    expect(moreLabel(4, 4)).toBe('');
    expect(utcDay(new Date('2026-10-21T23:30:00Z'))).toBe('2026-10-21');
  });
});
