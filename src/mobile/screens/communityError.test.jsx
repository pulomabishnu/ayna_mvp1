// QA (Oct 25): the Community error state points to Explore, not "Shop".
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

vi.mock('../../utils/supabaseClient.js', () => ({ getSupabaseClient: () => null }));
const { default: CommunityScreen } = await import('./CommunityScreen.jsx');

describe('Community error state', () => {
  it('offers Explore', () => {
    const html = renderToStaticMarkup(<CommunityScreen onGoBrowse={() => {}} />);
    expect(html).toContain('Community isn’t loading');
    expect(html).toContain('>Explore<');
    expect(html).not.toContain('>Shop<');
  });
});
