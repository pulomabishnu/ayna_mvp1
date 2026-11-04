// Catalog tagging guard (founder, Nov 4: "make sure the new products are tagged correctly
// and aren't messing up the algorithm"). Every live product must be tagged to at least one
// need the quiz can ask about, or be listed below with the reason it isn't. A new product
// that matches nothing fails this test, so it can't go live invisible to matching.
import { describe, expect, it } from 'vitest';
import { CATALOG_PRODUCTS } from '../data/products.js';
import { buildProductProfile, normalCategory } from './productProfile.js';
import { NEEDS } from './ontology.js';

// Reviewed Nov 4. Reason codes: everyday = ordinary skincare/body care, no health need ayna
// matches; claims = the brand's stated use isn't a need ayna matches or rests on claims ayna
// doesn't score (homeopathic, "detox"); device = a device whose stated use is too general.
const NOT_TAGGED_ON_PURPOSE = {
  'p-kiero-refining-enzyme-cleanser': 'everyday', 'p-kiero-airy-sun-stick-spf50': 'everyday', 'p-kiero-comfort-cleansing-balm': 'everyday',
  'p-kiero-prime-sun-gel-spf40': 'everyday', 'p-kiero-essential-boost-serum': 'everyday', 'p-kiero-pure-radiant-eye-cream': 'everyday',
  'p-kiero-moisturizing-barrier-cream': 'everyday', 'p-kiero-balance-toner-pads': 'everyday',
  'p-momotaro-hydrosol-toner': 'everyday', 'p-momotaro-bath-body-tonic': 'everyday', 'p-momotaro-body-oil': 'everyday', 'p-joylux-shebar': 'everyday',
  'p-momotaro-salve': 'claims', 'p-momotaro-vaginal-suppository': 'claims', 'p-love-wellness-intimate-skin-support': 'claims',
  'p-estherformula-ceramide-strips': 'claims', 'p-seeking-health-dao-enzyme-formerly-histamine-dig': 'claims',
  'p-queen-of-the-thrones-ritual-starter-liver-castor': 'claims', 'p-alubri-rejuvenate-restore-kit': 'claims',
  'p-joylux-vfit': 'device', 'p-joylux-vfit-plus': 'device', 'p-joylux-ilyeo-body': 'device',
};
const NEED_IDS = new Set(NEEDS.map((n) => n.id));
const live = CATALOG_PRODUCTS.filter((p) => !p.hidden);

describe('catalog tagging', () => {
  it('every live product is tagged to a quiz need, or listed with its reason', () => {
    const untagged = live.filter((p) => {
      const rel = Object.entries(buildProductProfile(p).health_need_relevance || {}).filter(([, e]) => e.score > 0 || e.contextual.length);
      return !rel.length && !NOT_TAGGED_ON_PURPOSE[p.id];
    }).map((p) => `${p.id} (${p.category})`);
    expect(untagged, 'Tag these in src/matching/productProfile.js RELEVANCE_RULES, or list them above with a reason').toEqual([]);
  });
  it('tags only use needs the quiz knows', () => {
    const bad = [];
    for (const p of live) for (const id of Object.keys(buildProductProfile(p).health_need_relevance || {})) if (!NEED_IDS.has(id)) bad.push(`${p.id}: ${id}`);
    expect(bad).toEqual([]);
  });
  it('the list above has no stale entries (removed or now tagged)', () => {
    const stale = Object.keys(NOT_TAGGED_ON_PURPOSE).filter((id) => {
      const p = live.find((x) => x.id === id);
      if (!p) return true;
      return Object.values(buildProductProfile(p).health_need_relevance || {}).some((e) => e.score > 0 || e.contextual.length);
    });
    expect(stale).toEqual([]);
  });
  it('category spellings map to one name', () => {
    expect(normalCategory('Pelvic-Floor-Trainer')).toBe('pelvic-floor');
  });
});
