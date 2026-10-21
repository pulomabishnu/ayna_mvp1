// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';

vi.mock('../utils/supabaseClient', () => ({ getSupabaseClient: () => ({ auth: { getSession: async () => ({ data: { session: { access_token: 't' } } }) } }) }));

const drafts = [{ id: '1', product_id: 'p-oboo-nook', product_name: 'Nook', brand: 'Oboo', section: 'science', status: 'draft', draft: { scienceSources: [{ url: 'https://pubmed.ncbi.nlm.nih.gov/1/', label: 'A study', summary: 'It found something.' }] }, issues: ['A note'], updated_at: '1' }];

describe('AdminResearchPage', () => {
  beforeEach(() => { globalThis.IS_REACT_ACT_ENVIRONMENT = true; });
  it('shows drafts waiting for review and products with gaps', async () => {
    globalThis.fetch = vi.fn(async () => ({ status: 200, json: async () => ({ drafts }) }));
    const { default: Page } = await import('./AdminResearchPage.jsx');
    const el = document.createElement('div'); document.body.appendChild(el);
    await act(async () => { createRoot(el).render(<Page onBack={() => {}} />); });
    await act(async () => { await new Promise((r) => setTimeout(r, 20)); });
    const text = el.textContent;
    expect(text).toContain('Waiting for review (1)');
    expect(text).toContain('A study');
    expect(text).toContain('Approve');
    expect(text).toMatch(/Products with empty sections \(\d+\)/);
    expect(text).toContain('Research this product');
  }, 20000);
});
