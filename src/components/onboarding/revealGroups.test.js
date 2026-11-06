import { describe,it,expect } from 'vitest';
import { groupRevealRows, revealGroupForNeed } from './revealGroups.js';
import { ALL_PRODUCTS, getEcosystemSeedFromQuiz, getProductById } from '../../data/products.js';
import { EMPTY } from '../../mobile/data/intakeModel.js';
import { buildProductProfile } from '../../matching/productProfile.js';
import { buildUserProfile } from '../../matching/userProfile.js';
import { evaluateSafety } from '../../matching/score.js';

const p=(id)=>({id});
const row=(id,label,products=[],services=[],extra={})=>({
 id,label,products:products.map(p),services:services.map(p),held:false,needsAnswers:false,heldWhy:'',why:'',
 scoreByProduct:Object.fromEntries([...products,...services].map((id,i)=>[id,60+i])),...extra
});
describe('broad onboarding reveal, without broadening medical recommendation eligibility',()=>{
 it('consolidates mood swings, irritability, anxiety and low mood into ONE mental wellbeing card',()=>{
  const inputs=[row('mood.swings','Mood swings',[],['d-therapy']),
    row('mood.irritability','Irritability',[],[]),
    row('mood.general_anxiety','Anxiety',['p-breath'],['d-therapy']),
    row('mood.low','Low mood',['p-journal'],['d-therapy','d-bloom']),
    row('sleep.trouble','Trouble sleeping',['p-mask'],['d-sleep'])];
  const out=groupRevealRows(inputs);
  expect(out.map(r=>r.label)).toEqual(['Mental wellbeing','Sleep & energy']);
  expect(out[0].sourceLabels).toEqual(['Mood swings','Irritability','Anxiety','Low mood']);
  expect(out[0].services.map(x=>x.id)).toEqual(['d-therapy','d-bloom']);
  expect(out[0].products.map(x=>x.id)).toEqual(['p-breath','p-journal']);
  expect(out[0].fitLabelsByProduct['p-breath']).toEqual(['Anxiety']);
  expect(out[0].fitLabelsByProduct['p-journal']).toEqual(['Low mood']);
  expect(out[1].fitLabelsByProduct['p-mask']).toEqual(['Trouble sleeping']);
 });
 it('never makes an anxiety item appear relevant for irritability or low mood merely because cards are grouped',()=>{
  const out=groupRevealRows([row('mood.general_anxiety','Anxiety',['p-a'],[]),row('mood.low','Low mood',[],[])]);
  expect(out[0].fitLabelsByProduct).toEqual({'p-a':['Anxiety']});
  expect(out[0].products).toHaveLength(1);
 });
 it('keeps PMDD, postmenopausal bleeding, STI, pregnancy warnings and care-first cases distinct',()=>{
  expect(revealGroupForNeed('mood.pmdd')).toBeNull();
  expect(revealGroupForNeed('cycle.spotting',{careFirst:true})).toBeNull();
  expect(revealGroupForNeed('mood.low',{careFirst:true})).toBeNull();
  expect(revealGroupForNeed('vaginal.bv')).toBeNull();
  expect(revealGroupForNeed('sexual.sti')).toBeNull();
  const out=groupRevealRows([row('mood.swings','Mood swings',[],[]),
   row('mood.pmdd','PMDD symptoms',[],[],{careFirst:true,why:'Seek medical care.'}),
   row('mood.low','Low mood',[],[])]);
  expect(out.map(x=>x.label)).toEqual(['Mental wellbeing','PMDD symptoms']);
  expect(out[1].careFirst).toBe(true);
 });
 it('does not hide unanswered safety questions behind other grouped products',()=>{
  const out=groupRevealRows([
    row('mood.general_anxiety','Anxiety',['p-breath'],[]),
    row('mood.low','Low mood',[],[],{held:true,needsAnswers:true,heldWhy:'Answer safety questions.'}),
  ]);
  expect(out[0].products.map(p=>p.id)).toEqual(['p-breath']);
  expect(out[0].limitedLabels).toEqual(['Low mood']);
  expect(out[0].fitLabelsByProduct['p-breath']).toEqual(['Anxiety']);
 });
 it('does not create any new SKU or extend a product match to an unrelated concern',()=>{
  const inputs=[row('vasomotor.hot_flashes','Hot flashes',['p-cooling'],[]),
  row('mood.general_anxiety','Anxiety',['p-anxiety'],[])];
  const out=groupRevealRows(inputs);
  expect(new Set(out.flatMap(r=>r.products.map(p=>p.id)))).toEqual(new Set(['p-cooling','p-anxiety']));
  expect(out.map(r=>r.label)).toEqual(['Temperature & sweating','Mental wellbeing']);
  expect(out[0].fitLabelsByProduct['p-cooling']).toEqual(['Hot flashes']);
 });
 it('keeps empty areas honest rather than saying the whole catalog lacks products',()=>{
  const out=groupRevealRows([row('mood.swings','Mood swings'),row('mood.irritability','Irritability')]);
  expect(out).toHaveLength(1);
  expect(out[0].products).toEqual([]);
  expect(out[0].services).toEqual([]);
  expect(out[0].label).toBe('Mental wellbeing');
 });
 it('does not lose sources, shelf scores, or variety when a product covers several selected needs',()=>{
  const x=groupRevealRows([
    row('mood.low','Low mood',['p-common','p-low'],[],{scoreByProduct:{'p-common':55,'p-low':60}}),
    row('mood.general_anxiety','Anxiety',['p-common','p-anxiety'],[],{scoreByProduct:{'p-common':75,'p-anxiety':78}})
  ])[0];
  expect(x.products.map(x=>x.id)).toEqual(['p-common','p-low','p-anxiety']);
  expect(x.scoreByProduct['p-common']).toBe(75);
  expect(x.fitLabelsByProduct['p-common']).toEqual(['Low mood','Anxiety']);
 });
 it('on real catalog, merging selected needs never creates new products, loses a safety hold or attributes a product to the wrong need',()=>{
  const quiz={fullHealthIntake:{...EMPTY,age:'22',lifeStageSelections:['I get periods regularly'],
    supportSelections:['Mood swings','Irritability','Anxiety','Low mood','Trouble sleeping','Hot flashes'],
    allergyStatus:'No',takesCurrent:'No',diagnosisSelections:['None that I know of'],
    vasomotorTimingSelections:['Before my period / PMS','When stressed or anxious']}};
  const up=buildUserProfile(quiz);
  const original=getEcosystemSeedFromQuiz(quiz,null,{engine:'v2'}).shelves;
  const rows=original.map(sh=>({
    id:sh.needId,label:sh.label,
    products:sh.picks.map(p=>getProductById(p.productId)).filter(p=>p&&p.type!=='digital'),
    services:sh.picks.map(p=>getProductById(p.productId)).filter(p=>p&&p.type==='digital'),
    scoreByProduct:Object.fromEntries(sh.picks.map(p=>[p.productId,p.score])),
    careFirst:sh.emptyReason==='care_first',held:sh.restrictedCount>0&&!sh.picks.length
  }));
  const merged=groupRevealRows(rows);
  expect(merged.length).toBeLessThan(rows.length);
  expect(merged.find(r=>r.label==='Mental wellbeing')?.sourceLabels.length).toBe(4);
  const originalIds=new Set(rows.flatMap(r=>[...r.products,...r.services].map(p=>p.id)));
  const mergedIds=new Set(merged.flatMap(r=>[...r.products,...r.services].map(p=>p.id)));
  expect(mergedIds).toEqual(originalIds);
  for(const r of merged)for(const p of [...(r.products||[]),...(r.services||[])]){
    expect(originalIds.has(p.id)).toBe(true);
    expect(evaluateSafety(buildProductProfile(p),up).eligible,p.id+' unsafe').toBe(true);
    expect(r.fitLabelsByProduct?.[p.id]?.length).toBeGreaterThan(0);
  }
 });
});
