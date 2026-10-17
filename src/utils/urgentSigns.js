// "Get help now" signs from the evidence research (NHS, Mayo, CDC, FDA pages;
// src/data/matching/redFlags.research.json). Shown beside products where the
// sign is relevant: toxic shock for anything worn inside, pregnancy warning
// signs for pregnancy products, postpartum warning signs for postpartum ones.
// This never diagnoses; it lists signs and what to do, with the source.
import RED_FLAGS from '../data/matching/redFlags.research.json';

const BY_ID = new Map(RED_FLAGS.map((r) => [r.id, r]));
const GROUPS = {
  internal: ['rf.toxic_shock_severe', 'rf.toxic_shock'],
  pregnancy: ['rf.ectopic_rupture', 'rf.preeclampsia', 'rf.hyperemesis_dehydration'],
  postpartum: ['rf.postpartum_hemorrhage', 'rf.postpartum_preeclampsia', 'rf.postpartum_psychosis_danger'],
};

function contexts(product) {
  const p = product || {};
  const cat = String(p.category || '').toLowerCase();
  const name = String(p.name || '').toLowerCase();
  const tags = (Array.isArray(p.tags) ? p.tags : []).map((t) => String(t).toLowerCase());
  const out = [];
  if (['tampon', 'cup', 'disc', 'menstrual-cup', 'menstrual-disc'].includes(cat) || /tampon|menstrual (cup|disc)/.test(name)) out.push('internal');
  if (cat === 'pregnancy' || tags.includes('pregnancy') || /prenatal|pregnan/.test(name)) out.push('pregnancy');
  if (cat === 'postpartum' || tags.includes('postpartum') || /postpartum|post-partum/.test(name)) out.push('postpartum');
  return out;
}

/** Red-flag rules relevant to this product (empty for most products). */
export function urgentSignsFor(product) {
  const seen = new Set();
  return contexts(product).flatMap((c) => GROUPS[c]).filter((id) => {
    if (seen.has(id) || !BY_ID.has(id)) return false;
    seen.add(id);
    return true;
  }).map((id) => BY_ID.get(id));
}

/** Red-flag rules for her life stage (pregnant / postpartum). */
export function urgentSignsForStages(stages = []) {
  const s = stages.map((x) => String(x).toLowerCase());
  const ids = [
    ...(s.some((x) => /pregnan/.test(x)) ? GROUPS.pregnancy : []),
    ...(s.some((x) => /postpartum|gave birth|had a baby/.test(x)) ? GROUPS.postpartum : []),
  ];
  return [...new Set(ids)].map((id) => BY_ID.get(id)).filter(Boolean);
}
