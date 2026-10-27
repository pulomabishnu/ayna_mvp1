// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
const edge = vi.hoisted(() => ({ status: vi.fn(), rules: vi.fn(), auth: null }));
vi.mock('../utils/proApi.js', () => ({ requestPro: edge.status, loadProFeatureRules: edge.rules }));
vi.mock('../utils/supabaseClient.js', () => ({ getSupabaseClient: () => ({ auth: { onAuthStateChange: cb => { edge.auth = cb; return { data: { subscription: { unsubscribe() {} } } }; } } }) }));
vi.mock('../pro/premiumReads.js', () => ({ PREMIUM_READ_IDS: ['premium-read'] }));
import ProFeatureGate from './ProFeatureGate.jsx';
let root,host;
beforeEach(() => {
  vi.useFakeTimers(); edge.status.mockReset().mockResolvedValue({ active:true, allowed:true }); edge.rules.mockReset().mockResolvedValue({ enabled:true,premiumReadIds:['premium-read'] });
  host=document.createElement('div');document.body.append(host);root=createRoot(host);
});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();vi.useRealTimers();});
const mount=async props=>{await act(async()=>root.render(<ProFeatureGate feature="appointment" title="Appointment prep" {...props}><input aria-label="Symptom notes" defaultValue="" /></ProFeatureGate>));};
describe('Pro UI boundaries',()=>{
  it('shows the tool only after access is verified',async()=>{
    edge.status.mockResolvedValue({ active:false });await mount();expect(host.querySelector('input')).toBeNull();expect(host.textContent).toContain('See ayna Pro Early Access');
  });
  it('does not expose premium children after an API error',async()=>{
    edge.status.mockRejectedValue(new Error('Offline'));await mount();expect(host.querySelector('input')).toBeNull();expect(host.textContent).toContain('Offline');
  });
  it('preserves unfinished notes while refreshing an active entitlement',async()=>{
    await mount();const input=host.querySelector('input');input.value='Keep these notes';
    await act(async()=>{await vi.advanceTimersByTimeAsync(60000);});
    expect(host.querySelector('input')).toBe(input);expect(input.value).toBe('Keep these notes');
  });
  it('relocks an open tool after temporary access ends',async()=>{
    await mount();edge.status.mockResolvedValue({active:false});
    await act(async()=>{await vi.advanceTimersByTimeAsync(60000);});expect(host.querySelector('input')).toBeNull();
  });
  it('never keeps one account’s entitlement after switching accounts',async()=>{
    await mount();edge.status.mockResolvedValue({active:false});
    await act(async()=>edge.auth('SIGNED_IN',{user:{id:'different'}}));expect(host.querySelector('input')).toBeNull();
  });
  it('keeps public Reads visible without quota calls',async()=>{
    await mount({feature:'reads',readId:'public-read'});expect(host.querySelector('input')).toBeTruthy();expect(edge.rules).not.toHaveBeenCalled();expect(edge.status).not.toHaveBeenCalled();
  });
  it('uses the server allowance for a curated premium Read',async()=>{
    await mount({feature:'reads',readId:'premium-read'});expect(edge.status).toHaveBeenCalledWith(expect.objectContaining({action:'read',readId:'premium-read'}));
  });
  it('preserves all existing behavior before feature rollout',async()=>{
    edge.rules.mockResolvedValue({enabled:false});await mount();expect(host.querySelector('input')).toBeTruthy();expect(edge.status).not.toHaveBeenCalled();
  });
});
