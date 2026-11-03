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

## Next step
For each row: read the brand page and label, write the entry in src/data
(team copy rules apply), check FDA status in openFDA, run `npm run catalog:check`,
then `npm run catalog:readiness` and `npm run safety:audit`. Then remove the row here.
