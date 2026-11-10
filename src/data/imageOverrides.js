// Official product images for catalog products whose stored image was broken,
// a placeholder, low-res, the wrong product or on a third-party / flaky host
// (audit Oct 21, 2026). The `image` fields in the product files are
// team-locked (teamCopy.lock.test.js), so the fix lives here and is applied at
// render time by productImageOverride() / productGallery() in
// productImageOverrides.js, the one lookup every product card, the product
// page gallery and Ecosystem tiles go through.
//
// Each entry: { src, alt, source, checkedOn }
//   src       the official image URL (brand site, brand CDN, App Store icon).
//             Rendered through /api/image-proxy like every external photo.
//   alt       what the photo shows.
//   source    the page the image was taken from.
//   checkedOn when it was loaded and looked at.
//
// These are remote for now: the sandbox that made this pass could not download
// images. When a local copy is made (public/products/catalog/<id>.webp, 640px
// square, white background, <= 150KB) add it to PRODUCT_IMAGE_OVERRIDES and
// drop the entry here; scripts/images/official-pending.json lists them.
//
// Products with no official image keep the designed "Photo coming soon" tile.
const CHECKED = '2026-10-21';
const appIcon = (path) => `https://is1-ssl.mzstatic.com/image/thumb/${path}/512x512bb.jpg`;
const amazon = (key) => `https://m.media-amazon.com/images/I/${key}._AC_SL800_.jpg`;
const target = (key) => `https://target.scene7.com/is/image/Target/GUEST_${key}?wid=800&hei=800&qlt=80&fmt=webp`;

export const OFFICIAL_IMAGE_OVERRIDES = Object.freeze({
  // Apps and services: the App Store icon instead of a wide social banner
  // (Calm, Headspace) or an image hosted by a third party (Oura: XDA).
  'd-headspace': {
    src: appIcon('Purple211/v4/47/69/b2/4769b27b-0ca9-879c-7348-37afa93a9525/AppIcon-0-0-1x_U007epad-0-1-85-220.png'),
    alt: 'Headspace app icon',
    source: 'https://apps.apple.com/us/app/headspace-sleep-meditation/id493145008',
    checkedOn: CHECKED,
  },
  'd-calm': {
    src: appIcon('Purple221/v4/84/9f/5f/849f5ff1-ceb7-d05d-00f8-7877b02544b8/AppIcon-0-0-1x_U007emarketing-0-11-0-85-220.png'),
    alt: 'Calm app icon',
    source: 'https://apps.apple.com/us/app/calm/id571800810',
    checkedOn: CHECKED,
  },
  'd-stardust': {
    src: appIcon('Purple221/v4/7e/48/55/7e485542-d911-0560-398b-b8188d697814/AppIcon-0-0-1x_U007ephone-0-1-0-85-220.png'),
    alt: 'Stardust period tracker app icon',
    source: 'https://apps.apple.com/us/app/stardust-period-tracker/id1495829322',
    checkedOn: CHECKED,
  },
  'd-apple-health': {
    src: appIcon('Purple221/v4/60/e8/ae/60e8ae47-8a07-ad37-3371-d515af4b4a43/cycle.tracking-0-0-1x_U007ewatch-0-1-P3-85-220.png'),
    alt: 'Apple Cycle Tracking icon',
    source: 'Apple App Store artwork (Cycle Tracking), the catalog image at icon size instead of a 1200x630 banner',
    checkedOn: CHECKED,
  },
  // Pod 4 and Ring Gen 3 are no longer on the brands' sites (Pod 6, Ring 4
  // now), so a current product photo would show the wrong generation. The
  // brand's own app icon until a photo of the listed model is on file.
  'd-eight-sleep': {
    src: appIcon('Purple221/v4/5d/5a/08/5d5a084c-f898-c2f5-67ca-b9fb0211ea73/AppIcon-0-0-1x_U007emarketing-0-8-0-sRGB-85-220.png'),
    alt: 'Eight Sleep app icon',
    source: 'https://apps.apple.com/us/app/eight-sleep/id1086913845',
    checkedOn: CHECKED,
  },
  'd-oura': {
    src: appIcon('Purple211/v4/a8/3e/4e/a83e4ebb-f262-cd77-c428-96c6ab71e28e/AppIcon-0-0-1x_U007ephone-0-1-0-85-220.png'),
    alt: 'Oura app icon',
    source: 'https://apps.apple.com/us/app/oura/id1043837948',
    checkedOn: CHECKED,
  },
  // Was a logo from seeklogo.com (third party).
  'd-visana': {
    src: 'https://cdn.prod.website-files.com/665de822e7cb2e44b31a0c0e/668416243c57b6be1bdcf3a7_Open%20Graph%20Image%20-%20Home2.png',
    alt: 'Visana Health virtual women\'s care',
    source: 'https://www.visanahealth.com/',
    checkedOn: CHECKED,
  },

  // Physical products with no photo at all.
  'p-aleve-naproxen-220': {
    src: 'https://www.aleve.com/sites/g/files/vrxlpx56211/files/2023-09/aleve-PDP-AleveTablets.jpg',
    alt: 'Aleve Tablets box and bottle',
    source: 'https://www.aleve.com/products/aleve-tablets/',
    checkedOn: CHECKED,
  },
  'p-visby-womens-sti-test': {
    src: 'https://cdn.shopify.com/s/files/1/0687/8484/9052/files/Visby-Women_s-STI-Device-in-hand.webp?width=800',
    alt: 'Visby Women\'s At-Home STI Test device held in a hand',
    source: 'https://visby.com/products/visby-womens-at-home-sti-test-kit',
    checkedOn: CHECKED,
  },

  // kieró: the stored photos were mood shots (agave leaves, dragon fruit);
  // these are the brand's close-ups of the jar.
  'p-kiero-moisturizing-barrier-cream': {
    src: 'https://cdn.shopify.com/s/files/1/0712/7246/4570/files/kiero-_-01_ca9d328d-18b7-4a70-a8e5-4e96eecf1dea.jpg?width=800',
    alt: 'kieró Moisturizing Barrier Cream jar',
    source: 'https://us.kieroskincare.com/products/moisturizing-barrier-cream',
    checkedOn: CHECKED,
  },
  'p-kiero-balance-toner-pads': {
    src: 'https://cdn.shopify.com/s/files/1/0712/7246/4570/files/kiero-_-01.jpg?width=800',
    alt: 'kieró Balance Toner Pads jar',
    source: 'https://us.kieroskincare.com/products/balance-toner-pads',
    checkedOn: CHECKED,
  },
  // Was the same burlap-bag photo used for other Tampon Tribe products; this is
  // the pack shot from the teen pads page.
  'p-tampontribe-teen-pads': {
    src: 'https://cdn.shopify.com/s/files/1/0048/6971/8083/files/new-organic-teen-pads-7008691.jpg?width=800',
    alt: 'Tampon Tribe organic pads box',
    source: 'https://tampontribe.com/products/organic-teen-pads',
    checkedOn: CHECKED,
  },
  'p-goodbug-good-down-there': {
    src: 'https://cdn.shopify.com/s/files/1/0657/8225/1745/products/GoodDownThere_3.jpg?width=800',
    alt: 'The Good Bug Good Down There sticks and box',
    source: 'https://thegoodbug.com/products/good-down-there-for-vaginal-health',
    checkedOn: CHECKED,
  },

  // Low-res (500px, some under 300px wide): the same listing photo at 800px.
  'p-cbb-perfect-ph-probiotic-gummies': { src: amazon('41qCKV-R2gL'), alt: 'CBB Perfect PH Probiotic Gummies bottle', source: 'Amazon listing main image', checkedOn: CHECKED },
  'p-estherformula-ceramide-strips': { src: amazon('51q39aFdEdL'), alt: 'Esther Formula Ceramide Strips box', source: 'Amazon listing main image', checkedOn: CHECKED },
  'p-hero-mighty-patch-original': { src: amazon('61p+1+md+8L'), alt: 'Mighty Patch Original box', source: 'Amazon listing main image (Hero Cosmetics store)', checkedOn: CHECKED },
  'p-hero-pimple-correct': { src: amazon('61Le1S+bw0L'), alt: 'Pimple Correct gel pen and box', source: 'Amazon listing main image (Hero Cosmetics store)', checkedOn: CHECKED },
  'p-hero-mighty-cleanser': { src: amazon('6140V0SQHdL'), alt: 'Mighty Cleanser tube', source: 'Amazon listing main image (Hero Cosmetics store)', checkedOn: CHECKED },
  'p-cocoandeve-tripeptide-hair-density-serum': { src: amazon('51xmpBxUvcL'), alt: 'Coco & Eve Tripeptide Hair Density Serum bottle', source: 'Amazon listing main image', checkedOn: CHECKED },
  'p-najeau-follicle-drops': { src: amazon('512842JgyVL'), alt: 'Najeau Follicle Drops bottle', source: 'Amazon listing main image', checkedOn: CHECKED },
  'p-refilled-cytokine-effector-plus': { src: amazon('61AgTzHlPLL'), alt: 'Refilled Cytokine Effector Plus bottle', source: 'Amazon listing main image', checkedOn: CHECKED },
  'p-bigvita-scalp-serum-plus': { src: amazon('51O7+TsgxZL'), alt: 'BIGVITA Scalp Serum+ bottles', source: 'Amazon listing main image', checkedOn: CHECKED },
  'p-arrae-mb-1': { src: amazon('51cUawzhbWL'), alt: 'Arrae MB-1 jar', source: 'Amazon listing main image', checkedOn: CHECKED },
  'p-cbb-13-in-1-womens-gummies': { src: amazon('51slr4TLhVL'), alt: 'CBB Women\'s 13 in 1 gummies bottle', source: 'Amazon listing main image', checkedOn: CHECKED },
  // 400px Target images: the same image at 800px.
  'p-advil-ibuprofen-200': { src: target('0ffb5fb8-4373-4132-85cd-ff831395c45f'), alt: 'Advil Ibuprofen 200 mg bottle', source: 'Target listing main image', checkedOn: CHECKED },
  'p-monistat-3-combo': { src: target('17956779-2a01-4b05-a23d-33ae2edd3a56'), alt: 'Monistat 3 combination pack box', source: 'Target listing main image', checkedOn: CHECKED },
  'p-womens-rogaine-foam': { src: target('46c2cf3c-9fac-49cf-82eb-0bb182f66dc7'), alt: 'Women\'s Rogaine foam box and cans', source: 'Target listing main image', checkedOn: CHECKED },
  'p-panoxyl-bpo-10-wash': { src: target('99e7b206-1c38-49b8-9762-0c4533700929'), alt: 'PanOxyl 10% foaming wash tube', source: 'Target listing main image', checkedOn: CHECKED },
  'p-differin-adapalene-gel': { src: target('38a3ac7f-4dc8-4bf4-b9df-a38bb1e270a5'), alt: 'Differin Gel box', source: 'Target listing main image', checkedOn: CHECKED },
  'p-metamucil-psyllium-orange': { src: target('e38a4ac5-9e82-47dc-ba6a-c62be9537c9e'), alt: 'Metamucil orange powder tub', source: 'Target listing main image', checkedOn: CHECKED },
  'p-miralax-peg-3350': { src: target('e144d80a-8509-4b9d-9c1c-e0ddb5c971d1'), alt: 'MiraLAX powder bottle', source: 'Target listing main image', checkedOn: CHECKED },
  'p-nature-made-folic-acid-400': { src: target('c1f5861a-74ef-4429-a9b2-bf0d8ba7446c'), alt: 'Nature Made Folic Acid bottle', source: 'Target listing main image', checkedOn: CHECKED },
  'p-rugby-vitamin-b6-25': { src: target('82e8093d-18ff-416c-8cc1-df4e6c2b314e'), alt: 'Rugby Vitamin B-6 bottle', source: 'Target listing main image', checkedOn: CHECKED },
  // 2560px Walmart originals (slow): the same image at 800px.
  'p-taro-clotrimazole-7': {
    src: 'https://i5.walmartimages.com/seo/Taro-Clotrimazole-7-Vaginal-Cream-45-g_01c243f1-eccb-4843-9210-556e40650cb5.99099c95694f52d78d8c1c6a124feb83.jpeg?odnHeight=800&odnWidth=800&odnBg=FFFFFF',
    alt: 'Taro Clotrimazole 7 Day Vaginal Cream box',
    source: 'Walmart listing main image',
    checkedOn: CHECKED,
  },
  'p-easyhome-lh-strips-50': {
    src: 'https://i5.walmartimages.com/seo/Easy-Home-Reliable-Ovulation-Predictor-Kit-50-LH-Tests-50-Count_97181863-097f-4d20-8305-1f27d899d7e1.f07b15b47e10c12116db2df39dc6a3a8.jpeg?odnHeight=800&odnWidth=800&odnBg=FFFFFF',
    alt: 'Easy@Home Ovulation Test strips box',
    source: 'Walmart listing main image',
    checkedOn: CHECKED,
  },
  // Nov 9 photo pass (founder: "make sure all the pictures are on each product"): every live product
  // was loaded through /api/image-proxy; these had no image or a broken one. Each was loaded and looked at.
  'd-caria-caria-menopause-midlife': { src: appIcon('PurpleSource211/v4/81/78/8d/81788d6b-dd31-f179-232b-27653803a93b/Placeholder.mill'), alt: 'Caria app icon', source: 'https://apps.apple.com/us/app/id1477621356', checkedOn: '2026-11-09' },
  'd-health-her-health-her-app': { src: appIcon('PurpleSource221/v4/39/b0/59/39b059ea-7d82-dfbb-0d79-0cfb65344e91/Placeholder.mill'), alt: 'Health & Her app icon', source: 'https://apps.apple.com/us/app/id1519199698', checkedOn: '2026-11-09' },
  'd-menolog-listed-as-menelle-perimenopause-tracker': { src: appIcon('PurpleSource221/v4/57/7a/71/577a7135-5845-b640-c18c-2234fd7eaabd/Placeholder.mill'), alt: 'Menelle app icon', source: 'https://apps.apple.com/us/app/id6757102221', checkedOn: '2026-11-09' },
  'd-perry-perry-perimenopause-community': { src: appIcon('PurpleSource221/v4/94/4f/a5/944fa545-feb7-19ca-a8f7-8c6aeb94632f/Placeholder.mill'), alt: 'perry app icon', source: 'https://apps.apple.com/us/app/id1544428724', checkedOn: '2026-11-09' },
  'd-stella-stella-menopause-relief': { src: appIcon('PurpleSource211/v4/8f/c7/d0/8fc7d096-43a6-3e34-4ecb-37f5e7b85d23/Placeholder.mill'), alt: 'Stella app icon', source: 'https://apps.apple.com/us/app/id1577904186', checkedOn: '2026-11-09' },
  'd-function-health-function-health-membership': { src: 'https://www.functionhealth.com/_sanity/images/bmk2ab2m/production/181ed95953ce411e3be68620e1425b28f99db2d5-2400x1260.jpg', alt: 'Function Health membership', source: 'https://www.functionhealth.com/pricing', checkedOn: '2026-11-09' },
  'd-twentyeight-health-birth-control-emergency-contr': { src: 'https://cdn.prod.website-files.com/6167603546bbce1fb989bab3/6a679c061e3933b4b6658d00_bc_landing-p-3200.webp', alt: 'Twentyeight Health birth control', source: 'https://www.twentyeighthealth.com/birth-control', checkedOn: '2026-11-09' },
  'p-intimina-lily-cup-compact': { src: 'https://assets.intimina.com/files/static/product-images/2022-04/550x550_LC%20Compact_EN.jpg', alt: 'INTIMINA Lily Cup Compact and its case', source: 'https://www.intimina.com/lily-cup-compact', checkedOn: '2026-11-09' },
  'p-intimina-ziggy-cup-2': { src: 'https://assets.intimina.com/files/static/product-images/2022-04/550x550_Ziggy%202_EN.jpg', alt: 'INTIMINA Ziggy Cup 2 menstrual disc', source: 'https://www.intimina.com/ziggy-cup-2', checkedOn: '2026-11-09' },
  'p-milli-vaginal-dilator': { src: 'https://www.hellomilli.com/wp-content/uploads/2023/08/Milli-1024x518.webp', alt: 'Milli vaginal dilator', source: 'https://www.hellomilli.com/', checkedOn: '2026-11-09' },
  'p-thorne-hormone-advantage-formerly-dim-advantage-sku-sp684': { src: 'https://d1vo8zfysxy97v.cloudfront.net/media/product/sp684__vddd5f8f8f9d55fe38494e5b3b7a0f7eb4a4e4619.webp', alt: 'Thorne Hormone Advantage bottle', source: 'https://www.thorne.com/products/dp/hormone-advantage', checkedOn: '2026-11-09' },
  'p-thorne-magnesium-citramate': { src: 'https://d1vo8zfysxy97v.cloudfront.net/media/product/m272__vda7610df9740590138e35b7c377895c4d7d1a6a1.webp', alt: 'Thorne Magnesium CitraMate bottle', source: 'https://www.thorne.com/products/dp/magnesium-citramate', checkedOn: '2026-11-09' },
  // Its image was O Positiv's site-wide share picture (the URO packs), the same as another product (focus group, Nov 9).
  'p-o-positiv-meno-heart-health-and-blood-pressure-support-capsule': { src: 'https://cdn.shopify.com/s/files/1/0588/9340/2261/files/pdp-image1-ezgif.com-png-to-webp-converter.webp?v=1764801824', alt: 'O Positiv MENO Heart + Blood Pressure Support Capsules jar', source: 'https://opositiv.com/products/meno-heart-health-blood-pressure-support-capsules', checkedOn: '2026-11-09' },
  'p-trinny-london-naked-ambition-azelaic-acid-exosomes-vitamin-c-serum': { src: 'https://trinnylondon.com/cdn/shop/files/naked-ambition-serum-skincare-01.png', alt: 'Trinny London Naked Ambition serum', source: 'https://trinnylondon.com/us/products/naked-ambition', checkedOn: '2026-11-09' },
});

/** The official image entry for a product (or id), or null. */
export function officialImageFor(productOrId) {
  const id = typeof productOrId === 'string' ? productOrId : productOrId?.id;
  return (id && OFFICIAL_IMAGE_OVERRIDES[id]) || null;
}
