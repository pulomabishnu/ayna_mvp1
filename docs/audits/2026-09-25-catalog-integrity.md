# Catalog integrity repair — 2026-09-25

## Scope and findings

Reviewed image contact sheets across 219 unique bundled/live catalog records. Compared the live 183-record API with the bundled 213-record catalog. The API still returned outdated image and product data after earlier source fixes. This audit does not certify every medical claim, current price, or retailer stock status.

## Repairs

- 68 explicit record corrections shared across bundled data, database API responses, and saved snapshots.
- 13 manufacturer/product-source images pinned locally, with source URLs and review dates in catalogCorrections.js.
- Magnesium title, formulation, dosage, 60-capsule image and purchase destination aligned.
- Incorrect Honey Pot incontinence photo replaced with herbal period pads; Rael pack information, Veeda, inositol formulation, Thorne ubiquinol, Estroven naming, and other mismatches corrected.
- Removed an unrelated supplement photograph from the MenoLife app.
- Unverified pack-price combinations now direct visitors to current retailer details.
- Dynamic physical image lookup requires matching Product structured data; cache identity includes the source page and type, with bounded persistent caching. Explicit removals cannot be overwritten by saved stale images.
- Postmenopausal recommendations require stated concern relevance; life stage alone cannot imply hot flashes, incontinence or sexual symptoms. Exclude menstrual/fertility trackers and unrelated high-dose iron/D3 suggestions.
- Homepage cabinet does not invent owned items. Care areas distinguish nursing pads from menstrual pads and UTIs from incontinence; postmenopausal profiles prioritize menopause, bone health, strength, sleep and digestion.

## Honest remaining image gaps

19 catalog records still have no approved image. They use the existing neutral fallback unless an exact matching source can be resolved. No substitute variant was inserted to fill these gaps.

- p-pink-stork-bloat — Pink Stork Bloat Support
- p-remifemin — Remifemin (Black Cohosh)
- d-happi-pelvic — Happi Pelvic Floor App
- p-probiotics-women — Garden of Life Dr. Formulated Probiotics Once Daily Women's Shelf-Stable 30 Capsules
- p-citracal-bone-health — Citracal Bone Health+ (Calcium Citrate + D3)
- d-menolabs — MenoLife by MenoLabs
- p-queen-v-pop — Queen V The Pop It Suppositories
- p-u-kotex-pad — U by Kotex Clean Wear
- p-always-liners — Always Liners
- p-tampax-radiant — Tampax Radiant Tampons
- p-seventh-gen-tampon — Seventh Generation Organic Tampons
- p-ob-original-multipack-40 — o.b. Original Tampons Multi-Pack, 40ct
- p-ob-original-ultra-40 — o.b. Original Tampons Ultra, 40ct
- p-ob-original-regular-40 — o.b. Original Tampons Regular, 40ct
- p-ob-original-super-plus-40 — o.b. Original Tampons Super Plus, 40ct
- p-ob-original-super-40 — o.b. Original Tampons Super, 40ct
- p-ob-original-multipack-80 — o.b. Original Tampons Multi-Pack, 40ct (Pack of 2)
- p-ob-procomfort-mini-32 — o.b. ProComfort Mini Tampons, 32ct
- p-ob-procomfort-mini-16 — o.b. ProComfort Mini Tampons, 16ct

## Validation

724 automated tests passed; production build and catalog round-trip check passed (213 products, no duplicate IDs or lossy round-trips). Local browser search displayed the corrected magnesium listing. Existing App.jsx lint debt remains; focused changed modules pass lint. Live verification is recorded in the pull request after deployment.
