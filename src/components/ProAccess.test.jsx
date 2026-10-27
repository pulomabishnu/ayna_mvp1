// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
const request = vi.hoisted(() => vi.fn());
vi.mock('../utils/proApi.js', () => ({ requestPro: request }));
import ProAccess from './ProAccess.jsx';
let root, host;
const user = { id: 'u1' };
const offer = { active: false, hasPurchase: false, offerOpen: true, launchAt: '2027-01-01T05:00:00Z', plans: [
  { id: 'month', label: 'First month', amount: 499, regularAmount: 899 }, { id: 'year', label: 'First year', amount: 4500, regularAmount: 9000 },
] };
beforeEach(() => {
  request.mockReset().mockResolvedValue(offer);
  host = document.createElement('div'); document.body.append(host); root = createRoot(host);
  window.history.replaceState({}, '', '/you/pro');
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); });
const mount = async props => { await act(async () => root.render(<ProAccess {...props} />)); };
describe('Early Access price and membership display', () => {
  it('shows correct comparison prices and precise introductory discounts', async () => {
    await mount({ user });
    expect([...host.querySelectorAll('del')].map(e => e.textContent)).toEqual(['$8.99', '$90.00']);
    expect(host.textContent).toContain('$4.99 now'); expect(host.textContent).toContain('$45.00 now');
    expect(host.textContent).toContain('Save $4 on your first month'); expect(host.textContent).toContain('50% off your first year');
    expect(host.textContent).toContain('Then $8.99/month, unless canceled');
    expect(host.textContent).toContain('Then $90.00/year, unless canceled');
  });
  it('describes the Free/Pro split and labels future capabilities honestly',async()=>{
    await mount({user});
    expect(host.textContent).toContain('Unlimited playlist creation');
    expect(host.textContent).toContain('What stays free');
    expect(host.textContent).toContain('Safety and evidence information');
    expect(host.textContent).toContain('Growing during Early Access');
    expect(host.textContent).toContain('Specific perks are still being defined.');
  });
  it('never treats a success query parameter as paid access', async () => {
    window.history.replaceState({}, '', '/you/pro?checkout=success');
    await mount({ user });
    expect(host.textContent).toContain('waiting for payment confirmation');
    expect(host.textContent).not.toContain('Your Pro access is active.');
  });
  it('shows paid dates and a cancellation control', async () => {
    request.mockResolvedValue({ ...offer, active: true, hasPurchase: true, autoRenew: true, plan: 'month', termStartsAt: '2027-01-01T05:00:00Z', termEndsAt: '2027-02-01T05:00:00Z' });
    await mount({ user });
    expect(host.textContent).toContain('January 1, 2027'); expect(host.textContent).toContain('February 1, 2027');
    const cancel = [...host.querySelectorAll('button')].find(b => b.textContent === 'Cancel renewal');
    expect(cancel).toBeTruthy();
    await act(async () => cancel.click());
    expect(request).toHaveBeenCalledWith({ action: 'cancel_renewal' });
  });
  it('offers sign-in without a checkout for signed-out users', async () => {
    await mount({ user: null, onSignIn: vi.fn() });
    expect(host.textContent).toContain('Sign in'); expect(request).not.toHaveBeenCalled(); expect(host.querySelector('del')).toBeNull();
  });
  it('does not show a previous account’s entitlement after an account switch', async () => {
    request.mockResolvedValue({ ...offer, active: true, plan: 'year' }); await mount({ user });
    request.mockImplementation(() => new Promise(() => {})); await mount({ user: { id: 'u2' } });
    expect(host.textContent).not.toContain('Your Pro access is active.');
  });
});
