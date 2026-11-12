// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import TodayPlan from './TodayPlan.jsx';

const cup = { id: 'p-a', name: 'Heat patch', brand: 'Warm', category: 'cramp relief' };
describe('For today bento (founder, Nov 11)', () => {
  it('Nov 12 (founder: "too crowded"): no log row; today\'s new picks with photos instead', () => {
    const html = renderToStaticMarkup(<TodayPlan entry={null} picks={[cup]} onOpenLog={() => {}} today="2026-11-12" />);
    expect(html).not.toContain('Log symptoms');
    expect(html).not.toContain('ay-tp-week');
    expect(html).toContain('New from ayna today');
    expect(html).toContain('Heat patch');
  });
  it('a log brings topics: low energy and pain become tiles', () => {
    const html = renderToStaticMarkup(<TodayPlan entry={{ energy: 1, pain: 2 }} picks={[]} />);
    expect(html).toContain('Ease cramps');
    expect(html).toContain('More energy');
    expect(html).not.toContain('Log symptoms');
  });
  it('sleep under her usual (from her data) becomes Sleep better', () => {
    const html = renderToStaticMarkup(<TodayPlan entry={null} insight={{ topic: 'sleep', line: 'Sleep: 54 min under your usual', metric: 'sleep_minutes', label: 'Sleep' }} />);
    expect(html).toContain('Sleep better');
    expect(html).toContain('54 min under');
  });
  it('no pain tips in pregnancy', () => {
    expect(renderToStaticMarkup(<TodayPlan entry={{ pain: 2 }} pregnant />)).not.toContain('Ease cramps');
  });
});

describe('one routine suggestion from her data (founder, Nov 11)', () => {
  it('picks the product that fits what came up first', () => {
    const iron = { id: 'p-iron', name: 'Iron bisglycinate', category: 'iron supplement' };
    const html = renderToStaticMarkup(<TodayPlan entry={{ energy: 1 }} picks={[cup, iron]} today="2026-11-12" />);
    // The pick that fits today's low energy leads the daily picks.
    expect(html.indexOf('Iron bisglycinate')).toBeLessThan(html.indexOf('Heat patch'));
  });
});
