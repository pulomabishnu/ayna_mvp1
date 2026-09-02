/**
 * Deterministic "where to buy" links.
 *
 * The catalog (src/data/*.js) and the live AI-suggestion path
 * (api/search-suggestions.js) both store `whereToBuy` as plain retailer NAME
 * strings — almost never a real per-retailer URL (whereToBuyLinks exists on
 * only a handful of catalog entries, and the AI path never emits it at all,
 * by design — the prompt explicitly forbids the model from inventing URLs).
 *
 * This module never asks an LLM, and never claims a specific product page,
 * price, or availability exists at a retailer — it only builds a real,
 * functioning SEARCH-RESULTS URL for a known retailer's own site search, so
 * a user can go compare for herself. That's the key safety property: unlike
 * a fabricated price (the LOLA Liners incident this file exists to prevent a
 * repeat of), "here's Amazon's search results for this product name" cannot
 * be wrong in the same way — worst case it's a mediocre search, never a
 * false claim.
 */

const encode = (s) => encodeURIComponent(String(s || '').trim());

// Retailer name (lowercased, whitespace-collapsed) -> query -> real search URL.
// Only retailers whose site-search URL pattern is well-known and stable.
const RETAILER_SEARCH_BUILDERS = {
  amazon: (q) => `https://www.amazon.com/s?k=${q}`,
  target: (q) => `https://www.target.com/s?searchTerm=${q}`,
  walmart: (q) => `https://www.walmart.com/search?q=${q}`,
  cvs: (q) => `https://www.cvs.com/search?searchTerm=${q}`,
  'cvs pharmacy': (q) => `https://www.cvs.com/search?searchTerm=${q}`,
  walgreens: (q) => `https://www.walgreens.com/search/results.jsp?Ntt=${q}`,
  iherb: (q) => `https://www.iherb.com/search?kw=${q}`,
  'app store': (q) => `https://apps.apple.com/us/search?term=${q}`,
  'google play': (q) => `https://play.google.com/store/search?q=${q}&c=apps`,
  google: (q) => `https://www.google.com/search?tbm=shop&q=${q}`,
};

// Descriptive phrases the catalog/AI path sometimes puts in `whereToBuy`
// that are not actually a place to search (a prescriber, a note about how a
// product is obtained, or too vague to point anywhere real). Never worth a
// generated link — better to show as plain text than a misleading one.
const SKIP_PHRASES = new Set([
  'brand website',
  'brand site',
  'clinic insertion',
  'pharmacy with prescription',
  'pre-installed on iphone',
  'pelvic floor pt retailers',
]);

// Some catalog entries already store a literal domain as the "retailer" name
// (e.g. 'LOLA.com', 'Thorne.com', 'FemmyCycle.com') rather than a brand name.
// That's not a guess — it's already the exact value the catalog authored —
// so it's safe to link straight to that site's homepage.
function isLikelyDomain(name) {
  const trimmed = name.trim();
  return !/\s/.test(trimmed) && /^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(trimmed);
}

/** Best available search query for a product: "<brand> <name>" or whichever half exists. */
export function buildRetailerQuery(product) {
  return [product?.brand, product?.name].filter(Boolean).join(' ').trim();
}

/**
 * Resolve a single retailer name to a URL, or null if it shouldn't be linked
 * at all (a descriptive phrase, or no product name to search for).
 *
 * `specific` distinguishes a link that's actually scoped to THIS product
 * (a known retailer's own site-search, or an explicit whereToBuyLinks URL)
 * from one that isn't (a bare brand/retailer homepage, or the generic Google
 * Shopping catch-all) — callers preferring "get me to the actual product"
 * over "get me to the general site" use this to rank results.
 */
export function getRetailerLink(retailerName, product) {
  const name = String(retailerName || '').trim();
  if (!name) return null;
  const lower = name.toLowerCase().replace(/\s+/g, ' ');
  if (SKIP_PHRASES.has(lower)) return null;

  if (isLikelyDomain(name)) {
    return { url: `https://${name.replace(/^https?:\/\//i, '')}`, specific: false };
  }

  const query = buildRetailerQuery(product);
  if (!query) return null;

  const builder = RETAILER_SEARCH_BUILDERS[lower];
  if (builder) return { url: builder(encode(query)), specific: true };

  // Unrecognized retailer name (e.g. "Whole Foods", "Sephora", "Kroger") —
  // no confident URL pattern, so fall back to a Google Shopping search that
  // includes the retailer's name, rather than guess at that site's own
  // search URL and risk a broken link.
  return { url: `https://www.google.com/search?tbm=shop&q=${encode(`${name} ${query}`)}`, specific: false };
}

/**
 * Builds the list of clickable retailer links for a product's `whereToBuy`
 * array, preferring a real explicit URL from `whereToBuyLinks` (when one
 * exists and is a genuine http(s) URL) over a generated search link.
 * Never includes a price or any per-retailer claim — name + link only.
 *
 * `specific` (see getRetailerLink) is true for an explicit whereToBuyLinks
 * URL or a known retailer's own site-search; false for a bare domain
 * fallback or the generic Google Shopping catch-all.
 *
 * @returns {{ name: string, url: string, verified: boolean, specific: boolean }[]}
 */
export function getRetailerLinks(product) {
  const shops = Array.isArray(product?.whereToBuy) ? product.whereToBuy : [];
  const explicitLinks =
    product?.whereToBuyLinks && typeof product.whereToBuyLinks === 'object' ? product.whereToBuyLinks : {};

  const seen = new Set();
  const out = [];
  for (const shop of shops) {
    const name = String(shop || '').trim();
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;

    const explicit = explicitLinks[shop];
    const explicitUrl =
      typeof explicit === 'string' && /^https?:\/\//i.test(explicit.trim()) ? explicit.trim() : null;
    const resolved = explicitUrl ? { url: explicitUrl, specific: true } : getRetailerLink(name, product);
    if (!resolved) continue;

    seen.add(key);
    out.push({ name, url: resolved.url, verified: Boolean(explicitUrl), specific: resolved.specific });
  }
  return out;
}
