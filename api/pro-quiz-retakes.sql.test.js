import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';

let db;
const uid = '00000000-0000-4000-8000-000000000001';

async function claim(buildId, limit = 1) {
  const result = await db.query(
    'select * from public.claim_ecosystem_build($1,$2,$3)',
    [uid, buildId, limit]
  );
  return result.rows[0];
}

describe('Free personalization retakes', () => {
  beforeAll(async () => {
    db = new PGlite();
    await db.exec(`
      create role anon;
      create role authenticated;
      create role service_role bypassrls;
      create schema auth;
      create table auth.users(id uuid primary key);
      insert into auth.users(id) values ('${uid}');
      grant usage on schema public, auth to anon, authenticated, service_role;
    `);
    await db.exec(readFileSync(new URL('../supabase/user_ecosystem_builds.sql', import.meta.url), 'utf8'));
  }, 30000);

  afterAll(async () => { await db.close(); });

  beforeEach(async () => {
    await db.exec('truncate public.user_ecosystem_builds;');
  });

  it('does not count the initial personalization as the weekly retake', async () => {
    expect(await claim('initial')).toMatchObject({ allowed: true, used: 0 });
    expect(await claim('retake-one')).toMatchObject({ allowed: true, used: 1 });
    expect(await claim('retake-two')).toMatchObject({ allowed: false, used: 1 });
  });

  it('does not double-count retries or multiple batches of the same retake', async () => {
    await claim('initial');
    expect(await claim('retake-one')).toMatchObject({ allowed: true, used: 1 });
    expect(await claim('retake-one')).toMatchObject({ allowed: true, used: 1 });
    expect((await db.query('select count(*)::int as n from public.user_ecosystem_builds')).rows[0].n).toBe(2);
  });

  it('allows another Free retake after the weekly window rolls over', async () => {
    await claim('initial');
    await claim('last-week-retake');
    await db.exec("update public.user_ecosystem_builds set created_at = now() - interval '8 days' where build_id = 'last-week-retake'");
    expect(await claim('this-week-retake')).toMatchObject({ allowed: true, used: 1 });
  });

  it('honors a zero retake limit while still allowing initial personalization', async () => {
    expect(await claim('initial', 0)).toMatchObject({ allowed: true, used: 0 });
    expect(await claim('retake', 0)).toMatchObject({ allowed: false, used: 0 });
  });
});
