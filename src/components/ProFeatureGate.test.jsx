// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const ctx = vi.hoisted(() => ({ status: { active: false }, request: vi.fn() }));
vi.mock('../utils/proApi.js', () => ({ loadProFeatureRules: async () => ({ enabled: true }), requestPro: async () => { ctx.request(); return ctx.status; } }));
vi.mock('../utils/supabaseClient.js', () => ({ getSupabaseClient: () => null }));
vi.mock('./SubscriptionPaywallModal.jsx', () => ({ default: () => <div>Checkout</div> }));
import ProFeatureGate from './ProFeatureGate.jsx';
let root, host;
beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  vi.useFakeTimers(); ctx.request.mockClear();
  ctx.status = { active: false };
  host = document.createElement('div'); document.body.append(host); root = createRoot(host);
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.useRealTimers(); });
const render = async () => act(async () => root.render(<ProFeatureGate feature="dashboard" onEcosystem={() => {}}><div>Private dashboard</div></ProFeatureGate>));
it('shows upgrade and ecosystem actions without mounting the dashboard', async () => {
  await render();
  expect(host.textContent).toContain('Get ayna Pro');
  expect(host.textContent).toContain('See my ecosystem');
  expect(host.textContent).not.toContain('Private dashboard');
});
it('keeps access until the paid end, then relocks while open', async () => {
  ctx.status = { active: true, accessExpiresAt: Date.now() + 5000 };
  await render();
  expect(host.textContent).toBe('Private dashboard');
  ctx.status = { active: false };
  await act(async () => vi.advanceTimersByTimeAsync(5000));
  expect(host.textContent).not.toContain('Private dashboard');
  expect(host.textContent).toContain('Get ayna Pro');
});
it('rechecks access when returning to the app', async () => {
  ctx.status = { active: true }; await render();
  ctx.status = { active: false };
  await act(async () => window.dispatchEvent(new Event('focus')));
  expect(host.textContent).not.toContain('Private dashboard');
});

// Reads (Oct 28): the free Read is chosen on purpose, never spent by opening.
const renderRead = async (readId = 'r1') => act(async () => root.render(<ProFeatureGate feature="reads" readId={readId} title="Period pain" onBack={() => {}}><div>Read body</div></ProFeatureGate>));
it('asks before spending the free Read, then opens it', async () => {
  ctx.status = { active: false, weeklyRead: null, allowed: true };
  await renderRead();
  expect(host.textContent).toContain('Your free Read this week');
  expect(host.textContent).toContain('Use my free Read');
  expect(host.textContent).not.toContain('Read body');
  const use = [...host.querySelectorAll('button')].find((b) => b.textContent === 'Use my free Read');
  await act(async () => use.click());
  expect(host.textContent).toBe('Read body');
});
it('opens the Read she already chose this week', async () => {
  ctx.status = { active: false, weeklyRead: 'r1' };
  await renderRead('r1');
  expect(host.textContent).toBe('Read body');
});
it('locks other Reads once the free one is used, and says so', async () => {
  ctx.status = { active: false, weeklyRead: 'r1' };
  await renderRead('r2');
  expect(host.textContent).not.toContain('Read body');
  expect(host.textContent).toContain('used this week’s free Read');
});
it('signed out, a Read stays locked and offers ayna Pro, never opens or says try again', async () => {
  ctx.status = null;
  const signedOut = Object.assign(new Error('Sign in'), { code: 'sign_in_required' });
  const original = ctx.request.getMockImplementation();
  ctx.request.mockImplementation(() => { throw signedOut; });
  await act(async () => root.render(<ProFeatureGate feature="reads" readId="heavy-bleeding" title="Heavy bleeding" onBack={() => {}}><div>Read text</div></ProFeatureGate>));
  expect(host.textContent).not.toContain('Read text');
  expect(host.textContent).toContain('Get ayna Pro');
  expect(host.textContent).not.toContain('try again');
  ctx.request.mockImplementation(original || (() => {}));
});
