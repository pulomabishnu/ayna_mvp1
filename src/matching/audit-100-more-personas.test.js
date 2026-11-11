// 100 DISTINCT simulated quiz journeys against the bundled live-facing catalog
// and the actual v2 matcher, not mocked recommendations or real user records.
// 60 completed/mixed-depth profiles, 20 abandoned/partial, 20 connected-data.
// All assertions inspect actual selected needs, safety gates and product IDs.
import { describe, it, expect } from 'vitest';
import { ALL_PRODUCTS, getEcosystemSeedFromQuiz, withEverydayBasics } from '../data/products.js';
import { EMPTY, LIFE_STAGES, buildSnapshot } from '../mobile/data/intakeModel.js';
import { buildUserProfile } from './userProfile.js';
import { buildProductProfile } from './productProfile.js';
import { isRecommendable, isCycleTrackingProduct } from './eligibility.js';
import { evaluateSafety } from './score.js';
import { buildInsights } from '../health/insights.js';
import { healthMatchContext } from '../health/matchContext.js';

const BY_ID = new Map(ALL_PRODUCTS.map(p => [p.id, p]));
const NO_CYCLE = new Set(['I am pregnant', 'I am in menopause', 'I am post-menopause']);
const STAGE_MIXES = [
  ['I get periods regularly', 22, [
    ['Hot flashes', 'PMS symptoms', 'Anxiety'],
    ['Cramps or period pain', 'Heavy periods', 'Period product support'],
    ['Vaginal dryness', 'Pain or discomfort during sex'],
    ['Trouble sleeping', 'Low mood'],
    ['Cycle-related headaches or migraines', 'Breast tenderness'],
    ['Irregular periods', 'Finding a doctor or specialist']]],
  ['My periods are irregular', 27, [
    ['Irregular periods', 'PCOS support'],
    ['Missed periods', 'Ovulation tracking or support'],
    ['PMDD symptoms', 'Trouble sleeping'],
    ['Heavy periods', 'Vaginal odor'],
    ['Hair thinning or hair loss', 'Excess facial or body hair'],
    ['Spotting between periods', 'Finding a doctor or specialist']]],
  ['I do not currently get periods', 33, [
    ['Hot flashes', 'Night sweats'],
    ['Trouble sleeping', 'Anxiety'],
    ['Bladder leakage or incontinence', 'Vaginal dryness'],
    ['Bone health', 'Joint aches'],
    ['Finding a doctor or specialist', 'Low mood'],
    ['Hormone-related symptoms', 'Brain fog']]],
  ['I use hormonal birth control', 24, [
    ['Contraception', 'Cycle-related headaches or migraines'],
    ['Hot flashes', 'Anxiety'],
    ['Vaginal dryness', 'Low libido or libido changes'],
    ['Light periods', 'Period product support'],
    ['Mood swings', 'Brain fog'],
    ['Urinary urgency', 'Burning with urination']]],
  ['I am trying to conceive', 32, [
    ['Fertility support', 'Ovulation tracking or support'],
    ['Trying to conceive', 'Irregular periods'],
    ['Missed periods', 'Nausea'],
    ['PCOS support', 'Fertility support'],
    ['Anxiety', 'Trouble sleeping'],
    ['Prenatal or pregnancy support', 'Bone health']]],
  ['I am pregnant', 30, [
    ['Prenatal or pregnancy support', 'Pregnancy-related discomfort'],
    ['Nausea', 'Constipation'],
    ['Spotting between periods', 'Pelvic pain'],
    ['Trouble sleeping', 'Anxiety'],
    ['Pregnancy-safe product discovery', 'Vaginal itching or irritation'],
    ['Heavy periods', 'Period product support']]],
  ['I am postpartum', 29, [
    ['Postpartum recovery', 'Breastfeeding or lactation support'],
    ['Postpartum body or skin changes', 'Hair thinning or hair loss'],
    ['Vaginal dryness', 'Pain or discomfort during sex'],
    ['Bladder leakage or incontinence', 'Pelvic pain'],
    ['Low mood', 'Anxiety'],
    ['Fatigue or low energy', 'Trouble sleeping']]],
  ['I am in perimenopause', 46, [
    ['Hot flashes', 'Night sweats'],
    ['Irregular periods', 'Heavy periods'],
    ['Vaginal dryness', 'Low libido or libido changes'],
    ['Mood swings', 'Trouble sleeping'],
    ['Brain fog', 'Difficulty concentrating'],
    ['Menopause-related body changes', 'Bone health']]],
  ['I am in menopause', 53, [
    ['Hot flashes', 'Trouble sleeping'],
    ['Night sweats', 'Anxiety'],
    ['Bone health', 'Joint aches'],
    ['Vaginal dryness', 'Pain or discomfort during sex'],
    ['Menopause-related body changes', 'Brain fog'],
    ['Bladder leakage or incontinence', 'Urinary urgency']]],
  ['I am post-menopause', 68, [
    ['Vaginal dryness', 'Bone health'],
    ['Bladder leakage or incontinence', 'Urinary urgency'],
    ['Night sweats', 'Trouble sleeping'],
    ['Spotting between periods', 'Pelvic pain'],
    ['Joint aches', 'Strength or fitness'],
    ['Finding a doctor or specialist', 'Brain fog']]],
];

const base = () => ({ ...EMPTY, age:'27', allergyStatus:'No', takesCurrent:'No',
  diagnosisSelections:['None that I know of'], safetyConcern:'No' });
const extras = [
  { label:'minimum complete', values:{} },
  { label:'multiple needs, latex allergy', values:{allergyStatus:'Yes',allergyItems:['Latex'],preferredFormats:['Period-care products']} },
  { label:'no safety answers', values:{allergyStatus:'',takesCurrent:'',diagnosisSelections:[],safetyConcern:''} },
  { label:'on named medication', values:{takesCurrent:'Yes',currentMedicationItems:['Levothyroxine'],priceRange:['Under $25']} },
  { label:'prefers not to share', values:{allergyStatus:'Prefer not to say',takesCurrent:'Prefer not to say',diagnosisSelections:['Prefer not to say'],preferredFormats:['Devices or wearables']} },
  { label:'full preferences', values:{preferredFormats:['Devices or wearables'],avoidIngredients:['Fragrance'],priceRange:['Under $50'],trustRankingTouched:true,recommendedProductsPerArea:5} },
];

const COMPLETE = STAGE_MIXES.flatMap(([stage,age,needs],si) => needs.map((chosen,vi) => ({
  id:'C'+String(si*6+vi+1).padStart(3,'0'),
  kind:'completed', label:extras[vi].label, stage, needs:chosen,
  intake:{ ...base(), age:String(vi===5 ? [18,19,22,26,29,33,37,44,65,90][si] : age+vi),
    lifeStageSelections:[stage],supportSelections:chosen,...extras[vi].values,
    ...(stage==='I am pregnant'?{pregnancyTrimester:['First trimester','Second trimester','Third trimester'][vi%3]}:{}),
    ...(stage==='I am postpartum'?{postpartumTiming:['Less than 6 weeks','6 weeks to 3 months','3 to 6 months','6 to 12 months','More than 12 months'][vi%5],breastfeedingStatus:vi%2?'Yes':'No'}:{}),
    ...(stage==='I am in perimenopause'?{perimenopauseLastPeriod:'Within the past 12 months'}:{}),
    ...(stage==='I get periods regularly'?{periodFlow:vi%2?'Heavy':'Medium',vasomotorTimingSelections:vi===0?['Before my period / PMS','When stressed or anxious']:[]}:{})
  }
})));

const PARTIAL_SPECS = [
  ['blank fresh install',{}],
  ['first age only',{age:'18'}],
  ['first age teen',{age:'17'}],
  ['first age 90+', {age:'90'}],
  ['age and ZIP',{age:'26',zipcode:'10027'}],
  ['first stage only',{lifeStageSelections:['I get periods regularly']}],
  ['age and pregnancy only',{age:'24',lifeStageSelections:['I am pregnant']}],
  ['age and menopause only',{age:'70',lifeStageSelections:['I am in menopause']}],
  ['age and irregular only',{age:'35',lifeStageSelections:['My periods are irregular']}],
  ['support only, no age',{supportSelections:['Trouble sleeping']}],
  ['hot flash only, no stage',{age:'22',supportSelections:['Hot flashes']}],
  ['no stage, privacy',{age:'77',lifeStageSelections:['Prefer not to say'],supportSelections:['Hot flashes'],takesCurrent:'Prefer not to say'}],
  ['no stage, not sure',{lifeStageSelections:['None of these / not sure'],supportSelections:['Hair thinning or hair loss']}],
  ['stage and symptom, no safety',{age:'21',lifeStageSelections:['I get periods regularly'],supportSelections:['Heavy periods']}],
  ['pregnant and spotting, no safety',{age:'30',lifeStageSelections:['I am pregnant'],supportSelections:['Spotting between periods','Pelvic pain']}],
  ['postmenopause spotting, no safety',{age:'62',lifeStageSelections:['I am post-menopause'],supportSelections:['Spotting between periods']}],
  ['contradictory pregnancy and menopause',{age:'44',lifeStageSelections:['I am pregnant','I am post-menopause'],supportSelections:['Trouble sleeping']}],
  ['allergy no but mentions allergy in prose',{age:'25',lifeStageSelections:['I get periods regularly'],supportSelections:['Cramps or period pain'],allergyStatus:'No',anythingElse:'I am allergic to latex'}],
  ['nothing right now',{age:'43',lifeStageSelections:['My periods are irregular'],supportSelections:['Nothing right now']}],
  ['custom need + unsure meds',{age:'39',lifeStageSelections:['I get periods regularly'],supportSelections:['Finding a telehealth provider'],takesCurrent:"I'm not sure",anythingElse:'I need help finding a specialist'}],
];
const PARTIAL = PARTIAL_SPECS.map(([label,values],i)=>({
  id:'P'+String(i+1).padStart(3,'0'),kind:'partial',label,
  intake:{...EMPTY,...values,skippedSteps:i%2?['conditions','allergies','medications']:[],minimumComplete:false}
}));

const SOURCES = ['oura','apple_health','health_connect','garmin','manual_import'];
const MODES = ['shortened sleep over 35 days','normal sleep over 35 days','duplicate Oura measurements','too little data','no selected sleep need'];
function dailyRows(source,mode) {
  const today = Date.parse('2026-11-05T00:00:00Z'), day=86400000;
  if (mode==='too little data') return Array.from({length:3},(_,i)=>({
    day:new Date(today-i*day).toISOString().slice(0,10),metric:'sleep_minutes',value:350,source,origin:source
  }));
  return Array.from({length:35},(_,i)=>{
    const date=new Date(today-i*day).toISOString().slice(0,10);
    const changed=mode==='shortened sleep over 35 days'||mode==='duplicate Oura measurements';
    const value= changed && i<7 ? 330 : 480;
    const direct={day:date,metric:'sleep_minutes',value,source,origin:source};
    // Same measurement received both directly and from Apple Health: count ONCE.
    return mode==='duplicate Oura measurements'
      ? [direct,{...direct,source:'apple_health',origin:source}]
      : direct;
  }).flat();
}
const WEARABLE = Array.from({length:20},(_,i)=>{
  const si=i%4, mode=MODES[Math.floor(i/4)], source=SOURCES[i%5];
  const stage=['I get periods regularly','My periods are irregular','I am postpartum','I am in perimenopause'][si];
  const support=mode==='no selected sleep need'?['Cramps or period pain']:['Trouble sleeping',si%2?'Hot flashes':'Fatigue or low energy'];
  return { id:'W'+String(i+1).padStart(3,'0'), kind:'wearable',label:mode,
    stage,source,mode,
    intake:{...base(),age:String([20,36,31,48][si]),lifeStageSelections:[stage],
      supportSelections:support,preferredFormats:i%2?['Devices or wearables']:[],allergyStatus:i%3?'No':'',takesCurrent:i%4?'No':'',
    },
    rows:dailyRows(source,mode),
  };
});

const CASES=[...COMPLETE,...PARTIAL,...WEARABLE];
const signature = c => JSON.stringify([c.kind,c.label,c.intake,c.source||'',c.mode||'']);

function quizAndContext(c) {
  const original=c.intake;
  // Partial means an actual abandoned in-progress wizard: do not invent a
  // completed flag, safety answers, conditions or a stage.
  const intake=c.kind==='partial'?{...original}:{...original,personalizationCompleted:true};
  const quiz={fullHealthIntake:intake,personalizationCompleted:c.kind!=='partial'};
  if(c.kind!=='wearable')return {quiz,ctx:null,insights:null};
  const insights=buildInsights(c.rows,{today:'2026-11-05'});
  const selected=buildUserProfile(quiz).healthIntent.needs.map(n=>n.id);
  const ctx=healthMatchContext([...(insights.signals||[]),...(insights.timing||[])],selected);
  return {quiz,ctx,insights};
}

describe('100 additional distinct real-engine quiz simulations',()=>{
  it('coverage and uniqueness: 60 mixed-depth + 20 partial + 20 connected',()=>{
    expect(CASES).toHaveLength(100);
    expect(new Set(CASES.map(c=>c.id)).size).toBe(100);
    expect(new Set(CASES.map(signature)).size).toBe(100);
    expect(new Set(COMPLETE.map(c=>c.stage))).toEqual(new Set(LIFE_STAGES));
    expect(COMPLETE.map(c=>Number(c.intake.age))).toContain(18);
    expect(COMPLETE.map(c=>Number(c.intake.age))).toContain(90);
    expect(PARTIAL.some(c=>!c.intake.supportSelections?.length)).toBe(true);
    expect(WEARABLE.every(c=>c.rows.length>0)).toBe(true);
  });
  it.each(CASES)('$id $kind $label',c=>{
    const {quiz,ctx,insights}=quizAndContext(c);
    // "Nothing right now" with periods gets everyday period basics (founder, Nov 10); the rest is unchanged.
    const up=buildUserProfile(withEverydayBasics(quiz)||quiz,{healthContext:ctx||undefined});
    const out=getEcosystemSeedFromQuiz(quiz,null,{engine:'v2',...(ctx?{healthContext:ctx}:{})});
    const shelves=out.shelves;
    const picks=shelves.flatMap(sh=>sh.picks);
    const chosen=new Set(up.healthIntent.needs.map(n=>n.id));
    expect(shelves.map(sh=>sh.needId)).toEqual(expect.arrayContaining([...chosen]));
    expect(new Set(shelves.map(sh=>sh.needId)).size).toBe(shelves.length);
    // Wearables, age, diagnoses and unanswered onboarding never create a need.
    expect(new Set(shelves.map(sh=>sh.needId))).toEqual(chosen);
    if(!chosen.size)expect(picks).toHaveLength(0);
    const productSet=new Set();
    for(const sh of shelves){
      expect(sh.productIds).toEqual(sh.picks.map(p=>p.productId));
      expect(sh.picks.length).toBeLessThanOrEqual(5);
      for(const p of sh.picks){
        expect(BY_ID.has(p.productId),c.id+' stale catalog product').toBe(true);
        const real=BY_ID.get(p.productId),pp=buildProductProfile(real);
        expect(isRecommendable(real),c.id+' non-recommendable product '+p.productId).toBe(true);
        const safety=evaluateSafety(pp,up);
        expect(safety.eligible,c.id+' contraindicated '+p.productId).toBe(true);
        expect(safety.restricted,c.id+' safety hold '+p.productId).toBe(false);
        expect(p.v2,c.id+' missing v2 evidence '+p.productId).toBeDefined();
        expect(p.score,c.id+' non-qualifying '+p.productId).toBeGreaterThanOrEqual(50);
        if(c.intake.allergyItems?.includes('Latex'))expect(pp.safety?.latex,c.id+' latex '+p.productId).not.toBe('yes');
        if(c.intake.allergyItems?.includes('Fragrance'))expect(pp.safety?.fragrance,c.id+' fragrance '+p.productId).not.toBe('yes');
        if(c.intake.lifeStageSelections?.some(s=>NO_CYCLE.has(s)))
          expect(isCycleTrackingProduct(pp),c.id+' cycle tracker '+p.productId).toBe(false);
        if((c.intake.lifeStageSelections||[]).some(s=>['I am pregnant','I am trying to conceive'].includes(s))&&pp.ingested)
          expect(['unknown','avoid','contraindicated'],c.id+' pregnancy unknown '+p.productId).not.toContain(pp.pregnancy?.overall);
        if(c.intake.breastfeedingStatus==='Yes'&&pp.ingested)
          expect(['unknown','avoid','contraindicated'],c.id+' nursing unknown '+p.productId).not.toContain(pp.breastfeeding?.overall);
        productSet.add(p.productId);
      }
    }
    if(c.kind==='partial'){
      expect(up.minimumComplete).not.toBe(true);
      if(!c.intake.lifeStageSelections?.length)expect(up.physiology.lifeStages).toEqual([]);
      if(c.intake.age==='17')expect(picks).toHaveLength(0);
    }
    if(c.intake.supportSelections?.includes('Hot flashes')&&
      !(c.intake.lifeStageSelections||[]).some(s=>/perimenopause|menopause/i.test(s))){
      expect(up.contexts.menopause_transition,c.id+' symptom became menopause').toBeFalsy();
      expect(chosen.has('menopause.body_changes'),c.id+' symptom became menopause need').toBe(false);
    }
    if(c.kind==='wearable'){
      const without=buildUserProfile(quiz);
      expect(chosen).toEqual(new Set(without.healthIntent.needs.map(n=>n.id)));
      expect((insights?.signals||[]).every(s=>typeof s.needId==='string')).toBe(true);
      expect(Object.keys(ctx.byNeed).every(n=>chosen.has(n))).toBe(true);
      if(c.mode==='too little data'||c.mode==='normal sleep over 35 days')
        expect(ctx.byNeed['sleep.trouble']).toBeUndefined();
      if(c.mode==='shortened sleep over 35 days'||c.mode==='duplicate Oura measurements')
        expect(ctx.byNeed['sleep.trouble']?.kind).toBe('trend');
      if(c.mode==='no selected sleep need')expect(ctx.byNeed['sleep.trouble']).toBeUndefined();
      // No new or unsafe product can appear solely because a wearable is connected.
      const noData=getEcosystemSeedFromQuiz(quiz,null,{engine:'v2'});
      expect(new Set(noData.shelves.map(sh=>sh.needId))).toEqual(new Set(shelves.map(sh=>sh.needId)));
      expect(new Set(picks.map(p=>p.productId))).toEqual(new Set(noData.shelves.flatMap(sh=>sh.productIds)));
    }
    if(c.intake.lifeStageSelections?.includes('I am pregnant')&&chosen.has('cycle.spotting')){
      expect(shelves.find(s=>s.needId==='cycle.spotting')?.productIds).toEqual([]);
    }
    if(c.intake.lifeStageSelections?.includes('I am post-menopause')&&chosen.has('cycle.spotting')){
      expect(shelves.find(s=>s.needId==='cycle.spotting')?.productIds).toEqual([]);
    }
    console.log('AYNA_EXTRA_100 '+JSON.stringify({
      id:c.id,kind:c.kind,label:c.label,age:c.intake.age||null,
      stage:c.intake.lifeStageSelections||[],needs:c.intake.supportSelections||[],
      completeness:up.completeness,minimumComplete:up.minimumComplete,
      source:c.source||null,signals:insights?.signals?.map(s=>s.needId)||[],
      backed:Object.keys(ctx?.byNeed||{}),shelves:shelves.map(sh=>({
        need:sh.needId,empty:sh.emptyReason||null,care:sh.careFirst,
        picks:sh.picks.map(p=>({id:p.productId,percent:p.score,band:p.v2?.band}))
      })),
    }));
  });
});
