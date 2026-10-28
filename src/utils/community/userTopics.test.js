import { describe, expect, it, vi } from 'vitest';
import { probeUserTopics, listUserTopics, getUserTopic, joinTopicByCode, parseTopicInviteCode, topicInviteLink, topicPermissions, topicByline, topicError, createUserTopic } from './userTopics.js';

const MISSING = { code: 'PGRST205', message: "Could not find the table 'public.community_feed_topics' in the schema cache" };

/** A tiny PostgREST stand-in: every chain resolves to `result`; records calls. */
function fakeSupabase({ result = { data: [], error: null }, rpc = async () => ({ data: null, error: null }), session = { access_token: 'tok' } } = {}) {
  const calls = [];
  const chain = new Proxy({}, {
    get(_t, prop) {
      if (prop === 'then') return (resolve) => resolve(result);
      if (prop === 'maybeSingle' || prop === 'single') return async () => result;
      return (...args) => { calls.push([prop, ...args]); return chain; };
    },
  });
  return {
    calls,
    from: (table) => { calls.push(['from', table]); return chain; },
    rpc: vi.fn(rpc),
    auth: { getSession: async () => ({ data: { session } }) },
  };
}

describe('before the migration runs', () => {
  it('reports unavailable instead of throwing', async () => {
    const sb = fakeSupabase({ result: { data: null, error: MISSING } });
    expect(await probeUserTopics(sb)).toEqual({ available: false });
    expect(await listUserTopics(sb)).toEqual({ available: false, rows: [] });
    expect(await getUserTopic(sb, { id: 'x' })).toBe(null);
    expect(await probeUserTopics(null)).toEqual({ available: false });
  });
  it('joining by code says topics are not on yet', async () => {
    const sb = fakeSupabase({ rpc: async () => ({ data: null, error: { code: '42883', message: 'function join_topic_by_code does not exist' } }) });
    expect(await joinTopicByCode(sb, 'a'.repeat(32))).toMatchObject({ ok: false, reason: 'unavailable' });
  });
  it('real errors still surface', async () => {
    const sb = fakeSupabase({ result: { data: null, error: { code: '500', message: 'boom' } } });
    await expect(listUserTopics(sb)).rejects.toMatchObject({ message: 'boom' });
  });
});

describe('reading topics', () => {
  it('browse lists only visible public topics, from the masking view', async () => {
    const sb = fakeSupabase({ result: { data: [{ id: 't1' }], error: null } });
    const res = await listUserTopics(sb, { section: 'browse' });
    expect(res).toEqual({ available: true, rows: [{ id: 't1' }] });
    expect(sb.calls[0]).toEqual(['from', 'community_feed_topics']);
    expect(sb.calls).toContainEqual(['eq', 'visibility', 'public']);
    expect(sb.calls).toContainEqual(['eq', 'status', 'visible']);
    expect(sb.calls.some(([op, cols]) => op === 'select' && /created_by/.test(cols) && !/email/.test(cols))).toBe(true);
  });
  it('mine filters to topics she has a role in', async () => {
    const sb = fakeSupabase();
    await listUserTopics(sb, { section: 'mine' });
    expect(sb.calls).toContainEqual(['not', 'my_role', 'is', null]);
  });
});

describe('invite code join flow', () => {
  const code = 'abcdef0123456789abcdef0123456789';
  it('parses a code or a pasted link', () => {
    expect(parseTopicInviteCode(code)).toBe(code);
    expect(parseTopicInviteCode(`https://www.aynahealth.co/community?join-topic=${code.toUpperCase()}`)).toBe(code);
    expect(parseTopicInviteCode('https://evil.example/?x=1')).toBe(null);
    expect(parseTopicInviteCode('short')).toBe(null);
    expect(topicInviteLink(code)).toBe(`https://www.aynahealth.co/community?join-topic=${code}`);
  });
  it('joins through the security definer function and returns the topic', async () => {
    const sb = fakeSupabase({ rpc: async () => ({ data: 'topic-1', error: null }) });
    expect(await joinTopicByCode(sb, code)).toEqual({ ok: true, topicId: 'topic-1' });
    expect(sb.rpc).toHaveBeenCalledWith('join_topic_by_code', { code });
  });
  it('never calls the server with a malformed code', async () => {
    const sb = fakeSupabase();
    expect(await joinTopicByCode(sb, '../etc')).toMatchObject({ ok: false, reason: 'invalid' });
    expect(sb.rpc).not.toHaveBeenCalled();
  });
  it('maps guest and expired invites to plain words', async () => {
    const guest = fakeSupabase({ rpc: async () => ({ data: null, error: { message: 'community_guest_unavailable' } }) });
    expect(await joinTopicByCode(guest, code)).toMatchObject({ ok: false, reason: 'signin' });
    const expired = fakeSupabase({ rpc: async () => ({ data: null, error: { message: 'community_invite_invalid' } }) });
    expect(await joinTopicByCode(expired, code)).toMatchObject({ ok: false, reason: 'invalid' });
  });
});

describe('permissions from the view row', () => {
  const topic = (o) => ({ id: 't', status: 'visible', visibility: 'public', my_role: null, is_mine: false, ...o });
  it('owner can do everything except leave or report her own topic', () => {
    const p = topicPermissions(topic({ my_role: 'owner', is_mine: true, visibility: 'private' }), 'u1');
    expect(p).toMatchObject({ canEdit: true, canDelete: true, canManageCoowners: true, canRemovePosts: true, canShareInvite: true, canLeave: false, canReport: false });
  });
  it('co-owner edits and moderates, but cannot delete or manage co-owners', () => {
    const p = topicPermissions(topic({ my_role: 'coowner' }), 'u2');
    expect(p).toMatchObject({ canEdit: true, canRemovePosts: true, canDelete: false, canManageCoowners: false, canChangeAudience: false, canLeave: true });
  });
  it('a visitor can join and post in a visible public topic, not in private or pending ones', () => {
    expect(topicPermissions(topic(), 'u3')).toMatchObject({ canJoin: true, canPost: true, canEdit: false });
    expect(topicPermissions(topic({ visibility: 'private' }), 'u3')).toMatchObject({ canJoin: false, canPost: false });
    expect(topicPermissions(topic({ status: 'pending' }), 'u3')).toMatchObject({ canJoin: false, canPost: false });
  });
  it('signed out can only read', () => {
    expect(topicPermissions(topic(), null)).toMatchObject({ canJoin: false, canPost: false, canReport: false });
  });
});

describe('anonymous creators', () => {
  it('never names an anonymous creator', () => {
    expect(topicByline({ creator_anonymous: true, creator_username: null, is_mine: false })).toBe('Started by a member');
    expect(topicByline({ creator_anonymous: false, creator_username: 'maya' })).toBe('Started by @maya');
    expect(topicByline({ creator_anonymous: true, is_mine: true })).toMatch(/you/);
  });
});

describe('errors', () => {
  it('maps database codes to plain words', () => {
    expect(topicError({ message: 'community_topic_contrast' })).toMatch(/hard to read/);
    expect(topicError({ message: 'community_rate_limited' })).toMatch(/3 topics a day/);
  });
  it('create needs a signed-in session', async () => {
    await expect(createUserTopic(fakeSupabase({ session: null }), { name: 'Hi there' })).rejects.toThrow(/community_guest_unavailable/);
  });
});
