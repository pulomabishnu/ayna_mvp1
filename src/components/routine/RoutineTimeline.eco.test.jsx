// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import RoutineTimeline from './RoutineTimeline.jsx';

const pad = { id: 'p-test-pad', name: 'Test Overnight Pad', brand: 'Test', category: 'pad', howToUse: { steps: ['Wash your hands.', 'Stick it to your underwear.'] } };
const serum = { id: 'p-test-serum', name: 'Test Serum', brand: 'Test', category: 'skincare' };

describe('routine timeline: her ecosystem products are in it', () => {
  it('places each ecosystem product by when it is used, with its first how-to step', () => {
    const html = renderToStaticMarkup(<RoutineTimeline products={[pad, serum]} />);
    expect(html).toContain('Test Overnight Pad');
    expect(html).toContain('During your period');
    expect(html).toContain('Test Serum');
    expect(html).toContain('Every day');
    expect(html).toContain('Stick it to your underwear.');
    expect(html).not.toContain('Your routine shows here once you add products.');
  });
  it('with no products shows a sourced starter day, never an empty tab (founder, Nov 11)', () => {
    const html = renderToStaticMarkup(<RoutineTimeline products={[]} />);
    expect(html).toContain('Start with a simple day.');
    expect(html).toContain('nhlbi.nih.gov');
  });
});
