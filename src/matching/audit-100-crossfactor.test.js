// Cross-factor matching audit. Real bundled product catalog, real v2 engine.
// 100 NEW distinct adversarial permutations, complementary to the previous 150
// synthetic personas. The test is deterministic and uses no user data.
import { describe, it, expect } from 'vitest';
import { ALL_PRODUCTS, getEcosystemSeedFromQuiz } from '../data/products.js';
import { EMPTY } from '../mobile/data/intakeModel.js';
import { buildUserProfile } from './userProfile.js';
import { buildProductProfile } from './productProfile.js';
import { evaluateSafety } from './score.js';
import { isRecommendable, isCycleTrackingProduct } from './eligibility.js';

const STAGES=[
  'I get periods regularly',
  'My periods are irregular',
  'I do not currently get periods',
  'I use hormonal birth control',
  'I am trying to conceive',
  'I am pregnant',
  'I am postpartum',
  'I am in perimenopause',
  'I am in menopause',
  'I am post-menopause',
];
const AGES=[18,22,29,33,40,46,53,67,78,89];
const NEEDS=[
  ['Hot flashes','Anxiety'],
  ['Cramps or period pain','Heavy periods'],
  ['Vaginal dryness','Urinary urgency'],
  ['Trouble sleeping','Fatigue or low energy'],
  ['Pregnancy-safe product discovery','Nausea'],
  ['PCOS support','Hair thinning or hair loss'],
  ['Finding a doctor or specialist','Pelvic pain'],
  ['Menopause-related body changes','Bone health'],
  ['Breastfeeding or lactation support','Vaginal dryness'],
  ['Spotting between periods','Pelvic pain'],
];
const MODES=[
  {name:'abandon after age',onlyAge:true},
  {name:'abandon after stage',onlyStage:true},
  {name:'skip every safety answer',extra:{}},
  {name:'answers all screening questions',extra:{allergyStatus:'No',takesCurrent:'No',diagnosisSelections:['None that I know of'],safetyConcern:'No'}},
  {name:'takes sertraline',extra:{takesCurrent:'Yes',currentMedicationItems:['Sertraline']}},
  {name:'takes levothyroxine',extra:{takesCurrent:'Yes',currentMedicationItems:['Levothyroxine']}},
  {name:'allergic to latex',extra:{allergyStatus:'Yes',allergyItems:['Latex']}},
  {name:'avoids fragrance',extra:{allergyStatus:'Yes',allergyItems:['Fragrance'],avoidIngredients:['Fragrance']}},
  {name:'answers unsure or prefer not',extra:{allergyStatus:'Prefer not to say',takesCurrent:"I'm not sure",diagnosisSelections:['Not sure']}},
  {name:'conflicting allergy in free text',extra:{allergyStatus:'No',anythingElse:'I am allergic to latex',skippedSteps:['medications']}},
];
const byId=new Map(ALL_PRODUCTS.map(p=>[p.id,p]));
const NO_CYCLE=new Set(['I am pregnant','I am in menopause','I am post-menopause']);
const cases=STAGES.flatMap((stage,si)=>MODES.map((mode,mi)=>{
  const intake={...EMPTY,age:String(AGES[mi]),skippedSteps:mi%2?['safety']:[],...mode.extra};
  if(!mode.onlyAge)intake.lifeStageSelections=[stage];
  if(!mode.onlyAge&&!mode.onlyStage)intake.supportSelections=[...NEEDS[si]];
  if(stage==='I am pregnant'&&mi>=2)intake.pregnancyTrimester=['First trimester','Second trimester','Third trimester'][mi%3];
  if(stage==='I am postpartum'&&mi>=2)intake.breastfeedingStatus=mi%2?'Yes':'No';
  if(stage==='I get periods regularly'&&mi>=2)intake.vasomotorTimingSelections=['Before my period / PMS','When stressed or anxious'];
  return {id:'X'+String(si*10+mi+1).padStart(3,'0'),stage,age:AGES[mi],mode:mode.name,intake,partial:mi<=2};
}));
function execute(c, extra={},opts={}){
  const snapshot={...c.intake,...extra};
  const quiz={personalizationCompleted:!c.partial,fullHealthIntake:snapshot};
  const up=buildUserProfile(quiz,{catalog:ALL_PRODUCTS});
  const result=getEcosystemSeedFromQuiz(quiz,null,{engine:'v2',...opts});
  return {up,result,quiz};
}

describe('100 additional crossed age x stage x disclosure x symptom matching tests',()=>{
  it('generates exactly 100 distinct real journeys across 18-89, 10 stages and 10 disclosure states',()=>{
    expect(cases).toHaveLength(100);
    expect(new Set(cases.map(p=>JSON.stringify(p.intake))).size).toBe(100);
    expect(new Set(cases.map(c=>c.id)).size).toBe(100);
    expect(cases.every(c=>Number(c.age)>=18)).toBe(true);
    expect(new Set(cases.map(c=>c.stage))).toEqual(new Set(STAGES));
  });
  it.each(cases)('$id / $stage / $mode',c=>{
    const {up,result}=execute(c);
    const needs=new Set(up.healthIntent.needs.map(n=>n.id));
    const shelves=result.shelves;
    expect(new Set(shelves.map(s=>s.needId))).toEqual(needs);
    if(c.mode==='abandon after age')expect(up.physiology.lifeStages).toEqual([]);
    if(c.mode==='abandon after age'||c.mode==='abandon after stage')expect(shelves).toHaveLength(0);
    for(const shelf of shelves){
      expect(shelf.picks.length).toBeLessThanOrEqual(5);
      expect(shelf.productIds).toEqual(shelf.picks.map(p=>p.productId));
      for(const pick of shelf.picks){
        const product=byId.get(pick.productId);
        expect(product,c.id+' missing '+pick.productId).toBeTruthy();
        expect(isRecommendable(product)).toBe(true);
        const pp=buildProductProfile(product);
        const safety=evaluateSafety(pp,up);
        expect(safety.eligible,c.id+' unsafe '+pick.productId).toBe(true);
        expect(safety.restricted,c.id+' held '+pick.productId).toBe(false);
        expect(pick.score,c.id+' under bar '+pick.productId).toBeGreaterThanOrEqual(50);
        if(c.intake.allergyItems?.includes('Latex'))expect(pp.safety?.latex).not.toBe('yes');
        if(c.intake.allergyItems?.includes('Fragrance'))expect(pp.safety?.fragrance).not.toBe('yes');
        if(c.intake.lifeStageSelections?.some(x=>NO_CYCLE.has(x)))
          expect(isCycleTrackingProduct(pp),c.id+' cycle tracker outside stage').toBe(false);
        if(c.intake.lifeStageSelections?.includes('I am pregnant')&&pp.ingested)
          expect(['unknown','avoid','contraindicated']).not.toContain(pp.pregnancy?.overall);
        if(c.intake.breastfeedingStatus==='Yes'&&pp.ingested)
          expect(['unknown','avoid','contraindicated']).not.toContain(pp.breastfeeding?.overall);
      }
    }
    if(c.intake.supportSelections?.includes('Hot flashes') &&
      !c.intake.lifeStageSelections?.some(x=>/perimenopause|menopause/i.test(x))) {
      expect(needs.has('menopause.body_changes')).toBe(false);
    }
    if(c.stage==='I am pregnant' && needs.has('cycle.spotting'))
      expect(shelves.find(s=>s.needId==='cycle.spotting').picks).toEqual([]);
    if(c.stage==='I am post-menopause' && needs.has('cycle.spotting'))
      expect(shelves.find(s=>s.needId==='cycle.spotting').picks).toEqual([]);
    console.log('AYNA_CROSS_100 '+JSON.stringify({id:c.id,stage:c.stage,age:c.age,mode:c.mode,needs:[...needs],shelves:shelves.map(s=>({id:s.needId,empty:s.emptyReason||null,picks:s.picks.map(p=>({id:p.productId,score:p.score}))}))}));
  });
  it('in 30 counterfactuals, budget cannot change a retained product\'s health relevance',()=>{
    for(const c of cases.filter((c,i)=>i%3===0)){
      const base=execute(c);
      const changed=execute(c,{priceRange:['Under $25'],preferredFormats:['Devices or wearables']});
      const original=new Map(base.result.shelves.flatMap(s=>s.picks.map(p=>[s.needId+'|'+p.productId,p.v2?.health])));
      for(const shelf of changed.result.shelves)for(const p of shelf.picks){
        const key=shelf.needId+'|'+p.productId;
        if(original.has(key))expect(p.v2?.health,c.id+' '+key).toBe(original.get(key));
      }
    }
  });
});
