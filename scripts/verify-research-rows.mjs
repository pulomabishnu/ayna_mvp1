// Sets a research row's grade and .gov source once someone has opened and read that source
// (founder rule: clinical claims cite .gov health sites only). Keeps needMap.research.js and
// .json in step. Rows are listed here with what the source actually says.
// Usage: node scripts/verify-research-rows.mjs
import fs from 'node:fs';
const today = new Date().toISOString().slice(0, 10);
// Nov 5: class-level, MedlinePlus (Vaginal dryness): dryness causes pain with sex; over-the-counter vaginal
// moisturizers and water-soluble lubricants are a first treatment option. Primary only lifts a match when
// relevance allows it (moisturizers are strong for pain during sex only in the menopause transition).
const MEDLINE_DRYNESS = 'MedlinePlus (Vaginal dryness): dryness can cause pain during sex; over-the-counter vaginal moisturizers and water-soluble lubricants are a first treatment option. Class-level evidence, not a trial of this product.';
const VERIFIED = [
  { product: 'p-advil-ibuprofen-200', need: 'pain.cycle_headache', strength: 'primary', grade: 'B',
    rationale: 'NINDS lists over-the-counter pain relievers such as ibuprofen for less-severe migraine episodes and describes menstrual migraine.',
    source_url: 'https://www.ninds.nih.gov/health-information/disorders/migraine' },
  { product: 'p-aleve-naproxen-220', need: 'pain.cycle_headache', strength: 'secondary', grade: 'B',
    rationale: 'MedlinePlus: nonprescription naproxen relieves mild pain from headaches and menstrual periods. It does not name migraine.',
    source_url: 'https://medlineplus.gov/druginfo/meds/a681029.html' },
  { product: 'p-magnesium-glycinate', need: 'sleep.trouble', strength: 'secondary', grade: 'C',
    rationale: 'NCCIH: too little rigorous evidence to say magnesium helps insomnia; a 2021 review of 3 small trials (151 older adults) suggested faster sleep onset, low certainty.',
    source_url: 'https://www.nccih.nih.gov/health/in-the-news-magnesium-supplements-for-sleep-disorders' },
  { product: 'p-rugby-vitamin-b6-25', need: 'cycle.pms', strength: 'primary', grade: 'C',
    rationale: 'womenshealth.gov: vitamin B6 may help PMS symptoms including moodiness, irritability, bloating and anxiety; talk to your doctor before taking supplements.', source_url: 'https://womenshealth.gov/menstrual-cycle/premenstrual-syndrome' },
  { product: 'p-rugby-vitamin-b6-25', need: 'mood.cycle_related', strength: 'secondary', grade: 'C',
    rationale: 'womenshealth.gov: vitamin B6 may help PMS moodiness, irritability and anxiety.', source_url: 'https://womenshealth.gov/menstrual-cycle/premenstrual-syndrome' },
  { product: 'p-rugby-vitamin-b6-25', need: 'bloating.cycle_related', strength: 'primary', grade: 'C',
    rationale: 'womenshealth.gov: vitamin B6 may help PMS bloating.', source_url: 'https://womenshealth.gov/menstrual-cycle/premenstrual-syndrome' },
  { product: 'p-advil-ibuprofen-200', need: 'cycle.breast_tenderness', strength: 'secondary', grade: 'B',
    rationale: 'womenshealth.gov: ibuprofen, naproxen or aspirin may lessen PMS physical symptoms including breast tenderness.', source_url: 'https://womenshealth.gov/menstrual-cycle/premenstrual-syndrome' },
  { product: 'p-aleve-naproxen-220', need: 'cycle.breast_tenderness', strength: 'secondary', grade: 'B',
    rationale: 'womenshealth.gov: ibuprofen, naproxen or aspirin may lessen PMS physical symptoms including breast tenderness.', source_url: 'https://womenshealth.gov/menstrual-cycle/premenstrual-syndrome' },
  { product: 'd-headspace', need: 'mood.swings', strength: 'secondary', grade: 'C',
    rationale: 'womenshealth.gov: some women find meditation helpful for PMS; find healthy ways to cope with stress.', source_url: 'https://womenshealth.gov/menstrual-cycle/premenstrual-syndrome' },
  { product: 'd-calm', need: 'mood.swings', strength: 'secondary', grade: 'C',
    rationale: 'womenshealth.gov: some women find meditation helpful for PMS; find healthy ways to cope with stress.', source_url: 'https://womenshealth.gov/menstrual-cycle/premenstrual-syndrome' },

  { product: 'p-good-clean-love', need: 'pain.sexual', strength: 'primary', grade: 'B',
    rationale: MEDLINE_DRYNESS, source_url: 'https://medlineplus.gov/ency/article/000892.htm' },
  { product: 'p-kindra-lotion', need: 'pain.sexual', strength: 'primary', grade: 'B',
    rationale: MEDLINE_DRYNESS, source_url: 'https://medlineplus.gov/ency/article/000892.htm' },
  { product: 'p-neycher-vaginal-moisturizer', need: 'pain.sexual', strength: 'primary', grade: 'B',
    rationale: MEDLINE_DRYNESS, source_url: 'https://medlineplus.gov/ency/article/000892.htm' },
  { product: 'p-neycher-hydrobloom-gel', need: 'pain.sexual', strength: 'primary', grade: 'B',
    rationale: MEDLINE_DRYNESS, source_url: 'https://medlineplus.gov/ency/article/000892.htm' },
  { product: 'p-oboo-loob-daily', need: 'pain.sexual', strength: 'primary', grade: 'B',
    rationale: MEDLINE_DRYNESS, source_url: 'https://medlineplus.gov/ency/article/000892.htm' },
  { product: 'p-gina-vaginal-moisturizing-glides', need: 'pain.sexual', strength: 'primary', grade: 'B',
    rationale: MEDLINE_DRYNESS, source_url: 'https://medlineplus.gov/ency/article/000892.htm' },
  { product: 'p-gina-starter-kit', need: 'pain.sexual', strength: 'primary', grade: 'B',
    rationale: MEDLINE_DRYNESS, source_url: 'https://medlineplus.gov/ency/article/000892.htm' },
  { product: 'p-alubri-vaginal-moisturizing-gel', need: 'pain.sexual', strength: 'primary', grade: 'B',
    rationale: MEDLINE_DRYNESS, source_url: 'https://medlineplus.gov/ency/article/000892.htm' },
  { product: 'p-alubri-vaginal-wellness-kit', need: 'pain.sexual', strength: 'primary', grade: 'B',
    rationale: MEDLINE_DRYNESS, source_url: 'https://medlineplus.gov/ency/article/000892.htm' },

  // Nov 6: cooling comfort for hot flashes at any age. NIA lists cooling (a portable fan, layers,
  // a cooler room) for hot flashes; no trial of these products, and The Menopause Society calls the
  // evidence for cooling limited, so grade C.
  { product: 'p-oboo-cool-spray', need: 'vasomotor.hot_flashes', strength: 'primary', grade: 'C',
    rationale: 'NIA (Hot Flashes: What Can I Do?): cooling, like a portable fan when a hot flash strikes, can help. Comfort in the moment; no trial of this spray.', source_url: 'https://www.nia.nih.gov/health/menopause/hot-flashes-what-can-i-do' },
  { product: 'p-joylux-coldher', need: 'vasomotor.hot_flashes', strength: 'primary', grade: 'C',
    rationale: 'NIA (Hot Flashes: What Can I Do?): cooling measures can help with hot flashes. Comfort in the moment; no trial of these inserts.', source_url: 'https://www.nia.nih.gov/health/menopause/hot-flashes-what-can-i-do' },

  // Nov 6: options for irritability, mood swings and cycle-related mood (womenshealth.gov PMS page).
  { product: 'd-headspace', need: 'mood.swings', strength: 'primary', grade: 'C',
    rationale: 'womenshealth.gov (PMS): some women report relief from PMS symptoms, including irritability and mood swings, with yoga or meditation. No trial of this app for it.', source_url: 'https://womenshealth.gov/menstrual-cycle/premenstrual-syndrome' },
  { product: 'd-headspace', need: 'mood.irritability', strength: 'primary', grade: 'C',
    rationale: 'womenshealth.gov (PMS): some women report relief from PMS symptoms, including irritability and mood swings, with yoga or meditation. No trial of this app for it.', source_url: 'https://womenshealth.gov/menstrual-cycle/premenstrual-syndrome' },
  { product: 'd-headspace', need: 'mood.cycle_related', strength: 'primary', grade: 'C',
    rationale: 'womenshealth.gov (PMS): some women report relief from PMS symptoms, including irritability and mood swings, with yoga or meditation. No trial of this app for it.', source_url: 'https://womenshealth.gov/menstrual-cycle/premenstrual-syndrome' },
  { product: 'd-calm', need: 'mood.swings', strength: 'primary', grade: 'C',
    rationale: 'womenshealth.gov (PMS): some women report relief from PMS symptoms, including irritability and mood swings, with yoga or meditation. No trial of this app for it.', source_url: 'https://womenshealth.gov/menstrual-cycle/premenstrual-syndrome' },
  { product: 'd-calm', need: 'mood.irritability', strength: 'primary', grade: 'C',
    rationale: 'womenshealth.gov (PMS): some women report relief from PMS symptoms, including irritability and mood swings, with yoga or meditation. No trial of this app for it.', source_url: 'https://womenshealth.gov/menstrual-cycle/premenstrual-syndrome' },
  { product: 'd-calm', need: 'mood.cycle_related', strength: 'primary', grade: 'C',
    rationale: 'womenshealth.gov (PMS): some women report relief from PMS symptoms, including irritability and mood swings, with yoga or meditation. No trial of this app for it.', source_url: 'https://womenshealth.gov/menstrual-cycle/premenstrual-syndrome' },
  { product: 'p-rugby-vitamin-b6-25', need: 'mood.swings', strength: 'primary', grade: 'C',
    rationale: 'womenshealth.gov (PMS): vitamin B6 may help PMS symptoms including moodiness and irritability; talk to your doctor before taking supplements.', source_url: 'https://womenshealth.gov/menstrual-cycle/premenstrual-syndrome' },
  { product: 'p-rugby-vitamin-b6-25', need: 'mood.irritability', strength: 'primary', grade: 'C',
    rationale: 'womenshealth.gov (PMS): vitamin B6 may help PMS symptoms including moodiness and irritability; talk to your doctor before taking supplements.', source_url: 'https://womenshealth.gov/menstrual-cycle/premenstrual-syndrome' },
  { product: 'p-rugby-vitamin-b6-25', need: 'mood.cycle_related', strength: 'primary', grade: 'C',
    rationale: 'womenshealth.gov (PMS): vitamin B6 may help PMS symptoms including moodiness and irritability; talk to your doctor before taking supplements.', source_url: 'https://womenshealth.gov/menstrual-cycle/premenstrual-syndrome' },
  { product: 'd-clue', need: 'mood.cycle_related', strength: 'primary', grade: 'B',
    rationale: 'womenshealth.gov (PMS): write down your symptoms each day on a calendar or with an app, for a few months, and bring it to your doctor. Tracking shows whether mood changes follow your cycle; it does not treat them.', source_url: 'https://womenshealth.gov/menstrual-cycle/premenstrual-syndrome' },
  { product: 'd-stardust', need: 'mood.cycle_related', strength: 'primary', grade: 'B',
    rationale: 'womenshealth.gov (PMS): write down your symptoms each day on a calendar or with an app, for a few months, and bring it to your doctor. Tracking shows whether mood changes follow your cycle; it does not treat them.', source_url: 'https://womenshealth.gov/menstrual-cycle/premenstrual-syndrome' },
  { product: 'd-health-her-health-her-app', need: 'mood.cycle_related', strength: 'primary', grade: 'B',
    rationale: 'womenshealth.gov (PMS): write down your symptoms each day on a calendar or with an app, for a few months, and bring it to your doctor. Tracking shows whether mood changes follow your cycle; it does not treat them.', source_url: 'https://womenshealth.gov/menstrual-cycle/premenstrual-syndrome' },
  { product: 'd-lively-lively-period-tracker-cycle', need: 'mood.cycle_related', strength: 'primary', grade: 'B',
    rationale: 'womenshealth.gov (PMS): write down your symptoms each day on a calendar or with an app, for a few months, and bring it to your doctor. Tracking shows whether mood changes follow your cycle; it does not treat them.', source_url: 'https://womenshealth.gov/menstrual-cycle/premenstrual-syndrome' },
  { product: 'd-apple-health', need: 'mood.cycle_related', strength: 'primary', grade: 'B',
    rationale: 'womenshealth.gov (PMS): write down your symptoms each day on a calendar or with an app, for a few months, and bring it to your doctor. Tracking shows whether mood changes follow your cycle; it does not treat them.', source_url: 'https://womenshealth.gov/menstrual-cycle/premenstrual-syndrome' },
  { product: 'p-citracal-bone-health', need: 'cycle.pms', strength: 'primary', grade: 'B',
    rationale: 'womenshealth.gov (PMS): studies show calcium can help reduce some PMS symptoms, such as fatigue, cravings and depression. This is a calcium and vitamin D product sold for bone health.', source_url: 'https://womenshealth.gov/menstrual-cycle/premenstrual-syndrome' },
  { product: 'd-headspace', need: 'sleep.trouble', strength: 'primary', grade: 'C',
    rationale: 'NCCIH (Meditation and mindfulness): mindfulness meditation practices may help reduce insomnia and improve sleep quality. The sleep academy (AASM) makes no recommendation on mindfulness, so the grade stays C. No trial of this app.', source_url: 'https://www.nccih.nih.gov/health/meditation-and-mindfulness-effectiveness-and-safety' },
  { product: 'd-calm', need: 'sleep.trouble', strength: 'primary', grade: 'C',
    rationale: 'NCCIH (Meditation and mindfulness): mindfulness meditation practices may help reduce insomnia and improve sleep quality. The sleep academy (AASM) makes no recommendation on mindfulness, so the grade stays C. No trial of this app.', source_url: 'https://www.nccih.nih.gov/health/meditation-and-mindfulness-effectiveness-and-safety' },
];
for (const file of ['needMap.research.js', 'needMap.research.json']) {
  const url = new URL(`../src/data/matching/${file}`, import.meta.url);
  const raw = fs.readFileSync(url, 'utf8');
  const isJs = file.endsWith('.js');
  const rows = JSON.parse(isJs ? raw.replace(/^[\s\S]*?export default /, '').replace(/;\s*$/, '') : raw);
  for (const v of VERIFIED) {
    const i = rows.findIndex((r) => r.product === v.product && r.need === v.need);
    const row = { ...(i >= 0 ? rows[i] : {}), ...v, reviewer: 'research', reviewed: today, grade_status: 'verified' };
    delete row.prior_grade_unverified; delete row.prior_source_unverified;
    if (i >= 0) rows[i] = row; else rows.push(row);
  }
  fs.writeFileSync(url, isJs ? `// Generated by scripts/merge-research.mjs. Do not edit by hand.\nexport default ${JSON.stringify(rows, null, 1)};\n` : `${JSON.stringify(rows, null, 1)}\n`);
}
console.log(`verified ${VERIFIED.length} rows`);
