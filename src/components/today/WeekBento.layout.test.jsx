import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import WeekBento from './WeekBento.jsx';

describe('WeekBento layout', () => {
  it('cycle and a metric sit side by side as halves; only the products row is wide; under 3 days shows no chart', () => {
    const html = renderToStaticMarkup(
      <WeekBento
        today="2026-10-26"
        cycle={{ cycleDay: 7, cycleLength: 23 }}
        charts={[{ metric: 'steps', week: 469, usual: 1196, points: [{ day: '2026-10-20', value: 300 }, { day: '2026-10-21', value: 469 }] }]}
        products={[{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }]}
      />,
    );
    const steps = html.match(/class="[^"]*is-steps[^"]*"/)?.[0] || '';
    expect(steps).not.toContain('is-wide');
    expect(html.match(/class="[^"]*is-cycle[^"]*"/)?.[0] || '').not.toMatch(/is-(wide|big)/);
    expect(html.match(/class="[^"]*is-products[^"]*"/)?.[0] || '').toContain('is-wide');
    expect(html).not.toContain('wb-bars');
  });
});
