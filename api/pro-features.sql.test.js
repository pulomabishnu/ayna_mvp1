import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';
let db;
const uid = '00000000-0000-4000-8000-000000000001';
const other = '00000000-0000-4000-8000-000000000002';
beforeAll(async () => {
  db = new PGlite();
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create table auth.users(id uuid primary key,raw_app_meta_data jsonb default '{}',raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema public,auth to anon,authenticated,service_role;
    create table public.community_playlists(id uuid primary key default gen_random_uuid(),owner_id uuid references auth.users(id),title text);
    insert into auth.users(id) values ('${uid}'),('${other}');`);
  for (const name of ['20261026234901_ayna_pro_early_access.sql','20261027002913_pro_feature_access.sql','20261027002913_pro_feature_access.sql']) await db.exec(readFileSync(new URL(`../supabase/migrations/${name}`,import.meta.url),'utf8'));
},30000);
afterAll(async () => { await db.close(); });
beforeEach(async () => {
  await db.exec(`reset role; truncate public.community_playlists,public.pro_focus_grants,public.pro_weekly_reads;
    update public.pro_feature_rules set enabled=true;
    update auth.users set raw_app_meta_data='{}',raw_user_meta_data='{}'; set request.jwt.claim.sub='${uid}';`);
});
const add = () => db.query('insert into public.community_playlists(owner_id,title) values ($1,\'Pick\')',[uid]);
const read = (id,premium=false) => db.query('select public.pro_claim_read($1,$2,$3) as allowed',[uid,id,premium]).then(r=>r.rows[0].allowed);
describe('database-enforced Pro allowances',()=>{
  it('allows one free playlist and preserves editing after the limit',async()=>{
    await add(); await expect(add()).rejects.toThrow(/pro_playlist_limit/);
    await db.exec("update public.community_playlists set title='Edited'");
    expect((await db.query('select title from public.community_playlists')).rows[0].title).toBe('Edited');
  });
  it('does not accept the user-editable premium flag',async()=>{
    await db.query("update auth.users set raw_user_meta_data='{\"is_premium\":true}' where id=$1",[uid]);
    await add(); await expect(add()).rejects.toThrow(/pro_playlist_limit/);
  });
  it('allows unlimited creation for an active focus-group grant, then relocks',async()=>{
    await db.query("insert into public.pro_focus_grants values ($1,now()+interval '1 hour')",[uid]);
    await add(); await add();
    await db.exec("update public.pro_focus_grants set expires_at=now()-interval '1 second'");
    await expect(add()).rejects.toThrow(/pro_playlist_limit/);
    expect((await db.query('select count(*)::int as n from public.community_playlists')).rows[0].n).toBe(2);
  });
  it('ignores another account’s temporary access',async()=>{
    await db.query("insert into public.pro_focus_grants values ($1,now()+interval '1 hour')",[other]);
    await add(); await expect(add()).rejects.toThrow(/pro_playlist_limit/);
  });
  it('respects the disabled rollout switch',async()=>{
    await db.exec('update public.pro_feature_rules set enabled=false'); await add(); await add();
  });
  it('allows reopening the selected free premium Read but refuses a different one',async()=>{
    expect(await read('read-one')).toBe(true); expect(await read('read-one')).toBe(true); expect(await read('read-two')).toBe(false);
  });
  it('allows unlimited Pro Reads without consuming the free slot',async()=>{
    expect(await read('read-one',true)).toBe(true); expect(await read('read-two',true)).toBe(true);
    expect((await db.query('select * from public.pro_weekly_reads')).rows).toEqual([]);
  });
  it('does not expose a way for clients to mint Read allowances',async()=>{
    await db.exec('set role authenticated'); await expect(read('read-one',true)).rejects.toThrow(/permission denied/);
  });
  it('only grants one free Read under concurrent requests',async()=>{
    const result=await Promise.all([read('a'),read('b')]); expect(result.filter(Boolean)).toHaveLength(1);
  });
});
