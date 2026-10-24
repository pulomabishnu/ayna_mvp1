import { describe, expect, it } from 'vitest';
import { pickForInsight, weekNeeds } from './weekPicks.js';

describe('product next steps in health insights', () => {
  const sleep = { product: { id: 'sleep', name: 'Sleep support' }, needId: 'sleep.trouble' };
  const period = { product: { id: 'period', name: 'Period support' }, needId: 'period.product_support' };
  const energy = { product: { id: 'energy', name: 'Energy support' }, needId: 'energy.fatigue' };

  it('links a shorter-sleep insight to a sleep pick only', () => {
    expect(pickForInsight({ signal: 'sleep-short' }, [period, sleep])).toBe(sleep);
    expect(pickForInsight({ signal: 'sleep-short' }, [period])).toBeNull();
  });

  it('connects a period reminder to period supplies already matched for that need', () => {
    expect(pickForInsight({ signal: 'period-soon' }, [sleep, period])).toBe(period);
    expect(pickForInsight({ signal: 'period-soon' }, [sleep])).toBeNull();
  });

  it('does not turn unrelated health changes into product prompts', () => {
    expect(pickForInsight({ signal: 'heart-up' }, [sleep, period])).toBeNull();
    expect(pickForInsight({ signal: 'sleep-long' }, [sleep])).toBeNull();
  });

  it('connects lower steps to an energy product only when low energy is an existing goal', () => {
    const insight = { signal: 'steps-lower' };
    expect(weekNeeds({ insights: [insight] })).toEqual([]);
    expect(weekNeeds({ insights: [insight], needIds: ['energy.fatigue'] })).toEqual([
      expect.objectContaining({ needId: 'energy.fatigue', chosen: true }),
    ]);
    expect(pickForInsight(insight, [sleep, energy])).toBe(energy);
    expect(pickForInsight(insight, [sleep])).toBeNull();
  });
});
