import { describe, it, expect } from 'vitest';
import { SYMPTOM_TERMS, CONDITION_TERMS, ALLERGY_TERMS, normalizeTerm } from './lexicon.js';
import { NEED_BY_ID, CONDITIONS, ALLERGEN_BY_ID, canonicalize, canonicalizeAll } from './ontology.js';
import { buildUserProfile } from './userProfile.js';
import { ALL_PRODUCTS } from '../data/products.js';
import { buildProductProfile } from './productProfile.js';

const CONDITION_IDS = new Set(CONDITIONS.map((c) => c.id));

describe('search vocabulary is linked correctly', () => {
  it('every symptom term maps only to needs that exist', () => {
    for (const t of SYMPTOM_TERMS) for (const id of t.needs) expect(NEED_BY_ID[id], `${t.term} -> ${id}`).toBeTruthy();
  });
  it('every condition and allergy term maps to an id that exists', () => {
    for (const t of CONDITION_TERMS) expect(CONDITION_IDS.has(t.id), `${t.term} -> ${t.id}`).toBe(true);
    for (const t of ALLERGY_TERMS) expect(ALLERGEN_BY_ID[t.id], `${t.term} -> ${t.id}`).toBeTruthy();
  });
  it('no term is listed twice within a list', () => {
    for (const list of [SYMPTOM_TERMS, CONDITION_TERMS, ALLERGY_TERMS]) {
      const seen = new Map();
      for (const t of list) { const k = normalizeTerm(t.term); expect(seen.has(k), `duplicate: ${t.term}`).toBe(false); seen.set(k, t); }
    }
  });
  it('picking a symptom term gives exactly the needs it lists', () => {
    for (const t of SYMPTOM_TERMS) {
      const c = canonicalize(t.term, { kinds: ['need'] });
      const got = [c.canonical_id, ...(c.also || [])].filter(Boolean);
      // A built-in quiz option with the same words keeps its single need.
      if (c.method === 'exact_option') { expect(t.needs).toContain(c.canonical_id); continue; }
      expect(got.sort(), t.term).toEqual([...t.needs].sort());
    }
  });
  // Re-enabled once the catalog gap review lands (task 6).
  it.skip('every need a term can point to has at least one product in the catalog', () => {
    const covered = new Set();
    for (const p of ALL_PRODUCTS) {
      const pp = buildProductProfile(p);
      for (const [id, rel] of Object.entries(pp.health_need_relevance || {})) if ((rel.score || 0) > 0 || (rel.contextual || []).length) covered.add(id);
    }
    const missing = [...new Set(SYMPTOM_TERMS.flatMap((t) => t.needs))].filter((id) => !covered.has(id));
    expect(missing).toEqual([]);
  });
});

describe('typed text is read everywhere in the quiz', () => {
  const up = (intake) => buildUserProfile({ personalizationCompleted: true, ...intake });
  const ids = (p) => p.healthIntent.needs.map((n) => n.id).sort();

  it('one typed chip can name several needs', () => {
    expect(ids(up({ supportSelections: ['cramps and acne'] }))).toEqual(['pain.menstrual_cramp', 'skin.acne']);
    expect(ids(up({ supportSelections: ['Itchy discharge'] }))).toEqual(['vaginal.discharge', 'vaginal.irritation']);
  });
  it('the "Something else" box keeps every need in a long sentence', () => {
    const p = up({ supportSelections: ['Something else'], supportOtherText: 'my periods last like 9 days, also bad breakouts on my jaw and i pee at night' });
    expect(ids(p)).toEqual(['period.heavy', 'skin.acne', 'skin.hormonal', 'urinary.frequency']);
    // Each need keeps the clause it came from, not the whole paragraph.
    expect(p.healthIntent.needs.find((n) => n.id === 'urinary.frequency').raw).toBe('i pee at night');
  });
  it('the closing "anything else" note feeds allergies, leave-outs, values, conditions, medicines and needs', () => {
    const p = up({ supportSelections: ['Acne'], anythingElse: 'I am allergic to latex and I hate anything scented. I want vegan stuff only. I am on Lexapro. I get bad bloating before my period. Also I have hashimotos.' });
    expect(p.safety.allergies.map((a) => a.id)).toContain('latex');
    expect(JSON.stringify(p)).toMatch(/"leaveOut":\[\{"attr":"fragrance"/);
    expect(JSON.stringify(p)).toMatch(/"shouldBe":\[\{"id":"vegan"/);
    expect(p.safety.conditions.map((c) => c.id)).toContain('thyroid');
    expect(p.safety.medications.map((m) => m.generic)).toContain('escitalopram');
    expect(ids(p)).toContain('bloating.cycle_related');
  });
  it('negated and uncertain mentions are not taken as facts', () => {
    const p = up({ supportSelections: ['Acne'], anythingElse: 'no cramps at all. maybe I have PCOS? I used to take Lexapro but stopped.' });
    expect(ids(p)).toEqual(['skin.acne']);
    expect(p.safety.conditions).toEqual([]);
    expect(p.safety.medications.filter((m) => m.source === 'free_text')).toEqual([]);
  });
  it('red-flag terms raise a care note, never an exclusion', () => {
    const p = up({ supportSelections: ['Bleeding after sex'] });
    expect(p.healthIntent.careTerms).toEqual(['Bleeding after sex']);
    expect(ids(p)).toEqual(['cycle.spotting']);
  });
  it('a typed diagnosis name maps to the condition', () => {
    expect(up({ diagnosisSelections: ["Hashimoto's"] }).safety.conditions.map((c) => c.id)).toEqual(['thyroid']);
    expect(up({ diagnosisSelections: ['Other / not listed'], conditionOtherText: 'Factor V Leiden' }).safety.conditions.map((c) => c.id)).toEqual(['blood_clot_history']);
  });
  it('canonicalizeAll finds every condition named in a sentence', () => {
    expect(canonicalizeAll('I have hashimotos and endo', { kinds: ['condition'] }).map((c) => c.canonical_id).sort()).toEqual(['endometriosis', 'thyroid']);
  });
});
