// Source policy for every research and clinical claim on ayna.
//
// Science and clinical sources (ingredient science, clinical opinion,
// scientific literature, effectiveness, need evidence, life-stage rules)
// must come from a non-commercial domain: government (.gov, nih.gov,
// nhs.uk, who.int), academic (.edu), or a vetted non-profit (.org) such as
// a medical society, academic medical center or the journal's own .org.
// A peer-reviewed paper is linked through its PubMed or PMC record
// (pubmed.ncbi.nlm.nih.gov / pmc.ncbi.nlm.nih.gov), never the publisher's
// .com page.
//
// .com is allowed only where the page IS the thing being cited: a brand's
// own product page, label or instructions, a retailer listing (price,
// label text), or a review/community source.
//
// Vetting checklist (NIA "How to find reliable health information online"
// and MedlinePlus "Evaluating health information"):
//   - published by a government agency, academic medical center, medical
//     society, or a peer-reviewed journal
//   - strongest designs first: systematic reviews/meta-analyses, then RCTs;
//     animal, cell, case reports and small observational studies are
//     preliminary and must be described that way
//   - no preprints (medRxiv, bioRxiv, SSRN, Research Square) and no
//     commercial health blogs, even on .org

const GOV_SUFFIXES = ['.gov', '.mil', '.gov.uk', '.nhs.uk', '.gc.ca', '.gov.au', '.govt.nz', '.europa.eu', '.int'];
const GOV_HOSTS = new Set(['nhs.uk', 'who.int', 'nice.org.uk', 'canada.ca']);
const EDU_SUFFIXES = ['.edu', '.ac.uk', '.edu.au'];

// .org hosts that are NOT credible science sources (advocacy, preprints,
// open wikis, commercial). Blocked even though they are .org.
export const BLOCKED_ORG_HOSTS = new Set([
  'medrxiv.org', 'biorxiv.org', 'researchsquare.com', 'ssrn.com', 'preprints.org', 'arxiv.org', 'osf.io',
  'wikipedia.org', 'en.wikipedia.org', 'parsemus.org',
  // Not the paper itself: an index, a redirect to the publisher, a staging
  // copy of a society site, or conference abstracts that are not peer reviewed.
  'doaj.org', 'doi.org', 'dx.doi.org', 'endocrine-abstracts.org',
  'integration.asrm.org', 'integration.reproductivefacts.org', 'prod.asrm.org',
  // Journal with documented editorial-quality concerns; link the PubMed record instead.
  'europeanreview.org',
]);

export function hostOf(url) {
  try { return new URL(url).hostname.toLowerCase().replace(/^www\./, ''); } catch { return ''; }
}

export function isGovernment(host) {
  return GOV_HOSTS.has(host) || GOV_SUFFIXES.some((s) => host.endsWith(s)) || /\.gov\.[a-z]{2}$/.test(host);
}
export function isAcademic(host) {
  return EDU_SUFFIXES.some((s) => host.endsWith(s)) || /\.(edu|ac)\.[a-z]{2}$/.test(host);
}

/** True when a URL may back a science or clinical claim. */
export function isCredibleScienceSource(url) {
  const host = hostOf(url);
  if (!host) return false;
  if (BLOCKED_ORG_HOSTS.has(host) || [...BLOCKED_ORG_HOSTS].some((b) => host.endsWith(`.${b}`))) return false;
  if (isGovernment(host) || isAcademic(host)) return true;
  if (host.endsWith('.org') || host.endsWith('.org.uk') || host.endsWith('.org.au')) return true;
  return false;
}

// Keys whose URLs back science or clinical claims. Everything under these
// keys must pass isCredibleScienceSource.
export const SCIENCE_KEYS = new Set([
  'citations', 'clinicalNoteSources', 'clinicalSources', 'scienceSources', 'effectivenessSources',
  'evidenceSources', 'scientificSources', 'literatureSources', 'sources',
]);

// Site-wide: hosts that are journal publishers or commercial health-content
// sites on .com. Any link to them anywhere in the site or app must be replaced
// with the same paper's PubMed/PMC record or a .gov/.org page. Reviews of a
// specific product (the founders' "review" exception) are listed explicitly.
export const COMMERCIAL_HEALTH_HOSTS = /(^|\.)(uptodate|healthline|webmd|verywellhealth|verywellmind|verywellfamily|medicalnewstoday|everydayhealth|drugs|goodrx|statpearls|cureus|sciencedirect|onlinelibrary\.wiley|wiley|tandfonline|sagepub|springer|springeropen|biomedcentral|mdpi|mdpi-res|jamanetwork|bmj|thelancet|nature|oup|cochranelibrary|thieme-connect|lww|karger|mdedge|deepdyve|informahealthcare|researchgate|academia)\.com$/;
export const ALLOWED_PRODUCT_REVIEWS = new Set([
  'https://www.medicalnewstoday.com/articles/wisp-review',
]);
export function isCommercialHealthSource(url) {
  if (ALLOWED_PRODUCT_REVIEWS.has(url)) return false;
  return COMMERCIAL_HEALTH_HOSTS.test(hostOf(url));
}
