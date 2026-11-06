import { describe,it,expect } from 'vitest';
import { publishProductCatalog, mergePublishedWithBundled, getPublishedProducts, publishedCatalogRevision } from './publishedCatalog.js';
import { ALL_PRODUCTS, getProductById, getEcosystemSeedFromQuiz } from './products.js';
import { EMPTY } from '../mobile/data/intakeModel.js';
import { buildProductProfile } from '../matching/productProfile.js';
import { buildUserProfile } from '../matching/userProfile.js';
import { scoreProductForNeed, evaluateSafety } from '../matching/score.js';
import { scoreV2 } from '../matching/v2.js';

const QUIZ={fullHealthIntake:{...EMPTY,age:'22',lifeStageSelections:['I get periods regularly'],supportSelections:['Trouble sleeping'],allergyStatus:'No',takesCurrent:'No',diagnosisSelections:['None that I know of']}};
describe('one safe published catalog across Shop and personalized matching',()=>{
 it('deduplicates server rows and keeps locally reviewed bundled safety facts for the same ID',()=>{
  expect(mergePublishedWithBundled([{id:'base',name:'Safe local',safety:{latex:'yes'}}],
    [{id:'base',name:'Stale server',safety:{latex:'no'}},{id:'new',name:'New product'}]))
    .toEqual([{id:'base',name:'Safe local',safety:{latex:'yes'}},{id:'new',name:'New product'}]);
 });
 it('published DB-only sleep products become addressable and score against the same user need',()=>{
  const originalSize=ALL_PRODUCTS.length;
  const rev=publishedCatalogRevision();
  const fixture={id:'p-qa-published-sleep-mask-only',name:'QA Published Sleep Eye Mask',
    brand:'QA Testing',category:'sleep',type:'physical',source:'imported',price:'$18',
    url:'https://example.invalid/product/qa-sleep-mask',
    tags:['sleep','eye-mask'],healthFunctions:['sleep'],summary:'An opaque eye mask that blocks light for a darker sleep environment.',
    safety:{warnings:'For external use. Stop use if irritation occurs.'}};
  expect(getProductById(fixture.id)).toBeNull();
  expect(publishProductCatalog([{...fixture}])).toBe(true);
  expect(publishedCatalogRevision()).toBe(rev+1);
  expect(getPublishedProducts()).toHaveLength(1);
  expect(ALL_PRODUCTS.length).toBe(originalSize+1);
  expect(getProductById(fixture.id)?.name).toBe(fixture.name);
  const up=buildUserProfile(QUIZ),pp=buildProductProfile(getProductById(fixture.id));
  expect(pp.health_need_relevance['sleep.trouble']?.score).toBeGreaterThanOrEqual(.8);
  expect(evaluateSafety(pp,up).eligible).toBe(true);
  const r=scoreProductForNeed(pp,up,'sleep.trouble');
  const v2=scoreV2(pp,r,new Set(['sleep.trouble']),'',null,up);
  expect(v2.fit).toBeGreaterThanOrEqual(.5);
  const out=getEcosystemSeedFromQuiz(QUIZ,null,{engine:'v2'});
  const sleep=out.shelves.find(sh=>sh.needId==='sleep.trouble');
  expect(sleep).toBeTruthy();
  expect(sleep.picks.length).toBeGreaterThan(0);
  expect(sleep.picks.every(p=>getProductById(p.productId))).toBe(true);
 });
 it('a new feed replaces removed DB-only rows instead of leaving stale recommendations',()=>{
  expect(publishProductCatalog([{id:'p-qa-refresh-catalog',name:'Refreshed',source:'curated',category:'sleep'}])).toBe(true);
  expect(getProductById('p-qa-published-sleep-mask-only')).toBeNull();
  expect(getProductById('p-qa-refresh-catalog')).toBeTruthy();
 });
 it('unapproved discovered records cannot be appended from stale local cache',()=>{
  const n=ALL_PRODUCTS.length;
  const okay=publishProductCatalog([{id:'p-fake-discovery',name:'Not approved yet',source:'discovered',reviewStatus:'pending'},
    {id:'p-safe-curated',name:'Curated',category:'sleep',source:'curated'}]);
  expect(okay).toBe(true);
  expect(ALL_PRODUCTS.length).toBe(n); // replaces previous new row with one trusted new row
  expect(getProductById('p-fake-discovery')).toBeNull();
  expect(getProductById('p-safe-curated')).toBeTruthy();
 });
});
