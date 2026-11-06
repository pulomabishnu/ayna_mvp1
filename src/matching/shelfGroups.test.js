import { describe, expect, it } from 'vitest';
import { groupSupportShelves, withoutInferredMenopauseSections, outdatedAutoMenopauseProduct, comfortAreaOverride } from './shelfGroups.js';
import { ALL_PRODUCTS, getEcosystemSeedFromQuiz, getProductById } from '../data/products.js';
import { buildUserProfile } from './userProfile.js';
import { buildProductProfile } from './productProfile.js';
import { EMPTY } from '../mobile/data/intakeModel.js';
const base={...EMPTY,age:'22',lifeStageSelections:['I get periods regularly'],
  supportSelections:['Hot flashes','Night sweats','Anxiety','Low mood','Irritability','Mood swings','PMS symptoms','Trouble sleeping'],
  allergyStatus:'No',takesCurrent:'No',diagnosisSelections:['None that I know of'],safetyConcern:'No',
  vasomotorTimingSelections:['Before my period / PMS','When stressed or anxious']};
const quiz={fullHealthIntake:base,personalizationCompleted:true};
describe('symptom management shelves without presumed menopause',()=>{
  it('groups mood, temperature and energy while retaining separate scored needs',()=>{
    const seed=getEcosystemSeedFromQuiz(quiz,null,{engine:'v2'});
    const grouped=groupSupportShelves(seed.shelves);
    const profile=buildUserProfile(quiz);
    expect(profile.contexts.menopause_transition).toBeFalsy();
    expect(seed.shelves.find(s=>s.needId==='menopause.body_changes')).toBeUndefined();
    expect(grouped.some(s=>s.id==='menopause')).toBe(false);
    expect(grouped.find(s=>s.id==='mood')?.needIds).toEqual(expect.arrayContaining(['mood.general_anxiety','mood.low','mood.irritability','mood.swings']));
    expect(grouped.find(s=>s.id==='temperature')?.needIds).toEqual(['vasomotor.hot_flashes','vasomotor.night_sweats']);
    expect(grouped.length).toBeLessThan(seed.shelves.length);
    for(const group of grouped){
      expect(new Set(group.productIds).size).toBe(group.productIds.length);
      expect(group.productIds.length).toBeLessThanOrEqual(8);
      for(const pick of group.picks) {
        expect(group.needIds).toContain(pick.matchedNeedId);
        expect(getProductById(pick.productId)).toBeTruthy();
      }
    }
    console.log('AYNA_COMFORT_22 '+JSON.stringify(grouped.map(g=>({id:g.id,needs:g.needIds,picks:g.productIds,empty:g.emptyReason}))));
  });
  it('filters old AI menopause sections without deleting intentional explicitly stated ones',()=>{
    const bad=[{concern:'Perimenopause and menopause support',tiers:[{product:{id:'p-estroven-mood'}}]},
      {concern:'Mental health and cycle mood support',tiers:[]},
      {concern:'Hot flashes and night sweats',tiers:[]}];
    expect(withoutInferredMenopauseSections(bad,quiz).map(x=>x.concern)).toEqual(['Mental health and cycle mood support','Hot flashes and night sweats']);
    expect(withoutInferredMenopauseSections(bad,{fullHealthIntake:{lifeStageSelections:['I am in perimenopause']}})).toHaveLength(3);
  });
  it('preserves manually-added products and classifies physical cooling aids neutrally',()=>{
    const p={name:'Cool Spray for Hot Flashes',category:'menopause',summary:'External cooling spray',llmGenerated:true};
    expect(outdatedAutoMenopauseProduct(p,quiz)).toBe(false);
    expect(comfortAreaOverride(p,quiz)).toBe('temperature');
    expect(outdatedAutoMenopauseProduct({...p,name:'Menopause Capsules',summary:'Supplement for menopause'},quiz)).toBe(true);
    expect(outdatedAutoMenopauseProduct({...p,name:'Menopause Capsules',summary:'Supplement',userAdded:true},quiz)).toBe(false);
  });
  it('keeps researched non-ingested cooling products age-neutral and mood tools eligible for consideration',()=>{
    const [oboo,coldher,komuso,heartmath,journal] = [
      'p-oboo-cool-spray','p-joylux-coldher',
      'p-komuso-classic-shift-anxiety-breathing-necklace',
      'p-heartmath-inner-balance-coherence-plus-with-heartmath-app',
      'p-intelligent-change-the-five-minute-journal',
    ].map(getProductById);
    for(const p of [oboo,coldher,komuso,heartmath,journal]) expect(p?.id).toBeTruthy();
    for(const p of [oboo,coldher]){
      expect(p.healthFunctions).toContain('vasomotor');
      expect(comfortAreaOverride(p,quiz)).toBe('temperature');
    }
    expect(buildProductProfile(komuso).health_need_relevance['mood.general_anxiety']).toBeTruthy();
    expect(buildProductProfile(heartmath).health_need_relevance['mood.general_anxiety']).toBeTruthy();
    expect(buildProductProfile(journal).health_need_relevance['mood.low']).toBeTruthy();
  });
  it('does not turn an intentionally care-first shelf into a product cure',()=>{
    const grouped=groupSupportShelves([{needId:'cycle.spotting',label:'Spotting',picks:[],emptyReason:'care_first',qualityNote:'Seek prompt care'},
      {needId:'cycle.pms',label:'PMS',picks:[{productId:'test',score:60}]}]);
    expect(grouped.find(s=>s.id==='cycle.spotting').emptyReason).toBe('care_first');
    expect(grouped.find(s=>s.id==='period-comfort').picks).toHaveLength(1);
  });
});
