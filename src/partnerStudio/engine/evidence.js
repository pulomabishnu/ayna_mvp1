/**
 * Evidence Gap Analysis and Health Claim Benchmarking (Phase 1 plan, pp.4-7),
 * built from the product passport (src/data/passport): every claim already
 * carries its wording, evidence type, strength, source and review record.
 *
 * Status rules:
 * - Output statuses describe documentation, never efficacy. No A-F grade.
 * - A claim counts as human-reviewed only when the passport QA is "verified"
 *   and was not signed by the AI-assisted research pass. Today that is none,
 *   so review coverage is honest (0 of N) and every status shows as a draft.
 * - Documented-support coverage is computed over human-reviewed claims only,
 *   so it is null (N/A) until review happens. Drafts are shown separately.
 */
import { rate } from './metrics.js';

export const EVIDENCE_STATUS = {
  direct: 'Direct product study',
  indirect: 'Indirect: ingredient or guideline',
  regulatory_only: 'Regulatory record, not efficacy evidence',
  brand_reported: 'Brand-reported, study not located',
  experience_only: 'Experience only',
  not_located: 'Not located in reviewed sources',
};

export function statusFor(claim) {
  switch (claim?.evidence_type) {
    case 'product_study': return 'direct';
    case 'ingredient_research':
    case 'clinical_guideline':
    case 'expert_guidance': return 'indirect';
    case 'regulatory': return 'regulatory_only';
    case 'manufacturer': return 'brand_reported';
    case 'community': return 'experience_only';
    default: return 'not_located';
  }
}

export function isHumanReviewed(qa) {
  return qa?.status === 'verified' && !/AI-assisted/i.test(String(qa?.reviewed_by || ''));
}

export const THEMES = [
  { id: 'relief', label: 'Relief and comfort', re: /\b(reliev|sooth|eas(e|es|ing)|comfort|pain|cramp|discomfort)/i },
  { id: 'moisture', label: 'Dryness and moisture', re: /\b(dry|dryness|moist|hydrat|lubric)/i },
  { id: 'infection', label: 'Infection or UTI prevention', re: /\b(uti|infection|bv\b|yeast|prevent)/i },
  { id: 'bladder', label: 'Bladder control', re: /\b(leak|bladder|urgency|frequency|incontinen)/i },
  { id: 'balance', label: 'Odor and pH balance', re: /\b(odou?r|ph\b|balance)/i },
  { id: 'safety-use', label: 'Safe-use guidance', re: /\b(tss|absorbency|sanitiz|boil)/i },
  { id: 'hormonal', label: 'Hormonal and menopause symptoms', re: /\b(hot flash|menopaus|hormon|pms|pmos|pcos|androgen)/i },
  { id: 'regulatory', label: 'Regulatory status', re: /\b(fda|cleared|registered|510\(k\))/i },
  { id: 'quantified', label: 'Quantified result', re: /(\d+\s?%|\b\d+\s?(weeks?|hours?|days?|cycles?)\b|one cycle)/i },
  { id: 'fertility', label: 'Fertility and ovulation', re: /\b(fertil|ovulat|conceiv)/i },
];

export function themesOf(text) {
  return THEMES.filter((t) => t.re.test(String(text || ''))).map((t) => t.id);
}

/** Wording or evidence patterns a reviewer should look at. A flag is not a finding. */
export function reviewFlags(claim) {
  const text = String(claim?.claim || '');
  const type = claim?.evidence_type;
  const flags = [];
  if (/\d+\s?%/.test(text) && type === 'manufacturer') flags.push({ id: 'numeric_brand_only', label: 'Number backed only by brand-reported data' });
  if (/clinically (proven|shown|tested)/i.test(text) && type !== 'product_study') flags.push({ id: 'clinical_wording', label: '"Clinically" wording without a product study on file' });
  if (/\b(treat|cure|heal|prevents?)\b/i.test(text) && type !== 'product_study' && type !== 'regulatory') flags.push({ id: 'disease_wording', label: 'Treat or prevent wording: needs claim-type classification' });
  if (type === 'regulatory' && !/\b(fda|clear|regist|510)/i.test(text)) flags.push({ id: 'regulatory_for_benefit', label: 'A clearance is cited for a benefit claim; clearance does not establish every claim' });
  if (type === 'ingredient_research') flags.push({ id: 'ingredient_only', label: 'Ingredient research: the finished product at its dose is not studied' });
  return flags;
}

function median(nums) {
  const a = nums.filter((n) => n != null).sort((x, y) => x - y);
  if (!a.length) return null;
  const m = Math.floor(a.length / 2);
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
}

/**
 * Evidence record for one SKU.
 * @param {object} product catalog product
 * @param {object} passport getPassport(product)
 * @param {object} completeness getCompleteness(product)
 */
export function evidenceRecord(product, passport, completeness) {
  const ev = passport?.evidence || {};
  const qa = passport?.qa || {};
  const claims = (ev.claims?.value || []).map((c) => ({
    text: c.claim,
    status: statusFor(c),
    evidenceType: c.evidence_type || null,
    strength: c.strength || null,
    productSpecific: Boolean(c.product_specific),
    sourceUrl: c.source_url || null,
    themes: themesOf(c.claim),
    flags: reviewFlags(c),
  }));
  const sources = (ev.sources?.value || []).map((s) => ({ title: s.title, url: s.url, type: s.evidence_type, supports: s.supports }));
  const comp = passport?.composition?.ingredients;
  const howTo = product?.howToUse;
  return {
    sku: product.id,
    name: product.name,
    reviewed: isHumanReviewed(qa),
    qa: { status: qa.status || 'not_reviewed', label: qa.label || 'Not reviewed', by: qa.reviewed_by || null, at: qa.reviewed_at || null },
    claims,
    sources,
    verifiedAt: ev.claims?.verified_at || ev.sources?.verified_at || null,
    reviewDue: ev.claims?.review_due || null,
    freshness: passport?.freshness ? { state: passport.freshness.state, lastVerified: passport.freshness.last_verified, daysOverdue: passport.freshness.days_overdue ?? 0 } : null,
    completeness: completeness?.overall ?? null,
    sections: (completeness?.sections || []).map((s) => ({ id: s.id, label: s.label, percent: s.percent })),
    dimensions: {
      materials: comp?.known ? 'complete' : 'unknown',
      instructions: howTo ? 'present' : 'missing',
      regulatory: passport?.safety ? (Object.values(passport.safety).some((f) => f?.source_type === 'regulatory') ? 'On file' : 'None on file') : 'Unknown',
    },
  };
}

/** Brand-level evidence metrics against peers (same benchmark universe, same product category). */
export function evidenceMetrics(mine, peers) {
  const claims = mine.flatMap((r) => r.claims.map((c) => ({ ...c, reviewed: r.reviewed })));
  const reviewed = claims.filter((c) => c.reviewed);
  const draftDirect = (recs) => {
    const cs = recs.flatMap((r) => r.claims);
    return cs.length ? cs.filter((c) => c.status === 'direct').length / cs.length : null;
  };
  const peerByBrand = new Map();
  for (const r of peers) { if (!peerByBrand.has(r.brand)) peerByBrand.set(r.brand, []); peerByBrand.get(r.brand).push(r); }
  const peerDirect = [...peerByBrand.values()].map(draftDirect).filter((v) => v != null);
  return {
    inventoried: claims.length,
    reviewCoverage: rate(reviewed.length, claims.length),
    directCoverage: rate(reviewed.filter((c) => c.status === 'direct').length, reviewed.length),
    supportCoverage: rate(0, reviewed.length), // needs a human reviewer's "supports" judgement; none recorded yet
    draft: {
      direct: rate(claims.filter((c) => c.status === 'direct').length, claims.length),
      byStatus: Object.fromEntries(Object.keys(EVIDENCE_STATUS).map((s) => [s, claims.filter((c) => c.status === s).length])),
      peerMedianDirect: median(peerDirect),
      peerBrands: peerDirect.length,
    },
    completeness: { mine: median(mine.map((r) => r.completeness)), peerMedian: median(peers.map((r) => r.completeness)), peerN: peers.length },
    flagged: claims.filter((c) => c.flags.length).length,
  };
}

/** Claim themes: prevalence among peer SKUs and what is unique to the brand. */
export function claimLandscape(mine, peers) {
  const withClaims = (recs) => recs.filter((r) => r.claims.length);
  const peersInv = withClaims(peers);
  const brandThemes = new Set(mine.flatMap((r) => r.claims.flatMap((c) => c.themes)));
  const rows = [];
  for (const t of [...new Set([...brandThemes, ...peersInv.flatMap((r) => r.claims.flatMap((c) => c.themes))])]) {
    const meta = THEMES.find((x) => x.id === t);
    const peerHas = peersInv.filter((r) => r.claims.some((c) => c.themes.includes(t))).length;
    rows.push({
      theme: t,
      label: meta?.label || t,
      brand: mine.filter((r) => r.claims.some((c) => c.themes.includes(t))).map((r) => r.name),
      peerPrevalence: rate(peerHas, peersInv.length),
      unique: brandThemes.has(t) && peerHas === 0,
    });
  }
  rows.sort((a, b) => (b.brand.length - a.brand.length) || ((b.peerPrevalence.value ?? 0) - (a.peerPrevalence.value ?? 0)));
  const reviewedThemes = [...brandThemes];
  return {
    rows,
    peerSkusInventoried: peersInv.length,
    differentiation: rate(reviewedThemes.filter((t) => rows.find((r) => r.theme === t)?.unique).length, reviewedThemes.length),
  };
}
