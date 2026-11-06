import { beforeAll, describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { loadCatalog } from '../../data/catalog.js';
import ReadyReveal from './ReadyReveal.jsx';
import { EMPTY } from '../../mobile/data/intakeModel.js';
import { getEcosystemSeedFromQuiz, getProductById } from '../../data/products.js';
import { showableAsPick } from '../../utils/bleedingCare.js';

// QA3 M2: the persona age 54, post-menopause, Heavy periods with a Heavy flow.
// Today and the product page lead with the bleeding-evaluation message; the
// reveal must too, and no pick it shows is a period product or a percent for
// that bleeding.
const POST_MENO_HEAVY = { personalizationCompleted: true, fullHealthIntake: { personalizationCompleted: true, takesCurrent: 'No', allergyStatus: 'No', safetyConcern: 'No', age: '54', lifeStageSelections: ['I am post-menopause'], supportSelections: ['Heavy periods'], periodFlow: 'Heavy' } };
const REGULAR_HEAVY = { personalizationCompleted: true, fullHealthIntake: { ...POST_MENO_HEAVY.fullHealthIntake, age: '28', lifeStageSelections: ['I get periods regularly'] } };

describe('ReadyReveal bleeding after menopause', () => {
  beforeAll(() => loadCatalog());
  for (const variant of ['app', 'web']) {
    it(`${variant}: care message at the top, before her focus and picks`, () => {
      const html = renderToStaticMarkup(<ReadyReveal variant={variant} answers={POST_MENO_HEAVY} onSeeToday={() => {}} />);
      const care = html.indexOf('Get bleeding after menopause checked');
      expect(care).toBeGreaterThan(-1);
      expect(care).toBeLessThan(html.indexOf('What you asked for help with'));
      expect(html).toContain('checked promptly');
      expect(html).toContain('medlineplus.gov');
      expect(html).not.toMatch(/—/);
    });
  }
  it('no period product is listed as a pick', () => {
    const html = renderToStaticMarkup(<ReadyReveal answers={POST_MENO_HEAVY} onSeeToday={() => {}} />);
    expect(html).not.toMatch(/\b(Pad|Pads|Tampon|Tampons|Cup|Disc|Period Underwear)\b/);
  });
  it('no message for someone who still gets periods', () => {
    const html = renderToStaticMarkup(<ReadyReveal answers={REGULAR_HEAVY} onSeeToday={() => {}} />);
    expect(html).not.toContain('Get bleeding after menopause checked');
    expect(html).toMatch(/We found .*match/);
  });
});

describe('ReadyReveal symptom groups', () => {
  beforeAll(() => loadCatalog());
  it('shows one mood card and one temperature card for related symptoms at age 22', () => {
    const answers = { personalizationCompleted: true, fullHealthIntake: {
      ...EMPTY, age: '22', lifeStageSelections: ['I get periods regularly'],
      supportSelections: ['Hot flashes', 'Night sweats', 'Anxiety', 'Low mood', 'Irritability', 'Mood swings'],
      allergyStatus: 'No', takesCurrent: 'No', diagnosisSelections: ['None that I know of'], safetyConcern: 'No',
      vasomotorTimingSelections: ['Before my period / PMS', 'When stressed or anxious'],
    } };
    const html = renderToStaticMarkup(<ReadyReveal answers={answers} onSeeToday={() => {}} />);
    expect(html).toContain('Mood &amp; wellbeing');
    expect(html).toContain('Temperature comfort');
    expect(html).not.toContain('Menopause support');
    expect((html.match(/class="ay-deck__card/g) || []).length).toBe(2);
    const expected = new Set(getEcosystemSeedFromQuiz(answers).shelves.flatMap((shelf) => shelf.productIds).filter((id) => {
      const product = getProductById(id);
      return product && showableAsPick(product, answers);
    })).size;
    expect(html.replace(/<[^>]*>/g, '')).toContain(`We found ${expected} ${expected === 1 ? 'match' : 'matches'}`);
  });
});
