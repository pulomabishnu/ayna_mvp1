import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import WeekBento from './WeekBento.jsx';

describe('WeekBento layout', () => {
  it('never leaves a lone half-width tile: an unpaired single tile takes the full row', () => {
    const html = renderToStaticMarkup(
      <WeekBento
        today="2026-10-26"
        cycle={{ cycleDay: 7, cycleLength: 23 }}
        charts={[{ metric: 'steps', week: 469, usual: 1196, points: [{ day: '2026-10-20', value: 300 }, { day: '2026-10-21', value: 469 }] }]}
        products={[{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }]}
      />,
    );
    const steps = html.match(/class="[^"]*is-steps[^"]*"/)?.[0] || '';
    expect(steps).toContain('is-wide');
  });
});
