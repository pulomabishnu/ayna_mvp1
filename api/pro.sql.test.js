import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';

let db;
const uid = '00000000-0000-4000-8000-000000000001';
const other = '00000000-0000-4000-8000-000000000002';
const migration = readFileSync(new URL('../supabase/migrations/20261026234901_ayna_pro_early_access.sql', import.meta.url), 'utf8');
beforeAll(async () => {
  db = new PGlite();
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema public, auth to anon, authenticated, service_role;
    insert into auth.users values ('${uid}'), ('${other}');`);
  await db.exec(migration);
  await db.exec(migration); // re-applying is safe
}, 30000);
afterAll(async () => { await db?.close(); });
beforeEach(async () => {
  await db.exec(`reset role; truncate public.pro_purchases, public.pro_payment_revocations, public.pro_focus_grants, public.pro_subscriptions; update public.pro_launch set launch_at = null;`);
});
async function grant({ user = uid, plan = 'month', paidAt = '2026-11-01T00:00:00Z', session = 'cs_paid', pi = 'pi_paid' } = {}) {
  await db.query(`insert into public.pro_purchases(session_id,payment_intent_id,user_id,plan,paid_at,price_id,livemode)
    values ($1,$2,$3,$4,$5,'price_test',false) on conflict (session_id) do nothing`, [session, pi, user, plan, paidAt]);
}
async function status(user = uid) { return (await db.query('select public.pro_access_status($1) as status', [user])).rows[0].status; }
async function launch(at) { await db.query('update public.pro_launch set launch_at = $1', [at]); }
async function revoke() { await db.exec("insert into public.pro_payment_revocations values ('pi_paid','refund',now()) on conflict do nothing"); }

describe('real Postgres Pro access rules', () => {
  it('does not grant free access when no launch date or payment exists', async () => { expect((await status()).active).toBe(false); });
  it('grants early access without consuming the prepaid term while launch is unset', async () => {
    await grant(); expect(await status()).toMatchObject({ active: true, plan: 'month', termStartsAt: null, termEndsAt: null });
  });
  it('starts a calendar month at launch, not at payment', async () => {
    await grant(); await launch('2099-01-01T00:00:00Z');
    const s = await status(); expect(s.active).toBe(true);
    expect(Date.parse(s.termStartsAt)).toBe(Date.parse('2099-01-01T00:00:00Z'));
    expect(Date.parse(s.termEndsAt)).toBe(Date.parse('2099-02-01T00:00:00Z'));
  });
  it('starts a calendar year at launch', async () => {
    await grant({ plan: 'year' }); await launch('2099-01-01T00:00:00Z');
    expect(Date.parse((await status()).termEndsAt)).toBe(Date.parse('2100-01-01T00:00:00Z'));
  });
  it('keeps the whole term for delayed payment that settles after launch', async () => {
    await grant({ paidAt: '2099-02-01T00:00:00Z' }); await launch('2099-01-01T00:00:00Z');
    expect(Date.parse((await status()).termEndsAt)).toBe(Date.parse('2099-03-01T00:00:00Z'));
  });
  it('expires automatically and preserves the original grant on retries', async () => {
    await grant({ paidAt: '2020-01-01T00:00:00Z' }); await launch('2020-02-01T00:00:00Z');
    await grant({ paidAt: '2099-01-01T00:00:00Z' });
    expect((await status()).active).toBe(false);
    expect((await db.query('select count(*)::int as n from public.pro_purchases')).rows[0].n).toBe(1);
  });
  it('handles leap years and end-of-month terms', async () => {
    await grant(); await launch('2096-01-31T12:00:00Z');
    expect(Date.parse((await status()).termEndsAt)).toBe(Date.parse('2096-02-29T12:00:00Z'));
  });
  it('does not restore refunded access on a completion replay', async () => {
    await grant(); await revoke(); await grant(); expect((await status()).active).toBe(false);
  });
  it('handles refunds arriving before completion', async () => {
    await revoke(); await grant(); expect((await status()).active).toBe(false);
  });
  it('does not revoke a different valid purchase', async () => {
    await grant(); await revoke(); await grant({ session: 'cs_new', pi: 'pi_new', plan: 'year' });
    expect(await status()).toMatchObject({ active: true, plan: 'year' });
  });
  it('uses UTC calendar arithmetic regardless of database timezone', async () => {
    await grant(); await launch('2099-03-10T00:00:00Z');
    const a = await status(); await db.exec("set timezone = 'America/New_York'"); const b = await status();
    expect(Date.parse(a.termEndsAt)).toBe(Date.parse(b.termEndsAt));
    await db.exec("set timezone = 'UTC'");
  });
  it('keeps each account’s access separate', async () => { await grant(); expect((await status(other)).active).toBe(false); });
  it('prevents clients from granting Pro, changing launch, or using the admin RPC', async () => {
    await db.exec(`set role authenticated; set request.jwt.claim.sub = '${uid}';`);
    await expect(grant()).rejects.toThrow(/permission denied/);
    await expect(launch('2099-01-01')).rejects.toThrow(/permission denied/);
    await expect(status()).rejects.toThrow(/permission denied/);
  });
  it('only exports the caller’s own purchases via RLS', async () => {
    await grant(); await grant({ user: other, session: 'cs_other', pi: 'pi_other' });
    await db.exec(`set role authenticated; set request.jwt.claim.sub = '${uid}';`);
    expect((await db.query('select user_id from public.pro_purchases')).rows).toEqual([{ user_id: uid }]);
    await expect(db.query('select * from public.pro_payment_revocations')).rejects.toThrow(/permission denied/);
  });
  it('expires focus-group access without a job or JWT refresh', async () => {
    await db.query("insert into public.pro_focus_grants values ($1, now() + interval '1 hour')", [uid]);
    expect((await status()).active).toBe(true);
    await db.query("update public.pro_focus_grants set expires_at = now() - interval '1 second' where user_id=$1", [uid]);
    expect((await status()).active).toBe(false);
  });
  it('ending a temporary grant leaves paid access intact', async () => {
    await grant();
    await db.query("insert into public.pro_focus_grants values ($1, now() - interval '1 second')", [uid]);
    expect((await status()).active).toBe(true);
  });
  it('keeps a snapshotted paid term separate from later launch edits', async () => {
    await grant();
    await db.exec("update public.pro_purchases set term_starts_at='2099-01-01T05:00:00Z', term_ends_at='2099-02-01T05:00:00Z'");
    await launch('2099-03-01T05:00:00Z');
    expect(Date.parse((await status()).termEndsAt)).toBe(Date.parse('2099-02-01T05:00:00Z'));
  });
  it('removes the access ledger on account deletion', async () => {
    await grant(); await db.query('delete from auth.users where id=$1', [uid]);
    expect((await db.query('select * from public.pro_purchases')).rows).toHaveLength(0);
    await db.query('insert into auth.users values ($1)', [uid]);
  });
});
