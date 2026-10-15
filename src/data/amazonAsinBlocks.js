/**
 * Amazon ASINs that must not be a Buy destination, from the Chrome identity
 * checks on 2026-10-15 (docs/commerce/audit/chrome_amazon_findings_2026-10-15.json
 * and docs/commerce/AMAZON_CHROME_CHECK.md). EXACT means exact: a listing for a
 * different item, size, count, pack, bundle, flavour, formula or style, or one
 * Amazon shows as unavailable, is never used. Those products fall back to the
 * exact brand-site offer, or to no Buy button if there is none.
 *
 * scope 'all'     : never route to this ASIN.
 * scope 'product' : only blocked as the product-level (no size chosen) link;
 *                   the same ASIN is still the exact listing for one option.
 *
 * Remove an entry only after a person confirms the listing again.
 */
const B = (category, productId, note, scope = 'all') => ({ category, productId, note, scope });
const WRONG_ITEM = 'BLOCKED_WRONG_ITEM';
const WRONG_VARIANT = 'BLOCKED_WRONG_VARIANT';
const UNAVAILABLE = 'BLOCKED_UNAVAILABLE';

export const AMAZON_ASIN_BLOCKS = Object.freeze({
  // Wrong product, brand, product line or formula.
  B0FB4BCFJP: B(WRONG_ITEM, 'd-initio', 'Inito test strips (pack of 30), not the Inito Fertility Monitor'),
  B0862FCV4C: B(WRONG_ITEM, 'p-willow-pump', 'Willow 360 milk containers (2 count), not the Willow pump'),
  B07Z4W4KZB: B(WRONG_ITEM, 'p-belly-bandit', 'KeaBabies belly band, not Belly Bandit'),
  B09JQ4G62Q: B(WRONG_ITEM, 'p-saalt-cup', 'Saalt Soft cup in Mountain Iris, a line and colour Ayna does not list'),
  B0BTPVSHKD: B(WRONG_ITEM, 'p-period-co-underwear', 'Medium-flow high-waist brief, not the organic cotton heavy-flow bikini'),
  B0CLSXCD1K: B(WRONG_ITEM, 'p-period-co-underwear', 'High-waisted style (XS); Ayna lists the bikini'),
  B0CLSTBLVN: B(WRONG_ITEM, 'p-period-co-underwear', 'High-waisted style (S); Ayna lists the bikini'),
  B0CLSJDG22: B(WRONG_ITEM, 'p-period-co-underwear', 'High-waisted style (L); Ayna lists the bikini'),
  B0CLSGCQHJ: B(WRONG_ITEM, 'p-period-co-underwear', 'High-waisted style (2X); Ayna lists the bikini'),
  B0D6SPZV9V: B(WRONG_ITEM, 'p-thinx', 'Thinx for All (a separate line), size XL 2-pack'),
  B0C61VBVJC: B(WRONG_ITEM, 'p-cranberry-supplement', 'Softgels; the Ayna option is caplets'),
  B000BFL5SK: B(WRONG_ITEM, 'p-good-clean-love', 'Restore gel; Ayna names "Bio-Match Moisturizer", which is a technology used in more than one Good Clean Love moisturizer, so the item is not established'),
  B0BFGZ8NS2: B(WRONG_ITEM, 'p-rituals-prenatal', 'The Mint ASIN now opens Citrus; Mint is not on the Amazon listing (ritual.com still sells Mint)'),
  B078TGP8BK: B(WRONG_ITEM, 'p-evening-primrose', 'NOW Evening Primrose Oil 1,000 mg, 90 softgels; Ayna says 100 softgels, which NOW sells only as the 500 mg product, so strength and count are not established'),

  // Right product, wrong count, pack, bundle or pinned size.
  B0H8VXGSWB: B(WRONG_VARIANT, 'p-always-infinity', '60 count; Ayna says 18 (no 18-count found on Amazon)'),
  B003VD5TMM: B(WRONG_VARIANT, 'p-always-liners', '162 count; Ayna says 42 (no 42-count found on Amazon)'),
  B07XR7DVL4: B(WRONG_VARIANT, 'p-cora-organic-pads', 'Regular 36; Ayna option is the Target 32-count'),
  B08288RTFX: B(WRONG_VARIANT, 'p-cora-organic-pads', 'Super 36; Ayna option is the Target 30-count'),
  B07XL578S2: B(WRONG_VARIANT, 'p-cora-overnight', 'Overnight 36; Ayna option is the Target 28-count'),
  B0DH6S25DP: B(WRONG_VARIANT, 'p-cora-organic-pads', 'Extra Heavy Overnight 24; Ayna option is the Target 20-count'),
  B06XKF4RMW: B(WRONG_VARIANT, 'p-cora-organic-tampons', 'Regular 72; Ayna option is the Target 32-count'),
  B06ZYRXLNV: B(WRONG_VARIANT, 'p-cora-organic-tampons', '18 Regular + 18 Super (36); Ayna option is the Target 32-count'),
  B0742LBKKS: B(WRONG_VARIANT, 'p-cora-organic-tampons', 'Light/Regular 72; Ayna option is the Target 32-count'),
  B0DX2J1NFW: B(WRONG_VARIANT, 'p-l-pad', '56 count; the 42-count is B0FQPVVD1S'),
  B07SVJJ7V4: B(WRONG_VARIANT, 'p-d-mannose-now', '300 capsules; the 60-capsule bottle is B0C545MBRC'),
  B071NLD52C: B(WRONG_VARIANT, 'p-rael-overnight', 'Overnight 40; Ayna says 12 (Amazon 12-count is XL Overnight, not confirmed as the same pad)'),
  B083C6BYG9: B(WRONG_VARIANT, 'p-rael-tampon', '40-count bundle; Ayna says 32 (none found)'),
  B0CRKW8DFJ: B(WRONG_VARIANT, 'p-remifemin', '120 tablets; the 60-tablet box is B0CRKXS5LJ'),
  B08W21JZJ8: B(WRONG_VARIANT, 'p-tena-intimates-very-light-liner', '300 count; the 50-count is B08D74XH82'),
  B00BM90GCA: B(WRONG_VARIANT, 'p-u-kotex-pad', 'CleanWear 50 count; Ayna says 18 (no 18-count CleanWear found)'),
  B07BKBCFDL: B(WRONG_VARIANT, 'p-intimate-rose', 'Large pack, sizes 5-8 (4 pieces); Ayna says 8-piece set (none found)'),
  B0B33HDMQ3: B(WRONG_VARIANT, 'p-tampax-radiant', '84 count; Ayna says 18, which tampax.com no longer lists'),
  B09LHCN264: B(WRONG_VARIANT, 'p-thermacare', '6 count; Ayna sells the 4-count (Target)'),
  B086RQVNDV: B(WRONG_VARIANT, 'p-magnesium-glycinate', '180 capsules; the 60-count is B08XXHCGZT'),
  B00DN4VCA2: B(WRONG_VARIANT, 'p-natures-bounty-d3-125mcg', '240 softgels; the 150-count is B002Y27LLS'),
  B004RR1FF6: B(WRONG_VARIANT, 'p-cranberry-supplement', '100 softgels; the 50-caplet box is B0012JY42I'),
  B08TLT6BF7: B(WRONG_VARIANT, 'p-diva-cup', 'Model 0 + DivaWash bundle; the cup alone is B07KGZ9NMV'),
  B08TLJPR71: B(WRONG_VARIANT, 'p-diva-cup', 'Model 1 + DivaWash bundle; no cup-only Model 1 found'),
  B08TLMWZB4: B(WRONG_VARIANT, 'p-diva-cup', 'Model 2 + DivaWash bundle; no cup-only Model 2 found'),
  B07QD4W7RQ: B(WRONG_VARIANT, 'p-flex-cup', 'Starter kit (cup + 2 discs), size 01; no cup-only listing found'),
  B07QHG6ZY8: B(WRONG_VARIANT, 'p-flex-cup', 'Starter kit (cup + 2 discs), size 02; no cup-only listing found'),
  B01JXA3JNW: B(WRONG_VARIANT, 'p-lena-cup', 'Two-cup set; each Lena size/colour keeps its own single-cup listing'),
  B0DB83YP4H: B(WRONG_VARIANT, 'p-bodyform-pad', '60 pads + 60 liners combo, not pads only'),
  B0CSRF3Y2F: B(WRONG_VARIANT, 'd-oura', 'Pins Heritage Black, ring size 11'),
  B0CMDRQ4TT: B(WRONG_VARIANT, 'p-hanes-period', 'Pins size XL 3-pack'),
  B0BNP9RJZH: B(WRONG_VARIANT, 'p-bambody-underwear', 'Pins size XXL 3-pack'),
  B09P1RYJCG: B(WRONG_VARIANT, 'p-depend-silhouette-underwear', 'Pins size Large'),
  B0DW9CB9JH: B(WRONG_VARIANT, 'p-tomboyx-period', 'Pins 9-inch boxer brief, size XXL'),
  B0GG6HHCYM: B(WRONG_VARIANT, 'p-viboos-heating-pad', 'Pins one size and colour (24x12, Grey Green)'),
  B071VBZLPX: B(WRONG_VARIANT, 'p-rael-organic-pad', 'Regular 56; Ayna product is Large pads (Large 24 and 14 keep their own listings)', 'product'),
  B07258JQ9M: B(WRONG_VARIANT, 'p-rael-liners', 'Regular 44; Ayna sells 60/40/20 (60 is B071YSFXMN)', 'product'),
  B0DNNJWXMQ: B(WRONG_VARIANT, 'p-boppy-pillow', 'Pins the Gray Gentle Leaves print when no print is chosen', 'product'),
  B07TFHKHM4: B(WRONG_VARIANT, 'p-lumma-disc', 'Pins Short / Unicorn when no size is chosen', 'product'),
  B0091CG65G: B(WRONG_VARIANT, 'p-estroven-mood', 'Pins the 30-count when no size is chosen; the 30 option keeps it', 'product'),

  // Unavailable on Amazon.
  B0HFTVGGSP: B(UNAVAILABLE, 'p-knix-underwear', 'Currently unavailable; also pins size S 3-pack'),
  B09CZWML57: B(UNAVAILABLE, 'p-proof-period', 'Currently unavailable; also pins size XL'),
  B00ZAVDST4: B(UNAVAILABLE, 'p-veeda-pad', '14-count currently unavailable'),
  B01N1ZHI2A: B(UNAVAILABLE, 'p-veeda-pad', '42-count currently unavailable'),
  B0CLSH74KW: B(UNAVAILABLE, 'p-period-co-underwear', 'Size M child no longer resolves to a buyable size'),
});

function asinOf(urlOrAsin) {
  const s = String(urlOrAsin || '').toUpperCase();
  return /^[A-Z0-9]{10}$/.test(s) ? s : (s.match(/\/(?:DP|GP\/PRODUCT|O\/ASIN)\/([A-Z0-9]{10})/) || [])[1] || null;
}

/**
 * True when this URL or ASIN must not be used. Pass productLevel: true when
 * it would be the product's own link with no size chosen.
 */
export function isBlockedAmazon(urlOrAsin, { productLevel = false } = {}) {
  const block = AMAZON_ASIN_BLOCKS[asinOf(urlOrAsin)];
  if (!block) return false;
  return block.scope === 'all' || productLevel;
}
