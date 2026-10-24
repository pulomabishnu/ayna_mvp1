// "Often goes together" (research, Oct 17): needs that commonly come with what
// she chose, with how often and the source. These are SUGGESTIONS she can add
// in her answers; the engine never adds a need on its own.
import { COOCCURRENCE } from '../data/matching/needLinks.research.js';
import { NEED_BY_ID, canonicalNeedId, CONDITION_SUPPORT_NEED } from './ontology.js';
import { isGovHealthSource } from '../utils/govSources.js';

// A linked condition shows as the need it is felt as.
const CONDITION_AS_NEED = { anemia: 'energy.fatigue', ibs_digestive: 'bloating.digestive' };
const CONDITION_LABEL = { anemia: 'low iron', ibs_digestive: 'IBS-type gut symptoms' };

/**
 * @param {string[]} needIds    her selected needs
 * @param {string[]} conditionIds her diagnosed conditions
 * @returns {{ needId, because, rateText, source, label }[]} up to `limit`
 */
export function relatedNeedSuggestions(needIds = [], conditionIds = [], limit = 3) {
  const have = new Set(needIds.map(canonicalNeedId));
  const from = new Set([...have, ...conditionIds, ...conditionIds.map((c) => CONDITION_SUPPORT_NEED[c]).filter(Boolean)]);
  const best = new Map();
  for (const r of COOCCURRENCE) {
    if (!from.has(r.from)) continue;
    // The rate and its source are shown, so only rows from a .gov page (founder rule, Oct 24).
    if (!isGovHealthSource(r.source_url)) continue;
    const conditionTarget = r.to_kind === 'condition';
    const target = canonicalNeedId(conditionTarget ? CONDITION_AS_NEED[r.to] : r.to);
    if (!target || !NEED_BY_ID[target] || have.has(target)) continue;
    // Weight and mood are hers to raise, never nudged by us.
    if (/^(metabolic\.weight|mood\.)/.test(target)) continue;
    // Only links with a measured rate of at least 1 in 4 are worth a nudge.
    if (typeof r.rate !== 'number' || r.rate < 0.25) continue;
    const prev = best.get(target);
    if (!prev || r.rate > prev.rate) best.set(target, { needId: target, rate: r.rate, because: r.from, rateText: r.rate_text, source: r.source_url, label: conditionTarget ? CONDITION_LABEL[r.to] : null });
  }
  return [...best.values()].sort((a, b) => b.rate - a.rate).slice(0, limit);
}
