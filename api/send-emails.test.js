/* global process */
import { describe, it, expect, beforeEach } from 'vitest';
import { runEmailJob } from './send-emails.js';
import { unsubToken, verifyUnsubToken, richToHtml, communityEmail } from './_email.js';

// Tiny in-memory stand-in for the Supabase admin client: just the query
// shapes send-emails.js uses.
function fakeAdmin(tables, users) {
  const sends = tables.email_sends || (tables.email_sends = []);
  function q(name) {
    let rows = [...(tables[name] || [])];
    const api = {
      select() { return api; },
      gte(c, v) { rows = rows.filter((r) => r[c] >= v); return api; },
      lte(c, v) { rows = rows.filter((r) => r[c] <= v); return api; },
      is(c, v) { rows = rows.filter((r) => (r[c] ?? null) === v); return api; },
      in(c, vs) { rows = rows.filter((r) => vs.includes(r[c])); return api; },
      eq(c, v) { rows = rows.filter((r) => r[c] === v); return api; },
      order() { return api; },
      limit(n) { rows = rows.slice(0, n); return api; },
      upsert(list) {
        const added = [];
        for (const r of list) {
          if (!sends.some((s) => s.user_id === r.user_id && s.kind === r.kind && s.ref === r.ref)) { sends.push(r); added.push(r); }
        }
        return { select: () => Promise.resolve({ data: added, error: null }) };
      },
      delete() {
        const d = { conds: [] };
        const chain = { eq(c, v) { d.conds.push([c, v]); if (d.conds.length === 3) { const keep = sends.filter((s) => !d.conds.every(([k, x]) => s[k] === x)); sends.length = 0; sends.push(...keep); } return chain; } };
        return chain;
      },
      then(ok) { return Promise.resolve({ data: rows, error: null }).then(ok); },
    };
    return api;
  }
  return {
    from: q,
    auth: { admin: { listUsers: async () => ({ data: { users }, error: null }) } },
  };
}

const NOW = Date.parse('2026-10-18T14:00:00Z');
const ago = (min) => new Date(NOW - min * 60000).toISOString();
const U1 = '11111111-1111-1111-1111-111111111111';
const U2 = '22222222-2222-2222-2222-222222222222';
const users = [
  { id: U1, email: 'a@example.com', email_confirmed_at: ago(9999) },
  { id: U2, email: 'b@example.com', email_confirmed_at: ago(9999) },
];

describe('send-emails job', () => {
  beforeEach(() => { process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-secret'; });

  it('weekly: one roundup per person on the default weekly setting, never twice', async () => {
    const tables = {
      community_notifications: [
        { id: 'n1', recipient_id: U1, actor_id: U2, type: 'follow', created_at: ago(60 * 24), read_at: null },
        { id: 'n2', recipient_id: U1, actor_id: U2, type: 'comment', created_at: ago(60 * 48), read_at: null },
        { id: 'n3', recipient_id: U1, actor_id: U2, type: 'reaction', created_at: ago(60), read_at: '2026-10-18T13:30:00Z' },
        { id: 'n4', recipient_id: U2, actor_id: U2, type: 'follow', created_at: ago(60), read_at: null },
      ],
      community_profiles: [{ user_id: U2, display_name: 'Eliz' }],
      email_preferences: [],
    };
    const admin = fakeAdmin(tables, users);
    const sent = [];
    const send = async (list) => { sent.push(...list); return { sent: list.length, failed: 0 }; };
    const s = await runEmailJob(admin, { mode: 'weekly', dry: false, now: NOW, send });
    expect(s.sent).toBe(1);
    expect(sent[0].to).toEqual(['a@example.com']);
    expect(sent[0].text).toContain('Eliz followed you');
    expect(sent[0].text).not.toContain('helpful'); // already read in the app
    expect(sent[0].headers['List-Unsubscribe']).toContain('/api/email-unsubscribe');
    const again = await runEmailJob(admin, { mode: 'weekly', dry: false, now: NOW, send });
    expect(again.sent).toBe(0);
  });

  it('respects off switches and "as it happens"', async () => {
    const tables = {
      community_notifications: [{ id: 'n1', recipient_id: U1, actor_id: U2, type: 'follow', created_at: ago(30), read_at: null }],
      email_preferences: [{ user_id: U1, prefs: { communityFreq: 'instant' }, unsubscribed_all: false }],
      community_announcements: [{ id: 'a1', title: 'Q&A Thursday', body: '**Bring** questions', created_at: ago(30) }],
    };
    const admin = fakeAdmin(tables, users);
    const sent = [];
    const send = async (list) => { sent.push(...list); return { sent: list.length, failed: 0 }; };
    const s = await runEmailJob(admin, { mode: 'instant', dry: false, now: NOW, send });
    expect(s.community).toBe(1);
    expect(s.announcements).toBe(2);
    expect(sent.find((e) => e.subject === 'Q&A Thursday').html).toContain('<strong>Bring</strong>');

    tables.email_preferences = [{ user_id: U1, prefs: {}, unsubscribed_all: true }];
    tables.community_announcements.push({ id: 'a2', title: 'Second', body: '', created_at: ago(20) });
    const sent2 = [];
    await runEmailJob(fakeAdmin(tables, users), { mode: 'instant', dry: false, now: NOW, send: async (l) => { sent2.push(...l); return { sent: l.length, failed: 0 }; } });
    expect(sent2.every((e) => e.to[0] !== 'a@example.com')).toBe(true);
  });

  it('dry run sends and writes nothing', async () => {
    const tables = { community_notifications: [{ id: 'n1', recipient_id: U1, actor_id: U2, type: 'follow', created_at: ago(60), read_at: null }], email_preferences: [] };
    let called = false;
    const s = await runEmailJob(fakeAdmin(tables, users), { mode: 'weekly', dry: true, now: NOW, send: async () => { called = true; return { sent: 0, failed: 0 }; } });
    expect(s.community).toBe(1);
    expect(called).toBe(false);
    expect(tables.email_sends.length).toBe(0);
  });

  it('a failed send is released so the next run retries', async () => {
    const tables = { community_notifications: [{ id: 'n1', recipient_id: U1, actor_id: U2, type: 'follow', created_at: ago(60), read_at: null }], email_preferences: [] };
    const admin = fakeAdmin(tables, users);
    const s = await runEmailJob(admin, { mode: 'weekly', dry: false, now: NOW, send: async (l) => ({ sent: 0, failed: l.length }) });
    expect(s.failed).toBe(1);
    expect(tables.email_sends.length).toBe(0);
  });
});

describe('email helpers', () => {
  beforeEach(() => { process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-secret'; });
  it('unsubscribe tokens are per person and per group', () => {
    const t = unsubToken(U1, 'community');
    expect(verifyUnsubToken(U1, 'community', t)).toBe(true);
    expect(verifyUnsubToken(U2, 'community', t)).toBe(false);
    expect(verifyUnsubToken(U1, 'all', t)).toBe(false);
  });
  it('formats announcements safely', () => {
    expect(richToHtml('Hi <b>x</b>\n- **one**\n- two')).toBe('<p style="margin:0 0 14px">Hi &lt;b&gt;x&lt;/b&gt;</p><ul style="margin:0 0 14px;padding-left:22px"><li style="margin:4px 0"><strong>one</strong></li><li style="margin:4px 0">two</li></ul>');
  });
  it('subjects carry no health details', () => {
    const e = communityEmail({ to: 'a@example.com', userId: U1, notes: [{ actor_id: U2, type: 'comment' }], names: new Map([[U2, 'Eliz']]), weekly: false });
    expect(e.subject).toBe('Eliz commented on your post');
  });
});
