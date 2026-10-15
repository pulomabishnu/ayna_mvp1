// Research that fills gaps on product pages (who it is for, how to use it,
// credible clinical and science sources, review summaries). Added Oct 15, 2026.
// Every URL was opened and checked by the researcher. These entries only fill
// fields a product does not already have: nothing the team wrote by hand is
// replaced (see withResearch in products.js).
export const PRODUCT_RESEARCH = {
  "p-always-infinity": {
    "whoItsFor": [
      "People with heavy flow who want a thin pad instead of a bulky one (Size 2 is Always's heavy-flow size)",
      "Shoppers who want an affordable pad they can find at almost any drugstore or grocery store",
      "Those with sensitive skin who choose the unscented version, which Always lists as fragrance free and dermatologically tested",
      "Not the pick for overnight use: Always points to its separate Infinity Overnight pad for longer protection"
    ],
    "howToUse": {
      "intro": "Per Always's own pad instructions and FDA guidance on pads:",
      "steps": [
        "Wash your hands before and after handling a pad.",
        "Peel off the backing strip and press the sticky side into the center of your underwear.",
        "Fold the wings around the sides of your underwear if your pad has them.",
        "Change your pad every 4 to 8 hours, and more often on heavy days.",
        "Wrap the used pad in its wrapper or toilet paper and put it in the bin. Never flush it.",
        "Stop using it and contact your provider if you get itching, rash, pain or swelling."
      ],
      "sourceUrl": "https://www.always.co.uk/en-gb/tips-and-advice-for-women/your-first-period/how-to-use-sanitary-pads",
      "sourceLabel": "Always: How to use sanitary pads"
    }
  },
  "p-rael-organic-pad": {
    "whoItsFor": [
      "People who want an organic cotton cover and a fragrance-free, dye-free pad",
      "Those with heavier flow or who need longer coverage, since Rael positions the Large size for heavier days or overnight",
      "Anyone whose skin reacts to scented pads, since the FDA notes some people react to scents and added materials in pads",
      "Not the pick if you want a pad that is fully cotton: only the top sheet is organic cotton, and the core uses wood pulp with super-absorbent polymer"
    ],
    "howToUse": {
      "intro": "Per Rael's package directions and FDA guidance on pads:",
      "steps": [
        "Wash your hands before and after handling a pad.",
        "Remove the pad from the backing strip and place it in your underwear.",
        "Wrap the wings around the sides of your underwear.",
        "Change it every few hours, even if your flow is light, and more often on heavy days.",
        "Throw the used pad in the trash. Do not flush it."
      ],
      "sourceUrl": "https://target.com/p/rael-organic-cotton-cover-large-menstrual-fragrance-free-pads-unscented-14ct/-/A-75664181",
      "sourceLabel": "Rael Large pads product listing (Target)"
    },
    "clinicalSources": [
      {
        "url": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-pads-and-liners",
        "label": "FDA: Menstrual Pads and Liners",
        "summary": "FDA advises changing pads every few hours, notes some people react to scents or added materials, and says to stop use and call a provider if itching, rash or swelling appears."
      }
    ],
    "scienceSources": [
      {
        "url": "https://synapse.koreamed.org/articles/1130139",
        "label": "Woo et al., Systematic Review on Sanitary Pads and Female Health, Ewha Medical Journal (2019)",
        "summary": "A review of 71 studies found case reports of pad-related genital dermatitis but concluded a clear cause-and-effect link between pads and health effects has not been established."
      }
    ]
  },
  "p-honeypot-pad": {
    "whoItsFor": [
      "People who like a cooling feel during their period and have used mint or lavender products on skin without trouble",
      "Shoppers who want an organic cotton top sheet in a widely stocked drugstore pad",
      "Not the pick for sensitive or allergy-prone skin: Honey Pot itself says the herbs can cause irritation or inflammation for some people, and its Cotton Comfort line is the herb-free option",
      "Not the pick if you have a history of vulvar dermatitis or reactions to essential oils"
    ],
    "howToUse": {
      "intro": "Per The Honey Pot's support guidance and FDA guidance on pads:",
      "steps": [
        "Wash your hands before and after handling a pad.",
        "Check the bottom left of the package to pick the right size and absorbency for your flow.",
        "Change your pad every few hours, even if your flow is light.",
        "Stop using the pad if you feel burning, itching or irritation, and switch to a non-herbal organic cotton pad.",
        "Contact your provider if a rash, pain or swelling does not settle."
      ],
      "sourceUrl": "https://support.thehoneypot.co/hc/en-us/articles/360061018132-Is-it-normal-to-feel-irritated-when-I-use-the-herbal-pad",
      "sourceLabel": "The Honey Pot support: Is it normal to feel irritated when I use the herbal pad?"
    }
  },
  "p-saalt-cup": {
    "whoItsFor": [
      "People who want a reusable option that can be worn up to 12 hours and cuts down on disposable products",
      "Those willing to learn folding and insertion, since there is a learning curve at first",
      "Anyone who can match a size to their anatomy: Saalt suggests Small for a medium to low cervix, Regular for a medium to high cervix, and the Soft cup for a weaker pelvic floor",
      "Not the pick for postpartum bleeding, which Saalt does not recommend the cup for. If you have an IUD, check with your doctor first."
    ],
    "howToUse": {
      "intro": "Per Saalt's own instructions:",
      "steps": [
        "Boil the cup for 4 to 5 minutes (no more than 7) before first use and between cycles.",
        "Wash your hands, fold the cup, and insert it rim first, angled toward your tailbone.",
        "Rotate the base to open the cup and form a seal, then run a finger around it to check for folds.",
        "Empty it at least twice a day and never wear it longer than 12 hours.",
        "To remove, pinch the base to break the seal, then wiggle it out upright. Do not pull on the stem.",
        "Rinse in cold water, then wash with mild soap and hot water before reinserting."
      ],
      "sourceUrl": "https://saalt.com/pages/instructions",
      "sourceLabel": "Saalt Cup Instructions"
    }
  },
  "p-nature-made-iron-65mg": {
    "whoItsFor": [
      "Adults with iron deficiency confirmed by bloodwork, which is what Nature Made's label says the 65 mg dose is for",
      "People at higher risk of low iron, like those with heavy periods, once a clinician has checked ferritin and hemoglobin",
      "Anyone who wants an inexpensive, widely available ferrous sulfate tablet their clinician has recommended",
      "Not the pick for people with hemochromatosis, who NIH says should avoid iron supplements, or for anyone taking iron without a confirmed need"
    ],
    "howToUse": {
      "intro": "Per Nature Made's label directions and Mayo Clinic guidance:",
      "steps": [
        "Take 1 tablet daily with water and a meal, as the label directs for adults with iron deficiency.",
        "Take it at least 2 hours before or 4 hours after antacids, and avoid coffee or tea for an hour around your dose.",
        "Pair it with a vitamin C source like orange juice to help absorption.",
        "Expect darker stools, and ask your provider about a stool softener if you get constipated.",
        "Ask your clinician when to recheck your blood levels.",
        "Check with your doctor if you're pregnant, breastfeeding or take other medicines, and store it out of children's reach."
      ],
      "sourceUrl": "https://static-assets-reg.cvshealth.com/shop/nature-made-iron-from-ferrous-sulfate-tablets-65-mg-180ct-prodid-1020656",
      "sourceLabel": "Nature Made Iron 65 mg label directions (CVS listing)"
    },
    "clinicalSources": [
      {
        "url": "https://ods.od.nih.gov/factsheets/iron-Consumer/",
        "label": "NIH Office of Dietary Supplements: Iron fact sheet",
        "summary": "Women with heavy periods are at higher risk of low iron, the adult upper limit is 45 mg a day unless a doctor prescribes more short term, and iron is a leading cause of fatal poisoning in children under 6."
      },
      {
        "url": "https://www.mayoclinic.org/diseases-conditions/iron-deficiency-anemia/diagnosis-treatment/drc-20355040.html",
        "label": "Mayo Clinic: Iron deficiency anemia, diagnosis and treatment",
        "summary": "Iron deficiency is diagnosed with blood tests including ferritin, supplements are often needed for several months, and constipation and black stools are common side effects."
      }
    ]
  },
  "p-natures-bounty-d3-125mcg": {
    "whoItsFor": [
      "Adults with vitamin D deficiency confirmed by their physician, which is who Nature's Bounty's label says this high-dose product is for",
      "People whose clinician has recommended a 5,000 IU daily dose for a set period and wants an inexpensive softgel",
      "Not the pick if you're pregnant or breastfeeding, or have kidney disease, high calcium (hypercalcemia), cancer, sarcoidosis or other granulomatous disorders, unless your physician directs it",
      "Not the pick for general wellness or 'just in case' use without a blood test"
    ],
    "howToUse": {
      "intro": "Per Nature's Bounty's label directions:",
      "steps": [
        "Confirm deficiency with your physician before starting, since the label says this high dose is for people found deficient.",
        "Take 1 softgel daily, preferably with a meal.",
        "Do not take it if you're pregnant or breastfeeding or have kidney disease, hypercalcemia, cancer or sarcoidosis, unless your physician directs it.",
        "Stop and contact your doctor if you have any adverse reaction.",
        "Store at room temperature and keep out of reach of children."
      ],
      "sourceUrl": "https://api.ods.od.nih.gov/dsld/s3/pdf/83209.pdf",
      "sourceLabel": "Nature's Bounty Vitamin D3 5,000 IU label (NIH Dietary Supplement Label Database)"
    }
  },
  "p-saalt-cup-steamer": {
    "whoItsFor": [
      "Saalt cup or disc users who want a dedicated device for the sanitizing step, which Saalt lists as an alternative to boiling",
      "People who would rather not boil their cup in a pot on the stove between cycles",
      "Not the pick if you're on a budget: Saalt's own instructions say boiling for 4 to 5 minutes or wiping with 70% isopropyl alcohol also sanitizes a cup, and FDA guidance only calls for soap, water and boiling"
    ]
  },
  "p-flex-disc": {
    "clinicalSources": [
      {
        "url": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-cups",
        "label": "FDA: Menstrual Cups (also covers menstrual discs)",
        "summary": "FDA treats discs and cups as the same product type, advises emptying every 8 to 12 hours, talking to your gynecologist first if you have an IUD, and stopping use if you get itching, rash, pain or swelling."
      }
    ]
  },
  "p-thinx": {
    "clinicalSources": [
      {
        "url": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-pads-and-liners",
        "label": "FDA: Menstrual Pads and Liners",
        "summary": "FDA groups period underwear with pads, advises following the maker's cleaning instructions, not reusing beyond the manufacturer's recommendations, and changing more often on heavy days."
      }
    ]
  },
  "p-cora-organic-tampons": {
    "whoItsFor": [
      "People who want a tampon made from 100% organic cotton, made without fragrance, chlorine bleaching or rayon",
      "Eco-minded shoppers who like the option of a compact applicator-free tampon for less waste",
      "Anyone who wants a subscription so tampons show up before their period does",
      "Not the pick if you chose organic to avoid metals: a 2024 NIH-funded study found lead was higher in non-organic tampons but arsenic was higher in organic ones, with no category consistently lower"
    ],
    "howToUse": {
      "intro": "Per Cora's own instructions and FDA tampon guidance:",
      "steps": [
        "Wash your hands with soap and water before and after insertion.",
        "Start with Light or Regular, and size up only if you need to change more often than every 4 hours.",
        "Insert gently, aiming toward your lower back, until you no longer feel the tampon when you stand.",
        "Change every 4 to 8 hours, and never leave a tampon in longer than 8 hours.",
        "If you get a sudden high fever, rash, vomiting, dizziness or fainting, remove the tampon and get medical care right away."
      ],
      "sourceUrl": "https://cora.com/pages/how-to-insert-tampon",
      "sourceLabel": "Cora: How to insert a tampon"
    },
    "scienceSources": [
      {
        "url": "https://factor.niehs.nih.gov/2024/8/feature/3-feature-metals-in-tampons",
        "label": "NIEHS: Metals detected in tampons (Environment International, 2024)",
        "summary": "Testing of 30 tampons from 14 brands found lead higher in non-organic tampons and arsenic higher in organic ones; whether these metals are absorbed by the body is unknown."
      },
      {
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC1240689",
        "label": "DeVito and Schecter, Environmental Health Perspectives (2002)",
        "summary": "Trace dioxins were found in both cotton and pulp tampons, but estimated exposure was thousands of times lower than from diet."
      }
    ]
  },
  "p-inositol-wholesome": {
    "whoItsFor": [
      "People with PCOS who want to try inositol after talking it through with their clinician, since the 2023 international guideline says it could be considered based on personal preference",
      "Those who want the common 40:1 myo to D-chiro ratio in a capsule rather than a powder",
      "Anyone looking for the brand's stated goal: support for hormone levels, menstrual cycles and ovarian health",
      "Not the pick as a swap for metformin when hirsutism or central weight gain is the main concern: the guideline says metformin should be considered over inositol for those"
    ],
    "howToUse": {
      "intro": "Per Wholesome Story's label directions and the 2023 international PCOS guideline:",
      "steps": [
        "Take 4 capsules (1 serving) once a day, ideally with a meal.",
        "If your stomach is sensitive, split it into 2 capsules taken twice a day.",
        "Tell your clinician you are taking it, along with any other supplements.",
        "Check with your doctor if you're pregnant, breastfeeding or take other medicines."
      ],
      "sourceUrl": "https://www.vitacost.com/products/wholesome-story-myo-d-chiro-inositol-120-vegetarian-capsules-114887",
      "sourceLabel": "Wholesome Story label directions (Vitacost listing)"
    },
    "clinicalSources": [
      {
        "url": "https://academic.oup.com/humrep/article/38/9/1655/7241786",
        "label": "Recommendations from the 2023 International PCOS Guideline, Human Reproduction",
        "summary": "Inositol could be considered for metabolic measures based on personal preference, but it is experimental for fertility, no specific type, dose or ratio can be recommended, and its side effects and safety are not known."
      }
    ],
    "clinicalNote": "The 2023 international PCOS guideline notes that inositol products can have limited regulation, with variable dose, quality and consistency, and that side effects and safety are not yet known. If you take it, tell your healthcare professional."
  },
  "p-spearmint-pcos": {
    "whoItsFor": [
      "People with PCOS who are curious about spearmint and want to try it alongside, not instead of, care from their clinician",
      "Anyone who wants a simple, caffeine-free organic herbal tea they can drink any time of day",
      "Those who prefer starting with a food-like option before considering supplements",
      "Not the pick as a treatment for hirsutism or irregular cycles on its own: evidence is preliminary and clinical benefit has not been established"
    ],
    "howToUse": {
      "intro": "Per Traditional Medicinals' label directions and the 2023 international PCOS guideline:",
      "steps": [
        "Pour 8 oz (240 ml) of freshly boiled water over 1 tea bag.",
        "Cover and steep for 5 to 10 minutes.",
        "Squeeze and remove the tea bag before drinking.",
        "Let your clinician know you are using it if you're managing PCOS, as with any complementary therapy."
      ],
      "sourceUrl": "https://fullscript.com/catalog/products/organic-spearmint-tea",
      "sourceLabel": "Traditional Medicinals Organic Spearmint label directions (Fullscript listing)"
    },
    "clinicalSources": [
      {
        "url": "https://academic.oup.com/humrep/article/38/9/1655/7241786",
        "label": "Recommendations from the 2023 International PCOS Guideline, Human Reproduction",
        "summary": "Lifestyle care is recommended for everyone with PCOS, and people using complementary therapies are encouraged to tell their healthcare professional so choices can be discussed together."
      }
    ]
  },
  "p-love-wellness-bloat": {
    "whoItsFor": [
      "People with occasional bloating after big or heavy meals who want an as-needed digestive enzyme option",
      "Those who notice bloating and water-weight changes around their period, which is what the brand says it's designed for",
      "Anyone who has already tried simple diet changes like less salt and fewer fizzy drinks and wants an extra over-the-counter option",
      "Not the pick for bloating that lasts more than a week, is very painful, or comes with fever, vomiting, bleeding or weight loss: see a clinician instead"
    ],
    "howToUse": {
      "intro": "Per Love Wellness's own guidance and Cleveland Clinic advice on bloating:",
      "steps": [
        "Take 2 capsules once a day at bedtime, or as needed, such as after a big meal.",
        "Check with your doctor if you're pregnant, breastfeeding or take other medicines.",
        "Pair it with simple habits like chewing thoroughly, drinking enough water, and cutting back on salt and fizzy drinks.",
        "See a clinician if bloating lasts more than a week, gets worse, or is very painful."
      ],
      "sourceUrl": "https://target.com/p/love-wellness-bye-bye-bloat-for-fast-bloating-relief-60ct/-/A-80209808",
      "sourceLabel": "Love Wellness label and brand Q&A (Target listing)"
    },
    "clinicalSources": [
      {
        "url": "https://my.clevelandclinic.org/health/symptoms/21740-bloated-stomach",
        "label": "Cleveland Clinic: Bloated stomach",
        "summary": "Lists probiotics among over-the-counter options and diet steps like less salt and carbonation, and says to see a provider if bloating lasts over a week, is very painful, or comes with fever, vomiting, bleeding or weight loss."
      },
      {
        "url": "https://www.nccih.nih.gov/health/ginger",
        "label": "NIH NCCIH: Ginger",
        "summary": "Ginger has the best evidence for pregnancy nausea, can cause abdominal discomfort, heartburn and diarrhea, and may interact with medicines."
      }
    ],
    "clinicalNote": "See a clinician if bloating lasts more than a week, is very painful, or comes with fever, vomiting, bleeding or weight loss. Ginger can cause heartburn, diarrhea or stomach discomfort in some people and may interact with medicines."
  },
  "p-intimina-kegel": {
    "whoItsFor": [
      "People with mild stress leakage, like a few drops when you sneeze, laugh or cough, who want added resistance for their Kegel routine",
      "Those who already know how to find their pelvic floor muscles and want a simple set of three weights (28, 38 and 48 g) to progress through",
      "Anyone who finds it easier to stay consistent with a physical tool than with Kegels alone",
      "Not the pick for heavy leakage or leaking from a very full bladder, where Mayo Clinic says Kegels help less; some women in trials also stopped using cones because of discomfort"
    ],
    "howToUse": {
      "intro": "Per Intimina's product instructions and Mayo Clinic's Kegel guidance:",
      "steps": [
        "Ask your healthcare professional whether pelvic floor exercises are right for you before you start.",
        "Choose the weight or combination that feels comfortable, starting light.",
        "Add a little water-based lubricant and insert the exerciser about 1 inch (2 cm) into the vagina, keeping the cord outside.",
        "Squeeze your pelvic floor to hold it in place while standing or walking, without holding your breath; you should feel the weight, but it shouldn't hurt.",
        "Stay consistent: results usually take a few weeks to a few months, and a pelvic floor physical therapist can help if you don't improve."
      ],
      "sourceUrl": "https://www.lookfantastic.com/p/intimina-laselle-kegel-routine/13034095/",
      "sourceLabel": "Intimina Laselle how-to-use instructions (Lookfantastic listing)"
    },
    "clinicalSources": [
      {
        "url": "https://www.mayoclinic.org/healthy-lifestyle/womens-health/in-depth/art-20045283",
        "label": "Mayo Clinic: Kegel exercises, a how-to guide for women",
        "summary": "Kegels can help with stress and urge leakage, are less helpful for heavy leakage or overflow leaking, and a provider may suggest a weighted vaginal cone you hold in place while standing or walking."
      }
    ],
    "scienceSources": [
      {
        "url": "https://cochranelibrary.com/cdsr/doi/10.1002/14651858.CD002114.pub2",
        "label": "Cochrane review: Weighted vaginal cones for urinary incontinence",
        "summary": "Cones were better than no active treatment and may be about as effective as standard pelvic floor training, but trials were small, the conclusion is tentative, and about 1 in 5 women dropped out."
      }
    ]
  },
  "p-pelvic-wand": {
    "whoItsFor": [
      "People with pelvic pain or muscle tightness who are working with a pelvic floor physical therapist",
      "Those whose PT has shown them how to release internal trigger points and want a tool to continue that work at home",
      "Not the pick for using on your own without guidance: clinicians suggest internal self-treatment tools as part of a supervised plan for selected patients"
    ]
  },
  "p-estroven-mood": {
    "whoItsFor": [
      "People in perimenopause or menopause who want a non-hormonal supplement to try for mood, hot flashes and night sweats",
      "Those who would rather not take hormone therapy, or want to discuss a non-hormonal option with their clinician first",
      "Anyone comfortable with the fact that evidence for phytoestrogens like soy isoflavones is mixed"
    ]
  },
  "p-remifemin": {
    "whoItsFor": [
      "People with menopausal hot flashes who want to try an herbal, non-hormonal option",
      "Those who prefer a standardized black cohosh extract over a multi-ingredient blend",
      "Anyone who wants a non-hormonal option and plans to talk it over with their clinician first"
    ]
  },
  "p-creatine-womens": {
    "whoItsFor": [
      "Adults doing strength training or other short, intense workouts who want to support strength and power",
      "Women in midlife who are lifting weights and want a well-studied supplement to pair with that training",
      "Not the pick if you mainly do endurance exercise like distance running, cycling or swimming, where NIH says creatine offers little benefit"
    ],
    "clinicalSources": [
      {
        "url": "https://ods.od.nih.gov/factsheets/ExerciseAndAthleticPerformance-Consumer/",
        "label": "NIH Office of Dietary Supplements: Dietary supplements for exercise and athletic performance",
        "summary": "Creatine monohydrate is the most studied form, helps most with repeated short, intense efforts, is considered safe for healthy adults, and often causes some water weight gain; much of the research is in young men rather than women or midlife adults."
      }
    ]
  },
  "d-nurx-bc": {
    "whoItsFor": [
      "People who want a birth control prescription online without an in-person visit, in states where that's allowed",
      "Those who want pills, the patch or the ring delivered to their door",
      "Anyone who wants to use insurance for online contraception care"
    ]
  },
  "d-wisp-bc": {
    "whoItsFor": [
      "People who want birth control, emergency contraception, or UTI and STI treatment without booking an appointment",
      "Those who prefer an asynchronous, message-based visit they can fit around their schedule",
      "Anyone who wants the choice of same-day pharmacy pickup or discreet delivery"
    ]
  },
  "d-hers": {
    "whoItsFor": [
      "People who want online visits with licensed providers for concerns like sexual health, skin care or mental health",
      "Those who want prescription or over-the-counter treatments delivered after an online visit",
      "Not the pick for concerns that need a hands-on exam, which an online visit can't replace"
    ]
  },
  "d-midi-health": {
    "whoItsFor": [
      "Women in perimenopause or menopause who want care from clinicians focused on this stage of life",
      "Those who want to talk through hormone therapy and other prescriptions without an in-person visit, where available in their state",
      "Anyone who wants a personalized care plan for perimenopause and menopause symptoms"
    ]
  },
  "d-pomelo-care": {
    "whoItsFor": [
      "People whose employer or health plan covers Pomelo and who want extra support between in-person visits",
      "Those who want 24/7 access to clinicians, midwives, doulas and therapists",
      "Anyone who wants help with education, triage and follow-up during pregnancy and beyond, depending on what their plan includes"
    ]
  },
  "p-lola-pad": {
    "clinicalSources": [
      {
        "url": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-pads-and-liners",
        "label": "FDA: Menstrual pads and liners",
        "summary": "Pads are FDA-regulated devices; the FDA advises changing them every few hours even on light days, notes some people react to scents or other added materials, and says to stop use and call a provider for itching, rash, pain or swelling."
      }
    ]
  },
  "p-natracare-pad": {
    "whoItsFor": [
      "People who want certified organic, plastic-free pads that are biodegradable",
      "Those who react to scents or other added materials in some mainstream pads and want a simpler material list",
      "Anyone focused on lower-waste period care who still prefers disposable pads",
      "Not the pick if you expect a medical benefit: evidence does not show organic or plastic-free pads are clinically superior"
    ],
    "howToUse": {
      "intro": "Per FDA guidance on menstrual pads:",
      "steps": [
        "Wash your hands before and after handling pads.",
        "Follow the instructions on the pack.",
        "Change pads every few hours, even if your flow is light, and more often when it's heavy.",
        "If you get itching, rash, pain or swelling, stop using the pad and contact your healthcare provider."
      ],
      "sourceUrl": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-pads-and-liners",
      "sourceLabel": "FDA: Menstrual pads and liners"
    },
    "clinicalSources": [
      {
        "url": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-pads-and-liners",
        "label": "FDA: Menstrual pads and liners",
        "summary": "Pads are FDA-regulated devices; wearing one too long may irritate skin, and some people react to scents, deodorants or other materials added to pads."
      },
      {
        "url": "https://www.fda.gov/medical-devices/products-and-medical-procedures/menstrual-product-options-facts-and-safe-use",
        "label": "FDA: Menstrual product options, facts and safe use",
        "summary": "All menstrual products sold in the U.S. are regulated as medical devices, and wearing any product too long can let harmful bacteria grow."
      }
    ],
    "clinicalNote": "The FDA notes that some people react to scents, deodorants or other materials added to pads, and that wearing a pad too long can irritate skin. Changing every few hours, even on light days, matters as much as what the pad is made of."
  },
  "p-organyc-pad": {
    "whoItsFor": [
      "People who want pads made with certified organic cotton throughout, inside and out",
      "Those with sensitive skin who react to scents or other added materials in some mainstream pads",
      "Not the pick if you expect a proven clinical difference: organic pads have not been shown to outperform conventional ones in studies"
    ],
    "howToUse": {
      "intro": "Per FDA guidance on menstrual pads:",
      "steps": [
        "Wash your hands before and after handling pads.",
        "Follow the instructions on the pack.",
        "Change pads every few hours, even if your flow is light, and more often when it's heavy.",
        "If you get itching, rash, pain or swelling, stop using the pad and contact your healthcare provider."
      ],
      "sourceUrl": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-pads-and-liners",
      "sourceLabel": "FDA: Menstrual pads and liners"
    }
  },
  "p-veeda-pad": {
    "whoItsFor": [
      "Budget-minded shoppers who want natural cotton, chlorine-free pads at a lower price than many organic brands",
      "Those who want an ultra-thin pad with wings for everyday flow",
      "Not the pick if you want a fully plastic-free pad: the back sheet is polyethylene (PE)"
    ],
    "howToUse": {
      "intro": "Per FDA guidance on menstrual pads:",
      "steps": [
        "Wash your hands before and after handling pads.",
        "Follow the instructions on the pack.",
        "Change pads every few hours, even if your flow is light, and more often when it's heavy.",
        "If you get itching, rash, pain or swelling, stop using the pad and contact your healthcare provider."
      ],
      "sourceUrl": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-pads-and-liners",
      "sourceLabel": "FDA: Menstrual pads and liners"
    }
  },
  "p-l-pad": {
    "whoItsFor": [
      "People who want an organic cotton top layer against the skin at a drugstore price",
      "Shoppers who like that the brand donates period products with purchases",
      "Anyone who prefers a disposable pad over tampons or cups for everyday flow",
      "Not the pick if you want a fully plastic-free pad: the back sheet is polyethylene"
    ],
    "howToUse": {
      "intro": "Per FDA guidance on menstrual pads:",
      "steps": [
        "Wash your hands before and after handling a pad.",
        "Follow the instructions on the pack for placement and wings.",
        "Change your pad every few hours, even on light days.",
        "Change more often on heavy-flow days.",
        "Stop using it and call your provider if you get itching, rash, pain or swelling."
      ],
      "sourceUrl": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-pads-and-liners",
      "sourceLabel": "FDA: Menstrual Pads and Liners"
    },
    "scienceSources": [
      {
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC7958867/",
        "label": "Lin, Batterman et al., Environment International 2020",
        "summary": "Tested 79 US feminine hygiene products including 22 pads and found that 'organic' or 'natural' labels did not reliably mean lower volatile organic compound levels, though calculated risks were low for most products."
      },
      {
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC6998054",
        "label": "Journal of Women's Health 2020 (NHANES analysis)",
        "summary": "In 2,432 US women, using tampons or menstrual pads was not linked to higher blood levels of volatile organic compounds, while douching and feminine powders were."
      }
    ]
  },
  "p-tampax-pure": {
    "whoItsFor": [
      "Tampon users who want an organic cotton core from a familiar mainstream brand",
      "People who like a plastic applicator for smooth, easy insertion",
      "Shoppers who want an organic option that is easy to find in most drugstores",
      "Not the pick if you want to avoid plastic: the applicator is plastic"
    ],
    "howToUse": {
      "intro": "Per Cleveland Clinic's tampon guide and FDA tampon guidance:",
      "steps": [
        "Wash your hands, unwrap the tampon and get into a relaxed position.",
        "Hold the applicator at the vaginal opening, angled slightly toward your back.",
        "Slide it in until the base reaches the opening, then push the plunger and remove the applicator.",
        "Use the lowest absorbency that handles your flow.",
        "Change every 4 to 8 hours and never leave a tampon in longer than 8 hours.",
        "Remove it and get care right away if you have a sudden high fever, rash, vomiting or dizziness."
      ],
      "sourceUrl": "https://health.clevelandclinic.org/how-to-insert-a-tampon",
      "sourceLabel": "Cleveland Clinic: How to Insert a Tampon"
    }
  },
  "p-natracare-tampon": {
    "whoItsFor": [
      "People who want a single-ingredient tampon made only of certified organic cotton",
      "Those with sensitive skin who want no added dyes or fragrance",
      "Anyone trying to cut packaging waste, since there is no applicator",
      "Not the pick for first-time tampon users who would rather start with an applicator"
    ],
    "howToUse": {
      "intro": "Per Natracare's pack instructions and FDA tampon guidance:",
      "steps": [
        "Wash and dry your hands, unwrap the tampon and give the string a quick tug.",
        "Hold the base with your index finger and gently push it in, aiming up and back toward the small of your back.",
        "If you can still feel it, push it a little further, leaving the string outside.",
        "Use the lowest absorbency that handles your flow and only one tampon at a time.",
        "Change every 4 to 8 hours and never leave a tampon in longer than 8 hours."
      ],
      "sourceUrl": "https://www.vitasave.ca/products/natracare-organic-super-non-applicator-tampons",
      "sourceLabel": "Natracare instructions (Vitasave listing)"
    },
    "scienceSources": [
      {
        "url": "https://factor.niehs.nih.gov/2024/8/feature/3-feature-metals-in-tampons",
        "label": "NIEHS: Metals in tampons (Shearston et al., Environment International 2024)",
        "summary": "Tested 30 tampons from 14 brands and found metals in all of them; lead was higher in non-organic tampons and arsenic higher in organic ones, and the study did not show whether any metals are absorbed by the body."
      }
    ]
  },
  "p-organyc-tampon": {
    "whoItsFor": [
      "People who want a 100% organic cotton tampon with an applicator",
      "Anyone trying to use less plastic, since the applicator is cardboard",
      "Those who want no added fragrance or synthetic fibers in a tampon",
      "Not the pick if you find cardboard applicators less smooth than plastic"
    ],
    "howToUse": {
      "intro": "Per Cleveland Clinic's tampon guide and FDA tampon guidance:",
      "steps": [
        "Wash your hands, unwrap the tampon and get into a relaxed position.",
        "Hold the applicator at the vaginal opening, angled slightly toward your back.",
        "Slide it in until the base reaches the opening, then push the plunger and remove the applicator.",
        "Use the lowest absorbency that handles your flow.",
        "Change every 4 to 8 hours and never leave a tampon in longer than 8 hours."
      ],
      "sourceUrl": "https://health.clevelandclinic.org/how-to-insert-a-tampon",
      "sourceLabel": "Cleveland Clinic: How to Insert a Tampon"
    },
    "scienceSources": [
      {
        "url": "https://factor.niehs.nih.gov/2024/8/feature/3-feature-metals-in-tampons",
        "label": "NIEHS: Metals in tampons (Shearston et al., Environment International 2024)",
        "summary": "Tested 30 tampons from 14 brands and found metals in all of them; lead was higher in non-organic tampons and arsenic higher in organic ones, and the study did not show whether any metals are absorbed by the body."
      }
    ]
  },
  "p-diva-cup": {
    "whoItsFor": [
      "People who want a reusable period product that can last for years",
      "Those who want a cup that is easy to find in stores, with more than one size",
      "People sensitive to latex, since it is made of silicone",
      "Not the pick if you have an IUD and haven't checked with your gynecologist first"
    ],
    "howToUse": {
      "intro": "Per FDA menstrual cup guidance:",
      "steps": [
        "Wash your hands before and after handling the cup.",
        "Wash the cup with soap and water before you use it for the first time.",
        "Fold and insert it following the instructions in the box, since methods vary by product.",
        "Empty, rinse and reinsert it every 8 to 12 hours, or as often as the label says.",
        "At the end of your period, clean it well, typically by boiling it for 1 to 2 minutes.",
        "Check with your gynecologist before using it if you have an IUD."
      ],
      "sourceUrl": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-cups",
      "sourceLabel": "FDA: Menstrual Cups"
    }
  },
  "p-lunette-cup": {
    "whoItsFor": [
      "First-time cup users who want a softer silicone cup",
      "People who want a reusable option that can save money over time",
      "People sensitive to latex, since it is made of silicone",
      "Not the pick if you have an IUD and haven't checked with your gynecologist first"
    ],
    "howToUse": {
      "intro": "Per FDA menstrual cup guidance:",
      "steps": [
        "Wash your hands before and after handling the cup.",
        "Wash the cup with soap and water before you use it for the first time.",
        "Fold and insert it following the instructions in the box, since methods vary by product.",
        "Empty, rinse and reinsert it every 8 to 12 hours, or as often as the label says.",
        "At the end of your period, clean it well, typically by boiling it for 1 to 2 minutes.",
        "Check with your gynecologist before using it if you have an IUD."
      ],
      "sourceUrl": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-cups",
      "sourceLabel": "FDA: Menstrual Cups"
    }
  },
  "p-nixit": {
    "whoItsFor": [
      "People who find cups uncomfortable and want a disc that doesn't rely on suction",
      "Those who want one size instead of choosing between cup sizes",
      "Anyone who wants a reusable product that can save money over time",
      "Not the pick if you have an IUD and haven't checked with your gynecologist first"
    ],
    "howToUse": {
      "intro": "Per FDA guidance on menstrual cups and discs:",
      "steps": [
        "Wash your hands before and after handling the disc.",
        "Wash it with soap and water before first use.",
        "Insert and remove it following the instructions in the box, since methods vary by product.",
        "Empty it about every 8 to 12 hours, or as often as the label says.",
        "Clean it well at the end of your period, typically by boiling it for 1 to 2 minutes.",
        "Check with your gynecologist before using it if you have an IUD."
      ],
      "sourceUrl": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-cups",
      "sourceLabel": "FDA: Menstrual Cups"
    },
    "clinicalSources": [
      {
        "url": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-cups",
        "label": "FDA: Menstrual Cups",
        "summary": "FDA regulates menstrual cups, which it says are also called menstrual discs, and advises washing before first use, emptying every 8 to 12 hours, boiling at the end of your cycle and checking with a gynecologist if you have an IUD."
      }
    ],
    "clinicalNote": "The FDA regulates menstrual cups and discs as medical devices and says insertion and removal can take practice. Check with your gynecologist before using one with an IUD, since it could interfere with the strings or placement."
  },
  "p-cora-disc": {
    "whoItsFor": [
      "People who want a reusable disc with a grip tab to make removal easier",
      "Those new to discs who worry about getting one out",
      "Anyone who wants a reusable product that can save money over time",
      "Not the pick if you have an IUD and haven't checked with your gynecologist first"
    ],
    "howToUse": {
      "intro": "Per FDA guidance on menstrual cups and discs:",
      "steps": [
        "Wash your hands before and after handling the disc.",
        "Wash it with soap and water before first use.",
        "Insert and remove it following the instructions in the box, since methods vary by product.",
        "Empty it about every 8 to 12 hours, or as often as the label says.",
        "Clean it well at the end of your period, typically by boiling it for 1 to 2 minutes.",
        "Check with your gynecologist before using it if you have an IUD."
      ],
      "sourceUrl": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-cups",
      "sourceLabel": "FDA: Menstrual Cups"
    },
    "clinicalSources": [
      {
        "url": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-cups",
        "label": "FDA: Menstrual Cups",
        "summary": "FDA regulates menstrual cups, which it says are also called menstrual discs, and advises washing before first use, emptying every 8 to 12 hours, boiling at the end of your cycle and checking with a gynecologist if you have an IUD."
      }
    ],
    "clinicalNote": "The FDA regulates menstrual cups and discs as medical devices and says insertion and removal can take practice. Check with your gynecologist before using one with an IUD, since it could interfere with the strings or placement."
  },
  "p-modibodi": {
    "whoItsFor": [
      "People who want reusable period underwear in an extended size range, up to 6XL",
      "Those who want underwear the brand says is made without PFAS",
      "Anyone who wants a backup for a tampon or cup, or a pad alternative on lighter days"
    ],
    "howToUse": {
      "intro": "Per FDA guidance on pads, liners and period underwear:",
      "steps": [
        "Wash your hands before and after changing.",
        "Follow the brand's care and washing instructions on the label.",
        "Change into a fresh pair regularly, and more often on heavy-flow days.",
        "Don't wear or reuse a pair longer than the brand recommends.",
        "Stop wearing it and call your provider if you get itching, rash, pain or swelling."
      ],
      "sourceUrl": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-pads-and-liners",
      "sourceLabel": "FDA: Menstrual Pads and Liners"
    }
  },
  "p-rubylove": {
    "whoItsFor": [
      "People who want period underwear with an organic cotton liner",
      "Swimmers and active people who want period swimwear or activewear",
      "Anyone who wants a backup for a tampon or cup, or a pad alternative on lighter days"
    ],
    "howToUse": {
      "intro": "Per FDA guidance on pads, liners and period underwear:",
      "steps": [
        "Wash your hands before and after changing.",
        "Follow the brand's care and washing instructions on the label.",
        "Change into a fresh pair regularly, and more often on heavy-flow days.",
        "Don't wear or reuse a pair longer than the brand recommends.",
        "Stop wearing it and call your provider if you get itching, rash, pain or swelling."
      ],
      "sourceUrl": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-pads-and-liners",
      "sourceLabel": "FDA: Menstrual Pads and Liners"
    }
  },
  "p-azo-test": {
    "whoItsFor": [
      "Anyone who feels the first signs of a UTI (burning, urgency, going more often) and wants a quick at-home check before calling a doctor",
      "People with a history of UTIs who want strips on hand to share a result with their clinician",
      "Those who want to screen for both nitrite and white blood cells in urine in about 2 minutes",
      "Not the pick for ruling a UTI in or out on its own: research shows a negative strip lowers the odds but does not exclude infection, so symptoms still need a clinician"
    ],
    "howToUse": {
      "intro": "Per AZO's package directions:",
      "steps": [
        "Use a strip at the first sign of a UTI, like burning or needing to go more often.",
        "Hold one test strip in your urine stream for 1 to 2 seconds.",
        "Read the nitrite pad at 1 minute and the leukocyte pad at 2 minutes.",
        "Match the pad colors to the color blocks on the foil pouch.",
        "Store strips at room temperature out of direct sunlight, and do not refrigerate.",
        "Call your doctor with your results, especially if symptoms continue."
      ],
      "sourceUrl": "https://ca.iherb.com/pr/azo-test-strips-urinary-tract-infection-test-3-self-testing-strips/14562",
      "sourceLabel": "AZO Test Strips label directions (iHerb listing)"
    },
    "scienceSources": [
      {
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC434513",
        "label": "Devillé et al., BMC Urology (2004): meta-analysis of urine dipstick accuracy",
        "summary": "Found the dipstick is most useful for ruling out infection when both nitrite and leukocyte esterase are negative, while positive results still need confirmation."
      },
      {
        "url": "https://www.aafp.org/pubs/afp/issues/2013/0515/od2.html",
        "label": "American Family Physician (2013): Dipstick urinalysis for the diagnosis of acute UTI",
        "summary": "Dipstick testing moderately improves the accuracy of symptoms in women, and a positive nitrite result is more informative than a positive leukocyte esterase result."
      }
    ]
  },
  "p-good-clean-love": {
    "whoItsFor": [
      "People with everyday vaginal dryness who want a moisturizer made to sit close to normal vaginal pH and osmolality",
      "Anyone who has felt stinging or irritation from conventional lubricants and wants an iso-osmolar, water-based option",
      "Those who want one product for daily comfort that can also be used as a lubricant, including with latex and polyisoprene condoms",
      "Not the first pick if you have known skin sensitivities or allergies: the brand itself points sensitive users to its BioNourish line instead"
    ],
    "howToUse": {
      "intro": "Per Good Clean Love's instructions for its Bio-Match moisturizing gel (Restore):",
      "steps": [
        "Use one application as needed for day-to-day comfort and moisture.",
        "Fill the reusable applicator and insert it about as far as a tampon, or as far as feels comfortable.",
        "Use it as a lubricant during sex if you like; it works with latex and polyisoprene condoms.",
        "Check with your OB-GYN before using it during pregnancy."
      ],
      "sourceUrl": "https://goodcleanlove.com/products/restore%C2%AE-moisturizing-vaginal-gel-products",
      "sourceLabel": "Good Clean Love: Restore Moisturizing Vaginal Gel product page"
    },
    "scienceSources": [
      {
        "url": "https://www.plosone.org/article/info%3Adoi%2F10.1371%2Fjournal.pone.0048328",
        "label": "Dezzutti et al., PLoS ONE (2012): Is Wetter Better? An evaluation of over-the-counter personal lubricants",
        "summary": "In lab and tissue testing, Good Clean Love was nearly iso-osmolar and was not toxic to epithelial cells or tissue, while several hyperosmolar gels caused epithelial damage."
      }
    ]
  },
  "p-flo-gummies": {
    "whoItsFor": [
      "People with predictable PMS symptoms like bloating, cramps and mood swings who want to try a daily supplement",
      "Those who would rather take a chewable gummy than a capsule, and want a vegan, gluten-free option",
      "Anyone willing to take it every day for 2 to 3 months before judging whether it helps",
      "Worth a doctor check first if you use birth control or take prescription medicine, as the brand itself advises"
    ],
    "howToUse": {
      "intro": "Per FLO's label directions:",
      "steps": [
        "Take 2 gummies daily.",
        "Take them with or without food.",
        "Take them consistently and allow 2 to 3 months for full effects.",
        "Talk to your doctor before starting if you are on birth control or prescription medication."
      ],
      "sourceUrl": "https://glamglobal.co.uk/products/o-positiv-flo-pms-gummie-vitamins-proactive-pms-relief-60-count",
      "sourceLabel": "O Positiv FLO PMS Gummies product listing (label directions)"
    }
  },
  "p-hum-flatter-me": {
    "whoItsFor": [
      "People who get occasional bloating or heaviness after meals and want to try an enzyme supplement with food",
      "Those who notice bloating tied to their cycle and want a low-effort mealtime option to test",
      "Anyone looking for a vegan, gluten-free enzyme blend that also includes ginger and peppermint",
      "Not the pick for ongoing bloating, belly pain, diarrhea or weight loss: Johns Hopkins advises seeing a doctor for those, and healthy people generally do not need enzyme supplements"
    ],
    "howToUse": {
      "intro": "Per HUM's directions:",
      "steps": [
        "Take 1 capsule right before a meal, up to your two main meals a day.",
        "Take it with food, not on an empty stomach, which may cause stomach upset.",
        "If you forget, take it during or shortly after eating."
      ],
      "sourceUrl": "https://glamglobal.co.uk/fr/products/flatter-me-supplement-for-daily-bloating-18-full-spectrum-digestive-enzymes-to-support-food-breakdown-ginger-fennel-seed-peppermint-for-nutrient-absorption-30-day-supply",
      "sourceLabel": "HUM Flatter Me product listing (brand directions)"
    },
    "clinicalSources": [
      {
        "url": "https://www.hopkinsmedicine.org/health/wellness-and-prevention/digestive-enzymes-and-digestive-enzyme-supplements?amp=true",
        "label": "Johns Hopkins Medicine: Digestive Enzymes and Digestive Enzyme Supplements",
        "summary": "Over-the-counter enzyme supplements are not FDA regulated, claims like a flatter stomach lack evidence, and persistent bloating or belly pain should be checked by a doctor."
      },
      {
        "url": "https://my.clevelandclinic.org/health/drugs/enzyme-supplements",
        "label": "Cleveland Clinic: Enzyme Supplements",
        "summary": "Lists possible side effects such as gas, nausea and stomach pain, and advises telling your care team if you are pregnant, breastfeeding or take other medicines."
      }
    ],
    "clinicalNote": "Over-the-counter enzyme blends are not regulated by the FDA, so the dose on the label may not be exact, and healthy people usually do not need them. Bloating that keeps coming back, or comes with pain, diarrhea or weight loss, is worth getting checked.",
    "scienceSources": [
      {
        "url": "https://pubmed.ncbi.nlm.nih.gov/30156436/",
        "label": "Journal of Medicinal Food (2018): multienzyme complex in functional dyspepsia, randomized placebo-controlled trial",
        "summary": "In 40 adults with functional dyspepsia, a different multienzyme blend (DigeZyme) improved symptom scores versus placebo over 60 days with no product-related side effects; this was not a study of Flatter Me."
      }
    ]
  },
  "p-thermacare": {
    "whoItsFor": [
      "People with period cramps who want drug-free heat they can wear under clothes at work, school or on the go",
      "Those who want steady heat for up to 8 hours without being tied to an outlet",
      "People whose cramps sit in the lower belly or lower back, where a thin wrap fits easily",
      "Not the pick for sleeping, for broken or damaged skin, or without asking a doctor first if you have diabetes, poor circulation, heart disease, rheumatoid arthritis or are pregnant"
    ],
    "howToUse": {
      "intro": "Per ThermaCare's package directions:",
      "steps": [
        "Stick the wrap to your underwear over the painful area, adhesive side against the fabric, not your skin.",
        "Give it up to 30 minutes to reach full temperature.",
        "Wear it for up to 8 hours, and never more than 8 hours in any 24-hour period.",
        "Do not fold or bunch the wrap, and do not wear it while sleeping.",
        "Check your skin often, and stop using it if you see burns or blisters."
      ],
      "sourceUrl": "https://www.orderroombox.com/product/thermacare-heatwraps-menstrual-pain-therapy/",
      "sourceLabel": "ThermaCare Menstrual HeatWraps label directions and warnings (retailer listing)"
    },
    "clinicalSources": [
      {
        "url": "https://www.mayoclinic.org/diseases-conditions/menstrual-cramps/diagnosis-treatment/drc-20374944",
        "label": "Mayo Clinic: Menstrual cramps, diagnosis and treatment",
        "summary": "Lists a heating pad, hot water bottle, heat patch or hot bath as self-care that might ease menstrual cramps."
      },
      {
        "url": "https://medlineplus.gov/ency/article/003150.htm",
        "label": "MedlinePlus (NIH): Painful menstrual periods",
        "summary": "Recommends heat on the lower belly as home care and lists signs, like fever with pelvic pain or pain that does not improve after 3 months of treatment, that mean you should call a provider."
      }
    ]
  },
  "p-portable-heating": {
    "whoItsFor": [
      "People with period cramps who want heat they can wear under clothes at work or school instead of staying near an outlet",
      "Those who like to adjust the heat, since it has 3 settings",
      "Anyone who already finds a heating pad helpful at home and wants a portable version",
      "Not for wearing while you sleep: MedlinePlus advises never falling asleep with a heating pad on"
    ],
    "clinicalSources": [
      {
        "url": "https://www.mayoclinic.org/diseases-conditions/menstrual-cramps/diagnosis-treatment/drc-20374944",
        "label": "Mayo Clinic: Menstrual cramps, diagnosis and treatment",
        "summary": "Lists a heating pad, hot water bottle, heat patch or hot bath as self-care that might ease menstrual cramps."
      },
      {
        "url": "https://medlineplus.gov/ency/article/003150.htm",
        "label": "MedlinePlus (NIH): Painful menstrual periods",
        "summary": "Advises applying a heating pad to the lower belly, never falling asleep with it on, and calling a provider if pain does not improve after 3 months of treatment."
      }
    ]
  },
  "p-viboos-heating-pad": {
    "whoItsFor": [
      "People with period cramps who mostly rest at home and want a large pad that covers the lower belly or back",
      "Those who want several heat levels and an auto shut-off timer on a budget",
      "Anyone who also wants one pad for neck, shoulder, knee or leg aches",
      "Not the pick for use while sleeping or on the go: it plugs in, and MedlinePlus advises never falling asleep with a heating pad on"
    ],
    "clinicalSources": [
      {
        "url": "https://www.mayoclinic.org/diseases-conditions/menstrual-cramps/diagnosis-treatment/drc-20374944",
        "label": "Mayo Clinic: Menstrual cramps, diagnosis and treatment",
        "summary": "Lists a heating pad, hot water bottle, heat patch or hot bath as self-care that might ease menstrual cramps."
      },
      {
        "url": "https://medlineplus.gov/ency/article/003150.htm",
        "label": "MedlinePlus (NIH): Painful menstrual periods",
        "summary": "Advises applying a heating pad to the lower belly, never falling asleep with it on, and calling a provider if pain does not improve after 3 months of treatment."
      }
    ]
  },
  "d-betterhelp": {
    "whoItsFor": [
      "Adults who want regular therapy with a licensed professional without commuting to an office",
      "People who like being able to message a therapist between live sessions, not just at a set appointment",
      "Anyone working through common concerns like anxiety, depression, grief, relationship stress or trauma who wants to try a few therapists to find a fit",
      "Not the pick for minors, anyone in an urgent crisis or emergency, court-ordered therapy, or anyone without a reliable internet connection, per BetterHelp's own FAQ"
    ],
    "howToUse": {
      "intro": "Per BetterHelp's own FAQ and online therapy pages:",
      "steps": [
        "Start on the BetterHelp site by choosing \"Get matched with a therapist.\"",
        "Review your match and switch to a different therapist if it doesn't feel like the right fit.",
        "Message your therapist any time from any internet-connected device, and watch for an email when they reply.",
        "Schedule live sessions by chat, phone or video, then log in at the booked time to join.",
        "Check with your insurer before signing up, since many plans don't cover online therapy."
      ],
      "sourceUrl": "https://betterhelp.com:443/faq",
      "sourceLabel": "BetterHelp FAQ"
    }
  },
  "d-headspace": {
    "whoItsFor": [
      "Beginners who want a short, guided way to start meditating, starting with a 10-day basics course",
      "People looking for a low-cost way to manage everyday stress, irritability or low mood",
      "Anyone who wants guided sleep and wind-down content in the same app",
      "Not the pick as a replacement for therapy or treatment: NCCIH notes about 8 percent of people in meditation studies reported negative effects, most often anxiety or depression"
    ],
    "howToUse": {
      "intro": "Per Headspace's own app page:",
      "steps": [
        "Download Headspace from the App Store or Google Play.",
        "Create an account and start a free trial from the subscriptions page.",
        "Begin with the 10-day Basics course to build a daily habit.",
        "Explore the sleep content for wind-down and bedtime sessions.",
        "Practice a few minutes a day, ideally around the same time."
      ],
      "sourceUrl": "https://www.headspace.com/headspace-app",
      "sourceLabel": "Headspace app page"
    },
    "clinicalSources": [
      {
        "url": "https://www.nccih.nih.gov/health/tips/8-things-to-know-about-meditation-and-mindfulness",
        "label": "NCCIH (NIH): 8 things to know about meditation and mindfulness",
        "summary": "Mindfulness practices may help anxiety, depression and insomnia and are usually low-risk, though about 8 percent of study participants reported negative effects."
      }
    ],
    "scienceSources": [
      {
        "url": "https://link.springer.com/article/10.1007/s12671-018-0905-4",
        "label": "Economides et al., Mindfulness (2018): RCT of Headspace",
        "summary": "In healthy adults, 10 introductory Headspace sessions reduced stress from external pressure and irritability and improved positive mood versus an audiobook control."
      },
      {
        "url": "https://journals.plos.org/plosone/article?id=10.1371%2Fjournal.pone.0209482",
        "label": "Champion et al., PLOS ONE (2018): pilot RCT of Headspace",
        "summary": "Adults using Headspace reported lower stress and higher life satisfaction and resilience at day 10 and day 30 versus a wait-list, in a small Headspace-funded pilot."
      }
    ]
  },
  "d-calm": {
    "whoItsFor": [
      "People whose anxious thoughts or racing mind make it hard to fall asleep",
      "Beginners who want a structured intro, like 7 Days of Calm, before practicing on their own",
      "Anyone who finds a story, music or soundscape easier to settle into than silent meditation",
      "Not the pick as a stand-alone treatment for a diagnosed sleep disorder or mental health condition: the studies so far are short, self-reported and partly run by Calm advisors"
    ],
    "howToUse": {
      "intro": "Per Calm's own getting-started guide:",
      "steps": [
        "Pick your main goal in the app: learning to meditate or sleeping better.",
        "Start with 7 Days of Calm to learn the basics, then move on to 21 Days of Calm.",
        "Try the 10-minute Daily Calm session at the top of the Home page.",
        "For sleep, open the Sleep tab and choose a Sleep Story, sleep meditation or soundscape.",
        "Use headphones and turn on Do Not Disturb or Airplane mode before you press play."
      ],
      "sourceUrl": "https://support.calm.com/hc/en-us/articles/115002474567-Getting-Started-With-Calm-A-Beginner-s-Guide-to-Meditation-Sleep",
      "sourceLabel": "Calm Help Center: Getting Started With Calm"
    },
    "clinicalSources": [
      {
        "url": "https://www.nccih.nih.gov/health/tips/8-things-to-know-about-meditation-and-mindfulness",
        "label": "NCCIH (NIH): 8 things to know about meditation and mindfulness",
        "summary": "Mindfulness meditation may reduce insomnia and improve sleep quality, with effects comparable to CBT or exercise, and is usually low-risk."
      }
    ],
    "scienceSources": [
      {
        "url": "https://journals.plos.org/plosone/article?id=10.1371%2Fjournal.pone.0244717",
        "label": "Huberty et al., PLOS ONE (2021): RCT of Calm in adults with sleep disturbance",
        "summary": "Eight weeks of at least 10 minutes a day on Calm reduced fatigue, daytime sleepiness and pre-sleep arousal versus a wait-list; several authors advise Calm."
      },
      {
        "url": "https://formative.jmir.org/2025/1/e66131",
        "label": "JMIR Formative Research (2025): pilot RCT of Calm in undergraduates",
        "summary": "A 30-day pilot in 80 students found greater improvement in sleep quality, stress and anxiety with Calm than control, but no difference in depression."
      }
    ]
  },
  "d-initio": {
    "whoItsFor": [
      "People trying to conceive who want to see their fertile window and get confirmation that ovulation actually happened",
      "Anyone who wants hormone numbers (estrogen, LH, PdG and FSH) at home instead of reading faint lines on standard strips",
      "Those who already test daily and are comfortable with a phone app and a WiFi reader",
      "Not the pick for birth control: FDA says home ovulation tests are not reliable for preventing pregnancy, and Inito notes accuracy may drop with irregular or anovulatory cycles"
    ],
    "howToUse": {
      "intro": "Per Inito's own testing guide:",
      "steps": [
        "Download the Inito app, register, and connect the reader to your WiFi.",
        "Start testing on cycle day 6, then test on every day the app marks without skipping.",
        "Use first-morning urine in the Inito cup, filled to the line.",
        "Dip the strip for 15 seconds, cap it, and insert it into the reader until the test finishes.",
        "Keep testing daily while the app says it is waiting for a PdG rise, which can take up to 9 days."
      ],
      "sourceUrl": "https://blog.inito.com/a-complete-guide-to-testing-with-the-inito-fertility-monitor/",
      "sourceLabel": "Inito: A Complete Guide to Testing with the Inito Fertility Monitor"
    },
    "clinicalSources": [
      {
        "url": "https://www.fda.gov/medical-devices/home-use-tests/ovulation-urine-test",
        "label": "FDA: Ovulation (Urine Test)",
        "summary": "Home urine tests detect the LH surge about 1 to 1.5 days before ovulation, are reliable about 9 times out of 10 when used correctly, and should not be used as birth control."
      }
    ]
  },
  "d-oura": {
    "whoItsFor": [
      "People who want cycle, sleep and recovery tracking from one device worn overnight, without taking a thermometer reading each morning",
      "Anyone curious how their temperature, heart rate variability and sleep shift across cycle phases",
      "Natural Cycles users who want ring temperature data synced in place of manual readings",
      "Not the pick for birth control on its own: Oura says Cycle Insights is for tracking only, and people on hormonal contraception see period predictions but not cycle phases or a fertile window"
    ],
    "howToUse": {
      "intro": "Per Oura's own setup guide and Cycle Insights help page:",
      "steps": [
        "Download the Oura app and charge the ring on its dock until the light turns green.",
        "Turn on Bluetooth and follow the in-app steps to create an account and pair the ring.",
        "Wear it on your index finger, sensor bumps on the palm side, especially while you sleep.",
        "Choose the Track my cycle intention and enter your last period, cycle length and any hormone use.",
        "Log your periods and keep wearing the ring nightly, since predictions improve as data builds."
      ],
      "sourceUrl": "https://support.ouraring.com/hc/en-us/articles/4410663885331-Cycle-Insights",
      "sourceLabel": "Oura Help: Cycle Insights"
    },
    "clinicalSources": [
      {
        "url": "https://www.mayoclinic.org/tests-procedures/basal-body-temperature/about/pac-20393026",
        "label": "Mayo Clinic: Basal body temperature for natural family planning",
        "summary": "Resting temperature rises slightly after ovulation, but illness, medications, postpartum, breastfeeding, irregular cycles and PCOS can make readings unreliable, and about 1 in 4 typical users of fertility awareness methods get pregnant within a year."
      }
    ],
    "scienceSources": [
      {
        "url": "https://doaj.org/article/c13fc1b658874f0abfe65595566d828a",
        "label": "Maijala et al., BMC Women's Health (2019): Oura ring pilot study",
        "summary": "In 22 women, nightly finger temperature from the Oura ring was 0.30 C higher in the luteal phase and detected menstruation and ovulation with moderate to good sensitivity."
      }
    ]
  },
  "d-apple-health": {
    "whoItsFor": [
      "iPhone users who want free, built-in period and fertile window tracking without adding another app",
      "Anyone whose top concern is privacy: with two-factor authentication on, Apple says Cycle Tracking data synced to iCloud is end-to-end encrypted",
      "Apple Watch Series 8, Ultra or newer owners who want retrospective ovulation estimates from wrist temperature",
      "Not the pick for birth control or diagnosis: Apple says Cycle Tracking should not be used for either"
    ],
    "howToUse": {
      "intro": "Per Apple's own Cycle Tracking support page:",
      "steps": [
        "Open the Health app, go to Browse, tap Cycle Tracking, then tap Get Started.",
        "Enter your recent period dates and typical cycle and period length during setup.",
        "Tap the oval on each day to log your period, and add symptoms, spotting or other details below it.",
        "Turn on period and fertility notifications under Options.",
        "Turn on two-factor authentication so your synced cycle data is end-to-end encrypted."
      ],
      "sourceUrl": "https://support.apple.com/en-us/120356",
      "sourceLabel": "Apple Support: Track your period with Cycle Tracking"
    },
    "clinicalSources": [
      {
        "url": "https://www.mayoclinic.org/diseases-conditions/menstrual-disorders/in-depth/menstrual-cycle/art-20047186",
        "label": "Mayo Clinic: Menstrual cycle, what's typical and what's not",
        "summary": "Recommends logging period start dates for several months, plus flow, pain and bleeding between periods, and lists cycle changes that warrant a visit to a clinician."
      }
    ],
    "clinicalNote": "Mayo Clinic suggests logging your period start dates for several months, along with flow, pain and any bleeding between periods. Cycles shorter than 24 or longer than 38 days, bleeding that lasts more than 8 days, or periods that stop for more than 90 days are worth raising with a clinician.",
    "scienceSources": [
      {
        "url": "https://www.nature.com/articles/s41746-023-00848-1",
        "label": "Li et al., npj Digital Medicine (2023): Apple Women's Health Study",
        "summary": "Using over 165,000 cycles logged in Apple Health Cycle Tracking, researchers found cycle length varies by age, with smaller differences by ethnicity and BMI."
      }
    ]
  },
  "d-bloom": {
    "whoItsFor": [
      "People who want short, guided CBT exercises for everyday stress, anxiety, sleep or low mood",
      "Those who like a daily routine of video coaching, journaling and mindfulness on their phone",
      "Anyone looking for a low-cost, self-guided way to practice CBT skills before or alongside therapy",
      "Not the pick as your only support for severe or worsening symptoms: research shows mental health apps have small effects on average"
    ],
    "scienceSources": [
      {
        "url": "https://research.vu.nl/en/publications/current-evidence-on-the-efficacy-of-mental-health-smartphoneapps-/",
        "label": "Linardon et al., World Psychiatry 2024: meta-analysis of 176 RCTs of mental health apps",
        "summary": "Apps had small but significant effects on depression and generalized anxiety, and apps with CBT features produced larger effects."
      },
      {
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC6732686",
        "label": "Linardon et al., World Psychiatry 2019: meta-analysis of 66 RCTs of app-supported interventions",
        "summary": "Smartphone apps beat control conditions for depression, generalized anxiety and stress, with stronger effects when apps included engagement reminders or professional guidance."
      }
    ]
  },
  "d-visana": {
    "whoItsFor": [
      "People with endometriosis, fibroids, heavy bleeding or painful periods who want ongoing specialist care from home",
      "Those who want one virtual team that also covers pelvic floor exercises, nutrition advice and mental health support",
      "People whose employer or health plan offers Visana as an in-network benefit",
      "Not the pick if your plan does not cover telemedicine: Visana notes that coverage depends on your group plan"
    ],
    "howToUse": {
      "intro": "Per Visana's member flyer:",
      "steps": [
        "Check your health plan documents to confirm your plan covers Visana and telemedicine.",
        "Go to the Visana sign-up link your plan provides (Cigna members use visanahealth.com/cigna).",
        "Schedule a virtual visit online, or call 1-800-877-1122.",
        "Pay your usual in-network copay or coinsurance at the time of the visit.",
        "Book during clinic hours: weekdays 8am to 9pm ET and Saturdays 8am to 2pm ET."
      ],
      "sourceUrl": "https://www.aruplab.com/files/resources/benefits/Visana-Member-Flyer.pdf",
      "sourceLabel": "Visana member flyer (hosted by ARUP Laboratories benefits)"
    },
    "scienceSources": [
      {
        "url": "https://pubmed.ncbi.nlm.nih.gov/37753632/",
        "label": "Systematic review of multidisciplinary team care for pelvic pain and endometriosis, ANZJOG 2024",
        "summary": "Team care for endometriosis is growing and patients value reliable information and emotional support, but the authors found evidence for outcomes is still limited."
      }
    ]
  },
  "p-kotex-security": {
    "whoItsFor": [
      "People who want a thin, widely available disposable pad for everyday periods",
      "Anyone who prefers external protection over tampons or cups",
      "People who also want a pad for discharge outside their period, which the FDA notes pads can absorb"
    ],
    "howToUse": {
      "intro": "Per FDA guidance for menstrual pads and liners:",
      "steps": [
        "Wash your hands before and after handling a pad.",
        "Change your pad every few hours, even if your flow is light.",
        "Change more often on heavy-flow days.",
        "Follow the directions on the package label.",
        "Stop using it and call your healthcare provider if you get itching, rash, pain or swelling."
      ],
      "sourceUrl": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-pads-and-liners",
      "sourceLabel": "FDA: Menstrual Pads and Liners"
    },
    "scienceSources": [
      {
        "url": "https://synapse.koreamed.org/articles/1130139",
        "label": "Woo et al., Systematic Review on Sanitary Pads and Female Health, Ewha Medical Journal (2019)",
        "summary": "Chemicals such as VOCs and dioxins were found in pads mostly below safety margins, and evidence linking pad adhesives or fragrances to skin irritation was limited and mixed, with no clear cause and effect shown."
      }
    ]
  },
  "p-stayfree-ultra": {
    "whoItsFor": [
      "People with a regular flow who want an affordable thin pad",
      "Anyone who prefers external protection over tampons or cups",
      "People who also want a pad for discharge outside their period, which the FDA notes pads can absorb"
    ],
    "howToUse": {
      "intro": "Per FDA guidance for menstrual pads and liners:",
      "steps": [
        "Wash your hands before and after handling a pad.",
        "Change your pad every few hours, even if your flow is light.",
        "Change more often on heavy-flow days.",
        "Follow the directions on the package label.",
        "Stop using it and call your healthcare provider if you get itching, rash, pain or swelling."
      ],
      "sourceUrl": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-pads-and-liners",
      "sourceLabel": "FDA: Menstrual Pads and Liners"
    },
    "scienceSources": [
      {
        "url": "https://synapse.koreamed.org/articles/1130139",
        "label": "Woo et al., Systematic Review on Sanitary Pads and Female Health, Ewha Medical Journal (2019)",
        "summary": "Chemicals such as VOCs and dioxins were found in pads mostly below safety margins, and evidence linking pad adhesives or fragrances to skin irritation was limited and mixed, with no clear cause and effect shown."
      }
    ]
  },
  "p-seventh-gen-pad": {
    "whoItsFor": [
      "People who want a chlorine-free, fragrance-free disposable pad",
      "Those who have reacted to scented pads before: the FDA notes some people react to scents or other materials added to pads",
      "Shoppers who prefer plant-based materials where possible"
    ],
    "howToUse": {
      "intro": "Per FDA guidance for menstrual pads and liners:",
      "steps": [
        "Wash your hands before and after handling a pad.",
        "Change your pad every few hours, even if your flow is light.",
        "Change more often on heavy-flow days.",
        "Follow the directions on the package label.",
        "Stop using it and call your healthcare provider if you get itching, rash, pain or swelling."
      ],
      "sourceUrl": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-pads-and-liners",
      "sourceLabel": "FDA: Menstrual Pads and Liners"
    },
    "scienceSources": [
      {
        "url": "https://synapse.koreamed.org/articles/1130139",
        "label": "Woo et al., Systematic Review on Sanitary Pads and Female Health, Ewha Medical Journal (2019)",
        "summary": "Chemicals such as VOCs and dioxins were found in pads mostly below safety margins, and evidence linking pad adhesives or fragrances to skin irritation was limited and mixed, with no clear cause and effect shown."
      }
    ]
  },
  "p-u-kotex-pad": {
    "whoItsFor": [
      "Active people who want a flexible pad that moves with them",
      "Anyone who prefers external protection over tampons or cups",
      "People who want wings for a more secure hold on their underwear"
    ],
    "howToUse": {
      "intro": "Per FDA guidance for menstrual pads and liners:",
      "steps": [
        "Wash your hands before and after handling a pad.",
        "Change your pad every few hours, even if your flow is light.",
        "Change more often on heavy-flow days.",
        "Follow the directions on the package label.",
        "Stop using it and call your healthcare provider if you get itching, rash, pain or swelling."
      ],
      "sourceUrl": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-pads-and-liners",
      "sourceLabel": "FDA: Menstrual Pads and Liners"
    },
    "clinicalSources": [
      {
        "url": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-pads-and-liners",
        "label": "FDA: Menstrual Pads and Liners",
        "summary": "Pads are FDA-regulated devices; change them every few hours, and stop use and see a provider if you get itching, rash or swelling, since some people react to scents or other added materials."
      },
      {
        "url": "https://www.fda.gov/medical-devices/products-and-medical-procedures/menstrual-product-options-facts-and-safe-use",
        "label": "FDA: Menstrual Product Options, Facts, and Safe Use",
        "summary": "Pads absorb flow after it leaves the body and can also be used for other discharge, unlike tampons and cups, and wearing any product too long lets bacteria grow."
      }
    ],
    "clinicalNote": "The FDA regulates menstrual pads as medical devices. It advises changing pads every few hours, even on light days, and stopping use if you notice itching, rash or swelling."
  },
  "p-bodyform-pad": {
    "whoItsFor": [
      "People with a regular to heavy flow who want a soft, absorbent pad",
      "Anyone who prefers external protection over tampons or cups",
      "People who also want a pad for discharge outside their period, which the FDA notes pads can absorb"
    ],
    "howToUse": {
      "intro": "Per FDA guidance for menstrual pads and liners:",
      "steps": [
        "Wash your hands before and after handling a pad.",
        "Change your pad every few hours, even if your flow is light.",
        "Change more often on heavy-flow days.",
        "Follow the directions on the package label.",
        "Stop using it and call your healthcare provider if you get itching, rash, pain or swelling."
      ],
      "sourceUrl": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-pads-and-liners",
      "sourceLabel": "FDA: Menstrual Pads and Liners"
    },
    "scienceSources": [
      {
        "url": "https://synapse.koreamed.org/articles/1130139",
        "label": "Woo et al., Systematic Review on Sanitary Pads and Female Health, Ewha Medical Journal (2019)",
        "summary": "Chemicals such as VOCs and dioxins were found in pads mostly below safety margins, and evidence linking pad adhesives or fragrances to skin irritation was limited and mixed, with no clear cause and effect shown."
      }
    ]
  },
  "p-rael-overnight": {
    "whoItsFor": [
      "Heavy sleepers or anyone who leaks at night and wants an extra-long pad",
      "People who want an organic cotton, fragrance-free pad",
      "Those who have reacted to scented pads before: the FDA notes some people react to scents or other materials added to pads"
    ],
    "howToUse": {
      "intro": "Per FDA guidance for menstrual pads and liners:",
      "steps": [
        "Wash your hands before and after handling a pad.",
        "Change your pad every few hours, even if your flow is light.",
        "Change more often on heavy-flow days.",
        "Follow the directions on the package label.",
        "Stop using it and call your healthcare provider if you get itching, rash, pain or swelling."
      ],
      "sourceUrl": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-pads-and-liners",
      "sourceLabel": "FDA: Menstrual Pads and Liners"
    },
    "clinicalSources": [
      {
        "url": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-pads-and-liners",
        "label": "FDA: Menstrual Pads and Liners",
        "summary": "Pads are FDA-regulated devices; change them every few hours, and stop use and see a provider if you get itching, rash or swelling, since some people react to scents or other added materials."
      },
      {
        "url": "https://www.fda.gov/medical-devices/products-and-medical-procedures/menstrual-product-options-facts-and-safe-use",
        "label": "FDA: Menstrual Product Options, Facts, and Safe Use",
        "summary": "Pads absorb flow after it leaves the body and can also be used for other discharge, unlike tampons and cups, and wearing any product too long lets bacteria grow."
      }
    ],
    "clinicalNote": "The FDA regulates menstrual pads as medical devices and notes some people react to scents or other materials added to pads. If you get itching, rash or swelling, stop using the pad and check in with your provider."
  },
  "p-cora-overnight": {
    "whoItsFor": [
      "People who want overnight protection with an organic cotton topsheet",
      "Shoppers who want to pick their absorbency and pack size",
      "Not the pick if you want a pad made entirely of cotton: only the topsheet is organic cotton"
    ],
    "howToUse": {
      "intro": "Per FDA guidance for menstrual pads and liners:",
      "steps": [
        "Wash your hands before and after handling a pad.",
        "Change your pad every few hours, even if your flow is light.",
        "Change more often on heavy-flow days.",
        "Follow the directions on the package label.",
        "Stop using it and call your healthcare provider if you get itching, rash, pain or swelling."
      ],
      "sourceUrl": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-pads-and-liners",
      "sourceLabel": "FDA: Menstrual Pads and Liners"
    },
    "scienceSources": [
      {
        "url": "https://synapse.koreamed.org/articles/1130139",
        "label": "Woo et al., Systematic Review on Sanitary Pads and Female Health, Ewha Medical Journal (2019)",
        "summary": "Chemicals such as VOCs and dioxins were found in pads mostly below safety margins, and evidence linking pad adhesives or fragrances to skin irritation was limited and mixed, with no clear cause and effect shown."
      }
    ]
  },
  "p-carefree-liners": {
    "whoItsFor": [
      "People with light discharge who want daily backup",
      "Anyone using a tampon or cup who wants backup on heavier days",
      "Scent-sensitive users, who should pick the fragrance-free versions: the FDA notes some people react to scents added to pads"
    ],
    "howToUse": {
      "intro": "Per FDA guidance for menstrual pads and liners:",
      "steps": [
        "Wash your hands before and after handling a liner.",
        "Change your liner every few hours, even if your flow or discharge is light.",
        "Follow the directions on the package label.",
        "Stop using it and call your healthcare provider if you get itching, rash, pain or swelling."
      ],
      "sourceUrl": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-pads-and-liners",
      "sourceLabel": "FDA: Menstrual Pads and Liners"
    },
    "scienceSources": [
      {
        "url": "https://synapse.koreamed.org/articles/1130139",
        "label": "Woo et al., Systematic Review on Sanitary Pads and Female Health, Ewha Medical Journal (2019)",
        "summary": "Found limited, mixed evidence on pads and skin irritation, and the one included study on daily panty liner use found no significant change in vaginal flora."
      }
    ]
  },
  "p-always-liners": {
    "whoItsFor": [
      "Light days and spotting",
      "Backup with a tampon or cup",
      "People who want a thin liner for everyday discharge"
    ],
    "howToUse": {
      "intro": "Per FDA guidance for menstrual pads and liners:",
      "steps": [
        "Wash your hands before and after handling a liner.",
        "Change your liner every few hours, even if your flow or discharge is light.",
        "Follow the directions on the package label.",
        "Stop using it and call your healthcare provider if you get itching, rash, pain or swelling."
      ],
      "sourceUrl": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-pads-and-liners",
      "sourceLabel": "FDA: Menstrual Pads and Liners"
    },
    "scienceSources": [
      {
        "url": "https://synapse.koreamed.org/articles/1130139",
        "label": "Woo et al., Systematic Review on Sanitary Pads and Female Health, Ewha Medical Journal (2019)",
        "summary": "Found limited, mixed evidence on pads and skin irritation, and the one included study on daily panty liner use found no significant change in vaginal flora."
      }
    ]
  },
  "p-rael-liners": {
    "whoItsFor": [
      "People who want an organic cotton, fragrance-free liner for daily use or light days",
      "Backup with a tampon or cup",
      "Those who have reacted to scented liners before: the FDA notes some people react to scents or other materials added to pads"
    ],
    "howToUse": {
      "intro": "Per FDA guidance for menstrual pads and liners:",
      "steps": [
        "Wash your hands before and after handling a liner.",
        "Change your liner every few hours, even if your flow or discharge is light.",
        "Follow the directions on the package label.",
        "Stop using it and call your healthcare provider if you get itching, rash, pain or swelling."
      ],
      "sourceUrl": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-pads-and-liners",
      "sourceLabel": "FDA: Menstrual Pads and Liners"
    },
    "scienceSources": [
      {
        "url": "https://synapse.koreamed.org/articles/1130139",
        "label": "Woo et al., Systematic Review on Sanitary Pads and Female Health, Ewha Medical Journal (2019)",
        "summary": "Found limited, mixed evidence on pads and skin irritation, and the one included study on daily panty liner use found no significant change in vaginal flora."
      }
    ]
  },
  "p-playtex-sport": {
    "whoItsFor": [
      "Active people and athletes who want a flexible applicator tampon",
      "People who want expandable leak protection during workouts or sports",
      "Anyone comfortable with a plastic applicator"
    ],
    "howToUse": {
      "intro": "Per Playtex's TSS guidance and FDA tampon guidance:",
      "steps": [
        "Wash your hands before and after inserting or removing a tampon.",
        "Use the lowest absorbency that controls your flow.",
        "Change every 4 to 8 hours, even if your flow is light, and never wear one longer than 8 hours.",
        "Alternate tampons with pads to lower your TSS risk.",
        "Use tampons only during your period.",
        "If you get a sudden high fever, vomiting, diarrhea, dizziness or a sunburn-like rash, remove the tampon and get medical care right away."
      ],
      "sourceUrl": "https://www.playtextampons.com/faqs/tss-information",
      "sourceLabel": "Playtex: TSS Information"
    },
    "scienceSources": [
      {
        "url": "https://stacks.cdc.gov/view/cdc/3270/cdc_3270_DS1.pdf",
        "label": "Hajjeh et al., Toxic Shock Syndrome in the United States: Surveillance Update, 1979 to 1996, Emerging Infectious Diseases (CDC, 1999)",
        "summary": "Menstrual TSS cases fell after tampon absorbency dropped and FDA labeling was required, and using only tampons carried higher risk than mixing tampons with pads."
      },
      {
        "url": "https://iro.uiowa.edu/esploro/outputs/journalArticle/Device-Associated-Menstrual-Toxic-Shock-Syndrome/9984066349902771",
        "label": "Schlievert and Davis, Device-Associated Menstrual Toxic Shock Syndrome, Clinical Microbiology Reviews (2020)",
        "summary": "Explains that menstrual TSS is driven by the TSST-1 toxin, that tampon warning labels and absorbency standards came from this research, and that cases still occur."
      }
    ]
  },
  "p-kotex-tampon": {
    "whoItsFor": [
      "People who want a compact applicator that fits in a pocket or small bag",
      "Anyone who wants internal protection that's discreet to carry",
      "Tampon users who want a simple, easy applicator"
    ],
    "howToUse": {
      "intro": "Per FDA tampon guidance:",
      "steps": [
        "Wash your hands before and after inserting or removing a tampon.",
        "Use the lowest absorbency that controls your flow.",
        "Change every 4 to 8 hours, even if your flow is light, and never wear one longer than 8 hours.",
        "Use tampons only during your period.",
        "If you get a sudden high fever, vomiting, diarrhea, dizziness or a sunburn-like rash, remove the tampon and get medical care right away."
      ],
      "sourceUrl": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/tampons",
      "sourceLabel": "FDA: Tampons"
    },
    "scienceSources": [
      {
        "url": "https://stacks.cdc.gov/view/cdc/3270/cdc_3270_DS1.pdf",
        "label": "Hajjeh et al., Toxic Shock Syndrome in the United States: Surveillance Update, 1979 to 1996, Emerging Infectious Diseases (CDC, 1999)",
        "summary": "Menstrual TSS cases fell after tampon absorbency dropped and FDA labeling was required, and using only tampons carried higher risk than mixing tampons with pads."
      },
      {
        "url": "https://iro.uiowa.edu/esploro/outputs/journalArticle/Device-Associated-Menstrual-Toxic-Shock-Syndrome/9984066349902771",
        "label": "Schlievert and Davis, Device-Associated Menstrual Toxic Shock Syndrome, Clinical Microbiology Reviews (2020)",
        "summary": "Explains that menstrual TSS is driven by the TSST-1 toxin, that tampon warning labels and absorbency standards came from this research, and that cases still occur."
      }
    ]
  },
  "p-ob-tampon": {
    "whoItsFor": [
      "People who want less waste and no applicator",
      "Those who like the control of inserting with a finger",
      "Anyone who wants a very compact tampon to carry"
    ],
    "howToUse": {
      "intro": "Per o.b.'s TSS guidance and FDA tampon guidance:",
      "steps": [
        "Wash your hands before and after inserting or removing a tampon.",
        "Use the lowest absorbency that controls your flow.",
        "Change every 4 to 8 hours, even if your flow is light, and never wear one longer than 8 hours.",
        "Alternate tampons with pads to lower your TSS risk.",
        "Use tampons only during your period.",
        "If you get a sudden high fever, vomiting, diarrhea, dizziness or a sunburn-like rash, remove the tampon and get medical care right away."
      ],
      "sourceUrl": "https://ob-tampons.com/what-is-toxic-shock-syndrome",
      "sourceLabel": "o.b.: What is Toxic Shock Syndrome"
    },
    "scienceSources": [
      {
        "url": "https://stacks.cdc.gov/view/cdc/3270/cdc_3270_DS1.pdf",
        "label": "Hajjeh et al., Toxic Shock Syndrome in the United States: Surveillance Update, 1979 to 1996, Emerging Infectious Diseases (CDC, 1999)",
        "summary": "Menstrual TSS cases fell after tampon absorbency dropped and FDA labeling was required, and using only tampons carried higher risk than mixing tampons with pads."
      },
      {
        "url": "https://iro.uiowa.edu/esploro/outputs/journalArticle/Device-Associated-Menstrual-Toxic-Shock-Syndrome/9984066349902771",
        "label": "Schlievert and Davis, Device-Associated Menstrual Toxic Shock Syndrome, Clinical Microbiology Reviews (2020)",
        "summary": "Explains that menstrual TSS is driven by the TSST-1 toxin, that tampon warning labels and absorbency standards came from this research, and that cases still occur."
      }
    ]
  },
  "p-tampax-radiant": {
    "whoItsFor": [
      "People who want a smooth plastic applicator",
      "Those who want extra leak protection from a braid design",
      "Anyone who wants a widely available, well-known tampon brand"
    ],
    "howToUse": {
      "intro": "Per FDA tampon guidance:",
      "steps": [
        "Wash your hands before and after inserting or removing a tampon.",
        "Use the lowest absorbency that controls your flow.",
        "Change every 4 to 8 hours, even if your flow is light, and never wear one longer than 8 hours.",
        "Use tampons only during your period.",
        "If you get a sudden high fever, vomiting, diarrhea, dizziness or a sunburn-like rash, remove the tampon and get medical care right away."
      ],
      "sourceUrl": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/tampons",
      "sourceLabel": "FDA: Tampons"
    },
    "scienceSources": [
      {
        "url": "https://stacks.cdc.gov/view/cdc/3270/cdc_3270_DS1.pdf",
        "label": "Hajjeh et al., Toxic Shock Syndrome in the United States: Surveillance Update, 1979 to 1996, Emerging Infectious Diseases (CDC, 1999)",
        "summary": "Menstrual TSS cases fell after tampon absorbency dropped and FDA labeling was required, and using only tampons carried higher risk than mixing tampons with pads."
      },
      {
        "url": "https://iro.uiowa.edu/esploro/outputs/journalArticle/Device-Associated-Menstrual-Toxic-Shock-Syndrome/9984066349902771",
        "label": "Schlievert and Davis, Device-Associated Menstrual Toxic Shock Syndrome, Clinical Microbiology Reviews (2020)",
        "summary": "Explains that menstrual TSS is driven by the TSST-1 toxin, that tampon warning labels and absorbency standards came from this research, and that cases still occur."
      }
    ]
  },
  "p-seventh-gen-tampon": {
    "whoItsFor": [
      "People who want a 100% organic cotton, chlorine-free tampon",
      "Those who prefer a cardboard applicator over plastic",
      "Not a guarantee of fewer metals: a 2024 study of 30 tampons found organic ones had more arsenic but less lead than non-organic ones, and whether these metals reach the body is still unknown"
    ],
    "scienceSources": [
      {
        "url": "https://factor.niehs.nih.gov/2024/8/feature/3-feature-metals-in-tampons",
        "label": "NIEHS (NIH): Metals detected in tampons (Shearston et al., Environment International, 2024)",
        "summary": "Testing of 30 tampons from 14 brands found measurable metals in all of them; lead was higher in non-organic tampons and arsenic higher in organic ones, and whether any metals leave the tampon or reach the body is not yet known."
      }
    ]
  },
  "p-rael-tampon": {
    "whoItsFor": [
      "People who want organic cotton tampons with a BPA-free applicator",
      "Those with sensitive skin who want full ingredient transparency",
      "Shoppers who like having a subscription option",
      "Not a guarantee of fewer metals: a 2024 study of 30 tampons found organic ones had more arsenic but less lead than non-organic ones, and whether these metals reach the body is still unknown"
    ],
    "scienceSources": [
      {
        "url": "https://factor.niehs.nih.gov/2024/8/feature/3-feature-metals-in-tampons",
        "label": "NIEHS (NIH): Metals detected in tampons (Shearston et al., Environment International, 2024)",
        "summary": "Testing of 30 tampons from 14 brands found measurable metals in all of them; lead was higher in non-organic tampons and arsenic higher in organic ones, and whether any metals leave the tampon or reach the body is not yet known."
      }
    ]
  },
  "p-lena-cup": {
    "whoItsFor": [
      "First-time cup users, especially with the softer Sensitive version",
      "People who prefer a firmer feel, who can choose the Original",
      "Anyone who wants one reusable product instead of buying tampons or pads every cycle"
    ]
  },
  "p-ruby-cup": {
    "whoItsFor": [
      "People who want a reusable medical-grade silicone cup",
      "Shoppers who care about social impact: for every cup sold, one is donated to someone without access to period products",
      "Anyone looking to cut down on disposable period waste"
    ]
  },
  "p-organicup": {
    "whoItsFor": [
      "Teens and first-time cup users, who can start with the Mini",
      "People with a low cervix, who may find the Mini fits better",
      "Anyone who wants a soft silicone cup with several sizes to choose from"
    ]
  },
  "p-femmycycle": {
    "whoItsFor": [
      "People who find cup stems uncomfortable or hard to grip",
      "Those with a high cervix who want a ring pull to reach for",
      "Anyone who wants a reusable silicone cup with a stemless design"
    ]
  },
  "p-flex-cup": {
    "whoItsFor": [
      "First-time cup users who are nervous about removal",
      "Anyone who has struggled to break the seal on a traditional cup",
      "People who want a reusable medical-grade silicone option"
    ]
  },
  "p-ziggy-disc": {
    "whoItsFor": [
      "People with heavy flow: in a 2023 lab study using red blood cells, the Ziggy disc held about 80 mL, the most of any product tested",
      "Those who want a reusable disc that can be worn during intimacy",
      "People who would rather skip sizing decisions, since it comes in one size"
    ],
    "scienceSources": [
      {
        "url": "https://srh.bmj.com/content/50/1/21",
        "label": "DeLoughery et al., BMJ Sexual & Reproductive Health (2024): red blood cell capacity of menstrual products",
        "summary": "In lab testing with red blood cells, discs held the most of any product type (about 61 mL on average), and the Ziggy disc held the most of all products tested, about 80 mL."
      }
    ]
  },
  "p-lumma-disc": {
    "whoItsFor": [
      "People who want to choose a disc size (S, M or L) for a better fit",
      "Those who find disc removal tricky and want a string option",
      "People with heavier flow: in a 2023 lab study, menstrual discs held the most of any product type, about 61 mL on average"
    ],
    "scienceSources": [
      {
        "url": "https://srh.bmj.com/content/50/1/21",
        "label": "DeLoughery et al., BMJ Sexual & Reproductive Health (2024): red blood cell capacity of menstrual products",
        "summary": "In lab testing with red blood cells, menstrual discs held the most of any product type, about 61 mL on average, versus roughly 20 to 50 mL for tampons, cups and heavy pads."
      }
    ]
  },
  "p-softdisc": {
    "whoItsFor": [
      "People curious about discs who want to try one before buying a reusable",
      "Those who want up to 12 hours of wear",
      "Not the pick if cutting waste is your goal: it's single-use"
    ]
  },
  "p-period-nirvana-disc": {
    "whoItsFor": [
      "People who want a disc designed with input from period educator Kim Rosas",
      "Those who want two sizes to choose from and a notch for removal",
      "People with heavier flow: in a 2023 lab study, menstrual discs held the most of any product type, about 61 mL on average"
    ],
    "scienceSources": [
      {
        "url": "https://srh.bmj.com/content/50/1/21",
        "label": "DeLoughery et al., BMJ Sexual & Reproductive Health (2024): red blood cell capacity of menstrual products",
        "summary": "In lab testing with red blood cells, menstrual discs held the most of any product type, about 61 mL on average, versus roughly 20 to 50 mL for tampons, cups and heavy pads."
      }
    ]
  },
  "p-aisle-underwear": {
    "whoItsFor": [
      "People who want to adjust absorbency by swapping inserts instead of buying separate pairs",
      "Those looking for PFAS-free period underwear in inclusive sizing",
      "Anyone who prefers organic cotton against their skin"
    ]
  },
  "p-period-co-underwear": {
    "whoItsFor": [
      "People who want organic cotton period underwear at a lower price per pair",
      "Those new to period underwear who want to try it without spending much",
      "People with heavy flows who want backup alongside a tampon, cup or disc",
      "Not the pick as your only protection on your heaviest days: in a 2023 lab study using red blood cells, super-absorbency period underwear held about 2 mL on average, far less than tampons, cups or discs"
    ],
    "scienceSources": [
      {
        "url": "https://srh.bmj.com/content/50/1/21",
        "label": "DeLoughery et al., BMJ Sexual & Reproductive Health (2024): red blood cell capacity of menstrual products",
        "summary": "In lab testing with red blood cells, super-absorbency period underwear held about 2 mL on average, far less than tampons, cups, discs or heavy pads, so it works best as backup or for lighter flow."
      }
    ]
  },
  "p-wuka-underwear": {
    "whoItsFor": [
      "Active people who want sport styles of period underwear",
      "Those who want PFAS-free, organic cotton options",
      "Shoppers who care about a carbon neutral brand",
      "Not the pick as your only protection on your heaviest days: in a 2023 lab study using red blood cells, super-absorbency period underwear held about 2 mL on average, far less than tampons, cups or discs"
    ],
    "scienceSources": [
      {
        "url": "https://srh.bmj.com/content/50/1/21",
        "label": "DeLoughery et al., BMJ Sexual & Reproductive Health (2024): red blood cell capacity of menstrual products",
        "summary": "In lab testing with red blood cells, super-absorbency period underwear held about 2 mL on average, far less than tampons, cups, discs or heavy pads, so it works best as backup or for lighter flow."
      }
    ]
  },
  "p-tomboyx-period": {
    "whoItsFor": [
      "Anyone who wants gender-neutral period underwear",
      "People who need a wide range of sizes and styles",
      "Those who want a cotton pair with an absorbent gusset for lighter days or backup",
      "Not the pick as your only protection on your heaviest days: in a 2023 lab study using red blood cells, super-absorbency period underwear held about 2 mL on average, far less than tampons, cups or discs"
    ],
    "scienceSources": [
      {
        "url": "https://srh.bmj.com/content/50/1/21",
        "label": "DeLoughery et al., BMJ Sexual & Reproductive Health (2024): red blood cell capacity of menstrual products",
        "summary": "In lab testing with red blood cells, super-absorbency period underwear held about 2 mL on average, far less than tampons, cups, discs or heavy pads, so it works best as backup or for lighter flow."
      }
    ]
  },
  "p-dear-kate-underwear": {
    "whoItsFor": [
      "People who want period underwear that looks like regular lingerie, including lace styles",
      "Those who want athletic styles for workouts",
      "Shoppers looking for PFAS-free absorbent layers",
      "Not the pick as your only protection on your heaviest days: in a 2023 lab study using red blood cells, super-absorbency period underwear held about 2 mL on average, far less than tampons, cups or discs"
    ],
    "scienceSources": [
      {
        "url": "https://srh.bmj.com/content/50/1/21",
        "label": "DeLoughery et al., BMJ Sexual & Reproductive Health (2024): red blood cell capacity of menstrual products",
        "summary": "In lab testing with red blood cells, super-absorbency period underwear held about 2 mL on average, far less than tampons, cups, discs or heavy pads, so it works best as backup or for lighter flow."
      }
    ]
  },
  "p-proof-period": {
    "whoItsFor": [
      "People who want one pair for both periods and light bladder leaks",
      "Those who want to pick from several absorbency levels",
      "Shoppers looking for PFAS-free absorbent layers",
      "Not the pick as your only protection on your heaviest days: in a 2023 lab study using red blood cells, super-absorbency period underwear held about 2 mL on average, far less than tampons, cups or discs"
    ],
    "scienceSources": [
      {
        "url": "https://srh.bmj.com/content/50/1/21",
        "label": "DeLoughery et al., BMJ Sexual & Reproductive Health (2024): red blood cell capacity of menstrual products",
        "summary": "In lab testing with red blood cells, super-absorbency period underwear held about 2 mL on average, far less than tampons, cups, discs or heavy pads, so it works best as backup or for lighter flow."
      }
    ]
  },
  "p-hanes-period": {
    "whoItsFor": [
      "People on a budget who want to try period underwear",
      "Those with light to moderate flow, or who want backup for a tampon or cup",
      "Not the pick as your only protection on your heaviest days: in a 2023 lab study using red blood cells, super-absorbency period underwear held about 2 mL on average, far less than tampons, cups or discs"
    ],
    "scienceSources": [
      {
        "url": "https://srh.bmj.com/content/50/1/21",
        "label": "DeLoughery et al., BMJ Sexual & Reproductive Health (2024): red blood cell capacity of menstrual products",
        "summary": "In lab testing with red blood cells, super-absorbency period underwear held about 2 mL on average, far less than tampons, cups, discs or heavy pads, so it works best as backup or for lighter flow."
      }
    ]
  },
  "p-neycher-vaginal-moisturizer": {
    "clinicalSources": [
      {
        "url": "https://www.isswsh.org/images/content/2020-NAMS-GSM-Paper.pdf",
        "label": "The 2020 genitourinary syndrome of menopause position statement of The North American Menopause Society (Menopause, 2020)",
        "summary": "Names nonhormone lubricants and regularly used vaginal moisturizers as first-line therapy for menopausal dryness, and finds no evidence yet that hyaluronic acid products work better than other moisturizers."
      },
      {
        "url": "https://menopause.org/wp-content/uploads/for-women/MenoNote-GSM.pdf",
        "label": "The Menopause Society: MenoNote on genitourinary syndrome of menopause",
        "summary": "The Menopause Society's patient handout says vaginal moisturizers are used regularly, often several times a week, and that oil-based products may damage condoms and raise infection risk."
      }
    ]
  },
  "p-neycher-odor-be-gone": {
    "clinicalSources": [
      {
        "url": "https://www.cdc.gov/std/treatment-guidelines/candidiasis.htm",
        "label": "CDC STI Treatment Guidelines: Vulvovaginal candidiasis",
        "summary": "CDC lists vaginal boric acid 600 mg daily for 3 weeks for recurrent non-albicans yeast infections, and warns that self-diagnosis is unreliable and unneeded over-the-counter use can delay treatment of other causes."
      },
      {
        "url": "https://www.cdc.gov/std/treatment-guidelines/bv.htm",
        "label": "CDC STI Treatment Guidelines: Bacterial vaginosis",
        "summary": "For women with repeated BV recurrences, CDC lists vaginal boric acid 600 mg daily for 21 days after an oral antibiotic course, while noting the data are limited."
      },
      {
        "url": "https://medlineplus.gov/ency/article/002485.htm",
        "label": "MedlinePlus: Boric acid poisoning",
        "summary": "Explains that boric acid is a poison when swallowed, which is why boric acid suppositories must never be taken by mouth."
      }
    ]
  },
  "p-neycher-hydrobloom-gel": {
    "clinicalSources": [
      {
        "url": "https://www.isswsh.org/images/content/2020-NAMS-GSM-Paper.pdf",
        "label": "The 2020 genitourinary syndrome of menopause position statement of The North American Menopause Society (Menopause, 2020)",
        "summary": "Recommends lubricants and regular moisturizers as first-line care for menopausal dryness, suggests a 24-hour skin patch test before using a new product internally, and notes many water-based products are hyperosmolar, which can irritate."
      },
      {
        "url": "https://menopause.org/wp-content/uploads/for-women/MenoNote-GSM.pdf",
        "label": "The Menopause Society: MenoNote on genitourinary syndrome of menopause",
        "summary": "The Menopause Society's patient handout says moisturizers are used regularly, often several times a week, and that warming agents and some solvents and preservatives may irritate."
      }
    ]
  },
  "p-good-kitty-uti-biome-shield": {
    "whoItsFor": [
      "People who get recurrent UTIs and want a daily, non-antibiotic prevention routine",
      "Those whose UTIs tend to follow sex, since the brand gives a separate pre-sex dose",
      "People in perimenopause or menopause, when falling estrogen raises UTI risk",
      "Not the pick for a UTI you have right now: the brand says it's for prevention only, and an active infection needs antibiotics"
    ],
    "howToUse": {
      "intro": "Per Good Kitty's instructions:",
      "steps": [
        "Take 1 capsule every day.",
        "Before sex, take 2 capsules with water up to 1 hour beforehand, then drink a full glass of water afterward.",
        "Go back to your usual 1 capsule the next day.",
        "Take it with food if you have a sensitive stomach.",
        "If you're on antibiotics, take it 2 hours before or after your antibiotic dose.",
        "Use it consistently for 3 to 6 months to judge whether it's helping."
      ],
      "sourceUrl": "https://goodkittyco.com/products/uti-biome-shield",
      "sourceLabel": "Good Kitty Co: UTI Biome Shield product page"
    },
    "clinicalSources": [
      {
        "url": "https://www.mayoclinic.org/diseases-conditions/urinary-tract-infection/symptoms-causes/syc-20353447",
        "label": "Mayo Clinic: Urinary tract infection, symptoms and causes",
        "summary": "Mayo Clinic suggests cranberry products for UTI prevention only if your healthcare team says it's OK, along with drinking plenty of water, and notes falling estrogen in perimenopause and menopause raises UTI risk."
      },
      {
        "url": "https://swiss.cochrane.org/news/can-cranberries-help-prevent-urinary-tract-infections",
        "label": "Cochrane: Can cranberries help prevent urinary tract infections?",
        "summary": "An updated Cochrane review of 50 studies (8,857 people) found cranberry products reduce UTIs in women with recurrent UTIs, while evidence in pregnant women and older nursing home residents was inconclusive."
      },
      {
        "url": "https://urology.wisc.edu/wp-content/uploads/2024/05/D-Mannose-for-Prevention-of-Recurrent-Urinary-Tract-Infection-Among-Women.pdf",
        "label": "Hayward et al., D-Mannose for Prevention of Recurrent UTI Among Women, JAMA Internal Medicine, 2024",
        "summary": "In a trial of 598 women with recurrent UTIs, 2 g of D-mannose daily did not reduce repeat UTIs compared with placebo, and the authors advise against recommending it for prevention."
      }
    ],
    "communityReview": "Reviews on Good Kitty's own site are overwhelmingly positive. Reviewers most often say they've had fewer or no UTIs since starting, and praise the easy daily routine, the packaging and the customer service. We couldn't find independent reviews or critical feedback outside the brand's site, so this is a one-sided picture.",
    "communityReviewSources": [
      {
        "url": "https://goodkittyco.com/products/uti-biome-shield",
        "label": "Good Kitty Co: customer reviews on the UTI Biome Shield product page"
      }
    ]
  },
  "p-oboo-woosh-warming-wand": {
    "whoItsFor": [
      "Midlife women dealing with dryness or tension who want warmth to help them relax before stimulation",
      "Anyone easing back into sex after a break who wants a low-pressure start",
      "People who want one tool for both internal (G-spot) and external use",
      "Not the pick if you only want strong external buzz or a small travel toy"
    ],
    "howToUse": {
      "intro": "Per Oboo's instructions:",
      "steps": [
        "Hold the power button to turn it on.",
        "Turn on the warming setting from the controls.",
        "Choose one of the five vibration speeds.",
        "Use it internally, externally or both, moving slowly.",
        "Add a water-based lube if you want more glide.",
        "Wash with warm water and mild soap before and after use."
      ],
      "sourceUrl": "https://oboo.love/products/woosh",
      "sourceLabel": "Oboo: Woosh Warming Wand product page"
    }
  },
  "p-oboo-nook": {
    "whoItsFor": [
      "Couples who want strong clitoral stimulation during intercourse, since it's shaped to stay in place between partners",
      "Solo users who like precise, pinpoint sensation, with a softer curved side for broader feel",
      "People who want a waterproof toy for the bath or shower",
      "Not the pick for deep internal stimulation"
    ],
    "howToUse": {
      "intro": "Per Oboo's instructions:",
      "steps": [
        "Hold the power button for 2 seconds to turn it on, since a quick tap won't.",
        "Tap to cycle through the 10 modes, starting on the lowest.",
        "Use the tip for pinpoint sensation, or turn it around and use the curve for softer, broader feel.",
        "Add a water-based lube for glide if you like.",
        "Hold the power button for 2 seconds to turn it off, then wash with warm water and mild soap."
      ],
      "sourceUrl": "https://oboo.love/products/nook",
      "sourceLabel": "Oboo: Nook Massager product page"
    },
    "clinicalSources": [
      {
        "url": "https://www.mayoclinic.org/diseases-conditions/female-sexual-dysfunction/diagnosis-treatment/drc-20372556",
        "label": "Mayo Clinic: Female sexual dysfunction, diagnosis and treatment",
        "summary": "Mayo Clinic lists devices such as vibrators as a nonmedical option that can help with orgasm by increasing blood flow to the clitoris."
      },
      {
        "url": "https://issm.info/sexual-health-qa/what-are-the-benefits-of-vibrators-for-sexual-health",
        "label": "International Society for Sexual Medicine: What are the benefits of vibrators for sexual health?",
        "summary": "ISSM says early research links vibrator use with better desire, arousal, satisfaction and pelvic floor tone, but notes the number of studies is still limited."
      },
      {
        "url": "https://menopause.org/wp-content/uploads/for-women/MenoNote-GSM.pdf",
        "label": "The Menopause Society: MenoNote on genitourinary syndrome of menopause",
        "summary": "The Menopause Society notes that sexual stimulation, alone, with a partner or with a device such as a vibrator, may support vaginal blood flow and natural moisture after menopause."
      }
    ]
  },
  "p-oboo-smooch": {
    "whoItsFor": [
      "People who prefer suction-style stimulation over a buzzing vibration",
      "Anyone who wants strong, focused clitoral sensation from a compact toy",
      "Shower users, since Oboo says it's waterproof",
      "Not the pick if you want something very gentle or beginner-soft: Oboo's own FAQ says it isn't especially mild, and it isn't for internal use"
    ],
    "howToUse": {
      "intro": "Per Oboo's instructions:",
      "steps": [
        "Press and hold the power button to turn it on, then cycle through the intensity levels.",
        "Place the opening close to or directly over the clitoris.",
        "Adjust the angle, distance or pressure until it feels right.",
        "Add a water-based lube for extra glide if you like.",
        "Clean with warm water and mild soap after use."
      ],
      "sourceUrl": "https://oboo.love/products/smooch",
      "sourceLabel": "Oboo: Smooch Sonic Stimulator product page"
    },
    "clinicalSources": [
      {
        "url": "https://www.mayoclinic.org/diseases-conditions/female-sexual-dysfunction/diagnosis-treatment/drc-20372556",
        "label": "Mayo Clinic: Female sexual dysfunction, diagnosis and treatment",
        "summary": "Mayo Clinic lists devices such as vibrators as a nonmedical option that can help with orgasm by increasing blood flow to the clitoris."
      },
      {
        "url": "https://issm.info/sexual-health-qa/what-are-the-benefits-of-vibrators-for-sexual-health",
        "label": "International Society for Sexual Medicine: What are the benefits of vibrators for sexual health?",
        "summary": "ISSM says early research links vibrator use with better desire, arousal, satisfaction and pelvic floor tone, but notes the number of studies is still limited."
      },
      {
        "url": "https://menopause.org/wp-content/uploads/for-women/MenoNote-GSM.pdf",
        "label": "The Menopause Society: MenoNote on genitourinary syndrome of menopause",
        "summary": "The Menopause Society notes that sexual stimulation, alone, with a partner or with a device such as a vibrator, may support vaginal blood flow and natural moisture after menopause."
      }
    ]
  },
  "p-oboo-woo": {
    "whoItsFor": [
      "Beginners who want a simple, low-cost first vibrator for external use",
      "Travelers who want something small and easy to pack",
      "People who like quick sessions, solo or with a partner",
      "Not the pick for internal stimulation"
    ],
    "howToUse": {
      "intro": "Per Oboo's instructions:",
      "steps": [
        "Hold the power button to turn it on, then tap it to cycle through the vibration patterns.",
        "Use it externally on the clitoris, vulva, nipples or anywhere else that feels good.",
        "Add a water-based lube for extra glide if you like.",
        "Use it in the bath or shower if you want, since Oboo says it's fully waterproof.",
        "Wash with warm water and mild soap after use."
      ],
      "sourceUrl": "https://oboo.love/products/woo",
      "sourceLabel": "Oboo: Woo Bullet product page"
    },
    "clinicalSources": [
      {
        "url": "https://www.mayoclinic.org/diseases-conditions/female-sexual-dysfunction/diagnosis-treatment/drc-20372556",
        "label": "Mayo Clinic: Female sexual dysfunction, diagnosis and treatment",
        "summary": "Mayo Clinic lists devices such as vibrators as a nonmedical option that can help with orgasm by increasing blood flow to the clitoris."
      },
      {
        "url": "https://issm.info/sexual-health-qa/what-are-the-benefits-of-vibrators-for-sexual-health",
        "label": "International Society for Sexual Medicine: What are the benefits of vibrators for sexual health?",
        "summary": "ISSM says early research links vibrator use with better desire, arousal, satisfaction and pelvic floor tone, but notes the number of studies is still limited."
      },
      {
        "url": "https://menopause.org/wp-content/uploads/for-women/MenoNote-GSM.pdf",
        "label": "The Menopause Society: MenoNote on genitourinary syndrome of menopause",
        "summary": "The Menopause Society notes that sexual stimulation, alone, with a partner or with a device such as a vibrator, may support vaginal blood flow and natural moisture after menopause."
      }
    ]
  },
  "p-oboo-shoop": {
    "whoItsFor": [
      "Women easing back into pleasure after a pause who want something approachable",
      "People with sensitivity who prefer gentle external or shallow internal use",
      "Anyone curious about G-spot stimulation for the first time",
      "Not the pick if you want a larger toy or more intense sensation"
    ],
    "howToUse": {
      "intro": "Per Oboo's instructions:",
      "steps": [
        "Press and hold the power button, then tap to cycle through the 10 vibration modes.",
        "Use the slim end internally for G-spot stimulation, the curved end externally on the clitoris and vulva, or both at once.",
        "Start gently and go slowly, letting your body set the pace.",
        "Add a water-based lube for extra glide.",
        "Clean with warm water and mild soap."
      ],
      "sourceUrl": "https://oboo.love/products/shoop",
      "sourceLabel": "Oboo: Shoop Gentle Dual Massager product page"
    },
    "clinicalSources": [
      {
        "url": "https://www.mayoclinic.org/diseases-conditions/female-sexual-dysfunction/diagnosis-treatment/drc-20372556",
        "label": "Mayo Clinic: Female sexual dysfunction, diagnosis and treatment",
        "summary": "Mayo Clinic lists devices such as vibrators as a nonmedical option that can help with orgasm by increasing blood flow to the clitoris."
      },
      {
        "url": "https://issm.info/sexual-health-qa/what-are-the-benefits-of-vibrators-for-sexual-health",
        "label": "International Society for Sexual Medicine: What are the benefits of vibrators for sexual health?",
        "summary": "ISSM says early research links vibrator use with better desire, arousal, satisfaction and pelvic floor tone, but notes the number of studies is still limited."
      },
      {
        "url": "https://menopause.org/wp-content/uploads/for-women/MenoNote-GSM.pdf",
        "label": "The Menopause Society: MenoNote on genitourinary syndrome of menopause",
        "summary": "The Menopause Society notes that sexual stimulation, alone, with a partner or with a device such as a vibrator, may support vaginal blood flow and natural moisture after menopause."
      }
    ]
  },
  "p-oboo-moon": {
    "whoItsFor": [
      "Beginners curious about anal play who want a slow, step-by-step start",
      "People who want more control, moving up a size only when they feel ready",
      "Those who'd like optional vibration on the largest plug, by button or remote",
      "Not the pick if you want advanced anal toys right away"
    ],
    "howToUse": {
      "intro": "Per Oboo's instructions:",
      "steps": [
        "Apply plenty of water-based lube before each use.",
        "Start with the smallest plug, breathe and go slowly.",
        "Move up a size only when your body feels ready, and keep early sessions to 10 to 15 minutes.",
        "Use the 7 vibration modes on the largest plug with its button or the remote, if you like.",
        "Wash all plugs with warm soapy water or toy cleaner before and after use, then store them in the pouch."
      ],
      "sourceUrl": "https://oboo.love/products/moon",
      "sourceLabel": "Oboo: Moon Anal Training Kit product page"
    }
  },
  "p-oboo-oooh": {
    "whoItsFor": [
      "First-time toy buyers who want something simple and external",
      "People who want a quiet, discreet, palm-sized toy",
      "Couples looking for an easy add-on that fits between partners",
      "Not the pick for internal stimulation or if you'd rather have a larger toy with a handle"
    ],
    "howToUse": {
      "intro": "Per Oboo's instructions:",
      "steps": [
        "Press and hold the power button, then tap to cycle through the 10 patterns.",
        "Cup it in your palm so the flexible tip rests where you want it.",
        "Start with light contact and add pressure as you build, or hold the tip just above the skin on sensitive days.",
        "Add a drop of water-based lube if you like.",
        "Clean with warm water and mild soap."
      ],
      "sourceUrl": "https://oboo.love/products/oooh",
      "sourceLabel": "Oboo: Oooh Palm Massager product page"
    },
    "clinicalSources": [
      {
        "url": "https://www.mayoclinic.org/diseases-conditions/female-sexual-dysfunction/diagnosis-treatment/drc-20372556",
        "label": "Mayo Clinic: Female sexual dysfunction, diagnosis and treatment",
        "summary": "Mayo Clinic lists devices such as vibrators as a nonmedical option that can help with orgasm by increasing blood flow to the clitoris."
      },
      {
        "url": "https://issm.info/sexual-health-qa/what-are-the-benefits-of-vibrators-for-sexual-health",
        "label": "International Society for Sexual Medicine: What are the benefits of vibrators for sexual health?",
        "summary": "ISSM says early research links vibrator use with better desire, arousal, satisfaction and pelvic floor tone, but notes the number of studies is still limited."
      },
      {
        "url": "https://menopause.org/wp-content/uploads/for-women/MenoNote-GSM.pdf",
        "label": "The Menopause Society: MenoNote on genitourinary syndrome of menopause",
        "summary": "The Menopause Society notes that sexual stimulation, alone, with a partner or with a device such as a vibrator, may support vaginal blood flow and natural moisture after menopause."
      }
    ]
  },
  "p-oboo-groove": {
    "whoItsFor": [
      "Women who want blended internal and external stimulation from one toy",
      "Beginners and anyone rediscovering sensation solo who likes having options",
      "People who want to run one motor or both, at their own pace",
      "Not the pick if you only want simple external sensation or a tiny travel toy"
    ],
    "howToUse": {
      "intro": "Per Oboo's instructions:",
      "steps": [
        "Hold the power button to start, then run the internal motor, the external motor or both.",
        "Bend the flexible neck to find an angle that works for you.",
        "Start with external stimulation, then add internal once you're warmed up.",
        "Use a water-based lube.",
        "Wash with warm soapy water before and after use, and store it in its pouch."
      ],
      "sourceUrl": "https://oboo.love/products/groove",
      "sourceLabel": "Oboo: Groove Dual-Action Massager product page"
    },
    "clinicalSources": [
      {
        "url": "https://www.mayoclinic.org/diseases-conditions/female-sexual-dysfunction/diagnosis-treatment/drc-20372556",
        "label": "Mayo Clinic: Female sexual dysfunction, diagnosis and treatment",
        "summary": "Mayo Clinic lists devices such as vibrators as a nonmedical option that can help with orgasm by increasing blood flow to the clitoris."
      },
      {
        "url": "https://issm.info/sexual-health-qa/what-are-the-benefits-of-vibrators-for-sexual-health",
        "label": "International Society for Sexual Medicine: What are the benefits of vibrators for sexual health?",
        "summary": "ISSM says early research links vibrator use with better desire, arousal, satisfaction and pelvic floor tone, but notes the number of studies is still limited."
      },
      {
        "url": "https://menopause.org/wp-content/uploads/for-women/MenoNote-GSM.pdf",
        "label": "The Menopause Society: MenoNote on genitourinary syndrome of menopause",
        "summary": "The Menopause Society notes that sexual stimulation, alone, with a partner or with a device such as a vibrator, may support vaginal blood flow and natural moisture after menopause."
      }
    ]
  },
  "p-oboo-boom": {
    "whoItsFor": [
      "Women who want a wider range of intensity and both internal and external use",
      "Those who like warmth, with an optional heated tail",
      "People who enjoy switching between a broad external head and a curved internal end",
      "Not the pick for a gentle first toy or something compact"
    ],
    "howToUse": {
      "intro": "Per Oboo's instructions:",
      "steps": [
        "Hold Button 2 for 2 seconds to turn it on or off.",
        "Use Button 1 for the external head and Button 3 for the tail, each with 5 levels.",
        "Press Button 4 to add warmth to the tail if you want it.",
        "Use a water-based lube for comfort, especially if dryness is a concern.",
        "Clean with warm water and mild soap."
      ],
      "sourceUrl": "https://oboo.love/products/boom",
      "sourceLabel": "Oboo: Boom Dual-End Wand product page"
    },
    "clinicalSources": [
      {
        "url": "https://www.mayoclinic.org/diseases-conditions/female-sexual-dysfunction/diagnosis-treatment/drc-20372556",
        "label": "Mayo Clinic: Female sexual dysfunction, diagnosis and treatment",
        "summary": "Mayo Clinic lists devices such as vibrators as a nonmedical option that can help with orgasm by increasing blood flow to the clitoris."
      },
      {
        "url": "https://issm.info/sexual-health-qa/what-are-the-benefits-of-vibrators-for-sexual-health",
        "label": "International Society for Sexual Medicine: What are the benefits of vibrators for sexual health?",
        "summary": "ISSM says early research links vibrator use with better desire, arousal, satisfaction and pelvic floor tone, but notes the number of studies is still limited."
      },
      {
        "url": "https://menopause.org/wp-content/uploads/for-women/MenoNote-GSM.pdf",
        "label": "The Menopause Society: MenoNote on genitourinary syndrome of menopause",
        "summary": "The Menopause Society notes that sexual stimulation, alone, with a partner or with a device such as a vibrator, may support vaginal blood flow and natural moisture after menopause."
      }
    ]
  },
  "p-oboo-smooth-daily": {
    "whoItsFor": [
      "People with external vulvar dryness, irritation or sensitive skin who want a daily care step",
      "Those who prefer a hormone-free, plant-oil balm",
      "Anyone building an after-shower vulva care routine",
      "Not the pick for internal use or as a lube, and because it's oil-based it isn't safe with latex or polyisoprene condoms or dental dams"
    ],
    "howToUse": {
      "intro": "Per Oboo's instructions:",
      "steps": [
        "Patch test before regular use.",
        "Apply a dime-sized amount to the inner and outer vulva, ideally after a shower.",
        "Scoop it with clean fingertips and massage it in gently, morning, night or both.",
        "Use it externally only, and pair it with a water-based lube for sex.",
        "Stop using it if your skin reacts."
      ],
      "sourceUrl": "https://oboo.love/products/smooth-daily-vulva-balm",
      "sourceLabel": "Oboo: Smooth Daily Vulva Balm product page"
    },
    "clinicalSources": [
      {
        "url": "https://www.isswsh.org/images/content/2020-NAMS-GSM-Paper.pdf",
        "label": "The 2020 genitourinary syndrome of menopause position statement of The North American Menopause Society (Menopause, 2020)",
        "summary": "Suggests a 24-hour skin patch test before using a new product, links oils to more yeast colonization, and notes oil-based lubricants can erode condoms."
      },
      {
        "url": "https://www.mayoclinic.org/diseases-conditions/female-sexual-dysfunction/diagnosis-treatment/drc-20372556",
        "label": "Mayo Clinic: Female sexual dysfunction, diagnosis and treatment",
        "summary": "Mayo Clinic says herbal and topical oil products sold for sexual wellness haven't been studied well, warns one estrogen-like product may fuel estrogen-sensitive breast tumors, and advises asking your clinician first."
      }
    ]
  },
  "p-oboo-smooth-arousal": {
    "whoItsFor": [
      "People who want external comfort plus a peppermint tingle before intimacy",
      "Those who like a balm as part of a bedtime or warm-up routine, solo or with a partner",
      "Anyone who prefers a balm texture to a liquid",
      "Not the pick for internal use, or with latex or polyisoprene condoms since it's oil-based; Oboo's Smooth Daily is the plain option"
    ],
    "howToUse": {
      "intro": "Per Oboo's instructions:",
      "steps": [
        "Patch test first and stop if anything feels off.",
        "Apply a dime-sized amount to the inner and outer vulva about 5 minutes before intimacy.",
        "Massage it in gently with clean fingertips, and let the sensation build over a few minutes.",
        "Use it externally only, and add a water-based lube for penetrative sex if you need glide.",
        "Store it sealed in a cool, dry place away from sunlight."
      ],
      "sourceUrl": "https://oboo.love/products/smooth-arousal-vulva-balm",
      "sourceLabel": "Oboo: Smooth Arousal Vulva Balm product page"
    },
    "clinicalSources": [
      {
        "url": "https://www.isswsh.org/images/content/2020-NAMS-GSM-Paper.pdf",
        "label": "The 2020 genitourinary syndrome of menopause position statement of The North American Menopause Society (Menopause, 2020)",
        "summary": "Suggests a 24-hour skin patch test before using a new product, links oils to more yeast colonization, and notes oil-based lubricants can erode condoms."
      },
      {
        "url": "https://www.mayoclinic.org/diseases-conditions/female-sexual-dysfunction/diagnosis-treatment/drc-20372556",
        "label": "Mayo Clinic: Female sexual dysfunction, diagnosis and treatment",
        "summary": "Mayo Clinic says herbal and topical oil products sold for sexual wellness haven't been studied well, warns one estrogen-like product may fuel estrogen-sensitive breast tumors, and advises asking your clinician first."
      }
    ]
  },
  "p-oboo-loob-daily": {
    "whoItsFor": [
      "Midlife women with everyday dryness who want one product that works as both a moisturizer and a lube",
      "People who use condoms or silicone toys, since it's water-based and silicone-free",
      "Those who want a mild, no-tingle formula",
      "Not the pick if you want a tingling, arousal-focused formula; Loob Arousal is the brand's option for that"
    ],
    "howToUse": {
      "intro": "Per Oboo's instructions:",
      "steps": [
        "Patch test before first use.",
        "Apply a small amount to the vulva and vaginal area, morning, night or whenever you need it.",
        "Use it before and during sex as a lube, and reapply as needed.",
        "Stop using it if irritation occurs.",
        "Store it in a cool, dry place."
      ],
      "sourceUrl": "https://oboo.love/products/loob-daily",
      "sourceLabel": "Oboo: Loob Daily Moisturizer product page"
    },
    "clinicalSources": [
      {
        "url": "https://www.isswsh.org/images/content/2020-NAMS-GSM-Paper.pdf",
        "label": "The 2020 genitourinary syndrome of menopause position statement of The North American Menopause Society (Menopause, 2020)",
        "summary": "Names nonhormone lubricants and regularly used moisturizers as first-line care for menopausal dryness, and suggests a 24-hour skin patch test before using a new product internally."
      },
      {
        "url": "https://menopause.org/wp-content/uploads/for-women/MenoNote-GSM.pdf",
        "label": "The Menopause Society: MenoNote on genitourinary syndrome of menopause",
        "summary": "The Menopause Society's patient handout says vaginal moisturizers are used regularly, often several times a week, to maintain moisture."
      }
    ]
  },
  "p-oboo-loob-arousal": {
    "whoItsFor": [
      "Women who want lube and hydration plus a light peppermint tingle",
      "Solo or partnered play, including with condoms and toys, since it's water-based and silicone-free",
      "Midlife women dealing with dryness during sex",
      "Not the pick for a plain daily moisturizer without sensation, and start with a small amount if your skin is very sensitive"
    ],
    "howToUse": {
      "intro": "Per Oboo's instructions:",
      "steps": [
        "Patch test first, and stop if irritation occurs.",
        "Wash your hands.",
        "Put a small amount on your fingertips.",
        "Apply it to the vulva where you want more sensation, and let the tingle build over a minute or two.",
        "Reapply as needed during sex or toy play."
      ],
      "sourceUrl": "https://oboo.love/products/loob-arousal",
      "sourceLabel": "Oboo: Loob Arousal Moisturizer product page"
    },
    "clinicalSources": [
      {
        "url": "https://www.isswsh.org/images/content/2020-NAMS-GSM-Paper.pdf",
        "label": "The 2020 genitourinary syndrome of menopause position statement of The North American Menopause Society (Menopause, 2020)",
        "summary": "Recommends lubricants for menopausal dryness but notes very few data on products with warming or sensation additives, and suggests a 24-hour skin patch test first."
      },
      {
        "url": "https://menopause.org/wp-content/uploads/for-women/MenoNote-GSM.pdf",
        "label": "The Menopause Society: MenoNote on genitourinary syndrome of menopause",
        "summary": "The Menopause Society advises that lubricants with warming agents, flavors or certain preservatives may irritate some women."
      }
    ]
  },
  "p-oboo-mood-drops": {
    "whoItsFor": [
      "Women with low desire who want a gentle daily herbal routine rather than a quick fix",
      "Midlife women looking for stress and tension support alongside libido",
      "People happy to give it weeks, not minutes, to judge results",
      "Not the pick if you want an immediate effect, and check with your doctor first if you're pregnant, nursing or take medication"
    ],
    "howToUse": {
      "intro": "Per Oboo's label directions:",
      "steps": [
        "Shake well.",
        "Add half a dropper to coffee, water or another drink, two or three times a day.",
        "Or add a full dropper to a liter of water and sip it through the day.",
        "Take it between meals, and don't take it straight.",
        "Give it a few weeks of regular use.",
        "Check with your doctor if you're pregnant, breastfeeding or take other medicines."
      ],
      "sourceUrl": "https://oboo.love/products/in-the-mood-libido-drops",
      "sourceLabel": "Oboo: In the Mood Drops product page"
    },
    "clinicalSources": [
      {
        "url": "https://www.mayoclinic.org/diseases-conditions/female-sexual-dysfunction/diagnosis-treatment/drc-20372556",
        "label": "Mayo Clinic: Female sexual dysfunction, diagnosis and treatment",
        "summary": "Mayo Clinic says herbal supplements sold to raise sex drive haven't been studied well and advises talking to your healthcare professional before trying them."
      }
    ]
  },
  "p-oboo-cool-spray": {
    "whoItsFor": [
      "People in perimenopause or menopause who want a quick, drug-free cooling moment during a hot flash",
      "Those who already use simple cooling habits like layers, fans, or a cold drink and want something portable for a bag or desk",
      "Not the pick if you want to reduce how often hot flashes happen: The Menopause Society does not recommend cooling techniques or herbal remedies as treatment, so talk to a doctor about options that do"
    ],
    "clinicalSources": [
      {
        "url": "https://menopause.org/wp-content/uploads/press-release/nonhormone-therapy-position-statement-release.pdf",
        "label": "The Menopause Society: 2023 Nonhormone Therapy Position Statement (press release)",
        "summary": "Lists cooling techniques and supplements or herbal remedies among therapies not recommended for hot flashes, and names CBT, hypnosis, SSRIs/SNRIs, gabapentin, oxybutynin and fezolinetant as recommended options."
      },
      {
        "url": "https://www.mayoclinic.org/diseases-conditions/hot-flashes/diagnosis-treatment/drc-20352795",
        "label": "Mayo Clinic: Hot flashes, diagnosis and treatment",
        "summary": "Suggests staying cool with layers, fans and a cold drink for mild hot flashes, and covers hormone and nonhormone treatments for more bothersome ones."
      }
    ]
  },
  "p-proov-empower": {
    "clinicalSources": [
      {
        "url": "https://www.nice.org.uk/guidance/QS143/chapter/quality-statement-1-diagnosing-perimenopause-and-menopause",
        "label": "NICE Quality Standard QS143: Diagnosing perimenopause and menopause",
        "summary": "Says women 45 and over can be diagnosed with perimenopause from symptoms alone, and that lab tests, particularly FSH, don't help with diagnosis because hormone levels fluctuate during perimenopause."
      },
      {
        "url": "https://www.mayoclinic.org/diseases-conditions/perimenopause/symptoms-causes/syc-20354666",
        "label": "Mayo Clinic: Perimenopause, symptoms and causes",
        "summary": "Explains that estrogen and progesterone rise and fall during perimenopause, lists common symptoms, and names bleeding patterns that need prompt medical care."
      }
    ]
  },
  "p-proov-path-to-pregnancy": {
    "clinicalSources": [
      {
        "url": "https://www.reproductivefacts.org/news-and-publications/fact-sheets-and-infographics/defining-infertility/",
        "label": "ASRM ReproductiveFacts: Defining infertility",
        "summary": "Advises an infertility evaluation after 12 months of trying if you're under 35, or after 6 months if you're 35 or older, and sooner with irregular cycles or other risk factors."
      },
      {
        "url": "https://list.essentialmeds.org/recommendations/1397",
        "label": "WHO Essential Medicines List: Letrozole recommendation",
        "summary": "Added letrozole for anovulatory infertility linked to PCOS or unexplained infertility, noting more live births than clomifene in PCOS and that this use is off-label in the US and EU."
      }
    ]
  },
  "p-buni-bundle": {
    "whoItsFor": [
      "New parents who want BUNI's vulva balm, nipple and lip balm, and scar and body oil in one set instead of buying them separately",
      "Gift buyers putting together a postpartum care package",
      "People who like an external moisturizing routine for dry, healing skin after birth",
      "Not the pick if nipple pain is your main problem: the NHS points to latch and positioning as the usual cause, and a Cochrane review found no clear benefit from nipple ointments, so get help with feeding first"
    ],
    "clinicalSources": [
      {
        "url": "https://www.nhs.uk/conditions/baby/breastfeeding-and-bottle-feeding/breastfeeding-problems/sore-nipples/",
        "label": "NHS: Sore nipples while breastfeeding",
        "summary": "Says sore nipples usually come from poor positioning and attachment, and advises getting help early if nipples hurt at every feed, crack, or bleed."
      }
    ],
    "scienceSources": [
      {
        "url": "https://www.cochrane.org/evidence/CD007366_interventions-treating-painful-nipples-among-breastfeeding-women",
        "label": "Cochrane Review: Interventions for treating painful nipples among breastfeeding women",
        "summary": "Found no clear benefit from lanolin or other ointments for nipple pain and noted most women's pain eased to mild levels 7 to 10 days after birth, based on low-quality evidence."
      }
    ]
  },
  "p-joylux-vfit": {
    "communityReview": "Reviews of Joylux's devices on its Trustpilot page are mixed. Several longtime vFit users say it helped with tone, lubrication, and comfort during sex. Common complaints are lights or devices that stopped working after a few weeks, a size that some people with vaginal atrophy found painful to insert, the price, and trouble reaching customer service or getting a refund.",
    "communityReviewSources": [
      {
        "url": "https://www.trustpilot.com/review/joylux.com?page=4",
        "label": "Trustpilot: Joylux reviews (page 4)"
      },
      {
        "url": "https://au.trustpilot.com/review/joylux.com?page=3",
        "label": "Trustpilot: Joylux reviews (page 3)"
      }
    ]
  },
  "p-joylux-vfit-plus": {
    "whoItsFor": [
      "Midlife women who want an at-home, hormone-free device aimed at vaginal comfort, lubrication, and pelvic floor tone",
      "Current vFit fans who want brighter LEDs, a 12-minute session option, and more vibration modes",
      "Not the pick if you need a proven treatment for leaks, dryness, or pain: it is a general wellness product, and the only published study is small, uncontrolled, and Joylux-funded"
    ],
    "howToUse": {
      "intro": "Per the Respin x Joylux vFit PLUS directions on its retail listing:",
      "steps": [
        "Charge the device for 12 hours before first use.",
        "Download the Joylux app from the App Store or Google Play.",
        "Apply Joylux Photonic Gel for comfort if you like (sold separately).",
        "Insert vFit until the light window is completely inside the vagina.",
        "Turn it on, pick a light mode, and use it for 8 to 12 minutes every other day."
      ],
      "sourceUrl": "https://shop.equinox.com/products/respin-x-joylux-vfit%C2%AE-plus-red-light-intimate-wellness-device",
      "sourceLabel": "Equinox: Respin x Joylux vFit PLUS listing"
    }
  },
  "p-joylux-juicy-like-a-peach": {
    "whoItsFor": [
      "People in menopause who want a hormone-free gel for vaginal dryness and pain during sex",
      "Those who prefer a short, simple ingredient list with a vaginal-range pH (3.8, per Joylux)",
      "Not the pick if you use natural rubber latex or polyurethane condoms, which Joylux says it isn't compatible with"
    ]
  },
  "p-joylux-lets-spin": {
    "whoItsFor": [
      "People who want a water-based gel to add moisture and make sex more comfortable when dryness or hormone changes get in the way",
      "Those who like hyaluronic acid and aloe in an intimacy product",
      "Not the pick if you use polyurethane condoms, which Joylux says it isn't compatible with"
    ]
  },
  "p-joylux-reliefher": {
    "whoItsFor": [
      "People who want a non-hormonal vaginal moisturizer used at bedtime every 2 to 3 days rather than daily",
      "Those who prefer an oil-based melt with hyaluronic acid over a water-based gel",
      "Not the pick if you rely on condoms: it contains oils, and the CDC warns oil-based products can cause condoms to break"
    ]
  },
  "p-joylux-revitalizher": {
    "whoItsFor": [
      "People with dryness on the outer vulva who want an oil-based protective layer",
      "Those who prefer plant oils and beeswax over water-based creams",
      "Not the pick for internal vaginal dryness: it's for external use only"
    ]
  },
  "p-joylux-shebar": {
    "whoItsFor": [
      "People who want a soap-free bar for washing the outer intimate area",
      "Those who find regular soap drying and prefer a gentler syndet cleanser",
      "Not the pick if fragrance irritates your skin: this bar contains added fragrance"
    ]
  },
  "p-joylux-ilyeo-body": {
    "whoItsFor": [
      "Midlife women looking for a drug-free, at-home option for minor muscle and joint aches, like sore shoulders or knees",
      "People who already like heat for stiffness and want a cordless wrap with red light and vibration added",
      "Not the pick if you take light-sensitizing medications, have reduced feeling in the area, or have active skin cancer or suspicious lesions, per Joylux"
    ]
  },
  "p-joylux-coldher": {
    "whoItsFor": [
      "People who want a quick, reusable way to cool down during a hot flash",
      "Those with breast or nipple soreness who find cold soothing",
      "Anyone who wants to cool off after a workout without ice packs",
      "Not the pick if you want fewer hot flashes: The Menopause Society does not recommend cooling techniques as treatment, so ask a doctor about options that reduce them"
    ],
    "clinicalSources": [
      {
        "url": "https://menopause.org/wp-content/uploads/press-release/nonhormone-therapy-position-statement-release.pdf",
        "label": "The Menopause Society: 2023 Nonhormone Therapy Position Statement (press release)",
        "summary": "Lists cooling techniques among therapies not recommended for treating hot flashes, and names CBT, hypnosis, SSRIs/SNRIs, gabapentin, oxybutynin and fezolinetant as recommended options."
      },
      {
        "url": "https://www.mayoclinic.org/diseases-conditions/hot-flashes/diagnosis-treatment/drc-20352795",
        "label": "Mayo Clinic: Hot flashes, diagnosis and treatment",
        "summary": "Suggests staying cool with layers, fans and a cold drink for mild hot flashes, and covers hormone and nonhormone treatments for more bothersome ones."
      }
    ]
  },
  "p-mypelvicbra-waistband-extenders": {
    "whoItsFor": [
      "Pelvic Bra owners who need a little more room in the waistband, for example during pregnancy or as your body changes",
      "People who want to keep the support and compression of a Pelvic Bra they already have instead of buying a new size",
      "Not the pick on its own: the extenders only fit a Pelvic Bra (S-series for the Classic, L-series for the Classic Plus) and give no support by themselves"
    ]
  },
  "p-sootheher-gel-pad-refills": {
    "whoItsFor": [
      "Elaris Pod owners whose gel pads have lost their stick or reached the end of their roughly 30 to 40 uses",
      "People who use the Elaris Pod often and want spares on hand",
      "Not the pick if you don't own an Elaris Pod: these pads are made for that device"
    ]
  },
  "p-gina-insertion-applicator-refills": {
    "whoItsFor": [
      "gina Vaginal Moisturizing Glides users who lost or wore out their applicator",
      "People who find it easier to place a Glide deeper and more precisely with an applicator than with fingers",
      "Not the pick if you don't use gina Glides: it's designed only for them"
    ]
  },
  "p-livlabs-pippa-fit-kit": {
    "whoItsFor": [
      "Women who have had children and have been advised to do pelvic floor exercises (Kegels), which is who Liv Labs recommends the Fit Kit for",
      "Active women who want light pelvic floor engagement while running, lifting, dancing or in group classes, without a separate Kegel routine",
      "Anyone who wants to start at light resistance and step up to medium as their pelvic floor gets stronger",
      "If you haven't had children, Liv Labs points you to the Starter Kit instead"
    ]
  },
  "p-alubri-vaginal-moisturizing-gel": {
    "clinicalSources": [
      {
        "url": "https://menopause.org/wp-content/uploads/for-women/MenoNote-GSM.pdf",
        "label": "The Menopause Society: MenoNote on genitourinary syndrome of menopause",
        "summary": "Lists nonprescription vaginal moisturizers, used several times a week, as a first-line option for milder menopause-related dryness, and says to see a clinician if symptoms don't improve."
      },
      {
        "url": "https://www.mayoclinic.org/diseases-conditions/menopause/expert-answers/vaginal-dryness/faq-20115086",
        "label": "Mayo Clinic: Vaginal dryness after menopause, how to treat it?",
        "summary": "Says vaginal moisturizers used every day or every few days help keep vaginal tissues healthy, can be paired with a lubricant for sex, and that a clinician can offer prescription options if they aren't enough."
      }
    ]
  },
  "p-alubri-intimate-serum": {
    "clinicalSources": [
      {
        "url": "https://leaflets.ekhuft.nhs.uk/general-care-of-vulval-skin/html",
        "label": "East Kent Hospitals (NHS): General care of vulval skin",
        "summary": "NHS patient guidance recommends a daily emollient on vulval skin, washing with a soap substitute, and avoiding soaps, wipes, douches and scented products that can irritate."
      },
      {
        "url": "https://menopause.org/wp-content/uploads/for-women/MenoNote-GSM.pdf",
        "label": "The Menopause Society: MenoNote on genitourinary syndrome of menopause",
        "summary": "Notes that vulvar burning, itching and irritation are common around menopause but can also come from yeast infections, allergic reactions or skin conditions, so see a clinician if treatment doesn't help."
      }
    ]
  },
  "p-alubri-calming-cream": {
    "clinicalSources": [
      {
        "url": "https://medlineplus.gov/druginfo/meds/a682793.html",
        "label": "MedlinePlus: Hydrocortisone topical",
        "summary": "Explains that topical hydrocortisone relieves redness, swelling and itching, should be applied as a thin film, and that you should stop and call your doctor if an over-the-counter product hasn't helped after 7 days."
      },
      {
        "url": "https://leaflets.ekhuft.nhs.uk/general-care-of-vulval-skin/html",
        "label": "East Kent Hospitals (NHS): General care of vulval skin",
        "summary": "NHS patient guidance recommends a daily emollient on vulval skin, washing with a soap substitute, and avoiding soaps, wipes, douches and scented products that can irritate."
      },
      {
        "url": "https://menopause.org/wp-content/uploads/for-women/MenoNote-GSM.pdf",
        "label": "The Menopause Society: MenoNote on genitourinary syndrome of menopause",
        "summary": "Notes that vulvar burning, itching and irritation are common around menopause but can also come from yeast infections, allergic reactions or skin conditions, so see a clinician if treatment doesn't help."
      }
    ]
  },
  "p-alubri-vulva-balm": {
    "clinicalSources": [
      {
        "url": "https://leaflets.ekhuft.nhs.uk/general-care-of-vulval-skin/html",
        "label": "East Kent Hospitals (NHS): General care of vulval skin",
        "summary": "NHS patient guidance recommends a daily emollient on vulval skin, washing with a soap substitute, and avoiding soaps, wipes, douches and scented products that can irritate."
      },
      {
        "url": "https://menopause.org/wp-content/uploads/for-women/MenoNote-GSM.pdf",
        "label": "The Menopause Society: MenoNote on genitourinary syndrome of menopause",
        "summary": "Notes that vulvar burning, itching and irritation are common around menopause but can also come from yeast infections, allergic reactions or skin conditions, so see a clinician if treatment doesn't help."
      }
    ]
  },
  "p-alubri-vaginal-wellness-kit": {
    "clinicalSources": [
      {
        "url": "https://menopause.org/wp-content/uploads/for-women/MenoNote-GSM.pdf",
        "label": "The Menopause Society: MenoNote on genitourinary syndrome of menopause",
        "summary": "Lists nonprescription vaginal moisturizers, used several times a week, as a first-line option for milder menopause-related dryness, and says to see a clinician if symptoms don't improve."
      },
      {
        "url": "https://www.mayoclinic.org/diseases-conditions/menopause/expert-answers/vaginal-dryness/faq-20115086",
        "label": "Mayo Clinic: Vaginal dryness after menopause, how to treat it?",
        "summary": "Says vaginal moisturizers used every day or every few days help keep vaginal tissues healthy, can be paired with a lubricant for sex, and that a clinician can offer prescription options if they aren't enough."
      },
      {
        "url": "https://leaflets.ekhuft.nhs.uk/general-care-of-vulval-skin/html",
        "label": "East Kent Hospitals (NHS): General care of vulval skin",
        "summary": "NHS patient guidance recommends a daily emollient on vulval skin, washing with a soap substitute, and avoiding soaps, wipes, douches and scented products that can irritate."
      }
    ]
  },
  "p-alubri-rejuvenate-restore-kit": {
    "clinicalSources": [
      {
        "url": "https://leaflets.ekhuft.nhs.uk/general-care-of-vulval-skin/html",
        "label": "East Kent Hospitals (NHS): General care of vulval skin",
        "summary": "NHS patient guidance recommends a daily emollient on vulval skin, washing with a soap substitute, and avoiding soaps, wipes, douches and scented products that can irritate."
      },
      {
        "url": "https://medlineplus.gov/druginfo/meds/a682793.html",
        "label": "MedlinePlus: Hydrocortisone topical",
        "summary": "Explains that topical hydrocortisone relieves redness, swelling and itching, should be applied as a thin film, and that you should stop and call your doctor if an over-the-counter product hasn't helped after 7 days."
      },
      {
        "url": "https://menopause.org/wp-content/uploads/for-women/MenoNote-GSM.pdf",
        "label": "The Menopause Society: MenoNote on genitourinary syndrome of menopause",
        "summary": "Notes that vulvar burning, itching and irritation are common around menopause but can also come from yeast infections, allergic reactions or skin conditions, so see a clinician if treatment doesn't help."
      }
    ]
  },
  "p-vpod-everyday-comfort-single": {
    "clinicalSources": [
      {
        "url": "https://www.mayoclinic.org/diseases-conditions/vaginitis/symptoms-causes/syc-20354707",
        "label": "Mayo Clinic: Vaginitis, symptoms and causes",
        "summary": "Explains that itching, irritation and discharge changes are often from yeast, BV or trichomoniasis, and lists when to see a provider, including symptoms that don't clear with over-the-counter treatment or come with fever or pelvic pain."
      },
      {
        "url": "https://menopause.org/wp-content/uploads/for-women/MenoNote-GSM.pdf",
        "label": "The Menopause Society: MenoNote on genitourinary syndrome of menopause",
        "summary": "Notes that vulvar burning, itching and irritation are common around menopause but can also come from yeast infections, allergic reactions or skin conditions, so see a clinician if treatment doesn't help."
      }
    ]
  },
  "p-vpod-everyday-comfort-3-pack": {
    "clinicalSources": [
      {
        "url": "https://www.mayoclinic.org/diseases-conditions/vaginitis/symptoms-causes/syc-20354707",
        "label": "Mayo Clinic: Vaginitis, symptoms and causes",
        "summary": "Explains that itching, irritation and discharge changes are often from yeast, BV or trichomoniasis, and lists when to see a provider, including symptoms that don't clear with over-the-counter treatment or come with fever or pelvic pain."
      },
      {
        "url": "https://menopause.org/wp-content/uploads/for-women/MenoNote-GSM.pdf",
        "label": "The Menopause Society: MenoNote on genitourinary syndrome of menopause",
        "summary": "Notes that vulvar burning, itching and irritation are common around menopause but can also come from yeast infections, allergic reactions or skin conditions, so see a clinician if treatment doesn't help."
      }
    ]
  },
  "p-vpod-elite-single": {
    "clinicalSources": [
      {
        "url": "https://rapm.bmj.com/content/50/6/503",
        "label": "PROSPECT/ESRA guideline: Acute pain management after vaginal delivery with perineal tears or episiotomy (Regional Anesthesia & Pain Medicine)",
        "summary": "This European pain-society guideline recommends ice or cold packs as a simple first-line option for perineal pain after birth, alongside acetaminophen and NSAIDs."
      },
      {
        "url": "https://menopause.org/wp-content/uploads/for-women/MenoNote-GSM.pdf",
        "label": "The Menopause Society: MenoNote on genitourinary syndrome of menopause",
        "summary": "Notes that vulvar burning, itching and irritation are common around menopause but can also come from yeast infections, allergic reactions or skin conditions, so see a clinician if treatment doesn't help."
      }
    ]
  },
  "p-vpod-elite-3-pack": {
    "clinicalSources": [
      {
        "url": "https://rapm.bmj.com/content/50/6/503",
        "label": "PROSPECT/ESRA guideline: Acute pain management after vaginal delivery with perineal tears or episiotomy (Regional Anesthesia & Pain Medicine)",
        "summary": "This European pain-society guideline recommends ice or cold packs as a simple first-line option for perineal pain after birth, alongside acetaminophen and NSAIDs."
      },
      {
        "url": "https://menopause.org/wp-content/uploads/for-women/MenoNote-GSM.pdf",
        "label": "The Menopause Society: MenoNote on genitourinary syndrome of menopause",
        "summary": "Notes that vulvar burning, itching and irritation are common around menopause but can also come from yeast infections, allergic reactions or skin conditions, so see a clinician if treatment doesn't help."
      }
    ]
  },
  "d-soonr": {
    "clinicalSources": [
      {
        "url": "https://prod.asrm.org/globalassets/_asrm/practice-guidance/practice-guidelines/pdf/prepregnancy_counseling.pdf",
        "label": "ACOG and ASRM: Prepregnancy counseling (ACOG Committee Opinion No. 762)",
        "summary": "Recommends folic acid before pregnancy, reaching a healthy weight, at least 150 minutes of moderate exercise a week, stopping alcohol, tobacco and marijuana, and screening both partners, which are the habits Soonr has couples log together."
      },
      {
        "url": "https://www.asrm.org/practice-guidance/practice-committee-documents/optimizing-natural-fertility-a-committee-opinion-2021",
        "label": "ASRM: Optimizing natural fertility, a committee opinion (2021)",
        "summary": "Defines the fertile window as the 6 days ending on ovulation, notes calendar-based apps predicted the exact ovulation day only up to 21% of the time while LH kits shortened time to pregnancy in a trial, and advises evaluation after 12 months of trying (6 months at 35 or older)."
      }
    ]
  },
  "p-surearly-smart-ovulation-test": {
    "clinicalSources": [
      {
        "url": "https://www.asrm.org/practice-guidance/practice-committee-documents/optimizing-natural-fertility-a-committee-opinion-2021",
        "label": "ASRM: Optimizing natural fertility, a committee opinion (2021)",
        "summary": "Explains that ovulation usually follows the urine LH surge within 2 days, that LH kits give false positives in about 7% of cycles, that ovulation detection shortened time to pregnancy in a trial, and that you should seek evaluation after 12 months of trying (6 months at 35 or older)."
      },
      {
        "url": "https://myadlm.org/Science-and-Research/Academy-Guidance/Use-of-Point-of-Care-Testing-in-Fertility-and-Reproduction",
        "label": "ADLM Academy guidance: Use of point-of-care testing in fertility and reproduction (2022)",
        "summary": "Lab-medicine guidance stating that urine LH tests are accurate, reliable predictors of ovulation, while cautioning that the LH peak alone shouldn't be used to determine whether ovulation happened."
      }
    ]
  },
  "p-tampontribe-organic-tampons": {
    "clinicalSources": [
      {
        "url": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/tampons",
        "label": "FDA: Tampons",
        "summary": "Advises using the lowest absorbency you need, changing every 4 to 8 hours even on light days, never wearing one tampon longer than 8 hours, and removing it and getting care right away for TSS warning signs like sudden high fever, vomiting or rash."
      }
    ]
  },
  "p-tampontribe-organic-pads": {
    "clinicalSources": [
      {
        "url": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-pads-and-liners",
        "label": "FDA: Menstrual pads and liners",
        "summary": "Says pads are FDA-regulated medical devices, should be changed every few hours even on light days, and that you should stop using one and contact a provider if you get itching, rash, swelling or pain, since some people react to scents or added materials."
      }
    ]
  },
  "p-tampontribe-pantyliners-bulk-buy": {
    "clinicalSources": [
      {
        "url": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-pads-and-liners",
        "label": "FDA: Menstrual pads and liners",
        "summary": "Says pads are FDA-regulated medical devices, should be changed every few hours even on light days, and that you should stop using one and contact a provider if you get itching, rash, swelling or pain, since some people react to scents or added materials."
      },
      {
        "url": "https://leaflets.ekhuft.nhs.uk/general-care-of-vulval-skin/html",
        "label": "East Kent Hospitals (NHS): General care of vulval skin",
        "summary": "For people with sensitive or irritated vulval skin, this NHS guidance advises against wearing panty liners every day and recommends loose cotton underwear and avoiding scented products."
      }
    ]
  },
  "p-tampontribe-reusable-pads": {
    "clinicalSources": [
      {
        "url": "https://www.gosh.nhs.uk/conditions-and-treatments/general-health-advice/period-products",
        "label": "Great Ormond Street Hospital (NHS): Period products",
        "summary": "NHS hospital patient guide that describes reusable pads as a cheaper alternative you use like a disposable pad, then rinse, wash and reuse, and notes plastic in many disposable pads."
      },
      {
        "url": "https://www.mayoclinic.org/diseases-conditions/menorrhagia/symptoms-causes/syc-20352829",
        "label": "Mayo Clinic: Heavy menstrual bleeding",
        "summary": "Lists signs of heavy bleeding, like soaking one or more pads an hour for several hours or waking at night to change protection, and says to see a doctor if that happens."
      }
    ]
  },
  "p-tampontribe-teen-pads": {
    "clinicalSources": [
      {
        "url": "https://pubmed.ncbi.nlm.nih.gov/26595586/",
        "label": "ACOG Committee Opinion No. 651: Menstruation in Girls and Adolescents (PubMed)",
        "summary": "ACOG advises that girls and parents be taught what to expect from a first period and that the menstrual cycle be treated as a vital sign, since abnormal patterns can flag health concerns."
      },
      {
        "url": "https://www.mayoclinic.org/diseases-conditions/menorrhagia/symptoms-causes/syc-20352829",
        "label": "Mayo Clinic: Heavy menstrual bleeding",
        "summary": "Lists signs of heavy bleeding, like soaking one or more pads an hour for several hours or waking at night to change protection, and says to see a doctor if that happens."
      },
      {
        "url": "https://www.gosh.nhs.uk/conditions-and-treatments/general-health-advice/period-products",
        "label": "Great Ormond Street Hospital (NHS): Period products",
        "summary": "NHS hospital patient guide that describes reusable pads as a cheaper alternative you use like a disposable pad, then rinse, wash and reuse, and notes plastic in many disposable pads."
      }
    ]
  },
  "p-resa-rhythm-bracelet": {
    "clinicalSources": [
      {
        "url": "https://my.clevelandclinic.org/health/symptoms/21773-heart-rate-variability-hrv",
        "label": "Cleveland Clinic: Heart rate variability (HRV)",
        "summary": "Explains that HRV reflects how your nervous system adapts, that sleep and stress affect it, that wrist trackers estimate it less precisely than an EKG or chest strap, and that comparing your own readings over time matters more than any single number."
      },
      {
        "url": "https://www.mayoclinic.org/tests-procedures/basal-body-temperature/about/pac-20393026",
        "label": "Mayo Clinic: Basal body temperature for natural family planning",
        "summary": "Describes the small temperature rise after ovulation, notes illness and some medicines can skew it, and says temperature tracking alone is less effective than other birth control."
      }
    ]
  },
  "p-ob-original-multipack-40": {
    "whoItsFor": [
      "People who prefer an applicator-free tampon and less packaging waste",
      "Anyone who wants a fragrance-free tampon",
      "People still figuring out their flow who want several absorbencies in one box, so they can use the lowest one that works each day",
      "Not the pick if you're soaking through one or more tampons every hour for several hours: Mayo Clinic lists that as a sign of heavy menstrual bleeding worth seeing a doctor about"
    ],
    "howToUse": {
      "intro": "Per general FDA tampon guidance:",
      "steps": [
        "Wash your hands before and after inserting or removing a tampon.",
        "Use the lowest absorbency that handles your flow.",
        "Change your tampon every 4 to 8 hours, and never wear one longer than 8 hours.",
        "If a tampon lasts a full 8 hours without filling, try a lower absorbency.",
        "Throw each tampon away after one use.",
        "Remove it and get medical care right away if you get a sudden high fever, vomiting, diarrhea, dizziness, fainting or a sunburn-like rash."
      ],
      "sourceUrl": "https://www.fda.gov/ForConsumers/ConsumerUpdates/ucm612029.htm",
      "sourceLabel": "FDA: The Facts on Tampons"
    },
    "clinicalSources": [
      {
        "url": "https://www.fda.gov/ForConsumers/ConsumerUpdates/ucm612029.htm",
        "label": "FDA: The Facts on Tampons, and How to Use Them Safely",
        "summary": "FDA advises using the lowest absorbency you need, changing every 4 to 8 hours, never wearing one tampon longer than 8 hours, and stopping use and getting care for TSS warning signs."
      },
      {
        "url": "https://www.mayoclinic.org/diseases-conditions/menorrhagia/symptoms-causes/syc-20352829",
        "label": "Mayo Clinic: Heavy menstrual bleeding",
        "summary": "Lists signs of heavy bleeding, like soaking one or more pads an hour for several hours or waking at night to change protection, and says to see a doctor if that happens."
      }
    ]
  },
  "p-ob-original-multipack-80": {
    "whoItsFor": [
      "People who prefer an applicator-free tampon and less packaging waste",
      "Anyone who wants a fragrance-free tampon",
      "People still figuring out their flow who want several absorbencies in one box, so they can use the lowest one that works each day",
      "Not the pick if you're soaking through one or more tampons every hour for several hours: Mayo Clinic lists that as a sign of heavy menstrual bleeding worth seeing a doctor about"
    ],
    "howToUse": {
      "intro": "Per general FDA tampon guidance:",
      "steps": [
        "Wash your hands before and after inserting or removing a tampon.",
        "Use the lowest absorbency that handles your flow.",
        "Change your tampon every 4 to 8 hours, and never wear one longer than 8 hours.",
        "If a tampon lasts a full 8 hours without filling, try a lower absorbency.",
        "Throw each tampon away after one use.",
        "Remove it and get medical care right away if you get a sudden high fever, vomiting, diarrhea, dizziness, fainting or a sunburn-like rash."
      ],
      "sourceUrl": "https://www.fda.gov/ForConsumers/ConsumerUpdates/ucm612029.htm",
      "sourceLabel": "FDA: The Facts on Tampons"
    },
    "clinicalSources": [
      {
        "url": "https://www.fda.gov/ForConsumers/ConsumerUpdates/ucm612029.htm",
        "label": "FDA: The Facts on Tampons, and How to Use Them Safely",
        "summary": "FDA advises using the lowest absorbency you need, changing every 4 to 8 hours, never wearing one tampon longer than 8 hours, and stopping use and getting care for TSS warning signs."
      },
      {
        "url": "https://www.mayoclinic.org/diseases-conditions/menorrhagia/symptoms-causes/syc-20352829",
        "label": "Mayo Clinic: Heavy menstrual bleeding",
        "summary": "Lists signs of heavy bleeding, like soaking one or more pads an hour for several hours or waking at night to change protection, and says to see a doctor if that happens."
      }
    ]
  },
  "p-ob-original-regular-40": {
    "whoItsFor": [
      "People who prefer an applicator-free tampon and less packaging waste",
      "Anyone who wants a fragrance-free tampon",
      "Days when a lower absorbency is enough, in line with FDA advice to use the lowest absorbency you need"
    ],
    "howToUse": {
      "intro": "Per general FDA tampon guidance:",
      "steps": [
        "Wash your hands before and after inserting or removing a tampon.",
        "Use the lowest absorbency that handles your flow.",
        "Change your tampon every 4 to 8 hours, and never wear one longer than 8 hours.",
        "If a tampon lasts a full 8 hours without filling, try a lower absorbency.",
        "Throw each tampon away after one use.",
        "Remove it and get medical care right away if you get a sudden high fever, vomiting, diarrhea, dizziness, fainting or a sunburn-like rash."
      ],
      "sourceUrl": "https://www.fda.gov/ForConsumers/ConsumerUpdates/ucm612029.htm",
      "sourceLabel": "FDA: The Facts on Tampons"
    },
    "clinicalSources": [
      {
        "url": "https://www.fda.gov/ForConsumers/ConsumerUpdates/ucm612029.htm",
        "label": "FDA: The Facts on Tampons, and How to Use Them Safely",
        "summary": "FDA advises using the lowest absorbency you need, changing every 4 to 8 hours, never wearing one tampon longer than 8 hours, and stopping use and getting care for TSS warning signs."
      }
    ]
  },
  "p-ob-original-super-40": {
    "whoItsFor": [
      "People who prefer an applicator-free tampon and less packaging waste",
      "Anyone who wants a fragrance-free tampon",
      "Heavier days when a regular tampon doesn't last, but not lighter days where a lower absorbency would do",
      "Not the pick if you're soaking through one or more tampons every hour for several hours: Mayo Clinic lists that as a sign of heavy menstrual bleeding worth seeing a doctor about"
    ],
    "howToUse": {
      "intro": "Per general FDA tampon guidance:",
      "steps": [
        "Wash your hands before and after inserting or removing a tampon.",
        "Use the lowest absorbency that handles your flow.",
        "Change your tampon every 4 to 8 hours, and never wear one longer than 8 hours.",
        "If a tampon lasts a full 8 hours without filling, try a lower absorbency.",
        "Throw each tampon away after one use.",
        "Remove it and get medical care right away if you get a sudden high fever, vomiting, diarrhea, dizziness, fainting or a sunburn-like rash."
      ],
      "sourceUrl": "https://www.fda.gov/ForConsumers/ConsumerUpdates/ucm612029.htm",
      "sourceLabel": "FDA: The Facts on Tampons"
    },
    "clinicalSources": [
      {
        "url": "https://www.fda.gov/ForConsumers/ConsumerUpdates/ucm612029.htm",
        "label": "FDA: The Facts on Tampons, and How to Use Them Safely",
        "summary": "FDA advises using the lowest absorbency you need, changing every 4 to 8 hours, never wearing one tampon longer than 8 hours, and stopping use and getting care for TSS warning signs."
      },
      {
        "url": "https://www.mayoclinic.org/diseases-conditions/menorrhagia/symptoms-causes/syc-20352829",
        "label": "Mayo Clinic: Heavy menstrual bleeding",
        "summary": "Lists signs of heavy bleeding, like soaking one or more pads an hour for several hours or waking at night to change protection, and says to see a doctor if that happens."
      }
    ]
  },
  "p-ob-original-super-plus-40": {
    "whoItsFor": [
      "People who prefer an applicator-free tampon and less packaging waste",
      "Anyone who wants a fragrance-free tampon",
      "Your heaviest days, when lower absorbencies fill up quickly",
      "Not the pick if you're soaking through one or more tampons every hour for several hours: Mayo Clinic lists that as a sign of heavy menstrual bleeding worth seeing a doctor about"
    ],
    "howToUse": {
      "intro": "Per general FDA tampon guidance:",
      "steps": [
        "Wash your hands before and after inserting or removing a tampon.",
        "Use the lowest absorbency that handles your flow.",
        "Change your tampon every 4 to 8 hours, and never wear one longer than 8 hours.",
        "If a tampon lasts a full 8 hours without filling, try a lower absorbency.",
        "Throw each tampon away after one use.",
        "Remove it and get medical care right away if you get a sudden high fever, vomiting, diarrhea, dizziness, fainting or a sunburn-like rash."
      ],
      "sourceUrl": "https://www.fda.gov/ForConsumers/ConsumerUpdates/ucm612029.htm",
      "sourceLabel": "FDA: The Facts on Tampons"
    },
    "clinicalSources": [
      {
        "url": "https://www.fda.gov/ForConsumers/ConsumerUpdates/ucm612029.htm",
        "label": "FDA: The Facts on Tampons, and How to Use Them Safely",
        "summary": "FDA advises using the lowest absorbency you need, changing every 4 to 8 hours, never wearing one tampon longer than 8 hours, and stopping use and getting care for TSS warning signs."
      },
      {
        "url": "https://www.mayoclinic.org/diseases-conditions/menorrhagia/symptoms-causes/syc-20352829",
        "label": "Mayo Clinic: Heavy menstrual bleeding",
        "summary": "Lists signs of heavy bleeding, like soaking one or more pads an hour for several hours or waking at night to change protection, and says to see a doctor if that happens."
      }
    ]
  },
  "p-ob-original-ultra-40": {
    "whoItsFor": [
      "People who prefer an applicator-free tampon and less packaging waste",
      "Anyone who wants a fragrance-free tampon",
      "Your heaviest days, when lower absorbencies fill up quickly",
      "Not the pick if you're soaking through one or more tampons every hour for several hours: Mayo Clinic lists that as a sign of heavy menstrual bleeding worth seeing a doctor about"
    ],
    "howToUse": {
      "intro": "Per general FDA tampon guidance:",
      "steps": [
        "Wash your hands before and after inserting or removing a tampon.",
        "Use the lowest absorbency that handles your flow.",
        "Change your tampon every 4 to 8 hours, and never wear one longer than 8 hours.",
        "If a tampon lasts a full 8 hours without filling, try a lower absorbency.",
        "Throw each tampon away after one use.",
        "Remove it and get medical care right away if you get a sudden high fever, vomiting, diarrhea, dizziness, fainting or a sunburn-like rash."
      ],
      "sourceUrl": "https://www.fda.gov/ForConsumers/ConsumerUpdates/ucm612029.htm",
      "sourceLabel": "FDA: The Facts on Tampons"
    },
    "clinicalSources": [
      {
        "url": "https://www.fda.gov/ForConsumers/ConsumerUpdates/ucm612029.htm",
        "label": "FDA: The Facts on Tampons, and How to Use Them Safely",
        "summary": "FDA advises using the lowest absorbency you need, changing every 4 to 8 hours, never wearing one tampon longer than 8 hours, and stopping use and getting care for TSS warning signs."
      },
      {
        "url": "https://www.mayoclinic.org/diseases-conditions/menorrhagia/symptoms-causes/syc-20352829",
        "label": "Mayo Clinic: Heavy menstrual bleeding",
        "summary": "Lists signs of heavy bleeding, like soaking one or more pads an hour for several hours or waking at night to change protection, and says to see a doctor if that happens."
      }
    ]
  },
  "p-ob-procomfort-mini-32": {
    "whoItsFor": [
      "Lighter-flow days, or the start and end of your period",
      "People who prefer an applicator-free tampon",
      "People who want a tampon designed for smoother insertion and removal (that is the brand's design claim, not a tested result)"
    ],
    "howToUse": {
      "intro": "Per general FDA tampon guidance:",
      "steps": [
        "Wash your hands before and after inserting or removing a tampon.",
        "Use the lowest absorbency that handles your flow.",
        "Change your tampon every 4 to 8 hours, and never wear one longer than 8 hours.",
        "If a tampon lasts a full 8 hours without filling, try a lower absorbency.",
        "Throw each tampon away after one use.",
        "Remove it and get medical care right away if you get a sudden high fever, vomiting, diarrhea, dizziness, fainting or a sunburn-like rash."
      ],
      "sourceUrl": "https://www.fda.gov/ForConsumers/ConsumerUpdates/ucm612029.htm",
      "sourceLabel": "FDA: The Facts on Tampons"
    },
    "clinicalSources": [
      {
        "url": "https://www.fda.gov/ForConsumers/ConsumerUpdates/ucm612029.htm",
        "label": "FDA: The Facts on Tampons, and How to Use Them Safely",
        "summary": "FDA advises using the lowest absorbency you need, changing every 4 to 8 hours, never wearing one tampon longer than 8 hours, and stopping use and getting care for TSS warning signs."
      }
    ],
    "clinicalNote": "The FDA says to change a tampon every 4 to 8 hours and never wear one longer than 8. If a tampon lasts a full 8 hours without filling, the absorbency may be more than you need."
  },
  "p-ob-procomfort-mini-16": {
    "whoItsFor": [
      "Lighter-flow days, or the start and end of your period",
      "People who prefer an applicator-free tampon",
      "People who want a tampon designed for smoother insertion and removal (that is the brand's design claim, not a tested result)"
    ],
    "howToUse": {
      "intro": "Per general FDA tampon guidance:",
      "steps": [
        "Wash your hands before and after inserting or removing a tampon.",
        "Use the lowest absorbency that handles your flow.",
        "Change your tampon every 4 to 8 hours, and never wear one longer than 8 hours.",
        "If a tampon lasts a full 8 hours without filling, try a lower absorbency.",
        "Throw each tampon away after one use.",
        "Remove it and get medical care right away if you get a sudden high fever, vomiting, diarrhea, dizziness, fainting or a sunburn-like rash."
      ],
      "sourceUrl": "https://www.fda.gov/ForConsumers/ConsumerUpdates/ucm612029.htm",
      "sourceLabel": "FDA: The Facts on Tampons"
    },
    "clinicalSources": [
      {
        "url": "https://www.fda.gov/ForConsumers/ConsumerUpdates/ucm612029.htm",
        "label": "FDA: The Facts on Tampons, and How to Use Them Safely",
        "summary": "FDA advises using the lowest absorbency you need, changing every 4 to 8 hours, never wearing one tampon longer than 8 hours, and stopping use and getting care for TSS warning signs."
      }
    ],
    "clinicalNote": "The FDA says to change a tampon every 4 to 8 hours and never wear one longer than 8. If a tampon lasts a full 8 hours without filling, the absorbency may be more than you need."
  },
  "p-poise-ultra-thin-moderate": {
    "whoItsFor": [
      "Women with moderate bladder leaks from stress or urge incontinence",
      "People in perimenopause or postpartum dealing with new bladder leaks",
      "Anyone using menstrual pads for urine who wants a pad built to absorb urine and control its odor",
      "Not the pick for period bleeding: it's designed for urine, not menstrual flow"
    ]
  },
  "p-always-discreet-boutique-liners": {
    "whoItsFor": [
      "Women with very light bladder leaks, like a small leak when you cough, sneeze or laugh",
      "Anyone using a menstrual panty liner for urine who wants one designed to absorb urine and control its odor",
      "People who want a thin, discreet option for occasional leaks",
      "Anyone whose leaks are frequent or getting worse, since a clinician can check for treatable pelvic floor causes"
    ]
  },
  "p-depend-silhouette-underwear": {
    "whoItsFor": [
      "Women with moderate to heavy bladder leaks, where a liner alone isn't enough",
      "People who want pull-on protection that looks and feels closer to regular underwear than a pad",
      "Anyone whose leaks are frequent or getting worse, since a clinician can check for treatable pelvic floor causes"
    ]
  },
  "p-tena-intimates-very-light-liner": {
    "whoItsFor": [
      "Women with occasional, very light bladder leaks",
      "People in or after perimenopause noticing small leaks",
      "Anyone using a menstrual liner for urine who wants one designed to lock away urine odor"
    ]
  },
  "p-lim-method-shoe-covers": {
    "whoItsFor": [
      "People already doing LiM Method sessions with the LiM Sliding Board",
      "Anyone who needs their feet to glide on the board during LiM movements",
      "Not the pick as a pelvic floor treatment on its own: it's an accessory for the LiM exercise system"
    ]
  },
  "p-lim-method-kneeling-pad": {
    "whoItsFor": [
      "People doing LiM Method sessions who want extra cushioning in low-to-the-ground positions",
      "Anyone whose knees get sore kneeling on a hard floor during exercise",
      "Not the pick as a pelvic floor treatment on its own: it's a cushioning accessory"
    ]
  }
};
