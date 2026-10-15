/**
 * Amazon ASINs that must never be a Buy destination, from the Chrome identity
 * check on 2026-10-15 (docs/commerce/audit/chrome_amazon_findings_2026-10-15.json).
 * Each one opens a different product, a different product line, or a listing
 * Amazon shows as unavailable. Products that used them fall back to the brand
 * site (or to a size's own exact child ASIN). Remove an entry only after a
 * person confirms the listing again.
 */
export const AMAZON_ASIN_BLOCKS = Object.freeze({
  B0FB4BCFJP: { productId: 'd-initio', reason: 'WRONG_PRODUCT', note: 'Opens Inito test strips (pack of 30), not the Inito Fertility Monitor' },
  B0862FCV4C: { productId: 'p-willow-pump', reason: 'WRONG_PRODUCT', note: 'Opens Willow 360 milk containers (2 count), not the Willow pump' },
  B07Z4W4KZB: { productId: 'p-belly-bandit', reason: 'WRONG_BRAND', note: 'Opens a KeaBabies belly band; the Belly Bandit sizes keep their own child ASINs' },
  B09JQ4G62Q: { productId: 'p-saalt-cup', reason: 'WRONG_PRODUCT_LINE', note: 'Opens the Saalt Soft cup in Mountain Iris, a line and colour Ayna does not list' },
  B0BTPVSHKD: { productId: 'p-period-co-underwear', reason: 'WRONG_PRODUCT_LINE', note: 'Opens the medium-flow high-waist brief, size M, not the organic cotton heavy-flow bikini' },
  B0D6SPZV9V: { productId: 'p-thinx', reason: 'WRONG_PRODUCT_LINE', note: 'Opens Thinx for All hi-waist, size XL 2-pack' },
  B0HFTVGGSP: { productId: 'p-knix-underwear', reason: 'LISTING_UNAVAILABLE', note: 'Currently unavailable; also pins size S 3-pack' },
  B09CZWML57: { productId: 'p-proof-period', reason: 'LISTING_UNAVAILABLE', note: 'Currently unavailable; also pins size XL' },
  B0CLSXCD1K: { productId: 'p-period-co-underwear', reason: 'WRONG_PRODUCT_LINE', note: 'High-waisted heavy-flow style, size XS; Ayna lists the bikini' },
  B0CLSTBLVN: { productId: 'p-period-co-underwear', reason: 'WRONG_PRODUCT_LINE', note: 'High-waisted heavy-flow style, size S; Ayna lists the bikini' },
  B0CLSJDG22: { productId: 'p-period-co-underwear', reason: 'WRONG_PRODUCT_LINE', note: 'High-waisted heavy-flow style, size L; Ayna lists the bikini' },
  B0CLSGCQHJ: { productId: 'p-period-co-underwear', reason: 'WRONG_PRODUCT_LINE', note: 'High-waisted heavy-flow style, size 2X; Ayna lists the bikini' },
  B0CLSH74KW: { productId: 'p-period-co-underwear', reason: 'LISTING_UNAVAILABLE', note: 'Size M child no longer resolves to a buyable size' },
});

/** True when this URL or ASIN points at a blocked Amazon listing. */
export function isBlockedAmazon(urlOrAsin) {
  const s = String(urlOrAsin || '').toUpperCase();
  const asin = /^[A-Z0-9]{10}$/.test(s) ? s : (s.match(/\/(?:DP|GP\/PRODUCT|O\/ASIN)\/([A-Z0-9]{10})/) || [])[1];
  return Boolean(asin && AMAZON_ASIN_BLOCKS[asin]);
}
