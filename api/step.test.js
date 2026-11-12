/* global Buffer */
import { readFileSync } from 'node:fs';
import { describe, it, expect, vi, afterEach } from 'vitest';
import handler, { readStep, setStepAdminForTests, JOURNEY_STEPS } from './step.js';
import { JOURNEY_STEPS as CLIENT_STEPS } from '../src/utils/journeyStep.js';
import { mockReq, mockRes } from './_test-helpers.js';

const fakeDb = (result = { error: null }) => ({ rpc: vi.fn(async () => result) });
const sql = readFileSync(new URL('../supabase/journey_step_daily_ctas_2026-11-11.sql', import.meta.url), 'utf8');
afterEach(() => setStepAdminForTests(null));

describe('readStep', () => {
  it('reads a text body, a JSON body, a Buffer or the query', () => {
    const want = { step: 'quiz_started', platform: 'web' };
    expect(readStep({ body: '{"s":"quiz_started","pl":"web"}' })).toEqual(want);
    expect(readStep({ body: Buffer.from('{"s":"quiz_started","pl":"web"}') })).toEqual(want);
    expect(readStep({ body: { s: 'quiz_started', pl: 'web' } })).toEqual(want);
    expect(readStep({ query: { s: 'quiz_started', pl: 'web' } })).toEqual(want);
  });
  it('rejects unknown steps and platforms', () => {
    for (const body of ['nope', '{"s":"x","pl":"web"}', '{"s":"landed","pl":"mac"}', '{"s":"landed"}', '{}']) {
      expect(readStep({ body }), body).toBeNull();
    }
  });
  it('the site, the API and the SQL list the same steps', () => {
    expect([...CLIENT_STEPS]).toEqual(JOURNEY_STEPS);
    const list = JOURNEY_STEPS.map((s) => `'${s}'`).join(', ');
    expect(sql.split(list).length - 1).toBe(2); // table check + function guard
    expect(sql).toContain("('web', 'ios_app', 'android_app')");
  });
  it('accepts every landing button step', () => {
    for (const s of ['cta_signup_topbar', 'cta_signup_hero', 'cta_signup_end', 'cta_faq_ask_us']) {
      expect(readStep({ body: { s, pl: 'web' } }), s).toEqual({ step: s, platform: 'web' });
    }
    expect(readStep({ body: { s: 'cta_made_up', pl: 'web' } })).toBeNull();
  });
});

describe('POST /api/step', () => {
  it('adds one to the step and stores nothing about the person', async () => {
    const db = fakeDb();
    setStepAdminForTests(db);
    const res = mockRes();
    await handler(mockReq({ body: '{"s":"account_created","pl":"ios_app","email":"a@b.co"}', headers: { 'x-forwarded-for': '1.2.3.4', 'user-agent': 'UA' } }), res);
    expect(res.statusCode).toBe(204);
    expect(db.rpc).toHaveBeenCalledWith('record_journey_step', { p_step: 'account_created', p_platform: 'ios_app' });
    expect(JSON.stringify(db.rpc.mock.calls)).not.toMatch(/1\.2\.3\.4|UA|a@b/);
  });
  it('204 and no write for a bad step', async () => {
    const db = fakeDb();
    setStepAdminForTests(db);
    const res = mockRes();
    await handler(mockReq({ body: '{"s":"<x>","pl":"web"}' }), res);
    expect(res.statusCode).toBe(204);
    expect(db.rpc).not.toHaveBeenCalled();
  });
  it('a database error never becomes a page error', async () => {
    setStepAdminForTests(fakeDb({ error: { code: '42P01', message: 'missing' } }));
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = mockRes();
    await handler(mockReq({ body: '{"s":"landed","pl":"web"}' }), res);
    expect(res.statusCode).toBe(204);
    spy.mockRestore();
  });
  it('only POST counts', async () => {
    const db = fakeDb();
    setStepAdminForTests(db);
    const res = mockRes();
    await handler(mockReq({ method: 'GET', query: { s: 'landed', pl: 'web' } }), res);
    expect(res.statusCode).toBe(405);
    expect(db.rpc).not.toHaveBeenCalled();
  });
});

describe('journey_step_daily SQL', () => {
  it('stores only day, step, platform and count, readable by the service role only', () => {
    const table = sql.match(/create table if not exists public\.journey_step_daily \(([\s\S]*?)\n\);/)[1];
    const cols = table.split('\n').map((l) => l.trim().split(/\s+/)[0]).filter((c) => c && c !== 'primary');
    expect(cols).toEqual(['day', 'step', 'platform', 'count']);
    expect(sql).toContain('enable row level security');
    // Works on a fresh database and on one that already ran the first file: the step check is replaced, rows kept.
    expect(sql).toContain('drop constraint if exists journey_step_daily_step_check');
    expect(sql).not.toMatch(/drop table|truncate|delete from/i);
    expect(sql).toContain('revoke all on public.journey_step_daily from anon, authenticated');
    expect(sql).toContain('revoke all on function public.record_journey_step(text, text) from public, anon, authenticated');
  });
});
