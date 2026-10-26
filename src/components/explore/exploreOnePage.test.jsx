// Explore is one shop page (founder, Oct 26): a title, the search, one row of
// need chips (All and the five shop groups), a Products or Services toggle,
// Filters and Sort, then one grid. No For you / Needs / Products / Services / Reads tabs.
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import ExploreScreen from '../../mobile/screens/ExploreScreen.jsx';
import { ExploreHeader } from './ExploreNav.jsx';
import { SHOP_GROUPS } from '../../data/catalogTaxonomy.js';
import { ALL_PRODUCTS } from '../../data/products.js';

const text = (html) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
const OLD_TABS = /aria-label="Explore sections"/;

describe('Explore as one shop page', () => {
  it('web header: the Explore title and no section tabs', () => {
    const html = renderToStaticMarkup(<ExploreHeader compact />);
    expect(text(html)).toContain('Explore');
    expect(html).not.toMatch(OLD_TABS);
    for (const label of ['For you', 'Needs', 'Reads']) expect(text(html)).not.toContain(label);
  });

  it('app: one page with the group chips, a type toggle and the grid', () => {
    const html = renderToStaticMarkup(<ExploreScreen products={ALL_PRODUCTS.slice(0, 12)} articles={[]} quizAnswers={null} onStartQuiz={() => {}} />);
    const t = text(html);
    expect(html).not.toMatch(OLD_TABS);
    expect(t).not.toContain('For you');
    expect(t).toContain('All');
    for (const g of SHOP_GROUPS) expect(t).toContain(g.label);
    expect(html).toMatch(/aria-label="Show"/);
    expect(t).toContain('Products');
    expect(t).toContain('Services');
    expect(t).toContain('Filters');
    // Signed out: cards keep the "See your match" invite.
    expect(t).toContain('See your match');
    // Reads stay one tap away.
    expect(t).toContain('Reads: guides and research');
  });

  it('app: the old Services address opens with Services picked', () => {
    const html = renderToStaticMarkup(<ExploreScreen exploreSection="services" products={ALL_PRODUCTS.slice(0, 4)} articles={[]} />);
    expect(html).toMatch(/aria-pressed="true"[^>]*>Services</);
    expect(html).toMatch(/aria-pressed="false"[^>]*>Products</);
  });

  it('app: Reads (the library screen) still opens the reads', () => {
    const html = renderToStaticMarkup(<ExploreScreen exploreSection="resources" products={[]} articles={[]} />);
    expect(text(html)).toContain('Reads');
    expect(html).not.toMatch(OLD_TABS);
  });
});
