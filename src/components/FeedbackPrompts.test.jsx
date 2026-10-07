// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
vi.mock('../utils/supabaseClient', () => ({ getSupabaseClient: () => ({ auth: { getSession: async () => ({ data: { session: { access_token: 'test' } } }) } }) }));
import FeedbackPrompts from './FeedbackPrompts';
import { recordRetailerVisit, readPurchaseQueue, writePurchaseQueue } from '../utils/feedbackClient';
let root, host, fetchMock, claims;
async function tick(ms) { await act(async () => { await vi.advanceTimersByTimeAsync(ms); }); }
const button = text => [...host.querySelectorAll('button')].find(b => b.textContent === text);
async function click(el) { await act(async () => el.click()); }
async function mount(user = null, view = 'welcome') { await act(async () => root.render(<FeedbackPrompts key={user?.id || 'guest'} user={user} authLoading={false} currentView={view} />)); }
beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  vi.useFakeTimers(); sessionStorage.clear(); claims = 0;
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
    expect(host.textContent).toContain('How are you liking ayna?');
  });
  it('retains the return prompt when browser tab storage is disabled', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('storage disabled'); });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('storage disabled'); });
    await mount();
    await act(async () => recordRetailerVisit({ id: 'pads', name: 'Pads' }));
    await act(async () => { window.dispatchEvent(new Event('blur')); window.dispatchEvent(new Event('focus')); });
    expect(host.textContent).toContain('Did you buy this item?');
    await click(host.querySelector('[aria-label="Close feedback"]'));
  });
  it('does not prompt on a product click until the user leaves and returns, then saves Yes once', async () => {
    await mount();
    await act(async () => recordRetailerVisit({ id: 'pads', name: 'Pads' }));
    await tick(2000);
    expect(host.textContent).not.toContain('Did you buy');
    await act(async () => { window.dispatchEvent(new Event('blur')); window.dispatchEvent(new Event('focus')); window.dispatchEvent(new Event('focus')); });
    expect(host.querySelectorAll('.v6-survey-card')).toHaveLength(1);
    await click(button('Yes'));
    expect(host.textContent).toContain('Your anonymous answer was saved');
    expect(fetchMock.mock.calls.map(c => JSON.parse(c[1].body)).filter(b => b.action === 'submit')).toEqual([{ action: 'submit', receipt: 'purchase-token', answer: 'yes' }]);
    await click(button('Done'));
    await tick(4000);
    expect(host.querySelector('.v6-survey-card')).toBeNull();
    expect(readPurchaseQueue()).toHaveLength(0);
  });
  it('allows X without recording a purchase answer', async () => {
    await mount();
    await act(async () => recordRetailerVisit({ id: 'pads', name: 'Pads' }));
    await act(async () => { window.dispatchEvent(new Event('blur')); window.dispatchEvent(new Event('focus')); });
    await click(host.querySelector('[aria-label="Close feedback"]'));
    expect(fetchMock.mock.calls.map(c => JSON.parse(c[1].body)).some(b => b.action === 'submit')).toBe(false);
  });
  it('keeps No available for retry on a failed save instead of claiming success', async () => {
    await mount();
    await act(async () => recordRetailerVisit({ id: 'pads', name: 'Pads' }));
    await act(async () => { window.dispatchEvent(new Event('blur')); window.dispatchEvent(new Event('focus')); });
    fetchMock.mockResolvedValueOnce({ ok: false });
    await click(button('No'));
    expect(host.textContent).toContain("Couldn't save");
    expect(button('No').disabled).toBe(false);
    await click(button('No'));
    expect(host.textContent).toContain('Your anonymous answer was saved');
  });
  it('submits stars and referral without account fields', async () => {
    await mount({ id: 'account-a' }); await tick(16000);
    await click(host.querySelector('[aria-label="5 stars"]'));
    const select = host.querySelector('[aria-label="How did you hear about us?"]');
    await act(async () => { select.value = 'Instagram'; select.dispatchEvent(new Event('change', { bubbles: true })); });
    await click(button('Send feedback'));
    const sent = fetchMock.mock.calls.map(c => JSON.parse(c[1].body)).find(b => b.action === 'submit');
    expect(sent).toEqual({ action: 'submit', receipt: 'survey-token', rating: 5, feedback: '', heardAboutUs: 'Instagram' });
    expect(host.textContent).toContain('Your anonymous answer was saved');
  });
  it('offers the new survey once to an existing account, including referral, and does not repeat after dismissal', async () => {
    const user = { id: 'old-account', user_metadata: { satisfaction_survey_completed_at: '2025-01-01' } };
    await mount(user); await tick(16000);
    expect(host.textContent).toContain('How are you liking ayna?');
    expect(host.querySelector('[aria-label="How did you hear about us?"]')).not.toBeNull();
    await click(button('Not now'));
    await mount(user, 'discovery'); await tick(24000);
    expect(claims).toBe(1);
    expect(host.querySelector('[role="dialog"]')).toBeNull();
  });
  it('never interrupts onboarding and clears a pending purchase when accounts switch', async () => {
    await mount({ id: 'account-a' }, 'quiz'); await tick(24000);
    expect(claims).toBe(0);
    await act(async () => recordRetailerVisit({ id: 'pads', name: 'Pads' }));
    await mount({ id: 'account-b' }, 'welcome');
    expect(readPurchaseQueue()).toHaveLength(0);
  });
});
