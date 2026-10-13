import { describe, it, expect } from 'vitest';
import { ALL_PRODUCTS } from '../data/products.js';
import { buildProductProfile, parsePrice, RELEVANCE_RULES, LEVEL } from './productProfile.js';
import { NEED_BY_ID } from './ontology.js';

const byId = Object.fromEntries(ALL_PRODUCTS.map((p) => [p.id, p]));
const prof = (id) => buildProductProfile(byId[id]);
const rel = (id, need) => prof(id).health_need_relevance[need]?.score ?? 0;

describe('relevance rule table', () => {
  it('only uses canonical need ids and spec levels', () => {
    const levels = new Set(Object.values(LEVEL));
    for (const p of ALL_PRODUCTS) {
      for (const [need, e] of Object.entries(buildProductProfile(p).health_need_relevance)) {
        expect(NEED_BY_ID[need], `${p.id} -> ${need}`).toBeTruthy();
        expect(levels.has(e.score), `${p.id} ${need}=${e.score}`).toBe(true);
      }
    }
    RELEVANCE_RULES.forEach((r) => expect(r.why).toMatch(/\w/));
  });

  it('heat patch and TENS device are made for period cramps (1.0)', () => {
    expect(rel('p-thermacare', 'pain.menstrual_cramp')).toBe(1);
    expect(rel('p-sootheher-elaris-pod', 'pain.menstrual_cramp')).toBe(1);
    expect(prof('p-thermacare').health_need_relevance['pain.menstrual_cramp'].relationship).toBe('direct');
  });

  it('vaginal moisturizer -> dryness 1.0; lube -> dryness 0.55 and sexual pain 0.55', () => {
    expect(rel('p-neycher-vaginal-moisturizer', 'vaginal.dryness')).toBe(1);
    expect(rel('p-kindra-lotion', 'vaginal.dryness')).toBe(1);
    expect(rel('p-uberlube', 'vaginal.dryness')).toBe(0.55);
    expect(rel('p-uberlube', 'pain.sexual')).toBe(0.55);
  });

  it('BV test -> BV 1.0, but a generic probiotic is at most 0.30 for BV', () => {
    expect(rel('p-winx-vaginal-health-test-treat', 'vaginal.bv')).toBe(1);
    expect(rel('p-probiotics-women', 'vaginal.bv')).toBeLessThanOrEqual(0.3);
    expect(rel('p-winx-vaginal-probiotic', 'vaginal.bv')).toBeLessThanOrEqual(0.3);
    expect(rel('p-winx-vaginal-probiotic', 'vaginal.yeast')).toBeLessThanOrEqual(0.3);
  });

  it('D-mannose / cranberry -> recurrent UTI prevention 0.8, tagged as prevention, weak for active symptoms', () => {
    for (const id of ['p-d-mannose-now', 'p-cranberry-supplement', 'p-uqora-control']) {
      expect(rel(id, 'urinary.recurrent_uti')).toBe(0.8);
      expect(rel(id, 'urinary.burning')).toBeLessThanOrEqual(0.1);
      expect(prof(id).care_roles).toContain('prevention');
    }
    expect(prof('p-winx-uti-test-treat').care_roles).toEqual(expect.arrayContaining(['testing', 'care']));
  });

  it('scores differ per need: a cramp device is unrelated to acne', () => {
    expect(rel('p-sootheher-elaris-pod', 'skin.acne')).toBe(0);
    expect(rel('p-zinc', 'skin.acne')).toBeGreaterThan(0);
    expect(rel('p-zinc', 'pain.menstrual_cramp')).toBe(0);
  });

  it('accessories never rank above secondary', () => {
    expect(rel('p-sootheher-gel-pad-refills', 'pain.menstrual_cramp')).toBe(0.55);
  });
});

describe('menstrual characteristics', () => {
  it('derives capacity from catalog text and category', () => {
    expect(prof('p-carefree-liners').menstrual.capacity).toBe('very_light');
    expect(prof('p-ob-procomfort-mini-32').menstrual.capacity).toBe('light');
    expect(prof('p-stayfree-ultra').menstrual.capacity).toBe('regular');
    expect(prof('p-always-infinity').menstrual.capacity).toBe('high');
    expect(prof('p-rael-overnight').menstrual.capacity).toBe('highest');
    expect(prof('p-lumma-disc').menstrual.capacity).toBe('highest');
    expect(prof('p-ob-original-super-plus-40').menstrual.capacity).toBe('highest');
  });
});

describe('safety statuses are read from text, never inferred from silence', () => {
  it('fragrance-free stated -> no; fragranced -> yes; variant -> unknown; silent -> unknown', () => {
    expect(prof('p-rael-organic-pad').safety.fragrance).toBe('no');
    expect(prof('p-honeypot-pad').safety.fragrance).toBe('yes');
    // p-always-infinity's variant is now pinned (unscented 18 ct) by a reviewed
    // retailer source, so its fragrance is a known 'no'. The variant-dependent
    // case is kept as a synthetic product so it stays reviewed-state-proof.
    expect(prof('p-always-infinity').safety.fragrance).toBe('no');
    const variantProduct = buildProductProfile({ id: 'x-variant-pad', name: 'Pad', category: 'pad', type: 'physical', ingredients: 'Cotton top sheet. Available in scented and unscented versions.' });
    expect(variantProduct.safety.fragrance).toBe('unknown');
    expect(variantProduct.safety.details.fragrance.variant).toBe(true);
    expect(prof('p-thermacare').safety.fragrance).toBe('unknown');
  });

  it('latex-free stated -> no; latex-compatible lube is unknown (not yes, not no)', () => {
    expect(prof('p-lunette-cup').safety.latex).toBe('no');
    expect(prof('p-saalt-cup').safety.latex).toBe('no');
    expect(prof('p-saalt-cup').safety.dyes).toBe('no');
    expect(prof('p-uberlube').safety.latex).toBe('unknown');
  });

  it('"-free" claims never count as a positive mention', () => {
    // Synthetic: real catalog products with this claim have since been reviewed against their labels.
    expect(buildProductProfile({ id: 'x-free-claim', name: 'Gentle wash', category: 'wash', type: 'physical', ingredients: 'Water, aloe. Paraben-free and preservative-free.' }).safety.preservatives).not.toBe('yes');
    expect(prof('p-citracal-bone-health').safety.animal_derived).toBe('unknown');
  });

  it('digital products are not_applicable for material attributes', () => {
    expect(prof('d-clue').safety.latex).toBe('not_applicable');
    expect(prof('d-clue').pregnancy.overall).toBe('not_applicable');
  });
});

describe('pregnancy and breastfeeding', () => {
  it('defaults to unknown with no evidence source or review date', () => {
    // p-thermacare now has a reviewed label caution; use an unreviewed product.
    const p = prof('p-portable-heating').pregnancy;
    expect(p).toEqual({ overall: 'unknown', trimester_1: 'unknown', trimester_2: 'unknown', trimester_3: 'unknown', evidence_source: null, last_reviewed: null });
  });
  it('reads explicit catalog statements', () => {
    expect(prof('p-sootheher-elaris-pod').pregnancy.overall).toBe('contraindicated');
    expect(prof('p-boric-acid').pregnancy.overall).toBe('contraindicated');
    expect(prof('p-vitex').breastfeeding.overall).toBe('contraindicated');
    expect(prof('p-neycher-vaginal-moisturizer').pregnancy.overall).toBe('caution');
    expect(prof('p-sootheher-elaris-pod').life_stage.pregnant).toBe('contraindicated');
  });
  it('never marks anything verified (the catalog has no reviewed pregnancy data)', () => {
    ALL_PRODUCTS.forEach((p) => expect(buildProductProfile(p).pregnancy.overall).not.toBe('verified'));
  });
});

describe('other fields', () => {
  it('parses prices without inventing numbers', () => {
    expect(parsePrice('$8 for 18')).toMatchObject({ amount: 8, currency: 'USD' });
    expect(parsePrice('$15–20/month')).toMatchObject({ amount: 15, max: 20, recurring: 'month' });
    expect(parsePrice('Free (Premium available)')).toMatchObject({ amount: 0, is_free: true });
    expect(parsePrice('€69.95')).toMatchObject({ amount: 69.95, currency: 'EUR' });
    expect(parsePrice('$2,245+').amount).toBe(2245);
    expect(parsePrice('See Amazon').amount).toBe(null);
  });

  it('builds evidence counts from citation fields (0 when none)', () => {
    const e = prof('p-always-infinity').evidence;
    expect(e.clinical_guideline).toBeGreaterThan(0);
    expect(e.community).toBeGreaterThan(0);
    const none = buildProductProfile({ id: 'x-none', name: 'Plain thing', category: 'supplement', type: 'physical', tags: [], healthFunctions: [] }).evidence;
    expect(none).toMatchObject({ product_specific: 0, ingredient_specific: 0, clinical_guideline: 0, community: 0 });
  });

  it('reads brand, ownership and sustainability from existing fields', () => {
    const b = prof('p-rael-organic-pad').brand;
    expect(b.name).toBe('Rael');
    expect(b.ownership).toContain('woc_owned');
    expect(prof('p-cora-organic-pads').brand.sustainability).toEqual(expect.arrayContaining(['sustainable', 'b_corp']));
    expect(prof('p-winx-uti-test-treat').brand.emerging).toBe(true);
  });

  it('applies the documented adult-products age policy and stated limits', () => {
    expect(prof('p-maude-vibe').age.minimum).toBe(18);
    expect(prof('p-vio2-mouth-tape').age.minimum).toBe(6);
    expect(prof('p-thermacare').age).toMatchObject({ minimum: null, maximum: null });
  });

  it('metadata_confidence is the share of key fields known', () => {
    for (const p of ALL_PRODUCTS) {
      const m = buildProductProfile(p).metadata_confidence;
      expect(m).toBeGreaterThanOrEqual(0);
      expect(m).toBeLessThanOrEqual(1);
    }
  });

  it('caches per product id', () => {
    expect(prof('p-thermacare')).toBe(prof('p-thermacare'));
  });

  it('reads FSA/HSA only when the catalog states it', () => {
    expect(prof('p-elvie-trainer').fsa_hsa).toBe('yes');
    expect(prof('p-thermacare').fsa_hsa).toBe('unknown');
  });
});

describe('step 2 rule refinements', () => {
  it('a sentence that denies a benefit is not a mention of the condition', () => {
    // "not established as a treatment for PCOS", "PCOS alone does not establish a need"
    for (const id of ['p-vitex', 'p-evening-primrose', 'p-natures-bounty-d3-125mcg', 'p-zinc']) {
      expect(rel(id, 'condition_support.pcos'), id).toBe(0);
    }
    expect(rel('p-vitex', 'cycle.pms')).toBe(LEVEL.SECONDARY);
  });
  it('limited catalog evidence caps every need at secondary (0.55)', () => {
    expect(rel('p-inositol-wholesome', 'condition_support.pcos')).toBe(LEVEL.SECONDARY);
    expect(prof('p-inositol-wholesome').matched_rules).toContain('limited_evidence_cap');
  });
  it('flags high-dose iron as confirmation-first and reads snake_case FSA/HSA fields', () => {
    expect(prof('p-nature-made-iron-65mg').requires_condition).toEqual(expect.objectContaining({ condition: 'anemia' }));
    expect(buildProductProfile({ id: 't-fsa', name: 'T', category: 'pad', fsa_eligible: true }).fsa_hsa).toBe('yes');
  });
});
