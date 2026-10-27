/**
 * The one evidence function (PDP audit Oct 25, 7.6, P0 #2): every source on a
 * product's record sorted into four labelled levels, counted once. The
 * Scientific literature tab, the compact header in ayna summary and the
 * Compare row all read this, so they can never disagree again.
 *
 *   1  Checked against .gov          filled mark    MedlinePlus, NIH, FDA, CDC, womenshealth.gov...
 *   2  Peer-reviewed · not graded    half mark      PubMed/PMC records and journal pages (Lancet, BMJ...)
 *   3  From <brand>                  outline mark   the brand's own site, packaging and claims
 *   4  People's experiences          dotted mark    Reddit, TikTok, YouTube and other posts (Reviews tab)
 *
 * The founder's rule stays: only level 1 can produce an ayna grade
 * (evidenceLevel.js grades only from .gov pages). Everything else is labelled
 * for what it is and never graded. Links that fit none of the four (a
 * magazine, a retailer listing, a medical society's page) are counted as
 * "other pages" and labelled by linkKind, never promoted to a level.
 */
import { buildEvidence, claimRows, linkKind } from './evidenceModel.js';
import { evidenceLevel } from './evidenceLevel.js';
import { isCredible, isPeerReviewed } from './credible.js';

export { PEER_LABEL, LEVELS, levelLabel } from './evidenceMarks.js';
import { PEER_LABEL, LEVELS } from './evidenceMarks.js';

export { isPeerReviewed };

/** Short count words for a header row ("1 .gov", "4 peer-reviewed", "3 from Saalt", "6 people's experiences"). */
export function levelCountWords(id, n, brand = '') {
  if (id === 'gov') return `${n} .gov`;
  if (id === 'peer') return `${n} peer-reviewed`;
  if (id === 'brand') return `${n} from ${String(brand || '').trim() || 'the brand'}`;
  if (id === 'people') return `${n} people’s ${n === 1 ? 'experience' : 'experiences'}`;
  return '';
}

/** Which of the four levels a link belongs to, or null (other pages). */
export function levelOfLink(url, brand = '') {
  if (!url) return null;
  if (isCredible(url)) return 'gov';
  if (isPeerReviewed(url)) return 'peer';
  const k = linkKind(url, brand);
  if (k.tier === 'brand') return 'brand';
  if (k.tier === 'community' || /community posts/i.test(k.label || '')) return 'people';
  return null;
}

/**
 * @param {object} product
 * @param {{ m?: object }} opts  the page's buildEvidence model when it already has one
 * @returns {{ brand, counts: {gov, peer, brand, people, other}, links: {gov: string[], ...}, graded: boolean,
 *   grade: object, status: string, why: string, summary: string }}
 */
export function evidenceFor(product, { m = null } = {}) {
  const empty = { gov: 0, peer: 0, brand: 0, people: 0, other: 0 };
  if (!product) return { brand: '', counts: empty, links: { gov: [], peer: [], brand: [], people: [], other: [] }, graded: false, grade: null, status: 'Not graded yet', why: '', summary: 'Not graded yet' };
  const model = m || buildEvidence(product);
  const brand = String(model?.brand || product.brand || '').trim();
  const urls = new Set();
  const add = (l) => { const u = l && (l.url || l.href); if (u && /^https?:\/\//i.test(u)) urls.add(u); };
  if (model) {
    [...model.expert.sources, ...model.expert.other, ...model.research.studies, ...model.research.other,
      ...model.research.ingredients.flatMap((i) => i.links), ...model.safety.sources,
      ...model.reviews.online, ...model.reviews.elsewhere].forEach(add);
    if (model.how?.source) add(model.how.source);
  }
  const claims = claimRows(product);
  claims.forEach((c) => add({ url: c.url }));
  const links = { gov: [], peer: [], brand: [], people: [], other: [] };
  urls.forEach((u) => { const lv = levelOfLink(u, brand); links[lv || 'other'].push(u); });
  // Brand claims recorded without a link still count as the brand's word, once each.
  const brandClaimsNoLink = claims.filter((c) => c.kind === 'brand' && !c.url).length;
  const counts = { gov: links.gov.length, peer: links.peer.length, brand: links.brand.length + brandClaimsNoLink, people: links.people.length, other: links.other.length };
  // Only .gov can produce a grade (founder rule, Oct 24): evidenceLevel grades from .gov pages only.
  const ev = evidenceLevel(product);
  const graded = Boolean(ev.topGrade && ev.level);
  const status = graded ? (ev.scope === 'type' ? ev.word : `${ev.word}${ev.need ? ` for ${ev.need}` : ''}`) : 'Not graded yet';
  const why = graded
    ? ev.line || `Graded by ayna from ${ev.source || 'a .gov health source'}.`
    : counts.gov > 0
      ? 'ayna grades only from .gov sources, and none on file has been graded for this product yet.'
      : `No .gov source on file covers this ${product.category === 'cup' ? 'cup' : product.category === 'disc' ? 'disc' : 'product'} yet.`;
  const parts = LEVELS.map((l) => (counts[l.id] ? levelCountWords(l.id, counts[l.id], brand) : '')).filter(Boolean);
  return { brand, counts, links, graded, grade: ev, status, why, summary: [status, ...parts].join(' · ') };
}
