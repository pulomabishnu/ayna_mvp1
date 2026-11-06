// The reveal is grouped for comprehension; the matching engine remains
// per-need with all its safety/contraindication, contextual and evidence gates.
// Never use a group's label to infer a diagnosis or to score a product.
export const REVEAL_CATEGORIES = [
  { id:'mental-wellbeing', label:'Mental wellbeing', needs:[
    'mood.swings','mood.irritability','mood.general_anxiety','mood.low','mood.cycle_related'
  ] },
  { id:'sleep-energy', label:'Sleep & energy', needs:[
    'sleep.trouble','energy.fatigue','cognition.brain_fog','cognition.concentration'
  ] },
  { id:'temperature-comfort', label:'Temperature & sweating', needs:[
    'vasomotor.hot_flashes','vasomotor.night_sweats'
  ] },
  { id:'period-cycle', label:'Period & cycle', needs:[
    'period.product_support','period.heavy','period.light','cycle.irregular','cycle.missed',
    'cycle.pms','cycle.breast_tenderness','pain.menstrual_cramp','pain.cycle_headache','bloating.cycle_related'
  ] },
  { id:'fertility', label:'Fertility & conception', needs:[
    'fertility.support','fertility.ttc','fertility.ovulation_tracking'
  ] },
  { id:'intimate-comfort', label:'Intimate comfort', needs:[
    'vaginal.dryness','vaginal.irritation','pain.sexual','sexual.libido','sexual.wellness'
  ] },
  { id:'urinary', label:'Bladder & urinary wellbeing', needs:[
    'urinary.frequency','urinary.urgency','urinary.incontinence'
  ] },
  { id:'digestive', label:'Digestive wellbeing', needs:[
    'digestive.constipation','digestive.diarrhea','digestive.gas','bloating.digestive','pain.abdominal'
  ] },
  { id:'skin-hair', label:'Skin & hair', needs:[
    'skin.acne','skin.hormonal','hair.loss','hair.excess'
  ] },
  { id:'strength', label:'Strength & bone health', needs:[
    'fitness.strength','bone.health'
  ] },
  { id:'pregnancy', label:'Pregnancy support', needs:[
    'pregnancy.prenatal','pregnancy.discomfort','pregnancy.safe_discovery'
  ] },
  { id:'postpartum', label:'Postpartum support', needs:[
    'postpartum.recovery','postpartum.lactation','postpartum.body_skin'
  ] },
  { id:'care', label:'Finding care', needs:[
    'care.find_doctor','care.telehealth'
  ] },
];
const GROUP_FOR_NEED = new Map(REVEAL_CATEGORIES.flatMap(c=>c.needs.map(n=>[n,c])));
// PMDD, postmenopausal bleeding, pregnancy bleeding, STIs/infection concerns,
// clinically restricted and otherwise care-first shelves remain explicit.
export function revealGroupForNeed(needId, { careFirst=false, why='' }={}) {
  if(careFirst || why) return null;
  return GROUP_FOR_NEED.get(needId) || null;
}
function interleaveDistinct(rows, field) {
  const seen=new Set(),out=[];
  const longest=Math.max(0,...rows.map(r=>(r[field]||[]).length));
  for(let i=0;i<longest;i++)for(const r of rows){
    const p=(r[field]||[])[i];
    if(p?.id && !seen.has(p.id)){seen.add(p.id);out.push(p);}
  }
  return out;
}
export function groupRevealRows(inputRows=[]) {
  if(!Array.isArray(inputRows)||!inputRows.length)return [];
  const byKey=new Map();
  for(const row of inputRows){
    const group=revealGroupForNeed(row.id,row);
    const key=group?.id || row.id;
    if(!byKey.has(key))byKey.set(key,{group,rows:[]});
    byKey.get(key).rows.push(row);
  }
  return [...byKey].map(([key, entry])=>{
    const {group,rows}=entry;
    if(!group) return rows[0];
    const products=interleaveDistinct(rows,'products');
    const services=interleaveDistinct(rows,'services');
    const sourceLabels=[...new Set(rows.map(r=>r.label).filter(Boolean))];
    const scoreByProduct={};
    const fitLabelsByProduct={};
    for(const row of rows){
      for(const p of [...(row.products||[]),...(row.services||[])]){
        if(!p?.id)continue;
        const score=row.scoreByProduct?.[p.id];
        if(Number.isFinite(score))scoreByProduct[p.id]=Math.max(score,scoreByProduct[p.id]??0);
        (fitLabelsByProduct[p.id] ||= []).push(row.label);
      }
    }
    const empty=!products.length&&!services.length;
    const blocked=rows.filter(r=>r.held||r.needsAnswers);
    return {
      id:key,label:group.label,sourceLabels,sourceNeedIds:rows.map(r=>r.id),
      scoreByProduct,fitLabelsByProduct,products,services,
      held:empty&&blocked.length>0,
      needsAnswers:empty&&blocked.some(r=>r.needsAnswers),
      heldWhy:blocked.map(r=>r.heldWhy).filter(Boolean)[0]||'',
      limitedLabels:blocked.map(r=>r.label),
      careFirst:false,
      why:empty ? rows.map(r=>r.why).find(Boolean)||'' : '',
    };
  });
}
