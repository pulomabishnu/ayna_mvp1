/**
 * Where "How to use" steps come from (founder rule, Oct 24): product facts are
 * cited to the brand's own site. A .gov page (FDA label, NCBI) is fine too. A
 * seller's page (Amazon, a reseller like kateminimalist.com) is not shown as a
 * source: the steps say "From the product listing" instead, with no link and
 * nothing that implies ayna checked it.
 */
const slugOf = (brand) => String(brand || '').toLowerCase().replace(/[^a-z0-9]/g, '');

export function isBrandOrGovSource(url, brand) {
  let host = '';
  try { host = new URL(String(url || '')).hostname.toLowerCase().replace(/^www\./, ''); } catch { return false; }
  if (!host) return false;
  if (/\.gov$/.test(host)) return true;
  const slug = slugOf(brand);
  return slug.length >= 3 && host.replace(/[^a-z0-9]/g, '').includes(slug);
}

export const FROM_LISTING = 'From the product listing';

/** howToUse with a non-brand source replaced by { fromListing: true } (no URL, no label). */
export function brandHowTo(howToUse, brand) {
  if (!howToUse || !howToUse.sourceUrl) return howToUse;
  if (isBrandOrGovSource(howToUse.sourceUrl, brand)) return howToUse;
  return { ...howToUse, sourceUrl: undefined, sourceLabel: undefined, fromListing: true };
}
