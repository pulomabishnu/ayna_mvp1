// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { askSurfaceFrom, startersFor } from './askStarters.js';

const q = (tiles) => tiles.map((t) => t.question);

describe('Ask ayna starters follow where she is', () => {
  it('Today: focus always; rundown, yesterday, tired and history only with their signal', () => {
    expect(q(startersFor({ surface: 'today' }))).toEqual(['What should I focus on today?']);
    expect(q(startersFor({ surface: 'today', signals: { hasRundown: true, hasYesterdayLog: true, lowSleepOrEnergy: true, hasHistory: true } }))).toEqual([
      'What should I focus on today?', 'Explain my Daily Rundown', 'What changed from yesterday?', 'Why am I feeling so tired today?', 'What helped last time?',
    ]);
    expect(q(startersFor({ surface: 'today', signals: { hasRundown: true } }))).not.toContain('Why am I feeling so tired today?');
  });
  it('product page, shop, ecosystem, compare', () => {
    expect(q(startersFor({ surface: 'pdp', productName: 'ThermaCare' }))).toEqual(['Why is ThermaCare my match?', 'Check ThermaCare for me', 'What are similar options to ThermaCare?']);
    expect(q(startersFor({ surface: 'shop' }))).toContain('Show me non-pill options under $30');
    expect(q(startersFor({ surface: 'ecosystem' }))[0]).toBe('What changed recently?');
    expect(q(startersFor({ surface: 'compare' }))[0]).toBe('Which one fits my preferences better?');
    expect(startersFor({ surface: 'other' }).length).toBeGreaterThan(2);
  });
  it('no starter carries a health value', () => {
    const all = JSON.stringify(['today', 'pdp', 'shop', 'ecosystem', 'compare', 'other'].map((surface) => startersFor({ surface, signals: { hasRundown: true, hasYesterdayLog: true, lowSleepOrEnergy: true, hasHistory: true } })));
    expect(all).not.toMatch(/\d+ ?(ms|bpm|h \d+m)|severe|moderate|—/);
  });
  it('reads the surface from the page', () => {
    const doc = (html) => { const d = document.implementation.createHTMLDocument(''); d.body.innerHTML = html; return d; };
    expect(askSurfaceFrom({ doc: doc('<div class="ayna-mobile" data-screen="eco"><div class="eco-seg" data-on="dashboard"></div></div>') })).toBe('today');
    expect(askSurfaceFrom({ doc: doc('<div class="ayna-mobile" data-screen="eco"><div class="eco-seg" data-on="products"></div></div>') })).toBe('ecosystem');
    expect(askSurfaceFrom({ doc: doc('<div class="ayna-mobile" data-screen="browse"></div>') })).toBe('shop');
    expect(askSurfaceFrom({ doc: doc('<div class="app-container" data-view="comparison"></div>') })).toBe('compare');
    expect(askSurfaceFrom({ doc: doc('<div class="app-container" data-view="health"></div>') })).toBe('today');
    expect(askSurfaceFrom({ doc: doc(''), focusProduct: { id: 'p' } })).toBe('pdp');
  });
});
