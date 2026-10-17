// Persona sweep (audit Pass 10): seeded random quiz profiles run through an
// engine, with the release-gate metrics. Used by v2.gates.test.js and
// scripts/match-sweep.mjs. Deterministic: same seed, same profiles.
import { SUPPORT_GROUPS, LIFE_STAGES } from '../../mobile/data/intakeModel.js';
import { getEcosystemSeedFromQuiz, ALL_PRODUCTS } from '../../data/products.js';
import { buildProductProfile } from '../productProfile.js';

const SUPPORT = SUPPORT_GROUPS.flatMap((g) => g.items).filter((x) => x !== 'Nothing right now');
const AVOID = ['Fragrance', 'Latex', 'Parabens', 'Hormones', 'Dyes'];
function rng(seed) { let s = seed >>> 0; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }
const pick = (r, arr, n) => { const a = [...arr]; const out = []; while (out.length < n && a.length) out.push(a.splice(Math.floor(r() * a.length), 1)[0]); return out; };

export function makeProfiles(count = 400, seed = 7) {
  const r = rng(seed);
  const out = [];
  for (let i = 0; i < count; i += 1) {
    const life = pick(r, LIFE_STAGES, 1);
    out.push({
      personalizationCompleted: true,
      age: 18 + Math.floor(r() * 45),
      lifeStageSelections: life,
      supportSelections: pick(r, SUPPORT, 1 + Math.floor(r() * 4)),
      avoidIngredients: r() < 0.3 ? pick(r, AVOID, 1) : [],
      ...(life[0] === 'I am postpartum' && r() < 0.5 ? { breastfeeding: 'Yes', breastfeedingStatus: 'Yes' } : {}),
    });
  }
  return out;
}

const SENSITIVE = new Set(['I am pregnant', 'I am trying to conceive']);
export function runSweep(engine, profiles) {
  const exposure = new Map();
  let shelves = 0; let empty = 0; let violations = 0; let picks = 0; let strong = 0; let ecosystems = 0;
  const violationsList = [];
  for (const intake of profiles) {
    const seed = getEcosystemSeedFromQuiz({ fullHealthIntake: intake, personalizationCompleted: true }, null, { engine });
    const ids = new Set();
    for (const sh of seed.shelves || []) {
      shelves += 1;
      if (!(sh.productIds || []).length) empty += 1;
      (sh.productIds || []).forEach((id) => ids.add(id));
      for (const p of sh.picks || []) { picks += 1; if (p.v2?.band === 'strong' || (!p.v2 && p.score >= 85)) strong += 1; }
    }
    if (ids.size) ecosystems += 1;
    ids.forEach((id) => exposure.set(id, (exposure.get(id) || 0) + 1));
    if (intake.lifeStageSelections.some((l) => SENSITIVE.has(l)) || intake.breastfeeding === 'Yes') {
      for (const id of ids) {
        const pp = buildProductProfile(ALL_PRODUCTS.find((p) => p.id === id));
        const stage = intake.breastfeeding === 'Yes' ? pp.breastfeeding : pp.pregnancy;
        if (pp.ingested && ['avoid', 'contraindicated', 'unknown'].includes(stage?.overall)) { violations += 1; violationsList.push(`${id} for ${intake.lifeStageSelections[0]}`); }
      }
    }
  }
  const counts = [...exposure.values()].sort((a, b) => a - b);
  const n = counts.length; const total = counts.reduce((a, b) => a + b, 0);
  const gini = n && total ? counts.reduce((acc, c, i) => acc + (2 * (i + 1) - n - 1) * c, 0) / (n * total) : 0;
  const top = [...exposure.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
  return {
    engine,
    profiles: profiles.length,
    violations, violationsList: violationsList.slice(0, 10),
    catalogShown: n,
    catalogCoverage: Math.round((n / ALL_PRODUCTS.length) * 100) / 100,
    topShare: Math.round(((top[0]?.[1] || 0) / Math.max(1, ecosystems)) * 100) / 100,
    top: top.map(([id, c]) => `${id}:${c}`),
    gini: Math.round(gini * 100) / 100,
    emptyShelfShare: Math.round((empty / Math.max(1, shelves)) * 100) / 100,
    strongShare: Math.round((strong / Math.max(1, picks)) * 100) / 100,
    avgPicks: Math.round((picks / Math.max(1, profiles.length)) * 10) / 10,
  };
}
