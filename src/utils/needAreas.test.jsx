import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { getSelectedNeeds } from '../data/products.js';
import { needAreaLabels, picksAreasLine } from './needAreas.js';
import SigninScreen from '../mobile/screens/SigninScreen.jsx';

// QA3 M11: the Save sheet said "3 picks · 2 areas, Virtual care, Supplements"
// (product categories). Her areas are her picked needs.
const PERSONA = { fullHealthIntake: { age: '54', lifeStageSelections: ['I am post-menopause'], supportSelections: ['Heavy periods', 'Hot flashes'], periodFlow: 'Heavy' } };

describe('Save sheet areas', () => {
  it('her picked needs, in her order', () => {
    expect(needAreaLabels(PERSONA, getSelectedNeeds)).toEqual(['Heavy periods', 'Hot flashes']);
    expect(needAreaLabels(null, getSelectedNeeds)).toEqual([]);
  });
  it('count line has no em dash', () => {
    expect(picksAreasLine(3, 2)).toBe('3 picks · 2 areas');
    expect(picksAreasLine(1, 0)).toBe('1 pick');
  });
  it('app Save sheet shows her needs, not categories', () => {
    const html = renderToStaticMarkup(<SigninScreen mode="signup" myProducts={[{ id: 'd-visana', name: 'Visana Health', category: 'telehealth', type: 'digital' }]} saveAreas={needAreaLabels(PERSONA, getSelectedNeeds)} />);
    expect(html).toContain('1 pick · 2 areas');
    expect(html).toContain('Heavy periods, Hot flashes');
    expect(html).not.toMatch(/Virtual care|—/);
  });
});
