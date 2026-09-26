/** Reviewed catalog corrections, 2026-09-25.
 * Applied to bundled records, database responses and saved snapshots.
 * Explicit empty images remove known incorrect imagery; never merge them away.
 * Source URLs and verification dates describe the exact reviewed image.
 */
export const CATALOG_CORRECTIONS = {
  "d-glow": {
    "name": "Glow Period & Ovulation Tracker",
    "image": "https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/5e/77/d4/5e77d423-a88d-55cc-cf31-0fe103756967/GlowAppIcon-0-0-1x_U007epad-0-1-0-85-220.png/512x512bb.jpg",
    "price": "Free (Premium $60/year)",
    "url": "https://glowing.com/",
    "category": "tracker"
  },
  "d-happi-pelvic": {
    "name": "Happi Pelvic Floor App",
    "image": "",
    "price": "Free trial, then subscription",
    "category": "pelvic-floor"
  },
  "d-hers": {
    "name": "Hers",
    "image": "https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/dd/b6/45/ddb645c3-4a99-9bcc-8603-9d47b9d4d912/HersIcon-0-0-1x_U007emarketing-0-6-0-85-220.png/512x512bb.jpg",
    "price": "Subscription + per-visit; varies by treatment",
    "category": "telehealth"
  },
  "d-nurx-bc": {
    "name": "Nurx",
    "image": "https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/4b/c9/d9/4bc9d930-40a1-9566-2ec1-83a23ae06789/AppIcon-0-0-1x_U007ephone-0-1-85-220.png/512x512bb.jpg",
    "price": "$15\u201320/month",
    "url": "https://www.nurx.com/",
    "category": "telehealth"
  },
  "d-ovia": {
    "name": "Ovia Health",
    "image": "/products/verified/d-ovia.jpg",
    "price": "Free (employer-sponsored)",
    "url": "https://www.oviahealth.com/",
    "category": "tracker",
    "imageSourceUrl": "https://www.oviahealth.com/",
    "imageVerifiedAt": "2026-09-25"
  },
  "d-peanut": {
    "name": "Peanut: Find Friends & Support",
    "image": "https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/3d/96/76/3d967655-d35f-80f1-9f61-2ece4a7e14fb/AppIcon-0-0-1x_U007epad-0-1-0-sRGB-85-220.png/512x512bb.jpg",
    "price": "Free",
    "url": "https://www.peanut-app.io/",
    "category": "mental-health"
  },
  "d-ppd": {
    "name": "Planned Parenthood Direct",
    "image": "https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/0b/ca/49/0bca4992-624a-eb8d-e3dc-d8251c29cf82/AppIcon-1x_U007emarketing-0-6-0-85-220-0.png/512x512bb.jpg",
    "price": "$0-15/visit, sliding scale",
    "category": "telehealth"
  },
  "p-always-discreet-boutique-liners": {
    "name": "Always Discreet Boutique Incontinence Panty Liners for Women, Bladder Leaks",
    "image": "https://target.scene7.com/is/image/Target/GUEST_7e6e8ee3-b160-4a67-a42c-bc572977875a",
    "price": "Check retailer for current price and pack size",
    "category": "incontinence"
  },
  "p-always-liners": {
    "name": "Always Liners",
    "image": "",
    "price": "$6 for 42",
    "category": "pad"
  },
  "p-bambody-underwear": {
    "name": "Bambody Absorbent Panties",
    "image": "https://m.media-amazon.com/images/I/611IHjwrcnL._AC_UL1500_.jpg",
    "price": "$15",
    "category": "period-underwear"
  },
  "p-bodyform-pad": {
    "name": "Bodyform Ultra Pads",
    "image": "https://libresse-images.essity.com/images-c5/497/702497/optimized-AzureJPG615CropUp/bodyform-phoenix-v3-ultimate-ultra-regular-plus-promo-x12-towels-7322542533789.jpg?w=295&h=295&imPolicy=dynamic",
    "price": "Check retailer for current price and pack size",
    "url": "https://www.amazon.com/Womens-Health-Care-Products-Bodyform/s?rh=n%3A386373011%2Cp_4%3ABodyform",
    "category": "pad"
  },
  "p-carefree-liners": {
    "name": "Carefree Acti-Fresh Liners",
    "image": "https://carefreeliners.com/cdn/shop/files/CFR_656900_PDP-Beauty_Pack_Tiles_-_ATF_1_WRAPPED_Regular_20_CT_1024x.webp?v=1781797888",
    "price": "Check retailer for current price and pack size",
    "category": "pad"
  },
  "p-citracal-bone-health": {
    "name": "Citracal Bone Health+ (Calcium Citrate + D3)",
    "image": "",
    "price": "$15\u2013$25/bottle",
    "category": "menopause"
  },
  "p-cora-organic-pads": {
    "name": "Cora Organic Pads",
    "image": "https://cdn.shopify.com/s/files/1/0940/5060/files/Cora_Dynamic_Image_POM_Pads_Regular_1000X1000_9e847653-7318-46fb-9fdf-a714e0931031.png?v=1787080092",
    "price": "$10 for 32",
    "url": "https://cora.life/",
    "category": "pad"
  },
  "p-cora-organic-tampons": {
    "name": "Cora Organic Tampons",
    "image": "https://cdn.shopify.com/s/files/1/0940/5060/files/Cora_Dynamic_Image_Applicator_Tampons_V3_1000X1000_7f00668b-f217-4371-b8a1-1c3b4ab16741.png?v=1787190945",
    "price": "$11 for 32",
    "url": "https://cora.life/",
    "category": "tampon"
  },
  "p-cora-overnight": {
    "name": "Cora Overnight Pads",
    "image": "https://cdn.shopify.com/s/files/1/0940/5060/files/Cora_Dynamic_Image_POM_Maxi_Overnight_1000X1000_1c7cdd2e-9eab-43c1-a8dc-52b28f7052c2.png?v=1787166033",
    "price": "$10 for 20",
    "url": "https://cora.life/",
    "category": "pad"
  },
  "p-creatine-womens": {
    "name": "Thorne Creatine",
    "image": "https://d1vo8zfysxy97v.cloudfront.net/media/product/sf903__ve8382489c6ce9fb7f28cdddef00e6f1ece146591.png",
    "price": "$25\u201340 for 300\u2013500g",
    "category": "supplement"
  },
  "p-d-mannose-now": {
    "name": "NOW D-Mannose",
    "image": "https://target.scene7.com/is/image/Target/GUEST_127d7700-f673-4c0d-8564-e47ca95076b3?wid=800&hei=800&qlt=80&fmt=pjpeg",
    "price": "$12 for 60 caps",
    "category": "supplement"
  },
  "p-dear-kate-underwear": {
    "name": "Dear Kate Period Underwear",
    "image": "https://cdn.shopify.com/s/files/1/0152/4745/products/DSC01403.jpg?v=1578089113",
    "price": "$32\u2013$38 per pair",
    "url": "https://dearkate.com/",
    "category": "period-underwear"
  },
  "p-depend-silhouette-underwear": {
    "name": "Depend Silhouette Incontinence Underwear for Women, Maximum Absorbency",
    "image": "https://target.scene7.com/is/image/Target/GUEST_e9213c42-1912-4667-aecc-fe66a250fd69?wid=800&hei=800&fmt=pjpeg",
    "price": "Check retailer for current price and pack size",
    "category": "incontinence"
  },
  "p-estroven-mood": {
    "name": "Estroven Menopause Relief Mood Boost",
    "image": "/products/verified/p-estroven-mood.jpg",
    "price": "Varies by pack size (30 or 60 caplets)",
    "url": "https://estroven.com/products/menopause-relief-mood-memory-boost",
    "category": "supplement",
    "imageSourceUrl": "https://estroven.com/products/menopause-relief-mood-memory-boost",
    "imageVerifiedAt": "2026-09-25"
  },
  "p-femmycycle": {
    "name": "FemmyCycle Menstrual Cup",
    "image": "https://menstrualcupreviews.net/wp-content/uploads/2020/06/femmycycle-regular-cup.jpg",
    "price": "$30 (reusable)",
    "category": "cup"
  },
  "p-gennev-care": {
    "name": "Gennev Menopause Care",
    "image": "https://gennev.com/wp-content/uploads/2025/05/asset-content-home-hero-face.jpg",
    "price": "$199/consult",
    "url": "https://gennev.com/",
    "category": "menopause"
  },
  "p-good-kitty-uti-biome-shield": {
    "name": "Good Kitty UTI Biome Shield",
    "image": "/products/verified/p-good-kitty-uti-biome-shield.jpg",
    "price": "$99 starter kit (or $84.15/mo subscription)",
    "url": "https://goodkittyco.com/products/uti-biome-shield",
    "category": "supplement",
    "imageSourceUrl": "https://goodkittyco.com/products/uti-biome-shield",
    "imageVerifiedAt": "2026-09-25"
  },
  "p-hanes-period": {
    "name": "Hanes Period Underwear",
    "image": "https://m.media-amazon.com/images/I/71Ph1Q772PL._AC_UL1500_.jpg",
    "price": "$12\u2013$16 per pair",
    "category": "period-underwear"
  },
  "p-honeypot-pad": {
    "name": "The Honey Pot Herbal Pads",
    "image": "/products/verified/p-honeypot-pad.jpg",
    "price": "$9.99 for 20",
    "url": "https://thehoneypot.co/products/regular-herbal-pads-with-wings",
    "category": "pad",
    "imageSourceUrl": "https://thehoneypot.co/products/regular-herbal-pads-with-wings",
    "imageVerifiedAt": "2026-09-25"
  },
  "p-intimina-kegel": {
    "name": "Intimina Laselle Kegel Exercisers",
    "image": "https://assets.intimina.com/files/static/product-images/2022-04/550x550_Laselle_EN.jpg?VersionId=_8_GLEGmnwIH1maYhAsvLEeLm4Usw1Em",
    "price": "$25",
    "category": "pelvic-floor-trainer",
    "url": "https://www.intimina.com/laselle"
  },
  "p-intimina-lily": {
    "name": "Intimina Lily Cup",
    "image": "https://assets.intimina.com/files/static/product-images/2022-04/550x550_Lily%20Cup_EN.jpg?VersionId=ETb1DKiGPOOFTBT12hVX8D6SkbVdSlsG",
    "price": "$30",
    "category": "cup"
  },
  "p-june-cup": {
    "name": "Ecoblossom Menstrual Cup (Small & Large Set)",
    "image": "https://m.media-amazon.com/images/I/71S6JSSjhVL._AC_SX679_.jpg",
    "price": "$15.99 (2-pack: Small & Large)",
    "category": "cup"
  },
  "p-kotex-security": {
    "name": "Kotex Security Ultra Thin",
    "image": "/products/kotex/security-ultra-thin.png",
    "price": "Check retailer for current price and pack size",
    "category": "pad"
  },
  "p-kotex-tampon": {
    "name": "U by Kotex Click Tampons",
    "image": "https://target.scene7.com/is/image/Target/GUEST_34cb7fec-ee4d-4c3b-aecc-707f88afee36",
    "price": "Check retailer for current price and pack size",
    "category": "tampon"
  },
  "p-lelo-sona": {
    "name": "LELO SONA Cruise",
    "image": "https://assets.lelo.com/dx/product-images/2026-07/LELO_SONA_ProductShot_Pink_Front_2000_0.webp?VersionId=PnjshiQe_cpsN.oz1VQ56EMDFmCHL3pA",
    "price": "$129",
    "url": "https://www.lelo.com/sona-cruise",
    "category": "sex-tech"
  },
  "p-lumma-disc": {
    "name": "Lumma Unique Menstrual Disc",
    "image": "https://mylumma.com/cdn/shop/files/bogo-pack-lumma-disc-pinklove-background.webp?v=1762928416",
    "price": "$35 (reusable)",
    "category": "disc"
  },
  "p-magnesium-glycinate": {
    "name": "Nature Made Magnesium Glycinate 200 mg, 60 Capsules",
    "image": "/products/naturemade/magnesium-glycinate-200mg.png",
    "price": "$21.99 for 60 capsules",
    "category": "supplement",
    "url": "https://www.naturemade.com/products/high-absorption-magnesium-glycinate-200-mg-capsules"
  },
  "p-natracare-tampon": {
    "name": "Natracare Regular Non-Applicator Organic Cotton Tampons",
    "image": "/products/verified/p-natracare-tampon.jpg",
    "price": "Varies by retailer (10 or 20 count)",
    "url": "https://www.natracare.com/products/tampons/organic-regular-non-applicator-tampons/",
    "category": "tampon",
    "imageSourceUrl": "https://www.natracare.com/products/tampons/organic-regular-non-applicator-tampons/",
    "imageVerifiedAt": "2026-09-25"
  },
  "p-ob-tampon": {
    "name": "OB Tampons",
    "image": "https://target.scene7.com/is/image/Target/GUEST_b762b05c-343e-4d2d-924f-b6aa6a3b6057",
    "price": "$6 for 40",
    "category": "tampon"
  },
  "p-period-co-underwear": {
    "name": "The Bikini Period. in Organic Cotton For Heavy Flows",
    "image": "https://period.co/cdn/shop/products/P1000WC_BIKINI_FRONT.jpg?v=1767890575",
    "price": "$14 per pair",
    "url": "https://period.co/products/the-bikini",
    "category": "period-underwear"
  },
  "p-phd-wash": {
    "name": "pH-D Feminine Health Boric Acid Wash",
    "image": "https://i5.walmartimages.com/seo/pH-D-Feminine-Health-Boric-Acid-Sensitive-Foam-Wash-6-oz-1-Count_ef0c5b77-cf7f-485d-9566-bafafa7c46db.a8db6f10e1f5a3a7842630e0147b3261.jpeg",
    "price": "$12",
    "category": "intimate-care"
  },
  "p-pink-stork-bloat": {
    "name": "Pink Stork Bloat Support",
    "image": "",
    "price": "$22 for 30 capsules",
    "category": "supplement"
  },
  "p-playtex-sport": {
    "name": "Playtex Sport Tampons",
    "image": "https://target.scene7.com/is/image/Target/GUEST_b674b28e-9c6c-4d6d-a291-d45ab5200ba5",
    "price": "Check retailer for current price and pack size",
    "category": "tampon"
  },
  "p-poise-ultra-thin-moderate": {
    "name": "Poise Incontinence Pads for Women, Moderate Absorbency",
    "image": "https://target.scene7.com/is/image/Target/GUEST_64344ed6-a572-4af5-863a-8a83b7c09bc1",
    "price": "Check retailer for current price and pack size",
    "category": "incontinence"
  },
  "p-probiotics-women": {
    "name": "Garden of Life Dr. Formulated Probiotics Once Daily Women's Shelf-Stable 30 Capsules",
    "image": "",
    "price": "$36.79 for 30 capsules",
    "url": "https://www.gardenoflife.com/dr-formulated-probiotics-once-daily-womens-shelf-stable-vegetarian-capsules",
    "category": "supplement"
  },
  "p-proof-period": {
    "name": "Proof Period Underwear",
    "image": "https://m.media-amazon.com/images/I/81HsqBCJ9-L._AC_UL1500_.jpg",
    "price": "$20\u2013$40 per pair",
    "category": "period-underwear"
  },
  "p-queen-v-pop": {
    "name": "Queen V The Pop It Suppositories",
    "image": "",
    "price": "$15",
    "category": "intimate-care"
  },
  "p-rael-liners": {
    "name": "Rael Regular Organic Cotton Cover Panty Liners, 60 Count",
    "image": "/products/verified/p-rael-liners.png",
    "price": "Check retailer for current price and pack size",
    "category": "pad",
    "url": "https://www.getrael.com/products/regular-organic-cotton-liners",
    "imageSourceUrl": "https://www.getrael.com/products/regular-organic-cotton-liners",
    "imageVerifiedAt": "2026-09-25"
  },
  "p-rael-organic-pad": {
    "name": "Rael Large Organic Cotton Cover Pads With Wings",
    "image": "/products/verified/p-rael-organic-pad.png",
    "price": "Check retailer for current price (14 or 24 count)",
    "url": "https://www.getrael.com/products/large-organic-cotton-pads",
    "category": "pad",
    "imageSourceUrl": "https://www.getrael.com/products/large-organic-cotton-pads",
    "imageVerifiedAt": "2026-09-25"
  },
  "p-rael-overnight": {
    "name": "Rael Overnight Pads",
    "image": "https://www.getrael.com/cdn/shop/files/DTC_Overnight_Pads_12_CT_Lower_Count_2048x2048_1.png?v=1787356458&width=2048",
    "price": "$10 for 12",
    "category": "pad"
  },
  "p-rael-tampon": {
    "name": "Rael Organic Cotton Tampon Variety Pack, 32 Count",
    "image": "/products/verified/p-rael-tampon.png",
    "price": "Check retailer for current price and pack size",
    "category": "tampon",
    "url": "https://www.getrael.com/products/tampons-made-with-organic-cotton-value-pack",
    "imageSourceUrl": "https://www.getrael.com/products/tampons-made-with-organic-cotton-value-pack",
    "imageVerifiedAt": "2026-09-25"
  },
  "p-remifemin": {
    "name": "Remifemin (Black Cohosh)",
    "image": "",
    "price": "$17 for 60 tablets",
    "category": "supplement"
  },
  "p-seventh-gen-pad": {
    "name": "Seventh Generation Ultra Thin Pads",
    "image": "/products/seventhgeneration/ultra-thin-pads.png",
    "price": "Check retailer for current price and pack size",
    "category": "pad"
  },
  "p-seventh-gen-tampon": {
    "name": "Seventh Generation Organic Tampons",
    "image": "",
    "price": "$8 for 18",
    "category": "tampon"
  },
  "p-sweetspot-buff-brighten": {
    "name": "SweetSpot Labs Buff & Brighten AHA/BHA Body Exfoliating Pads",
    "image": "https://shop.sweetspotlabs.com/cdn/shop/products/buff_brightenjarcopy.jpg?v=1658328685",
    "price": "$18 for 50",
    "category": "intimate-care"
  },
  "p-tampax-radiant": {
    "name": "Tampax Radiant Tampons",
    "image": "",
    "price": "$9 for 18",
    "category": "tampon"
  },
  "p-tena-intimates-very-light-liner": {
    "name": "TENA Intimates Very Light Liner for Women",
    "image": "https://tena-images.essity.com/images-c5/138/498138/optimized-AzurePNG2K/tena-sen-car-ex-cov-very-light-liner-4x50-beauty-no-counts-3000x3000px.png?w=800&h=944&imPolicy=dynamic",
    "price": "$20.64 for 50",
    "category": "incontinence"
  },
  "p-tomboyx-period": {
    "name": "TomboyX Period Underwear",
    "image": "https://cdn.shopify.com/s/files/1/0204/2302/files/Plum_FL_Period_Bikini_1.jpg?v=1782399837",
    "price": "$28\u2013$34 per pair",
    "url": "https://tomboyx.com/",
    "category": "period-underwear"
  },
  "p-u-kotex-pad": {
    "name": "U by Kotex Clean Wear",
    "image": "",
    "price": "$8 for 18",
    "category": "pad"
  },
  "p-willow-pump": {
    "name": "Willow Wearable Breast Pump",
    "image": "https://m.media-amazon.com/images/I/61iiLEkgAtL._AC_UL1500_.jpg",
    "price": "$499",
    "category": "pregnancy"
  },
  "p-wuka-underwear": {
    "name": "Wuka Period Underwear",
    "image": "https://wuka.co.uk/cdn/shop/files/1-stretch-midi-brief-black-heavy-flow-full-length.jpg",
    "price": "$24\u2013$32 per pair",
    "category": "period-underwear"
  },
  "p-ziggy-disc": {
    "name": "Ziggy Cup (Menstrual Disc)",
    "image": "https://assets.intimina.com/files/static/product-images/2021-12/INTIMINA_Ziggy2_ProductShot_SizeA_Angle_425.jpg",
    "price": "$40 (reusable)",
    "category": "disc"
  },
  "p-inositol-wholesome": {
    "image": "/products/verified/p-inositol-wholesome.png",
    "url": "https://wholesomestory.com/products/myo-d-chiro-inositol",
    "imageSourceUrl": "https://wholesomestory.com/products/myo-d-chiro-inositol",
    "imageVerifiedAt": "2026-09-25",
    "price": "$27.95 for 120 capsules (30 servings)"
  },
  "p-veeda-pad": {
    "image": "/products/verified/p-veeda-pad.png",
    "url": "https://www.veedausa.com/products/pads",
    "imageSourceUrl": "https://www.veedausa.com/products/pads",
    "imageVerifiedAt": "2026-09-25",
    "price": "Check retailer for current price and pack size",
    "name": "Veeda Natural Cotton Ultra-Thin Pads With Wings"
  },
  "p-bodily-kit": {
    "image": "/products/verified/p-bodily-kit.jpg",
    "url": "https://itsbodily.com/products/postpartum-recovery-kit-save-11",
    "imageSourceUrl": "https://itsbodily.com/products/postpartum-recovery-kit-save-11",
    "imageVerifiedAt": "2026-09-25"
  },
  "p-cystex": {
    "image": "/products/verified/p-cystex.webp",
    "url": "https://www.cystex.com/cystex-urinary-pain-relief-tablets",
    "imageSourceUrl": "https://www.cystex.com/cystex-urinary-pain-relief-tablets",
    "imageVerifiedAt": "2026-09-25"
  },
  "p-ubiquinol-thorne": {
    "image": "/products/verified/p-ubiquinol-thorne.webp",
    "url": "https://www.thorne.com/products/dp/ubiquinol",
    "imageSourceUrl": "https://www.thorne.com/products/dp/ubiquinol",
    "imageVerifiedAt": "2026-09-25",
    "price": "Check retailer for current price and pack size"
  },
  "p-zinc": {
    "price": "Check retailer for current price and pack size",
    "name": "Garden of Life Vitamin Code Raw Zinc 30 mg",
    "url": "https://www.gardenoflife.com/products/our-brands/vitamin-code/vitamin-code-raw-zinc-vegan-capsules"
  },
  "p-stayfree-ultra": {
    "price": "Check retailer for current price and pack size"
  },
  "d-menolabs": {
    "image": "",
    "url": "https://apps.apple.com/us/app/menolife-menopause-tracker/id1494110596",
    "imageReviewStatus": "unavailable"
  },
  "p-lansinoh-pads": {
    "category": "postpartum"
  }
};

export function applyCatalogCorrections(product) {
  const correction = CATALOG_CORRECTIONS[product?.id];
  return correction ? { ...product, ...correction } : product;
}
