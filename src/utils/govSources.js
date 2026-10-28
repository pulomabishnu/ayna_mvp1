// Founder rule (Oct 24 2026): clinical and health claims are checked only
// against reputable .gov health sites: MedlinePlus, NIH and its institutes
// (ODS, NCCIH, NICHD, NIMH, NHLBI, NIDDK, NLM incl. DailyMed and Bookshelf),
// FDA, CDC, womenshealth.gov, AHRQ (and HHS, which runs womenshealth.gov).
// A PubMed or PMC paper counts only once someone has opened and checked it,
// so a bare PubMed/PMC link is not treated as a checked source here.
// Product facts and label warnings may come from the brand's own site,
// shown as the brand's claim (see linkKind in components/pdp/evidenceModel.js).
const GOV_HEALTH_HOST = /(^|\.)(nih\.gov|medlineplus\.gov|fda\.gov|cdc\.gov|womenshealth\.gov|ahrq\.gov|hhs\.gov)$/i;
const PAPER_HOST = /^(pubmed|pmc)\.ncbi\.nlm\.nih\.gov$/i;

function parse(url) {
  try { return new URL(url); } catch { return null; }
}

/** A PubMed or PMC paper link (a .gov host, but a paper we have not opened). */
export function isPaperLink(url) {
  const u = parse(url);
  if (!u) return false;
  const host = u.hostname.replace(/^www\./, '');
  return PAPER_HOST.test(host) || (/^ncbi\.nlm\.nih\.gov$/i.test(host) && /^\/(pmc|pubmed)\//i.test(u.pathname));
}

/** A page on one of the allowed .gov health sites (not a PubMed/PMC paper, not a search page). */
export function isGovHealthSource(url) {
  const u = parse(url);
  if (!u || !/^https?:$/.test(u.protocol)) return false;
  if (/\/search\b|[?&#](q|query|search)=/i.test(u.pathname + u.search + u.hash)) return false;
  return GOV_HEALTH_HOST.test(u.hostname) && !isPaperLink(url);
}
