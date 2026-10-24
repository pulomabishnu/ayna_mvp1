/**
 * Everything the team wrote about a product, sorted into the parts of the
 * product page (website and app share it). Rules:
 * - Nothing the team wrote is dropped. Long text is split into paragraphs or
 *   bullets, never cut. Two links to the same page are merged, keeping every
 *   sentence of both summaries.
 * - Links are sorted by how much they can be trusted, never deleted: health
 *   bodies and journals first, then brand pages, retailer listings, forums and
 *   press, each labelled for what it is.
 * - The words are the team's. Only em dashes become sentence breaks, and
 *   placeholders like "N/A (Software)" are left out because they say nothing.
 */
import { brandHowTo } from '../../utils/howToSource.js';
import { splitSentences } from './sentences.js';
import { isCredible, isMedicalNonGov } from './credible.js';
import { isPaperLink } from '../../utils/govSources.js';
import { getVerificationLinks, hostLabel } from '../../utils/verificationLinks.js';
import { humanPublisher } from './glance.js';
import { normalizeFdaStatus } from '../../utils/fdaStatus.js';
import { getPassport } from '../../data/passport/index.js';
import { recallFacts } from '../../utils/productFacts.js';
import { pdpAdditionsFor } from '../../data/pdpAdditions.js';

// "A — B" reads as two sentences, not a comma splice.
export function noDash(t) {
  return String(t ?? '')
    .replace(/\s+—\s+([a-z])/g, (m, c) => `. ${c.toUpperCase()}`)
    .replace(/\s*—\s*/g, ', ')
    .replace(/^,\s*/, '')
    .replace(/^⚠️?\s*/, '')
    .trim();
}

// "N/A", "N/A (Software)" and "N/A." in front of a real note say nothing.
const NA_LEAD = /^(n\/?a|none|not applicable|unknown|not on file)\b\.?(\s*\([^()]*\))?\.?\s*/i;
export function meaningful(v) {
  const t = String(v ?? '').trim();
  if (!t) return '';
  const rest = t.replace(NA_LEAD, '').trim();
  if (!rest) return '';
  // "N/A. NOT for oral use" keeps the note; a plain value keeps itself.
  return NA_LEAD.test(t) ? rest.charAt(0).toUpperCase() + rest.slice(1) : t;
}
const clean = (v) => noDash(meaningful(v));
const sentences = (t) => splitSentences(t);
const normText = (t) => String(t || '').toLowerCase().replace(/[“”"‘’'`]/g, '').replace(/[^a-z0-9%]+/g, ' ').trim();

/** Paragraphs from team text; a very long paragraph is split every few sentences (no words change). */
export function paragraphs(text, max = 360) {
  const out = [];
  String(text || '').split(/\n{2,}/).map((p) => noDash(p.trim())).filter(Boolean).forEach((p) => {
    if (p.length <= max) { out.push(p); return; }
    const s = sentences(p);
    let cur = [];
    s.forEach((x) => {
      if (cur.length && (cur.join(' ').length + x.length > max * 0.7)) { out.push(cur.join(' ')); cur = []; }
      cur.push(x);
    });
    if (cur.length) out.push(cur.join(' '));
  });
  return out;
}

// ---------------------------------------------------------------------------
// Links
// ---------------------------------------------------------------------------
const RETAIL = /(^|\.)(amzn|amazon|walmart|target|cvs|walgreens|ulta|sephora|costco|iherb|ebay|vitacost|thrive|thrivemarket|riteaid|kroger)\./i;
const FORUM = /(^|\.)(reddit|quora|tiktok|facebook|instagram|youtube|youtu|twitter|x)\.|^youtu\.be$/i;
const LEGAL = /(pacermonitor|courtlistener|law360|justia|topclassactions|classaction|law\.com|casetext|uscourts)/i;
const PRESS = /(nytimes|wirecutter|healthline|verywell|womenshealthmag|allure|instyle|byrdie|glamour|elle|vogue|cosmopolitan|refinery29|self\.com|prevention|goodhousekeeping|forbes|buzzfeed|today\.com|webmd|everydayhealth|medicalnewstoday|parents\.com|people\.com|shape\.com|bustle|popsugar|mindbodygreen)/i;
const PLATFORM = { reddit: 'Reddit', tiktok: 'TikTok', youtube: 'YouTube', instagram: 'Instagram', facebook: 'Facebook', amazon: 'Amazon', walmart: 'Walmart', wirecutter: 'NYT Wirecutter' };

function hostOf(url) { try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return ''; } }
function isSearch(url) { try { const u = new URL(url); return /\/search\b|\/results\b|[?&#](q|query|search|search_query|k)=/i.test(u.pathname + u.search + u.hash); } catch { return false; } }

/** What kind of page a link is, in plain words, and how far to trust it. */
export function linkKind(url, brand) {
  const host = hostOf(url);
  const slug = String(brand || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!host) return { tier: 'other', label: 'Link' };
  if (isSearch(url)) return { tier: 'other', label: FORUM.test(host) ? 'Search of community posts' : 'Search page, not a single source' };
  // Founder rule (Oct 24): only .gov health pages count as checked sources.
  if (isCredible(url)) return { tier: 'credible', label: '' };
  if (isPaperLink(url)) return { tier: 'paper', label: 'Study record, not yet checked by ayna' };
  if (RETAIL.test(host)) return { tier: 'retail', label: 'Retailer listing' };
  if (slug.length >= 3 && host.replace(/[^a-z0-9]/g, '').includes(slug)) return { tier: 'brand', label: 'Brand’s own page, not independent' };
  if (FORUM.test(host)) return { tier: 'community', label: 'Community post' };
  if (LEGAL.test(host)) return { tier: 'legal', label: 'Court record or legal news' };
  if (PRESS.test(host)) return { tier: 'press', label: 'Magazine or health site, not peer reviewed' };
  if (isMedicalNonGov(url)) return { tier: 'nongov', label: 'Not a .gov source, not checked by ayna' };
  return { tier: 'other', label: 'Not peer reviewed' };
}

// Hosts whose one-word name reads like a topic ("Menopause") or says nothing ("Isswsh").
const NAMED_HOSTS = { 'menopause.org': 'The Menopause Society', 'isswsh.org': 'ISSWSH (sexual health society)', 'issm.info': 'ISSM (sexual medicine society)', 'yourpelvicfloor.org': 'International Urogynecological Association', 'reproductivefacts.org': 'ASRM (reproductive medicine society)', 'healthychildren.org': 'American Academy of Pediatrics', 'scholars.mssm.edu': 'Mount Sinai (study record)', 'air.unimi.it': 'University of Milan (study record)', 'urology.wisc.edu': 'University of Wisconsin (copy of the paper)' };
export function publisherOf(url, brand, platform) {
  const host = hostOf(url);
  if (!host) return PLATFORM[platform] || '';
  if (NAMED_HOSTS[host]) return NAMED_HOSTS[host];
  if (/amzn\.|amazon\./i.test(host)) return 'Amazon';
  const slug = String(brand || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (slug.length >= 3 && host.replace(/[^a-z0-9]/g, '').includes(slug)) return brand;
  return humanPublisher(host) || hostLabel(url) || host;
}

/** "PubMed: Tampons and..." → "Tampons and..." when the publisher already says PubMed. */
export function cleanTitle(title, publisher) {
  const m = String(title || '').match(/^([^:]{2,40}):\s+(.{8,})$/);
  if (!m) return title;
  const k = (t) => String(t || '').toLowerCase().replace(/[^a-z]/g, '');
  const pre = k(m[1]); const pub = k(publisher);
  const rest = m[2].charAt(0).toUpperCase() + m[2].slice(1);
  return pre && (pub && (pub.includes(pre) || pre.includes(pub)) || /^(nih|nihpmc|pmc|pubmed|fda|cdc|acog|who|amazon|reddit|tiktok|youtube|instagram|facebook)$/.test(pre)) ? rest : title;
}

const YEAR = /\b(19[5-9]\d|20[0-3]\d)\b/;
const STUDY_TYPES = [[/meta-analys/i, 'Meta-analysis'], [/systematic review|cochrane/i, 'Systematic review'], [/randomi[sz]ed|controlled trial|double-blind/i, 'Randomized trial'], [/guideline|committee opinion|practice bulletin|position statement/i, 'Guideline'], [/cohort|case-control|cross-sectional|observational/i, 'Observational study'], [/in[- ]vitro|lab study|cell stud|in bacteria|animal|mice|rats\b/i, 'Lab or animal study'], [/\breview\b/i, 'Review']];
export function studyType(s) {
  const t = `${s.title || ''} ${s.summary || ''}`;
  const hit = STUDY_TYPES.find(([re]) => re.test(t));
  return hit ? hit[1] : '';
}

// A study summary that reports no benefit. Shown first, so a negative trial can't hide.
const NEGATIVE = /did not (significantly |meaningfully )?(reduce|improve|lower|prevent|help|differ|change)|no (significant|meaningful|clear|detectable) (difference|benefit|effect|reduction|improvement)|not (significantly )?(better|different) than placebo|about (the same as|like) (a )?placebo|advised against|not enough (evidence )?to know|insufficient evidence|no evidence (that|of)|found no (benefit|effect|difference)/i;
export const isNegative = (s) => NEGATIVE.test(String(s || ''));

/** Merge links from many lists by URL, keeping every sentence of every summary. */
export function collectLinks(entries, brand) {
  const byUrl = new Map();
  entries.forEach((e) => {
    const url = e && (e.url || e.href);
    if (!url || !/^https?:\/\//i.test(url)) return;
    const title = noDash(e.title || e.text || e.label || '');
    const summary = noDash(e.summary || '');
    const why = noDash(e.justification || '');
    const had = byUrl.get(url);
    if (!had) {
      const publisher = publisherOf(url, brand, e.platform);
      byUrl.set(url, { url, title: title || publisher, altTitles: [], summaryParts: summary ? [summary] : [], why, year: e.year || '', publisher });
      return;
    }
    if (title && normText(title) !== normText(had.title)) {
      // The longer title leads; the other stays as an "also titled" note.
      if (title.length > had.title.length) { had.altTitles.push(had.title); had.title = title; } else had.altTitles.push(title);
    }
    if (summary) had.summaryParts.push(summary);
    if (why && !had.why) had.why = why;
  });
  return [...byUrl.values()].map((l) => {
    // Every sentence once, in the order they were written.
    const seen = new Set();
    const s = l.summaryParts.flatMap((p) => sentences(p)).filter((x) => { const k = normText(x); if (seen.has(k)) return false; seen.add(k); return true; });
    const summary = s.join(' ');
    const kind = linkKind(l.url, brand);
    const year = l.year || (String(l.title).match(YEAR) || String(summary).match(YEAR) || [])[1] || '';
    const out = { ...l, summary, kind, year, title: cleanTitle(l.title, l.publisher) };
    out.type = studyType(out);
    out.negative = isNegative(summary);
    // Filler justifications ("Mayo Clinic is a leading clinical resource") read as internal notes: kept, but plainly labelled.
    out.why = l.why;
    delete out.summaryParts;
    return out;
  });
}

// ---------------------------------------------------------------------------
// Ratings written into summaries ("4.5 out of 5 stars from 34 ratings")
// ---------------------------------------------------------------------------
export function parseRating(text) {
  const t = String(text || '');
  const m = t.match(/(?<![\d.])(\d(?:\.\d{1,2})?)\s*(?:out of|\/)\s*5(?:\s*stars?)?[^.]{0,40}?(?:across|from|of|with)\s+([\d,]+)\s+(?:verified\s+|customer\s+|global\s+)?(?:reviews|ratings)/i)
    || t.match(/(?<![\d.])(\d(?:\.\d)?)[-\s]?stars?[^.]{0,40}?(?:across|from|of)\s+([\d,]+)\s+(?:verified\s+)?(?:reviews|ratings)/i);
  return m ? { value: m[1], count: m[2] } : null;
}

// ---------------------------------------------------------------------------
// The model
// ---------------------------------------------------------------------------
export function buildEvidence(product, { heroLine = '', glance = null } = {}) {
  if (!product) return null;
  const brand = product.brand || '';
  const pp = getPassport(product);
  const isDigital = product.type === 'digital';
  const independent = product.clinicianOpinionSource !== 'brand';

  // Summary: whatever the line under the name didn't already say.
  const summaryFull = clean(String(product.summary || '').replace(/\s*\(see [^()]+\)/i, ''));
  const shown = normText(String(heroLine || '').replace(/…$/, ''));
  let summaryBody = summaryFull;
  if (shown) {
    const s = sentences(summaryFull);
    let i = 0; let acc = '';
    while (i < s.length && normText(acc ? `${acc} ${s[i]}` : s[i]).length <= shown.length && shown.startsWith(normText(acc ? `${acc} ${s[i]}` : s[i]))) { acc = acc ? `${acc} ${s[i]}` : s[i]; i += 1; }
    if (acc && normText(acc) === shown) summaryBody = s.slice(i).join(' ');
  }
  const summary = [...paragraphs(summaryBody), ...paragraphs(product.recommendationWhyDetail)];

  // Expert view
  const doctorAi = clean(product.verificationLinks?.doctor?.aiSummary);
  const clinicalAll = collectLinks([...(product.doctorOpinionCitations || []), ...getVerificationLinks(product, 'doctor'), ...(product.researchClinicalSources || [])], brand);
  const expert = {
    short: sentences(clean(product.doctorOpinionShort)),
    opinion: paragraphs(meaningful(product.doctorOpinion)),
    note: paragraphs(meaningful(product.clinicalNote)),
    attribution: clean(product.clinicianAttribution),
    // The team's own note says it is an ayna synthesis, not a named clinician's words.
    synthesis: /ayna synthesis|not a direct clinician|not reviewed by a (named )?clinician|ayna['’]s (summary|synthesis)/i.test(clean(product.clinicianAttribution))
      || (Boolean(clean(product.doctorOpinion)) && !clean(product.clinicianAttribution) && !/\bDr\.|\b(MD|DO|NP|RN|PA-C|CNM|PharmD)\b/.test(String(product.doctorOpinion || ''))),
    // A named doctor we can't trace to a source is shown, but labelled.
    sourceSummary: doctorAi && normText(doctorAi) !== normText(product.doctorOpinion) ? { text: doctorAi, untraced: /\bDr\.\s+[A-Z][a-z]+/.test(doctorAi) } : null,
    sources: clinicalAll.filter((l) => l.kind.tier === 'credible'),
    other: clinicalAll.filter((l) => l.kind.tier !== 'credible'),
  };

  // Research
  const ingredients = (product.ingredientScience || []).filter((i) => i?.name).map((i) => ({
    name: noDash(i.name),
    text: paragraphs(meaningful(i.text)),
    links: collectLinks((i.citations || []).map((c) => ({ ...c, title: c.label || c.text })), brand),
  }));
  const studiesAll = collectLinks([...getVerificationLinks(product, 'scientific'), ...(product.scientificCitations || []), ...(product.researchScienceSources || [])], brand);
  // Ingredient sources with a negative finding are pulled up too.
  const ingNegatives = ingredients.flatMap((i) => i.links).filter((l) => l.negative && l.kind.tier === 'credible' && !studiesAll.some((s) => s.url === l.url));
  const studies = studiesAll.filter((l) => l.kind.tier === 'credible');
  const sciAi = clean(product.verificationLinks?.scientific?.aiSummary);
  const research = {
    summary: paragraphs(meaningful(product.effectiveness)),
    sourceSummary: sciAi && normText(sciAi) !== normText(product.effectiveness) ? sciAi : '',
    negative: [...studies.filter((s) => s.negative), ...ingNegatives],
    studies,
    other: studiesAll.filter((l) => l.kind.tier !== 'credible'),
    ingredients,
    ingredientsAreTopics: ingredients.some((i) => !new RegExp(`\\b${i.name.split(/[\s(]/)[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i').test(`${product.ingredients || ''} ${product.safety?.materials || ''}`)),
    ingredientNote: clean(product.ingredientScienceNote),
    evidenceStrength: clean(product.evidenceStrength),
  };

  // Reviews
  const communityAll = collectLinks([
    ...(product.communityReviewSourceUrl ? [{ url: product.communityReviewSourceUrl, text: product.communityReviewSourceLabel }] : []),
    ...getVerificationLinks(product, 'community'),
  ], brand);
  const brandRatingText = [product.safety?.opinionAlerts, product.ratingNote, product.communityReview].join(' ');
  const elsewhere = communityAll.filter((l) => ['retail', 'brand'].includes(l.kind.tier)).map((l) => ({ ...l, rating: parseRating(l.summary) || parseRating(l.title) }));
  const commAi = clean(product.verificationLinks?.community?.aiSummary);
  const reviews = {
    text: paragraphs(meaningful(product.communityReview)),
    sourceSummary: commAi && normText(commAi) !== normText(product.communityReview) ? commAi : '',
    ratingNote: clean(product.ratingNote),
    brandRating: parseRating(brandRatingText),
    userRating: product.userRating ? { value: product.userRating, url: product.userRatingSourceUrl || '' } : null,
    elsewhere,
    online: communityAll.filter((l) => !['retail', 'brand'].includes(l.kind.tier)),
    incentivized: (product.incentivizedReviewSites || []).filter((x) => x?.site).map((x) => `${noDash(x.site)}${x.source ? ` (per ${noDash(x.source)})` : ''}`),
  };

  // Safety
  const recall = recallFacts(product);
  const alertRaw = glance?.alert || '';
  const opinionAlerts = clean(product.safety?.opinionAlerts);
  const preg = pp?.safety?.pregnancy;
  const bf = pp?.safety?.breastfeeding;
  const meds = pp?.safety?.medication_interactions;
  const val = (f) => (f?.known && !f.notApplicable ? noDash(Array.isArray(f.value) ? f.value.join(', ') : String(f.value || '')) : '');
  const fdaRaw = clean(product.safety?.fdaStatus);
  // Apps carry CE marks and wellness notes, not FDA product categories: their words are shown as written.
  const fda = isDigital ? null : normalizeFdaStatus(product.safety?.fdaStatus);
  const recallsText = clean(product.safety?.recalls);
  const privacy = product.privacy && typeof product.privacy === 'object' ? product.privacy : null;
  const labelRows = [];
  const pushRow = (label, value, note = '') => { const v = noDash(value); if (v && !labelRows.some((r) => normText(r.value) === normText(v))) labelRows.push({ label, value: v, note }); else if (v) { const twin = labelRows.find((r) => normText(r.value) === normText(v)); twin.label = `${twin.label} and ${label.toLowerCase()}`; } };
  pushRow('Pregnancy', val(preg));
  pushRow('Breastfeeding', val(bf));
  pushRow('Medicines', val(meds));
  const frag = pp?.composition?.fragrance;
  if (frag?.known && !frag.notApplicable) pushRow('Fragrance', String(frag.value).replace(/^\w/, (c) => c.toUpperCase()));
  const latex = pp?.composition?.latex;
  if (latex?.known && !latex.notApplicable) pushRow('Latex', String(latex.value).replace(/^\w/, (c) => c.toUpperCase()));
  const safety = {
    // The safety story, said once: the note, then the court or recall record behind it.
    alert: alertRaw ? paragraphs(alertRaw) : [],
    record: recall.status === 'note' && recallsText && normText(recallsText) !== normText(alertRaw) ? recallsText : '',
    opinionAlerts: opinionAlerts && normText(opinionAlerts) !== normText(alertRaw) ? paragraphs(opinionAlerts) : [],
    warnings: (product.warnings || []).map(clean).filter(Boolean),
    sideEffects: clean(product.safety?.sideEffects),
    allergens: clean(product.safety?.allergens),
    avoidIf: (product.avoidIfSensitivity || []).map((t) => String(t).replace(/[-_]/g, ' ')),
    labelRows,
    fdaRaw, fda,
    recall: recall.status === 'note' ? null : { status: recall.status, text: recallsText },
    privacy: privacy ? [
      ['Data storage', privacy.dataStorage], ['Selling your data', privacy.sellsData], ['HIPAA and data rules', privacy.hipaa], ['Privacy policy', privacy.keyPolicy],
    ].map(([label, v]) => ({ label, value: typeof v === 'string' ? clean(v).replace(/^[✅❌]\s*/, '') : '' })).filter((r) => r.value) : [],
    sources: collectLinks((product.safetyNoteSources || []).map((s) => ({ ...s, title: s.label })), brand),
  };

  // How to use
  const howRaw = brandHowTo(product.howToUse, brand);
  const how = howRaw?.steps?.length ? {
    intro: clean(howRaw.intro),
    steps: howRaw.steps.map(clean).filter(Boolean),
    // The brand's own page (or a .gov label); a seller's page is never cited (src/utils/howToSource.js).
    source: howRaw.sourceUrl ? collectLinks([{ url: howRaw.sourceUrl, title: howRaw.sourceLabel }], brand)[0] : null,
    fromListing: Boolean(howRaw.fromListing),
    faq: /^https:\/\//.test(String(product.faqUrl || '')) ? collectLinks([{ url: product.faqUrl, title: `${brand || 'The brand'}’s FAQ` }], brand)[0] : null,
  } : null;

  const materials = clean(product.safety?.materials);
  const ingredientsText = clean(product.ingredients);
  const details = {
    ingredientsText,
    materials: materials && !/^various|^varies/i.test(materials) && normText(materials) !== normText(ingredientsText) ? materials : '',
    priceNote: clean(product.priceNote),
    badges: (product.badges || []).map(noDash).filter(Boolean),
    whereToBuy: (product.whereToBuy || []).map(clean).filter(Boolean),
    inStock: Object.entries(product.whereToBuyInStock || {}).filter(([, v]) => v).map(([k]) => k),
    platform: clean(product.platform),
    integrations: (product.integrations || []).map((x) => noDash(typeof x === 'string' ? x : x?.name)).filter(Boolean),
  };

  return {
    brand, pp, isDigital, independent,
    summary,
    who: (product.whoItsFor || []).map(clean).filter(Boolean),
    expert, research, reviews, safety, how, details,
    additions: pdpAdditionsFor(product),
  };
}

/**
 * Round badges beside the product photo. Only facts on file, never a claim
 * we can't trace: FSA/HSA eligible, fragrance (from the label check),
 * prescription, app. A fact from the brand says so.
 */
export function attributeBadges(product, glance = null) {
  if (!product) return [];
  const pp = getPassport(product);
  const out = [];
  const fsa = (glance?.facts || []).find((f) => f.id === 'fsa' && !f.unknown);
  if (fsa?.value === 'Eligible') out.push({ id: 'fsa', label: 'FSA/HSA eligible' });
  const frag = pp?.composition?.fragrance;
  if (frag?.known && !frag.notApplicable && /without fragrance|fragrance[- ]free|no (added )?fragrance|unscented/i.test(String(frag.value))) {
    out.push({ id: 'frag', label: 'Fragrance free', note: /brand/i.test(`${frag.source_type} ${frag.value}`) ? 'per brand' : '' });
  }
  if (product.requiresPrescription) out.push({ id: 'rx', label: 'Prescription' });
  if (product.type === 'digital') out.push({ id: 'app', label: 'App or online' });
  return out.slice(0, 3);
}

// ---------------------------------------------------------------------------
// Claims, one by one (team direction 12, UX spec 15): what kind of evidence
// stands behind each claim, in words that match the level actually on file.
// ---------------------------------------------------------------------------
const CLAIM_KIND = {
  brand: 'The brand’s claim',
  product: 'Study of this product',
  ingredient: 'About an ingredient, not this exact product',
  gov: 'Independent .gov health source',
  expert: 'Medical society or clinic page, not a .gov source',
  listing: 'A seller’s listing, not evidence',
  paper: 'Study record, not yet checked by ayna',
  other: 'Not a .gov source, not checked by ayna',
  community: 'Community experience, not evidence',
};

/** Each recorded claim with a plain label for the kind of evidence behind it. */
export function claimRows(product) {
  const pp = getPassport(product);
  const raw = pp?.evidence?.claims;
  const list = Array.isArray(raw) ? raw : raw?.known && Array.isArray(raw.value) ? raw.value : [];
  const brand = product?.brand || '';
  return list.filter((c) => c && c.claim).map((c) => {
    const url = String(c.source_url || '');
    const tier = url ? linkKind(url, brand).tier : 'other';
    const fromBrand = tier === 'brand' || c.evidence_type === 'manufacturer';
    const gov = url && isCredible(url);
    let kind = 'brand';
    if (c.evidence_type === 'community') kind = 'community';
    else if (c.evidence_type === 'ingredient_research') kind = 'ingredient';
    else if (c.evidence_type === 'product_study' && c.product_specific) kind = 'product';
    // Only a medical organisation's page is "expert"; a seller's page (Amazon,
    // a reseller) or any other site is labelled for what it is.
    else if (['clinical_guideline', 'regulatory', 'expert_guidance'].includes(c.evidence_type)) kind = gov ? 'gov' : tier === 'nongov' ? 'expert' : tier === 'retail' ? 'listing' : tier === 'paper' ? 'paper' : 'other';
    else if (gov) kind = 'gov';
    const via = kind !== 'brand' && fromBrand ? 'Cited by the brand, not checked by ayna' : kind === 'product' && !gov ? 'Not checked by ayna' : '';
    return {
      claim: noDash(c.claim),
      kind,
      label: CLAIM_KIND[kind],
      via,
      strength: String(c.strength || '').replace(/^./, (x) => x.toUpperCase()),
      url,
      publisher: url ? publisherOf(url, brand) : '',
    };
  });
}

/**
 * The kinds of evidence on file for a product, each counted once, so the
 * page can say plainly what is there: the brand's own claims, studies of the
 * product, ingredient-level research, independent .gov sources and
 * community experience. Never treats one as another.
 */
export function evidenceLayers(product, m, { communityCount = 0 } = {}) {
  if (!product || !m) return [];
  const claims = claimRows(product);
  const count = (k) => claims.filter((c) => c.kind === k).length;
  const govUrls = new Set([...m.expert.sources, ...m.research.studies, ...m.research.ingredients.flatMap((i) => i.links)].filter((l) => l.kind.tier === 'credible').map((l) => l.url));
  const brandLinks = new Set([...m.expert.other, ...m.research.other].filter((l) => l.kind.tier === 'brand').map((l) => l.url));
  const brandCount = count('brand') + brandLinks.size + (m.independent ? 0 : 1) + (m.details.badges.length ? 1 : 0);
  return [
    brandCount > 0 && { id: 'brand', label: 'The brand’s claims', note: 'What the brand says about its own product. Not checked by ayna.' },
    count('product') > 0 && { id: 'product', label: 'Studies of this product', n: count('product'), note: 'Research on this exact product.' },
    (m.research.ingredients.length > 0 || count('ingredient') > 0) && { id: 'ingredient', label: 'Ingredient research', n: m.research.ingredients.length || count('ingredient'), note: 'About an ingredient, not this exact product.' },
    govUrls.size > 0 && { id: 'gov', label: 'Independent .gov sources', n: govUrls.size, note: 'Health pages from MedlinePlus, NIH, FDA, CDC and similar.' },
    communityCount > 0 && { id: 'community', label: 'Community experience', n: communityCount, note: 'People’s experiences. Not evidence that it works.' },
  ].filter(Boolean);
}
