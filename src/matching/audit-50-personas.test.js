// 50 synthetic intake profiles against the real catalog and v2 engine.
// Audit-only. No personal user data. See console output AYNA_PROFILE_AUDIT for ranked picks.
import { describe, it, expect } from 'vitest';
import { getEcosystemSeedFromQuiz, ALL_PRODUCTS } from '../data/products.js';
import { buildProductProfile } from './productProfile.js';
import { isCycleTrackingProduct, isRecommendable } from './eligibility.js';

const CASES = [
  {
    "id": "01-period-cramps",
    "stage": "I get periods regularly",
    "needs": [
      "Cramps or period pain"
    ],
    "extra": {
      "age": 22,
      "periodPain": "Severe",
      "takesCurrent": "No"
    },
    "watch": ""
  },
  {
    "id": "02-heavy-flow",
    "stage": "I get periods regularly",
    "needs": [
      "Heavy periods",
      "Period product support"
    ],
    "extra": {
      "age": 29,
      "periodFlow": "Very heavy",
      "takesCurrent": "No"
    },
    "watch": "heavy-bleeding-care"
  },
  {
    "id": "03-light-flow",
    "stage": "I get periods regularly",
    "needs": [
      "Light periods",
      "Period product support"
    ],
    "extra": {
      "age": 20,
      "periodFlow": "Light",
      "preferredFormats": [
        "Period-care products"
      ]
    },
    "watch": ""
  },
  {
    "id": "04-period-leaks-latex",
    "stage": "I get periods regularly",
    "needs": [
      "Heavy periods",
      "Period product support"
    ],
    "extra": {
      "age": 31,
      "periodFlow": "Heavy",
      "allergyStatus": "Yes",
      "allergyItems": [
        "Latex"
      ]
    },
    "watch": ""
  },
  {
    "id": "05-irregular-cycle",
    "stage": "My periods are irregular",
    "needs": [
      "Irregular periods",
      "Ovulation tracking or support"
    ],
    "extra": {
      "age": 27
    },
    "watch": ""
  },
  {
    "id": "06-missed-period",
    "stage": "My periods are irregular",
    "needs": [
      "Missed periods"
    ],
    "extra": {
      "age": 28
    },
    "watch": "pregnancy-rule-out"
  },
  {
    "id": "07-spotting",
    "stage": "I get periods regularly",
    "needs": [
      "Spotting between periods"
    ],
    "extra": {
      "age": 35
    },
    "watch": "abnormal-bleeding-care"
  },
  {
    "id": "08-pms-mood",
    "stage": "I get periods regularly",
    "needs": [
      "PMS symptoms",
      "Cycle-related mood changes"
    ],
    "extra": {
      "age": 25
    },
    "watch": ""
  },
  {
    "id": "09-pmdd",
    "stage": "I get periods regularly",
    "needs": [
      "PMDD symptoms",
      "Low mood"
    ],
    "extra": {
      "age": 23
    },
    "watch": "mental-health-escalation"
  },
  {
    "id": "10-migraine-aura",
    "stage": "I use hormonal birth control",
    "needs": [
      "Cycle-related headaches or migraines",
      "Contraception"
    ],
    "extra": {
      "age": 34,
      "diagnosisSelections": [
        "Migraine with aura"
      ],
      "takesCurrent": "Yes",
      "currentMedicationItems": [
        "Yaz"
      ]
    },
    "watch": "migraine-aura-contraception"
  },
  {
    "id": "11-pcos-acne",
    "stage": "My periods are irregular",
    "needs": [
      "PCOS support",
      "Hair thinning or hair loss"
    ],
    "extra": {
      "age": 26,
      "diagnosisSelections": [
        "PCOS"
      ],
      "takesCurrent": "Yes",
      "currentMedicationItems": [
        "Metformin"
      ]
    },
    "watch": ""
  },
  {
    "id": "12-endometriosis",
    "stage": "I get periods regularly",
    "needs": [
      "Endometriosis support",
      "Pelvic pain"
    ],
    "extra": {
      "age": 32,
      "diagnosisSelections": [
        "Endometriosis"
      ],
      "periodPain": "Very severe"
    },
    "watch": "pelvic-pain-care"
  },
  {
    "id": "13-fibroids-anemia",
    "stage": "I get periods regularly",
    "needs": [
      "Fibroid-related concerns",
      "Heavy periods"
    ],
    "extra": {
      "age": 41,
      "diagnosisSelections": [
        "Fibroids",
        "Anemia or iron deficiency"
      ]
    },
    "watch": "heavy-bleeding-care"
  },
  {
    "id": "14-adenomyosis",
    "stage": "My periods are irregular",
    "needs": [
      "Adenomyosis-related concerns",
      "Pelvic pain"
    ],
    "extra": {
      "age": 37,
      "diagnosisSelections": [
        "Adenomyosis"
      ]
    },
    "watch": ""
  },
  {
    "id": "15-ttc-cycle",
    "stage": "I am trying to conceive",
    "needs": [
      "Trying to conceive",
      "Ovulation tracking or support"
    ],
    "extra": {
      "age": 28,
      "ttcDuration": "Less than 6 months",
      "takesCurrent": "No"
    },
    "watch": ""
  },
  {
    "id": "16-ttc-infertility",
    "stage": "I am trying to conceive",
    "needs": [
      "Fertility support",
      "Trying to conceive"
    ],
    "extra": {
      "age": 39,
      "ttcDuration": "More than 12 months",
      "diagnosisSelections": [
        "Infertility"
      ]
    },
    "watch": "fertility-care"
  },
  {
    "id": "17-ttc-medications",
    "stage": "I am trying to conceive",
    "needs": [
      "Fertility support",
      "Hair thinning or hair loss"
    ],
    "extra": {
      "age": 34,
      "takesCurrent": "Yes",
      "currentMedicationItems": [
        "Spironolactone"
      ]
    },
    "watch": "medication-ttc"
  },
  {
    "id": "18-ttc-supplement-allergy",
    "stage": "I am trying to conceive",
    "needs": [
      "Prenatal or pregnancy support"
    ],
    "extra": {
      "age": 33,
      "allergyStatus": "Yes",
      "allergyItems": [
        "Supplements or herbal ingredients"
      ]
    },
    "watch": ""
  },
  {
    "id": "19-pregnant-first",
    "stage": "I am pregnant",
    "needs": [
      "Prenatal or pregnancy support",
      "Nausea"
    ],
    "extra": {
      "age": 29,
      "pregnancyTrimester": "First trimester",
      "takesCurrent": "No"
    },
    "watch": "pregnancy-ingestibles"
  },
  {
    "id": "20-pregnant-second",
    "stage": "I am pregnant",
    "needs": [
      "Pregnancy-related discomfort",
      "Constipation"
    ],
    "extra": {
      "age": 32,
      "pregnancyTrimester": "Second trimester"
    },
    "watch": "pregnancy-ingestibles"
  },
  {
    "id": "21-pregnant-third",
    "stage": "I am pregnant",
    "needs": [
      "Pregnancy-safe product discovery",
      "Trouble sleeping"
    ],
    "extra": {
      "age": 37,
      "pregnancyTrimester": "Third trimester"
    },
    "watch": "pregnancy-ingestibles"
  },
  {
    "id": "22-pregnant-med-unknown",
    "stage": "I am pregnant",
    "needs": [
      "Pregnancy-related discomfort",
      "Nausea"
    ],
    "extra": {
      "age": 26,
      "pregnancyTrimester": "Not sure",
      "takesCurrent": "I'm not sure"
    },
    "watch": "unknown-medicine-holds"
  },
  {
    "id": "23-pregnant-bleeding",
    "stage": "I am pregnant",
    "needs": [
      "Spotting between periods",
      "Pelvic pain"
    ],
    "extra": {
      "age": 30,
      "pregnancyTrimester": "First trimester"
    },
    "watch": "urgent-pregnancy-bleeding"
  },
  {
    "id": "24-postpartum-new",
    "stage": "I am postpartum",
    "needs": [
      "Postpartum recovery",
      "Pelvic pain"
    ],
    "extra": {
      "age": 29,
      "postpartumTiming": "Less than 6 weeks ago",
      "breastfeedingStatus": "Yes"
    },
    "watch": "postpartum-care"
  },
  {
    "id": "25-postpartum-breastfeeding",
    "stage": "I am postpartum",
    "needs": [
      "Breastfeeding or lactation support",
      "Postpartum body or skin changes"
    ],
    "extra": {
      "age": 31,
      "postpartumTiming": "3–6 months ago",
      "breastfeedingStatus": "Yes"
    },
    "watch": "lactation-ingestibles"
  },
  {
    "id": "26-postpartum-not-feeding",
    "stage": "I am postpartum",
    "needs": [
      "Postpartum recovery",
      "Trouble sleeping"
    ],
    "extra": {
      "age": 34,
      "postpartumTiming": "6–12 months ago",
      "breastfeedingStatus": "No"
    },
    "watch": ""
  },
  {
    "id": "27-postpartum-medication",
    "stage": "I am postpartum",
    "needs": [
      "Low mood",
      "Breastfeeding or lactation support"
    ],
    "extra": {
      "age": 36,
      "postpartumTiming": "6 weeks–3 months ago",
      "breastfeedingStatus": "Yes",
      "takesCurrent": "Yes",
      "currentMedicationItems": [
        "Sertraline"
      ]
    },
    "watch": "postpartum-mood"
  },
  {
    "id": "28-peri-regular",
    "stage": "I am in perimenopause",
    "needs": [
      "Hot flashes",
      "Trouble sleeping"
    ],
    "extra": {
      "age": 43,
      "perimenopauseLastPeriod": "Still regular"
    },
    "watch": ""
  },
  {
    "id": "29-peri-irregular",
    "stage": "I am in perimenopause",
    "needs": [
      "Night sweats",
      "Brain fog"
    ],
    "extra": {
      "age": 48,
      "perimenopauseLastPeriod": "Irregular or skipping"
    },
    "watch": ""
  },
  {
    "id": "30-peri-heavy",
    "stage": "I am in perimenopause",
    "needs": [
      "Heavy periods",
      "Hot flashes"
    ],
    "extra": {
      "age": 46,
      "perimenopauseLastPeriod": "Irregular or skipping",
      "periodFlow": "Very heavy"
    },
    "watch": "heavy-bleeding-care"
  },
  {
    "id": "31-peri-no-cycle",
    "stage": "I am in perimenopause",
    "needs": [
      "Hot flashes",
      "Cycle-related bloating"
    ],
    "extra": {
      "age": 50,
      "perimenopauseLastPeriod": "None for over 12 months"
    },
    "watch": "cycle-contradiction"
  },
  {
    "id": "32-menopause-dryness",
    "stage": "I am in menopause",
    "needs": [
      "Vaginal dryness",
      "Pain or discomfort during sex"
    ],
    "extra": {
      "age": 52,
      "avoidIngredients": [
        "Fragrance"
      ]
    },
    "watch": ""
  },
  {
    "id": "33-menopause-sleep",
    "stage": "I am in menopause",
    "needs": [
      "Night sweats",
      "Trouble sleeping"
    ],
    "extra": {
      "age": 54,
      "priceRange": [
        "Under $25"
      ]
    },
    "watch": ""
  },
  {
    "id": "34-postmenopause-bone",
    "stage": "I am post-menopause",
    "needs": [
      "Bone health",
      "Joint aches"
    ],
    "extra": {
      "age": 65,
      "takesCurrent": "Yes",
      "currentMedicationItems": [
        "Alendronate"
      ]
    },
    "watch": ""
  },
  {
    "id": "35-postmenopause-bleeding",
    "stage": "I am post-menopause",
    "needs": [
      "Spotting between periods"
    ],
    "extra": {
      "age": 63
    },
    "watch": "urgent-postmenopausal-bleeding"
  },
  {
    "id": "36-postmenopause-no-cycle",
    "stage": "I am post-menopause",
    "needs": [
      "Ovulation tracking or support",
      "Irregular periods"
    ],
    "extra": {
      "age": 61
    },
    "watch": "must-not-show-trackers"
  },
  {
    "id": "37-vaginal-bv",
    "stage": "I get periods regularly",
    "needs": [
      "BV concerns",
      "Vaginal odor"
    ],
    "extra": {
      "age": 26
    },
    "watch": "diagnosis-not-assumed"
  },
  {
    "id": "38-vaginal-yeast",
    "stage": "I get periods regularly",
    "needs": [
      "Yeast infection concerns",
      "Vaginal itching or irritation"
    ],
    "extra": {
      "age": 33
    },
    "watch": "diagnosis-not-assumed"
  },
  {
    "id": "39-vaginal-discharge",
    "stage": "I get periods regularly",
    "needs": [
      "Unusual vaginal discharge"
    ],
    "extra": {
      "age": 23
    },
    "watch": "sti-and-infection-care"
  },
  {
    "id": "40-vaginal-fragrance",
    "stage": "I get periods regularly",
    "needs": [
      "Vaginal itching or irritation",
      "Vaginal dryness"
    ],
    "extra": {
      "age": 30,
      "allergyStatus": "Yes",
      "allergyItems": [
        "Fragrance"
      ],
      "avoidIngredients": [
        "Fragrance"
      ]
    },
    "watch": ""
  },
  {
    "id": "41-uti-now",
    "stage": "I get periods regularly",
    "needs": [
      "Burning with urination",
      "Frequent urination"
    ],
    "extra": {
      "age": 24,
      "utiFrequency": "I am experiencing them right now"
    },
    "watch": "active-uti-care"
  },
  {
    "id": "42-uti-recurrent",
    "stage": "I get periods regularly",
    "needs": [
      "Recurrent UTI-like symptoms",
      "Urinary urgency"
    ],
    "extra": {
      "age": 41,
      "utiFrequency": "More than once a month"
    },
    "watch": "recurrent-uti-care"
  },
  {
    "id": "43-incontinence-postpartum",
    "stage": "I am postpartum",
    "needs": [
      "Bladder leakage or incontinence"
    ],
    "extra": {
      "age": 35,
      "postpartumTiming": "More than 12 months ago",
      "breastfeedingStatus": "No"
    },
    "watch": ""
  },
  {
    "id": "44-urinary-menopause",
    "stage": "I am post-menopause",
    "needs": [
      "Frequent urination",
      "Vaginal dryness"
    ],
    "extra": {
      "age": 68
    },
    "watch": "urinary-care"
  },
  {
    "id": "45-sti-concern",
    "stage": "I use hormonal birth control",
    "needs": [
      "STI-related concerns",
      "Sexual wellness or comfort"
    ],
    "extra": {
      "age": 21
    },
    "watch": "testing-vs-products"
  },
  {
    "id": "46-contraception",
    "stage": "I get periods regularly",
    "needs": [
      "Contraception"
    ],
    "extra": {
      "age": 19,
      "allergyStatus": "Yes",
      "allergyItems": [
        "Latex"
      ]
    },
    "watch": "contraception-and-latex"
  },
  {
    "id": "47-anxiety-ssri",
    "stage": "I get periods regularly",
    "needs": [
      "Anxiety",
      "Trouble sleeping"
    ],
    "extra": {
      "age": 27,
      "takesCurrent": "Yes",
      "currentMedicationItems": [
        "Sertraline"
      ]
    },
    "watch": "interaction-review"
  },
  {
    "id": "48-digestive-ibs",
    "stage": "My periods are irregular",
    "needs": [
      "Digestive bloating",
      "Diarrhea",
      "Constipation"
    ],
    "extra": {
      "age": 28,
      "diagnosisSelections": [
        "IBS or another digestive condition"
      ],
      "priceRange": [
        "Under $25"
      ]
    },
    "watch": ""
  },
  {
    "id": "49-unknown-stage",
    "stage": "None of these / not sure",
    "needs": [
      "Fatigue or low energy",
      "Hair thinning or hair loss"
    ],
    "extra": {
      "age": 18,
      "takesCurrent": "I'm not sure",
      "allergyStatus": "I'm not sure"
    },
    "watch": "no-inferred-stage"
  },
  {
    "id": "50-privacy-limited",
    "stage": "Prefer not to say",
    "needs": [
      "Finding a telehealth provider",
      "Low libido or libido changes"
    ],
    "extra": {
      "age": 75,
      "allergyStatus": "Prefer not to say",
      "takesCurrent": "Prefer not to say",
      "preferredFormats": [
        "Devices or wearables"
      ]
    },
    "watch": "low-input-confidence"
  }
];
const byId = new Map(ALL_PRODUCTS.map(p => [p.id,p]));
const noCycle = new Set(['I am pregnant','I am in menopause','I am post-menopause']);

const run = (p) => getEcosystemSeedFromQuiz({
  personalizationCompleted: true,
  fullHealthIntake: {
    personalizationCompleted: true,
    lifeStageSelections: [p.stage],
    supportSelections: p.needs,
    age: p.extra.age,
    ...p.extra,
  },
}, null, {engine:'v2'});

describe('independent 50-persona matching stress test',()=>{
  it.each(CASES)('$id', (p)=>{
    const ecosystem = run(p);
    expect(Array.isArray(ecosystem.shelves)).toBe(true);
    const picks = ecosystem.shelves.flatMap(s => s.picks || []);
    const products = [...new Set(picks.map(pick=>pick.productId))];
    const brandCounts = new Map();
    for (const id of products) {
      expect(byId.has(id), 'stale product id '+id).toBe(true);
      const product = byId.get(id);
      expect(isRecommendable(product), 'not recommendable '+id).toBe(true);
      const pp = buildProductProfile(product);
      if(pp.brand?.key) brandCounts.set(pp.brand.key,(brandCounts.get(pp.brand.key)||0)+1);
      if(noCycle.has(p.stage)){
        expect(isCycleTrackingProduct(pp), 'cycle tracker for '+p.stage+': '+id).toBe(false);
      }
      if((p.stage === 'I am pregnant' || p.stage === 'I am trying to conceive') && pp.ingested) {
        expect(['unknown','avoid','contraindicated'].includes(pp.pregnancy?.overall),
          'ingested pregnancy uncertainty for '+id).toBe(false);
      }
      if(p.extra.breastfeedingStatus === 'Yes' && pp.ingested) {
        expect(['unknown','avoid','contraindicated'].includes(pp.breastfeeding?.overall),
          'ingested lactation uncertainty for '+id).toBe(false);
      }
      if(p.extra.allergyItems?.includes('Latex')) expect(pp.safety?.latex,'latex present '+id).not.toBe('yes');
      if(p.extra.allergyItems?.includes('Fragrance')) expect(pp.safety?.fragrance,'fragrance present '+id).not.toBe('yes');
    }
    for(const [brand,count] of brandCounts) {
      expect(count, 'more than 2 products for brand '+brand).toBeLessThanOrEqual(2);
    }
    for(const pick of picks) {
      expect(pick.v2, 'no v2 data for '+pick.productId).toBeDefined();
      expect(pick.score, 'shown match below 50% '+pick.productId).toBeGreaterThanOrEqual(50);
    }
    // Emit what a human reviewer needs: unfilled needs and every top recommendation.
    // No clinical adequacy is inferred from these mechanical gates passing.
    const summary = {
      id:p.id, stage:p.stage, age:p.extra.age, needs:p.needs, watch:p.watch,
      empty:ecosystem.shelves.filter(s=>(s.productIds||[]).length===0).map(s=>s.needId||s.title||s.label),
      shelves:ecosystem.shelves.map(s=>({
        need:s.needId||s.title||s.label,
        recommendations:(s.picks||[]).map(x=>({
          id:x.productId,name:byId.get(x.productId)?.name,
          percent:Number.isFinite(x.score)?x.score:null,
          band:x.v2?.band,
        }))
      })),
    };
    console.log('AYNA_PROFILE_AUDIT '+JSON.stringify(summary));
  });
});
