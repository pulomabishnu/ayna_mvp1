// QA (Oct 25): the Community error state points to the product catalog. Since the tab renames
// (Oct 26) that tab is called Shop, so the button says Shop.
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

vi.mock('../../utils/supabaseClient.js', () => ({ getSupabaseClient: () => null }));
const { default: CommunityScreen } = await import('./CommunityScreen.jsx');

describe('Community error state', () => {
  it('offers the Shop', () => {
    const html = renderToStaticMarkup(<CommunityScreen onGoBrowse={() => {}} />);
    expect(html).toContain('Community isn’t loading');
    expect(html).toContain('>Shop<');
    expect(html).not.toContain('>Explore<');
  });
});
