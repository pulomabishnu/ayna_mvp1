// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, it, expect, vi } from 'vitest';
import FriendRecs from './FriendRecs.jsx';

const rows = [{ id: 'r1', sender_id: 's1', recipient_id: 'me', product_id: 'p-1', note: 'This helped my cramps', seen_at: null, created_at: '2026-10-29' }];
function fakeSupabase(updates) {
  const q = (table) => {
    const api = {
      select: () => api, eq: () => api, order: () => api, in: () => api, is: () => api,
      limit: async () => ({ data: table === 'community_product_recommendations' ? rows : [], error: null }),
      update: (patch) => { updates.push(patch); return api; },
      then: (res) => res({ data: table === 'community_profiles' ? [{ user_id: 's1', username: 'maya', display_name: 'Maya' }] : [], error: null }),
    };
    return api;
  };
  return { from: q };
}

describe('Recommended to you', () => {
  it('shows what a friend sent, and opening it marks it seen and opens the product', async () => {
    const updates = [];
    const onOpenProduct = vi.fn();
    const product = { id: 'p-1', name: 'Heat Patch' };
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement('div'); document.body.append(host); const root = createRoot(host);
    await act(async () => root.render(<FriendRecs supabase={fakeSupabase(updates)} userId="me" productsById={new Map([['p-1', product]])} onOpenProduct={onOpenProduct} />));
    await act(async () => { await new Promise((r) => setTimeout(r, 0)); });
    expect(host.textContent).toContain('Heat Patch');
    expect(host.textContent).toContain('This helped my cramps');
    expect(host.textContent).toContain('Maya');
    await act(async () => { host.querySelector('button').click(); });
    expect(onOpenProduct).toHaveBeenCalledWith(product);
    expect(updates[0]).toHaveProperty('seen_at');
  });
});
