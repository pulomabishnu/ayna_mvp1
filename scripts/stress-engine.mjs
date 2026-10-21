#!/usr/bin/env node
// Stress test for the recommendation engine: hundreds of generated personas,
// each run through both engines (v1 app, v2 website), checked against hard
// rules. Prints every violation. Usage: node scripts/stress-engine.mjs [count]
import { ALL_PRODUCTS, getEcosystemSeedFromQuiz, getProductMatchDetailsForProduct } from '../src/data/products.js';
import { EMPTY, SUPPORT_GROUPS, CONDITIONS, ALLERGIES } from '../src/mobile/data/intakeModel.js';
import { buildUserProfile } from '../src/matching/userProfile.js';
import { buildProductProfile } from '../src/matching/productProfile.js';
import { evaluateSafety } from '../src/matching/score.js';
import { SYMPTOM_TERMS } from '../src/matching/lexicon.js';

const N = Number(process.argv[2] || 400);
let seed = 42;
const rand = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
const pick = (arr, k = 1) => { const a = [...arr]; const out = []; while (out.length < k && a.length) out.push(a.splice(Math.floor(rand() * a.length), 1)[0]); return out; };

const NEEDS = SUPPORT_GROUPS.flatMap((g) => g.items).filter((x) => !['Nothing right now', 'Something else'].includes(x));
const STAGES = ['I get periods regularly', 'My periods are irregular', 'I am trying to conceive', 'I am pregnant', 'I am postpartum', 'I am in perimenopause', 'I am in menopause', 'I am post-menopause', 'I use hormonal birth control'];
const MEDS = ['Lexapro', 'Sertraline', 'Metformin', 'Spironolactone', 'Levothyroxine', 'Birth control pill', 'Warfarin', 'Ibuprofen'];
const PP = new Map(ALL_PRODUCTS.map((p) => [p.id, buildProductProfile(p)]));
const byId = new Map(ALL_PRODUCTS.map((p) => [p.id, p]));

function persona(i) {
  const age = 18 + Math.floor(rand() * 50);
  const stages = pick(STAGES, rand() < 0.75 ? 1 : 2);
  const support = [...pick(NEEDS, 1 + Math.floor(rand() * 4)), ...(rand() < 0.4 ? pick(SYMPTOM_TERMS.map((t) => t.term), 1) : [])];
  const intake = {
    ...EMPTY, age: String(age), lifeStageSelections: stages, supportSelections: support,
    diagnosisSelections: rand() < 0.3 ? pick(CONDITIONS.filter((c) => !/None|Prefer/.test(c)), 1) : ['None that I know of'],
    allergyStatus: rand() < 0.3 ? 'Yes' : 'No', allergyItems: [],
    takesCurrent: rand() < 0.3 ? 'Yes' : 'No', currentMedicationItems: [],
    breastfeedingStatus: stages.includes('I am postpartum') ? (rand() < 0.5 ? 'Yes' : 'No') : '',
    avoidIngredients: rand() < 0.2 ? ['Fragrance'] : [],
    urgentStatus: 'No',
  };
  if (intake.allergyStatus === 'Yes') intake.allergyItems = pick(ALLERGIES, 1 + Math.floor(rand() * 2));
  if (intake.takesCurrent === 'Yes') intake.currentMedicationItems = pick(MEDS, 1);
  return intake;
}

const violations = [];
const flag = (i, engine, rule, detail) => violations.push({ persona: i, engine, rule, detail });
const stats = { personas: 0, emptyEcosystems: 0, needsWithoutShelf: 0, shelves: 0, picks: 0 };

for (let i = 0; i < N; i++) {
  const intake = persona(i);
  let up;
  try { up = buildUserProfile(intake, { catalog: ALL_PRODUCTS }); } catch (e) { flag(i, '-', 'profile_crash', String(e.message)); continue; }
  stats.personas++;
  const needIds = new Set(up.healthIntent.needs.map((n) => n.id));
  for (const engine of ['v1', 'v2']) {
    let seedOut;
    try { seedOut = getEcosystemSeedFromQuiz({ fullHealthIntake: intake, personalizationCompleted: true }, null, { engine }); } catch (e) { flag(i, engine, 'engine_crash', String(e.stack).slice(0, 300)); continue; }
    const shelves = seedOut.shelves || [];
    stats.shelves += shelves.length;
    if (!shelves.some((s) => s.productIds.length) && needIds.size) { stats.emptyEcosystems++; flag(i, engine, 'empty_ecosystem', `needs=${[...needIds].join(',')} stages=${up.physiology.lifeStages.join(',')} preg=${up.safety.pregnant} allergies=${(up.safety.allergies||[]).map(a=>a.id).join(',')} meds=${(up.safety.medications||[]).map(m=>m.generic).join(',')}`); }
    const seen = new Set();
    for (const s of shelves) {
      for (const pid of s.productIds) {
        stats.picks++;
        const pp = PP.get(pid);
        if (!pp) { flag(i, engine, 'unknown_product', pid); continue; }
        // 1. Safety: every pick must pass safety for this person.
        const safety = evaluateSafety(pp, up);
        if (!safety.eligible) flag(i, engine, 'unsafe_pick', `${pid} on ${s.needId}: ${safety.reasons.map((r) => r.code).join(',')}`);
        // 2. Relevance: a pick must relate to the shelf's need (or be care/universal).
        const rel = pp.health_need_relevance[s.needId];
        if (s.needId && needIds.has(s.needId) && !rel && !/care\.|universal/.test(s.needId)) flag(i, engine, 'irrelevant_pick', `${pid} (${byId.get(pid)?.name}) on ${s.needId}`);
        // 3. Pregnant: no ingested product with unknown pregnancy safety.
        if (up.safety.pregnant && (pp.ingested || pp.herbal) && pp.pregnancy?.overall === 'unknown') flag(i, engine, 'pregnancy_unknown_ingested', `${pid} on ${s.needId}`);
        // 4. Duplicates within a shelf.
        const key = `${s.needId}|${pid}`;
        if (seen.has(key)) flag(i, engine, 'duplicate_pick', key);
        seen.add(key);
      }
    }
    // 5. Every need she picked that has at least one safe, relevant product gets a shelf.
    for (const n of needIds) {
      const shelf = shelves.find((s) => s.needId === n);
      if (shelf && shelf.productIds.length) continue;
      // Candidates that clear the shelf bar: strong relevance, safe, not held back, and a shown match of 60%+.
      const candidates = ALL_PRODUCTS.filter((p) => {
        if ((PP.get(p.id).health_need_relevance[n]?.score || 0) < 0.55) return false;
        const sf = evaluateSafety(PP.get(p.id), up);
        if (!sf.eligible || sf.restricted) return false;
        const d = getProductMatchDetailsForProduct(p, { fullHealthIntake: intake, personalizationCompleted: true }, null, { needId: n });
        return d.matchStatus === 'scored' && d.percent >= 60;
      });
      if (candidates.length >= 2) { stats.needsWithoutShelf++; flag(i, engine, 'need_without_picks', `${n} (${candidates.length} safe strong candidates)`); }
    }
  }
  // 6. Match details never crash and stay in 0..100.
  for (const p of pick(ALL_PRODUCTS, 3)) {
    try {
      const d = getProductMatchDetailsForProduct(p, { fullHealthIntake: intake, personalizationCompleted: true });
      if (d.percent != null && (d.percent < 0 || d.percent > 100 || Number.isNaN(d.percent))) flag(i, '-', 'bad_percent', `${p.id} ${d.percent}`);
    } catch (e) { flag(i, '-', 'details_crash', `${p.id}: ${e.message}`); }
  }
}

const byRule = {};
for (const v of violations) (byRule[v.rule] ||= []).push(v);
console.log(JSON.stringify(stats));
for (const [rule, list] of Object.entries(byRule)) {
  console.log(`\n${rule}: ${list.length}`);
  const counts = {};
  list.forEach((v) => { const k = v.detail.slice(0, 140); counts[`${v.engine} ${k}`] = (counts[`${v.engine} ${k}`] || 0) + 1; });
  Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 15).forEach(([k, n]) => console.log(`  ${n}x ${k}`));
}
process.exitCode = violations.length ? 1 : 0;
