// Ayna Clinical Knowledge Base
// Sources: ACOG clinical guidance, NIH Office of Dietary Supplements,
// curated women's health Q&A (Ananya/Kaggle corpus), FDA safety data
// Used by the RAG layer in api/llm-recommendations.js and api/product-insights.js

export const CLINICAL_KNOWLEDGE = [
  // -- MENSTRUATION BASICS --------------------------------------------------
  {
    topic: 'menstruation basics',
    conditions: [],
    concerns: ['Period care'],
    content: 'A period is the monthly shedding of the uterine lining when pregnancy does not occur. Normal cycle length is 21-35 days; period duration is 2-7 days. ACOG considers cycles outside this range worth evaluating. Menstruation is completely normal and healthy.',
  },
  {
    topic: 'heavy menstrual bleeding',
    conditions: ['fibroids', 'adenomyosis', 'PCOS'],
    concerns: ['Period care', 'Cramp and pain relief'],
    content: 'Heavy menstrual bleeding (HMB) is defined by ACOG as soaking a pad or tampon every hour for several consecutive hours, passing clots larger than a quarter, or bleeding lasting more than 7 days. HMB can indicate fibroids, adenomyosis, PCOS, or coagulopathy. Iron deficiency anemia is a common consequence. ACOG recommends evaluation for HMB, especially if it impacts quality of life.',
  },
  {
    topic: 'period products safety organic',
    conditions: ['endometriosis'],
    concerns: ['Period care'],
    content: 'Conventional pads and tampons may contain trace dioxins from chlorine bleaching and synthetic fragrances. While FDA considers these levels low-risk for most users, people with endometriosis or fragrance sensitivities are often advised to choose organic, unbleached, fragrance-free products. Organic cotton period products are free from pesticide residues and synthetic fragrances. ACOG does not prohibit conventional products but acknowledges patient preference for organic options.',
  },
  {
    topic: 'tampon safety toxic shock syndrome',
    conditions: [],
    concerns: ['Period care'],
    content: 'Toxic Shock Syndrome (TSS) is a rare but serious bacterial infection associated with tampon use. FDA recommends using the lowest absorbency needed, changing every 4-8 hours, never sleeping with a tampon in, and alternating with pads. Symptoms include sudden high fever, low blood pressure, rash, vomiting - seek emergency care immediately.',
  },
  {
    topic: 'menstrual cup disc safety',
    conditions: [],
    concerns: ['Period care'],
    content: 'Menstrual cups and discs are reusable silicone devices that collect rather than absorb flow. Cups are worn inside the vaginal canal; discs sit at the cervix. Both can be worn up to 12 hours. FDA cleared. TSS risk is very low but not zero. Cups are not recommended for use with an IUD without clinician guidance.',
  },
  // -- CRAMPS AND PAIN ------------------------------------------------------
  {
    topic: 'dysmenorrhea cramps pain relief',
    conditions: ['endometriosis', 'adenomyosis', 'fibroids'],
    concerns: ['Cramp and pain relief'],
    content: 'Primary dysmenorrhea (cramps without underlying pathology) is caused by prostaglandins causing uterine contractions. ACOG first-line treatment includes NSAIDs (ibuprofen, naproxen) started 1-2 days before expected onset. Heat therapy has RCT evidence for pain reduction comparable to ibuprofen. Secondary dysmenorrhea (caused by endometriosis, fibroids, adenomyosis) requires clinician evaluation. TENS devices and pelvic wands have emerging evidence for pain management.',
  },
  {
    topic: 'magnesium period cramps supplements',
    conditions: [],
    concerns: ['Cramp and pain relief', 'Hormone balance'],
    content: 'Magnesium glycinate and magnesium citrate have emerging evidence from multiple small RCTs for reducing menstrual cramp severity and PMS symptoms. NIH ODS notes magnesium plays a role in muscle relaxation and may reduce prostaglandin-driven cramping. Typical studied dose is 250-350mg daily. Generally well-tolerated; high doses may cause diarrhea. Consistent with ACOG guidance on non-pharmacological dysmenorrhea management.',
  },
  // -- PCOS -----------------------------------------------------------------
  {
    topic: 'PCOS polycystic ovary syndrome management',
    conditions: ['PCOS'],
    concerns: ['PCOS management', 'Hormone balance', 'Skin and hair'],
    content: 'PCOS is the most common hormonal disorder in reproductive-age women, affecting 8-13% per ACOG. Diagnostic criteria (Rotterdam) require 2 of 3: irregular ovulation, clinical/biochemical hyperandrogenism, polycystic ovaries on ultrasound. ACOG first-line management is lifestyle: low-glycemic diet, regular aerobic exercise, weight management if applicable. Hormonal contraceptives for menstrual regulation and androgen-related symptoms. Metformin for insulin resistance. Annual metabolic screening recommended.',
  },
  {
    topic: 'PCOS supplements inositol',
    conditions: ['PCOS'],
    concerns: ['PCOS management', 'Hormone balance', 'Fertility and conception'],
    content: 'Myo-inositol and d-chiro-inositol (in a 40:1 ratio) have the most robust evidence among supplements for PCOS. Multiple RCTs show improvements in insulin sensitivity, menstrual regularity, and ovulation rates. NIH ODS recognizes inositol as metabolically active in insulin signaling. Typical dose: 4g myo-inositol + 100mg d-chiro-inositol daily. Ovasitol is a well-studied branded combination. Consistent with ACOG guidance on insulin sensitization in PCOS.',
  },
  {
    topic: 'PCOS spearmint hormonal acne',
    conditions: ['PCOS'],
    concerns: ['PCOS management', 'Skin and hair', 'Hormone balance'],
    content: 'Spearmint tea has small RCT evidence showing reduction in free testosterone in women with PCOS-related hirsutism. Two cups daily studied in trials. Not a replacement for clinical treatment but a commonly used adjunct. NIH ODS notes limited but promising evidence. Consistent with ACOG acknowledgment of complementary approaches in PCOS management.',
  },
  {
    topic: 'PCOS endocrine disruptors ingredients to avoid',
    conditions: ['PCOS'],
    concerns: ['PCOS management', 'Period care', 'Skin and hair'],
    content: 'People with PCOS should be cautious about endocrine-disrupting chemicals (EDCs) in personal care and period products. Key EDCs to avoid: BPA (plastics, some applicators), phthalates (fragrances), parabens (preservatives in cosmetics), and synthetic fragrances (complex mixtures of potential EDCs). Choose fragrance-free, BPA-free, paraben-free products. Organic period products reduce exposure to dioxins and pesticide residues.',
  },
  // -- ENDOMETRIOSIS --------------------------------------------------------
  {
    topic: 'endometriosis management symptoms',
    conditions: ['endometriosis'],
    concerns: ['Endometriosis management', 'Cramp and pain relief'],
    content: 'Endometriosis affects ~10% of reproductive-age women and is severely underdiagnosed - average diagnosis delay is 7-10 years. ACOG defines it as endometrial-like tissue outside the uterus. Symptoms: severe dysmenorrhea, pelvic pain throughout cycle, dyspareunia, dyschezia, fatigue, infertility. Diagnosis requires laparoscopy. ACOG treatment: hormonal suppression (COCs, progestins, GnRH agonists), NSAIDs for pain, surgery for severe cases. No cure; management is ongoing.',
  },
  {
    topic: 'endometriosis diet anti-inflammatory',
    conditions: ['endometriosis'],
    concerns: ['Endometriosis management', 'Gut and vaginal health'],
    content: 'Anti-inflammatory dietary approaches are commonly recommended alongside medical treatment for endometriosis. Evidence supports: reducing red meat and processed foods, increasing omega-3 fatty acids (fish oil, flaxseed), and increasing fiber and antioxidant-rich foods. Omega-3 supplementation (1-2g EPA/DHA daily) has small RCT evidence for reducing endometriosis-related pain. NIH recognizes diet as a modifiable factor in endometriosis symptom management.',
  },
  {
    topic: 'endometriosis product safety dioxins fragrance',
    conditions: ['endometriosis'],
    concerns: ['Endometriosis management', 'Period care'],
    content: 'People with endometriosis are frequently advised to avoid products containing dioxins (from chlorine-bleached cotton), synthetic fragrances, BPA, and pesticide residues. These compounds may act as endocrine disruptors that can worsen estrogen-dependent conditions like endometriosis. ACOG acknowledges patient preference for reduced chemical exposure. Choose organic, unbleached, fragrance-free period products and paraben-free personal care.',
  },
  // -- VAGINAL AND GUT HEALTH -----------------------------------------------
  {
    topic: 'UTI recurrent prevention',
    conditions: [],
    concerns: ['UTI support', 'Gut and vaginal health'],
    content: 'Uncomplicated UTIs affect ~50% of women in their lifetime. ACOG-endorsed prevention: stay hydrated (2L/day), void after intercourse, wipe front to back, avoid harsh soaps near urethra. D-mannose (2g/day) has emerging RCT evidence for UTI prevention by blocking E. coli adhesion to bladder wall. Cranberry proanthocyanidins have modest evidence. Probiotics containing Lactobacillus rhamnosus and Lactobacillus reuteri may support urinary health. Recurrent UTIs (3+ per year) warrant clinician evaluation.',
  },
  {
    topic: 'vaginal microbiome probiotics pH',
    conditions: [],
    concerns: ['Gut and vaginal health', 'UTI support'],
    content: 'Healthy vaginal pH is 3.8-4.5, maintained by Lactobacillus-dominant flora. Disruption causes BV, yeast infections, and increased UTI risk. Avoid douching, heavily fragranced soaps, and synthetic underwear. Oral probiotics containing Lactobacillus rhamnosus GR-1 and Lactobacillus reuteri RC-14 have RCT evidence for restoring vaginal flora. NIH ODS recognizes Lactobacillus strains as relevant to vaginal health. Breathable cotton underwear supports pH balance.',
  },
  // -- MENOPAUSE -------------------------------------------------------------
  {
    topic: 'perimenopause menopause symptoms management',
    conditions: ['perimenopause', 'menopause'],
    concerns: ['Perimenopause and menopause support'],
    content: "Perimenopause begins 4-8 years before final menstrual period, typically in the mid-40s. ACOG recognizes menopause as the most undertreated condition in women's health. Common symptoms: hot flashes, night sweats, genitourinary syndrome (dryness, pain), mood changes, brain fog, sleep disruption, bone loss. ACOG first-line for vasomotor symptoms in appropriate candidates: hormone therapy (HT), which is safe and effective for most women under 60. Non-hormonal options: SSNRIs, cognitive behavioral therapy, mindfulness.",
  },
  {
    topic: 'menopause supplements magnesium black cohosh',
    conditions: ['perimenopause', 'menopause'],
    concerns: ['Perimenopause and menopause support'],
    content: 'ACOG-reviewed evidence for menopausal supplements: Black cohosh has limited RCT evidence for hot flash reduction and is generally considered safe short-term. Magnesium may support sleep quality. Phytoestrogens (soy isoflavones) have modest evidence for mild vasomotor symptoms. NIH ODS notes most supplement evidence for menopause is limited or inconsistent. Consult a clinician before starting supplements, especially with history of hormone-sensitive conditions.',
  },
  // -- FERTILITY -------------------------------------------------------------
  {
    topic: 'fertility conception supplements tracking',
    conditions: [],
    concerns: ['Fertility and conception'],
    content: 'ACOG recommends preconception care including 400-800mcg folic acid daily (ideally 3 months before conception), maintaining healthy weight, and avoiding alcohol and smoking. Cycle tracking to identify fertile window (5 days before + day of ovulation) maximizes conception chances. BBT, LH surge tests, and cervical mucus monitoring are all validated methods. ACOG recommends evaluation after 12 months trying (6 months if over 35, immediately if known conditions like PCOS or endometriosis).',
  },
  {
    topic: 'prenatal supplements TTC trying to conceive',
    conditions: [],
    concerns: ['Fertility and conception'],
    content: 'When trying to conceive, NIH recommends starting prenatal vitamins before conception. Key nutrients: folate/folic acid (400-800mcg), iron (27mg), DHA (200mg), iodine (150mcg), vitamin D (600 IU). Choose methylfolate if you have MTHFR gene variants. Avoid supplements with high-dose vitamin A (retinol form), which is teratogenic. Myo-inositol supports ovulation in PCOS. Coenzyme Q10 has emerging evidence for egg quality in women over 35.',
  },
  // -- MENTAL HEALTH AND MOOD ------------------------------------------------
  {
    topic: 'PMDD PMS mood cycle mental health',
    conditions: [],
    concerns: ['Mental health and cycle mood support'],
    content: 'Premenstrual syndrome (PMS) affects up to 75% of women; PMDD (premenstrual dysphoric disorder) is a severe form affecting 3-8%, recognized by ACOG as a diagnosable condition. Symptoms occur in luteal phase: irritability, depression, anxiety, anger. ACOG first-line for PMDD: SSRIs/SNRIs (continuous or luteal-phase dosing), hormonal contraceptives. Lifestyle: exercise, sleep hygiene, reduced caffeine/alcohol. Calcium 1200mg/day has RCT evidence for PMS symptom reduction per NIH ODS.',
  },
  // -- SEXUAL HEALTH ---------------------------------------------------------
  {
    topic: 'sexual health pelvic floor lubricants',
    conditions: ['vaginismus', 'vulvodynia'],
    concerns: ['Sexual health and comfort'],
    content: 'Genitourinary syndrome of menopause, vaginismus, and vulvodynia all contribute to sexual discomfort. ACOG-endorsed options: water-based or silicone-based lubricants (avoid glycerin in glycerin-sensitive users, avoid oil-based with latex), vaginal moisturizers for dryness used regularly, pelvic floor PT for vaginismus and dyspareunia. Avoid products with fragrances, parabens, or glycerin if prone to yeast infections.',
  },
  // -- INGREDIENT SAFETY -----------------------------------------------------
  {
    topic: 'ingredient safety fragrance parabens BPA endocrine disruptors',
    conditions: ['endometriosis', 'PCOS'],
    concerns: ['Period care', 'Skin and hair', 'Hormone balance'],
    content: 'Key ingredients to flag for hormone-sensitive conditions: (1) Synthetic fragrance - complex mixtures containing potential EDCs including phthalates; (2) Parabens (methylparaben, propylparaben) - preservatives with weak estrogenic activity; (3) BPA - found in some plastic applicators and packaging, disrupts estrogen signaling; (4) Dioxins - byproducts of chlorine bleaching in conventional cotton, accumulate in fatty tissue; (5) Oxybenzone in sunscreens - potential EDC. People with PCOS or endometriosis are often advised to minimize these exposures.',
  },
  {
    topic: 'supplement ingredient interactions safety',
    conditions: [],
    concerns: ['PCOS management', 'Cramp and pain relief', 'Hormone balance', 'Fertility and conception'],
    content: "Key supplement safety considerations: (1) High-dose vitamin A (retinol) is teratogenic - avoid in pregnancy; (2) St. John's Wort reduces efficacy of hormonal contraceptives; (3) High-dose vitamin E and fish oil increase bleeding risk, especially before surgery; (4) Iron supplements should be taken with vitamin C for absorption, not with calcium; (5) Vitex (chasteberry) may interfere with hormonal contraceptives and dopaminergic medications; (6) Always disclose supplements to your clinician, especially if trying to conceive or on medication.",
  },
  // -- SKIN AND HAIR ---------------------------------------------------------
  {
    topic: 'hormonal acne skin hair PCOS cycle',
    conditions: ['PCOS'],
    concerns: ['Skin and hair', 'PCOS management'],
    content: 'Hormonal acne is driven by androgens stimulating sebum production. In PCOS, elevated androgens cause acne along the jawline/chin, hirsutism, and scalp hair thinning. ACOG-recognized treatments: combined oral contraceptives (reduce androgens), spironolactone (androgen blocker), and topical retinoids. Zinc supplements (30mg/day) have evidence for inflammatory acne. Spearmint has small evidence for reducing free testosterone. Avoid comedogenic ingredients (heavy oils, silicones) and sulfates that strip skin barrier.',
  },
];

// Flat text array for scoring/retrieval
export const KNOWLEDGE_TEXT = CLINICAL_KNOWLEDGE.map(
  (item) => `Topic: ${item.topic}\nConditions: ${item.conditions.join(', ') || 'general'}\nConcerns: ${item.concerns.join(', ')}\n${item.content}`
);

// Index by condition for fast lookup
export const KNOWLEDGE_BY_CONDITION = {};
export const KNOWLEDGE_BY_CONCERN = {};

for (const item of CLINICAL_KNOWLEDGE) {
  for (const cond of item.conditions) {
    if (!KNOWLEDGE_BY_CONDITION[cond]) KNOWLEDGE_BY_CONDITION[cond] = [];
    KNOWLEDGE_BY_CONDITION[cond].push(item);
  }
  for (const concern of item.concerns) {
    const key = concern.toLowerCase();
    if (!KNOWLEDGE_BY_CONCERN[key]) KNOWLEDGE_BY_CONCERN[key] = [];
    KNOWLEDGE_BY_CONCERN[key].push(item);
  }
}
