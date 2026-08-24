// Resolves a real product image for products with placeholder images via /api/product-image
// Results are cached in localStorage so the lookup only ever runs once per product.

// Bumped v6 -> v7 alongside the server-side cache key: added Serper.dev
// image search as a final resolver tier — a product a browser cached as ''
// under v6 (brand site blocked bots, or no catalog url at all) can now
// resolve to a real photo.
const LS_KEY = 'ayna_product_images_v7';
const memCache = new Map();

function lsRead() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}'); } catch { return {}; }
}
function lsWrite(key, url) {
  try {
    const obj = lsRead();
    obj[key] = url;
    localStorage.setItem(LS_KEY, JSON.stringify(obj));
  } catch {}
}

// Keywords indicating a logo/icon/banner rather than an actual product
// photo. Mirrors api/_ogImageFetch.js's NON_PRODUCT_IMAGE_PATTERN (the
// server-side gate applied to every LIVE resolution) — this client-side
// copy is what's actually missing for hardcoded catalog data: a value baked
// directly into src/data/*.js never goes through the server at all, so
// only THIS function stands between a catalog entry's own bad `image`
// field and the screen. Two real production cases slipped through for
// weeks because this list was narrower than the server's: Cora Organic
// Pads/Tampons (src/data/mvpProducts.js) had a literal
// "Logo_33a7614e...png" as their hardcoded image, and Pink Stork Bloat
// Support had "PINKSTORK_Logo_crop....svg" — this file's "logo" keyword
// check and (still below) SVG check now catch both categorically instead
// of needing another one-by-one data sweep every time a new brand's
// hardcoded entry has this same bug.
//
// Uses letter-adjacency lookaround, NOT \b — Shopify's own filename
// convention is underscore-separated ("Logo_33a7614e...", "TomboyX_Logo_
// Black...") and \b treats `_` as a word character, so a plain \blogo\b
// would silently fail to match the exact real-world case this exists for.
// Digits/underscores/punctuation on either side still count as a boundary;
// only an adjacent LETTER blocks the match — which is also what's needed
// to avoid a false hit inside an unrelated word (see below).
//
// "hero" was tried and removed: running this same audit against the full
// catalog flagged two genuine studio product photos (Elvie Pelvic Floor
// Trainer's "..._Web_Hero_1200x1200...", Stayfree's "1_Hero_...") — "hero
// shot"/"hero image" is standard product-photography terminology, not a
// marketing-banner signal, so it produced false positives with no
// corresponding real catch once the one case it existed for (Wisp's
// digital/telehealth Meta_Hero image) is already exempted by allowBrandLogo.
const NON_PRODUCT_IMAGE_PATTERN = /(?<![a-z])(?:logo|icon|badge|banner|header|sprite|placeholder|social[-_]?share|og[-_]?default)(?![a-z])/i;

function isVectorAssetUrl(src) {
  try {
    return /\.svg(\?|$)/i.test(new URL(src).pathname);
  } catch {
    return /\.svg(\?|$)/i.test(src);
  }
}

/**
 * @param {string} imageUrl
 * @param {boolean} [allowBrandLogo] - true for products with no physical
 *   form (type === 'digital': apps, telehealth/virtual-care services) —
 *   a brand logo/icon/marketing image genuinely IS the product's real
 *   "photo" there (Wisp, Hers, Midi, Pomelo Care all correctly hardcode a
 *   brand image in the catalog). Everything else keeps the strict
 *   rejection: a logo standing in for an actual product photo is a real
 *   bug (Cora, Pink Stork).
 */
export function isPlaceholderProductImage(imageUrl, allowBrandLogo = false) {
  const src = String(imageUrl || '').trim();
  if (!src) return true; // empty string — LLM products always start with ""
  if (src === '/ayna_placeholder.png' || src === '/startup_placeholder.png') return true;
  // logo.clearbit.com is an unreliable free logo API used by some catalog entries
  // (Pomelo Care, Nurx, Happi, Hers, Midi, etc.) — treat it as a placeholder too so
  // those products get queued for a real photo via /api/product-image instead of
  // being left on a logo that may 404 and fall back to a generic brand block.
  if (/^https?:\/\/logo\.clearbit\.com\//i.test(src)) return true;
  // A handful of catalog entries had a site favicon hardcoded as `image`
  // directly (e.g. intimina.com/.../favicon.ico on the Intimina Kegel
  // Exerciser) — the exact "tiny icon rendered as product photo" bug found
  // in QA, just baked into the data instead of coming from the dynamic
  // resolver's now-removed favicon fallback (see api/_ogImageFetch.js).
  // Was .ico-only, and required "favicon" to be directly followed by a file
  // extension — missed real hardcoded cases like ".../favicon-300x300.png"
  // (Glow) and ".../favicon/nurx.png" (Nurx), where "favicon" is a filename
  // stem or directory segment, not immediately pre-extension. A plain
  // substring match catches all of these; nothing legitimate has "favicon"
  // anywhere in a real product-photo URL. Also catches apple-touch-icon
  // files (Libresse, Citracal, LELO), the other common site-icon convention.
  // Checked unconditionally (even when allowBrandLogo) — a bare favicon is
  // too small/generic to pass as a real app icon regardless of product type.
  if (/favicon/i.test(src) || /apple-touch-icon/i.test(src)) return true;
  if (allowBrandLogo) return false;
  if (NON_PRODUCT_IMAGE_PATTERN.test(src)) return true;
  if (isVectorAssetUrl(src)) return true;
  return false;
}

/**
 * A raw `product.image` field is only ever safe to render directly if it
 * ISN'T a placeholder — a bare `product.image ? <img src={product.image}> :
 * fallback` truthiness check (found repeated across ~10 components) treats
 * `/ayna_placeholder.png` (a real, non-empty file path) as "has a real
 * photo," rendering that literal branded marketing image — visible "AYNA —
 * Truth in Women's Health" text — on a product card as if it were the
 * actual product. Use this everywhere a component decides whether to render
 * `product.image` vs. an initial-letter/blank fallback, instead of a bare
 * truthiness check on the raw field.
 */
export function safeProductImageSrc(imageUrl, allowBrandLogo = false) {
  return isPlaceholderProductImage(imageUrl, allowBrandLogo) ? '' : String(imageUrl || '');
}

export async function resolveProductImage(name, brand, url, type) {
  if (!name) return '';
  const key = `${brand || ''}|${name}`;

  // memCache holds either a resolved string or an in-flight Promise. Storing
  // the promise BEFORE awaiting is what dedupes concurrent callers: two effects
  // resolving the same product in the same tick (MyEcosystem walks the tiers in
  // two separate effects) both missed the cache and both spent a paid credit.
  if (memCache.has(key)) return memCache.get(key);

  const stored = lsRead();
  if (key in stored) {
    memCache.set(key, stored[key]);
    return stored[key];
  }

  const inFlight = (async () => {
    try {
      const params = new URLSearchParams({ name, brand: brand || '' });
      if (url) params.set('url', url);
      if (type) params.set('type', type);
      const res = await fetch(`/api/product-image?${params}`, {
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) {
        // Do NOT persist a transient failure. A 429/5xx was previously written
        // to localStorage as '' and pinned for good, so a product that briefly
        // failed never got an image again on that browser.
        memCache.delete(key);
        return '';
      }
      const data = await res.json();
      const resolvedUrl = data?.imageUrl || '';
      memCache.set(key, resolvedUrl);
      // The server only attempts resolution (and only caches a negative
      // result itself) when a page `url` was supplied — mirror that here.
      // Pinning '' from a call that had no url would permanently block a
      // later call for the same product that does have one.
      if (resolvedUrl || url) lsWrite(key, resolvedUrl);
      return resolvedUrl;
    } catch {
      memCache.delete(key);
      return '';
    }
  })();

  memCache.set(key, inFlight);
  return inFlight;
}
