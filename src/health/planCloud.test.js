import { describe, it, expect, beforeEach } from 'vitest';
import { syncDayPlan, forgetPlanOnSignOut, PLAN_OWNER_KEY } from './planCloud.js';
import { saveMed, readMeds, MEDS_KEY } from './medications.js';

function mem() { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; }
const server = { plan: null, status: 200 };
const fetchImpl = async (_p, init) => {
  if (server.status !== 200) return { ok: false, status: server.status, json: async () => ({ error: 'not_ready' }) };
  const body = JSON.parse(init.body);
  const { mergePlans, cleanPlan } = await import('./planSync.js');
  server.plan = mergePlans(cleanPlan(server.plan || {}), cleanPlan(body.plan));
  return { ok: true, status: 200, json: async () => ({ ok: true, plan: server.plan }) };
};
const getToken = async () => 'tok';
let s;
beforeEach(() => { s = mem(); server.plan = null; server.status = 200; });

describe('day plan sync', () => {
  it('a plan made signed out joins her account, then is hers', async () => {
    saveMed({ name: 'Levothyroxine', times: ['08:00'] }, { storage: s });
    expect((await syncDayPlan({ userId: 'u1', storage: s, getToken, fetchImpl })).status).toBe('synced');
    expect(server.plan.meds[0].name).toBe('Levothyroxine');
    expect(s.getItem(PLAN_OWNER_KEY)).toBe('u1');
  });
  it("another account's plan on the phone is never uploaded into hers", async () => {
    saveMed({ name: 'Private med', times: ['08:00'] }, { storage: s });
    s.setItem(PLAN_OWNER_KEY, 'someone-else');
    await syncDayPlan({ userId: 'u1', storage: s, getToken, fetchImpl });
    expect(server.plan.meds).toHaveLength(0);
    expect(readMeds(s).meds).toHaveLength(0);
  });
  it('not ready keeps everything on the phone', async () => {
    saveMed({ name: 'Kept', times: ['08:00'] }, { storage: s });
    server.status = 503;
    expect((await syncDayPlan({ userId: 'u1', storage: s, getToken, fetchImpl })).status).toBe('not_ready');
    expect(readMeds(s).meds[0].name).toBe('Kept');
  });
  it('signing out removes an account plan from the phone, not a signed-out one', async () => {
    saveMed({ name: 'Mine', times: ['08:00'] }, { storage: s });
    expect(forgetPlanOnSignOut(s)).toBe(false);
    s.setItem(PLAN_OWNER_KEY, 'u1');
    expect(forgetPlanOnSignOut(s)).toBe(true);
    expect(s.getItem(MEDS_KEY)).toBeNull();
  });
});
