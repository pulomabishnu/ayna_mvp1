// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import TodayPlan from './TodayPlan.jsx';

const cup = { id: 'p-a', name: 'Heat patch', brand: 'Warm', category: 'cramp relief' };
describe('For today bento (founder, Nov 11)', () => {
  it('nothing logged: Log today first, then her routine picks', () => {
    const html = renderToStaticMarkup(<TodayPlan entry={null} picks={[cup]} onOpenLog={() => {}} />);
    expect(html).toContain('Log today');
    expect(html).toContain('For your routine');
  });
  it('a log brings topics: low energy and pain become tiles', () => {
    const html = renderToStaticMarkup(<TodayPlan entry={{ energy: 1, pain: 2 }} picks={[]} />);
    expect(html).toContain('Ease cramps');
    expect(html).toContain('More energy');
    expect(html).not.toContain('Log today');
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
