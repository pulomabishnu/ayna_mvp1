/**
 * Every buy link is a redirect to the seller (ayna has no checkout yet), so
 * the button area says so in plain words (team direction 26).
 */
export function sellerFromUrl(url) {
  if (!url) return '';
  if (/amazon\.|amzn\./i.test(url)) return 'Amazon';
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return ''; }
}

/** "You’re leaving ayna to buy at LOLA." ('' with no link). */
export function leavingLine(url, seller = '', verb = 'buy') {
  if (!url) return '';
  const where = String(seller || sellerFromUrl(url)).trim();
  return where && where.length <= 40 ? `You’re leaving ayna to ${verb} at ${where}.` : `You’re leaving ayna to ${verb} on the seller’s site.`;
}
