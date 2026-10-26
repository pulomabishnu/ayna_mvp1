/**
 * A product Ask suggests, as a small plate card with her match pill and its
 * reason (all-pages brief, Oct 25: "Match pill + reason on every product
 * card, Community mention and Ask suggestion"). The match comes from the one
 * engine (getProductMatchDetailsForProduct), the reason from whyLine, the
 * same as the product cards; a safety hold or a bleeding evaluation shows no
 * percent. Kept small and plain so it can be saved with the conversation.
 *
 * match.kind: 'pct' (percent, why) | 'hold' (why) | 'evaluation' (why) | 'none' (why) | 'signin' (no profile: "See your match")
 */
export async function productCard(product, { profile = null, healthProfile = null, matchOpts } = {}) {
  const base = {
    id: String(product?.id || ''),
    name: String(product?.name || '').trim(),
    brand: String(product?.brand || '').trim(),
    image: typeof product?.image === 'string' ? product.image : '',
    category: product?.category || '',
    type: product?.type || '',
  };
  if (!profile) return { ...base, match: { kind: 'signin' } };
  try {
    const [{ getProductMatchDetailsForProduct }, { whyLine }, md] = await Promise.all([
      import('../data/products.js'), import('./whyLine.js'), import('./matchDisplay.js'),
    ]);
    const d = getProductMatchDetailsForProduct(product, profile, healthProfile, matchOpts);
    if (!d || d.matchStatus === 'no-profile') return { ...base, match: { kind: 'signin' } };
    if (md.isBleedingEvaluation(d)) return { ...base, match: { kind: 'evaluation', why: md.BLEEDING_EVALUATION } };
    if (md.isSafetyHold(d) || d.eligibility === 'restricted') return { ...base, match: { kind: 'hold', why: d.safetyHold?.reason || md.SAFETY_HOLD_LINE } };
    if (d.matchStatus === 'scored' && d.eligible !== false && Number(d.percent) > 0) {
      return { ...base, match: { kind: 'pct', percent: Math.round(d.percent), why: whyLine(product, d) || '' } };
    }
    return { ...base, match: { kind: 'none', why: md.exclusionLines(d)[0] || 'No clear match for what you told ayna' } };
  } catch {
    return { ...base, match: { kind: 'signin' } };
  }
}
