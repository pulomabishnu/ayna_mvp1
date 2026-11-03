# Product import queue (founder sheet, Nov 2 2026)

New products from the founder's sheet that are not in the catalog yet. Per
CLAUDE.md "Catalog content accuracy", none of these go live until each has a
description, price, ingredients/materials, regulatory status (openFDA) and
sources that someone has read. Amazon links get `?tag=aynahealth-20`
automatically (src/utils/buyLink.js withAmazonTag); brand links stay as given.

Proposed category and need tags are for the matcher once the facts are in.
Left out on purpose (not health products): hair ties, hair towels, spa
headbands, mascara and brow gel, a headphone stand, a drying dish, a tube key,
an electric mixer, a cap, charging cable, Shrek/Minions/Popsicle gummies, body
brush, smart mirror, novelty underwear bundles.

## No duplicates (founder, Nov 2)

- **Already in the catalog: not added again.** If the sheet has a better link
  or more needs for one of these, it is a proposed change to the existing
  entry (team copy rules apply), not a new product:
  - Midi Health (12 condition pages) → `d-midi-health`. One service; the pages
    are conditions it covers (perimenopause, menopause, hot flashes, sexual
    wellness, sleep, UTI/BV/yeast, PCOS, irregular periods, mood, brain fog,
    joint pain, weight). Proposed: add those needs to the one entry.
  - Evernow Menopause Care and Perimenopause Care → `d-evernow` (one service).
  - Gennev Menopause Care → `p-gennev-care`.
  - Elektra Health Menopause Clinical Care → `s-elektra`.
  - Mira Ultra4 Perimenopause Kit → `s-mira` (same monitor, a different kit).
  - Oova Perimenopause Kit → `s-oova` (already says perimenopause).
  - Size and color rows (Saalt, Lena, Boppy, Belly Bandit, Pelvic Bra, Cora,
    Natracare, Silverette, Ruby, Hello Disc, Flex, Lunette, Diva) → already
    in `src/data/productVariants.js` as options of one product.
- **Same product, different size, color, count, pack or absorbency → one
  entry with variants** (`PRODUCT_VARIANTS`: `familyName`, `variants[]` with
  `label`, `url`, and `amazonAsin` only when the Amazon listing is that exact
  option). It is shown once and counted once by the matcher.
- **Different ingredients or materials → separate entries**, even with a
  similar name (water vs silicone lube, capsules vs gummies, Revaree vs
  Revaree Plus), because safety answers differ. A stage pack (trimesters)
  is one entry only if its safety facts cover every ingredient in every stage.
- Several services from one company (Alloy, Twentyeight Health) are one entry.
- New products from a brand we already carry (Thorne, Womaness, Kindra,
  Perelel) are new entries; the brand isn't repeated, the product is new.

## Services and telehealth (category telehealth)
| Brand | Product | Link | Needs |
|---|---|---|---|
| Alloy | Menopause care: hormone therapy and sexual health (one service) | https://www.myalloy.com/ | menopause, hot flashes, libido, dryness |
| Twentyeight Health | Birth control, emergency contraception and urgent care (one service) | https://www.twentyeighthealth.com/birth-control | contraception, UTI, BV, yeast |
| Function Health | Membership (lab testing) | https://www.functionhealth.com/pricing | lab testing |
| EllaDx | Hormones / Thyroid / Fertility / Anemia panels | https://elladx.com/what-we-test/ella-dx-annual | testing |

## Tests and trackers (category test / tracker / app)
| Brand | Product | Link | Needs |
|---|---|---|---|
| Hormona | Perimenopause Test + App | https://www.hormona.io/products/perimenopause-test | perimenopause |
| Clearblue | Menopause Stage Indicator | https://www.amazon.com/dp/B0C68D39LQ | perimenopause |
| Balance | Menopause & Hormones App | https://apps.apple.com/us/app/id1503345959 | menopause |
| Caria | Menopause & Midlife App | https://apps.apple.com/us/app/id1477621356 | menopause |
| Health & Her | Menopause App | https://apps.apple.com/us/app/id1519199698 | menopause |
| Stella | Menopause Relief App | https://apps.apple.com/us/app/id1577904186 | menopause |
| perry | Perimenopause Community App | https://apps.apple.com/us/app/id1544428724 | perimenopause |
| Midday | Menopause Support App | https://apps.apple.com/us/app/id1607540602 | menopause |
| Menolog | Perimenopause Tracker App | https://apps.apple.com/us/app/id6757102221 | perimenopause |
| Lively | Cycle Syncing & Period Tracker App | https://livelycycle.com/ | cycle tracking |

## Vaginal and sexual health (intimate-care / lubricant / sexual-wellness)
| Brand | Product | Link | Needs |
|---|---|---|---|
| Replens | Long-Lasting Vaginal Moisturizer | https://www.amazon.com/dp/B001G7QR8A | vaginal dryness |
| Replens | External Comfort Gel | https://www.amazon.com/dp/B07FL8DVXC | vulvar dryness |
| Replens | Silky Smooth Lubricant | https://www.amazon.com/dp/B01283FY7A | painful sex, dryness |
| Kindra | V Relief Serum (check first: may be the renamed Daily Vaginal Lotion, p-kindra-lotion; if so, it is not new) | https://www.amazon.com/dp/B0DCHBYNHQ | vaginal dryness |
| Kindra | Soothe Vulva Wash | https://www.amazon.com/dp/B09ZYJ274V | vulvar care |
| Kindra | V Lube (water / silicone) | https://ourkindra.com/products/v-lube-water-based-lubricant | lubricant |
| Kindra | Boric Acid Suppositories | https://ourkindra.com/products/boric-acid-suppositories-30-counts | BV, odor |
| Womaness | Coco Bliss Vaginal Moisturizer | https://www.amazon.com/dp/B09NX4PRTD | vaginal dryness |
| Womaness | Daily V Soothe | https://www.amazon.com/dp/B09S6SWGVN | vaginal dryness |
| Womaness | Melt For You Vaginal Inserts | https://www.amazon.com/dp/B0GVZKF8RN | vaginal dryness |
| Stripes | Vag of Honor Vaginal Moisturizer | https://www.amazon.com/dp/B0BKQZT5TH | vaginal dryness |
| Stripes | Oh My Glide Vaginal Oil | https://stripesbeauty.com/products/oh-my-glide | dryness, painful sex |
| Bonafide | Revaree / Revaree Plus | https://www.amazon.com/dp/B07GX9NQ65 | vaginal dryness |
| Bonafide | Clairvee Vaginal Pre + Probiotic | https://www.amazon.com/dp/B0FZDR66NM | vaginal health |
| Vella | Ebbtide / Meltwater / Everslide | https://vellabio.com/products/water-based-lube | painful sex, arousal |
| O Positiv | URO Vaginal Probiotic | https://www.amazon.com/dp/B0D5FZGY8W | vaginal health |
| O Positiv | Boric Acid Vaginal Suppository | https://www.amazon.com/dp/B0DK9ZNH4G | BV, odor |
| O Positiv | pH-Balanced Intimate Wash | https://www.amazon.com/dp/B0FCPGSHL9 | vulvar care |

## Menopause and hormone supplements (supplement; ingested, so every safety fact needed)
| Brand | Product | Link | Needs |
|---|---|---|---|
| Bonafide | Relizen | https://www.amazon.com/dp/B01DTKK5ES | hot flashes |
| Bonafide | Thermella | https://www.amazon.com/dp/B0FJMNTKQ7 | hot flashes |
| Bonafide | Serenol | https://www.amazon.com/dp/B0FCSTVGW3 | mood (PMS) |
| Bonafide | Ristela | https://www.amazon.com/dp/B07RPV16RQ | libido |
| Bonafide | Noctera | https://www.amazon.com/dp/B0GGVB7PRQ | sleep |
| Womaness | Let Me Sleep | https://www.amazon.com/dp/B09NXGM4DD | sleep |
| Kindra | MenoRelief | https://www.amazon.com/dp/B0DXWTW9BL | hot flashes |
| Stripes | The Inside Addition Menopause Probiotic | https://www.amazon.com/dp/B0BKQY1Y19 | menopause |
| O Positiv | MENO Menopause capsules / gummies | https://www.amazon.com/dp/B0D6S94T77 | menopause |
| O Positiv | FLO PMS capsules | https://www.amazon.com/dp/B0D5JFRTHJ | PMS |
| O Positiv | Ovarian Support / Myo + D-Chiro Inositol | https://www.amazon.com/dp/B0D5GC6WFC | PCOS |
| O Positiv | URO Urinary Health | https://www.amazon.com/dp/B0D5GG35BW | UTI |
| Biolae | Meno Essential | https://www.biolae.com.au/products/meno-essential | menopause |
| Perelel | Perimenopause Support Pack | https://www.amazon.com/dp/B0DHTV3YJC | perimenopause |
| Perelel | Hormonal Balance Support | https://www.amazon.com/dp/B0CPKZ9Q5P | PMS, cycle |
| Perelel | Conception Support / Fertility+ | https://www.amazon.com/dp/B0CPKSZJGM | TTC |
| Perelel | Prenatal Pack: one entry, variants 1st / 2nd / 3rd trimester (safety facts = every ingredient across the three) | https://www.amazon.com/dp/B0CSH5PMHQ | prenatal |
| Perelel | Mom Multi Support Pack (postpartum) | https://www.amazon.com/dp/B0CPL9CTT8 | postpartum |
| Perelel | Daily Iron Ease | https://www.amazon.com/dp/B0CPKP1FVY | iron, heavy periods |
| Thorne | Berberine | https://www.amazon.com/dp/B009LI7VRC | PCOS (ask clinician) |
| Thorne | 5-MTHF 1 mg | https://www.amazon.com/dp/B00FY8IQ7C | TTC |
| Seeking Health | DAO Enzyme | https://www.amazon.com/dp/B00EOBH8KG | histamine |
| Effective Nutra | DIM 300 mg | https://www.amazon.com/dp/B07NCJH91H | hormonal acne (ask clinician) |
| Micro Ingredients | Myo & D-Chiro Inositol Powder | https://www.amazon.com/dp/B0DGRG846L | PCOS |

## Period care (pad / tampon / cup / disc / period-underwear)
| Brand | Product | Link | Needs |
|---|---|---|---|
| Rif Care | Organic Cotton & Hemp Pads: one entry, variants Regular / Super / Overnight | https://rifcare.com/products/menstrual-pads-regular-absorbency-with-wings | period, heavy |
| Rif Care | Organic Cotton Tampons: one entry, variants Regular / Super | https://rifcare.com/products/organic-cotton-tampons | period |
| Rif Care | Leakproof Period Underwear | https://rifcare.com/products/period-leakproof-underwear-pfa-free | period |
| Viv for your V | Menstrual Disc | https://www.amazon.com/dp/B0DKZ6H3ZN | period |
| Viv for your V | Menstrual Cup (sizes are variants) | (brand page to confirm) | period |
| Viv for your V | Organic Tampons (absorbencies are variants) | (brand page to confirm) | period |
| Viv for your V | Bamboo Pads & Liners (lengths are variants) | (brand page to confirm) | period |
| Ferra | Period Brownies | https://eatferra.com/products/period-brownies | PMS (food) |

## Pain, sleep and other
| Brand | Product | Link | Needs |
|---|---|---|---|
| Popmask | Big Hug Self-Heating Patches | https://us.popmasklondon.com/products/new-big-hug | period cramps |
| Popmask | Flash Me Hot Flash Cooling Spray | https://us.popmasklondon.com/products/flash-me-hot-flash-cooling-spray-80ml | hot flashes |
| Hoolest | VeRelief Prime (vagus nerve device) | https://www.amazon.com/dp/B0GYBH7BP9 | stress, sleep |
| Queen of the Thrones | Castor Oil Pack Kit | https://www.amazon.com/dp/B0DDY8CLM2 | (evidence check first) |
| CEAN | Lymphatic Maternity Compression Romper | https://cean.com/en-us/products/lymphatic-maternity-romper | pregnancy swelling |
| Pore Favor | Acne Supplement | https://www.porefavor.com/en-us/products/clear-skin-supplement | acne |
| Topicals | Faded Brightening + Clearing Serum | https://www.amazon.com/dp/B09V9QRHCD | hyperpigmentation |

## Status (Nov 2, done)

Researched from each brand's page and openFDA, then added in
`src/data/productsNov2026.js` (sources in each entry's `researchSources`).

**Live (50):** Twentyeight Health Birth control, emergency contraception and urgent care, Function Health Membership, Hormona Perimenopause Test Kit + App, Balance - Menopause & Hormones, Caria: Menopause & Midlife, Health & Her App, Stella: Menopause relief, perry: Perimenopause Community, Menolog (listed as Menelle) Perimenopause Tracker: Menelle, Lively - Period Tracker, Cycle, Kindra V Relief Serum, Kindra V Lube Water-Based Lubricant, Kindra V Lube Silicone Lubricant, Kindra Boric Acid Suppositories, Womaness Coco Bliss External Vaginal Moisturizer, Womaness Daily V Soothe, Womaness Melt For You Vaginal Inserts, Stripes Vag of Honor Vaginal Moisturizer, Stripes Oh My Glide Intimate Play Oil, Bonafide Revaree, Bonafide Revaree Plus, Bonafide Clairvee Vaginal Pre + Probiotic, Vella Meltwater Vaginal Emollient, Vella Everslide Personal Lubricant, Bonafide Thermella, Bonafide Ristela, O Positiv URO Urinary Tract Health Capsules, Perelel Perimenopause Support Pack, Perelel Hormonal Balance Support, Perelel Conception Support Pack, Perelel Fertility+ Support, Perelel Prenatal Pack (1st / 2nd / 3rd Trimester), Perelel Mom Multi Support Pack, Perelel Daily Iron Ease, Thorne Berberine, Thorne 5-MTHF 1 mg, Seeking Health DAO Enzyme (formerly Histamine Digest / Histamine Block), Micro Ingredients Myo & D-Chiro Inositol Powder, Rif Care Organic Cotton and Hemp Fiber Menstrual Pads with Wings, Rif Care Organic Cotton Non-Applicator Tampons, Rif Care Organic Cotton and Hemp Fiber Leakproof Period Undies (no PFA added), Viv for your V Viv Disc, Viv for your V Viv Menstrual Cup, Viv for your V Viv Organic Cotton Tampons, Viv for your V Viv Bamboo Pads & Liners, Popmask Big Hug Self-Heating Patches, Hoolest VeRelief Prime, Queen of the Thrones Ritual Starter - Liver Castor Oil Pack Kit, CEAN Lymphatic Maternity Compression Romper, Topicals Faded Brightening + Clearing Serum (Unscented).

**Added but hidden until a fact is filled (25):**
- Alloy Menopause care (hormone therapy and sexual health): No price on the homepage (no membership, consult or product prices); no brand pricing page found; Page says 'board-certified doctors', not 'licensed clinicians' - use that wording; States served not stated; Also sells sk
- EllaDx Ella Dx Annual Panel: Sheet says 'Hormones / Thyroid / Fertility / Anemia panels' but this page does NOT list estrogen, progesterone, testosterone, FSH, LH, AMH, ferritin or iron. Only thyroid is clearly covered. Other EllaDx panels were not 
- Clearblue Menopause Stage Indicator: No price on brand page; Amazon link (B0C68D39LQ) could not be read (robots blocked), so ASIN match unverified; No product image URL from page; Page does not address hormonal contraception or HRT users, pregnancy or breas
- Replens Long-Lasting Vaginal Moisturizer: Price not shown on brand page.; Full ingredient list not on brand page.; Pregnancy/breastfeeding not addressed.; Amazon listing could not be read (WebFetch blocked by amazon.com robots); ASIN not verified.
- Replens External Comfort Gel: Price and size not shown on brand page.; Full ingredient list not on page.; Allergens, pregnancy, breastfeeding not addressed.; Condom compatibility not stated (brand recommends Silky Smooth for sex).
- Replens Silky Smooth Silicone-Based Lubricant: Price and size not shown on brand page.; Full ingredient list not on page.; Toy compatibility not stated.; Pregnancy/breastfeeding not addressed.
- Vella Ebbtide Vaginal Inserts: Price per pack size unclear.; Sheet groups it with lubes; it is a CBD cramp-relief insert.; Page 'clinically proven' claims cite studies not read here.; Tag 'herbal' is a judgment (plant-derived CBD); review.
- O Positiv URO Vaginal Probiotic Capsules: no product photo yet (the brand page shows only a generic image); Pregnancy, breastfeeding, allergens not stated.; og:image is a generic site-wide 'Preview-Photo.jpg' shared by all O Positiv pages; set to null.; Gummy fo
- O Positiv URO Boric Acid Vaginal Suppository: no product photo yet (the brand page shows only a generic image); Page does not mention BV; sheet's 'BV' use not sourced.; og:image is a generic site-wide preview photo; set to null.; Amazon listing could not be read (We
- O Positiv URO pH-Balanced Probiotic Intimate Wash: Full ingredient lists per scent not captured verbatim; re-read page.; Vanilla & Honey contains fragrance; do not tag fragrance-free.; No numeric pH given.; Pregnancy/breastfeeding not addressed.
- Bonafide Relizen: Supplement Facts amount for the pollen extract blend not shown on page; No allergen statement (contains pollen extract; page does not address pollen allergy); No pregnancy, breastfeeding or medication warnings on page; B
- Bonafide Serenol: Supplement Facts amounts (chromium, pollen blend, royal jelly) not shown on page; No pregnancy, breastfeeding or medication warnings on page; Bonafide page heading reads '180 tablets | 3-month supply' while the single-bo
- Bonafide Noctera: Supplement Facts amounts not shown on page; No allergen statement; No pregnancy or breastfeeding info on page; Contains SAMe; page gives no specific interaction warning beyond general medication note
- Womaness Let Me Sleep: Supplement Facts amounts (melatonin dose etc.) not shown on page; Amazon listing could not be read (amazon.com blocked fetch: robots_disallowed), so ASIN and match are unverified
- Kindra MenoRelief: No Supplement Facts panel; maca root amount not shown; No pregnancy or breastfeeding info on page; Image: og:image URL was truncated in the fetch, so not reported; 90-capsule price unclear
- Stripes The Inside Addition Menopause Probiotic: No Supplement Facts amounts, %DV or CFU counts on page; No allergen statement; No pregnancy, breastfeeding or medication warnings on page (contains ashwagandha and green tea); bone-health function is from page's 'support
- O Positiv MENO Menopause Capsules: Chromium amount not shown; No %DV on page; og:image is a generic site preview image (Preview-Photo.jpg), not reported; Sheet row lumps capsules and gummies; split into two products because formulas differ
- O Positiv MENO Menopause Gummies: no product photo yet (the brand page shows only a generic image); No %DV on page; Page lists canonical URL https://opositiv.com/products/meno-menopause-gummy-vitamins (not separately fetched); url field uses the fetched 
- O Positiv FLO PMS Capsules: no product photo yet (the brand page shows only a generic image); No pregnancy, breastfeeding or medication warnings on page (contains chasteberry and dong quai); Individual herb amounts in the 86 mg blend not disclosed;
- O Positiv FLO Ovarian Support Capsules (Myo + D-Chiro Inositol): no product photo yet (the brand page shows only a generic image); No allergen statement; No pregnancy or breastfeeding info on page (relevant: marketed for ovulation/fertility); 'acne' tag not stated on page; page mentio
- Biolae Meno Essential: Capsule count / days per bottle not on page; Excipients (other ingredients) not on page; No dairy or full allergen statement; AUST L number not shown; TGA listing per brand only
- Effective Nutra DIM 300 mg with BioPerine: Amazon listing could not be read (WebFetch: robots_disallowed), so the ASIN and amazonMatches are unverified. Brand image filename contains B07NCJH91H, which suggests it matches, but not verified.; Pregnancy, breastfeedi
- Ferra Period Brownies: Full ingredients and nutrition facts missing; Allergens missing (likely relevant for a baked food: wheat, egg, dairy unknown); Count per box missing; Pregnancy/breastfeeding not stated
- Popmask Flash Me Hot Flash Cooling Spray 80ml: Full ingredients list missing; No directions or warnings; Fragrance details missing (scented product; not fragrance-free); Pregnancy info missing
- Pore Favor Acne Supplement: Ingredients and amounts missing: only in an image (https://www.porefavor.com/cdn/shop/files/the-acne-supplement-706215.webp?v=1732724399) that could not be read; No directions (only customer reviews mention 2 capsules a 

**Not added:** Kindra Soothe Vulva Wash (no product page found), Midday app (no readable page).
Amazon pages could not be read by the research tools, so no Amazon links were added for these;
Buy goes to the brand's page. To make a hidden one live: fill the gap from the brand page, delete
its `hidden: true`, run the tests.

## Next step
For each row: read the brand page and label, write the entry in src/data
(team copy rules apply), check FDA status in openFDA, run `npm run catalog:check`,
then `npm run catalog:readiness` and `npm run safety:audit`. Then remove the row here.
