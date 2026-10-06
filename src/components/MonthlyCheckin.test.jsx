import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

vi.mock('../utils/supabaseClient', () => ({ getSupabaseClient: () => null }));

const { default: MonthlyCheckin } = await import('./MonthlyCheckin.jsx');

describe('MonthlyCheckin', () => {
  it('keeps the old props contract and renders the loading state first', () => {
    const html = renderToStaticMarkup(
      <MonthlyCheckin onComplete={() => {}} onClose={() => {}} currentProfile={null} onProfileUpdate={() => {}} />,
    );
    expect(html).toContain('Loading your check-in');
    expect(html).toContain('role="dialog"');
  });

  it('accepts the optional ecosystem products prop', () => {
    const html = renderToStaticMarkup(
      <MonthlyCheckin onComplete={() => {}} onClose={() => {}} myProducts={{ a: { id: 'a', name: 'Cup A' } }} />,
    );
    expect(html).toContain('Monthly check-in');
  });
});
