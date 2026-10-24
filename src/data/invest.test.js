import { describe, expect, it, vi } from 'vitest';

vi.mock('posthog-js', () => ({ default: { capture: vi.fn() } }));

import posthog from 'posthog-js';
import { INVEST_RISK, TTW_DISCLAIMER, WEFUNDER_URL, trackInvestClick } from './invest';

describe('invest (Wefunder testing the waters)', () => {
  it('tracks invest_cta_clicked with the location', () => {
    trackInvestClick('footer');
    trackInvestClick('landing');
    expect(posthog.capture).toHaveBeenCalledWith('invest_cta_clicked', { location: 'footer' });
    expect(posthog.capture).toHaveBeenCalledWith('invest_cta_clicked', { location: 'landing' });
  });

  it('keeps the required disclaimer and link intact', () => {
    expect(WEFUNDER_URL).toBe('https://wefunder.com/ayna');
    expect(TTW_DISCLAIMER).toBe("We are 'testing the waters' to gauge investor interest in an offering under Regulation Crowdfunding. No money or other consideration is being solicited. If sent, it will not be accepted. No offer to buy securities will be accepted. No part of the purchase price will be received until a Form C is filed and only through Wefunder's platform. Any indication of interest involves no obligation or commitment of any kind.");
    expect(INVEST_RISK).toMatch(/risky/);
  });
});
