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

describe('routine timeline: Edit routine (founder, Nov 16)', () => {
  it('Edit shows Remove on her own products and calls onRemove', async () => {
    const { createRoot } = await import('react-dom/client');
    const { act } = await import('react');
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement('div'); document.body.appendChild(host);
    const removed = [];
    const root = createRoot(host);
    await act(async () => root.render(<RoutineTimeline products={[pad]} onRemove={(p) => removed.push(p.id)} />));
    expect(host.querySelector('.ay-rt2__remove')).toBeNull();
    await act(async () => [...host.querySelectorAll('button')].find((b) => b.textContent === 'Edit routine').click());
    const btn = host.querySelector('.ay-rt2__remove');
    expect(btn).not.toBeNull();
    await act(async () => btn.click());
    expect(removed).toEqual(['p-test-pad']);
    await act(async () => root.unmount());
  });
});
