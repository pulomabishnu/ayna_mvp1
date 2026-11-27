import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

const intro = { paymentMode: 'freeTrial', periodUnit: 'week', periodValue: 2, periodCount: 1, displayPrice: '$0.00' };
vi.mock('../../pro/appleIap.js', async (orig) => {
  const real = await orig();
  return {
    ...real,
    useAppleProducts: () => ({ status: 'ready', products: {
      year: { id: 'y', plan: 'year', displayPrice: '$89.99', periodUnit: 'year', periodValue: 1, intro, introEligible: true },
      month: { id: 'm', plan: 'month', displayPrice: '$8.99', periodUnit: 'month', periodValue: 1, intro, introEligible: true },
    } }),
  };
});

describe('Apple paywall free trial (Nov 27)', async () => {
  const { default: ApplePaywallSheet } = await import('./ApplePaywallSheet.jsx');
  it('billed amount is the button (3.1.2(c)); trial is the smaller line and states price, renewal and how to cancel', () => {
    const html = renderToStaticMarkup(<ApplePaywallSheet titleId="t" onClose={() => {}} />).replace(/<!-- -->/g, '');
    expect(html).toContain('>Subscribe · $89.99/year</button>');
    const terms = html;
    expect(terms).toContain('14 days free, then $89.99/year');
    expect(html).toContain('How the free trial works');
    expect(html).toContain('Day 12');
    expect(terms).toContain('Renews automatically');
    expect(terms).toContain('Cancel anytime in Settings › Subscriptions');
    expect(html).not.toContain('No card');
    expect(html).toContain('Link your health apps for smarter matches');
    expect(html).not.toContain('Patterns over time');
  });
});
