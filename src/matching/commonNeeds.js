// "Common needs" in the quiz, tailored to her age and life stage using the
// life-stage research (CDC, SWAN and midlife meta-analyses, Oct 17). This only
// changes which options are shown first; she still chooses everything.
import { LIFE_STAGE_PRIORS } from '../data/matching/needLinks.research.js';
import { NEED_BY_ID, canonicalNeedId } from './ontology.js';

const STAGE_FROM_SELECTION = [
  [/pregnan/i, 'pregnant'], [/postpartum|had a baby/i, 'postpartum'],
  [/perimenopause/i, 'perimenopause'], [/post-?menopause/i, 'postmenopause'],
];
// Weight is never suggested; it is hers to raise.
const NEVER_SUGGEST = /^metabolic\.weight$/;

function ageBand(age) {
  const n = Number(String(age).replace(/\D/g, ''));
  if (!Number.isFinite(n) || n < 18) return null;
  if (n < 25) return '18-24'; if (n < 35) return '25-34'; if (n < 45) return '35-44'; if (n < 55) return '45-54';
  return '55+';
}

/**
 * Up to `limit` quiz options most common for her, best first, mapped onto the
 * options the quiz actually offers. Falls back to `fallback` when we know nothing.
 */
export function commonNeedOptions({ age, lifeStageSelections = [] }, offered, fallback, limit = 6) {
  const stages = new Set(lifeStageSelections.flatMap((s) => STAGE_FROM_SELECTION.filter(([re]) => re.test(s)).map(([, id]) => id)));
  const band = ageBand(age);
  if (band) stages.add(band);
  if (!stages.size) return fallback;
  const offeredSet = new Set(offered);
  const score = new Map();
  for (const r of LIFE_STAGE_PRIORS) {
    if (!stages.has(r.stage)) continue;
    const id = canonicalNeedId(r.need);
    const option = NEED_BY_ID[id]?.option;
    if (!option || !offeredSet.has(option) || NEVER_SUGGEST.test(id)) continue;
    // Life-stage rows outrank age rows; an unmeasured row counts as a small nudge.
    const w = (typeof r.rate === 'number' ? r.rate : 0.2) * (/^\d|\+$/.test(r.stage) ? 1 : 1.3);
    score.set(option, Math.max(score.get(option) || 0, w));
  }
  const ranked = [...score.entries()].sort((a, b) => b[1] - a[1]).map(([o]) => o);
  const out = [...ranked, ...fallback.filter((o) => !ranked.includes(o))];
  return out.slice(0, limit);
}
