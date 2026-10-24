// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
vi.mock('../utils/supabaseClient', () => ({ getSupabaseClient: () => ({ auth: { getSession: async () => ({ data: { session: { access_token: 'test' } } }) } }) }));
import FeedbackPrompts from './FeedbackPrompts';
import { recordRetailerVisit, readPurchaseQueue, writePurchaseQueue } from '../utils/feedbackClient';
let root, host, fetchMock, claims;
async function tick(ms) { await act(async () => { await vi.advanceTimersByTimeAsync(ms); }); }
const button = text => [...document.body.querySelectorAll('button')].find(b => b.textContent === text);
async function click(el) { await act(async () => el.click()); }
async function mount(user = null, view = 'welcome', extra = {}) { await act(async () => root.render(<FeedbackPrompts key={user?.id || 'guest'} user={user} authLoading={false} currentView={view} {...extra} />)); }
beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  vi.useFakeTimers(); sessionStorage.clear(); localStorage.clear(); claims = 0;
  vi.spyOn(document, 'hasFocus').mockReturnValue(true);
  Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
  fetchMock = vi.fn(async (_url, options) => {
    const b = JSON.parse(options.body);
    const body = b.action === 'claim-survey' ? { claimed: ++claims === 1, receipt: 'survey-token' } : b.action === 'begin-purchase' ? { receipt: 'purchase-token' } : { ok: true };
    return { ok: true, json: async () => body };
  });
  vi.stubGlobal('fetch', fetchMock);
  host = document.createElement('div'); document.body.append(host); root = createRoot(host);
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
describe('feedback popup lifecycle', () => {
  it('clears previously displayed visits after a reload so they cannot block the survey', async () => {
    writePurchaseQueue([{ id: 'old', owner: 'old-account', createdAt: Date.now(), departed: true, prompted: true, receipt: 'old-receipt' }]);
    await mount({ id: 'old-account' });
    expect(readPurchaseQueue()).toHaveLength(0);
    await tick(16000);
    expect(document.body.textContent).toContain('How are you liking ayna?');
  });
  // Purchase check-ins are switched off (founder, Oct 20); these stay for if they come back.
  it.skip('retains the return prompt when browser tab storage is disabled', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('storage disabled'); });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('storage disabled'); });
    await mount();
    await act(async () => recordRetailerVisit({ id: 'pads', name: 'Pads' }));
    await act(async () => { window.dispatchEvent(new Event('blur')); window.dispatchEvent(new Event('focus')); });
    expect(document.body.textContent).toContain('Did you buy this item?');
    await click(document.body.querySelector('[aria-label="Close feedback"]'));
  });
  it.skip('does not prompt on a product click until the user leaves and returns, then saves Yes once', async () => {
    await mount();
    await act(async () => recordRetailerVisit({ id: 'pads', name: 'Pads' }));
    await tick(2000);
    expect(document.body.textContent).not.toContain('Did you buy');
    await act(async () => { window.dispatchEvent(new Event('blur')); window.dispatchEvent(new Event('focus')); window.dispatchEvent(new Event('focus')); });
    expect(document.body.querySelectorAll('[role="dialog"]')).toHaveLength(1);
    await click(button('Yes'));
    expect(document.body.textContent).toContain('Your anonymous answer was saved');
    expect(fetchMock.mock.calls.map(c => JSON.parse(c[1].body)).filter(b => b.action === 'submit')).toEqual([{ action: 'submit', receipt: 'purchase-token', answer: 'yes' }]);
    await click(button('Done'));
    await tick(4000);
    expect(document.body.querySelector('[role="dialog"]')).toBeNull();
    expect(readPurchaseQueue()).toHaveLength(0);
  });
  it.skip('allows X without recording a purchase answer', async () => {
    await mount();
    await act(async () => recordRetailerVisit({ id: 'pads', name: 'Pads' }));
    await act(async () => { window.dispatchEvent(new Event('blur')); window.dispatchEvent(new Event('focus')); });
    await click(document.body.querySelector('[aria-label="Close feedback"]'));
    expect(fetchMock.mock.calls.map(c => JSON.parse(c[1].body)).some(b => b.action === 'submit')).toBe(false);
  });
  it.skip('keeps No available for retry on a failed save instead of claiming success', async () => {
    await mount();
    await act(async () => recordRetailerVisit({ id: 'pads', name: 'Pads' }));
    await act(async () => { window.dispatchEvent(new Event('blur')); window.dispatchEvent(new Event('focus')); });
    fetchMock.mockResolvedValueOnce({ ok: false });
    await click(button('No'));
    expect(document.body.textContent).toContain("Couldn't save");
    expect(button('No').disabled).toBe(false);
    await click(button('No'));
    expect(document.body.textContent).toContain('Your anonymous answer was saved');
  });
  it('submits stars and referral without account fields', async () => {
    await mount({ id: 'account-a' }); await tick(16000);
    await click(document.body.querySelector('[aria-label="5 stars"]'));
    const select = document.body.querySelector('[aria-label="How did you hear about us?"]');
    await act(async () => { select.value = 'Instagram'; select.dispatchEvent(new Event('change', { bubbles: true })); });
    await click(button('Send feedback'));
    const sent = fetchMock.mock.calls.map(c => JSON.parse(c[1].body)).find(b => b.action === 'submit');
    expect(sent).toEqual({ action: 'submit', receipt: 'survey-token', rating: 5, feedback: '', heardAboutUs: 'Instagram' });
    expect(document.body.textContent).toContain('Your anonymous answer was saved');
  });
  it('offers the new survey once to an existing account, including referral, and does not repeat after dismissal', async () => {
    const user = { id: 'old-account', user_metadata: { satisfaction_survey_completed_at: '2025-01-01' } };
    await mount(user); await tick(16000);
    expect(document.body.textContent).toContain('How are you liking ayna?');
    expect(document.body.querySelector('[aria-label="How did you hear about us?"]')).not.toBeNull();
    await click(button('Not now'));
    await mount(user, 'discovery'); await tick(24000);
    expect(claims).toBe(1);
    expect(document.body.querySelector('[role="dialog"]')).toBeNull();
  });
  it('asks soon after login and dismisses when the person navigates away', async () => {
    await mount({ id: 'account-a' });
    await tick(2000);
    expect(document.body.textContent).toContain('How are you liking ayna?');
    await mount({ id: 'account-a' }, 'discovery');
    expect(document.body.querySelector('[role="dialog"]')).toBeNull();
  });
  it('never interrupts onboarding and clears a pending purchase when accounts switch', async () => {
    await mount({ id: 'account-a' }, 'quiz'); await tick(24000);
    expect(claims).toBe(0);
    await act(async () => recordRetailerVisit({ id: 'pads', name: 'Pads' }));
    await mount({ id: 'account-b' }, 'welcome');
    expect(readPurchaseQueue()).toHaveLength(0);
  });
  it('re-asks after 14 days on a new visit, not sooner, and counts closing as asked on this device', async () => {
    const user = { id: 'repeat-account' };
    await mount(user); await tick(16000);
    expect(document.body.textContent).toContain('How are you liking ayna?');
    await click(button('Not now'));
    // A new visit 13 days later: this device doesn't even ask the server.
    await act(async () => root.unmount()); root = createRoot(host);
    vi.setSystemTime(Date.now() + 13 * 86400000);
    await mount(user); await tick(16000);
    expect(claims).toBe(1);
    // 14 days after closing it: asks the server again, which decides.
    await act(async () => root.unmount()); root = createRoot(host);
    vi.setSystemTime(Date.now() + 1 * 86400000);
    claims = 0;
    await mount(user); await tick(16000);
    expect(claims).toBe(1);
    expect(document.body.textContent).toContain('How are you liking ayna?');
  });
  it('uses the app screen names when given its safe screens', async () => {
    await mount({ id: 'app-account' }, 'eco', { safeViews: new Set(['eco']) }); await tick(16000);
    expect(document.body.textContent).toContain('How are you liking ayna?');
  });
});
