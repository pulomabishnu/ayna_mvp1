import { beforeAll, describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ALL_PRODUCTS, adoptLiveCatalog, getEcosystemSeedFromQuiz } from '../../data/products.js';
import ReadyReveal from './ReadyReveal.jsx';

// Public catalog entries that live in Supabase rather than the smaller JS bundle.
const live = [
  { id: 'p-pixie-cup-bloatfit-period-underwear', name: 'Pixie Cup BloatFit Period Underwear', brand: 'Pixie Cup', category: 'period-underwear', type: 'physical', tags: ['period underwear', 'period care'], healthFunctions: ['period-care'], whereToBuy: ['Brand site'], url: 'https://itspixie.com/products/bloatfit-period-underwear', summary: 'Washable leakproof period underwear with a flexible waistband for bloated days.' },
  { id: 'p-tummy-drops-organic-ginger-tummydrops-33-ct', name: 'Tummy Drops Organic Ginger Tummydrops, 33 ct', brand: 'Tummy Drops', category: 'pregnancy', type: 'physical', tags: ['ginger', 'nausea', 'lozenge'], healthFunctions: ['pregnancy', 'gut'], whereToBuy: ['Brand site'], url: 'https://www.tummydrops.com/products/sweet-pear-ginger-tummydrops-bag', summary: 'Ginger drops for occasional queasiness and motion sickness.' },
  { id: 'p-calmigo-device', name: 'CalmiGo Device', brand: 'CalmiGo', category: 'mental-health', type: 'physical', tags: ['anxiety', 'breathing', 'stress relief'], healthFunctions: ['stress', 'mood'], whereToBuy: ['Brand site'], url: 'https://calmigo.com/', summary: 'Handheld device that guides slower breathing during moments of stress.' },
  { id: 'p-heartmath-inner-balance-coherence-plus-with-heartmath-app', name: 'HeartMath Inner Balance Coherence Plus', brand: 'HeartMath', category: 'mental-health', type: 'physical', tags: ['stress', 'breathing', 'biofeedback'], healthFunctions: ['stress', 'mood'], whereToBuy: ['Brand site'], url: 'https://store.heartmath.com/innerbalance', summary: 'HRV biofeedback sensor and app for breathing practice and stress support.' },
  { id: 'p-frida-mom-anti-nausea-bands', name: 'Frida Mom Anti-Nausea Bands', brand: 'Frida Mom', category: 'pregnancy', type: 'physical', tags: ['morning sickness', 'nausea', 'acupressure', 'drug-free', 'wristband'], healthFunctions: ['pregnancy'], whereToBuy: ['Brand site'], url: 'https://frida.com/products/anti-nausea-bands', summary: 'Adjustable wristbands that press the P6 point for pregnancy nausea comfort.' },
  { id: 'p-sea-band-mama-band-value-pack', name: 'Sea-Band Mama Band Value Pack', brand: 'Sea-Band', category: 'pregnancy', type: 'physical', tags: ['morning sickness', 'nausea', 'acupressure', 'drug-free', 'wristband'], healthFunctions: ['pregnancy'], whereToBuy: ['Brand site'], url: 'https://sea-band.com/collections/homepage/products/mama-band-value-pack', summary: 'P6 acupressure wristbands made for pregnancy nausea support.' },
  { id: 'p-theraice-headache-hat', name: 'TheraICE Headache Hat', brand: 'TheraICE', category: 'headache', type: 'physical', tags: ['headache', 'cold therapy', 'migraine'], healthFunctions: ['pain'], whereToBuy: ['Brand site'], url: 'https://theraice.com/collections/headache', summary: 'Cooling headache cap for symptom comfort during a headache or migraine.' },
  { id: 'p-estroven-menopause-relief-sleep-cool', name: 'Estroven Menopause Relief Sleep Cool', brand: 'Estroven', category: 'supplement', type: 'physical', tags: ['menopause', 'night sweats', 'sleep', 'melatonin', 'black cohosh'], healthFunctions: ['sleep'], whereToBuy: ['Brand site'], url: 'https://estroven.com/products/menopause-relief-sleep-cool', summary: 'Nightly caplet with melatonin, black cohosh and soy isoflavones, sold for menopause sleep trouble, hot flashes and night sweats.' },
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
    expect(html).toContain('CalmiGo Device');
    // Nov 10 audit: the count here is exactly what is saved to her ecosystem (it said 5, then Wrapped said 2).
    const saved = Object.values(getEcosystemSeedFromQuiz(answers).mergedProducts).filter((p) => html.includes(p.name.replace(/&/g, '&amp;')));
    const shown = Number((html.match(/class="ay-ob-count">(\d+)</) || [])[1]);
    expect(shown).toBe(saved.length);
    const mental = html.split('<h3>Mental wellbeing</h3>')[1].split('</ol>')[0];
    expect((mental.match(/data-kind="product"/g) || []).length).toBeGreaterThan(1);
    expect(html).not.toContain('Perimenopause Test Kit');
    expect(html).not.toContain('Estroven Menopause Relief Sleep Cool');
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
    expect(html).toContain('Anti-Nausea Bands');
    expect(html).not.toContain('Tummy Drops');
  });
  it('keeps pregnancy products out of generic nausea when pregnancy is unknown', () => {
    const answers = { personalizationCompleted: true, fullHealthIntake: { age: '30', supportSelections: ['Nausea'], takesCurrent: 'No', allergyStatus: 'No', safetyConcern: 'No' } };
    const html = renderToStaticMarkup(<ReadyReveal answers={answers} onSeeToday={() => {}} />);
    expect(html).not.toContain('Frida Mom Anti-Nausea Bands');
    expect(html).not.toContain('Sea-Band Mama Band');
  });
  it('does not show an adult telehealth service or discontinued app to a teen', () => {
    const answers = { personalizationCompleted: true, fullHealthIntake: { age: '16', lifeStageSelections: ['I get periods regularly'], supportSelections: ['Anxiety', 'Low mood'], takesCurrent: 'No', allergyStatus: 'No', safetyConcern: 'No' } };
    const html = renderToStaticMarkup(<ReadyReveal answers={answers} onSeeToday={() => {}} />);
    expect(html).not.toContain('Hers</');
    expect(html).not.toContain('Bloom: CBT Therapy');
  });
  it('offers cold headache comfort with migraine aura while keeping contraception in its own shelf', () => {
    const answers = { personalizationCompleted: true, fullHealthIntake: { age: '28', lifeStageSelections: ['I get periods regularly'], diagnosisSelections: ['Migraine with aura'], supportSelections: ['Contraception', 'Cycle-related headaches or migraines'], takesCurrent: 'No', allergyStatus: 'No', safetyConcern: 'No' } };
    const shelves = getEcosystemSeedFromQuiz(answers).shelves;
    expect(shelves.find((s) => s.needId === 'pain.cycle_headache')?.productIds).toContain('p-theraice-headache-hat');
    expect(shelves.find((s) => s.needId === 'sexual.contraception')?.productIds).not.toContain('p-theraice-headache-hat');
  });
});
