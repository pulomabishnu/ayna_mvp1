import posthog from 'posthog-js';

/* ayna's Wefunder page. We are "testing the waters" (Reg CF, Rule 206):
   no Form C is filed yet, so every mention of the round carries the
   disclaimer below and links here. */
export const WEFUNDER_URL = 'https://wefunder.com/ayna';

// Confirm with Wefunder before launch: minimum investment and perks are offering terms; perks must match what's listed on the Wefunder page.
export const INVEST_TERMS = 'Investments start at $100, and early backers get ayna perks and goodies.';

/* Wefunder's required testing-the-waters disclaimer. Use exactly; do not edit. */
export const TTW_DISCLAIMER = "We are 'testing the waters' to gauge investor interest in an offering under Regulation Crowdfunding. No money or other consideration is being solicited. If sent, it will not be accepted. No offer to buy securities will be accepted. No part of the purchase price will be received until a Form C is filed and only through Wefunder's platform. Any indication of interest involves no obligation or commitment of any kind.";

export const INVEST_RISK = 'Investing in startups is risky. Only invest what you can afford to lose.';

/** PostHog: someone clicked through to Wefunder. location: 'footer' | 'landing'. */
export function trackInvestClick(location) {
  try { posthog.capture('invest_cta_clicked', { location }); } catch { /* analytics never blocks */ }
}
