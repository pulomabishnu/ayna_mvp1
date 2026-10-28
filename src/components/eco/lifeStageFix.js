import { LIFE_STAGE_BY_ID } from '../../matching/ontology';

/* The life stages that clash, in her words, from the engine's own
   contradiction data (careFlags.contradictions, code 'life_stage_pair').
   Shared by the website and app Ecosystem so both say the same thing. */
const EXTRA = { breastfeeding: 'breastfeeding' };
const labelFor = (id) => LIFE_STAGE_BY_ID[id]?.phrase || EXTRA[id] || String(id).replace(/_/g, ' ');

function joinList(items) {
  if (items.length <= 1) return items[0] || '';
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

/* Why the pair does not fit, in one plain sentence (falls back to a general one). */
const WHY = {
  'irregular_periods|regular_periods': 'Periods are usually one or the other at a time.',
  'no_periods|regular_periods': 'Those two cannot both be true right now.',
  'pregnant|regular_periods': 'Periods usually stop during pregnancy.',
  'menopause|regular_periods': 'Regular periods usually stop by menopause.',
  'postmenopause|regular_periods': 'Regular periods stop after menopause.',
  'pregnant|ttc': 'Pregnant and trying to conceive do not usually overlap.',
  'menopause|ttc': 'Trying to conceive is unusual during menopause.',
  'postmenopause|ttc': 'Trying to conceive is unusual after menopause.',
};

export function lifeStageClash(careFlags) {
  const pairs = (careFlags?.contradictions || []).filter((c) => c.code === 'life_stage_pair' && Array.isArray(c.stages));
  if (!pairs.length) return null;
  const ids = [...new Set(pairs.flatMap((c) => c.stages))];
  const labels = ids.map(labelFor);
  const why = pairs.length === 1 ? WHY[[...pairs[0].stages].sort().join('|')] : null;
  return {
    key: `stages:${ids.slice().sort().join('+')}`,
    ids,
    labels,
    picked: `You picked ${joinList(labels)}.`,
    why: why || 'These do not usually happen at the same time.',
    effect: 'Until you choose the one that fits now, we leave life stage out of your matches.',
  };
}

/* The engine's own generic note for the same thing; hidden where the clearer one shows. */
export const STAGE_NOTE_CODE = 'stage_needs_clarification';
