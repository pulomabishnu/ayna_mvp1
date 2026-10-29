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
  it('is still empty with no products', () => {
    expect(renderToStaticMarkup(<RoutineTimeline products={[]} />)).toContain('Your routine shows here once you add products.');
  });
});
