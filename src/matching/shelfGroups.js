// Presentation-only symptom-management groups. Never alter the clinical need,
// safety gate, product fit percentage, diagnosis, or evidence source behind a pick.
// The matcher still scores each explicit need; users see a manageable set of
// comfort/wellbeing shelves instead of one card for every symptom they selected.
export const SUPPORT_SHELF_GROUPS = [
  { id:'mood', label:'Mood & wellbeing', ids:['mood.general_anxiety','mood.low','mood.irritability','mood.swings','mood.cycle_related','mood.pmdd'] },
  { id:'temperature', label:'Temperature comfort', ids:['vasomotor.hot_flashes','vasomotor.night_sweats'] },
  { id:'sleep-energy', label:'Sleep, energy & focus', ids:['sleep.trouble','energy.fatigue','cognition.brain_fog','cognition.concentration'] },
  { id:'period-comfort', label:'Period & cycle comfort', ids:['cycle.pms','pain.menstrual_cramp','pain.cycle_headache','cycle.breast_tenderness','bloating.cycle_related','period.product_support','period.heavy','period.light','cycle.irregular','cycle.missed'] },
  { id:'intimate-comfort', label:'Vaginal & intimate comfort', ids:['vaginal.dryness','vaginal.irritation','vaginal.odor','sexual.wellness','pain.sexual'] },
  { id:'bladder', label:'Bladder & urinary care', ids:['urinary.burning','urinary.frequency','urinary.urgency','urinary.recurrent_uti','urinary.incontinence'] },
  { id:'digestive', label:'Digestive comfort', ids:['digestive.constipation','digestive.diarrhea','digestive.gas','digestive.discomfort','digestive.bloating','digestive.nausea','bloating.digestive','bloating.unspecified'] },
  { id:'skin-hair', label:'Skin & hair', ids:['skin.acne','skin.hormonal','hair.loss','hair.excess'] },
  { id:'menopause', label:'Menopause support', ids:['menopause.body_changes'] },
];
const GROUP_BY_NEED = new Map(SUPPORT_SHELF_GROUPS.flatMap(g=>g.ids.map(id=>[id,g])));
const UNIQUE = items=>[...new Set(items.filter(Boolean))];

/** Group the *visual* shelves. Keep each underlying need, source and caution. */
export function groupSupportShelves(shelves=[],{maxPicks=8}={}){
  const byGroup=new Map();
  for(const shelf of Array.isArray(shelves)?shelves:[]){
    if(!shelf?.needId)continue;
    const spec=GROUP_BY_NEED.get(shelf.needId);
    const key=spec?.id||shelf.needId;
    if(!byGroup.has(key))byGroup.set(key,{id:key,needId:shelf.needId,label:spec?.label||shelf.label||shelf.needId,ringLabel:spec?.label||shelf.label||shelf.needId,sourceNeeds:[],needIds:[],needLabels:[],picks:[],productIds:[],careFirst:false,careProminent:false,care:null,emptyReason:null,qualityNote:'',missingSafetyText:[],missingProductInfoText:[]});
    const g=byGroup.get(key);
    g.sourceNeeds.push(shelf);
    g.needIds.push(shelf.needId);
    g.needLabels.push(shelf.label||shelf.needId);
    g.careFirst=g.careFirst||!!shelf.careFirst;
    g.careProminent=g.careProminent||!!shelf.careProminent;
    g.care=g.care||shelf.care||null;
    g.missingSafetyText.push(...(shelf.missingSafetyText||[]));
    g.missingProductInfoText.push(...(shelf.missingProductInfoText||[]));
  }
  for(const g of byGroup.values()){
    const seen=new Set();
    const limit=Math.max(1,maxPicks);
    // First pick for each reported need before filling extra space. A single
    // supplement cannot crowd out mood-coping tools or temperature options.
    for(let round=0;round<limit&&g.picks.length<limit;round++){
      for(const shelf of g.sourceNeeds){
        const p=(shelf.picks||[])[round];
        if(!p?.productId||seen.has(p.productId))continue;
        if(g.picks.length===limit)break;
        g.picks.push({...p,matchedNeedId:shelf.needId});
        seen.add(p.productId);
      }
    }
    g.productIds=g.picks.map(p=>p.productId);
    g.missingSafetyText=UNIQUE(g.missingSafetyText);
    g.missingProductInfoText=UNIQUE(g.missingProductInfoText);
    const empty=g.sourceNeeds.every(s=>!(s.picks||[]).length);
    g.emptyReason=empty?(g.sourceNeeds.find(s=>s.emptyReason==='care_first')?.emptyReason||
      g.sourceNeeds.find(s=>s.emptyReason==='needs_safety_details')?.emptyReason||
      g.sourceNeeds[0]?.emptyReason||'no_matching_products'):null;
    g.qualityNote=empty?g.sourceNeeds.map(s=>s.qualityNote).find(Boolean)||'': '';
    g.hasCareFirstNeed=g.sourceNeeds.some(s=>s.emptyReason==='care_first');
    g.shortBy=Math.max(0,limit-g.picks.length);
  }
  return [...byGroup.values()];
}

/** A reported hot flash never becomes menopause unless she explicitly says so. */
export function hasExplicitMenopauseContext(quiz){
  const p=quiz?.fullHealthIntake||quiz||{};
  const stages=Array.isArray(p.lifeStageSelections)?p.lifeStageSelections:[];
  const support=Array.isArray(p.supportSelections)?p.supportSelections:[];
  return stages.some(x=>['I am in perimenopause','I am in menopause','I am post-menopause'].includes(x))
    || support.includes('Menopause-related body changes');
}

/** A prior LLM build must not reintroduce menopause from an old broad parent. */
export function withoutInferredMenopauseSections(sections,quiz){
  if(!Array.isArray(sections))return [];
  if(hasExplicitMenopauseContext(quiz))return sections;
  return sections.filter(s=>{
    const terms=[s?.concern,s?.displayLabel,s?.tag].filter(Boolean).join(' ').toLowerCase();
    const needIds=Array.isArray(s?.needIds)?s.needIds:[];
    return !/menopaus/.test(terms)&&!needIds.includes('menopause.body_changes');
  });
}

/** Preserve anything the user added; don't present obsolete auto-generated,
 * menopause-targeted supplements as their new personalized mood/heat picks. */
export function outdatedAutoMenopauseProduct(p,quiz){
  if(!p||hasExplicitMenopauseContext(quiz)||p.userAdded)return false;
  if(!p.llmGenerated&&!p.intakeGenerated)return false;
  const category=String(p.category||'').toLowerCase();
  const hf=Array.isArray(p.healthFunctions)?p.healthFunctions:[];
  const oldConcern=String(p._llmConcern||'').toLowerCase();
  // Cooling goods are useful comfort regardless of cause. Display those under
  // Temperature comfort rather than a presumed menopause stage.
  const cooling=comfortAreaOverride(p,quiz)==='temperature';
  if(cooling)return false;
  return category==='menopause'||hf.includes('perimenopause')||hf.includes('menopause')||/menopaus/.test(oldConcern);
}

export function comfortAreaOverride(p,quiz){
  if(!p||hasExplicitMenopauseContext(quiz))return null;
  const words=[p.name,p.summary,(p.tags||[]).join(' ')].join(' ');
  const ingestible=/supplement|capsule|pill|gumm|tablet|softgel|herbal/i.test([p.name,p.category,p.summary].join(' '));
  const digital=String(p.type||'').toLowerCase()==='digital'||/app|tracker|telehealth|digital/i.test(String(p.category||''));
  // An app that logs menopausal flashes is not a cooling product.
  if(!ingestible&&!digital&&/\bcool(?:ing|er|s)?\b|cool spray|cooling fan|chill|coldher/i.test(words))return 'temperature';
  return null;
}
