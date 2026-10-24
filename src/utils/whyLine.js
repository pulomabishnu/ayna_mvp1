// One plain "why" line for a product, built only from reasons the matching
// engine already returned (getProductMatchDetailsForProduct). Shown wherever
// a "NN% match" used to be: product cards, the product page, Compare, Swipe,
// Wrapped. The percent itself stays internal (sorting, shelves).
//
// "For your heavy periods, within your budget"
// "Another option for your trouble sleeping"
//
// Nothing here is invented: every clause maps one engine reason, and a
// reason we do not have a plain phrasing for is left out rather than guessed.

export const MIN_WHY_SCORE = 50;

// Positive engine reasons -> short clause. Order here does not matter; the
// engine's own order does (first usable reason wins).
const CLAUSES = [
  [/^High capacity for (very heavy|heavy) flow$/i, (m) => `holds a ${m[1].toLowerCase()} flow`],
  [/^Sized for a lighter flow$/i, () => 'sized for a lighter flow'],
  [/^Within your budget$/i, () => 'within your budget'],
  [/^Costs less over time than the upfront price$/i, () => 'costs less over time'],
  [/^In a format you prefer$/i, () => 'in a format you prefer'],
  [/^(.+), which you asked for$/i, (m) => `${lower(m[1])}, like you asked`],
  [/^From a brand you trust$/i, () => 'from a brand you trust'],
  [/^From a brand you said you like$/i, () => 'from a brand you like'],
  [/^You said this helped a lot$/i, () => 'you said it helped a lot'],
  [/^You said this helped somewhat$/i, () => 'you said it helped'],
  [/^Works like something that helped you$/i, () => 'works like something that helped you'],
  [/^Has clinical sources about .+, which you ranked first$/i, () => 'has the clinical sources you ranked first'],
  [/^Well reviewed by other women, which you ranked first$/i, () => 'well reviewed by other women'],
  [/^Reviewed by experts, which you ranked first$/i, () => 'reviewed by experts'],
  [/^Also matches the (.+?) you \w+$/i, (m) => `also for your ${m[1]}`],
];

function lower(s) {
  const t = String(s || '').trim();
  // Keep acronyms ("UTI", "PCOS") as written.
  return /^[A-Z]{2,}/.test(t) ? t : t.charAt(0).toLowerCase() + t.slice(1);
}

function reasonTexts(details) {
  const fromDetails = (details?.reasonDetails || []).map((r) => r?.text).filter(Boolean);
  return fromDetails.length ? fromDetails : (details?.reasons || []).filter((r) => typeof r === 'string');
}

function bestNeedMatch(details) {
  const list = details?.needMatches || [];
  return list.find((m) => m.needId === details?.needId) || list[0] || null;
}

/** The engine-derived clauses for this match, in the engine's order. */
export function whyClauses(details) {
  const out = [];
  for (const text of reasonTexts(details)) {
    for (const [re, fn] of CLAUSES) {
      const m = String(text).match(re);
      if (m) { out.push(fn(m)); break; }
    }
  }
  // Product-level studies for this need, per the evidence model.
  if (details?.outputs?.evidence === 'product_specific') out.push('with its own studies');
  return [...new Set(out)];
}

/** Lead phrase: "For your period cramps" / "Another option for your ...". */
export function whyLead(details) {
  const first = String(reasonTexts(details)[0] || '');
  const phrase = bestNeedMatch(details)?.phrase || '';
  const m = first.match(/^(Matches|A secondary option for) (?:the|your) (.+?)(?: you \w+| and .+)?$/i);
  const need = phrase || (m ? m[2] : '');
  if (!need) return '';
  if (/^A secondary option/i.test(first)) return `Another option for your ${need}`;
  return `For your ${need}`;
}

/** True when the engine scored this product as a match worth explaining. */
export function hasWhy(details) {
  return Boolean(details && details.matchStatus === 'scored' && details.eligible !== false
    && details.eligibility !== 'restricted' && Number.isFinite(details.percent) && details.percent >= MIN_WHY_SCORE);
}

/**
 * The one why line for a product, or '' when there is no scored match.
 * @param {object} product catalog product (a product she added herself gets none)
 * @param {object} details getProductMatchDetailsForProduct() result
 * @param {{ max?: number }} [opts] max clauses after the lead (default 1)
 */
export function whyLine(product, details, { max = 1 } = {}) {
  if (product?.userAdded === true || !hasWhy(details)) return '';
  const lead = whyLead(details);
  if (!lead) return '';
  const clauses = whyClauses(details).slice(0, Math.max(0, max));
  return [lead, ...clauses].join(', ');
}

/**
 * One plain sentence on why the top-ranked product comes first, from the
 * engine's own ranking and reasons. `items`: [{ product, details }]. Ranked
 * by the internal score (never shown). '' when nothing is scored.
 */
export function whyFirstLine(items) {
  const scored = (items || []).filter((it) => it?.product && hasWhy(it.details));
  if (!scored.length) return '';
  const ranked = [...scored].sort((a, b) => b.details.percent - a.details.percent);
  const top = ranked[0];
  const name = top.product.name;
  if (ranked.length === 1) {
    return (items || []).length > 1 ? `${name} is the only one here that matches what you told us.` : '';
  }
  const next = ranked[1];
  if (top.details.percent === next.details.percent) return 'These fit what you told us about the same.';
  const theirs = new Set(ranked.slice(1).flatMap((it) => whyClauses(it.details)));
  const own = whyClauses(top.details).filter((c) => !theirs.has(c));
  if (own.length) return `${name} ranks first for you: ${own.slice(0, 2).join(', ')}.`;
  const topLead = whyLead(top.details);
  const nextLead = whyLead(next.details);
  if (/^For your/.test(topLead) && /^Another option/.test(nextLead)) {
    return `${name} ranks first for you: it directly matches your ${bestNeedMatch(top.details)?.phrase || 'main need'}.`;
  }
  return `${name} ranks first for you: it fits more of what you told us.`;
}

/**
 * Why line for one engine result on a need shelf (scoreProductForNeed /
 * getEcosystemSeedFromQuiz picks), named for that shelf's need.
 */
export function whyLineForPick(pick, phrase, opts) {
  if (!pick) return '';
  const details = {
    matchStatus: 'scored',
    eligible: pick.eligibility !== 'excluded',
    eligibility: pick.eligibility || 'eligible',
    percent: pick.score,
    needId: pick.needId,
    needMatches: [{ needId: pick.needId, phrase: phrase || '' }],
    reasonDetails: (pick.explanations || []).map((text) => ({ text })),
    outputs: pick.outputs || null,
  };
  return whyLine(pick.product || null, details, opts);
}
