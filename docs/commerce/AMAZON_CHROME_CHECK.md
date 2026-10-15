# Amazon identity and variant check in Chrome (2026-10-15)

**How the check was done**
- Each listing in the review queue was opened one at a time at a plain `amazon.com/dp/<ASIN>` link with **no affiliate tag**, so the checks never count as ayna clicks.
- For each listing I recorded the title, brand, the selected size/colour/count, Amazon's own list of sizes for that listing, the details table and the availability text.
- **Prices were not read or saved.** Amazon images were compared by file name only; none were saved.
- Raw findings are in `audit/chrome_amazon_findings_2026-10-15.json`. Per-row results are in the new `chrome_*` columns of `amazon_human_review.csv`. To merge again after rebuilding the CSV, run `node scripts/commerce/apply-chrome-findings.mjs`.

## Numbers

| | Count |
| --- | --- |
| Distinct Amazon listings in the queue | 175 |
| Opened and read | 159 |
| Blocked, CAPTCHA or login wall | 0 |
| Not checked (the browser permission check stopped the run) | 16 |
| Exact product and exact size/count | 87 |
| Right product, other issues flagged | 15 |
| Wrong product, wrong brand or wrong product line | 6 |
| Count or pack differs from what Ayna says | 40 |
| Link pins one size/colour on a product with no size picker | 13 |
| Formula or style differs | 6 |
| Listing unavailable | 3 |
| Still needs a person | 16 checked rows, the 16 unchecked listings, and the 54 options with no Amazon size |

The 16 listings not checked:
- Silverette: Small, Medium and Large, with and without O-Feel.
- Gaia Vitex: two sizes.
- The six candidates for products with no Buy link: Luna, Snoogle, Seventh Generation pads, SweetSpot, Tampax Pure and Ziggy.
- A few others.

They are marked `NOT_CHECKED`.

## Fixed in code now

These listings are the wrong item or unavailable, so they are now blocked as Buy destinations (`src/data/amazonAsinBlocks.js`, with a test). The products fall back to the brand site, and any size with its own correct Amazon listing keeps it.

| Product | What the Amazon link actually opened |
| --- | --- |
| Inito Fertility Monitor | Inito **test strips**, pack of 30, not the monitor |
| Willow wearable pump | Willow 360 **milk containers**, 2 count |
| Belly Bandit Upsie Belly (no size chosen) | a **KeaBabies** belly band. The 8 Belly Bandit sizes are all correct and still go to Amazon. |
| Saalt Menstrual Cup (no size chosen) | Saalt **Soft** cup, Mountain Iris, a line and colour Ayna doesn't list |
| Period Co. organic cotton bikini | the **high-waisted** style, in every mapped size; size M is unavailable |
| Thinx period underwear | **Thinx for All**, size XL, 2-pack |
| Knix leakproof underwear | size S 3-pack, **currently unavailable** |
| Proof period underwear | size XL, **currently unavailable**. There is no brand link on file, so it now shows no Buy button until someone adds the brand page. |

The Amazon route now covers 102 products, down from 110.

## Recommended catalog corrections (not applied: each needs your choice)

**Count or pack.** The Amazon item is the right product, but Ayna's text names a different count. For each one, either change Ayna's text to the Amazon count, or map the Amazon size that matches Ayna's count.

| Product | Ayna says | Amazon link is | Exact Amazon size for Ayna's count |
| --- | --- | --- | --- |
| Always Infinity FlexFoam | 18 | Size 1, 60 count | not seen |
| Always Liners | 42 | 162 count | not seen (120 and 216 exist) |
| AZO Cranberry (no size chosen) | 50 caplets | 100 softgels | B0012JY42I (50 caplets) |
| AZO Cranberry "100 Caplets 2pk" | caplets | softgels | name the option "100 softgels x 2" |
| Cora Organic Pads Regular / Super / Overnight / Extra Heavy | 32 / 30 / 28 / 20 | 36 / 36 / 36 / 24 | the counts on Amazon differ |
| Cora Organic Tampons Regular, Reg/Super, Light/Reg | 32 each | 72 / 36 / 72 | B06XKBV8VV (36 Regular), B0742KBL83 (36 Light/Regular) |
| L. Organic Cotton Pads | 42 | 56 | not seen |
| Love Wellness Bye Bye Bloat | 30 capsules | 30-day supply, 60 capsules | change text to 60 capsules |
| Nature Made Magnesium Glycinate | 60 | 180 | B08XXHCGZT (60) |
| Nature's Bounty D3 5000 IU | 150 | 240 | B002Y27LLS (150) |
| Nordic Naturals Omega Woman | 60 | 120 (only size listed) | change text to 120 |
| NOW D-Mannose | 60 caps | 300 caps | not seen (120 x 3 exists) |
| NOW Evening Primrose Oil | 100 | 90 | change text to 90 |
| Rael Overnight Pads | 12 | 40 | not seen |
| Rael tampons | 32 | 40 (bundle) | not seen |
| Rael panty liners (no size chosen) | 60/40/20 options | Regular, 44 | B071YSFXMN (Regular 60) |
| Remifemin | 60 tablets | 120 tablets | not seen |
| Tampax Radiant | 18 | 84 (3 x 28) | B00J4YX05K (28) |
| TENA Very Light liners | 50 | 300 | not seen |
| ThermaCare menstrual wraps | 4 | 6 | change text to 6 |
| U by Kotex CleanWear | 18 | 50 | not seen |
| Intimate Rose dilators | 8-piece set | Large pack, sizes 5-8 (4 pieces) | Small B07BKB3852, Medium B07BKBY2DL; no 8-piece on this listing |
| Lena cup (no size chosen) | one cup | 2-cup set | send no-size clicks to one cup, or say "set of 2" |
| DivaCup Models 0/1/2 | cup | cup + DivaWash combo | say "with DivaWash" |
| Flex Cup sizes 01/02 | cup | starter kit (cup + 2 discs) | say "starter kit" |
| Bodyform pads | pads | 60 pads + 60 liners combo | say "combo" |

**Size pinned on a product with no size picker.** These Amazon links open one specific size or colour, but the Ayna product doesn't let the shopper pick one. Add a size picker with each size's own Amazon listing, or send the product to the brand site:
- Oura Ring: Heritage Black, size 11. The listing has a Sizing Kit, B0CYWC18G8.
- Hanes period underwear: XL 3-pack.
- Bambody: XXL 3-pack.
- Depend Silhouette: Large.
- TomboyX: 9-inch boxer brief, XXL.
- VIBOOS heating pad: 24x12 Grey Green.
- Boppy (no colour chosen): Gray Gentle Leaves.
- LUMMA (no size chosen): Short/Unicorn.

**Different name or formula on Amazon.**
- **Good Clean Love:** Ayna says "Bio-Match Moisturizer"; the link is "Restore Moisturizing Vaginal Gel".
- **Ritual Prenatal Mint:** the Mint ASIN now opens the Citrus flavour, and Mint isn't on the listing.

**Sizes that can be filled from Amazon's own size list** (confirm with one click each; these are in `chrome_proposed_child_asin`):
- **LUMMA:** all 9 size/colour options.
- **Boppy:** 9 of the 22 prints. The other 13 aren't on the Amazon listing.
- **Saalt Cup:** Himalayan Pink Regular is B079DWG2ZV; Ocean Blue Small is B079DX4242. Seafoam Green isn't on Amazon.
- **Estroven:** the 60 option is B0D14YRD5F (30 x 2).
- **Spearmint tea**, 1 box: B000Z94H8C.

## Your team spreadsheet ("Product_Catalog_Prices")

The "Matched Amazon item" column comes from an automated Amazon search (SerpApi): it is the top search result, not a checked match. Of the 249 rows with a link:
- 73 use the same ASIN as the catalog;
- 110 use a different one;
- 66 are products not on the Amazon route today.

Many of the different ones are plainly wrong, for example:
- Bazooka bubble gum for Hello Disc "Bubblegum";
- coffee mugs and tumblers for Ruby Cup;
- face cotton pads for Organyc and Rael pads;
- cat urinary chews for Good Kitty;
- Bambody's ASINs listed for Modibodi, Wuka and Dear Kate.

So the sheet's ASINs shouldn't be loaded into the catalog. The Chrome check above is the source for identity.

The sheet's "Amazon price" column is a scraped Amazon price. It can't be shown on ayna for the same reason as a hand-read price: only Creators API prices are allowed. Treat it as internal only. "Prime shown" is "No or unknown" on every row. Prime and free shipping depend on the shopper's own account, so ayna shouldn't promise free shipping on Amazon items.
