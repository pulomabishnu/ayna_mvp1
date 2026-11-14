#!/usr/bin/env node
// 50-profile matching check (Nov 14). Runs 50 realistic quiz answers through the real engine
// (getEcosystemSeedFromQuiz, the same call as the results screen) and flags picks a person would
// notice: over budget, wrong life stage, internal products she declined, allergens, risky supplements
// with her medicines, the same product topping 3+ of her needs, and needs with no picks.
//   node scripts/match-check-50.mjs            node scripts/match-check-50.mjs --json out.json
import { writeFileSync } from 'node:fs';
import { getEcosystemSeedFromQuiz, getProductById } from '../src/data/products.js';
import { EMPTY } from '../src/mobile/data/intakeModel.js';

const base = { allergyStatus: 'No', takesCurrent: 'No', safetyConcern: 'No', diagnosisSelections: ['None that I know of'], personalizationCompleted: true };
const P = (name, x) => ({ name, intake: { ...EMPTY, ...base, ...x } });
const S = (...a) => a;
const PERSONAS = [
  P('19, regular, cramps, under $25', { age: '19', lifeStageSelections: ['I get periods regularly'], supportSelections: S('Cramps or period pain', 'Heavy periods'), priceRange: ['Under $25'] }),
  P('21, regular, acne-free, sleep+fatigue, under $25', { age: '21', lifeStageSelections: ['I get periods regularly'], supportSelections: S('Trouble sleeping', 'Fatigue or low energy'), priceRange: ['Under $25'] }),
  P('22, regular, declines internal, heavy', { age: '22', lifeStageSelections: ['I get periods regularly'], supportSelections: S('Heavy periods', 'Cramps or period pain'), avoidIngredients: ['Internal products (tampons, cups, discs)'] }),
  P('24, BC pill, low mood, anxiety', { age: '24', lifeStageSelections: ['I use hormonal birth control'], supportSelections: S('Low mood', 'Anxiety'), takesCurrent: 'Yes', currentMedicationItems: ['Birth control pill'] }),
  P('25, sertraline, sleep, anxiety', { age: '25', lifeStageSelections: ['I get periods regularly'], supportSelections: S('Trouble sleeping', 'Anxiety'), takesCurrent: 'Yes', currentMedicationItems: ['Sertraline'] }),
  P('27, warfarin, joint aches, fatigue', { age: '27', lifeStageSelections: ['I get periods regularly'], supportSelections: S('Joint aches', 'Fatigue or low energy'), takesCurrent: 'Yes', currentMedicationItems: ['Warfarin'] }),
  P('28, latex + fragrance allergy, dryness, sex comfort', { age: '28', lifeStageSelections: ['I get periods regularly'], supportSelections: S('Vaginal dryness', 'Sexual wellness or comfort'), allergyStatus: 'Yes', allergyItems: ['Latex', 'Fragrance'] }),
  P('29, BV + odor', { age: '29', lifeStageSelections: ['I get periods regularly'], supportSelections: S('BV concerns', 'Vaginal odor') }),
  P('30, yeast + itching', { age: '30', lifeStageSelections: ['I get periods regularly'], supportSelections: S('Yeast infection concerns', 'Vaginal itching or irritation') }),
  P('31, recurrent UTI', { age: '31', lifeStageSelections: ['I get periods regularly'], supportSelections: S('Recurrent UTI-like symptoms'), utiFrequency: 'A few times a year' }),
  P('32, frequent urination only', { age: '32', lifeStageSelections: ['I get periods regularly'], supportSelections: S('Frequent urination'), utiFrequency: 'Rarely' }),
  P('33, TTC, ovulation', { age: '33', lifeStageSelections: ['I am trying to conceive'], supportSelections: S('Trying to conceive', 'Ovulation tracking or support'), ttcDuration: 'Less than 6 months' }),
  P('34, TTC, PCOS', { age: '34', lifeStageSelections: ['I am trying to conceive'], supportSelections: S('PCOS support', 'Fertility support'), diagnosisSelections: ['PCOS'] }),
  P('29, pregnant T1, nausea, sleep', { age: '29', lifeStageSelections: ['I am pregnant'], supportSelections: S('Nausea', 'Trouble sleeping'), pregnancyTrimester: 'First trimester' }),
  P('31, pregnant T3, discomfort, constipation', { age: '31', lifeStageSelections: ['I am pregnant'], supportSelections: S('Pregnancy-related discomfort', 'Constipation'), pregnancyTrimester: 'Third trimester' }),
  P('30, pregnant, low mood', { age: '30', lifeStageSelections: ['I am pregnant'], supportSelections: S('Low mood', 'Anxiety'), pregnancyTrimester: 'Second trimester' }),
  P('32, postpartum, breastfeeding, recovery', { age: '32', lifeStageSelections: ['I am postpartum'], supportSelections: S('Postpartum recovery', 'Breastfeeding or lactation support'), postpartumTiming: '0-3 months' }),
  P('33, postpartum, hair loss, fatigue', { age: '33', lifeStageSelections: ['I am postpartum'], supportSelections: S('Hair thinning or hair loss', 'Fatigue or low energy'), postpartumTiming: '3-6 months' }),
  P('44, perimenopause, hot flashes, sleep', { age: '44', lifeStageSelections: ['I am in perimenopause'], supportSelections: S('Hot flashes', 'Trouble sleeping') }),
  P('46, perimenopause, irregular heavy, mood', { age: '46', lifeStageSelections: ['I am in perimenopause'], supportSelections: S('Heavy periods', 'Mood swings') }),
  P('47, perimenopause, brain fog, under $25', { age: '47', lifeStageSelections: ['I am in perimenopause'], supportSelections: S('Brain fog', 'Night sweats'), priceRange: ['Under $25'] }),
  P('51, menopause, dryness, libido', { age: '51', lifeStageSelections: ['I am in menopause'], supportSelections: S('Vaginal dryness', 'Low libido or libido changes') }),
  P('53, menopause, hot flashes, warfarin', { age: '53', lifeStageSelections: ['I am in menopause'], supportSelections: S('Hot flashes', 'Night sweats'), takesCurrent: 'Yes', currentMedicationItems: ['Warfarin'] }),
  P('58, post-menopause, bone, joints', { age: '58', lifeStageSelections: ['I am post-menopause'], supportSelections: S('Bone health', 'Joint aches') }),
  P('62, post-menopause, leakage, dryness', { age: '62', lifeStageSelections: ['I am post-menopause'], supportSelections: S('Bladder leakage or incontinence', 'Vaginal dryness') }),
  P('65, post-menopause, sleep, constipation', { age: '65', lifeStageSelections: ['I am post-menopause'], supportSelections: S('Trouble sleeping', 'Constipation') }),
  P('23, irregular, PCOS, hair', { age: '23', lifeStageSelections: ['My periods are irregular'], supportSelections: S('PCOS support', 'Excess facial or body hair'), diagnosisSelections: ['PCOS'] }),
  P('26, endometriosis, pelvic pain', { age: '26', lifeStageSelections: ['I get periods regularly'], supportSelections: S('Endometriosis support', 'Cramps or period pain'), diagnosisSelections: ['Endometriosis'] }),
  P('35, fibroids, heavy, fatigue', { age: '35', lifeStageSelections: ['I get periods regularly'], supportSelections: S('Fibroid-related concerns', 'Heavy periods', 'Fatigue or low energy') }),
  P('27, digestive bloating, gas', { age: '27', lifeStageSelections: ['I get periods regularly'], supportSelections: S('Digestive bloating', 'Gas') }),
  P('28, cycle bloating + mood', { age: '28', lifeStageSelections: ['I get periods regularly'], supportSelections: S('Cycle-related bloating', 'Cycle-related mood changes') }),
  P('36, metabolism, strength', { age: '36', lifeStageSelections: ['I get periods regularly'], supportSelections: S('Metabolism or weight support', 'Strength or fitness') }),
  P('25, contraception, STI', { age: '25', lifeStageSelections: ['I get periods regularly'], supportSelections: S('Contraception', 'STI-related concerns') }),
  P('24, pain during sex', { age: '24', lifeStageSelections: ['I get periods regularly'], supportSelections: S('Pain or discomfort during sex') }),
  P('30, find doctor + telehealth', { age: '30', lifeStageSelections: ['I get periods regularly'], supportSelections: S('Finding a doctor or specialist', 'Finding a telehealth provider') }),
  P('20, nothing right now', { age: '20', lifeStageSelections: ['I get periods regularly'], supportSelections: S('Nothing right now') }),
  P('29, $150+ fine, sleep, hot flashes', { age: '29', lifeStageSelections: ['I get periods regularly'], supportSelections: S('Trouble sleeping'), priceRange: ['Price is not a major factor for me'] }),
  P('38, under $25, everything', { age: '38', lifeStageSelections: ['I get periods regularly'], supportSelections: S('Cramps or period pain', 'Trouble sleeping', 'Anxiety', 'Constipation', 'Fatigue or low energy'), priceRange: ['Under $25'] }),
  P('40, irregular, concentration', { age: '40', lifeStageSelections: ['My periods are irregular'], supportSelections: S('Difficulty concentrating', 'Irritability') }),
  P('27, no periods now, fatigue', { age: '27', lifeStageSelections: ['I do not currently get periods'], supportSelections: S('Fatigue or low energy', 'Hair thinning or hair loss') }),
  P('22, soy allergy, sleep, cramps', { age: '22', lifeStageSelections: ['I get periods regularly'], supportSelections: S('Trouble sleeping', 'Cramps or period pain'), allergyStatus: 'Yes', allergyItems: ['Soy'] }),
  P('34, pregnant, wants pregnancy-safe products', { age: '34', lifeStageSelections: ['I am pregnant'], supportSelections: S('Pregnancy-safe product discovery', 'Vaginal dryness'), pregnancyTrimester: 'Second trimester' }),
  P('31, breastfeeding, sleep, low mood', { age: '31', lifeStageSelections: ['I am postpartum'], supportSelections: S('Trouble sleeping', 'Low mood'), breastfeedingStatus: 'Yes', postpartumTiming: '0-3 months' }),
  P('45, peri, BC pill, sleep', { age: '45', lifeStageSelections: ['I am in perimenopause', 'I use hormonal birth control'], supportSelections: S('Trouble sleeping', 'Hot flashes'), takesCurrent: 'Yes', currentMedicationItems: ['Birth control pill'] }),
  P('50, menopause, joint, bone, under $25', { age: '50', lifeStageSelections: ['I am in menopause'], supportSelections: S('Joint aches', 'Bone health'), priceRange: ['Under $25'] }),
  P('26, urgent symptoms', { age: '26', lifeStageSelections: ['I get periods regularly'], supportSelections: S('Burning with urination'), utiFrequency: 'I am experiencing them right now', safetyConcern: 'Yes' }),
  P('18, regular, cramps, heavy, sleep', { age: '18', lifeStageSelections: ['I get periods regularly'], supportSelections: S('Cramps or period pain', 'Heavy periods', 'Trouble sleeping') }),
  P('33, no answers to safety', { age: '33', lifeStageSelections: ['I get periods regularly'], supportSelections: S('Trouble sleeping', 'Anxiety'), allergyStatus: '', takesCurrent: '', safetyConcern: '' }),
  P('41, adenomyosis, pain, heavy', { age: '41', lifeStageSelections: ['I get periods regularly'], supportSelections: S('Adenomyosis-related concerns', 'Heavy periods') }),
  P('37, diarrhea, abdominal discomfort', { age: '37', lifeStageSelections: ['I get periods regularly'], supportSelections: S('Diarrhea', 'Abdominal discomfort') }),
];

const priceOf = (p) => { const m = String(p?.price ?? '').replace(/,/g, '').match(/\d+(\.\d+)?/); return m ? Number(m[0]) : null; };
const text = (p) => [p?.name, p?.category, p?.subcategory, ...(Array.isArray(p?.ingredients) ? p.ingredients : [p?.ingredients]), ...(p?.tags || [])].filter(Boolean).join(' ').toLowerCase();
const INTERNAL = /tampon|menstrual cup|\bdisc\b|period disc/;
const MENO = /menopaus|hot flash|night sweat|estrogen|meno\b/;
const PERIOD = /\bpad\b|\bpads\b|tampon|period underwear|menstrual|liner/;
const MED_RISK = {
  'Warfarin': /ginkgo|fish oil|omega-3|vitamin e\b|vitamin k|turmeric|curcumin|dong quai|garlic extract/,
  'Sertraline': /st\.? john|5-htp|tryptophan|same\b|s-adenosyl/,
  'Birth control pill': /st\.? john/,
};
const ALLERGEN = { Latex: /latex/, Fragrance: /fragrance|parfum|perfume|scented/, Soy: /\bsoy/ };

const report = [];
for (const { name, intake } of PERSONAS) {
  let seed;
  try { seed = getEcosystemSeedFromQuiz({ fullHealthIntake: intake, personalizationCompleted: true }); } catch (e) { report.push({ name, error: String(e).slice(0, 120) }); continue; }
  const shelves = seed.shelves || [];
  const flags = []; const seen = {};
  for (const sh of shelves) {
    const ids = (sh.productIds || []).slice(0, 3);
    if (!ids.length) flags.push(`EMPTY need "${sh.label}"${sh.emptyReason ? ` (${sh.emptyReason})` : ''}`);
    for (const id of ids) {
      const p = getProductById(id); if (!p) continue; const t = text(p); const pr = priceOf(p);
      seen[id] = (seen[id] || 0) + 1;
      if ((intake.priceRange || []).includes('Under $25') && pr != null && pr > 40) flags.push(`OVER BUDGET $${pr} ${p.name} (for ${sh.label})`);
      if ((intake.avoidIngredients || []).includes('Internal products (tampons, cups, discs)') && INTERNAL.test(t)) flags.push(`DECLINED INTERNAL ${p.name}`);
      const stage = (intake.lifeStageSelections || []).join(' ');
      if (/regularly|irregular|conceive|pregnant|postpartum|birth control/.test(stage) && !/peri|menopause/.test(stage) && Number(intake.age) < 40 && MENO.test(t) && !/hot flash|night sweat/i.test((intake.supportSelections || []).join(' '))) flags.push(`MENOPAUSE PRODUCT for ${intake.age} ${p.name}`);
      if (/post-menopause|in menopause/.test(stage) && PERIOD.test(t) && !/leak|incontinence|bladder/.test(t)) flags.push(`PERIOD PRODUCT after menopause ${p.name}`);
      for (const med of intake.currentMedicationItems || []) if (MED_RISK[med]?.test(t)) flags.push(`MED RISK ${med} + ${p.name}`);
      for (const a of intake.allergyItems || []) if (ALLERGEN[a]?.test(t)) flags.push(`ALLERGEN ${a} in ${p.name}`);
      if (/pregnant/.test(stage) && /st\.? john|black cohosh|dong quai|vitex|chasteberry|retinol|retinoid/.test(t)) flags.push(`PREGNANCY RISK ${p.name}`);
    }
  }
  for (const [id, n] of Object.entries(seen)) if (n >= 3) flags.push(`REPEATED x${n} ${getProductById(id)?.name}`);
  report.push({ name, needs: shelves.length, picks: Object.keys(seen).length, careFirst: shelves.some((s) => s.careFirst), flags: [...new Set(flags)] });
}
const out = process.argv.indexOf('--json');
if (out > 0) writeFileSync(process.argv[out + 1], JSON.stringify(report, null, 2));
const flagged = report.filter((r) => r.error || r.flags.length);
for (const r of report) console.log(`${r.error ? 'ERROR' : r.flags.length ? 'FLAG ' : 'ok   '} ${r.name.padEnd(44)} needs ${r.needs ?? '-'} picks ${r.picks ?? '-'}${r.careFirst ? ' care-first' : ''}${r.error ? ' ' + r.error : ''}${(r.flags || []).map((f) => '\n        ' + f).join('')}`);
console.log(`\n${report.length} profiles, ${flagged.length} with something to look at.`);
