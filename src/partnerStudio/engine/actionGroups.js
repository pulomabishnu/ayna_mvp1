/* Merge per-product duplicates (one clinical review or freshness card per product) into one card. */
const GROUPS = {
  'clin-': (n, names) => ({ tier: 'safety', title: `ayna clinical review is open on ${n} products`, issue: `Products: ${names}.`, action: 'Send any safety documentation you have; ayna’s clinical reviewer finishes the review.', effort: 'M', trace: 'Product passport review record', confidence: 'Open review' }),
  'stale-': (n, names) => ({ tier: 'documentation', title: `Facts on ${n} products are past their review date`, issue: `Products: ${names}.`, action: 'Confirm current prices and facts so ayna matches you on what you sell today.', effort: 'S', trace: 'Product passport freshness', confidence: 'Seen directly' }),
  'fix-': (n, names) => ({ tier: 'safety', title: `Confirm the facts ayna flagged on ${n} products`, issue: `Products: ${names}.`, action: 'Send the official source for each corrected fact.', effort: 'S', trace: 'Product passport check', confidence: 'Draft, AI-assisted check' }),
};
const nameOf = (a) => a.title.replace(/^.* on /, '').replace(/ are .*$/, '');
export function groupActions(list) {
  const out = [];
  const seen = {};
  for (const a of list) {
    const pre = Object.keys(GROUPS).find((g) => a.id.startsWith(g));
    const same = pre ? list.filter((x) => x.id.startsWith(pre)) : [];
    if (!pre || same.length < 2) { out.push(a); continue; }
    if (seen[pre]) continue;
    seen[pre] = true;
    out.push({ id: `group-${pre.slice(0, -1)}`, affected: null, ...GROUPS[pre](same.length, same.map(nameOf).join(', ')) });
  }
  return out;
}
