import { beforeAll, describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ALL_PRODUCTS, adoptLiveCatalog, getEcosystemSeedFromQuiz } from '../../data/products.js';
import ReadyReveal from './ReadyReveal.jsx';

// Public catalog entries that live in Supabase rather than the smaller JS bundle.
const live = [
  { id: 'p-pixie-cup-bloatfit-period-underwear', name: 'Pixie Cup BloatFit Period Underwear', brand: 'Pixie Cup', category: 'period-underwear', type: 'physical', tags: ['period underwear', 'period care'], healthFunctions: ['period-care'], whereToBuy: ['Brand site'], url: 'https://itspixie.com/products/bloatfit-period-underwear', summary: 'Washable leakproof period underwear with a flexible waistband for bloated days.' },
  { id: 'p-tummy-drops-organic-ginger-tummydrops-33-ct', name: 'Tummy Drops Organic Ginger Tummydrops, 33 ct', brand: 'Tummy Drops', category: 'pregnancy', type: 'physical', tags: ['ginger', 'nausea', 'lozenge'], healthFunctions: ['pregnancy', 'gut'], whereToBuy: ['Brand site'], url: 'https://www.tummydrops.com/products/sweet-pear-ginger-tummydrops-bag', summary: 'Ginger drops for occasional queasiness and motion sickness.' },
];
const intake = (age, stage) => ({ personalizationCompleted: true, fullHealthIntake: { personalizationCompleted: true, age: String(age), lifeStageSelections: [stage], supportSelections: ['Cycle-related bloating', 'Anxiety', 'Low mood', 'Nausea', 'Hormone-related symptoms', 'Hot flashes'], takesCurrent: 'No', allergyStatus: 'No', safetyConcern: 'No' } });

describe('reveal with the published catalog', () => {
  beforeAll(() => adoptLiveCatalog(live));
  for (const variant of ['app', 'web']) it(`${variant}: a menstruating 22-year-old sees grouped support, not a perimenopause test`, () => {
    const answers = intake(22, 'I get periods regularly');
    const html = renderToStaticMarkup(<ReadyReveal variant={variant} answers={answers} onSeeToday={() => {}} />);
    expect(html).toContain('Period &amp; PMS');
    expect(html).toContain('Mental wellbeing');
    expect(html).toContain('Temperature &amp; sweating');
    expect(html).toContain('Pixie Cup BloatFit');
    expect(html).toContain('Tummy Drops');
    expect(html).not.toContain('Perimenopause Test Kit');
    expect(html).not.toContain('None yet');
  });
  it('does not offer the perimenopause kit for a generic hormone concern', () => {
    const shelves = getEcosystemSeedFromQuiz(intake(22, 'I get periods regularly')).shelves;
    expect(shelves.flatMap((s) => s.productIds)).not.toContain('p-hormona-perimenopause-test-kit-app');
  });
  it('a partial profile does not infer menopause from hot flashes', () => {
    const answers = { personalizationCompleted: true, fullHealthIntake: { age: '22', supportSelections: ['Hot flashes', 'Hormone-related symptoms'] } };
    const html = renderToStaticMarkup(<ReadyReveal answers={answers} onSeeToday={() => {}} />);
    expect(html).toContain('Temperature &amp; sweating');
    expect(html).not.toContain('Perimenopause Test Kit');
  });
  it('does not offer period-bloating underwear during pregnancy', () => {
    const answers = { personalizationCompleted: true, fullHealthIntake: { age: '30', lifeStageSelections: ['I am pregnant'], supportSelections: ['Cycle-related bloating', 'Nausea'], takesCurrent: 'No', allergyStatus: 'No', safetyConcern: 'No' } };
    const html = renderToStaticMarkup(<ReadyReveal answers={answers} onSeeToday={() => {}} />);
    expect(html).not.toContain('Pixie Cup BloatFit');
  });
});
