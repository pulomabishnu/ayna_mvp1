import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const ctx = vi.hoisted(() => ({ status: null, error: null, opened: [], host: true, count: 0 }));
vi.mock('../utils/proApi.js', () => ({ requestPro: async () => { if (ctx.error) throw ctx.error; return ctx.status; } }));
vi.mock('./paywall.js', () => ({ PRO_CHANGED_EVENT: 'x', openProPaywall: (d) => { ctx.opened.push(d); return ctx.host; } }));
import { proDoor, retakeDoor, playlistDoor, resetProDoor } from './proDoor.js';

const supa = () => ({ from: () => ({ select: () => ({ eq: async () => ({ count: ctx.count }) }) }) });
beforeEach(() => { resetProDoor(); ctx.opened = []; ctx.error = null; ctx.host = true; ctx.count = 0; });
afterEach(() => vi.restoreAllMocks());

it('free account: the Pro sheet opens at the door and the page never does', async () => {
  ctx.status = { active: false, gates: true };
  const go = vi.fn();
  await proDoor('wearables', go);
  expect(go).not.toHaveBeenCalled();
  expect(ctx.opened[0]).toMatchObject({ feature: 'wearables' });
});
it('Pro member, or gates switched off: straight through', async () => {
  ctx.status = { active: true, gates: true }; const a = vi.fn(); await proDoor('dashboard', a); expect(a).toHaveBeenCalled();
  resetProDoor(); ctx.status = { active: false, gates: false }; const b = vi.fn(); await proDoor('dashboard', b); expect(b).toHaveBeenCalled();
  expect(ctx.opened).toHaveLength(0);
});
it('status cannot be read: the page goes on and its own server-checked gate decides', async () => {
  ctx.error = new Error('offline'); const go = vi.fn(); await proDoor('dashboard', go); expect(go).toHaveBeenCalled();
});
it('quiz retake: locked before the first question once the month’s retake is used', async () => {
  ctx.status = { active: false, gates: true, quizRetakeOpen: false }; const go = vi.fn(); await retakeDoor(go);
  expect(go).not.toHaveBeenCalled(); expect(ctx.opened[0]).toMatchObject({ feature: 'quiz' });
  resetProDoor(); ctx.opened = []; ctx.status = { active: false, gates: true, quizRetakeOpen: true }; const ok = vi.fn(); await retakeDoor(ok); expect(ok).toHaveBeenCalled();
});
it('playlists: the first one is free, the second opens the Pro sheet', async () => {
  ctx.status = { active: false, gates: true };
  ctx.count = 0; const first = vi.fn(); await playlistDoor(supa(), 'u1', first); expect(first).toHaveBeenCalled();
  ctx.count = 1; const second = vi.fn(); await playlistDoor(supa(), 'u1', second); expect(second).not.toHaveBeenCalled();
  expect(ctx.opened.at(-1)).toMatchObject({ feature: 'playlists' });
});
