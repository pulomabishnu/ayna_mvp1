import { beforeAll, describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { loadCatalog } from '../../data/catalog.js';
import ReadyReveal from './ReadyReveal.jsx';

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
      expect(care).toBeLessThan(html.indexOf('initially focus on'));
      expect(html).toContain('should be checked promptly');
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
    expect(html).toContain('% match');
  });
});
