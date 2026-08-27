import { describe, it, expect } from 'vitest';
import { ECOSYSTEM_AREAS, resolveEcosystemProductArea } from './EcosystemBubbles';

describe('resolveEcosystemProductArea', () => {
  // Regression: a product added to the ecosystem long ago is stored as a frozen
  // snapshot (user_ecosystems.product_data) that can predate `category` being
  // assigned at all. Found live on Aditi's own ecosystem, 2026-08-24: Rael
  // Organic Cotton Pads' stored snapshot had no category, even though the live
  // catalog has always had it as category: 'pad'.
  it('falls back to the current catalog category for a real product id with a stale/missing snapshot category', () => {
    const stale = { id: 'p-rael-organic-pad', name: 'Rael Organic Cotton Pads' }; // no category
    const area = resolveEcosystemProductArea(stale, ECOSYSTEM_AREAS);
    expect(area?.key).toBe('period');
  });

  // Regression: an AI-generated recommendation (api/llm-recommendations.js) was
  // never in any catalog and its `category` is freeform LLM text, not this
  // site's real taxonomy — found live: "Lumie Bodyclock Starter 30" (category:
  // 'device') had to be classified purely from its own name/summary text.
  it('infers an area from name/summary text for a product that was never in any catalog', () => {
    const lumie = {
      id: 'gen-lumie-bodyclock-starter-30',
      name: 'Lumie Bodyclock Starter 30',
      brand: 'Lumie',
      category: 'device',
      summary: 'A sunrise wake-up light that simulates dawn to help you wake up more gently and support a healthy sleep-wake cycle.',
    };
    const area = resolveEcosystemProductArea(lumie, ECOSYSTEM_AREAS);
    expect(area?.key).toBe('sleep-stress');
  });

  // Regression: the bare keyword 'cycle' (Discovery's own documented repeat
  // false-positive — matches "sleep-wake cycle", "fitness-cycle", etc., not
  // just the menstrual cycle it's meant to catch) used to win by pure array
  // order over a correct, more specific match. It must not out-rank 'sleep'
  // for a product that is clearly about sleep, not hormones.
  it('does not let the ambiguous "cycle" keyword win over a more specific correct match', () => {
    const product = { id: 'gen-test-sleep-device', name: 'Test Device', summary: 'Supports a healthy sleep-wake cycle.' };
    const area = resolveEcosystemProductArea(product, ECOSYSTEM_AREAS);
    expect(area?.key).not.toBe('hormones');
    expect(area?.key).toBe('sleep-stress');
  });

  it('still resolves a straightforward current-category product to its area', () => {
    const supplement = { id: 'gen-some-supplement', name: 'Some Supplement', category: 'supplement' };
    const area = resolveEcosystemProductArea(supplement, ECOSYSTEM_AREAS);
    expect(area?.key).toBe('supplements');
  });

  it('returns nothing for a product with no signal anywhere', () => {
    const mystery = { id: 'gen-totally-unknown', name: 'Totally Unknown Thing' };
    const area = resolveEcosystemProductArea(mystery, ECOSYSTEM_AREAS);
    expect(area).toBeFalsy();
  });
});
