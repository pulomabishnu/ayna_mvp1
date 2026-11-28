/* Merge per-product duplicates (one review or freshness card per product) into one card.
   Claim-review cards are left out: claim benchmarking isn't part of the Basic plan. */
const OUT_OF_PLAN = ['review', 'flags'];
const GROUPS = {
  'clin-': (n, names) => ({ tier: 'safety', title: `ayna’s product review is open on ${n} products`, issue: `Products: ${names}.`, action: 'Send any product documentation you have; ayna’s reviewer finishes the review.', effort: 'M', trace: 'Product passport review record', confidence: 'Open review' }),
  'stale-': (n, names) => ({ tier: 'documentation', title: `Facts on ${n} products are past their review date`, issue: `Products: ${names}.`, action: 'Confirm current prices and facts so ayna matches you on what you sell today.', effort: 'S', trace: 'Product passport freshness', confidence: 'Seen directly' }),
  'fix-': (n, names) => ({ tier: 'safety', title: `Confirm the facts ayna flagged on ${n} products`, issue: `Products: ${names}.`, action: 'Send the official source for each corrected fact.', effort: 'S', trace: 'Product passport check', confidence: 'Draft, AI-assisted check' }),
};
const nameOf = (a) => a.title.replace(/^.* on /, '').replace(/ are .*$/, '');
export function groupActions(list) {
  const out = [];
  const seen = {};
  for (const a of list) {
    if (OUT_OF_PLAN.some((k) => a.id === k || a.id.startsWith(`${k}-`))) continue;
    const pre = Object.keys(GROUPS).find((g) => a.id.startsWith(g));
    const same = pre ? list.filter((x) => x.id.startsWith(pre)) : [];
    if (!pre || same.length < 2) { out.push(a); continue; }
    if (seen[pre]) continue;
    seen[pre] = true;
    out.push({ id: `group-${pre.slice(0, -1)}`, affected: null, ...GROUPS[pre](same.length, same.map(nameOf).join(', ')) });
  }
  return out;
}
