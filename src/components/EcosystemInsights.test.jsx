import '../utils/test-setup-localstorage.js';
import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import EcosystemInsights from './EcosystemInsights.jsx';

const HONEYPOT = {
  id: 'p-honeypot-pad',
  name: 'Honey Pot Herbal Pad',
  category: 'pad',
  brand: 'The Honey Pot',
  ingredients: 'Plant-derived fiber, lavender oil, peppermint oil, aloe extract, wood pulp core.',
  safety: { allergens: 'Contains herbal extracts.', recalls: 'No known recalls' },
};
const SAALT = {
  id: 'p-saalt-cup',
  name: 'Saalt Cup',
  category: 'cup',
  ingredients: '100% medical-grade silicone.',
  safety: { allergens: 'Latex-free, hypoallergenic', recalls: 'No recalls.' },
};
const catalog = [
  ...Array(3).fill({ category: 'supplement' }),
  ...Array(2).fill({ category: 'pad' }),
];

describe('EcosystemInsights', () => {
  beforeEach(() => localStorage.clear());

  it('renders nothing for an empty ecosystem', () => {
    expect(renderToStaticMarkup(<EcosystemInsights myProducts={{}} allProducts={catalog} />)).toBe('');
  });

  it('renders all four sections from real data', () => {
    const html = renderToStaticMarkup(
      <EcosystemInsights
        myProducts={{ [HONEYPOT.id]: HONEYPOT, [SAALT.id]: SAALT }}
        quizResults={{ fullHealthIntake: { allergyStatus: 'Yes', allergies: ['Essential oils', 'Latex'] }, preference: ['organic'] }}
        allProducts={catalog}
        onOpenProduct={() => {}}
        onViewAlternative={() => {}}
        onExploreCategory={() => {}}
      />,
    );
    expect(html).toContain('Safety alerts across your ecosystem');
    expect(html).toContain('1 active'); // essential oils in Honey Pot; Saalt is latex-free
    expect(html).toContain('See swap');
    expect(html).toContain('lavender oil');
    expect(html).toContain('Your routine');
    expect(html).toContain('0 of 2 sorted');
    expect(html).toContain('Brands you trust');
    expect(html).toContain('The Honey Pot');
    expect(html).toContain('Blind spots');
    expect(html).toContain('Supplements');
    expect(html).not.toMatch(/-card\b/);
  });

  it('hides optional actions when their callbacks are missing', () => {
    const html = renderToStaticMarkup(
      <EcosystemInsights
        myProducts={{ [HONEYPOT.id]: HONEYPOT }}
        quizResults={{ fullHealthIntake: { allergies: ['Essential oils'] } }}
        allProducts={catalog}
      />,
    );
    expect(html).not.toContain('See swap');
    expect(html).not.toContain('>Explore<');
  });

  it('respects locally dismissed alerts and saved routine', () => {
    localStorage.setItem('ayna_routine_v1', JSON.stringify({ [HONEYPOT.id]: 'night' }));
    const html = renderToStaticMarkup(<EcosystemInsights myProducts={{ [HONEYPOT.id]: HONEYPOT }} allProducts={catalog} />);
    expect(html).toContain('1 of 1 sorted');
    expect(html).toMatch(/Night<\/dt>/);
  });
});
