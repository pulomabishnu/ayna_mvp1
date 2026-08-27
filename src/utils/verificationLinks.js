/**
 * product.verificationLinks.{doctor,scientific,community} has landed in the
 * catalog in three different shapes over time — {links:[...]} (the shape
 * every reader assumed), a bare array [...], and (for many `doctor` entries
 * specifically) a single bare citation object with no wrapper at all. Every
 * component that read `.links` directly silently dropped the entries in the
 * other two shapes — confirmed live 2026-08-25: real scientific citations on
 * ~130+ products, but the "sci lit" row in the product evidence rail was
 * missing for products whose data happened to be in one of the other shapes
 * (a bare-array or single-object `scientific`/`doctor` entry never has a
 * `.links` property, so `?.links?.length` reads as 0/undefined every time).
 *
 * Normalizes any of the three shapes to a plain array of link objects.
 */
export function getVerificationLinks(product, key) {
  const v = product?.verificationLinks?.[key];
  if (!v) return [];
  if (Array.isArray(v)) return v;
  if (Array.isArray(v.links)) return v.links;
  // A single bare citation object — has its own url/text rather than a `links` wrapper.
  if (typeof v === 'object' && (v.url || v.text)) return [v];
  return [];
}

// A short, real name for a source URL's host — shared by every place that
// turns a citation link into a clickable chip, so "ACOG"/"NIH"/etc. read the
// same way everywhere. Falls back to a title-cased guess from the domain
// itself rather than a generic "Source" label, but never invents an
// institution name that isn't actually the linked domain.
const FRIENDLY_HOSTS = {
  'acog.org': 'ACOG',
  'www.acog.org': 'ACOG',
  'mayoclinic.org': 'Mayo Clinic',
  'www.mayoclinic.org': 'Mayo Clinic',
  'fda.gov': 'FDA',
  'www.fda.gov': 'FDA',
  'pubmed.ncbi.nlm.nih.gov': 'PubMed',
  'ncbi.nlm.nih.gov': 'NIH',
  'www.ncbi.nlm.nih.gov': 'NIH',
  'nih.gov': 'NIH',
  'www.nih.gov': 'NIH',
  'ods.od.nih.gov': 'NIH',
  'cdc.gov': 'CDC',
  'www.cdc.gov': 'CDC',
  'medlineplus.gov': 'MedlinePlus',
  'reddit.com': 'Reddit',
  'www.reddit.com': 'Reddit',
  'tiktok.com': 'TikTok',
  'www.tiktok.com': 'TikTok',
  'youtube.com': 'YouTube',
  'youtu.be': 'YouTube',
  'instagram.com': 'Instagram',
  'www.instagram.com': 'Instagram',
  'facebook.com': 'Facebook',
  'nytimes.com': 'NYT Wirecutter',
  'thewirecutter.com': 'NYT Wirecutter',
  'instyle.com': 'InStyle',
  'hopkinsmedicine.org': 'Johns Hopkins Medicine',
  'www.hopkinsmedicine.org': 'Johns Hopkins Medicine',
  'healthline.com': 'Healthline',
  'www.healthline.com': 'Healthline',
  'webmd.com': 'WebMD',
  'www.webmd.com': 'WebMD',
};

export function hostLabel(url) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    if (FRIENDLY_HOSTS[host]) return FRIENDLY_HOSTS[host];
    const parts = host.split('.');
    const base = parts.length >= 2 ? parts[parts.length - 2] : host;
    return base.charAt(0).toUpperCase() + base.slice(1);
  } catch {
    return null;
  }
}

// Dedupes a batch of citation links into clickable {label, url, text} chips,
// keyed by URL (not by host — two different NIH pages should both show up).
export function toSourceChips(links) {
  const chips = [];
  const seenUrls = new Set();
  for (const link of links) {
    const url = link?.url || link?.href;
    if (!url || seenUrls.has(url)) continue;
    const label = hostLabel(url);
    if (!label) continue;
    seenUrls.add(url);
    chips.push({ label, url, text: link.text || null });
  }
  return chips;
}
