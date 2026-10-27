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
