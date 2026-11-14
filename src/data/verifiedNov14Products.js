// Added Nov 14 2026 for open Notion tasks AYNA-256 ("sleep masks ... can include ostrich") and AYNA-273
// (focus group, Oct 26: "Options for joint aches"). Every fact below is from the page listed in
// researchSources, read on Nov 14 2026. Requested by the team in Notion; added at Ameera's request
// ("look at all the open tasks ... make sure each task is done").
//
// Not added, and why: SOMA's Cool Nights Eyemask (soma.com says it can't find the item, Nov 14);
// "Mellow Sleep" (no brand site we could verify); a Flamingo magnesium body lotion (shopflamingo.com
// sells a Gua Sha Calming Lotion with magnesium strips, and the page does not say the lotion has magnesium).
export const VERIFIED_NOV14_PRODUCTS = [
  {
    id: 'p-ostrichpillow-eye-mask',
    name: 'Ostrichpillow Eye Mask',
    brand: 'Ostrichpillow',
    category: 'sleep',
    subcategory: 'Sleep masks',
    type: 'physical',
    price: '$45',
    tags: ['sleep', 'sleep mask', 'eye mask', 'blackout', 'travel', 'non-ingestible'],
    healthFunctions: ['sleep'],
    summary: 'A contoured sleep mask the maker calls 100% blackout, with eye cups that keep pressure off the eyes and lashes. Hook-and-loop strap; machine washable on a gentle cycle.',
    howToUse: { intro: 'Wear it over your eyes for sleep, naps or travel.', steps: ['Fasten the hook-and-loop strap to fit (up to a 30 inch head, per the maker).', 'To clean, close the strap, wash at 30°C / 86°F on a gentle cycle in a mesh bag, and air dry.'], sourceUrl: 'https://ostrichpillow.com/products/eye-mask', sourceLabel: 'ostrichpillow.com' },
    materials: 'Polyurethane foam filling; 92% viscose, 8% elastane fabric; nylon and spandex hook-and-loop closure (maker FAQ).',
    url: 'https://ostrichpillow.com/products/eye-mask',
    image: 'https://cdn.shopify.com/s/files/1/0614/5831/7524/files/midnightgreyeyemask.jpg',
    whereToBuy: ['Brand site'],
    whereToBuyLinks: { 'Brand site': 'https://ostrichpillow.com/products/eye-mask' },
    warnings: [],
    researchSources: [{ url: 'https://ostrichpillow.com/products/eye-mask', what: 'Name, $45 price, blackout and contoured design, materials, washing and fit' }],
  },
  {
    id: 'p-voltaren-arthritis-pain-gel',
    name: 'Voltaren Arthritis Pain Gel (diclofenac sodium 1%)',
    brand: 'Voltaren',
    category: 'pain-relief',
    subcategory: 'Joint aches',
    type: 'physical',
    price: '$15.69–$26.49',
    tags: ['joint pain', 'arthritis pain', 'joint aches', 'topical', 'nsaid', 'otc medicine', 'fsa/hsa'],
    healthFunctions: ['pain'],
    fsaHsaEligible: true,
    regulatoryStatus: 'Over-the-counter medicine (Drug Facts label: diclofenac sodium 1%, an NSAID)',
    summary: 'An over-the-counter gel with diclofenac, an NSAID you rub on, for arthritis pain in the hands, wrists, elbows, feet, ankles or knees. The label says it may take up to 7 days to work and is not for immediate relief.',
    howToUse: { intro: 'Follow the Drug Facts label and its dosing card.', steps: ['Use 4 times a day, every day.', 'Do not use on more than 2 body areas at the same time.', 'Use for up to 21 days unless your doctor says otherwise.'], sourceUrl: 'https://ndclist.com/ndc/0067-8152/label', sourceLabel: 'Voltaren Drug Facts label' },
    warnings: [
      'Do not use if you have ever had an allergic reaction to another pain reliever or fever reducer; diclofenac may cause a severe allergic reaction, especially in people allergic to aspirin (label).',
      'Do not use during the last 3 months of pregnancy; if pregnant or breastfeeding, ask a health professional first (label).',
      'Ask a doctor first if you have high blood pressure, heart disease, liver cirrhosis, kidney disease, asthma, stomach problems or had a stroke, or take a diuretic or any other drug (label).',
      'NSAIDs can raise the risk of stomach bleeding, heart attack and stroke; stop and ask a doctor if pain lasts more than 21 days or new symptoms appear (label).',
      'Not for strains, sprains, bruises or sports injuries, and not in the eyes, nose or mouth (label).',
    ],
    url: 'https://www.target.com/p/voltaren-diclofenac-sodium-topical-arthritis-pain-relief-gel-tube/-/A-82551487',
    image: 'https://target.scene7.com/is/image/Target/GUEST_ce75fc63-f284-46ac-aed6-0636f45f8360',
    whereToBuy: ['Target'],
    whereToBuyLinks: { Target: 'https://www.target.com/p/voltaren-diclofenac-sodium-topical-arthritis-pain-relief-gel-tube/-/A-82551487' },
    researchSources: [
      { url: 'https://ndclist.com/ndc/0067-8152/label', what: 'Drug Facts: active ingredient, uses, warnings and directions' },
      { url: 'https://www.target.com/p/voltaren-diclofenac-sodium-topical-arthritis-pain-relief-gel-tube/-/A-82551487', what: 'Price range by size ($15.69–$26.49) and FSA/HSA eligible, Nov 14 2026' },
    ],
  },
];
