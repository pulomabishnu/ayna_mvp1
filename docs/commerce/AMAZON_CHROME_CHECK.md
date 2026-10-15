# Amazon identity and variant check in Chrome (2026-10-15)

**Rule:** a partner product uses its partner route. A non-partner product goes to Amazon only for the exact item and exact size/count/colour/flavour/formula/style/bundle. If Amazon has the wrong item or size, or the listing is unavailable, the product goes to the exact brand-site offer. With neither, there is no Buy button and the product is flagged for review. The closest Amazon result is never used.

## How the check was done

- Every listing was opened at a plain `amazon.com/dp/<ASIN>` link with no affiliate tag, so the checks are not ayna clicks.
- For each listing I recorded the title, brand, selected size/colour/count, Amazon's own variation list, the details table and the availability text.
- **No prices were read or saved.** Images were compared by file name only.
- Amazon searches were used only to look for an exact count. Every result I used was then opened and confirmed on its own page.
- No CAPTCHA, login wall or block was hit, and none was bypassed.

**Not used:** the team sheet `Product_Catalog_Prices` is an automated SerpApi search. Its ASINs are `UNVERIFIED_CANDIDATE_ONLY` and none were promoted. Its scraped Amazon prices are kept out of the product completely.

**Prime and shipping:** Prime, free shipping and delivery dates depend on each shopper's account and address, so ayna doesn't show them.

Raw data:
- `audit/chrome_amazon_findings_2026-10-15.json`: per-listing results and the searches.
- `audit/amazon_routing_state_2026-10-15.json`: final state per product and option, from `scripts/commerce/build-amazon-routing-report.mjs`.
- Per-row results are in the `chrome_*` columns of `amazon_human_review.csv`.

## Totals after the fixes

| | Count |
| --- | --- |
| Products in the catalog | 227 |
| Products that route to Amazon for at least one option | 83 (74 when no size is chosen) |
| Amazon listings opened | 202 (175 in the queue + 27 confirmation clicks and exact-count finds) |
| Blocked by CAPTCHA, login or safety check | 0 |
| Listings still unchecked | 0 |
| Distinct Amazon listings confirmed exact and routed | 123 |
| Options routed to their own confirmed Amazon listing | 77 |
| Amazon routes now blocked | 38 (32 fall back to a brand or retailer page) |
| Products with no Buy route | 18 (6 caused by these blocks, 12 from before) |
| Amazon numeric prices shown | **0** |
| Tests | 1,449 passing |

## Final state per product (no size chosen)

| State | Products |
| --- | --- |
| CONFIRMED_AND_ROUTED | 64 |
| Routed, with an open question below | 10 |
| CONFIRMED_BUT_BRAND_FALLBACK | 1 (Veeda: both sizes unavailable on Amazon) |
| BLOCKED_WRONG_ITEM | 8 |
| BLOCKED_WRONG_VARIANT | 26 |
| BLOCKED_UNAVAILABLE | 2 |
| NOT_CHECKED | 0 |

Per option: 77 confirmed and routed to Amazon; 53 go to the exact brand or retailer option because Amazon has no exact match; 2 are blocked as unavailable (Veeda); 6 are routed with an open question.

### BLOCKED_WRONG_ITEM (wrong product, brand, line, flavour or formula)

| Product | What Amazon had | Now goes to |
| --- | --- | --- |
| Inito Fertility Monitor | test strips, 30-pack | inito.com |
| Willow pump | milk containers | willowpump.com |
| Belly Bandit (no size chosen) | KeaBabies band | bellybandit.com. The 8 sizes keep their exact listings. |
| Saalt Cup (no size chosen) | Saalt Soft, Mountain Iris | saalt.com |
| Period Co bikini | high-waisted style in every size | period.co |
| Thinx | Thinx for All, XL 2-pack | thinx.com |
| Good Clean Love "Bio-Match Moisturizer" | Restore gel | **no Buy button** (see open decisions) |
| NOW Evening Primrose Oil | 1,000 mg, 90 softgels | **no Buy button** (see open decisions) |

Two narrower blocks are also in place:
- **Ritual Prenatal Mint:** the Mint ASIN now opens Citrus. Mint goes to ritual.com, which still lists it (SKU EPREMT9MUS). Citrus stays on Amazon.
- **AZO Cranberry "100 Caplets 2pk":** Amazon sells softgels, not caplets, so this option goes to the brand.

### BLOCKED_WRONG_VARIANT (right product, wrong count, pack, bundle or pinned size)

| Product | Ayna | Amazon had | Exact Amazon found? | Now |
| --- | --- | --- | --- | --- |
| Always Infinity | 18 | 60 | no (searched) | always.com |
| Always Liners | 42 | 162 | no (searched) | always.com |
| Cora pads, overnight pads and tampons | Target packs 32/30/28/20 | 36/72/24 | no | the exact Target pack |
| Rael Overnight | 12 | 40 | XL Overnight 12 exists; not confirmed as the same pad | getrael.com |
| Rael tampons | 32 | 40 bundle | no | getrael.com |
| U by Kotex CleanWear | 18 | 50 | no (the 18-count found is "Balance", a different name) | **no Buy button** |
| Intimate Rose dilators | 8-piece set | 4-piece pack | no | intimaterose.com |
| Tampax Radiant | 18 | 84 | no; tampax.com lists 14/28/42 and duo 28/38/52 | tampax.com |
| ThermaCare | 4-count (Target) | 6-count | no | brand page |
| DivaCup Models 1 and 2 | cup | cup + DivaWash | no cup-only listing | shopdiva.com |
| Flex Cup | cup | starter kit with 2 discs | no | flexfits.com |
| Lena (no size chosen) | one cup | 2-cup set | each size has a single-cup listing | lenacup.com |
| Bodyform | pads | pads + liners combo | no | bodyform.co.uk |
| Oura (no size chosen) | ring | Heritage Black, size 11 | no size picker | **no Buy button** |
| Hanes, Bambody, Depend, TomboyX | no size picker | one pinned size | per-size listings exist | brand page |
| VIBOOS heating pad | one product | one pinned size/colour | no | **no Buy button** |
| Boppy, Lumma, Estroven, Rael liners, Rael Large pads (no size chosen) | sizes or prints | one pinned option | each option has its own listing | brand page, until the shopper picks an option |

**Replaced with the exact Amazon listing** (each opened and confirmed):
- AZO Cranberry 50 caplets: B0012JY42I
- Magnesium Glycinate 60: B08XXHCGZT
- D3 150: B002Y27LLS
- NOW D-Mannose 60: B0C545MBRC (NOW SKU 2808)
- L. pads 42: B0FQPVVD1S
- Remifemin 60: B0CRKXS5LJ
- TENA very light 50: B08D74XH82. tena.us names this liner "Sensitive Care Extra Coverage Very Light Liner".

### BLOCKED_UNAVAILABLE

- **Knix:** knix.com.
- **Proof:** no brand link on file, so no Buy button.
- **Veeda 14 and 42 count:** veedausa.com.

### Option listings added after one confirmation click each

| Product | Options mapped |
| --- | --- |
| Lumma | all 9 size/colour options |
| Boppy | 9 of 22 prints. Amazon's "Green Sage Leaf" is mapped to Ayna's "Green Sage Leaves". The other 13 prints go to boppy.com. |
| Saalt Cup | Himalayan Pink Regular B079DWG2ZV, Ocean Blue Small B079DX4242. Seafoam Green goes to saalt.com. |
| Estroven | 30 → B0091CG65G. The 60 option stays on estroven.com, because Amazon only sells 2 x 30. |
| Spearmint tea | 1 box → B000Z94H8C |
| Rael liners | 60 Count → B071YSFXMN. 40 and 20 go to getrael.com. |
| DivaCup | Model 0 → B07KGZ9NMV (cup only) |
| Silverette | all 6 options confirmed exact |
| Gaia Vitex | 60, 120 and 180 confirmed exact |

### Ayna text corrected from the brand's own site

- **Love Wellness Bye Bye Bloat:** 30 capsules → 60 capsules (lovewellness.com Standard is 60).
- **Nordic Naturals Omega Woman:** 60 → 120 softgels. nordic.com lists only "120 Count - Lemon".

The old dollar figures were never checked against the new counts, so those cards now say "See current price (…)" instead of a number. The change is mirrored in `supabase/seed/2026-10-15_commerce_price_text_fixes.sql`.

**Not changed:**
- **NOW Evening Primrose Oil:** nowfoods.com sells the 1,000 mg in 90 softgels only, but sells a 100-softgel bottle at 500 mg. Ayna's "100 softgels" may mean the 500 mg product, so the count may not be stale.
- **ThermaCare:** the 4-count Ayna lists is still sold at Target.

## Open decisions (need you or a person)

1. **Good Clean Love:** is "Bio-Match Moisturizer" Restore or BioNourish? Both use Bio-Match technology. Rename the product to the one you mean; Restore then maps to B000BFL5SK. goodcleanlove.com shows every Restore size as sold out today.
2. **NOW Evening Primrose Oil:** 500 mg x 100 or 1,000 mg x 90? The 1,000 mg x 90 is B078TGP8BK.
3. **Tampax Radiant:** 18 isn't sold any more. Pick a current pack and absorbency (Regular 14/28/42 or duo 28/38/52).
4. **Oura Ring Gen 3:** add a size picker, or link Oura's own sizing flow. I couldn't load ouraring.com to confirm that Gen 3 is still sold.
5. **Rael Overnight 12:** is it the XL Overnight 12 (B0856SZ7GL)?
6. **Ziggy:** Ziggy Cup or Ziggy Cup 2, and which size? Amazon has Ziggy Cup 2 Size A (B09Q3MRSM2).
7. **Products with no size picker:** Hanes, Bambody, Depend and TomboyX could get a size picker with per-size Amazon listings, or stay on the brand page.
8. **Routed with a small open question:**
   - **Pack size, where Ayna names none:** Always Discreet (96 = 3 x 32), Kotex Security (Long, 3 x 20), Stayfree (4 x 44).
   - **Count not shown on Amazon:** Honey Pot boric acid.
   - **Scent:** Honey Pot wash (Sensitive).
   - **Kit or size to confirm:** Frida kit (12-piece), Kindra (1 oz vs 2.5 oz), Poise (4-drop Regular), U by Kotex Click tampons (45 count).
   - **Absorbency:** Seventh Generation tampons (Super, stock not shown).
   - **Stock not shown on Amazon:** Lansinoh 60, Saalt Ocean Blue Regular and Himalayan Pink Regular, Silverette Large.
9. **Brand pages that aren't a store or exact product page:** these products now land on a collection or brand-info page, which is the best exact source left:
   - Always ×2, Tampax, Depend and Bodyform (a UK site);
   - Hanes, Thinx, TomboyX, Knix and Intimate Rose (collection pages).

   They need either an exact retailer page (for example Target) or no Buy button.
10. **Products with no Buy link from before:**
    - **Luna Daily:** the Amazon candidate is the Motherhood wash, a different product.
    - **Seventh Generation pads, Snoogle, SweetSpot wipes, Tampax Pure:** their Amazon candidates are all unavailable.
    - **Pink Stork, Queen V, Period Nirvana:** still not found.
