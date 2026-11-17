// Nov 16 (founder: "for the points it needs to be more specific, esp evidence ... this is Pro, they're paying
// to see this, it needs to be insightful"). The Pro breakdown, row by row, from the same engine numbers:
//   scored   — the rows whose points add up to her % (each with the specific reason behind it)
//   weighed  — things ayna checked that moved no points (evidence when it didn't cost any, other needs it
//              helps, reviews and research that only order equal matches), each saying why
//   sharpen  — what ayna doesn't know yet that would make the % more precise
// Every detail line comes from data on file (the research map's sourced "why", the evidence counts, the
// price comparison); nothing is invented when a fact is missing.
import { buildProductProfile } from '../../matching/productProfile.js';
import { evidenceFactorFor, FIT_JUDGED_RULES, researchNudge, reviewNudge } from '../../matching/v2.js';
import { needPhrase } from '../../matching/ontology.js';

const REL_WORD = { direct: 'a direct', strong: 'a strong', secondary: 'a secondary', adjacent: 'a partial', weak: 'a weak' };
const GRADE_WORD = { A: 'strong research', B: 'some research', C: 'early research' };
const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

function profileOf(product) {
  try { return buildProductProfile(product); } catch { return null; }
}

/** "2 studies of this product, 1 health guideline and 3 on its ingredients", or '' with none on file. */
export function evidenceCounts(ce) {
  if (!ce) return '';
  const bits = [];
  const ps = Number(ce.product_specific) || 0;
  const gl = Number(ce.guideline) || 0;
  const ing = Number(ce.ingredient_level) || 0;
  if (ps) bits.push(`${plural(ps, 'study', 'studies')} of this product`);
  if (gl) bits.push(`${plural(gl, 'health guideline')}`);
  if (ing) bits.push(`${plural(ing, 'study', 'studies')} of its ingredients`);
  if (!bits.length) return '';
  return bits.length > 1 ? `${bits.slice(0, -1).join(', ')} and ${bits[bits.length - 1]}` : bits[0];
}

/**
 * @param product catalog product
 * @param details getProductMatchDetailsForProduct() result
 * @param mb matchBreakdownFor(product, details) (rows carry .points that add up to the shown %)
 * @param extra { spot: priceSpot(product) | null, helps: needBreakdown rows }
 */
export function proFactors(product, details, mb, { spot = null, helps = [] } = {}) {
  const out = { scored: [], weighed: [], sharpen: [] };
  if (!product || !details || !mb) return out;
  const pp = profileOf(product);
  const needId = details.needId;
  const phrase = needPhrase(needId) || 'this need';
  const rel = pp?.health_need_relevance?.[needId] || null;
  const grade = details.v2?.grade || details.trace?.evidence?.grade || null;
  const counts = evidenceCounts(rel?.claim_evidence || pp?.passport?.claim_evidence?.[needId] || null);

  const rows = [...(mb.raised || []).map((x) => ({ ...x, up: true })), ...(mb.lowered || []).map((x) => ({ ...x, up: false }))]
    .filter((x) => x.text && x.points)
    .sort((a, z) => Math.abs(z.points) - Math.abs(a.points));
  for (const x of rows) {
    let detail = '';
    if (x.factor === 'need') {
      const how = rel?.relationship && REL_WORD[rel.relationship] ? `ayna's research map rates it ${REL_WORD[rel.relationship]} fit for ${phrase}.` : '';
      const basis = rel?.why ? (/^the brand/i.test(rel.why) ? 'The basis: the brand markets it for this. No independent source on file yet.' : `The basis: ${rel.why}`) : '';
      detail = [how, basis].filter(Boolean).join(' ');
    } else if (x.factor === 'strength') {
      detail = `Its main use is something else${rel?.why ? `. The link to ${phrase}: ${rel.why}` : '.'}`;
    } else if (x.factor === 'evidence') {
      detail = `${cap(GRADE_WORD[grade] || 'Limited research')} for ${phrase}${counts ? `: ${counts} on file` : ''}. Stronger research for this need would add these points back.`;
    } else if (x.factor === 'price') {
      detail = spot ? `${spot.word} (${spot.n} similar products, ${money(spot.lo)} to ${money(spot.hi)}).` : '';
    } else if (x.factor === 'history') {
      detail = 'From what you told ayna about products you have tried.';
    } else if (x.factor === 'details') {
      detail = details.contextUsed?.phrase ? `You mentioned ${details.contextUsed.phrase}.` : '';
    }
    out.scored.push({ key: `${x.up ? 'u' : 'd'}-${x.text}`, up: x.up, points: x.points, title: cap(x.text), detail });
  }

  // Evidence, when it cost no points: say why, with what's on file.
  if (grade && !rows.some((x) => x.factor === 'evidence')) {
    const fitJudged = FIT_JUDGED_RULES.has(rel?.rule);
    const E = fitJudged ? 1 : evidenceFactorFor(pp?.category || product.category, grade, pp);
    const why = fitJudged ? 'Products like this are judged on how well they fit, so the research grade doesn’t change the score.'
      : grade === 'A' ? 'Strong research for this need, so no points were taken off.'
        : E >= 1 ? 'For this kind of product ayna scores the fit, so the research grade doesn’t change the score.'
          : '';
    if (why) out.weighed.push({ key: 'evidence', title: `Evidence for ${phrase}: ${GRADE_WORD[grade] || 'limited research'}`, detail: [counts ? `On file: ${counts}.` : grade === 'C' ? 'No studies of this product on file yet.' : 'The grade comes from research on this kind of product, not this exact one.', why].join(' ') });
  }

  // Other needs it helps (founder, Nov 16).
  for (const h of helps.filter((r) => r.needId !== needId && r.score > 0).slice(0, 2)) {
    out.weighed.push({ key: `also-${h.needId}`, title: `Also helps ${h.phrase || h.short || h.label}`, detail: `${Math.round(h.score * (h.score <= 1 ? 100 : 1))}% match for that too. It helps more than one of your needs, so it ranks higher in your Shop. It never lowers the %.` });
  }

  // Ranking only: research volume and reviews order equal matches; the % stays the same.
  if (pp && researchNudge(pp, needId) > 0 && counts) {
    out.weighed.push({ key: 'research-rank', title: `Research on file for ${phrase}`, detail: `${cap(counts)}. Among products with the same %, this puts it higher in your list. It doesn’t change the %.` });
  }
  const rv = pp ? reviewNudge(pp) : 0;
  if (pp?.rating && rv) {
    out.weighed.push({ key: 'reviews', title: `Rated ${pp.rating} out of 5${pp.ratingCount ? ` by ${pp.ratingCount.toLocaleString('en-US')} people` : ''}`, detail: `Moves it ${rv > 0 ? 'up' : 'down'} a little among products with the same %. It doesn’t change the %.` });
  }

  out.sharpen = (details.v2?.unknown || mb.unknown || []).map((u) => u.text).filter(Boolean).slice(0, 3);
  return out;
}

function money(n) { return `$${n % 1 ? Number(n).toFixed(2) : n}`; }
