/**
 * Allowlist of sources that may back a product's scientific / clinical
 * evidence (the Scientific Literature tab, clinician source chips, and the
 * evidence rail). Requested 2026-09-29: "make sure all the articles listed in
 * the scientific article section is coming from good sources, so NIH, ACOG,
 * UpToDate, CDC, etc."
 *
 * Allowed: government health agencies, professional medical societies,
 * academic medical centers, clinical reference tools, and peer-reviewed
 * journals / publishers. Not allowed: brand sites, blogs, news, consumer
 * review sites, press releases, and general health-content sites like
 * Healthline or WebMD. Those can still appear as community/social links —
 * this list only governs what counts as scientific evidence.
 *
 * Matching is by registrable domain suffix, so "pubmed.ncbi.nlm.nih.gov"
 * matches "nih.gov" and "www.acog.org" matches "acog.org".
 */
const TRUSTED_SCIENTIFIC_DOMAINS = [
  // US government health agencies and databases
  'nih.gov', // PubMed, PMC, NCBI, NCCIH, ODS, DailyMed
  'medlineplus.gov',
  'cdc.gov',
  'fda.gov',
  'hhs.gov',
  'clinicaltrials.gov',
  'womenshealth.gov',
  // International health bodies
  'who.int',
  'nhs.uk',
  'nice.org.uk',
  // Professional medical societies and guidelines
  'acog.org',
  'menopause.org', // The Menopause Society (formerly NAMS)
  'asrm.org',
  'aap.org',
  'healthychildren.org', // AAP's patient site
  'apa.org',
  'aad.org',
  'auanet.org',
  'augs.org',
  'isswsh.org',
  'smfm.org',
  'acponline.org',
  // Clinical references and academic medical centers
  'uptodate.com',
  'cochranelibrary.com',
  'mayoclinic.org',
  'hopkinsmedicine.org',
  'clevelandclinic.org',
  // Peer-reviewed journals and publishers
  'doi.org',
  'nejm.org',
  'jamanetwork.com',
  'thelancet.com',
  'bmj.com',
  'nature.com',
  'science.org',
  'sciencedirect.com',
  'cell.com',
  'springer.com',
  'link.springer.com',
  'onlinelibrary.wiley.com',
  'journals.lww.com',
  'academic.oup.com',
  'tandfonline.com',
  'journals.plos.org',
  'frontiersin.org',
  'mdpi.com',
  'jmir.org',
  'karger.com',
  'sagepub.com',
  'annals.org',
];

export function isTrustedScientificSource(url) {
  let host;
  try {
    host = new URL(url).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return false;
  }
  return TRUSTED_SCIENTIFIC_DOMAINS.some((d) => host === d || host.endsWith(`.${d}`));
}

function keepTrusted(links) {
  return (links || []).filter((link) => isTrustedScientificSource(link?.url || link?.href));
}

// verificationLinks.{doctor,scientific} come in three shapes (see
// getVerificationLinks in verificationLinks.js); filter each in place so the
// shape the rest of the app expects is preserved.
function filterLinkGroup(group) {
  if (!group) return group;
  if (Array.isArray(group)) return keepTrusted(group);
  if (Array.isArray(group.links)) return { ...group, links: keepTrusted(group.links) };
  if (group.url || group.href) return isTrustedScientificSource(group.url || group.href) ? group : { links: [] };
  return group;
}

/**
 * Drops every scientific/clinical citation that isn't from a trusted source:
 * verificationLinks.doctor and .scientific, scientificCitations, and the
 * per-ingredient ingredientScience citations. Community links are untouched.
 */
export function applyTrustedSourceGuardrail(product) {
  if (!product) return product;
  const next = { ...product };
  if (product.verificationLinks) {
    next.verificationLinks = {
      ...product.verificationLinks,
      doctor: filterLinkGroup(product.verificationLinks.doctor),
      scientific: filterLinkGroup(product.verificationLinks.scientific),
    };
    if (product.verificationLinks.doctor === undefined) delete next.verificationLinks.doctor;
    if (product.verificationLinks.scientific === undefined) delete next.verificationLinks.scientific;
  }
  if (Array.isArray(product.scientificCitations)) {
    next.scientificCitations = keepTrusted(product.scientificCitations);
  }
  if (Array.isArray(product.ingredientScience)) {
    next.ingredientScience = product.ingredientScience.map((item) => ({
      ...item,
      citations: keepTrusted(item.citations),
    }));
  }
  return next;
}
