import { describe, it, expect } from 'vitest';
import { ALL_PRODUCTS, getEcosystemSeedFromQuiz } from '../data/products.js';
import { EMPTY } from '../mobile/data/intakeModel.js';
import { buildUserProfile } from './userProfile.js';
import { buildProductProfile } from './productProfile.js';
import { scoreProductForNeed, evaluateSafety } from './score.js';
import { isRecommendable } from './eligibility.js';
import { qualificationForEcosystem } from './ecosystem.js';

const cases=[
  { age:'22', stages:['I get periods regularly'], needs:['Mood swings','Irritability','Anxiety','Low mood','Trouble sleeping','Hot flashes','PMS symptoms'], extra:{vasomotorTimingSelections:['Before my period / PMS','When stressed or anxious']} },
  { age:'22', stages:['I get periods regularly'], needs:['Mood swings','Irritability','Anxiety','Low mood','Trouble sleeping','Hot flashes','PMS symptoms'], extra:{allergyStatus:'No',takesCurrent:'No',diagnosisSelections:['None that I know of']} },
  { age:'22', stages:['I get periods regularly'], needs:['Trouble sleeping','Low mood','Anxiety'], extra:{preferredFormats:['Devices or wearables'], priceRange:['Under $50']} },
];
const focus=new Set(['mood.swings','mood.irritability','mood.general_anxiety','mood.low','sleep.trouble','vasomotor.hot_flashes']);
describe('wellbeing catalog matching diagnosis audit',()=>{
  it('prints real-v2 wellbeing shelf and physically available candidate evidence without bypassing safety',()=>{
    expect(ALL_PRODUCTS.length).toBeGreaterThan(100);
    for(let i=0;i<cases.length;i++){
      const x=cases[i],intake={...EMPTY,age:x.age,lifeStageSelections:x.stages,supportSelections:x.needs,...x.extra};
      const quiz={fullHealthIntake:intake};
      const up=buildUserProfile(quiz);
      const out=getEcosystemSeedFromQuiz(quiz,null,{engine:'v2'});
      console.log('WELLBEING_DIAG_PROFILE '+JSON.stringify({case:i,products:ALL_PRODUCTS.length,selectedNeeds:up.healthIntent.needs.map(n=>n.id),shelves:out.shelves.filter(s=>focus.has(s.needId)).map(s=>({need:s.needId,picks:s.picks.map(p=>({id:p.productId,score:p.score})),empty:s.emptyReason,restricted:s.restrictedCount}))}));
      if(i===0){
        let seen=0;const sample=[];
        for(const p of ALL_PRODUCTS){
          const pp=buildProductProfile(p);
          const related=Object.keys(pp.health_need_relevance||{}).filter(n=>focus.has(n));
          if(!related.length && !/sleep|stress|journal|calm|relax|mood|breath|meditat|mindful|eye mask|earplug|white noise|sound machine|weighted blanket/i.test(String(p.name||'')))continue;
          const results=related.map(n=>{
            const r=scoreProductForNeed(pp,up,n);
            const q=qualificationForEcosystem(r,pp,50);
            return {n,rel:r.relationship,score:r.score,effective:q.effectiveScore,floor:q.floor,safety:r.safety?.eligible,restricted:r.restricted,filtered:r.filtered,exp:r.explainable,passport:pp.passport?.qa};
          });
          if(seen++<180)sample.push({id:p.id,name:p.name,type:p.type,cat:p.category,price:p.price,recommendable:isRecommendable(p,pp),ingested:pp.ingested,results});
        }
        console.log('WELLBEING_DIAG_CANDIDATES '+JSON.stringify(sample));
      }
    }
  });
});
