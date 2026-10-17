// ayna "evidence-backed basics" catalog entries.
// Compiled 2026-10-17. Every fact below comes from a page opened on that date (sources listed above each entry).
// Retail prices and ratings are as shown on the retailer page that day and will change.
// Images are the main product image listed on the retailer page (retailer main images are packshots);
// they could not be downloaded from this environment for a visual white-background check.

const ATTRIBUTION = 'ayna synthesis of peer-reviewed literature and clinical guidance. Not a direct clinician quote.';

export const BASICS_PRODUCTS = [

  // ── 1a. Advil (ibuprofen 200 mg) ─────────────────────────────
  // Sources:
  //  - Label: https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=1a665e64-9f30-be37-4a83-38789f1f1e89 (Haleon US Holdings LLC)
  //  - Retail: https://www.target.com/p/advil-pain-reliever-fever-reducer-tablets-ibuprofen-nsaid/-/A-15772219
  //  - Evidence: https://medlineplus.gov/periodpain.html
  {
    id: 'p-advil-ibuprofen-200',
    name: 'Advil Ibuprofen 200 mg Tablets',
    brand: 'Advil',
    category: 'medication',
    type: 'physical',
    internal: false,
    healthFunctions: ['cramp-relief'],
    tags: ['cramps', 'endometriosis', 'discomfort', 'cost'],
    price: '$23.49 for 300 tablets at Target (also sold in 20, 24, 100 and 200 counts)',
    userRating: 4.7,
    whereToBuy: ['Target'],
    url: 'https://www.target.com/p/advil-pain-reliever-fever-reducer-tablets-ibuprofen-nsaid/-/A-15772219',
    image: 'https://target.scene7.com/is/image/Target/GUEST_0ffb5fb8-4373-4132-85cd-ff831395c45f',
    summary: "Over-the-counter ibuprofen 200 mg, an NSAID pain reliever. The label lists menstrual cramps among its uses, along with headache, backache, muscle aches and fever. Adults take 1 tablet every 4 to 6 hours (2 if 1 does not help), and no more than 6 in 24 hours unless a doctor says otherwise.",
    safety: {
      fdaStatus: 'FDA-regulated over-the-counter drug with a Drug Facts label (DailyMed, Haleon US Holdings LLC).',
      materials: 'Coated oral tablet.',
      recalls: 'No recalls found on the pages reviewed.',
      allergens: 'Ibuprofen may cause a severe allergic reaction, especially in people allergic to aspirin. Do not use if you have had an allergic reaction to any other pain reliever or fever reducer.',
      sideEffects: 'The label warns that NSAIDs can cause severe stomach bleeding and that NSAIDs (except aspirin) increase the risk of heart attack, heart failure and stroke, with higher risk at higher doses or longer use. Take with food or milk if it upsets your stomach.',
      opinionAlerts: 'Avoid at 20 weeks of pregnancy or later unless a doctor directs it. Ibuprofen may reduce the heart protection of daily aspirin.'
    },
    clinicianOpinionSource: 'independent',
    clinicianAttribution: ATTRIBUTION,
    doctorOpinion: "MedlinePlus lists NSAIDs such as ibuprofen as a first step for period pain, taken when symptoms start or when your period begins and continued for a few days. They are not right for everyone: skip them if you have ulcers or other stomach problems, bleeding problems or liver disease, or a true aspirin allergy. See a clinician if NSAIDs and self-care do not help, cramps suddenly get worse, or you have pain when you are not on your period. This is guidance about ibuprofen as a medicine, not a test of this brand.",
    communityReview: 'Target shows a 4.69 out of 5 rating from 12,462 reviews for this Advil tablet listing.',
    communityReviewSourceUrl: 'https://www.target.com/p/advil-pain-reliever-fever-reducer-tablets-ibuprofen-nsaid/-/A-15772219',
    communityReviewSourceLabel: 'Target reviews',
    ingredients: 'Active: ibuprofen 200 mg (NSAID) per tablet. Inactive ingredients vary by Advil format; see the DailyMed label.',
    effectiveness: "Ibuprofen is an NSAID that clinical sources such as MedlinePlus recommend for menstrual cramps. Evidence is for the ingredient in general and does not validate this brand over generic ibuprofen 200 mg, which has the same active ingredient.",
    warnings: [
      'Allergy alert: ibuprofen may cause a severe allergic reaction, especially in people allergic to aspirin.',
      'Stomach bleeding warning: risk is higher if you are 60 or older, have had ulcers or bleeding problems, take a blood thinner or steroid, take other NSAIDs, have 3 or more alcoholic drinks a day, or take more or longer than directed.',
      'Heart attack and stroke warning: NSAIDs, except aspirin, increase the risk of heart attack, heart failure and stroke.',
      'Do not use right before or after heart surgery, or if you have had an allergic reaction to any other pain reliever or fever reducer.',
      'Ask a doctor first if you have high blood pressure, heart disease, liver cirrhosis, kidney disease, asthma, a past stroke, stomach problems such as heartburn, or take a diuretic.',
      'Ask a doctor or pharmacist first if you take aspirin for heart attack or stroke, or any other drug.',
      'Stop use and ask a doctor if you see signs of stomach bleeding, heart or stroke symptoms, pain gets worse or lasts more than 10 days, or fever lasts more than 3 days.',
      'If pregnant or breast-feeding, ask a health professional before use. It is especially important not to use ibuprofen at 20 weeks or later in pregnancy unless a doctor directs it.',
      'Adults and children 12 and over: do not exceed 6 tablets in 24 hours unless directed by a doctor. Children under 12: ask a doctor.'
    ],
    verificationLinks: {
      doctor: { links: [
        { url: 'https://medlineplus.gov/periodpain.html', text: 'MedlinePlus: Period Pain', summary: 'Lists NSAIDs including ibuprofen and naproxen for period pain, who should avoid them, and when to see a provider.' }
      ] },
      scientific: { links: [
        { url: 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=1a665e64-9f30-be37-4a83-38789f1f1e89', text: 'DailyMed: Advil (ibuprofen) tablet label', summary: 'Official Drug Facts: ibuprofen 200 mg, uses including menstrual cramps, full warnings and directions.' }
      ] },
      community: { links: [
        { url: 'https://www.target.com/p/advil-pain-reliever-fever-reducer-tablets-ibuprofen-nsaid/-/A-15772219', text: 'Target: Advil Tablets (4.69/5, 12,462 reviews)', summary: 'Retail listing with price, sizes and customer ratings.' }
      ] }
    }
  },

  // ── 1b. Aleve (naproxen sodium 220 mg) ───────────────────────
  // Sources:
  //  - Label (Bayer HealthCare LLC; uses, directions, ingredients): https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=00ef5b30-71d0-4cb4-84a3-48c67d1cea2a
  //  - Label warnings (ALEVE 220 mg, repackaged by R J General Corporation; Bayer page did not render warnings text):
  //    https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=46e7b298-9e19-49b6-be71-e4fdcb09a5d4
  //  - Retail: https://www.target.com/p/aleve-tablets-with-naproxen-sodium-220mg-nsaid-pain-reliever-fever-reducer-50-count/-/A-93719226 (no image URL on page)
  //  - Evidence: https://medlineplus.gov/periodpain.html
  {
    id: 'p-aleve-naproxen-220',
    name: 'Aleve Naproxen Sodium 220 mg Tablets',
    brand: 'Aleve',
    category: 'medication',
    type: 'physical',
    internal: false,
    healthFunctions: ['cramp-relief'],
    tags: ['cramps', 'endometriosis', 'discomfort'],
    price: '$14.99 for 50 tablets at Target',
    userRating: 4.8,
    whereToBuy: ['Target'],
    url: 'https://www.target.com/p/aleve-tablets-with-naproxen-sodium-220mg-nsaid-pain-reliever-fever-reducer-50-count/-/A-93719226',
    image: '',
    summary: "Over-the-counter naproxen sodium 220 mg, a longer-acting NSAID. The label lists menstrual cramps among its uses. Adults take 1 tablet every 8 to 12 hours with a full glass of water (2 may be taken within the first hour for the first dose), and no more than 3 tablets in 24 hours.",
    safety: {
      fdaStatus: 'FDA-regulated over-the-counter drug with a Drug Facts label (DailyMed, Bayer HealthCare LLC).',
      materials: 'Oral tablet.',
      recalls: 'No recalls found on the pages reviewed.',
      allergens: 'Can cause severe allergic reactions, especially in people allergic to aspirin (hives, facial swelling, wheezing, shock, rash, blisters). Contains FD&C Blue #2 lake.',
      sideEffects: 'Can cause severe stomach bleeding. The risk of heart attack or stroke may increase if you use more than directed or for longer than directed. Take with food or milk if it upsets your stomach.',
      opinionAlerts: 'The label says it is especially important not to use naproxen sodium during the last 3 months of pregnancy unless definitely directed by a doctor.'
    },
    clinicianOpinionSource: 'independent',
    clinicianAttribution: ATTRIBUTION,
    doctorOpinion: "MedlinePlus lists NSAIDs such as naproxen for period pain, taken when symptoms start or when your period begins. Naproxen is dosed less often than ibuprofen, which some people find easier. The same cautions apply: avoid it with ulcers or other stomach problems, bleeding problems, liver disease or a true aspirin allergy, and see a clinician if cramps are severe, new after 25, or happen when you are not on your period. This is guidance about naproxen as a medicine, not a test of this brand.",
    communityReview: 'Target shows a 4.8 out of 5 rating from 568 reviews for this Aleve 50-count listing.',
    communityReviewSourceUrl: 'https://www.target.com/p/aleve-tablets-with-naproxen-sodium-220mg-nsaid-pain-reliever-fever-reducer-50-count/-/A-93719226',
    communityReviewSourceLabel: 'Target reviews',
    ingredients: 'Active: naproxen sodium 220 mg (naproxen 200 mg) (NSAID). Inactive: FD&C blue #2 lake, hypromellose, magnesium stearate, microcrystalline cellulose, polyethylene glycol, povidone, talc, titanium dioxide.',
    effectiveness: "Naproxen is one of the NSAIDs that clinical sources such as MedlinePlus recommend for menstrual cramps. Evidence is for the ingredient in general and does not validate this brand over generic naproxen sodium 220 mg.",
    warnings: [
      'Allergy alert: naproxen sodium may cause a severe allergic reaction, especially in people allergic to aspirin.',
      'Stomach bleeding warning: risk is higher if you are 60 or older, have had ulcers or bleeding problems, take a blood thinner or steroid, take other NSAIDs, have 3 or more alcoholic drinks a day, or take more or longer than directed.',
      'The risk of heart attack or stroke may increase if you use more than directed or for longer than directed.',
      'Do not use right before or after heart surgery, or if you have had an allergic reaction to any other pain reliever or fever reducer.',
      'Ask a doctor first if you have high blood pressure, heart disease, liver cirrhosis, kidney disease, asthma, stomach problems such as heartburn, or take a diuretic.',
      'Stop use and ask a doctor if you see signs of stomach bleeding, have trouble swallowing, pain gets worse or lasts more than 10 days, or fever lasts more than 3 days.',
      'If pregnant or breast-feeding, ask a health professional before use. It is especially important not to use naproxen sodium during the last 3 months of pregnancy unless definitely directed to do so by a doctor.',
      'Adults and children 12 and over: do not exceed 2 tablets in any 8 to 12 hour period or 3 tablets in 24 hours. Children under 12: ask a doctor.'
    ],
    verificationLinks: {
      doctor: { links: [
        { url: 'https://medlineplus.gov/periodpain.html', text: 'MedlinePlus: Period Pain', summary: 'Lists NSAIDs including naproxen for period pain, who should avoid them, and when to see a provider.' }
      ] },
      scientific: { links: [
        { url: 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=00ef5b30-71d0-4cb4-84a3-48c67d1cea2a', text: 'DailyMed: Aleve (naproxen sodium) label, Bayer', summary: 'Official Drug Facts: naproxen sodium 220 mg, uses including menstrual cramps, directions and inactive ingredients.' },
        { url: 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=46e7b298-9e19-49b6-be71-e4fdcb09a5d4', text: 'DailyMed: Aleve 220 mg label warnings', summary: 'Full Aleve warning text, including the pregnancy warning about the last 3 months of pregnancy.' }
      ] },
      community: { links: [
        { url: 'https://www.target.com/p/aleve-tablets-with-naproxen-sodium-220mg-nsaid-pain-reliever-fever-reducer-50-count/-/A-93719226', text: 'Target: Aleve 50 ct (4.8/5, 568 reviews)', summary: 'Retail listing with price and customer ratings.' }
      ] }
    }
  },

  // ── 2a. Monistat 3 (miconazole nitrate) ──────────────────────
  // Sources:
  //  - Label (Monistat 3 Combination Pack, prefilled applicators + external cream): https://dailymed.nlm.nih.gov/dailymed/fda/fdaDrugXsl.cfm?setid=02c497e9-3b72-4dd2-83eb-a62b2eba1a9f&type=display
  //  - Retail: https://www.target.com/p/monistat-3-dose-yeast-infection-treatment-3-prefilled-applicators-38-external-itch-cream-0-84oz/-/A-93324897
  //  - Evidence: https://www.cdc.gov/std/treatment-guidelines/candidiasis.htm
  {
    id: 'p-monistat-3-combo',
    name: 'Monistat 3-Dose Yeast Infection Treatment (Prefilled Applicators + External Itch Cream)',
    brand: 'Monistat',
    category: 'intimate-care',
    type: 'physical',
    internal: false,
    healthFunctions: ['vaginal-health'],
    tags: ['vaginal-health', 'discomfort'],
    price: '$15.89 at Target',
    userRating: 4.2,
    whereToBuy: ['Target'],
    url: 'https://www.target.com/p/monistat-3-dose-yeast-infection-treatment-3-prefilled-applicators-38-external-itch-cream-0-84oz/-/A-93324897',
    image: 'https://target.scene7.com/is/image/Target/GUEST_17956779-2a01-4b05-a23d-33ae2edd3a56',
    summary: "A 3-night over-the-counter treatment for vaginal yeast infections. It comes with 3 prefilled applicators of miconazole nitrate 4% (200 mg each), used at bedtime 3 nights in a row, plus a tube of 2% miconazole cream for itching outside the vagina. For people who have had a yeast infection diagnosed by a doctor before.",
    safety: {
      fdaStatus: 'FDA-regulated over-the-counter drug with a Drug Facts label (DailyMed, Monistat 3 Combination Pack).',
      materials: 'Prefilled vaginal cream applicators and an external cream tube.',
      recalls: 'No recalls found on the pages reviewed.',
      allergens: 'Inactive ingredients include propylene glycol, cetyl alcohol and stearyl alcohol. Stop and ask a doctor if you get a rash or hives.',
      sideEffects: 'A mild increase in burning, itching or irritation may occur.',
      opinionAlerts: 'The cream can damage condoms and diaphragms. Ask a doctor first if you take warfarin, since bleeding or bruising may occur.'
    },
    clinicianOpinionSource: 'independent',
    clinicianAttribution: ATTRIBUTION,
    doctorOpinion: "The CDC lists miconazole 4% cream for 3 days and miconazole 200 mg vaginal suppositories for 3 days among recommended over-the-counter options for uncomplicated vaginal yeast infections, and reports that azole treatment relieves symptoms in 80% to 90% of people who finish it. The CDC also notes that having had a yeast infection before does not make self-diagnosis reliable, so get checked if symptoms do not clear or come back within 2 months. In pregnancy, the CDC recommends only 7-day topical azole courses, so a 3-day product is not the pregnancy choice. This is guidance about miconazole, not a test of this brand.",
    communityReview: 'Target shows a 4.21 out of 5 rating from 173 reviews for this Monistat 3 listing.',
    communityReviewSourceUrl: 'https://www.target.com/p/monistat-3-dose-yeast-infection-treatment-3-prefilled-applicators-38-external-itch-cream-0-84oz/-/A-93324897',
    communityReviewSourceLabel: 'Target reviews',
    ingredients: 'Active: miconazole nitrate 4% (200 mg per prefilled applicator); external cream miconazole nitrate 2%. Inactive (both creams): benzoic acid, cetyl alcohol, isopropyl myristate, polysorbate 60, potassium hydroxide, propylene glycol, purified water, stearyl alcohol.',
    effectiveness: "Miconazole is a CDC-recommended over-the-counter azole for uncomplicated vaginal yeast infections. Category-level evidence does not validate this brand over store-brand miconazole 3, which has the same active ingredient and strength.",
    warnings: [
      'For vaginal use only. Do not use if you have never had a vaginal yeast infection diagnosed by a doctor.',
      'Ask a doctor first if this is your first time with vaginal itching and discomfort; if you have lower abdominal, back or shoulder pain, fever, chills, nausea, vomiting or foul-smelling discharge; if you get yeast infections often (about once a month or 3 in 6 months); or if you may have been exposed to HIV.',
      'Ask a doctor or pharmacist first if you take the prescription blood thinner warfarin, because bleeding or bruising may occur.',
      'While using: do not use tampons, douches, spermicides or other vaginal products, and do not have vaginal intercourse. Condoms and diaphragms may be damaged.',
      'Stop use and ask a doctor if symptoms do not improve in 3 days, last more than 7 days, or you get a rash, hives, abdominal pain, fever, chills, nausea, vomiting or foul-smelling discharge.',
      'If pregnant or breast-feeding, ask a health professional before use.',
      'Children under 12: ask a doctor.'
    ],
    verificationLinks: {
      doctor: { links: [
        { url: 'https://www.cdc.gov/std/treatment-guidelines/candidiasis.htm', text: 'CDC STI Treatment Guidelines: Vulvovaginal Candidiasis', summary: 'Lists OTC miconazole and clotrimazole regimens, 80% to 90% response with azoles, when to seek testing, and 7-day topical azoles only in pregnancy.' }
      ] },
      scientific: { links: [
        { url: 'https://dailymed.nlm.nih.gov/dailymed/fda/fdaDrugXsl.cfm?setid=02c497e9-3b72-4dd2-83eb-a62b2eba1a9f&type=display', text: 'DailyMed: Monistat 3 Combination Pack label', summary: 'Official Drug Facts: miconazole nitrate 4% prefilled applicators and 2% external cream, warnings and directions.' }
      ] },
      community: { links: [
        { url: 'https://www.target.com/p/monistat-3-dose-yeast-infection-treatment-3-prefilled-applicators-38-external-itch-cream-0-84oz/-/A-93324897', text: 'Target: Monistat 3-Dose (4.21/5, 173 reviews)', summary: 'Retail listing with price and customer ratings.' }
      ] }
    }
  },

  // ── 2b. Taro Clotrimazole 7 (clotrimazole 1%) ────────────────
  // Sources:
  //  - Label (Clotrimazole Vaginal Cream USP 1%, 45 g, NDC 51672-2003-6, Sun Pharmaceutical Industries / distributed by Ohm Laboratories):
  //    https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=f7192955-8f8c-45dd-a215-8ac2c1f6444f
  //  - Retail (sold by Ohm Labs, fulfilled by Walmart): https://www.walmart.com/ip/Taro-Clotrimazole-7-Vaginal-Cream-45-g/46008111
  //  - Evidence: https://www.cdc.gov/std/treatment-guidelines/candidiasis.htm
  {
    id: 'p-taro-clotrimazole-7',
    name: 'Taro Clotrimazole 1% 7-Day Vaginal Cream',
    brand: 'Taro',
    category: 'intimate-care',
    type: 'physical',
    internal: false,
    healthFunctions: ['vaginal-health'],
    tags: ['vaginal-health', 'discomfort', 'cost'],
    price: '$6.29 for 1.5 oz (45 g) at Walmart',
    userRating: 4.6,
    whereToBuy: ['Walmart'],
    url: 'https://www.walmart.com/ip/Taro-Clotrimazole-7-Vaginal-Cream-45-g/46008111',
    image: 'https://i5.walmartimages.com/seo/Taro-Clotrimazole-7-Vaginal-Cream-45-g_01c243f1-eccb-4843-9210-556e40650cb5.99099c95694f52d78d8c1c6a124feb83.jpeg',
    summary: "A low-cost 7-night over-the-counter treatment for vaginal yeast infections with clotrimazole 1%. Insert one applicatorful at bedtime for 7 days in a row; the same cream can be used on itchy skin outside the vagina twice a day for up to 7 days. For people who have had a yeast infection diagnosed by a doctor before.",
    safety: {
      fdaStatus: 'FDA-regulated over-the-counter drug with a Drug Facts label (DailyMed, clotrimazole vaginal cream USP 1%).',
      materials: '45 g tube of vaginal cream with a reusable applicator (wash after each use).',
      recalls: 'No recalls found on the pages reviewed.',
      allergens: 'Inactive ingredients include benzyl alcohol and cetostearyl alcohol. Stop and ask a doctor if you get a rash or hives.',
      sideEffects: 'A mild increase in burning, itching or irritation may occur.',
      opinionAlerts: 'The cream can damage condoms and diaphragms. A 7-day topical azole is the only type of yeast treatment the CDC recommends in pregnancy, but ask your prenatal clinician before using it.'
    },
    clinicianOpinionSource: 'independent',
    clinicianAttribution: ATTRIBUTION,
    doctorOpinion: "The CDC lists clotrimazole 1% cream, used daily for 7 to 14 days, as a recommended over-the-counter option for uncomplicated vaginal yeast infections, and notes azoles relieve symptoms in 80% to 90% of people who finish treatment. In pregnancy the CDC recommends only topical azoles used for 7 days, which makes a 7-day cream the relevant option to discuss with your prenatal clinician. Get checked if symptoms do not clear or return within 2 months. This is guidance about clotrimazole, not a test of this brand.",
    communityReview: 'Walmart shows a 4.6 out of 5 rating from 223 ratings for this Taro Clotrimazole 7 listing.',
    communityReviewSourceUrl: 'https://www.walmart.com/ip/Taro-Clotrimazole-7-Vaginal-Cream-45-g/46008111',
    communityReviewSourceLabel: 'Walmart reviews',
    ingredients: 'Active: clotrimazole USP 1% (50 mg per applicatorful). Inactive: 2-octyldodecanol, benzyl alcohol, cetostearyl alcohol, cetyl esters wax, polysorbate 60, purified water, sorbitan monostearate.',
    effectiveness: "Clotrimazole is a CDC-recommended over-the-counter azole for uncomplicated vaginal yeast infections. Category-level evidence does not validate this specific brand; other clotrimazole 1% 7-day creams contain the same active ingredient.",
    warnings: [
      'For vaginal use only. Do not use if you have never had a vaginal yeast infection diagnosed by a doctor.',
      'Ask a doctor first if this is your first time with vaginal itching and discomfort; if you have lower abdominal, back or shoulder pain, fever, chills, nausea, vomiting or foul-smelling discharge; if you get yeast infections often (about once a month or 3 in 6 months); or if you may have been exposed to HIV.',
      'While using: do not use tampons, douches, spermicides or other vaginal products, and do not have vaginal intercourse. Condoms and diaphragms may be damaged.',
      'Stop use and ask a doctor if symptoms do not improve in 3 days, last more than 7 days, or you get a rash, hives, abdominal pain, fever, chills, nausea, vomiting or foul-smelling discharge.',
      'If pregnant or breast-feeding, ask a health professional before use.',
      'Children under 12: ask a doctor.'
    ],
    verificationLinks: {
      doctor: { links: [
        { url: 'https://www.cdc.gov/std/treatment-guidelines/candidiasis.htm', text: 'CDC STI Treatment Guidelines: Vulvovaginal Candidiasis', summary: 'Lists clotrimazole 1% for 7 to 14 days as an OTC regimen and recommends only 7-day topical azoles in pregnancy.' }
      ] },
      scientific: { links: [
        { url: 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=f7192955-8f8c-45dd-a215-8ac2c1f6444f', text: 'DailyMed: Clotrimazole Vaginal Cream USP 1% (45 g) label', summary: 'Official Drug Facts: clotrimazole 1%, 7-day directions, warnings and inactive ingredients.' }
      ] },
      community: { links: [
        { url: 'https://www.walmart.com/ip/Taro-Clotrimazole-7-Vaginal-Cream-45-g/46008111', text: 'Walmart: Taro Clotrimazole 7 (4.6/5, 223 ratings)', summary: 'Retail listing with price and customer ratings.' }
      ] }
    }
  },

  // ── 3. Women's Rogaine 5% minoxidil foam ─────────────────────
  // Sources:
  //  - Label: https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=4d328537-b7f5-43cc-9837-c5a0c6c390f8 (Women's Rogaine Unscented, Kenvue Brands LLC)
  //  - Retail: https://www.target.com/p/women-39-s-rogaine-5-minoxidil-foam-for-hair-thinning-and-loss-topical-treatment-for-hair-regrowth-2-11oz/-/A-16500199
  //  - Evidence: https://www.aad.org/public/diseases/hair-loss/types/female-pattern
  {
    id: 'p-womens-rogaine-foam',
    name: "Women's Rogaine 5% Minoxidil Foam",
    brand: 'Rogaine',
    category: 'hair',
    type: 'physical',
    internal: false,
    healthFunctions: ['skin-hair'],
    tags: ['hair', 'thinning', 'scalp', 'shedding'],
    price: '$58.65 at Target (2.11 oz cans; Target lists package quantity 2)',
    userRating: 3.9,
    whereToBuy: ['Target'],
    url: 'https://www.target.com/p/women-39-s-rogaine-5-minoxidil-foam-for-hair-thinning-and-loss-topical-treatment-for-hair-regrowth-2-11oz/-/A-16500199',
    image: 'https://target.scene7.com/is/image/Target/GUEST_46c2cf3c-9fac-49cf-82eb-0bb182f66dc7',
    summary: "Unscented 5% minoxidil foam that regrows hair on the top of the scalp in women with hereditary thinning. Apply half a capful once a day to the thinning area. Results can show at about 3 months, some women need at least 6 months, and you have to keep using it to keep the regrowth.",
    safety: {
      fdaStatus: 'FDA-regulated over-the-counter drug with a Drug Facts label (DailyMed, Women’s Rogaine Unscented). The AAD notes FDA has approved 2% and 5% minoxidil as a non-prescription treatment for women.',
      materials: 'Aerosol foam. Extremely flammable: avoid fire, flame or smoking during and right after applying.',
      recalls: 'No recalls found on the pages reviewed.',
      allergens: 'No fragrance added (per Target). Contains SD alcohol 40-B, cetyl and stearyl alcohol, butylated hydroxytoluene, and propellants (butane, isobutane, propane).',
      sideEffects: 'Scalp irritation or redness, unwanted facial hair, and changes in hair color or texture are possible. Stop and ask a doctor for chest pain, rapid heartbeat, faintness, dizziness, sudden weight gain, or swollen hands or feet.',
      opinionAlerts: 'The label says it may be harmful if used when pregnant or breast-feeding. The AAD notes shedding can temporarily increase in the first 2 to 8 weeks.'
    },
    clinicianOpinionSource: 'independent',
    clinicianAttribution: ATTRIBUTION,
    doctorOpinion: "The American Academy of Dermatology describes minoxidil as an FDA-approved non-prescription treatment for female pattern hair loss. It takes about 6 to 12 months of continuous use to know how well it works for you, and the benefit is lost if you stop. Shedding can briefly increase in the first 2 to 8 weeks. Women who are pregnant, planning pregnancy or breastfeeding should avoid it. Sudden, patchy or postpartum hair loss is a different problem and worth a dermatologist visit. This is guidance about minoxidil, not a test of this brand.",
    communityReview: "Target shows a 3.91 out of 5 rating from 1,901 reviews for this Women's Rogaine foam listing.",
    communityReviewSourceUrl: 'https://www.target.com/p/women-39-s-rogaine-5-minoxidil-foam-for-hair-thinning-and-loss-topical-treatment-for-hair-regrowth-2-11oz/-/A-16500199',
    communityReviewSourceLabel: 'Target reviews',
    ingredients: 'Active: minoxidil 5% w/w (without propellant). Inactive: butane, butylated hydroxytoluene, cetyl alcohol, citric acid, glycerin, isobutane, lactic acid, polysorbate 60, propane, purified water, SD alcohol 40-B, stearyl alcohol.',
    effectiveness: "Minoxidil is the FDA-approved over-the-counter treatment for female pattern hair loss, per the AAD. The label notes regrowth varies and the product will not work for all women. Category-level evidence does not validate this brand over store-brand 5% minoxidil foam for women.",
    warnings: [
      'For external use only. Extremely flammable: avoid fire, flame or smoking during and right after application.',
      'Do not use if your hair loss does not match the pattern on the carton, you have no family history of hair loss, your hair loss is sudden or patchy or linked to childbirth, you do not know the reason for it, you are under 18, your scalp is red, inflamed, infected, irritated or painful, or you use other medicines on the scalp.',
      'Ask a doctor before use if you have heart disease.',
      'Do not use more than directed or apply to other parts of the body. Avoid contact with eyes.',
      'Stop use and ask a doctor if chest pain, rapid heartbeat, faintness or dizziness occurs; sudden unexplained weight gain occurs; hands or feet swell; scalp irritation or redness occurs; unwanted facial hair grows; or you see no regrowth after 6 months.',
      'May be harmful if used when pregnant or breast-feeding.'
    ],
    verificationLinks: {
      doctor: { links: [
        { url: 'https://www.aad.org/public/diseases/hair-loss/types/female-pattern', text: 'AAD: Female pattern hair loss', summary: 'Minoxidil is FDA-approved for women; use continuously 6 to 12 months to judge results; avoid in pregnancy and breastfeeding.' }
      ] },
      scientific: { links: [
        { url: 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=4d328537-b7f5-43cc-9837-c5a0c6c390f8', text: "DailyMed: Women's Rogaine Unscented foam label", summary: 'Official Drug Facts: minoxidil 5% foam, who should not use it, warnings and directions.' }
      ] },
      community: { links: [
        { url: 'https://www.target.com/p/women-39-s-rogaine-5-minoxidil-foam-for-hair-thinning-and-loss-topical-treatment-for-hair-regrowth-2-11oz/-/A-16500199', text: "Target: Women's Rogaine Foam (3.91/5, 1,901 reviews)", summary: 'Retail listing with price and customer ratings.' }
      ] }
    }
  },

  // ── 4a. PanOxyl 10% benzoyl peroxide foaming wash ────────────
  // Sources:
  //  - Label: https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=1660f219-e789-91f1-e063-6294a90a7664 (Crown Laboratories)
  //  - Retail: https://www.target.com/p/panoxyl-maximum-strength-antimicrobial-acne-foaming-wash-for-face-chest-and-back-with-10-benzoyl-peroxide-unscented-5-5oz/-/A-14984165
  //  - Evidence: https://www.aad.org/public/diseases/acne/DIY/types-breakouts
  //  - Benzene: https://www.fda.gov/drugs/drug-alerts-and-statements/limited-number-voluntary-recalls-initiated-after-fda-testing-acne-products-benzene-findings-show
  //             https://www.aad.org/news/benzoyl-peroxide-personal-care-products
  {
    id: 'p-panoxyl-bpo-10-wash',
    name: 'PanOxyl 10% Benzoyl Peroxide Acne Foaming Wash',
    brand: 'PanOxyl',
    category: 'skincare',
    type: 'physical',
    internal: false,
    healthFunctions: ['skin-hair'],
    tags: ['acne', 'skin', 'pcos', 'cleanser'],
    price: '$9.89 for 5.5 oz at Target',
    userRating: 4.5,
    whereToBuy: ['Target'],
    url: 'https://www.target.com/p/panoxyl-maximum-strength-antimicrobial-acne-foaming-wash-for-face-chest-and-back-with-10-benzoyl-peroxide-unscented-5-5oz/-/A-14984165',
    image: 'https://target.scene7.com/is/image/Target/GUEST_99e7b206-1c38-49b8-9762-0c4533700929',
    summary: "A 10% benzoyl peroxide acne wash for the face and body. Massage onto wet skin for 1 to 2 minutes, rinse, and start once a day, building to 2 or 3 times a day only if your skin tolerates it. It can bleach hair, towels and dyed fabrics.",
    safety: {
      fdaStatus: 'FDA-regulated over-the-counter acne drug with a Drug Facts label (DailyMed, Crown Laboratories).',
      materials: 'Foaming cream wash in a tube.',
      recalls: "No PanOxyl product appears on FDA's March 2025 list of benzoyl peroxide acne products recalled for elevated benzene.",
      allergens: 'Do not use if you have very sensitive skin or are sensitive to benzoyl peroxide.',
      sideEffects: 'Dryness and irritation (redness, burning, itching, peeling or swelling) are possible, and more likely if you use another topical acne medicine at the same time.',
      opinionAlerts: 'Bleaches hair and dyed fabrics. The AAD suggests storing benzoyl peroxide products at room temperature or cooler, replacing them every 10 to 12 weeks, and discarding any exposed to heat above about 78°F.'
    },
    clinicianOpinionSource: 'independent',
    clinicianAttribution: ATTRIBUTION,
    doctorOpinion: "The American Academy of Dermatology recommends benzoyl peroxide washes for blackheads, whiteheads, papules and pustules, and says to give treatment 6 to 8 weeks to work. FDA testing in 2025 found that most benzoyl peroxide acne products had undetectable or extremely low benzene, and a few recalled products did not include PanOxyl; the AAD advises storing these products cool and replacing them every 10 to 12 weeks. Hormonal or PCOS-related acne that does not respond is worth a clinician visit. This is guidance about benzoyl peroxide, not a test of this brand.",
    communityReview: 'Target shows a 4.45 out of 5 rating from 1,694 reviews for this PanOxyl wash listing.',
    communityReviewSourceUrl: 'https://www.target.com/p/panoxyl-maximum-strength-antimicrobial-acne-foaming-wash-for-face-chest-and-back-with-10-benzoyl-peroxide-unscented-5-5oz/-/A-14984165',
    communityReviewSourceLabel: 'Target reviews',
    ingredients: 'Active: benzoyl peroxide 10%. Inactive: carbomer homopolymer type C, carbomer interpolymer type A, decyl glucoside, dimethicone, dioctyl sodium sulfosuccinate, glycerin, palmitic acid, polyacrylate crosspolymer-6, polyoxyl 40 stearate, propanediol, purified water, silica, sodium chloride, sodium citrate, sodium hydroxide, sodium laurylglucosides hydroxypropylsulfonate, sorbitan stearate, sorbitol, stearic acid, t-butyl alcohol, xanthan gum.',
    effectiveness: "Benzoyl peroxide is an AAD-recommended over-the-counter acne ingredient. Category-level evidence does not validate this brand over other benzoyl peroxide washes; lower strengths may be gentler for sensitive skin.",
    warnings: [
      'For external use only.',
      'Do not use if you have very sensitive skin or are sensitive to benzoyl peroxide.',
      'Skin irritation and dryness are more likely if you use another topical acne medication at the same time. If irritation occurs, use only one topical acne medication at a time.',
      'Avoid unnecessary sun exposure and use a sunscreen. Avoid contact with eyes, lips and mouth.',
      'Avoid contact with hair and dyed fabrics, which may be bleached by this product.',
      'Stop use and ask a doctor if irritation becomes severe.',
      'If pregnant or breast-feeding, ask a health professional before use.'
    ],
    verificationLinks: {
      doctor: { links: [
        { url: 'https://www.aad.org/public/diseases/acne/DIY/types-breakouts', text: 'AAD: How to treat different types of acne', summary: 'Recommends benzoyl peroxide washes for several acne types and 6 to 8 weeks to judge results.' },
        { url: 'https://www.aad.org/news/benzoyl-peroxide-personal-care-products', text: 'AAD statement on benzoyl peroxide products (March 2025)', summary: 'Storage and replacement advice after FDA benzene testing; no immediate cause for concern.' }
      ] },
      scientific: { links: [
        { url: 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=1660f219-e789-91f1-e063-6294a90a7664', text: 'DailyMed: PanOxyl Acne Foaming Wash label', summary: 'Official Drug Facts: benzoyl peroxide 10%, warnings, directions and inactive ingredients.' },
        { url: 'https://www.fda.gov/drugs/drug-alerts-and-statements/limited-number-voluntary-recalls-initiated-after-fda-testing-acne-products-benzene-findings-show', text: 'FDA: Benzene testing of acne products', summary: 'FDA tested benzoyl peroxide acne products; a small number were recalled. PanOxyl is not on the recall list.' }
      ] },
      community: { links: [
        { url: 'https://www.target.com/p/panoxyl-maximum-strength-antimicrobial-acne-foaming-wash-for-face-chest-and-back-with-10-benzoyl-peroxide-unscented-5-5oz/-/A-14984165', text: 'Target: PanOxyl 10% wash (4.45/5, 1,694 reviews)', summary: 'Retail listing with price and customer ratings.' }
      ] }
    }
  },

  // ── 4b. Differin adapalene 0.1% gel ──────────────────────────
  // Sources:
  //  - Label (HUMAN OTC DRUG LABEL): https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=0739d631-171b-42a8-bd55-0022b8df2d8a (Galderma Laboratories)
  //  - Retail: https://www.target.com/p/differin-adapalene-gel-with-pump-1-6oz/-/A-76545052
  //  - Evidence: https://www.aad.org/public/diseases/acne/DIY/types-breakouts
  {
    id: 'p-differin-adapalene-gel',
    name: 'Differin Adapalene Gel 0.1% Acne Treatment',
    brand: 'Differin',
    category: 'skincare',
    type: 'physical',
    internal: false,
    healthFunctions: ['skin-hair'],
    tags: ['acne', 'skin', 'pcos', 'retinoid'],
    price: '$23.99 for 45 g (1.6 oz) pump at Target',
    userRating: 4.4,
    whereToBuy: ['Target'],
    url: 'https://www.target.com/p/differin-adapalene-gel-with-pump-1-6oz/-/A-76545052',
    image: 'https://target.scene7.com/is/image/Target/GUEST_38a3ac7f-4dc8-4bf4-b9df-a38bb1e270a5',
    summary: "Adapalene 0.1%, the one retinoid you can buy without a prescription. Apply a thin layer once a day over the whole acne-prone area on clean, dry skin. Acne may look worse in the first weeks, and full results can take up to 3 months.",
    safety: {
      fdaStatus: 'FDA-regulated over-the-counter drug (DailyMed lists it as a Human OTC Drug Label, Galderma Laboratories).',
      materials: 'Gel in a pump bottle.',
      recalls: 'No recalls found on the pages reviewed.',
      allergens: 'Contains methylparaben and propylene glycol. Do not use if you are allergic to adapalene or any ingredient.',
      sideEffects: 'Irritation is more likely in the first weeks or when combined with other topical acne medicines. Limit sun exposure and use sunscreen. Do not wax treated areas.',
      opinionAlerts: 'The label says to ask a doctor before use if pregnant or breast-feeding, and to stop and ask a doctor if you become pregnant or plan to while using it.'
    },
    clinicianOpinionSource: 'independent',
    clinicianAttribution: ATTRIBUTION,
    doctorOpinion: "The American Academy of Dermatology notes that adapalene is the one retinoid available without a prescription and recommends a retinoid to help unclog pores in blackheads and whiteheads, giving treatment 6 to 8 weeks before judging it. Start slowly if your skin is sensitive, use sunscreen, and check with a clinician before using it if you are pregnant, trying to conceive or breastfeeding. This is guidance about adapalene, not a test of this brand.",
    communityReview: 'Target shows a 4.36 out of 5 rating from 4,482 reviews for this Differin gel listing.',
    communityReviewSourceUrl: 'https://www.target.com/p/differin-adapalene-gel-with-pump-1-6oz/-/A-76545052',
    communityReviewSourceLabel: 'Target reviews',
    ingredients: 'Active: adapalene 0.1% (retinoid). Inactive: carbomer 940, edetate disodium, methylparaben, poloxamer 182, propylene glycol, purified water, sodium hydroxide. May contain hydrochloric acid to adjust pH.',
    effectiveness: "Adapalene is an over-the-counter retinoid recommended by the AAD for acne. The label says results may take up to 3 months. Category-level evidence does not validate this brand over generic adapalene 0.1% gel.",
    warnings: [
      'For external use only.',
      'Do not use on damaged skin (cuts, abrasions, eczema, sunburn) or if you are allergic to adapalene or any ingredient.',
      'If pregnant or breast-feeding, ask a doctor before use.',
      'Limit sun exposure and use sunscreen. Do not wax hair in treated areas. Avoid eyes, lips and mouth.',
      'Acne may appear worse in the first few weeks, and irritation is more likely early on or with other topical acne medicines.',
      'Stop use and ask a doctor if you become pregnant or plan to become pregnant while using it, have an allergic reaction, have severe irritation, or see no improvement after 3 months of daily use.',
      'Apply once daily only. Children under 12: ask a doctor.'
    ],
    verificationLinks: {
      doctor: { links: [
        { url: 'https://www.aad.org/public/diseases/acne/DIY/types-breakouts', text: 'AAD: How to treat different types of acne', summary: 'Notes adapalene is available without a prescription and recommends a retinoid for blackheads and whiteheads.' }
      ] },
      scientific: { links: [
        { url: 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=0739d631-171b-42a8-bd55-0022b8df2d8a', text: 'DailyMed: Differin (adapalene) gel OTC label', summary: 'Official Drug Facts: adapalene 0.1%, pregnancy warnings, directions and inactive ingredients.' }
      ] },
      community: { links: [
        { url: 'https://www.target.com/p/differin-adapalene-gel-with-pump-1-6oz/-/A-76545052', text: 'Target: Differin Gel 45 g (4.36/5, 4,482 reviews)', summary: 'Retail listing with price and customer ratings.' }
      ] }
    }
  },

  // ── 5a. Metamucil psyllium fiber ─────────────────────────────
  // Sources:
  //  - Retail (Supplement Facts and ingredients for this exact canister): https://www.target.com/p/metamucil-psyllium-fiber-supplement-with-sugar-powder-orange-48-2oz/-/A-10988571
  //  - Drug Facts for Metamucil Therapy for Regularity orange smooth 48.2 oz canister, hosted by Target:
  //    https://digitalcontent.target.com/vault/1768953600/CLOUD_b41b9e37-7484-43cb-8630-1d150a90e024.pdf
  //  - DailyMed label (Metamucil Therapy for Regularity, P&G; pregnancy line): https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=12d030b0-df97-4dd6-88ba-e9fe863c95ea
  //  - Evidence: https://www.niddk.nih.gov/health-information/digestive-diseases/constipation/treatment
  {
    id: 'p-metamucil-psyllium-orange',
    name: 'Metamucil Psyllium Fiber Powder, Orange (with sugar)',
    brand: 'Metamucil',
    category: 'supplement',
    type: 'physical',
    internal: false,
    healthFunctions: ['supplement'],
    tags: ['digestion', 'gut', 'bloating', 'supplement'],
    price: '$28.99 for 48.2 oz at Target',
    userRating: 4.9,
    whereToBuy: ['Target'],
    url: 'https://www.target.com/p/metamucil-psyllium-fiber-supplement-with-sugar-powder-orange-48-2oz/-/A-10988571',
    image: 'https://target.scene7.com/is/image/Target/GUEST_e38a4ac5-9e82-47dc-ba6a-c62be9537c9e',
    summary: "Psyllium husk fiber powder that you stir into at least 8 oz of liquid. Metamucil's Drug Facts label for this canister lists it as fiber therapy for occasional constipation, usually working in 12 to 72 hours. Start with 1 dose a day and build up to 3 as needed, and always take it with enough fluid.",
    safety: {
      fdaStatus: "Target's listing shows Supplement Facts; Metamucil's Drug Facts label for the orange smooth 48.2 oz canister (hosted on Target) lists psyllium husk as fiber therapy for regularity.",
      materials: 'Powder in a canister.',
      recalls: 'No recalls found on the pages reviewed.',
      allergens: 'May cause an allergic reaction in people sensitive to inhaled or ingested psyllium. Contains FD&C Yellow No. 6.',
      sideEffects: 'Taking it without enough fluid may cause it to swell and block your throat or esophagus (choking). The DailyMed Metamucil label notes bloating or changes in bowel habits may occur as you increase fiber.',
      opinionAlerts: 'Contains added sugar (sucrose is the first ingredient). Take other medicines at least 2 hours before or after a dose.'
    },
    clinicianOpinionSource: 'independent',
    clinicianAttribution: ATTRIBUTION,
    doctorOpinion: "The NIH's National Institute of Diabetes and Digestive and Kidney Diseases lists fiber supplements such as Metamucil among over-the-counter options for constipation, alongside eating more fiber (22 to 34 grams a day for adults), staying active, and drinking plenty of water and other liquids when you add fiber. A sudden change in bowel habits, rectal bleeding, or constipation lasting more than 7 days needs a clinician. This is guidance about fiber supplements in general, not a test of this brand over generic psyllium.",
    communityReview: 'Target shows a 4.94 out of 5 rating from 43 reviews for this Metamucil 48.2 oz listing.',
    communityReviewSourceUrl: 'https://www.target.com/p/metamucil-psyllium-fiber-supplement-with-sugar-powder-orange-48-2oz/-/A-10988571',
    communityReviewSourceLabel: 'Target reviews',
    ingredients: 'Sucrose, psyllium husk, citric acid, natural and artificial orange flavor, Yellow 6 (per Target listing). Drug Facts: psyllium husk approx. 3.4 g per rounded tablespoon.',
    effectiveness: "Fiber supplements are a recognized first-line over-the-counter option for occasional constipation per NIDDK. The label says it generally works in 12 to 72 hours. Category-level evidence does not validate this brand over store-brand psyllium.",
    warnings: [
      'Choking: taking this product without adequate fluid may cause it to swell and block your throat or esophagus. Do not take it if you have difficulty swallowing. Get immediate medical attention for chest pain, vomiting, or trouble swallowing or breathing after taking it.',
      'Allergy alert: may cause an allergic reaction in people sensitive to inhaled or ingested psyllium.',
      'Ask a doctor before use if you have a sudden change in bowel habits lasting 2 weeks, or abdominal pain, nausea or vomiting.',
      'Take at least 2 hours before or after any prescription medicine taken by mouth.',
      'Stop use and ask a doctor if constipation lasts more than 7 days or rectal bleeding occurs.',
      'If pregnant or breast-feeding, ask a health professional before use (DailyMed Metamucil label).',
      'Adults and children 12 and over: 1 rounded tablespoon in at least 8 oz of liquid, up to 3 times daily. Under 6: consult a doctor.'
    ],
    verificationLinks: {
      doctor: { links: [
        { url: 'https://www.niddk.nih.gov/health-information/digestive-diseases/constipation/treatment', text: 'NIDDK (NIH): Treatment for Constipation', summary: 'Lists fiber supplements such as Metamucil among OTC options, with daily fiber and fluid advice.' }
      ] },
      scientific: { links: [
        { url: 'https://digitalcontent.target.com/vault/1768953600/CLOUD_b41b9e37-7484-43cb-8630-1d150a90e024.pdf', text: 'Metamucil Therapy for Regularity Drug Facts (48.2 oz canister)', summary: 'Psyllium husk 3.4 g per dose, choking and allergy warnings, and directions.' },
        { url: 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=12d030b0-df97-4dd6-88ba-e9fe863c95ea', text: 'DailyMed: Metamucil Therapy for Regularity label', summary: 'Procter & Gamble Drug Facts for Metamucil psyllium powder, including pregnancy and medication-timing warnings.' }
      ] },
      community: { links: [
        { url: 'https://www.target.com/p/metamucil-psyllium-fiber-supplement-with-sugar-powder-orange-48-2oz/-/A-10988571', text: 'Target: Metamucil 48.2 oz (4.94/5, 43 reviews)', summary: 'Retail listing with price, Supplement Facts and customer ratings.' }
      ] }
    }
  },

  // ── 5b. MiraLAX (polyethylene glycol 3350) ───────────────────
  // Sources:
  //  - Label: https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=d69ce3d4-7ca4-4fe3-b49e-6655e48d6963 (Bayer HealthCare LLC)
  //  - Retail: https://www.target.com/p/miralax-laxative-powder-45-days-26-9oz/-/A-14896180
  //  - Evidence: https://www.niddk.nih.gov/health-information/digestive-diseases/constipation/treatment
  {
    id: 'p-miralax-peg-3350',
    name: 'MiraLAX Osmotic Laxative Powder, Unflavored',
    brand: 'MiraLAX',
    category: 'gut-health',
    type: 'physical',
    internal: false,
    healthFunctions: ['comfort'],
    tags: ['digestion', 'gut', 'bloating'],
    price: '$30.99 for 26.9 oz (45 doses) at Target',
    userRating: 4.6,
    whereToBuy: ['Target'],
    url: 'https://www.target.com/p/miralax-laxative-powder-45-days-26-9oz/-/A-14896180',
    image: 'https://target.scene7.com/is/image/Target/GUEST_e144d80a-8509-4b9d-9c1c-e0ddb5c971d1',
    summary: "Polyethylene glycol 3350, an unflavored osmotic laxative for occasional constipation. Stir one 17 g capful into 4 to 8 oz of any drink once a day; it usually works in 1 to 3 days. Do not use it for more than 7 days without talking to a doctor.",
    safety: {
      fdaStatus: 'FDA-regulated over-the-counter drug with a Drug Facts label (DailyMed, Bayer HealthCare LLC).',
      materials: 'Powder in a bottle with a measuring cap.',
      recalls: 'No recalls found on the pages reviewed.',
      allergens: 'Do not use if you are allergic to polyethylene glycol. The label lists no inactive ingredients.',
      sideEffects: 'Loose, watery or more frequent stools may occur. Stop and ask a doctor if you develop diarrhea, or bloating, cramping or abdominal pain gets worse.',
      opinionAlerts: 'Do not use with kidney disease unless directed and supervised by a doctor. Do not mix with starch-based thickeners.'
    },
    clinicianOpinionSource: 'independent',
    clinicianAttribution: ATTRIBUTION,
    doctorOpinion: "NIDDK (NIH) lists osmotic agents such as MiraLAX among over-the-counter laxatives for constipation and notes a clinician may recommend a laxative for a short time, alongside more fiber, fluids and activity. Rectal bleeding, worsening pain, or needing a laxative for more than a week are reasons to see a clinician. This is guidance about osmotic laxatives in general, not a test of this brand over store-brand polyethylene glycol 3350.",
    communityReview: 'Target shows a 4.63 out of 5 rating from 1,519 reviews for this MiraLAX 45-dose listing.',
    communityReviewSourceUrl: 'https://www.target.com/p/miralax-laxative-powder-45-days-26-9oz/-/A-14896180',
    communityReviewSourceLabel: 'Target reviews',
    ingredients: 'Active: polyethylene glycol 3350, 17 g per dose. No inactive ingredients listed on the label.',
    effectiveness: "Polyethylene glycol 3350 is an osmotic laxative listed by NIDDK as an over-the-counter constipation option. The label says it generally produces a bowel movement in 1 to 3 days. Category-level evidence does not validate this brand over store-brand PEG 3350, which has the same active ingredient.",
    warnings: [
      'Allergy alert: do not use if you are allergic to polyethylene glycol.',
      'Do not use if you have kidney disease, except under the advice and supervision of a doctor.',
      'Ask a doctor before use if you have nausea, vomiting or abdominal pain; a sudden change in bowel habits lasting over 2 weeks; or irritable bowel syndrome.',
      'Ask a doctor or pharmacist before use if you are taking a prescription drug.',
      'Stop use and ask a doctor if you have rectal bleeding or your nausea, bloating, cramping or abdominal pain gets worse; you get diarrhea; or you need a laxative for more than 1 week.',
      'If pregnant or breast-feeding, ask a health professional before use.',
      'Adults and children 17 and over: once daily. Do not use for more than 7 days unless directed by a doctor. Children 16 and under: ask a doctor.'
    ],
    verificationLinks: {
      doctor: { links: [
        { url: 'https://www.niddk.nih.gov/health-information/digestive-diseases/constipation/treatment', text: 'NIDDK (NIH): Treatment for Constipation', summary: 'Lists osmotic agents such as MiraLAX among OTC laxatives and notes short-term use on a clinician’s advice.' }
      ] },
      scientific: { links: [
        { url: 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=d69ce3d4-7ca4-4fe3-b49e-6655e48d6963', text: 'DailyMed: MiraLAX label', summary: 'Official Drug Facts: polyethylene glycol 3350 17 g, warnings and directions.' }
      ] },
      community: { links: [
        { url: 'https://www.target.com/p/miralax-laxative-powder-45-days-26-9oz/-/A-14896180', text: 'Target: MiraLAX 45 doses (4.63/5, 1,519 reviews)', summary: 'Retail listing with price and customer ratings.' }
      ] }
    }
  },

  // ── 6. Nature Made Folic Acid 400 mcg ────────────────────────
  // Sources:
  //  - Retail: https://target.com/p/nature-made-folic-acid-400-mcg-665-mcg-dfe-tablets-250ct/-/A-11010058
  //  - Brand page (USP Verified, label claims, interaction notes; marked discontinued on naturemade.com): https://www.naturemade.com/products/nature-made-folic-acid-tablets
  //  - Evidence: https://www.cdc.gov/folic-acid/about/index.html
  {
    id: 'p-nature-made-folic-acid-400',
    name: 'Nature Made Folic Acid 400 mcg Tablets',
    brand: 'Nature Made',
    category: 'supplement',
    type: 'physical',
    internal: false,
    healthFunctions: ['supplement', 'fertility'],
    tags: ['pregnancy', 'fertility', 'supplement', 'cost'],
    price: '$6.59 for 250 tablets at Target',
    userRating: 4.6,
    whereToBuy: ['Target'],
    url: 'https://target.com/p/nature-made-folic-acid-400-mcg-665-mcg-dfe-tablets-250ct/-/A-11010058',
    image: 'https://target.scene7.com/is/image/Target/GUEST_c1f5861a-74ef-4429-a9b2-bf0d8ba7446c',
    summary: "One small tablet a day gives 400 mcg of folic acid (665 mcg DFE), the amount the CDC recommends daily for anyone who could become pregnant. USP Verified. Take 1 tablet daily with water and a meal.",
    safety: {
      fdaStatus: 'Dietary supplement (not FDA-approved). USP Verified for ingredients, potency and manufacturing, per Nature Made.',
      materials: 'Oral tablet.',
      recalls: 'No recalls found on the pages reviewed.',
      allergens: 'Gluten free, no color added, no artificial flavors, no preservatives (per Nature Made).',
      sideEffects: 'Nature Made advises keeping total daily folic acid from all sources at or below 1,000 mcg, since higher doses may mask a vitamin B12 shortfall.',
      opinionAlerts: 'Check with a clinician if you take seizure medicines such as Dilantin or Mysoline. Nature Made marks this product discontinued on its own site, though Target still lists it.'
    },
    clinicianOpinionSource: 'independent',
    clinicianAttribution: ATTRIBUTION,
    doctorOpinion: "The CDC recommends that everyone who could become pregnant get 400 mcg of folic acid every day, starting at least 1 month before conception, because neural tube defects form in the first weeks of pregnancy, often before you know you are pregnant. The CDC notes folic acid is the only form of folate shown to help prevent neural tube defects. People who have had a pregnancy affected by a neural tube defect need a much higher dose and should talk with a doctor. This is guidance about folic acid, not a test of this brand.",
    communityReview: 'Target shows a 4.6 out of 5 rating from 76 reviews for this Nature Made Folic Acid listing.',
    communityReviewSourceUrl: 'https://target.com/p/nature-made-folic-acid-400-mcg-665-mcg-dfe-tablets-250ct/-/A-11010058',
    communityReviewSourceLabel: 'Target reviews',
    ingredients: 'Folic acid 400 mcg (665 mcg DFE) per tablet. Other ingredients: cellulose gel, maltodextrin, croscarmellose sodium, stearic acid, magnesium stearate. Nature Made also lists 45 mg calcium per serving.',
    effectiveness: "Daily folic acid before and in early pregnancy lowers the risk of neural tube defects, per the CDC, based on randomized trials. Evidence is for folic acid at 400 mcg and does not validate this brand over other USP-verified folic acid tablets.",
    warnings: [
      'Consult a healthcare professional if you take medications, especially seizure medications such as Dilantin or Mysoline (Nature Made).',
      'Keep total daily folic acid from all sources at or below 1,000 mcg unless a clinician advises otherwise (Nature Made).',
      'If you have had a pregnancy affected by a neural tube defect, talk with a doctor about the higher dose the CDC recommends.'
    ],
    verificationLinks: {
      doctor: { links: [
        { url: 'https://www.cdc.gov/folic-acid/about/index.html', text: 'CDC: About Folic Acid', summary: '400 mcg daily for anyone who could become pregnant, starting at least 1 month before conception; folic acid is the form shown to prevent neural tube defects.' }
      ] },
      scientific: { links: [
        { url: 'https://www.naturemade.com/products/nature-made-folic-acid-tablets', text: 'Nature Made: Folic Acid 400 mcg', summary: 'Brand page with supplement facts, USP Verified status, and interaction notes. Marked discontinued on the brand site.' }
      ] },
      community: { links: [
        { url: 'https://target.com/p/nature-made-folic-acid-400-mcg-665-mcg-dfe-tablets-250ct/-/A-11010058', text: 'Target: Nature Made Folic Acid 250 ct (4.6/5, 76 reviews)', summary: 'Retail listing with price, ingredients and customer ratings.' }
      ] }
    }
  },

  // ── 7. Easy@Home LH ovulation test strips ────────────────────
  // Sources:
  //  - Retail: https://www.walmart.com/ip/Easy-Home-50-Ovulation-Test-Strips-Kit-the-Reliable-Ovulation-Predictor-Kit-50-LH-Test/407693487
  //  - FDA: https://www.fda.gov/medical-devices/home-use-tests/ovulation-urine-test
  //  - Evidence: https://medlineplus.gov/ency/article/007062.htm
  {
    id: 'p-easyhome-lh-strips-50',
    name: 'Easy@Home Ovulation Test Strips (50 LH Tests)',
    brand: 'Easy@Home',
    category: 'diagnostics',
    type: 'physical',
    internal: false,
    healthFunctions: ['fertility', 'cycle-tracking'],
    tags: ['fertility', 'cost', 'privacy'],
    price: '$16.99 for 50 strips at Walmart',
    userRating: 4.6,
    whereToBuy: ['Walmart'],
    url: 'https://www.walmart.com/ip/Easy-Home-50-Ovulation-Test-Strips-Kit-the-Reliable-Ovulation-Predictor-Kit-50-LH-Test/407693487',
    image: 'https://i5.walmartimages.com/seo/Easy-Home-Reliable-Ovulation-Predictor-Kit-50-LH-Tests-50-Count_97181863-097f-4d20-8305-1f27d899d7e1.f07b15b47e10c12116db2df39dc6a3a8.jpeg',
    summary: "A budget pack of 50 plain urine LH strips that show when your luteinizing hormone surges, which usually comes shortly before ovulation. Dip, wait 3 to 5 minutes, and read the lines. Results can be logged in the Premom app.",
    safety: {
      fdaStatus: 'FDA clearance status is not stated on the Walmart listing.',
      materials: 'Urine test strips (5 mm wide).',
      recalls: 'No recalls found on the pages reviewed.',
      allergens: 'N/A (external, urine dip test).',
      sideEffects: 'None; this is a urine test.',
      opinionAlerts: 'The FDA says not to use ovulation tests to prevent pregnancy. MedlinePlus notes birth control pills, hormone therapy and clomiphene can change LH levels, and irregular cycles can make a surge hard to catch.'
    },
    clinicianOpinionSource: 'independent',
    clinicianAttribution: ATTRIBUTION,
    doctorOpinion: "The FDA explains that urine ovulation tests detect the LH surge that happens about 1 to 1.5 days before ovulation and are reliable about 9 times out of 10 when used carefully and started at the right point in your cycle. MedlinePlus suggests starting 3 to 5 days before you expect to ovulate (around day 11 of a 28-day cycle) and avoiding large amounts of fluid before testing. They are not birth control. If you cannot detect a surge or are not pregnant after several months, talk with a clinician. This is guidance about LH tests in general, not a test of this brand.",
    communityReview: 'Walmart shows a 4.6 out of 5 rating from 75 ratings for this Easy@Home 50-strip listing.',
    communityReviewSourceUrl: 'https://www.walmart.com/ip/Easy-Home-50-Ovulation-Test-Strips-Kit-the-Reliable-Ovulation-Predictor-Kit-50-LH-Test/407693487',
    communityReviewSourceLabel: 'Walmart reviews',
    ingredients: '50 individually wrapped LH urine test strips (the listing does not state the LH sensitivity threshold).',
    effectiveness: "FDA describes urine LH tests as detecting the LH surge about 9 times in 10 when used correctly. The Walmart listing gives no accuracy or sensitivity data for these specific strips, so that figure is category-level only.",
    warnings: [
      'Do not use ovulation tests to prevent pregnancy; they are not reliable for that purpose (FDA).',
      'Start testing at the right time in your cycle or results will be unreliable (FDA).',
      'Hormonal birth control, hormone therapy and clomiphene can affect LH levels; irregular cycles can make a surge hard to detect (MedlinePlus).'
    ],
    verificationLinks: {
      doctor: { links: [
        { url: 'https://medlineplus.gov/ency/article/007062.htm', text: 'MedlinePlus: Ovulation home test', summary: 'When to start testing, what a positive means, and what can affect results.' }
      ] },
      scientific: { links: [
        { url: 'https://www.fda.gov/medical-devices/home-use-tests/ovulation-urine-test', text: 'FDA: Ovulation (Urine Test)', summary: 'LH surge about 1 to 1.5 days before ovulation; reliable about 9 times in 10; not for preventing pregnancy.' }
      ] },
      community: { links: [
        { url: 'https://www.walmart.com/ip/Easy-Home-50-Ovulation-Test-Strips-Kit-the-Reliable-Ovulation-Predictor-Kit-50-LH-Test/407693487', text: 'Walmart: Easy@Home 50 LH strips (4.6/5, 75 ratings)', summary: 'Retail listing with price and customer ratings.' }
      ] }
    }
  },

  // ── 8. Visby Women's At-Home STI Test ────────────────────────
  // Sources:
  //  - FDA: https://www.fda.gov/news-events/press-announcements/fda-grants-marketing-authorization-first-home-test-chlamydia-gonorrhea-and-trichomoniasis
  //  - Brand product page: https://visby.com/products/visby-womens-at-home-sti-test-kit (no plain white-background packshot found, so image left blank)
  //  - Evidence: https://www.cdc.gov/std/treatment-guidelines/chlamydia.htm
  {
    id: 'p-visby-womens-sti-test',
    name: "Visby Women's At-Home STI Test",
    brand: 'Visby Medical',
    category: 'diagnostics',
    type: 'physical',
    internal: false,
    healthFunctions: ['sexual-health'],
    tags: ['privacy', 'vaginal-health'],
    price: '$149.99 on visby.com (listed as a sale from $179.99)',
    whereToBuy: ['Visby.com'],
    url: 'https://visby.com/products/visby-womens-at-home-sti-test-kit',
    image: '',
    summary: "The first FDA-authorized test for chlamydia, gonorrhea and trichomoniasis that you can buy without a prescription and run entirely at home. You collect a vaginal swab, a single-use PCR device runs the test, and results show in the Visby app in about 30 minutes. Visby includes a same-day telehealth visit if you test positive; medication cost is not included.",
    safety: {
      fdaStatus: 'FDA De Novo marketing authorization (March 28, 2025) as the first home test for chlamydia, gonorrhea and trichomoniasis, sold without a prescription.',
      materials: 'Single-use powered PCR test device, swab with buffer vial, and power adapter. Requires the Visby Medical app.',
      recalls: 'No recalls found on the pages reviewed.',
      allergens: 'N/A (self-collected vaginal swab).',
      sideEffects: 'None expected from swab collection. The main risk is a false positive or false negative result.',
      opinionAlerts: 'Tests for only 3 infections. Visby lists it for ages 14 and up and U.S. only; telehealth and delivery are available only in select areas.'
    },
    clinicianOpinionSource: 'independent',
    clinicianAttribution: ATTRIBUTION,
    doctorOpinion: "The CDC recommends yearly chlamydia screening for all sexually active women under 25, and for older women at higher risk, because infection is often silent and can lead to pelvic inflammatory disease, ectopic pregnancy and infertility. The FDA authorized this test after studies in which it correctly identified about 97% to 100% of positive and about 98.5% to 99% of negative samples, but it warns that false results can happen. Anyone who tests positive should get care, and anyone with symptoms or a recent exposure should still see a clinician after a negative result. This test does not check for HIV, syphilis or other STIs.",
    ingredients: 'Single-use PCR device, vaginal swab with buffer vial, power adapter (per Visby).',
    effectiveness: "In FDA's review, the test correctly identified 98.8% of negative and 97.2% of positive chlamydia samples, 99.1% of negative and 100% of positive gonorrhea samples, and 98.5% of negative and 97.8% of positive trichomoniasis samples. These are the FDA-reported study results for this specific device.",
    warnings: [
      'False negative results can delay treatment and allow infection to spread (FDA).',
      'Seek medical care after a positive result. If you have symptoms, a recent exposure or other concerns, contact a clinician even after a negative result (FDA).',
      'Tests only for chlamydia, gonorrhea and trichomoniasis.'
    ],
    verificationLinks: {
      doctor: { links: [
        { url: 'https://www.cdc.gov/std/treatment-guidelines/chlamydia.htm', text: 'CDC STI Treatment Guidelines: Chlamydial Infections', summary: 'Annual screening for sexually active women under 25 and older women at increased risk; untreated infection can cause PID, ectopic pregnancy and infertility.' }
      ] },
      scientific: { links: [
        { url: 'https://www.fda.gov/news-events/press-announcements/fda-grants-marketing-authorization-first-home-test-chlamydia-gonorrhea-and-trichomoniasis', text: 'FDA: First home test for chlamydia, gonorrhea and trichomoniasis', summary: 'March 2025 De Novo authorization of the Visby Medical Women’s Sexual Health Test, with accuracy data and limitations.' }
      ] },
      community: { links: [
        { url: 'https://visby.com/products/visby-womens-at-home-sti-test-kit', text: "Visby: Women's At-Home STI Test Kit", summary: 'Brand product page with price, kit contents, age range and telehealth details.' }
      ] }
    }
  },

  // ── 9. Rugby Vitamin B6 25 mg ────────────────────────────────
  // Included because a standard OTC B6 25 mg tablet exists and ACOG (via NIH ODS) recommends 10 to 25 mg B6 for pregnancy nausea.
  // Ginger skipped: no standard OTC drug-labeled ginger product, and no ginger source was opened.
  // Sources:
  //  - Retail (sold and shipped by third-party seller Hey Pharma via Target): https://www.target.com/p/rugby-vitamin-b6-25mg-tablets-100ct/-/A-1006726140
  //  - Evidence: https://ods.od.nih.gov/factsheets/VitaminB6-HealthProfessional/
  {
    id: 'p-rugby-vitamin-b6-25',
    name: 'Rugby Vitamin B6 25 mg Tablets',
    brand: 'Rugby',
    category: 'supplement',
    type: 'physical',
    internal: false,
    healthFunctions: ['supplement'],
    tags: ['pregnancy', 'supplement', 'cost'],
    price: '$8.11 for 100 tablets at Target (sold by a third-party seller)',
    whereToBuy: ['Target'],
    url: 'https://www.target.com/p/rugby-vitamin-b6-25mg-tablets-100ct/-/A-1006726140',
    image: 'https://target.scene7.com/is/image/Target/GUEST_82e8093d-18ff-416c-8cc1-df4e6c2b314e',
    summary: "Plain vitamin B6 (pyridoxine HCl) 25 mg tablets. The 25 mg strength matches the dose range ACOG recommends for nausea and vomiting of pregnancy, but how often to take it should come from your prenatal clinician.",
    safety: {
      fdaStatus: 'Dietary supplement (not FDA-approved).',
      materials: 'Oral tablet.',
      recalls: 'No recalls found on the pages reviewed.',
      allergens: 'Other ingredients: microcrystalline cellulose, dicalcium phosphate, stearic acid, talc, croscarmellose sodium, magnesium stearate, hypromellose.',
      sideEffects: 'NIH ODS notes very high long-term B6 intakes can cause nerve damage (sensory neuropathy). The adult upper limit is 100 mg a day, including in pregnancy, unless a clinician is supervising treatment.',
      opinionAlerts: 'ACOG’s dosing (10 to 25 mg three or four times a day) can reach the 100 mg daily upper limit, so NIH ODS advises pregnant women to consult a physician before taking B6. Sold by a third-party seller on Target.'
    },
    clinicianOpinionSource: 'independent',
    clinicianAttribution: ATTRIBUTION,
    doctorOpinion: "According to the NIH Office of Dietary Supplements, ACOG recommends vitamin B6 alone, 10 to 25 mg three or four times a day, as a first treatment for nausea and vomiting of pregnancy, adding doxylamine if that is not enough. Two placebo-controlled trials found 30 to 75 mg a day reduced nausea, while a Cochrane review could not draw firm conclusions. Because these doses can approach the 100 mg daily upper limit, check with your prenatal clinician first, and seek care right away for vomiting that keeps you from holding down fluids. This is guidance about vitamin B6, not a test of this brand.",
    ingredients: 'Vitamin B6 (as pyridoxine HCl) 25 mg per tablet. Other ingredients: microcrystalline cellulose, dicalcium phosphate, stearic acid, talc, croscarmellose sodium, magnesium stearate, hypromellose.',
    effectiveness: "Evidence for B6 alone in pregnancy nausea is mixed: two placebo-controlled trials showed less nausea at 30 to 75 mg a day, and a Cochrane review was inconclusive (NIH ODS). B6 combined with doxylamine has stronger trial support. Evidence is category-level and does not validate this brand.",
    warnings: [
      'Keep out of reach of children. Do not use if the seal under the cap is broken or missing (label, via Target).',
      'Pregnant women should consult a physician before taking vitamin B6 supplements, since treatment doses can approach the 100 mg daily upper limit (NIH ODS).',
      'Chronic very high doses can cause severe, progressive sensory neuropathy (NIH ODS).'
    ],
    verificationLinks: {
      doctor: { links: [
        { url: 'https://ods.od.nih.gov/factsheets/VitaminB6-HealthProfessional/', text: 'NIH ODS: Vitamin B6 Health Professional Fact Sheet', summary: 'Reports ACOG’s recommendation of 10 to 25 mg B6 three or four times daily for pregnancy nausea, mixed trial evidence, and the 100 mg upper limit.' }
      ] },
      scientific: { links: [] },
      community: { links: [
        { url: 'https://www.target.com/p/rugby-vitamin-b6-25mg-tablets-100ct/-/A-1006726140', text: 'Target: Rugby Vitamin B6 25 mg, 100 ct', summary: 'Retail listing with price and Supplement Facts. No reviews yet.' }
      ] }
    }
  }
];
