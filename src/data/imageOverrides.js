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
});

/** The official image entry for a product (or id), or null. */
export function officialImageFor(productOrId) {
  const id = typeof productOrId === 'string' ? productOrId : productOrId?.id;
  return (id && OFFICIAL_IMAGE_OVERRIDES[id]) || null;
}
