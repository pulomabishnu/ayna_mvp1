// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';

const status = { value: { trialAvailable: true, trialDays: 14, active: false, gates: true } };
vi.mock('../utils/proApi.js', () => ({ requestPro: vi.fn(async () => status.value) }));
const { useProCta } = await import('./useTrialAvailable.js');
const { PRO_CHANGED_EVENT } = await import('./paywall.js');

function Btn() { return <button type="button">{useProCta()}</button>; }

describe('Pro buttons offer the free trial while it is unused (Nov 17)', () => {
  it('says Try Pro free for 14 days, then Get ayna Pro once the trial is used', async () => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    const el = document.createElement('div');
    const root = createRoot(el);
    await act(async () => { root.render(<Btn />); });
    expect(el.textContent).toBe('Try Pro free for 14 days');
    status.value = { trialAvailable: false, trialDays: 14, active: false, gates: true };
    await act(async () => { window.dispatchEvent(new Event(PRO_CHANGED_EVENT)); });
    expect(el.textContent).toBe('Get ayna Pro');
    root.unmount();
  });
});
