// Research that fills gaps on product pages (who it is for, how to use it,
// ingredient science, clinical context, credible sources, warnings from the
// label, review summaries). Added Oct 15, 2026. Every URL was opened and
// checked by the researcher. These entries only fill fields a product does
// not already have: nothing the team wrote by hand is replaced (see
// withResearch in products.js and productResearch.test.js).
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
    },
    "ingredientScience": [
      {
        "name": "Fragrance (parfum, scented versions)",
        "text": "Fragrance adds scent only and does nothing for absorption. A systematic review of pads and women's health found fragrance in scented pads has been linked to dermatitis (skin inflammation) in some studies, so the unscented version is the safer pick if your skin reacts easily.",
        "citations": [
          {
            "url": "https://synapse.koreamed.org/articles/1130139",
            "label": "Ewha Medical Journal 2019 (Woo et al.), doi:10.12771/emj.2019.42.3.25: Systematic Review on Sanitary Pads and Female Health"
          }
        ]
      }
    ],
    "clinicalNote": "Pads like this one are regulated by the FDA as medical devices. FDA advises changing pads every few hours, even on light days, because wearing one too long can irritate your skin, and notes that some people react to scents or other added materials. A Harvard Health article by an OB-GYN suggests choosing unscented cotton pads without a mesh covering and changing them every 2 to 6 hours. A 2019 systematic review of pad safety found evidence on longer-term health effects of pad chemicals is limited, with small studies that neither clearly show harm nor guarantee safety.",
    "clinicalNoteSources": [
      {
        "url": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-pads-and-liners",
        "label": "FDA: Menstrual Pads and Liners",
        "summary": "Explains how FDA regulates pads and gives safe-use tips, including changing them every few hours."
      },
      {
        "url": "https://www.health.harvard.edu/blog/vulvar-health-navigating-the-nether-regions-2019040116322",
        "label": "Harvard Health Blog (Huma Farid, MD, 2019): Vulvar health",
        "summary": "Advises unscented cotton pads without a mesh covering, changed every 2 to 6 hours, and avoiding scented feminine products."
      },
      {
        "url": "https://synapse.koreamed.org/articles/1130139",
        "label": "Ewha Medical Journal 2019 (Woo et al.): Systematic Review on Sanitary Pads and Female Health",
        "summary": "Reviews chemicals found in pads and finds the evidence on health effects limited and inconclusive."
      }
    ],
    "warnings": [
      "Change your pad every few hours, even if your flow is light, and more often on heavy days.",
      "Some people react to scents or other added materials in pads.",
      "If you get itching, a rash, pain, swelling, or discomfort, stop using the pad and contact your healthcare provider."
    ],
    "warningsSource": {
      "url": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-pads-and-liners",
      "label": "FDA: Menstrual Pads and Liners (safe use)"
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
    ],
    "ingredientScience": [
      {
        "name": "Organic cotton top sheet",
        "text": "Clinicians often suggest unscented cotton pads without a mesh covering to keep vulvar skin comfortable. This is expert advice, not evidence from trials comparing cotton or organic pads with conventional ones.",
        "citations": [
          {
            "url": "https://www.health.harvard.edu/blog/vulvar-health-navigating-the-nether-regions-2019040116322",
            "label": "Harvard Health Blog (Huma Farid, MD, 2019): Vulvar health"
          }
        ]
      }
    ],
    "warnings": [
      "Change your pad every few hours, even if your flow is light, and more often on heavy days.",
      "Some people react to scents or other added materials in pads.",
      "If you get itching, a rash, pain, swelling, or discomfort, stop using the pad and contact your healthcare provider."
    ],
    "warningsSource": {
      "url": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-pads-and-liners",
      "label": "FDA: Menstrual Pads and Liners (safe use)"
    }
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
    },
    "ingredientScience": [
      {
        "name": "Lavender oil",
        "text": "Lavender oil is part of the pad's herbal infusion and does not help it absorb. It is a known skin allergen once it oxidizes (breaks down in air): in one dermatology clinic study, 2.8% of patients tested had an allergic reaction to oxidized lavender oil.",
        "citations": [
          {
            "url": "https://pubmed.ncbi.nlm.nih.gov/26671837/",
            "label": "Acta Dermato-Venereologica (Hagvall and Bråred Christensson): Contact allergy to oxidized lavender oil"
          }
        ]
      },
      {
        "name": "Peppermint oil",
        "text": "Mint oils give the cooling, tingling feel. Allergy is uncommon but real: in a large North American study, 161 of 28,128 people patch tested (0.6%) reacted to peppermint oil, nearly a third of those reactions were strong, and most also reacted to other fragrance or plant allergens. The current label lists corn mint oil and menthol rather than peppermint oil.",
        "citations": [
          {
            "url": "https://hsrc.himmelfarb.gwu.edu/gwhpubs/5450",
            "label": "Dermatitis 2024 (Warshaw et al., North American Contact Dermatitis Group), doi:10.1089/derm.2024.0118: Patch testing to peppermint oil"
          }
        ]
      },
      {
        "name": "Aloe extract",
        "text": "Aloe is part of the herbal infusion. Evidence for putting it on skin is weak and comes mostly from small studies (the best is for burns), and topical aloe is generally well tolerated, though there are occasional reports of burning, itching, and rash.",
        "citations": [
          {
            "url": "https://www.nccih.nih.gov/health/aloe-vera",
            "label": "NIH NCCIH: Aloe Vera"
          }
        ]
      }
    ],
    "warnings": [
      "Change your pad every few hours, even if your flow is light, and more often on heavy days.",
      "Some people react to scents or other added materials in pads.",
      "If you get itching, a rash, pain, swelling, or discomfort, stop using the pad and contact your healthcare provider."
    ],
    "warningsSource": {
      "url": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-pads-and-liners",
      "label": "FDA: Menstrual Pads and Liners (safe use)"
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
    },
    "clinicalNote": "The biggest review of menstrual cups so far, published in The Lancet Public Health in 2019, pooled 43 studies with 3,319 people and concluded that cups are a safe way to manage your period, while noting that few of the studies were high quality. Use of a cup showed no harmful effect on the vaginal flora (the normal mix of bacteria in the vagina). The review did find rare problems: five reported cases of toxic shock syndrome (TSS, a rare but serious bacterial illness), and 13 cases where an IUD (intrauterine device, a type of birth control) was pulled out of place in people using a cup. If you have an IUD, that is a reason to talk to your clinician and break the cup's seal fully before removing it.",
    "clinicalNoteSources": [
      {
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC6669309/",
        "label": "van Eijk et al., The Lancet Public Health 2019 (doi:10.1016/s2468-2667(19)30111-2): Menstrual cup use, leakage, acceptability, safety, and availability",
        "summary": "Systematic review and meta-analysis of 43 studies finding menstrual cups safe overall, with rare reports of TSS and IUD dislodgement."
      }
    ],
    "warnings": [
      "Menstrual cups have been linked to toxic shock syndrome (TSS), a rare but serious illness that can cause death.",
      "Never wear the cup for more than 12 hours at a time without washing it properly.",
      "If you have an IUD, check with your doctor first and break the seal before removing the cup so you don't dislodge the IUD.",
      "If you feel pain, burning, irritation, or inflammation in the genital area, remove the cup and contact a doctor."
    ],
    "warningsSource": {
      "url": "https://cdn.shopify.com/s/files/1/2705/9430/files/files_instructions_saalt_instructions_in_english.pdf",
      "label": "Saalt Cup instructions leaflet (Saalt)"
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
        "Expect darker stools. If you get constipated, tell your provider.",
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
    ],
    "communityReview": "Most reviewers are happy with it. People often say the small tablets are easy to swallow, the big bottle is good value, and some report their iron levels and energy improved. The most common complaints are stomach upset, nausea, constipation and dark stools, and some Target reviewers say a newer formula added MCT oil from coconut and the sugar alcohol isomalt, which they did not want.",
    "communityReviewSources": [
      {
        "url": "https://www.target.com/p/nature-made-iron-65-mg-tablets-180ct/-/A-13283518",
        "label": "Target customer reviews"
      },
      {
        "url": "https://www.ebay.com/p/7034766232",
        "label": "eBay product reviews"
      }
    ],
    "clinicalNote": "Iron helps your body make hemoglobin, the protein in red blood cells that carries oxygen, and women with heavy periods and people who are pregnant are among those most likely to run low. Each tablet has 65 mg of iron, which is above the 45 mg a day upper limit set for adults; doctors sometimes prescribe more than that for a limited time to treat iron deficiency, which is why bloodwork and a clinician's plan matter here. Iron can make some medicines work less well, including levothyroxine (a thyroid medicine) and levodopa (used for Parkinson's disease and restless legs syndrome). Keep the bottle away from kids: iron products are a leading cause of fatal poisoning in children under 6.",
    "clinicalNoteSources": [
      {
        "url": "https://ods.od.nih.gov/factsheets/iron-Consumer/",
        "label": "NIH Office of Dietary Supplements: Iron fact sheet for consumers",
        "summary": "Covers who is at risk of low iron, the 45 mg adult upper limit, side effects, medicine interactions, and the poisoning risk for young children."
      },
      {
        "url": "https://www.ncbi.nlm.nih.gov/books/NBK557376/",
        "label": "NIH Bookshelf (StatPearls): Iron Supplementation",
        "summary": "Clinical review of using oral iron to treat iron deficiency anemia, including absorption, side effects, and interactions."
      }
    ],
    "effectiveness": "For the product type, the evidence is good. A Cochrane review of 67 trials with 8,506 menstruating women found that daily iron supplements lowered rates of anemia and iron deficiency, raised hemoglobin and iron stores, and reduced fatigue, but clearly increased stomach side effects like constipation and belly pain. Oral iron usually takes months to rebuild your stores, and repeat bloodwork shows whether it is working. No study of this specific Nature Made product was found.",
    "effectivenessSources": [
      {
        "url": "https://russia.cochrane.org/news/featured-review-iron-supplementation-taken-daily-improving-health-menstruating-women",
        "label": "Cochrane: Iron supplementation taken daily for improving health in menstruating women (Low et al.)",
        "summary": "Summary of a Cochrane review of 67 trials finding daily iron reduces anemia and iron deficiency and eases fatigue, with more stomach side effects."
      },
      {
        "url": "https://www.ncbi.nlm.nih.gov/books/NBK557376/",
        "label": "NIH Bookshelf (StatPearls): Iron Supplementation",
        "summary": "Notes that oral iron is usually needed for months and that improvement should show on repeat blood tests."
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
    },
    "clinicalSources": [
      {
        "url": "https://www.mayoclinic.org/healthy-lifestyle/nutrition-and-healthy-eating/expert-answers/vitamin-d-toxicity/faq-20058108",
        "label": "Mayo Clinic: What is vitamin D toxicity?",
        "summary": "Mayo Clinic says adults should not take more than 4,000 IU of vitamin D a day unless a healthcare professional advises it, that too much can raise blood calcium, and that care teams check calcium and vitamin D levels when they prescribe higher doses for a set period."
      }
    ],
    "clinicalNote": "Most adults aged 19 to 70 need 600 IU of vitamin D a day, and the upper limit for adults is 4,000 IU a day from all sources combined, so one 5,000 IU softgel is above it on its own. Too much vitamin D can raise blood calcium (hypercalcemia), which can cause nausea, vomiting, muscle weakness, excess thirst, and kidney stones, and NIH notes that vitamin D toxicity almost always comes from supplements, not food or sun. Clear toxicity is unlikely below 10,000 IU a day, but NIH says harms may build up over time at lower doses. Vitamin D can also interact with some medicines, including orlistat (a weight-loss drug) and certain statins.",
    "clinicalNoteSources": [
      {
        "url": "https://ods.od.nih.gov/factsheet/VitaminD-HealthProfessional",
        "label": "NIH Office of Dietary Supplements: Vitamin D fact sheet for health professionals",
        "summary": "Gives recommended intakes, the 4,000 IU adult upper limit, signs of toxicity, and medicine interactions."
      }
    ],
    "effectiveness": "For the product type: vitamin D3 supplements reliably raise blood vitamin D levels, and NIH notes D3 raises and holds them better than D2. But in the large VITAL trial, 2,000 IU a day for about 5 years in adults who were mostly not deficient did not lower fractures, heart attacks, strokes, or rates of breast, prostate, or colorectal cancer. No study of this specific Nature's Bounty product was found.",
    "effectivenessSources": [
      {
        "url": "https://ods.od.nih.gov/factsheet/VitaminD-HealthProfessional",
        "label": "NIH Office of Dietary Supplements: Vitamin D fact sheet for health professionals",
        "summary": "Compares D2 and D3 and summarizes the VITAL trial, which found no fracture, cancer, or heart benefit in mostly vitamin D sufficient adults."
      }
    ]
  },
  "p-saalt-cup-steamer": {
    "whoItsFor": [
      "Saalt cup or disc users who want a dedicated device for the sanitizing step, which Saalt lists as an alternative to boiling",
      "People who would rather not boil their cup in a pot on the stove between cycles",
      "Not the pick if you're on a budget: Saalt's own instructions say boiling for 4 to 5 minutes or wiping with 70% isopropyl alcohol also sanitizes a cup, and FDA guidance only calls for soap, water and boiling"
    ],
    "howToUse": {
      "intro": "Per Saalt's instructions:",
      "steps": [
        "Rinse your cup or disc and wash off any blood before sanitizing it (a brand new one can go straight in).",
        "Plug in the steamer and add water to the reservoir, without filling past the max line.",
        "Set your cup or disc on top of the reservoir and close the lid.",
        "Press the button: the steamer runs and turns itself off when it's done.",
        "Let the cup or disc cool for a few minutes before you take it out, and make sure it's dry before you store it.",
        "Give the steamer about an hour to cool down and reset before using it again."
      ],
      "sourceUrl": "https://saalt.com/blogs/news/different-ways-to-sanitize-your-period-cup-or-menstrual-disc",
      "sourceLabel": "Saalt: Different ways to sanitize your period cup or menstrual disc"
    },
    "clinicalNote": "Menstrual cups and discs are reused, so the aim of cleaning between periods is to get rid of bacteria such as Staphylococcus aureus, the germ linked to toxic shock syndrome. A 2022 lab study found that washing a cup with soap and cold water and then steeping it in just-boiled water for 5 minutes removed all the S. aureus the researchers added, and steeping after a plain water rinse came close. The authors noted soap can irritate the vagina, so if you use it, rinse it off fully. Steam devices like this one were not tested.",
    "clinicalNoteSources": [
      {
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC8835062/",
        "label": "Int J Environ Res Public Health (2022): In vitro study of cleaning techniques for removing Staphylococcus aureus from menstrual cups",
        "summary": "In a lab test on silicone cups, soap and water followed by a 5-minute steep in boiled water left no recoverable S. aureus, while rinsing or soap alone did not significantly reduce bacteria."
      }
    ],
    "effectiveness": "No independent study of the Saalt Steamer or other cup steamers was found. Saalt says it tested the steamer and that it sanitizes as well as a pot of boiling water, but that is the brand's own claim. The best outside evidence is for the product type's alternative: a 2022 lab study found steeping a washed cup in boiled water for 5 minutes cleared S. aureus, and that study did not test steam.",
    "effectivenessSources": [
      {
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC8835062/",
        "label": "Int J Environ Res Public Health (2022): In vitro study of cleaning techniques for removing Staphylococcus aureus from menstrual cups",
        "summary": "Lab study on one cup brand and one bacterial strain; steeping in boiled water after washing worked best, and steam was not tested."
      }
    ],
    "warnings": [
      "Steaming takes about 1 to 3 minutes, and the rest of the 6 to 8 minute cycle is for cooling, so let it cool before you touch your cup or disc.",
      "Steam one cup or disc at a time.",
      "Let the steamer cool for one hour between uses."
    ],
    "warningsSource": {
      "url": "https://saalt.com/blogs/news/available-for-pre-order-now-the-saalt-steamer",
      "label": "Saalt: Available Now! The Saalt Steamer"
    }
  },
  "p-flex-disc": {
    "clinicalSources": [
      {
        "url": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-cups",
        "label": "FDA: Menstrual Cups (also covers menstrual discs)",
        "summary": "FDA treats discs and cups as the same product type, advises emptying every 8 to 12 hours, talking to your gynecologist first if you have an IUD, and stopping use if you get itching, rash, pain or swelling."
      }
    ],
    "whoItsFor": [
      "People who want to skip tampons and like the idea of a single-use disc they throw away after each wear",
      "Those who want up to 12 hours of wear for workouts, travel or long days, which Flex says one disc covers",
      "Anyone who wants mess-free period sex, since Flex says the disc sits behind the cervix rather than in the vaginal canal",
      "First-time disc users, as long as they're willing to do a practice run before their period, which Flex recommends"
    ],
    "howToUse": {
      "intro": "Per Flex's own instructions:",
      "steps": [
        "Do a practice run before your period so you know how it feels.",
        "Wash your hands, pinch the disc in half, and sit, squat or put one leg up.",
        "Insert it angled down and back toward your tailbone, push it as far back as it goes, then tuck the front rim up behind your pubic bone.",
        "Wear it for up to 12 hours, and if it comes untucked when you use the bathroom, push it back behind your pubic bone with a clean finger.",
        "To remove, relax, hook a finger under the front rim and pull it out slowly, keeping it level so it doesn't spill.",
        "Empty it into the toilet, then wrap it and throw it in the trash."
      ],
      "sourceUrl": "https://flexfits.com/pages/how-flex-works",
      "sourceLabel": "Flex: How Flex works"
    },
    "clinicalNote": "A menstrual disc is a flat, flexible ring that sits high in the vagina, tucked up against the cervix (the opening of the uterus), instead of lower down like a cup. Research on discs is thin: a 2026 study of reusable disc users in Kenya noted that no studies had yet specifically evaluated the menstrual disc, though most of its users reported no leaks, pain or worries by their third month. Most safety data comes from menstrual cups, where a 2019 review of 43 studies found leakage similar to or lower than pads and tampons, 5 reported cases of toxic shock syndrome (a rare, serious bacterial illness), and 13 women whose IUD (intrauterine device, a form of birth control) moved out of place. If you have an IUD, it's worth asking your clinician before using a cup or disc.",
    "clinicalNoteSources": [
      {
        "url": "https://public-pages-files-2025.frontiersin.org/journals/reproductive-health/articles/10.3389/frph.2025.1740096/pdf",
        "label": "Frontiers in Reproductive Health (2026): Female sex workers' experiences using a menstrual disc in Western Kenya",
        "summary": "Qualitative study of 38 disc users; most reported no leakage, pain or concerns by month three, and the authors note no prior studies had specifically evaluated menstrual discs."
      },
      {
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC6669309/",
        "label": "Lancet Public Health (2019): Menstrual cup use, leakage, acceptability, safety and availability, systematic review and meta-analysis",
        "summary": "Across 43 studies and 3,319 people, cup leakage was similar to or lower than pads and tampons; 5 TSS cases and 13 IUD dislodgements were reported with cup use."
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
    ],
    "whoItsFor": [
      "People who want a reusable, washable swap for pads and liners that feels like regular underwear",
      "Anyone who wants backup under a cup, disc or tampon, or protection on lighter days",
      "Teens and people with light bladder leaks, since Thinx makes separate Teens and Leaks lines",
      "Not the pick as your only protection on very heavy days: a lab study in BMJ Sexual & Reproductive Health found the period underwear it tested held the least blood of any product type"
    ],
    "howToUse": {
      "intro": "Per Thinx's product listings and general FDA guidance:",
      "steps": [
        "Pick the absorbency (light, moderate or heavy) that matches your flow.",
        "Wear a pair for up to 12 hours, and change sooner on heavy days.",
        "After wearing, rinse in cold water until the water runs clear.",
        "Machine wash cold on a gentle cycle with mild detergent, and skip bleach and fabric softener.",
        "Hang or lay flat to air dry, and always follow the care tag on your pair.",
        "Replace pairs once they reach the end of the life Thinx recommends."
      ],
      "sourceUrl": "https://www.walmart.com/cp/thinx/1546255",
      "sourceLabel": "Thinx brand shop and FAQ (Walmart)"
    },
    "scienceSources": [
      {
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC10847380/",
        "label": "DeLoughery et al., BMJ Sexual & Reproductive Health: Red blood cell capacity of modern menstrual products",
        "summary": "In a lab test of 21 menstrual products, period underwear held the least blood (about 2 mL on average) and absorbed slowly, so the authors say it suits backup or lighter days more than heavy bleeding."
      }
    ],
    "clinicalNote": "Period underwear has an absorbent layer that traps blood, plus a moisture barrier and a leak-proof layer. A Cleveland Clinic ob/gyn says most pairs typically hold about 1 to 2 tampons' worth of flow, so it's worth trying a pair on your lightest day first, and some people find it gentler than pads if pads irritate their skin. It stays hygienic as long as you wash it properly.",
    "clinicalNoteSources": [
      {
        "url": "https://health.clevelandclinic.org/does-period-underwear-work",
        "label": "Cleveland Clinic (2022): What is period underwear and does it work?",
        "summary": "An ob/gyn explains how period underwear is built, that it typically holds 1 to 2 tampons' worth of flow, and how to wear and wash it."
      }
    ],
    "warnings": [
      "Don't wear the same pair for more than 12 hours, and change sooner on heavier days.",
      "Wash with a mild, unscented, dye-free detergent and add an extra rinse.",
      "Skip fabric softener and let them air-dry."
    ],
    "warningsSource": {
      "url": "https://health.clevelandclinic.org/does-period-underwear-work",
      "label": "Cleveland Clinic: What is period underwear and does it work?"
    }
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
    ],
    "clinicalNote": "Toxic shock syndrome (TSS) is a rare but serious infection caused by toxins from certain Staph bacteria, and it has been linked to tampon use. Health Canada says the tampon material, cotton or rayon, has not been found to be a TSS risk factor, while higher absorbency appears to be one, so organic cotton tampons need the same precautions as any other. FDA testing found trace metals released from tampons during use are too small to cause harm.",
    "clinicalNoteSources": [
      {
        "url": "https://www.canada.ca/en/health-canada/services/drugs-medical-devices/menstrual-tampons.html",
        "label": "Health Canada: Menstrual tampons",
        "summary": "Explains TSS, states that cotton vs rayon material has not been found to be a risk factor, and that higher absorbency appears to be one."
      },
      {
        "url": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/tampons",
        "label": "FDA: Tampons",
        "summary": "FDA tampon safety page, including TSS symptoms, wear-time limits and its finding on trace metals."
      }
    ],
    "warnings": [
      "Change tampons every 4 to 8 hours, even if your flow is light, and never wear one for more than 8 hours.",
      "Use the lowest absorbency you need.",
      "If you get a sudden high fever, vomiting, diarrhea, a rash, dizziness or fainting, remove the tampon and contact a healthcare provider or go to the ER."
    ],
    "warningsSource": {
      "url": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/tampons",
      "label": "FDA: Tampons"
    }
  },
  "p-inositol-wholesome": {
    "whoItsFor": [
      "People with PMOS who want to try inositol after talking it through with their clinician, since the 2023 international guideline says it could be considered based on personal preference",
      "Those who want the common 40:1 myo to D-chiro ratio in a capsule rather than a powder",
      "Anyone looking for the brand's stated goal: support for hormone levels, menstrual cycles and ovarian health",
      "Not the pick as a swap for metformin when hirsutism or central weight gain is the main concern: the guideline says metformin should be considered over inositol for those"
    ],
    "howToUse": {
      "intro": "Per Wholesome Story's label directions and the 2023 international guideline:",
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
        "url": "https://pubmed.ncbi.nlm.nih.gov/37580861/",
        "label": "Recommendations from the 2023 International PCOS Guideline, Human Reproduction",
        "summary": "Inositol could be considered for metabolic measures based on personal preference, but it is experimental for fertility, no specific type, dose or ratio can be recommended, and its side effects and safety are not known."
      }
    ],
    "clinicalNote": "The 2023 international guideline notes that inositol products can have limited regulation, with variable dose, quality and consistency, and that side effects and safety are not yet known. If you take it, tell your healthcare professional.",
    "ingredientScience": [
      {
        "name": "Myo-inositol",
        "text": "Myo-inositol is the main ingredient here (2,000 mg per 4-capsule serving). A 2024 review done for the international guideline found it may help some metabolic measures, but called the overall evidence for inositol in PMOS limited and inconclusive. It likely causes fewer stomach side effects than metformin, and those tend to be mild and pass on their own.",
        "citations": [
          {
            "url": "https://digital.library.adelaide.edu.au/dspace/bitstream/2440/140526/2/hdl_140526.pdf",
            "label": "Journal of Clinical Endocrinology & Metabolism, 2024: Inositol for PCOS, systematic review and meta-analysis for the 2023 international PCOS guideline (University of Adelaide copy)"
          }
        ]
      },
      {
        "name": "D-chiro-inositol",
        "text": "D-chiro-inositol (DCI) is a close cousin of myo-inositol (50 mg per serving here). The same guideline review found DCI may help with ovulation, but this rests on a small number of trials and the overall evidence was rated limited and inconclusive.",
        "citations": [
          {
            "url": "https://digital.library.adelaide.edu.au/dspace/bitstream/2440/140526/2/hdl_140526.pdf",
            "label": "Journal of Clinical Endocrinology & Metabolism, 2024: Inositol for PCOS, systematic review and meta-analysis for the 2023 international PCOS guideline (University of Adelaide copy)"
          }
        ]
      }
    ],
    "warnings": [
      "Check with your healthcare provider before use if you are trying to get pregnant, are pregnant or nursing, have any medical condition, or take any medications.",
      "For adult use only. Keep out of reach of children.",
      "Do not use if the tamper-evident seal is broken or missing."
    ],
    "warningsSource": {
      "url": "https://www.vitacost.com/products/wholesome-story-myo-d-chiro-inositol-120-vegetarian-capsules-114887",
      "label": "Wholesome Story Myo & D-Chiro Inositol label, via Vitacost"
    }
  },
  "p-spearmint-pcos": {
    "whoItsFor": [
      "People with PMOS who are curious about spearmint and want to try it alongside, not instead of, care from their clinician",
      "Anyone who wants a simple, caffeine-free organic herbal tea they can drink any time of day",
      "Those who prefer starting with a food-like option before considering supplements",
      "Not the pick as a treatment for hirsutism or irregular cycles on its own: evidence is preliminary and clinical benefit has not been established"
    ],
    "howToUse": {
      "intro": "Per Traditional Medicinals' label directions and the 2023 international guideline:",
      "steps": [
        "Pour 8 oz (240 ml) of freshly boiled water over 1 tea bag.",
        "Cover and steep for 5 to 10 minutes.",
        "Squeeze and remove the tea bag before drinking.",
        "Let your clinician know you are using it if you're managing PMOS, as with any complementary therapy."
      ],
      "sourceUrl": "https://fullscript.com/catalog/products/organic-spearmint-tea",
      "sourceLabel": "Traditional Medicinals Organic Spearmint label directions (Fullscript listing)"
    },
    "clinicalSources": [
      {
        "url": "https://pubmed.ncbi.nlm.nih.gov/37580861/",
        "label": "Recommendations from the 2023 International PCOS Guideline, Human Reproduction",
        "summary": "Lifestyle care is recommended for everyone with PMOS, and people using complementary therapies are encouraged to tell their healthcare professional so choices can be discussed together."
      }
    ],
    "clinicalNote": "The main study behind spearmint tea for PMOS is a small randomized trial lasting just 30 days, where women drank spearmint tea or a placebo tea. Androgen levels (male-type hormones like testosterone) dropped in the spearmint group and women said they felt better about their hair growth, but the objective score for unwanted hair (the Ferriman-Gallwey score) did not change significantly. So it is an early signal on hormone levels, not proof that symptoms improve.",
    "clinicalNoteSources": [
      {
        "url": "https://pubmed.ncbi.nlm.nih.gov/19585478/",
        "label": "Grant P, Phytotherapy Research 2010: Spearmint herbal tea has significant anti-androgen effects in polycystic ovarian syndrome, a randomized controlled trial",
        "summary": "In a 30-day randomized trial in women with PCOS, spearmint tea lowered free and total testosterone and improved self-rated hirsutism, but the objective Ferriman-Gallwey score did not change significantly."
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
    "clinicalNote": "See a clinician if bloating lasts more than a week, is very painful, or comes with fever, vomiting, bleeding or weight loss. Ginger can cause heartburn, diarrhea or stomach discomfort in some people and may interact with medicines.",
    "ingredientScience": [
      {
        "name": "Digestive enzymes (amylase, protease, lipase, plus pepsin, bromelain and papain)",
        "text": "These enzymes break down starch, protein and fat. Harvard Health says that for most people there is little evidence over-the-counter enzyme pills do any good for bloating; the clearer exceptions are single enzymes for a specific problem, like lactase for lactose intolerance. Enzyme supplements are not FDA regulated, so you can't be sure how much enzyme a pill contains.",
        "citations": [
          {
            "url": "https://www.health.harvard.edu/staying-healthy/can-taking-enzyme-supplements-help-soothe-my-bloating",
            "label": "Harvard Health Publishing: Can taking enzyme supplements help soothe my bloating?"
          }
        ]
      },
      {
        "name": "Ginger root",
        "text": "Ginger has research support for nausea and vomiting in pregnancy, but NCCIH's fact sheet does not list bloating or gas as an evidence-backed use. By mouth it can cause stomach discomfort, heartburn and diarrhea in some people.",
        "citations": [
          {
            "url": "https://www.nccih.nih.gov/health/ginger",
            "label": "NCCIH (NIH): Ginger"
          }
        ]
      },
      {
        "name": "Dandelion root",
        "text": "Dandelion is promoted for indigestion, but NCCIH says there is no compelling scientific evidence that it helps any health condition, and very little research exists. It is likely safe in food amounts, and it might interact with diabetes drugs, blood thinners and water pills.",
        "citations": [
          {
            "url": "https://www.nccih.nih.gov/health/dandelion",
            "label": "NCCIH (NIH): Dandelion"
          }
        ]
      },
      {
        "name": "Fenugreek seed",
        "text": "Fenugreek is the first ingredient in the blend. NCCIH says evidence for it is too limited for conclusions on most uses, it can cause diarrhea, nausea and other digestive symptoms, and it is not safe in pregnancy in amounts above what is in food.",
        "citations": [
          {
            "url": "https://nccih.nih.gov/health/fenugreek",
            "label": "NCCIH (NIH): Fenugreek"
          }
        ]
      }
    ],
    "warnings": [
      "Check with your healthcare provider before starting, especially if you are pregnant, nursing or taking medication.",
      "For adult use only. Keep out of reach of children.",
      "The label carries a California Prop 65 warning about exposure to chemicals the state lists as causing cancer."
    ],
    "warningsSource": {
      "url": "https://target.com/p/love-wellness-bye-bye-bloat-for-fast-bloating-relief-60ct/-/A-80209808",
      "label": "Love Wellness Bye Bye Bloat label, via Target"
    }
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
        "url": "https://www.cochrane.org/evidence/CD002114_vaginal-weights-training-pelvic-floor-muscles-treat-urinary-incontinence-women",
        "label": "Cochrane review: Weighted vaginal cones for urinary incontinence",
        "summary": "Cones were better than no active treatment and may be about as effective as standard pelvic floor training, but trials were small, the conclusion is tentative, and about 1 in 5 women dropped out."
      }
    ],
    "ingredientScience": [
      {
        "name": "Weighted vaginal cones (the device type)",
        "text": "Laselle is a set of weighted vaginal exercisers (often called cones) in medical-grade silicone. A 2013 Cochrane review found some evidence that weighted cones help women with stress urinary incontinence (leaking when you cough, sneeze or exercise) more than no treatment, and may work about as well as regular pelvic floor exercises, but the trials were small and the authors called the conclusions tentative. Some women find vaginal weights unpleasant or hard to use.",
        "citations": [
          {
            "url": "https://www.cochrane.org/evidence/CD002114_vaginal-weights-training-pelvic-floor-muscles-treat-urinary-incontinence-women",
            "label": "Cochrane Review, 2013: Weighted vaginal cones for urinary incontinence"
          }
        ]
      }
    ]
  },
  "p-pelvic-wand": {
    "whoItsFor": [
      "People with pelvic pain or muscle tightness who are working with a pelvic floor physical therapist",
      "Those whose PT has shown them how to release internal trigger points and want a tool to continue that work at home",
      "Not the pick for using on your own without guidance: clinicians suggest internal self-treatment tools as part of a supervised plan for selected patients"
    ],
    "howToUse": {
      "intro": "Per Intimate Rose's own Pelvic Wand guide (best done with a plan from your pelvic floor PT):",
      "steps": [
        "Wash your hands and clean the wand with soap or cleanser before each use.",
        "Put a generous amount of water-based lubricant on the tip.",
        "Lie on your back with pillows for support, then gently insert the wand vaginally or rectally.",
        "Gently sweep the tissue first, then find tender spots using about the pressure you'd use to check if a tomato is ripe.",
        "Hold pressure on each tender spot for 30 to 90 seconds and breathe through it.",
        "Keep sessions to about 5 to 10 minutes, and repeat on the schedule your PT recommends."
      ],
      "sourceUrl": "https://www.intimaterose.com/pages/pelvic-wand-guide-page",
      "sourceLabel": "Intimate Rose: How to use your Pelvic Wand"
    },
    "clinicalNote": "ACOG's updated guidance on chronic pelvic pain, summarized by AAFP, notes that muscle-related pain is common in chronic pelvic pain and suggests considering pelvic floor physical therapy, alone or alongside other treatments. Research on internal trigger-point wands specifically is thin. The main study followed 374 people (about 80% men) who used a wand together with a relaxation training program for 6 months; their use of pain and other medications dropped, but there was no comparison group.",
    "clinicalNoteSources": [
      {
        "url": "https://www.aafp.org/pubs/afp/issues/2021/0201/p186.html",
        "label": "American Family Physician (AAFP), 2021: Chronic Pelvic Pain in Women, ACOG Updates Recommendations",
        "summary": "Summary of ACOG's chronic pelvic pain recommendations, including considering pelvic floor physical therapy."
      },
      {
        "url": "https://pubmed.ncbi.nlm.nih.gov/25708131/",
        "label": "Applied Psychophysiology and Biofeedback (Springer), 2015: Chronic pelvic pain syndrome, medication use after pelvic floor PT with an internal trigger point wand",
        "summary": "Uncontrolled 6-month study of an internal trigger point wand plus relaxation therapy in 374 patients, mostly men, showing reduced medication use."
      }
    ],
    "warnings": [
      "Do not use the wand if you have an active pelvic infection.",
      "Use only gentle force with the wand."
    ],
    "warningsSource": {
      "url": "https://intimaterose.com/blogs/videos/pelvic-massage-wand-indications-contraindications-for-pelvic-floor-specialists",
      "label": "Intimate Rose: Pelvic massage wand indications and contraindications"
    }
  },
  "p-estroven-mood": {
    "whoItsFor": [
      "People in perimenopause or menopause who want a non-hormonal supplement to try for mood, hot flashes and night sweats",
      "Those who would rather not take hormone therapy, or want to discuss a non-hormonal option with their clinician first",
      "Anyone comfortable with the fact that evidence for phytoestrogens like soy isoflavones is mixed"
    ],
    "howToUse": {
      "intro": "Per Estroven's label directions:",
      "steps": [
        "Take 1 caplet a day, with or without food, at any time of day.",
        "Take it daily for at least 60 days before judging how well it works for you.",
        "Don't take it if you're pregnant, breastfeeding or trying to get pregnant.",
        "Tell your healthcare provider before starting, especially if you take other medicines, and note that it contains soy.",
        "Don't use a caplet if its blister is torn or open, and store the pack away from heat, humidity and sunlight."
      ],
      "sourceUrl": "https://www.vitacost.com/products/estroven-menopause-relief-mood-boost-30-caplets-63596",
      "sourceLabel": "Estroven Menopause Relief + Mood Boost label (Vitacost listing)"
    },
    "clinicalSources": [
      {
        "url": "https://www.nccih.nih.gov/health/black-cohosh",
        "label": "NIH National Center for Complementary and Integrative Health: Black Cohosh",
        "summary": "Black cohosh may help hot flashes but not anxiety or low mood, may not be safe in pregnancy or with hormone-sensitive cancers, and rare liver injury has been reported, so watch for dark urine or fatigue and talk to your provider first."
      },
      {
        "url": "https://www.emas-online.org/wp-content/uploads/2021/04/nonhormonal.pdf",
        "label": "European Menopause and Andropause Society position statement (Maturitas, 2015): Non-hormonal management of menopausal vasomotor symptoms",
        "summary": "EMAS says evidence for phytoestrogen supplements like soy isoflavones is insufficient or conflicting, and that a Cochrane review did not show black cohosh beats placebo for menopause symptoms."
      }
    ],
    "scienceSources": [
      {
        "url": "https://pubmed.ncbi.nlm.nih.gov/22972105/",
        "label": "Leach and Moore, Cochrane review (2012): Black cohosh for menopausal symptoms",
        "summary": "Across 16 trials with 2,027 women, black cohosh did not reduce hot flashes or overall menopause scores more than placebo, and the authors found insufficient evidence to support its use."
      },
      {
        "url": "https://www.ncbi.nlm.nih.gov/books/NBK547990/",
        "label": "NIH LiverTox: Black cohosh",
        "summary": "Trials of over 1,200 people found no liver injury, but more than 50 case reports have linked black cohosh products to liver damage, some likely from mislabeled or adulterated products."
      }
    ],
    "ingredientScience": [
      {
        "name": "Black cohosh root extract",
        "text": "Black cohosh is the most studied herb for menopause, but results are mixed. NCCIH points to a 2023 review of 22 studies that found it potentially helpful for overall symptoms and hot flashes, though not for anxiety or depression. Rare cases of liver damage, some serious, have been reported in people taking black cohosh products, though it is not clear the herb caused them.",
        "citations": [
          {
            "url": "https://www.nccih.nih.gov/health/black-cohosh",
            "label": "NCCIH (NIH): Black Cohosh"
          }
        ]
      },
      {
        "name": "Soy isoflavones",
        "text": "Soy isoflavones are plant compounds with weak estrogen-like effects (phytoestrogens). NCCIH says they may cut how often and how badly hot flashes happen, but the effect may be small, and it is uncertain whether isoflavone supplements are safe for women with or at risk of breast cancer.",
        "citations": [
          {
            "url": "https://nccih.nih.gov/health/providers/digest/menopausal-symptoms-and-complementary-health-practices-science",
            "label": "NCCIH (NIH) Clinical Digest, 2021: Menopausal Symptoms and Complementary Health Practices"
          }
        ]
      },
      {
        "name": "Ginkgo biloba leaf extract",
        "text": "Ginkgo is often sold for memory, but Mayo Clinic says most studies show it does not improve memory, attention or brain function, and it does not prevent or slow dementia. It might raise bleeding risk, especially with blood thinners or ibuprofen, and in large amounts may raise seizure risk in people with epilepsy.",
        "citations": [
          {
            "url": "https://www.mayoclinic.org/drugs-supplements/ginkgo/art-20362032",
            "label": "Mayo Clinic: Ginkgo"
          }
        ]
      },
      {
        "name": "Magnolia bark extract",
        "text": "Evidence here is weak. The one trial we found gave 89 menopausal women a combination tablet with magnolia, soy isoflavones and other ingredients for 24 weeks, and sleep and mood improved more than with calcium and vitamin D, but because it was a mix, the study can't show what magnolia did on its own.",
        "citations": [
          {
            "url": "https://pubmed.ncbi.nlm.nih.gov/16957676/",
            "label": "Minerva Ginecologica, 2006: Soy isoflavones, lactobacilli, Magnolia bark extract, vitamin D3 and calcium, controlled clinical study in menopause"
          }
        ]
      }
    ],
    "clinicalNote": "Estroven mixes several plant ingredients rather than hormones. NCCIH says soy isoflavones may reduce hot flashes a little and that evidence for black cohosh is inconsistent. In its 2023 position statement, The Menopause Society did not recommend soy products or supplements and herbal remedies for hot flashes, and listed options such as CBT, certain antidepressants, gabapentin and fezolinetant as recommended non-hormone treatments.",
    "clinicalNoteSources": [
      {
        "url": "https://nccih.nih.gov/health/providers/digest/menopausal-symptoms-and-complementary-health-practices-science",
        "label": "NCCIH (NIH) Clinical Digest, 2021: Menopausal Symptoms and Complementary Health Practices",
        "summary": "Summarizes evidence on soy isoflavones (small possible benefit) and black cohosh (inconsistent) for menopause symptoms."
      },
      {
        "url": "https://menopause.org/wp-content/uploads/press-release/nonhormone-therapy-position-statement-release.pdf",
        "label": "The Menopause Society (NAMS), 2023: Nonhormone therapy position statement release",
        "summary": "Lists which non-hormone hot flash treatments the society recommends and which, including soy products and herbal supplements, it does not."
      }
    ],
    "warnings": [
      "Tell your healthcare professional before taking it.",
      "Do not take if you are pregnant, breastfeeding or trying to get pregnant.",
      "Keep out of reach of children.",
      "Do not use if any part of the blister pack is torn, open or damaged."
    ],
    "warningsSource": {
      "url": "https://www.vitacost.com/products/estroven-menopause-relief-mood-boost-30-caplets-63596",
      "label": "Estroven Menopause Relief + Mood Boost label, via Vitacost"
    }
  },
  "p-remifemin": {
    "whoItsFor": [
      "People with menopausal hot flashes who want to try an herbal, non-hormonal option",
      "Those who prefer a standardized black cohosh extract over a multi-ingredient blend",
      "Anyone who wants a non-hormonal option and plans to talk it over with their clinician first"
    ],
    "howToUse": {
      "intro": "Per Remifemin's label directions (check your package, since labels vary by country) and NIH guidance on black cohosh:",
      "steps": [
        "Take 1 tablet in the morning and 1 tablet in the evening with water.",
        "Use it under the guidance of a healthcare professional, since black cohosh may harm the liver in some people.",
        "Stop and call your doctor if you notice dark urine or unusual tiredness, which NIH lists as possible signs of liver trouble.",
        "Check with your doctor first if you're pregnant, breastfeeding, have had a hormone-sensitive cancer like breast or uterine cancer, or take other medicines."
      ],
      "sourceUrl": "https://superpharmacyplus.com.au/remifemin-menopause-symptom-relief-100-tablets/",
      "sourceLabel": "Remifemin Menopause Symptom Relief label (Super Pharmacy Plus listing, Australia)"
    },
    "scienceSources": [
      {
        "url": "https://pubmed.ncbi.nlm.nih.gov/17587516/",
        "label": "Maturitas (2007): Isopropanolic black cohosh extract (Remifemin) vs tibolone in Chinese women with menopausal symptoms",
        "summary": "In a 3-month double-blind trial of 244 women, the Remifemin extract reduced menopause symptom scores about as much as the hormone drug tibolone, with fewer side effects."
      },
      {
        "url": "https://pubmed.ncbi.nlm.nih.gov/22972105/",
        "label": "Leach and Moore, Cochrane review (2012): Black cohosh for menopausal symptoms",
        "summary": "Across 16 trials with 2,027 women, black cohosh in general did not reduce hot flashes or overall menopause scores more than placebo, and the authors found insufficient evidence to support its use."
      }
    ],
    "ingredientScience": [
      {
        "name": "Black cohosh extract",
        "text": "Black cohosh is the most researched herb for hot flashes, but the results don't line up neatly. NCCIH cites a 2023 review of 22 studies that found it potentially helpful for overall menopause symptoms and hot flashes, but not for anxiety or depression. It is generally well tolerated in studies up to a year, though rare and sometimes serious liver damage has been reported with black cohosh products.",
        "citations": [
          {
            "url": "https://www.nccih.nih.gov/health/black-cohosh",
            "label": "NCCIH (NIH): Black Cohosh"
          }
        ]
      }
    ],
    "clinicalNote": "Black cohosh is one of the few herbs with a sizable research base for hot flashes, but that research is mixed. NCCIH notes that black cohosh extracts approved in Europe seem to reduce menopause symptoms in one review, while overall evidence is inconsistent. In its 2023 position statement, The Menopause Society did not recommend supplements and herbal remedies for hot flashes. NCCIH also says it is not clear whether black cohosh is safe for women who have had hormone-sensitive conditions such as breast cancer.",
    "clinicalNoteSources": [
      {
        "url": "https://nccih.nih.gov/health/providers/digest/menopausal-symptoms-and-complementary-health-practices-science",
        "label": "NCCIH (NIH) Clinical Digest, 2021: Menopausal Symptoms and Complementary Health Practices",
        "summary": "Reviews black cohosh evidence (inconsistent overall, possible benefit for European-approved extracts) and liver and breast cancer safety questions."
      },
      {
        "url": "https://menopause.org/wp-content/uploads/press-release/nonhormone-therapy-position-statement-release.pdf",
        "label": "The Menopause Society (NAMS), 2023: Nonhormone therapy position statement release",
        "summary": "Says supplements and herbal remedies are not recommended for hot flashes and lists recommended non-hormone options."
      }
    ],
    "warnings": [
      "If you have liver problems, take it only after talking with your doctor, and stop and see a doctor if signs of liver injury appear.",
      "If you have or had breast cancer or another hormone-dependent tumor, don't use it without medical advice.",
      "Not recommended during pregnancy or breastfeeding.",
      "Don't take it for longer than six months without medical advice."
    ],
    "warningsSource": {
      "url": "https://www.remifemin.de/wp-content/uploads/Gebrauchsinformation_Remifemin_en.pdf",
      "label": "Remifemin package leaflet, English version (manufacturer site remifemin.de)"
    }
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
    ],
    "howToUse": {
      "intro": "Per Thorne's label directions:",
      "steps": [
        "Mix 1 scoop (5 g) into at least 8 oz of water or another drink.",
        "Take it once a day, 30 to 90 minutes before or after exercise, or in the morning.",
        "Pair it with regular strength training, which is where the research shows the clearest benefit.",
        "If you're pregnant, check with your health care practitioner before using it.",
        "Keep it out of reach of children."
      ],
      "sourceUrl": "https://www.professionalsupplementcenter.com/products/creatine-powder-by-thorne-research",
      "sourceLabel": "Thorne Creatine label directions (Professional Supplement Center listing)"
    },
    "scienceSources": [
      {
        "url": "https://ro.ecu.edu.au/ecuworks2022-2026/8225",
        "label": "Naddafha et al., Journal of the International Society of Sports Nutrition (2026): Creatine monohydrate for lean mass, strength and bone density in postmenopausal women",
        "summary": "Across 7 trials with 608 postmenopausal women, 5 g a day or more of creatine plus resistance training led to small gains in lean mass and leg strength with no sign of harm, while lower doses without training showed no effect and bone density did not change."
      }
    ],
    "ingredientScience": [
      {
        "name": "Creatine monohydrate (5 g per scoop)",
        "text": "Creatine tops up the quick energy stores your muscles use for short, hard efforts. In postmenopausal women the evidence for muscle (and, in some trials, bone) is best when creatine is paired with resistance training, but a 2025 review found no studies yet in perimenopausal women, so benefits for brain fog, mood or sleep in menopause are still unproven ideas.",
        "citations": [
          {
            "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC12086928/",
            "label": "NIH (PMC): J Int Soc Sports Nutr 2025 (Smith-Ryan et al.), doi:10.1080/15502783.2025.2502094: Creatine in women's health, menstruation to menopause"
          }
        ]
      }
    ],
    "clinicalNote": "Creatine is one of the most studied sports supplements. A 2017 position stand from the International Society of Sports Nutrition found it consistently improves exercise performance and that doses studied, up to 30 g a day for 5 years, were safe and well tolerated. For women in midlife, the best evidence comes from postmenopausal women, where creatine plus strength training helped muscle and, in some trials, bone; a 2025 review found no studies yet in perimenopausal women and called benefits for brain fog, mood and sleep areas that still need research. Several authors of both papers have advisory or funding ties to creatine makers, which they disclose.",
    "clinicalNoteSources": [
      {
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC5469049/",
        "label": "J Int Soc Sports Nutr 2017 (Kreider et al.), doi:10.1186/s12970-017-0173-z: ISSN position stand on creatine safety and efficacy",
        "summary": "Expert position stand concluding creatine improves exercise performance and is safe and well tolerated at studied doses, up to 30 g a day for 5 years."
      },
      {
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC12086928/",
        "label": "NIH (PMC): J Int Soc Sports Nutr 2025 (Smith-Ryan et al.), doi:10.1080/15502783.2025.2502094: Creatine in women's health, menstruation to menopause",
        "summary": "Narrative review finding the strongest midlife evidence in postmenopausal women using resistance training, with no studies yet in perimenopausal women."
      }
    ],
    "warnings": [
      "If you are pregnant, check with your healthcare practitioner before using it.",
      "Use only if the bottle's seal is intact.",
      "Store tightly sealed in a cool, dry place."
    ],
    "warningsSource": {
      "url": "https://www.vitacost.com/products/thorne-creatine-16-oz-450-g-70006",
      "label": "Thorne Creatine 16 oz label text (Vitacost listing)"
    }
  },
  "d-nurx-bc": {
    "whoItsFor": [
      "People who want a birth control prescription online without an in-person visit, in states where that's allowed",
      "Those who want pills, the patch or the ring delivered to their door",
      "Anyone who wants to use insurance for online contraception care"
    ],
    "howToUse": {
      "intro": "Per Nurx's own birth control page:",
      "steps": [
        "Pick the method you're interested in: pill, patch, ring or emergency contraception.",
        "Complete the online consultation about your health history and birth control preferences, and pay the consultation fee.",
        "Wait for a provider licensed in your state to review it and prescribe birth control if it's clinically appropriate.",
        "Add your insurance if you have it, or pay cash, and Nurx ships a 3-month supply to your door.",
        "Let refills ship automatically, message the medical team with questions, and pause or cancel anytime."
      ],
      "sourceUrl": "https://www.nurx.com/birthcontrol/",
      "sourceLabel": "Nurx: Birth control online"
    },
    "clinicalSources": [
      {
        "url": "https://cdc.gov/contraception/hcp/usspr/tests-before-contraception.html",
        "label": "CDC U.S. Selected Practice Recommendations for Contraceptive Use: Exams and tests needed before starting contraception",
        "summary": "A blood pressure reading is the only essential check before starting the combined pill, patch or ring, a pelvic exam isn't needed, and if a provider can't measure it, patients can report a blood pressure taken elsewhere."
      }
    ],
    "scienceSources": [
      {
        "url": "https://ibisreproductivehealth.org/node/1010",
        "label": "Zuniga et al., Journal of Telemedicine and Telecare (2019): An assessment of online platforms prescribing birth control in the USA",
        "summary": "Comparing nine US online birth control platforms against CDC eligibility criteria, the authors found they appear to screen adequately for contraindications and prescribe safely, though their health questionnaires could be more rigorous."
      }
    ],
    "clinicalNote": "With Nurx, a licensed clinician reviews your answers to an online health questionnaire and decides whether a birth control method is safe for you, a screening similar to the one at an in-person visit. A 2019 study of nine US online birth control platforms found they generally did a good job screening for health conditions that make some methods unsafe, judged against CDC guidelines, though the authors said the health questionnaires could be more thorough. A federal evidence review from AHRQ (the Agency for Healthcare Research and Quality) found that telehealth birth control care led to similar results as usual care, such as similar pregnancy rates, but the strength of that evidence is low and no studies looked at harms. Your clinician's decision is based on what you report, so answer the health questions fully and honestly.",
    "clinicalNoteSources": [
      {
        "url": "https://www.ibisreproductivehealth.org/node/1010",
        "label": "J Telemed Telecare 2019 (Zuniga et al.), doi:10.1177/1357633X18824828: Assessment of online platforms prescribing birth control in the USA (Ibis Reproductive Health summary)",
        "summary": "Found US online birth control platforms adequately screened for contraindications under CDC guidelines, with room to make questionnaires more rigorous."
      },
      {
        "url": "https://www.aafp.org/afp/2023/0500/ahrq-telehealth-womens-preventive-services.pdf",
        "label": "American Family Physician 2023 (AAFP), summarizing AHRQ Comparative Effectiveness Review No. 256: Effectiveness of Telehealth for Women's Preventive Services",
        "summary": "Telehealth contraception care had similar outcomes to usual care with low strength of evidence; harms were not studied."
      }
    ],
    "warnings": [
      "Nurx is not for crisis care: in a mental health crisis, call 911 or go to the nearest emergency department.",
      "If you are thinking about suicide, call 911 or call or text 988.",
      "Medications are prescribed only if your clinician decides they are clinically appropriate after your consultation.",
      "Services are not offered in every state."
    ],
    "warningsSource": {
      "url": "https://www.nurx.com/",
      "label": "Nurx homepage disclaimers"
    }
  },
  "d-wisp-bc": {
    "whoItsFor": [
      "People who want birth control, emergency contraception, or UTI and STI treatment without booking an appointment",
      "Those who prefer an asynchronous, message-based visit they can fit around their schedule",
      "Anyone who wants the choice of same-day pharmacy pickup or discreet delivery"
    ],
    "howToUse": {
      "intro": "Per Wisp's How it Works page:",
      "steps": [
        "Choose the treatment you need, or take the Symptoms Quiz if you're not sure.",
        "Fill out the online medical intake form and pay the consult fee.",
        "Answer any follow-up from the licensed provider, who may reach out the same day by phone or secure chat.",
        "If approved, choose same-day pickup at your pharmacy (where insurance can apply) or free discreet shipping.",
        "Message the Care Team anytime with questions, and call 911 or go to an ER for emergencies."
      ],
      "sourceUrl": "https://hellowisp.com/how-it-works",
      "sourceLabel": "Wisp: How it works"
    },
    "clinicalSources": [
      {
        "url": "https://cdc.gov/contraception/hcp/usspr/tests-before-contraception.html",
        "label": "CDC U.S. Selected Practice Recommendations for Contraceptive Use: Exams and tests needed before starting contraception",
        "summary": "A blood pressure reading is the only essential check before starting the combined pill, patch or ring, a pelvic exam isn't needed, and if a provider can't measure it, patients can report a blood pressure taken elsewhere."
      }
    ],
    "scienceSources": [
      {
        "url": "https://ibisreproductivehealth.org/node/1010",
        "label": "Zuniga et al., Journal of Telemedicine and Telecare (2019): An assessment of online platforms prescribing birth control in the USA",
        "summary": "Comparing nine US online birth control platforms against CDC eligibility criteria, the authors found they appear to screen adequately for contraindications and prescribe safely, though their health questionnaires could be more rigorous."
      }
    ],
    "clinicalNote": "Wisp visits are asynchronous, which means you fill out a health form and a licensed clinician reviews it later, with no live appointment. A 2019 study of nine US online birth control platforms found they generally did a good job screening for health conditions that make some methods unsafe, judged against CDC guidelines, though the authors said the health questionnaires could be more thorough. A federal evidence review from AHRQ (the Agency for Healthcare Research and Quality) found that telehealth birth control care led to similar results as usual care, such as similar pregnancy rates, but the strength of that evidence is low and no studies looked at harms. The same review found STI rates were similar between telehealth and in-person care, again with low-strength evidence. Your clinician's decision is based on what you report, so answer the health questions fully and honestly.",
    "clinicalNoteSources": [
      {
        "url": "https://www.ibisreproductivehealth.org/node/1010",
        "label": "J Telemed Telecare 2019 (Zuniga et al.), doi:10.1177/1357633X18824828: Assessment of online platforms prescribing birth control in the USA (Ibis Reproductive Health summary)",
        "summary": "Found US online birth control platforms adequately screened for contraindications under CDC guidelines, with room to make questionnaires more rigorous."
      },
      {
        "url": "https://www.aafp.org/afp/2023/0500/ahrq-telehealth-womens-preventive-services.pdf",
        "label": "American Family Physician 2023 (AAFP), summarizing AHRQ Comparative Effectiveness Review No. 256: Effectiveness of Telehealth for Women's Preventive Services",
        "summary": "Telehealth contraception and STI care had similar outcomes to in-person or usual care, with low strength of evidence; harms were not studied."
      }
    ],
    "warnings": [
      "Do not use Wisp for emergencies: call 911 or go to the nearest emergency room.",
      "Not every condition is suitable for telehealth, and your provider may decide it is not right for your case.",
      "If you have a bad reaction, your symptoms get worse, or you need follow-up, seek in-person or emergency care.",
      "Your provider relies on the information you give, so keep it complete and accurate."
    ],
    "warningsSource": {
      "url": "https://hellowisp.com/informed-consent",
      "label": "Wisp: Consent to Telehealth Services"
    }
  },
  "d-hers": {
    "whoItsFor": [
      "People who want online visits with licensed providers for concerns like sexual health, skin care or mental health",
      "Those who want prescription or over-the-counter treatments delivered after an online visit",
      "Not the pick for concerns that need a hands-on exam, which an online visit can't replace"
    ],
    "howToUse": {
      "intro": "Per Hers's own description of how its online care works:",
      "steps": [
        "Start with a short online assessment about your health, goals and medical history.",
        "Wait for a licensed provider to review your answers; some states also require a phone or video call.",
        "If the provider decides a treatment fits, they write a prescription and set up your plan.",
        "Get your medication shipped to your door.",
        "Use the Hers app to message your provider with questions and for follow-up check-ins."
      ],
      "sourceUrl": "https://www.forhers.com/blog/getting-weight-loss-medication-through-hers",
      "sourceLabel": "Hers: Getting weight loss medication through Hers"
    },
    "clinicalNote": "Telehealth can work well for some women's health needs, but the research is still thin. A federal evidence review from AHRQ (the Agency for Healthcare Research and Quality) found telehealth gave similar results to usual care for birth control and STI care, and was at least as good as usual care for depression scores in women affected by partner violence, but rated all of this evidence as low strength and found little data on harms. That fits the existing advice here: some concerns are fine online, and some need an in-person exam.",
    "clinicalNoteSources": [
      {
        "url": "https://www.aafp.org/afp/2023/0500/ahrq-telehealth-womens-preventive-services.pdf",
        "label": "American Family Physician 2023 (AAFP), summarizing AHRQ Comparative Effectiveness Review No. 256: Effectiveness of Telehealth for Women's Preventive Services",
        "summary": "Telehealth for contraception, STI care, and depression in women affected by partner violence had similar or better outcomes than usual care, all with low strength of evidence."
      }
    ],
    "warnings": [
      "If it is an emergency, call 911; for thoughts of suicide, call 911 or the 988 Suicide and Crisis Lifeline.",
      "Telehealth is not right for every situation, and some conditions may need emergency, in-person, or specialist care.",
      "If you get lab tests, you are responsible for sharing results with your primary care doctor and following up.",
      "Give your provider truthful, complete information, since your care is based on it."
    ],
    "warningsSource": {
      "url": "https://www.forhers.com/telehealth-consent",
      "label": "Hers: Telehealth Consent"
    }
  },
  "d-midi-health": {
    "whoItsFor": [
      "Women in perimenopause or menopause who want care from clinicians focused on this stage of life",
      "Those who want to talk through hormone therapy and other prescriptions without an in-person visit, where available in their state",
      "Anyone who wants a personalized care plan for perimenopause and menopause symptoms"
    ],
    "howToUse": {
      "intro": "Per Midi Health's own description of how it works:",
      "steps": [
        "Book a virtual visit on the Midi website.",
        "Check your coverage first: Midi is in-network with most PPO plans, and self-pay prices are listed for everyone else.",
        "Meet your Midi clinician by video to talk through your symptoms and options.",
        "Get your personalized care plan, including any prescriptions your clinician decides are right for you.",
        "Keep up with regular check-ins to adjust your plan over time."
      ],
      "sourceUrl": "https://www.joinmidi.com/premenopause",
      "sourceLabel": "Midi Health: How Midi works"
    },
    "clinicalSources": [
      {
        "url": "https://menopause.org/wp-content/uploads/press-release/ht-position-statement-release.pdf",
        "label": "The Menopause Society: 2022 Hormone Therapy Position Statement (press release)",
        "summary": "For most healthy women with symptoms who are under 60 or within 10 years of menopause, the benefits of hormone therapy generally outweigh the risks, and dose, route and duration should be personalized through shared decision-making."
      }
    ],
    "scienceSources": [
      {
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC8785511",
        "label": "Wright et al., Menopause (2022): patient satisfaction with telephone menopause visits",
        "summary": "At a Toronto menopause clinic, patients rated remote visits highly (4.23 out of 5), and about 80% of those who had been seen in person before preferred the remote visits."
      },
      {
        "url": "https://research.monash.edu/en/publications/the-impact-of-covid-19-on-a-specialised-menopause-clinic-changes-/",
        "label": "Kozica-Olenski et al., Australian and New Zealand Journal of Obstetrics and Gynaecology (2023)",
        "summary": "When a specialist menopause clinic moved to telehealth, 70% of surveyed women were satisfied, and most preferred an in-person first visit with telehealth for follow-ups, so the authors recommended a hybrid model."
      }
    ],
    "clinicalNote": "Midi's clinicians can prescribe hormone therapy when it is appropriate. The Menopause Society's 2022 position statement says its benefits outweigh its risks for most healthy women with symptoms who are under 60 or within 10 years of their last period. It also says the dose, form and length of treatment should be chosen with you, that hormones taken through the skin (such as patches) and lower doses may lower the risk of blood clots and stroke, and that the balance of benefits and risks should be rechecked over time, which makes regular follow-up visits important whether they are virtual or in person.",
    "clinicalNoteSources": [
      {
        "url": "https://menopause.org/wp-content/uploads/press-release/ht-position-statement-release.pdf",
        "label": "The Menopause Society: 2022 Hormone Therapy Position Statement (press release)",
        "summary": "Says hormone therapy benefits outweigh risks for most healthy symptomatic women under 60 or within 10 years of menopause, with personalized dosing and periodic reevaluation."
      }
    ],
    "warnings": [
      "If you have a medical emergency, get in-person emergency care right away or call 911.",
      "The service is not right for every medical condition or concern.",
      "Telehealth does not replace in-person care in all cases; some conditions need an in-person procedure or another provider.",
      "The service is only available in states where Midi operates."
    ],
    "warningsSource": {
      "url": "https://joinmidi.com/legals/terms-and-conditions",
      "label": "Midi Health: Terms and Conditions"
    }
  },
  "d-pomelo-care": {
    "whoItsFor": [
      "People whose employer or health plan covers Pomelo and who want extra support between in-person visits",
      "Those who want 24/7 access to clinicians, midwives, doulas and therapists",
      "Anyone who wants help with education, triage and follow-up during pregnancy and beyond, depending on what their plan includes"
    ],
    "howToUse": {
      "intro": "Per Pomelo Care's own getting-started page:",
      "steps": [
        "Fill out the 1-minute form to confirm your eligibility through your employer or health plan.",
        "Activate your benefit and register.",
        "Book your first appointment and download the Pomelo app.",
        "Message your care team in the app, or reach them by phone or video, any time of day.",
        "Keep seeing your in-person OB or midwife, since Pomelo supports you between visits rather than replacing them."
      ],
      "sourceUrl": "https://www.pomelocare.com/getstarted",
      "sourceLabel": "Pomelo Care: Get started"
    },
    "clinicalNote": "Evidence on virtual pregnancy and women's health care is promising but still early. A 2020 systematic review in Obstetrics and Gynecology found text messaging may help with things like quitting smoking in pregnancy, breastfeeding and taking birth control consistently, and that remote monitoring and virtual visits helped where getting to a clinic was hard, while its lead author noted we still know very little about how well these tools work. In a large Kaiser Permanente study of about 151,000 pregnancies, swapping some routine prenatal visits for virtual ones was not linked to meaningful changes in outcomes like preeclampsia, preterm birth, or cesarean birth, apart from a slight rise in newborn intensive care (NICU) admissions in one period.",
    "clinicalNoteSources": [
      {
        "url": "https://smhs.gwu.edu/news/telehealth-interventions-associated-improved-obstetric-outcomes",
        "label": "George Washington University School of Medicine: summary of DeNicola et al., Obstet Gynecol 2020, doi:10.1097/AOG.0000000000003646, systematic review of telehealth in OB-GYN",
        "summary": "Systematic review finding text messaging and remote monitoring may support some pregnancy and contraception outcomes, with much still unknown."
      },
      {
        "url": "https://www.cidrap.umn.edu/covid-19/hybrid-prenatal-care-not-tied-worse-maternal-newborn-health-amid-covid-19",
        "label": "University of Minnesota CIDRAP: summary of Kaiser Permanente study in JAMA Network Open on hybrid virtual prenatal care",
        "summary": "Converting several routine prenatal visits to virtual care in 151,464 pregnancies showed no clinically relevant changes in most outcomes, with a slight rise in NICU admissions in one period."
      }
    ],
    "warnings": [
      "Do not use Pomelo Care if you may be having a medical emergency: call 911 or go to the nearest emergency room.",
      "Some services are only available in certain states.",
      "Pomelo notes that its AI tools are still evolving and may not always be error-free or right for your situation."
    ],
    "warningsSource": {
      "url": "https://www.pomelocare.com/terms-of-service",
      "label": "Pomelo Care: Terms of Service"
    }
  },
  "p-lola-pad": {
    "clinicalSources": [
      {
        "url": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-pads-and-liners",
        "label": "FDA: Menstrual pads and liners",
        "summary": "Pads are FDA-regulated devices; the FDA advises changing them every few hours even on light days, notes some people react to scents or other added materials, and says to stop use and call a provider for itching, rash, pain or swelling."
      }
    ],
    "warnings": [
      "Change your pad every few hours, even if your flow is light, and more often on heavy days.",
      "Wearing a pad too long may irritate your skin.",
      "Some people react to scents or other materials added to pads.",
      "If you get itching, a rash, pain, swelling, or discomfort, stop using the pad and contact your healthcare provider."
    ],
    "warningsSource": {
      "url": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-pads-and-liners",
      "label": "FDA: Menstrual Pads and Liners (safe use)"
    }
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
    "clinicalNote": "The FDA notes that some people react to scents, deodorants or other materials added to pads, and that wearing a pad too long can irritate skin. Changing every few hours, even on light days, matters as much as what the pad is made of.",
    "scienceSources": [
      {
        "url": "https://synapse.koreamed.org/articles/1130139",
        "label": "Woo et al., Systematic Review on Sanitary Pads and Female Health, Ewha Medical Journal (2019)",
        "summary": "Found no clear cause-and-effect link between pads and skin or vaginal health effects and said the evidence is too thin to prove harm or confirm safety."
      },
      {
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC7958867/",
        "label": "Lin, Batterman et al., Environment International (2020): volatile organic compounds in feminine hygiene products",
        "summary": "Testing of US feminine hygiene products, including pads, found that 'organic' or 'natural' labels did not reliably mean lower levels of volatile organic compounds, and scented pads had more aromatic compounds than unscented ones."
      }
    ],
    "ingredientScience": [
      {
        "name": "Organic cotton",
        "text": "Cotton is the part that touches your skin. One small Italian study in women with irritated vulvar skin (vulvitis) reported fewer itching and irritation complaints with organic cotton pads than with their usual synthetic pads, but the abstract does not say how many women took part and there was no clear control group, so treat this as weak evidence.",
        "citations": [
          {
            "url": "https://pubmed.ncbi.nlm.nih.gov/30465412/",
            "label": "Minerva Ginecologica 2018 (Mori et al.), doi:10.23736/S0026-4784.18.04338-1: Safety and skin tolerability of organic cotton pads in irritative vulvitis"
          }
        ]
      }
    ],
    "warnings": [
      "Change your pad every few hours, even if your flow is light, and more often on heavy days.",
      "Wearing a pad too long may irritate your skin.",
      "Some people react to scents or other materials added to pads.",
      "If you get itching, a rash, pain, swelling, or discomfort, stop using the pad and contact your healthcare provider."
    ],
    "warningsSource": {
      "url": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-pads-and-liners",
      "label": "FDA: Menstrual Pads and Liners (safe use)"
    }
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
    },
    "scienceSources": [
      {
        "url": "https://synapse.koreamed.org/articles/1130139",
        "label": "Woo et al., Systematic Review on Sanitary Pads and Female Health, Ewha Medical Journal (2019)",
        "summary": "Found no clear cause-and-effect link between pads and skin or vaginal health effects and said the evidence is too thin to prove harm or confirm safety."
      },
      {
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC7958867/",
        "label": "Lin, Batterman et al., Environment International (2020): volatile organic compounds in feminine hygiene products",
        "summary": "Testing of US feminine hygiene products, including pads, found that 'organic' or 'natural' labels did not reliably mean lower levels of volatile organic compounds, and scented pads had more aromatic compounds than unscented ones."
      }
    ],
    "ingredientScience": [
      {
        "name": "Organic cotton",
        "text": "Cotton is the part that touches your skin. One small Italian study in women with irritated vulvar skin (vulvitis) reported fewer itching and irritation complaints with organic cotton pads than with their usual synthetic pads, but the abstract does not say how many women took part and there was no clear control group, so treat this as weak evidence.",
        "citations": [
          {
            "url": "https://pubmed.ncbi.nlm.nih.gov/30465412/",
            "label": "Minerva Ginecologica 2018 (Mori et al.), doi:10.23736/S0026-4784.18.04338-1: Safety and skin tolerability of organic cotton pads in irritative vulvitis"
          }
        ]
      }
    ],
    "clinicalNote": "Pads are regulated by the FDA as medical devices, and FDA advises changing them every few hours, even on light days, because wearing one too long can irritate your skin. Clinicians who treat vulvar irritation often suggest 100% cotton pads for people with sensitive skin, and one small study found fewer irritation complaints with organic cotton pads, though the evidence is limited. A 2019 systematic review of pad safety found too few studies to say for sure whether pad chemicals affect long-term health.",
    "clinicalNoteSources": [
      {
        "url": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-pads-and-liners",
        "label": "FDA: Menstrual Pads and Liners",
        "summary": "Explains how FDA regulates pads and gives safe-use tips, including changing them every few hours."
      },
      {
        "url": "https://www.med.umich.edu/1libr/Gyn/ObgynClinic/ComfortMeasuresVulvarIrritationItchingPain.pdf",
        "label": "University of Michigan Health, OB/GYN Clinic: Comfort measures for vulvar irritation, itching and pain",
        "summary": "Lists pads and liners as possible vulvar irritants and suggests 100% cotton menstrual pads for people prone to irritation."
      },
      {
        "url": "https://pubmed.ncbi.nlm.nih.gov/30465412/",
        "label": "Minerva Ginecologica 2018 (Mori et al.), doi:10.23736/S0026-4784.18.04338-1: Safety and skin tolerability of organic cotton pads in irritative vulvitis",
        "summary": "Small study reporting fewer itching and irritation complaints with organic cotton pads than with synthetic pads, without a clear control group."
      },
      {
        "url": "https://synapse.koreamed.org/articles/1130139",
        "label": "Ewha Medical Journal 2019 (Woo et al.), doi:10.12771/emj.2019.42.3.25: Systematic Review on Sanitary Pads and Female Health",
        "summary": "Reviews chemicals found in pads and finds evidence on health effects limited and no clear causal link."
      }
    ],
    "warnings": [
      "Change your pad every few hours, even if your flow is light, and more often on heavy days.",
      "Wearing a pad too long may irritate your skin.",
      "Some people react to scents or other materials added to pads.",
      "If you get itching, a rash, pain, swelling, or discomfort, stop using the pad and contact your healthcare provider."
    ],
    "warningsSource": {
      "url": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-pads-and-liners",
      "label": "FDA: Menstrual Pads and Liners (safe use)"
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
    },
    "scienceSources": [
      {
        "url": "https://synapse.koreamed.org/articles/1130139",
        "label": "Woo et al., Systematic Review on Sanitary Pads and Female Health, Ewha Medical Journal (2019)",
        "summary": "Found no clear cause-and-effect link between pads and skin or vaginal health effects and said the evidence is too thin to prove harm or confirm safety."
      },
      {
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC7958867/",
        "label": "Lin, Batterman et al., Environment International (2020): volatile organic compounds in feminine hygiene products",
        "summary": "Testing of US feminine hygiene products, including pads, found that 'organic' or 'natural' labels did not reliably mean lower levels of volatile organic compounds, and scented pads had more aromatic compounds than unscented ones."
      }
    ],
    "ingredientScience": [
      {
        "name": "Natural cotton",
        "text": "Cotton is the layer against your skin. An OB-GYN writing for Harvard Health suggests unscented cotton pads without a mesh covering, changed every 2 to 6 hours, to keep vulvar skin comfortable. That is expert advice, not proof from trials that cotton pads cause less irritation.",
        "citations": [
          {
            "url": "https://www.health.harvard.edu/blog/vulvar-health-navigating-the-nether-regions-2019040116322",
            "label": "Harvard Health Blog (Huma Farid, MD, 2019): Vulvar health"
          }
        ]
      }
    ],
    "clinicalNote": "Pads are regulated by the FDA as medical devices, and FDA advises changing them every few hours, even on light days, because wearing one too long can irritate your skin. Unscented cotton pads are a sensible choice if your skin is sensitive, but a 2019 systematic review found no clear link between pad materials and health problems, and it noted the backing is usually a polyethylene (plastic) film with adhesive, as in this pad.",
    "clinicalNoteSources": [
      {
        "url": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-pads-and-liners",
        "label": "FDA: Menstrual Pads and Liners",
        "summary": "Explains how FDA regulates pads and gives safe-use tips, including changing them every few hours."
      },
      {
        "url": "https://www.health.harvard.edu/blog/vulvar-health-navigating-the-nether-regions-2019040116322",
        "label": "Harvard Health Blog (Huma Farid, MD, 2019): Vulvar health",
        "summary": "Advises unscented cotton pads without a mesh covering, changed every 2 to 6 hours, and avoiding scented feminine products."
      },
      {
        "url": "https://synapse.koreamed.org/articles/1130139",
        "label": "Ewha Medical Journal 2019 (Woo et al.), doi:10.12771/emj.2019.42.3.25: Systematic Review on Sanitary Pads and Female Health",
        "summary": "Describes how pads are built and finds evidence on health effects of pad chemicals limited, with no clear causal link."
      }
    ],
    "warnings": [
      "Change your pad every few hours, even if your flow is light, and more often on heavy days.",
      "Wearing a pad too long may irritate your skin.",
      "Some people react to scents or other materials added to pads.",
      "If you get itching, a rash, pain, swelling, or discomfort, stop using the pad and contact your healthcare provider."
    ],
    "warningsSource": {
      "url": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-pads-and-liners",
      "label": "FDA: Menstrual Pads and Liners (safe use)"
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
    ],
    "ingredientScience": [
      {
        "name": "Organic cotton",
        "text": "There's no good evidence yet that organic cotton pads are better for your skin or health than regular ones. A 2019 review of pad safety found no studies comparing the two, and found dioxin levels in US pads were lower than what people take in from food.",
        "citations": [
          {
            "url": "https://synapse.koreamed.org/upload/synapsedata/pdfdata/0201emj/emj-42-25.pdf",
            "label": "Ewha Medical Journal (2019): Systematic Review on Sanitary Pads and Female Health"
          }
        ]
      }
    ],
    "clinicalNote": "Research on pads and vaginal or skin health is thin: a 2019 review found the evidence limited, with small studies and no clear cause and effect for any harm. The FDA says to change pads every few hours, even on light days, because wearing one too long can irritate your skin. The FDA also notes that some people react to scents, deodorants, or other added materials in pads.",
    "clinicalNoteSources": [
      {
        "url": "https://synapse.koreamed.org/upload/synapsedata/pdfdata/0201emj/emj-42-25.pdf",
        "label": "Ewha Medical Journal (2019): Systematic Review on Sanitary Pads and Female Health",
        "summary": "Review of pad safety studies; found limited evidence and low dioxin levels in US products."
      },
      {
        "url": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-pads-and-liners",
        "label": "FDA: Menstrual Pads and Liners (includes period underwear)",
        "summary": "FDA safe-use guidance for pads and liners, including change frequency and irritation."
      }
    ],
    "warnings": [
      "Change pads every few hours, even on light days, and more often on heavy days.",
      "Wearing a pad too long can irritate your skin.",
      "Stop using the pad and call your provider if you get itching, a rash, pain, swelling, or discomfort."
    ],
    "warningsSource": {
      "url": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-pads-and-liners",
      "label": "FDA: Menstrual Pads and Liners (includes period underwear)"
    }
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
    },
    "ingredientScience": [
      {
        "name": "Organic cotton core",
        "text": "All FDA-authorized tampons are cotton, rayon, or a blend, bleached without elemental chlorine. The FDA found trace metals in both organic and conventional tampons at levels too low to cause harm, so the FDA's findings don't show organic cotton tampons to be safer than regular ones.",
        "citations": [
          {
            "url": "https://www.fda.gov/forconsumers/consumerupdates/ucm612029.htm",
            "label": "FDA Consumer Update: The Facts on Tampons and How to Use Them Safely"
          }
        ]
      }
    ],
    "clinicalNote": "FDA-authorized tampons are made of cotton, rayon, or a blend, and the fibers are bleached without elemental chlorine, which the FDA says keeps dioxin (a pollutant) from reaching dangerous levels. The FDA has found very small amounts of metals in both conventional and organic tampons, but says the amount likely released during use is too small to cause harm. Toxic shock syndrome (TSS) is rare, and the FDA ties lower risk to using the lowest absorbency you need and wearing each tampon no more than 8 hours.",
    "clinicalNoteSources": [
      {
        "url": "https://www.fda.gov/forconsumers/consumerupdates/ucm612029.htm",
        "label": "FDA Consumer Update: The Facts on Tampons and How to Use Them Safely",
        "summary": "FDA overview of tampon materials, chlorine-free bleaching, trace metals in conventional and organic tampons, and TSS."
      },
      {
        "url": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/tampons",
        "label": "FDA: Tampons (Menstrual Product Options, Facts, and Safe Use)",
        "summary": "FDA safe-use guidance: absorbency, 4 to 8 hour changes, TSS symptoms, and when not to use a tampon."
      }
    ],
    "warnings": [
      "Use the lowest absorbency tampon you need.",
      "Change your tampon every 4 to 8 hours, and never wear one for more than 8 hours.",
      "If you get a sudden high fever, vomiting, diarrhea, rash, dizziness, or fainting, remove the tampon and contact your provider or go to the ER.",
      "Only use tampons during your period, not for other bleeding or discharge, like after childbirth."
    ],
    "warningsSource": {
      "url": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/tampons",
      "label": "FDA: Tampons (Menstrual Product Options, Facts, and Safe Use)"
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
    ],
    "clinicalNote": "FDA-authorized tampons are made of cotton, rayon, or a blend, and the fibers are bleached without elemental chlorine, which the FDA says keeps dioxin (a pollutant) from reaching dangerous levels. The FDA has found very small amounts of metals in both conventional and organic tampons, but says the amount likely released during use is too small to cause harm. Toxic shock syndrome (TSS) is rare, and the FDA ties lower risk to using the lowest absorbency you need and wearing each tampon no more than 8 hours. With a non-applicator tampon you push it in with a clean finger, so the FDA's advice to wash your hands before and after matters even more.",
    "clinicalNoteSources": [
      {
        "url": "https://www.fda.gov/forconsumers/consumerupdates/ucm612029.htm",
        "label": "FDA Consumer Update: The Facts on Tampons and How to Use Them Safely",
        "summary": "FDA overview of tampon materials, chlorine-free bleaching, trace metals in conventional and organic tampons, and TSS."
      },
      {
        "url": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/tampons",
        "label": "FDA: Tampons (Menstrual Product Options, Facts, and Safe Use)",
        "summary": "FDA safe-use guidance: absorbency, 4 to 8 hour changes, TSS symptoms, and when not to use a tampon."
      }
    ],
    "warnings": [
      "Use the lowest absorbency tampon you need.",
      "Change your tampon every 4 to 8 hours, and never wear one for more than 8 hours.",
      "If you get a sudden high fever, vomiting, diarrhea, rash, dizziness, or fainting, remove the tampon and contact your provider or go to the ER.",
      "Only use tampons during your period, not for other bleeding or discharge, like after childbirth."
    ],
    "warningsSource": {
      "url": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/tampons",
      "label": "FDA: Tampons (Menstrual Product Options, Facts, and Safe Use)"
    }
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
    ],
    "clinicalNote": "FDA-authorized tampons are made of cotton, rayon, or a blend, and the fibers are bleached without elemental chlorine, which the FDA says keeps dioxin (a pollutant) from reaching dangerous levels. The FDA has found very small amounts of metals in both conventional and organic tampons, but says the amount likely released during use is too small to cause harm. Toxic shock syndrome (TSS) is rare, and the FDA ties lower risk to using the lowest absorbency you need and wearing each tampon no more than 8 hours.",
    "clinicalNoteSources": [
      {
        "url": "https://www.fda.gov/forconsumers/consumerupdates/ucm612029.htm",
        "label": "FDA Consumer Update: The Facts on Tampons and How to Use Them Safely",
        "summary": "FDA overview of tampon materials, chlorine-free bleaching, trace metals in conventional and organic tampons, and TSS."
      },
      {
        "url": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/tampons",
        "label": "FDA: Tampons (Menstrual Product Options, Facts, and Safe Use)",
        "summary": "FDA safe-use guidance: absorbency, 4 to 8 hour changes, TSS symptoms, and when not to use a tampon."
      }
    ],
    "warnings": [
      "Use the lowest absorbency tampon you need.",
      "Change your tampon every 4 to 8 hours, and never wear one for more than 8 hours.",
      "If you get a sudden high fever, vomiting, diarrhea, rash, dizziness, or fainting, remove the tampon and contact your provider or go to the ER.",
      "Only use tampons during your period, not for other bleeding or discharge, like after childbirth."
    ],
    "warningsSource": {
      "url": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/tampons",
      "label": "FDA: Tampons (Menstrual Product Options, Facts, and Safe Use)"
    }
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
    },
    "ingredientScience": [
      {
        "name": "Medical-grade silicone",
        "text": "Silicone is one of the two usual materials for menstrual cups and discs, the other being rubber. The FDA says to choose silicone if you're sensitive to latex, since rubber cups can cause reactions in people with latex allergies. There are no studies comparing one brand's silicone to another's.",
        "citations": [
          {
            "url": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-cups",
            "label": "FDA: Menstrual Cups"
          }
        ]
      }
    ],
    "clinicalNote": "A 2019 review in The Lancet Public Health pooled 43 studies with 3,319 people and found menstrual cups leaked about the same as or less than pads and tampons, and about 73% of people wanted to keep using one. Most people needed a few periods to get comfortable with it. The review counted 5 cases of toxic shock syndrome (TSS, a rare but serious bacterial illness) after cup use, and 13 cases where a cup pulled an IUD (intrauterine device, a type of birth control) out of place. The FDA says to talk with your gynecologist before using a cup if you have an IUD.",
    "clinicalNoteSources": [
      {
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC6669309/",
        "label": "The Lancet Public Health (2019): Menstrual cup use, leakage, acceptability, safety, and availability, a systematic review and meta-analysis",
        "summary": "Pooled 43 studies on cup leakage, acceptability, and safety, including TSS and IUD dislodgement cases."
      },
      {
        "url": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-cups",
        "label": "FDA: Menstrual Cups (also called menstrual discs)",
        "summary": "FDA safe-use guidance for cups and discs, including materials, cleaning, wear time, and IUD advice."
      }
    ],
    "warnings": [
      "Wash your hands before inserting or removing the cup.",
      "If you feel any discomfort, stop using the cup and contact your doctor.",
      "If you get a sudden high fever, vomiting, diarrhea, dizziness, fainting, or a sunburn-like rash, stop using the cup right away and get medical care.",
      "Don't use foreign objects to remove the cup, and take care with long nails."
    ],
    "warningsSource": {
      "url": "https://shopdiva.com/blogs/the-conscious-cycle/toxic-shock-syndrome-and-menstrual-cups",
      "label": "DIVA (DivaCup maker): Toxic shock syndrome and menstrual cups"
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
    },
    "ingredientScience": [
      {
        "name": "Medical-grade silicone",
        "text": "Silicone is one of the two usual materials for menstrual cups and discs, the other being rubber. The FDA says to choose silicone if you're sensitive to latex, since rubber cups can cause reactions in people with latex allergies. There are no studies comparing one brand's silicone to another's.",
        "citations": [
          {
            "url": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-cups",
            "label": "FDA: Menstrual Cups"
          }
        ]
      }
    ],
    "clinicalNote": "A 2019 review in The Lancet Public Health pooled 43 studies with 3,319 people and found menstrual cups leaked about the same as or less than pads and tampons, and about 73% of people wanted to keep using one. Most people needed a few periods to get comfortable with it. The review counted 5 cases of toxic shock syndrome (TSS, a rare but serious bacterial illness) after cup use, and 13 cases where a cup pulled an IUD (intrauterine device, a type of birth control) out of place. The FDA says to talk with your gynecologist before using a cup if you have an IUD.",
    "clinicalNoteSources": [
      {
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC6669309/",
        "label": "The Lancet Public Health (2019): Menstrual cup use, leakage, acceptability, safety, and availability, a systematic review and meta-analysis",
        "summary": "Pooled 43 studies on cup leakage, acceptability, and safety, including TSS and IUD dislodgement cases."
      },
      {
        "url": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-cups",
        "label": "FDA: Menstrual Cups (also called menstrual discs)",
        "summary": "FDA safe-use guidance for cups and discs, including materials, cleaning, wear time, and IUD advice."
      }
    ],
    "warnings": [
      "Wear it for up to 12 hours, and break the seal before you pull the cup out.",
      "If you notice TSS symptoms, remove the cup, get medical advice right away, and say you've been using a cup.",
      "If you have an IUD, contraceptive ring, or gynecological problems, check with your doctor first.",
      "It is not a contraceptive, should only be used during your period, and shouldn't be shared."
    ],
    "warningsSource": {
      "url": "https://lunette.com/products/menstrual-cup",
      "label": "Lunette: Period Cup product page"
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
    "clinicalNote": "The FDA regulates menstrual cups and discs as medical devices and says insertion and removal can take practice. Check with your gynecologist before using one with an IUD, since it could interfere with the strings or placement.",
    "scienceSources": [
      {
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC10847380/",
        "label": "DeLoughery et al., BMJ Sexual & Reproductive Health (2024): red blood cell capacity of menstrual products",
        "summary": "In lab testing of 21 period products, menstrual discs held the most blood of any category (about 61 mL on average), though the authors note real-world capacity may be lower because products bend during wear."
      }
    ],
    "ingredientScience": [
      {
        "name": "Medical-grade silicone",
        "text": "Silicone is one of the two usual materials for menstrual cups and discs, the other being rubber. The FDA says to choose silicone if you're sensitive to latex, since rubber cups can cause reactions in people with latex allergies. There are no studies comparing one brand's silicone to another's.",
        "citations": [
          {
            "url": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-cups",
            "label": "FDA: Menstrual Cups"
          }
        ]
      }
    ],
    "warnings": [
      "If you have an IUD, check with your doctor before first use.",
      "Empty and clean the disc at least every 12 hours, and wash your hands before removing it.",
      "Boil it for at least 5 minutes before first use and between cycles.",
      "Use only water-based lubricant, since oil and silicone products can break down the silicone."
    ],
    "warningsSource": {
      "url": "https://nixit.ca/products/nixit-menstrual-disc",
      "label": "Nixit: Menstrual Disc product page (lubricant note from Nixit's IUD article, https://nixit.ca/a/blog/can-you-use-a-menstrual-disc-with-an-iud)"
    }
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
    "clinicalNote": "The FDA regulates menstrual cups and discs as medical devices and says insertion and removal can take practice. Check with your gynecologist before using one with an IUD, since it could interfere with the strings or placement.",
    "scienceSources": [
      {
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC10847380/",
        "label": "DeLoughery et al., BMJ Sexual & Reproductive Health (2024): red blood cell capacity of menstrual products",
        "summary": "In lab testing of 21 period products, menstrual discs held the most blood of any category (about 61 mL on average), though the authors note real-world capacity may be lower because products bend during wear."
      }
    ],
    "ingredientScience": [
      {
        "name": "Medical-grade silicone",
        "text": "Silicone is one of the two usual materials for menstrual cups and discs, the other being rubber. The FDA says to choose silicone if you're sensitive to latex, since rubber cups can cause reactions in people with latex allergies. There are no studies comparing one brand's silicone to another's.",
        "citations": [
          {
            "url": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-cups",
            "label": "FDA: Menstrual Cups"
          }
        ]
      }
    ],
    "warnings": [
      "Do not use if you have had toxic shock syndrome.",
      "If you have an IUD, a history of prolapse, a pre-existing condition, or gynecological concerns, check with your doctor before use.",
      "Wear it for up to 12 hours.",
      "If you have side effects, stop using it and contact your doctor."
    ],
    "warningsSource": {
      "url": "https://www.target.com/p/cora-reusable-menstrual-disc-1ct/-/A-82433921",
      "label": "Cora Reusable Menstrual Disc label text (Target product listing)"
    }
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
    },
    "scienceSources": [
      {
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC10847380/",
        "label": "DeLoughery et al., BMJ Sexual & Reproductive Health (2024): red blood cell capacity of menstrual products",
        "summary": "In lab testing with real blood cells, period underwear held the least of any product type, about 2 mL on average, compared with roughly 20 to 50 mL for heavy pads, tampons and cups."
      },
      {
        "url": "https://axial.acs.org/environmental-and-sustainable-chemistry/forever-chemicals-in-feminine-hygiene-products-expanded-findings-raise-new-pfas-concerns",
        "label": "American Chemical Society summary of Wicks, Peaslee et al., Environmental Science & Technology Letters (2025): PFAS in reusable feminine hygiene products",
        "summary": "Researchers tested 59 reusable period products, including period underwear, and found PFAS in all 19 products they screened in detail, which is why independent PFAS-free claims matter for this category."
      }
    ],
    "clinicalNote": "The FDA groups period underwear with pads and liners: it works like a built-in pad, but you wash and reuse it. The FDA says to follow the label's cleaning instructions, not to reuse it longer than the maker recommends, and to change it regularly, since wearing a menstrual product too long lets bacteria grow. We didn't find clinical studies of period underwear for leaks or skin health, so there's little research on this product type.",
    "clinicalNoteSources": [
      {
        "url": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-pads-and-liners",
        "label": "FDA: Menstrual Pads and Liners (includes period underwear)",
        "summary": "FDA safe-use guidance for pads, liners, and period underwear."
      }
    ],
    "warnings": [
      "Follow the label's washing instructions.",
      "Don't reuse period underwear longer than the maker recommends.",
      "Change it regularly, more often on heavy days, since wearing a menstrual product too long lets bacteria grow.",
      "Stop using it and call your provider if you get itching, a rash, pain, swelling, or discomfort."
    ],
    "warningsSource": {
      "url": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-pads-and-liners",
      "label": "FDA: Menstrual Pads and Liners (includes period underwear)"
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
    },
    "scienceSources": [
      {
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC10847380/",
        "label": "DeLoughery et al., BMJ Sexual & Reproductive Health (2024): red blood cell capacity of menstrual products",
        "summary": "In lab testing with real blood cells, period underwear held the least of any product type, about 2 mL on average, compared with roughly 20 to 50 mL for heavy pads, tampons and cups."
      },
      {
        "url": "https://axial.acs.org/environmental-and-sustainable-chemistry/forever-chemicals-in-feminine-hygiene-products-expanded-findings-raise-new-pfas-concerns",
        "label": "American Chemical Society summary of Wicks, Peaslee et al., Environmental Science & Technology Letters (2025): PFAS in reusable feminine hygiene products",
        "summary": "Researchers tested 59 reusable period products, including period underwear, and found PFAS in all 19 products they screened in detail, which shows why it helps to check a brand's PFAS testing."
      }
    ],
    "clinicalNote": "The FDA groups period underwear with pads and liners: it works like a built-in pad, but you wash and reuse it. The FDA says to follow the label's cleaning instructions, not to reuse it longer than the maker recommends, and to change it regularly, since wearing a menstrual product too long lets bacteria grow. We didn't find clinical studies of period underwear for leaks or skin health, so there's little research on this product type.",
    "clinicalNoteSources": [
      {
        "url": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-pads-and-liners",
        "label": "FDA: Menstrual Pads and Liners (includes period underwear)",
        "summary": "FDA safe-use guidance for pads, liners, and period underwear."
      }
    ],
    "warnings": [
      "Follow the label's washing instructions.",
      "Don't reuse period underwear longer than the maker recommends.",
      "Change it regularly, more often on heavy days, since wearing a menstrual product too long lets bacteria grow.",
      "Stop using it and call your provider if you get itching, a rash, pain, swelling, or discomfort."
    ],
    "warningsSource": {
      "url": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-pads-and-liners",
      "label": "FDA: Menstrual Pads and Liners (includes period underwear)"
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
    ],
    "ingredientScience": [
      {
        "name": "Nitrite test pad",
        "text": "Many UTI bacteria turn nitrate in urine into nitrite, so a positive nitrite pad points fairly strongly to infection. A negative one doesn't rule it out: bacteria need about four hours in the bladder to make nitrite, some germs like Enterococcus don't make it, and vitamin C can cause a false negative. The pain reliever phenazopyridine can cause a false positive.",
        "citations": [
          {
            "url": "https://www.aafp.org/pubs/afp/issues/2022/0700/office-based-urinalysis.html",
            "label": "American Family Physician (AAFP), 2022: Office-Based Urinalysis: A Comprehensive Review"
          }
        ]
      },
      {
        "name": "Leukocyte esterase test pad",
        "text": "Leukocyte esterase is an enzyme from white blood cells, so it flags inflammation or infection, not bacteria directly. In low-risk people, both pads being negative helps rule out a UTI, but in women with vague symptoms a positive or negative strip may still need a urine culture (a lab test that grows the bacteria).",
        "citations": [
          {
            "url": "https://www.aafp.org/pubs/afp/issues/2006/0101/p129.html",
            "label": "American Family Physician (AAFP), 2006: Urine Dipstick for Diagnosing Urinary Tract Infection"
          }
        ]
      }
    ],
    "warnings": [
      "This test can give false results; check with your doctor before making medical decisions, and right away if you have symptoms.",
      "Taking more than 500 mg of vitamin C in 24 hours, or taking antibiotics, can cause a false negative nitrite result.",
      "Phenazopyridine (AZO Urinary Pain Relief) can make results hard to read, and testing during your period is not recommended.",
      "For urine testing only, not to be taken internally; keep out of reach of children."
    ],
    "warningsSource": {
      "url": "https://azoproducts.com/products/azo-test-strips",
      "label": "AZO: UTI Test Strips product page (directions and limitations)"
    }
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
    ],
    "ingredientScience": [
      {
        "name": "Organic aloe vera (aloe barbadensis leaf juice)",
        "text": "Aloe gel is the base of this moisturizer. NIH's NCCIH says aloe gel on the skin is generally well tolerated, with occasional burning, itching, or rash, but it has no evidence summary for vaginal use specifically.",
        "citations": [
          {
            "url": "https://www.nccih.nih.gov/health/aloe-vera",
            "label": "NIH NCCIH: Aloe Vera"
          }
        ]
      },
      {
        "name": "Lactic acid blend",
        "text": "Lactic acid keeps the gel acidic, close to a healthy vaginal pH. In a 2022 lab study of 11 store-bought vaginal gels, Restore (Good Clean Love) had about 1% lactic acid, a pH near 3.7, and was iso-osmolar (osmolality is how concentrated a gel is; this one was not more concentrated than body fluids). It was one of only two gels found non-toxic to vaginal tissue, though it still raised some inflammation markers. This was tissue in a lab dish, not women.",
        "citations": [
          {
            "url": "https://www.frontiersin.org/journals/reproductive-health/articles/10.3389/frph.2022.915948/pdf",
            "label": "Frontiers in Reproductive Health (2022): Impact of OTC lactic acid vaginal gels on the vaginal epithelium in vitro"
          }
        ]
      }
    ],
    "clinicalNote": "How concentrated a gel is (its osmolality) matters for vaginal tissue. In a 2022 lab study, 10 of 11 over-the-counter vaginal gels were more concentrated than vaginal fluid, and the very concentrated ones damaged the tissue barrier. Iso-osmolar gels like Restore largely kept the barrier intact, but most gels, Restore included, still triggered some inflammation, so the authors called for formulas closer to the body's natural environment. This was lab tissue, not a clinical trial in women.",
    "clinicalNoteSources": [
      {
        "url": "https://www.frontiersin.org/journals/reproductive-health/articles/10.3389/frph.2022.915948/pdf",
        "label": "Frontiers in Reproductive Health (2022): OTC lactic acid vaginal gels in vitro",
        "summary": "Hyperosmolar gels harmed vaginal tissue barriers; Restore was iso-osmolar and non-toxic but still raised inflammation markers."
      }
    ],
    "warnings": [
      "If irritation persists, stop using it.",
      "Contact your healthcare provider if you have an abnormal vaginal odor that won't go away or comes with itching, burning, irritation, or discharge.",
      "It is not a contraceptive and has no spermicide.",
      "If pregnant or breastfeeding, ask your healthcare provider before use."
    ],
    "warningsSource": {
      "url": "https://uk.iherb.com/pr/good-clean-love-restore-moisturizing-vaginal-gel-15-applications-2-fl-oz-59-ml/143638",
      "label": "Good Clean Love Restore Moisturizing Vaginal Gel label as listed on iHerb"
    }
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
    },
    "ingredientScience": [
      {
        "name": "Chasteberry extract",
        "text": "Chasteberry (Vitex) is the best studied herb in this blend for PMS, and some research suggests it may ease symptoms like breast pain or tenderness. NIH describes those studies as low to moderate quality, so the evidence is limited.",
        "citations": [
          {
            "url": "https://www.nccih.nih.gov/health/chasteberry",
            "label": "NIH NCCIH: Chasteberry"
          }
        ]
      },
      {
        "name": "Dong quai",
        "text": "Dong quai is a root used in traditional Chinese medicine for menstrual cramps and PMS. Memorial Sloan Kettering lists these only as traditional uses that haven't been studied to see if they work, and notes it may raise bleeding risk.",
        "citations": [
          {
            "url": "https://www.mskcc.org/cancer-care/integrative-medicine/herbs/dong-quai",
            "label": "Memorial Sloan Kettering: Dong Quai"
          }
        ]
      },
      {
        "name": "Vitamin B6",
        "text": "Some studies show vitamin B6 supplements could reduce PMS symptoms, but NIH says scientists aren't yet certain it helps. The adult upper limit is 100 mg a day, and high doses taken for a year or longer can cause severe nerve damage.",
        "citations": [
          {
            "url": "https://ods.od.nih.gov/Pdf/Factsheets/Vitaminb6-Consumer.Pdf",
            "label": "NIH Office of Dietary Supplements: Vitamin B6 (consumer fact sheet)"
          }
        ]
      },
      {
        "name": "Lemon balm",
        "text": "Lemon balm (Melissa officinalis) is a calming herb in the mint family. Two placebo-controlled trials in Iranian high school girls (100 and 200 students) found lemon balm capsules lowered PMS symptom scores over three cycles, but these are small studies in one population, so treat the evidence as early.",
        "citations": [
          {
            "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC4557408/",
            "label": "Akbarzadeh et al., Nursing and Midwifery Studies (2015): Melissa officinalis capsules for PMS in high school students"
          }
        ]
      }
    ],
    "clinicalNote": "Of the four herbs and vitamins here, chasteberry has the most research for PMS, and NIH still calls that evidence limited and of low to moderate quality. NIH says it isn't yet clear whether vitamin B6 helps PMS, and Memorial Sloan Kettering notes dong quai's use for cramps and PMS hasn't been studied.",
    "clinicalNoteSources": [
      {
        "url": "https://www.nccih.nih.gov/health/chasteberry",
        "label": "NIH NCCIH: Chasteberry",
        "summary": "Some research suggests chasteberry may reduce PMS symptoms, but the evidence is limited and of low to moderate quality."
      },
      {
        "url": "https://ods.od.nih.gov/Pdf/Factsheets/Vitaminb6-Consumer.Pdf",
        "label": "NIH Office of Dietary Supplements: Vitamin B6",
        "summary": "Scientists aren't yet certain about the benefits of vitamin B6 for PMS, though some studies show it could reduce symptoms."
      },
      {
        "url": "https://www.mskcc.org/cancer-care/integrative-medicine/herbs/dong-quai",
        "label": "Memorial Sloan Kettering: Dong Quai",
        "summary": "Lists PMS and menstrual cramps as purported uses that haven't been studied by doctors."
      }
    ],
    "warnings": [
      "Chasteberry may be unsafe if you are pregnant or breastfeeding.",
      "Chasteberry may not be safe if you have a hormone-sensitive condition, like breast, uterine, or ovarian cancer.",
      "Possible side effects include nausea, stomach pain, diarrhea, headache, or itching.",
      "If you take any type of medicine, talk with your health care provider before using any herbal product."
    ],
    "warningsSource": {
      "url": "https://www.nccih.nih.gov/health/chasteberry",
      "label": "NIH NCCIH: Chasteberry"
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
    ],
    "ingredientScience": [
      {
        "name": "Protease, papain, and lipase (enzyme blend)",
        "text": "These enzymes break down protein (protease, papain) and fat (lipase). Harvard Health says over-the-counter enzyme supplements are promoted for bloating, but for most people there's little evidence they do any good; prescription enzymes are for people whose bodies make too little, like with chronic pancreatitis.",
        "citations": [
          {
            "url": "https://www.health.harvard.edu/staying-healthy/can-taking-enzyme-supplements-help-soothe-my-bloating",
            "label": "Harvard Health: Can taking enzyme supplements help soothe my bloating?"
          }
        ]
      },
      {
        "name": "Alpha-galactosidase and lactase",
        "text": "The label also lists these two enzymes. Harvard Health says lactase can help people manage lactose intolerance, and alpha-galactosidase (the enzyme in Beano) may reduce gas and bloating if you have trouble digesting beans. They only help with those specific foods.",
        "citations": [
          {
            "url": "https://www.health.harvard.edu/staying-healthy/can-taking-enzyme-supplements-help-soothe-my-bloating",
            "label": "Harvard Health: Can taking enzyme supplements help soothe my bloating?"
          }
        ]
      },
      {
        "name": "Ginger root",
        "text": "Research shows ginger may help with nausea and vomiting in pregnancy, but NIH doesn't list good evidence for bloating. Ginger itself can cause stomach discomfort, heartburn, or diarrhea in some people.",
        "citations": [
          {
            "url": "https://www.nccih.nih.gov/health/ginger",
            "label": "NIH NCCIH: Ginger"
          }
        ]
      },
      {
        "name": "Peppermint leaf",
        "text": "Enteric-coated peppermint oil capsules have some evidence for IBS (irritable bowel syndrome) symptoms. This product uses peppermint leaf powder instead, and NIH says there isn't enough evidence to say whether peppermint leaf helps any health condition.",
        "citations": [
          {
            "url": "https://www.nccih.nih.gov/health/peppermintoil",
            "label": "NIH NCCIH: Peppermint Oil"
          }
        ]
      }
    ],
    "warnings": [
      "Ask your healthcare professional before use if you have or suspect a medical condition, take prescription drugs, or are pregnant or breastfeeding.",
      "Keep out of reach of children.",
      "Store in a cool, dry place."
    ],
    "warningsSource": {
      "url": "https://www.vitacost.com/products/hum-nutrition-flatter-me-60-vegan-capsules-136402",
      "label": "Vitacost: HUM Nutrition Flatter Me product label"
    }
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
      "sourceUrl": "https://www.heb.com/product-detail/thermacare-menstrual-pain-therapy-heatwraps/10241521",
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
    ],
    "clinicalNote": "Heat is a standard home remedy for period cramps, and MedlinePlus suggests putting heat on your lower belly, below the belly button. A 2026 review of 57 trials (5,359 women) found heat likely lowers period pain compared with no treatment, though the certainty of the evidence was rated low because many trials had design problems. Most of those trials used heat in general, not this wrap. If cramps still aren't better after 3 months of treatment, or the pain comes outside your period, MedlinePlus says to check in with a provider.",
    "clinicalNoteSources": [
      {
        "url": "https://www.frontiersin.org/journals/medicine/articles/10.3389/fmed.2025.1730505/full",
        "label": "Frontiers in Medicine (2026): Heat therapy for primary dysmenorrhea, systematic review and meta-analysis",
        "summary": "57 randomized trials found heat likely reduces period pain versus no treatment, with low certainty evidence."
      },
      {
        "url": "https://pubmed.ncbi.nlm.nih.gov/30389956/",
        "label": "Scientific Reports (2018): Heat therapy for primary dysmenorrhea, systematic review and meta-analysis",
        "summary": "Six small trials gave suggestive evidence that heat eases period pain, and the authors called for higher quality trials."
      },
      {
        "url": "https://medlineplus.gov/ency/article/003150.htm",
        "label": "MedlinePlus: Painful menstrual periods",
        "summary": "Recommends heat on the lower belly and lists when to contact a provider about period pain."
      }
    ],
    "warnings": [
      "This product can cause burns; stick the adhesive side to your underwear, not your skin, and don't wear it while sleeping.",
      "Don't wear it for more than 8 hours in any 24-hour period, and don't fold or bunch it.",
      "Ask a doctor before use if you have diabetes, poor circulation or heart disease, rheumatoid arthritis, or are pregnant.",
      "Each heat cell contains iron and can be harmful if swallowed; keep away from children and pets."
    ],
    "warningsSource": {
      "url": "https://www.heb.com/product-detail/thermacare-menstrual-pain-therapy-heatwraps/10241521",
      "label": "Retailer listing reproducing the ThermaCare Menstrual HeatWraps label"
    }
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
    ],
    "howToUse": {
      "intro": "Per Comfytemp's product listing and Mayo Clinic guidance on heat for cramps:",
      "steps": [
        "Fully charge the battery before first use, about 2 hours with a 5V/2A charger.",
        "Fasten the adjustable strap so the pad sits over your lower belly, where Mayo Clinic suggests applying heat for cramps.",
        "Pick one of the 3 heat levels, from Low to High.",
        "Set the 15, 30 or 45 minute auto-off timer.",
        "Make an appointment with your doctor or gynecologist if your cramps are bothersome."
      ],
      "sourceUrl": "https://www.walmart.com/ip/17564207615",
      "sourceLabel": "Comfytemp Cordless Heating Pad for Period Cramps (Walmart listing) and Mayo Clinic: Menstrual cramps"
    },
    "clinicalNote": "Heat is a standard home remedy for period cramps, and MedlinePlus suggests a heating pad on your lower belly, below the belly button, with one firm rule: never fall asleep with it on. A 2026 review of 57 trials (5,359 women) found heat likely lowers period pain compared with no treatment, though the certainty of the evidence was rated low because many trials had design problems. Those trials tested heat in general, not this pad. If cramps still aren't better after 3 months of treatment, MedlinePlus says to check in with a provider.",
    "clinicalNoteSources": [
      {
        "url": "https://www.frontiersin.org/journals/medicine/articles/10.3389/fmed.2025.1730505/full",
        "label": "Frontiers in Medicine (2026): Heat therapy for primary dysmenorrhea, systematic review and meta-analysis",
        "summary": "57 randomized trials found heat likely reduces period pain versus no treatment, with low certainty evidence."
      },
      {
        "url": "https://medlineplus.gov/ency/article/003150.htm",
        "label": "MedlinePlus: Painful menstrual periods",
        "summary": "Recommends a heating pad on the lower belly, warns never to fall asleep with it on, and lists when to contact a provider."
      }
    ],
    "warnings": [
      "Never use a heating pad while you are asleep, or on someone who is asleep or unconscious.",
      "Don't use it on skin that can't feel temperature changes, and never use it on an infant.",
      "Don't crush or fold the pad during use or storage.",
      "Read and follow all of the manufacturer's instructions before use."
    ],
    "warningsSource": {
      "url": "https://webarchive.library.unt.edu/web/20081205084122/http:/www.fda.gov/cdrh/heatpad.pdf",
      "label": "FDA/CPSC Public Health Advisory: Hazards Associated with the Use of Electric Heating Pads (1995, archived)"
    }
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
    ],
    "howToUse": {
      "intro": "Per VIBOOS's product instructions:",
      "steps": [
        "Lay the pad flat on your lower belly or back, and never fold it while it's on.",
        "Pick one of the 6 heat levels, which run from 104 to 140°F.",
        "Set the auto shut-off timer for 30 to 120 minutes.",
        "Don't let other objects cover the pad while it's running, and don't use it if it shows any damage.",
        "Unplug it before washing, wash at 86°F or below, skip the dryer, and let it dry completely before plugging it back in."
      ],
      "sourceUrl": "https://kateminimalist.com/products/viboos-heating-electric-pad-for-back-shoulders-abdomen-legs-arms-electric-fast-heat-pad-with-heat-settings-auto-shut-off-dark-gray-24-12",
      "sourceLabel": "VIBOOS Electric Heating Pad product listing (retailer page)"
    },
    "clinicalNote": "Heat is a standard home remedy for period cramps, and MedlinePlus suggests a heating pad on your lower belly, below the belly button, with one firm rule: never fall asleep with it on. A 2026 review of 57 trials (5,359 women) found heat likely lowers period pain compared with no treatment, though the certainty of the evidence was rated low because many trials had design problems. Those trials tested heat in general, not this pad. If cramps still aren't better after 3 months of treatment, MedlinePlus says to check in with a provider.",
    "clinicalNoteSources": [
      {
        "url": "https://www.frontiersin.org/journals/medicine/articles/10.3389/fmed.2025.1730505/full",
        "label": "Frontiers in Medicine (2026): Heat therapy for primary dysmenorrhea, systematic review and meta-analysis",
        "summary": "57 randomized trials found heat likely reduces period pain versus no treatment, with low certainty evidence."
      },
      {
        "url": "https://medlineplus.gov/ency/article/003150.htm",
        "label": "MedlinePlus: Painful menstrual periods",
        "summary": "Recommends a heating pad on the lower belly, warns never to fall asleep with it on, and lists when to contact a provider."
      }
    ],
    "warnings": [
      "Never use a heating pad while you are asleep, or on someone who is asleep or unconscious.",
      "Don't sit or lie on the pad, and don't crush or fold it.",
      "Don't use it on skin that can't feel temperature changes, and never use it on an infant.",
      "Check it before each use, throw it out if it looks worn or the cord is frayed, and unplug it when you're done."
    ],
    "warningsSource": {
      "url": "https://webarchive.library.unt.edu/web/20081205084122/http:/www.fda.gov/cdrh/heatpad.pdf",
      "label": "FDA/CPSC Public Health Advisory: Hazards Associated with the Use of Electric Heating Pads (1995, archived)"
    }
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
    },
    "clinicalNote": "Therapy by live video seems to work about as well as therapy in person. A 2021 meta-analysis in Clinical Psychology & Psychotherapy (47 comparison studies, 3,564 people) found the difference between video and in-person therapy was negligible. That evidence is about live video sessions; it does not tell you how well text messaging with a therapist works on its own. Separately, in 2023 the FTC (the US consumer protection agency) finalized an order banning BetterHelp from sharing health data for advertising after alleging it had passed users' emails, IP addresses and health questionnaire answers to companies like Facebook and Snapchat.",
    "clinicalNoteSources": [
      {
        "url": "https://stanfordhealthcare.org/publications/809/809484.html",
        "label": "Clinical Psychology & Psychotherapy (2021): Live psychotherapy by video versus in-person, a meta-analysis (via Stanford Health Care)",
        "summary": "Across 47 between-group studies (3,564 people), video therapy's results were negligibly different from in-person therapy."
      },
      {
        "url": "https://www.ftc.gov/news-events/news/press-releases/2023/07/ftc-gives-final-approval-order-banning-betterhelp-sharing-sensitive-health-data-advertising?",
        "label": "FTC (July 2023): FTC gives final approval to order banning BetterHelp from sharing sensitive health data for advertising",
        "summary": "BetterHelp must pay $7.8 million and is banned from sharing health data for ads, with new consent and data retention requirements."
      }
    ],
    "warnings": [
      "Not suitable if you are in an urgent crisis or emergency.",
      "Not for minors or people under the care of a legal guardian.",
      "Not for court-ordered therapy, and therapists can't fulfill a court order.",
      "BetterHelp therapists will not prescribe medication and may not be able to make an official diagnosis."
    ],
    "warningsSource": {
      "url": "https://www.betterhelp.com/es/faq",
      "label": "BetterHelp: Frequently asked questions"
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
        "url": "https://pubmed.ncbi.nlm.nih.gov/30294390/",
        "label": "Economides et al., Mindfulness (2018): RCT of Headspace",
        "summary": "In healthy adults, 10 introductory Headspace sessions reduced stress from external pressure and irritability and improved positive mood versus an audiobook control."
      },
      {
        "url": "https://journals.plos.org/plosone/article?id=10.1371%2Fjournal.pone.0209482",
        "label": "Champion et al., PLOS ONE (2018): pilot RCT of Headspace",
        "summary": "Adults using Headspace reported lower stress and higher life satisfaction and resilience at day 10 and day 30 versus a wait-list, in a small Headspace-funded pilot."
      }
    ],
    "clinicalNote": "Headspace has more randomized trials behind it than most meditation apps. A 2022 systematic review in JMIR Mental Health found 14 of them: Headspace improved depression in 3 of 4 trials that measured it, anxiety in 2 of 4, and stress in 2 of 5 (one more was mixed). Most trials were small, and half reported a conflict of interest with the company, often free premium access for participants. The authors called the research promising but not conclusive.",
    "clinicalNoteSources": [
      {
        "url": "https://mental.jmir.org/2022/9/e40924",
        "label": "JMIR Mental Health (2022): Efficacy and Conflicts of Interest in Randomized Controlled Trials Evaluating Headspace and Calm Apps, systematic review",
        "summary": "Across 14 Headspace trials, results were positive for depression in 75%, anxiety in 50% and stress in 40% of trials that measured them; most were underpowered and half had company-related conflicts of interest."
      }
    ],
    "warnings": [
      "Not meant for use in a medical emergency. In the US, call or text 988, the Suicide and Crisis Lifeline.",
      "Headspace is not a medical provider, and its content and coaches do not give medical or clinical advice.",
      "If you have an existing mental health condition, talk with your health care provider before starting a meditation practice. Rarely, people with anxiety or depression have felt worse during intensive meditation.",
      "Meant for adults 18 and over, with limited exceptions for ages 13 to 17 through some employer or plan offerings."
    ],
    "warningsSource": {
      "url": "https://headspace.com/terms-and-conditions",
      "label": "Headspace: Terms and Conditions"
    }
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
    ],
    "clinicalNote": "The best sleep study of Calm is a 2021 randomized trial in PLoS ONE of 263 adults with trouble sleeping. People asked to meditate with Calm at least 10 minutes a day for 8 weeks had less daytime fatigue, less daytime sleepiness and less pre-sleep arousal (a racing mind or tense body at bedtime) than a wait-list group. Their sleep quality also improved, but that was only measured in the Calm group, so it wasn't compared with people who didn't use the app. A 2022 review (searching up to May 2021) counted only one Calm trial meeting its criteria, so overall the evidence for Calm is much thinner than for Headspace.",
    "clinicalNoteSources": [
      {
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC7790277/",
        "label": "PLoS ONE (2021): Testing a mindfulness meditation mobile app for the treatment of sleep-related symptoms in adults with sleep disturbance, randomized controlled trial",
        "summary": "Compared with a wait-list, 8 weeks of Calm meditation reduced daytime fatigue, daytime sleepiness and pre-sleep arousal in 263 adults with sleep problems."
      },
      {
        "url": "https://mental.jmir.org/2022/9/e40924",
        "label": "JMIR Mental Health (2022): Efficacy and Conflicts of Interest in RCTs Evaluating Headspace and Calm Apps, systematic review",
        "summary": "Found just one Calm randomized trial (88 people), which showed better stress and mindfulness than a wait-list."
      }
    ],
    "warnings": [
      "Calm does not provide medical advice, diagnosis or treatment, and is not a healthcare or mental health provider.",
      "In an emergency, including a mental health crisis, call 911 or your local emergency number right away. Don't rely on Calm instead.",
      "Never ignore professional medical advice or delay getting it because of something in the app.",
      "You must be 16 or older to use Calm."
    ],
    "warningsSource": {
      "url": "https://calm.com/terms",
      "label": "Calm: Terms of Service"
    }
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
    ],
    "clinicalNote": "Most home ovulation tests look for a surge in LH (luteinizing hormone, the hormone that triggers the ovary to release an egg), which tells you ovulation is likely coming soon, not that it happened. PdG (pregnanediol glucuronide, a breakdown product of progesterone) rises in urine after ovulation, which is why measuring it can help confirm ovulation. In a small 2018 study in Scientific Reports (14 women, 20 cycles, checked against ultrasound), a single urine PdG reading identified ovulation well (AUC 0.95, where 1.0 is perfect). That study used lab analyzers, not Inito's strips, and we could not open a peer-reviewed accuracy study of Inito itself.",
    "clinicalNoteSources": [
      {
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC6279762/",
        "label": "Scientific Reports (2018): Confirmation of ovulation from urinary progesterone analysis, assessment of two automated assay platforms",
        "summary": "Using transvaginal ultrasound as the reference in 14 women (20 cycles), a urinary PdG threshold confirmed ovulation with an AUC of 0.951."
      },
      {
        "url": "https://medlineplus.gov/ency/article/007062.htm",
        "label": "MedlinePlus (NIH): Ovulation home test",
        "summary": "LH tests flag a coming ovulation; a surge can be missed with skipped days or irregular cycles, and medicines like estrogen, progesterone, testosterone and clomiphene can change LH levels."
      }
    ],
    "warnings": [
      "Don't use an ovulation test to prevent pregnancy. It is not reliable for that.",
      "Start testing at the right time in your cycle, or results will be unreliable.",
      "How well it works depends on how carefully you follow the instructions."
    ],
    "warningsSource": {
      "url": "https://www.fda.gov/medical-devices/home-use-tests/ovulation-urine-test",
      "label": "FDA: Ovulation (Urine Test), home use tests"
    }
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
        "summary": "Resting temperature rises slightly after ovulation, but illness, medications, postpartum, breastfeeding, irregular cycles and PMOS can make readings unreliable, and about 1 in 4 typical users of fertility awareness methods get pregnant within a year."
      }
    ],
    "scienceSources": [
      {
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC6883568/",
        "label": "Maijala et al., BMC Women's Health (2019): Oura ring pilot study",
        "summary": "In 22 women, nightly finger temperature from the Oura ring was 0.30 C higher in the luteal phase and detected menstruation and ovulation with moderate to good sensitivity."
      }
    ],
    "clinicalNote": "After you ovulate, your body temperature rises slightly and stays up until your period. The Oura ring reads skin temperature at your finger while you sleep and looks for that shift. In a 2019 pilot study of 22 women, nighttime finger temperature from the ring rose about 0.3 °C in the second half of the cycle, tracked oral temperature reasonably well, and estimated periods and ovulation to within a few days. The ring is not a medical device, and Oura's own analysis says its ovulation feature is not meant for people on hormonal birth control or people who often skip ovulation.",
    "clinicalNoteSources": [
      {
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC6883568/",
        "label": "BMC Women's Health (2019): Nocturnal finger skin temperature in menstrual cycle tracking, pilot study using a wearable Oura ring",
        "summary": "In 22 women, nightly finger temperature was 0.30 °C higher after ovulation, correlated with oral temperature, and found ovulation with 83.3% sensitivity within a 6-day window."
      },
      {
        "url": "https://jmir.org/2025/1/e60667/PDF",
        "label": "Journal of Medical Internet Research (2025): Oura Ring as a Tool for Ovulation Detection, Validation Analysis",
        "summary": "Retrospective analysis of 1,155 cycles by Oura employees; notes the method was not tested in anovulatory cycles or people on hormonal contraception."
      },
      {
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC6883568/",
        "label": "Maijala et al., BMC Womens Health (2019): Nocturnal finger skin temperature in menstrual cycle tracking (Oura ring pilot)",
        "summary": "Pilot study of 22 women: nighttime finger temperature from the ring was higher after ovulation and tracked oral temperature; two authors work for Oura."
      }
    ],
    "effectiveness": "There is a study of this product. A 2025 analysis of 1,155 ovulatory cycles found the ring picked up 96.4% of ovulations and was off by about 1.3 days on average, compared with about 3.4 days for counting calendar days, and it held up better in irregular cycles. Keep in mind the authors work for Oura, the check was against users' own logged home LH (ovulation) tests, and only cycles where ovulation happened were included, so it could not measure false alarms.",
    "effectivenessSources": [
      {
        "url": "https://jmir.org/2025/1/e60667/PDF",
        "label": "Journal of Medical Internet Research (2025): Oura Ring as a Tool for Ovulation Detection, Validation Analysis",
        "summary": "Oura's temperature-based method had a mean error of 1.26 days vs 3.44 days for the calendar method; all authors are Oura employees."
      },
      {
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC6883568/",
        "label": "BMC Women's Health (2019): Oura ring menstrual cycle tracking pilot study",
        "summary": "Small pilot (22 women) found period detection sensitivity of 71.9% to 86.5% within 2 to 4 days."
      }
    ],
    "warnings": [
      "The Oura Ring is not a medical device, so check with a doctor before changing medication, diet, or workouts based on its data.",
      "Take the ring off if your skin gets irritated, and see a doctor if it is painful or lasts about a week.",
      "Don't wear it so tight that it causes constant pressure, pain, or numbness, and seek medical help if a stuck finger is very painful, swollen, or discolored.",
      "Keep it away from children and get medical help right away if a child may have swallowed it."
    ],
    "warningsSource": {
      "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC6883568/",
      "label": "Maijala et al., BMC Womens Health (2019): Nocturnal finger skin temperature in menstrual cycle tracking (Oura ring pilot)"
    }
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
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC10226714/",
        "label": "Li et al., npj Digital Medicine (2023): Apple Women's Health Study",
        "summary": "Using over 165,000 cycles logged in Apple Health Cycle Tracking, researchers found cycle length varies by age, with smaller differences by ethnicity and BMI."
      }
    ],
    "warnings": [
      "Cycle Tracking should not be used as a form of birth control.",
      "Don't use Cycle Tracking data to diagnose a health condition.",
      "Ovulation estimates are estimates only and don't guarantee that ovulation happened.",
      "Wrist temperature readings can be thrown off by your environment or your body, and ovulation can happen without a clear temperature shift."
    ],
    "warningsSource": {
      "url": "https://support.apple.com/120357",
      "label": "Apple Support: Receive retrospective ovulation estimates on Apple Watch"
    }
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
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC10785982/",
        "label": "Linardon et al., World Psychiatry 2024: meta-analysis of 176 RCTs of mental health apps",
        "summary": "Apps had small but significant effects on depression and generalized anxiety, and apps with CBT features produced larger effects."
      },
      {
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC6732686",
        "label": "Linardon et al., World Psychiatry 2019: meta-analysis of 66 RCTs of app-supported interventions",
        "summary": "Smartphone apps beat control conditions for depression, generalized anxiety and stress, with stronger effects when apps included engagement reminders or professional guidance."
      }
    ],
    "howToUse": {
      "intro": "Per the Bloom app's setup, as described by Suicide&Co's support listing:",
      "steps": [
        "Download Bloom and start the 7-day free trial.",
        "Rate your CBT experience as beginner, intermediate or expert.",
        "Pick a guide and a time of day for your daily session.",
        "Watch the intro video and do the first exercise on reshaping your thinking.",
        "Do a short guided session each day, and use the journal and check-ins to track how you feel."
      ],
      "sourceUrl": "https://www.suicideandco.org/support-links/bloom-app",
      "sourceLabel": "Suicide&Co: Bloom app overview"
    },
    "clinicalNote": "Internet-delivered CBT (cognitive behavioral therapy, a talk therapy that works on unhelpful thoughts and habits) works for anxiety and depression in studies, but programs with a therapist guiding you tend to show bigger effects than fully self-guided ones. Sticking with it is the hard part: in one trial of an unguided program, 73% of users didn't finish. Online CBT isn't recommended as the main treatment for severe illness. We found no published trials of Bloom itself.",
    "clinicalNoteSources": [
      {
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC4771536/",
        "label": "CMAJ (2016): Internet-delivered cognitive behavioural therapy in the treatment of psychiatric illness",
        "summary": "Review finding internet CBT effective for anxiety and depression, with larger effects when guided and low completion when unguided."
      },
      {
        "url": "https://nimh.nih.gov/health/topics/technology-and-the-future-of-mental-health-treatment",
        "label": "NIMH: Technology and the Future of Mental Health Treatment",
        "summary": "Notes that most mental health apps lack peer-reviewed research and gives tips for choosing one."
      }
    ],
    "warnings": [
      "An app may not replace a mental health professional.",
      "If you're struggling or having thoughts of suicide, call or text the 988 Suicide and Crisis Lifeline at 988. In a life-threatening situation, call 911.",
      "Most mental health apps don't have peer-reviewed research behind their claims, and they handle sensitive personal information, so check how the app protects your privacy."
    ],
    "warningsSource": {
      "url": "https://nimh.nih.gov/health/topics/technology-and-the-future-of-mental-health-treatment",
      "label": "NIMH: Technology and the Future of Mental Health Treatment"
    }
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
    ],
    "clinicalNote": "Endometriosis care often involves a team: a 2024 review of 19 studies found gynecologists, pain specialists, nurses, physiotherapists, psychologists, sex therapists, nutritionists, and social workers were the members most often involved. Patients said they valued reliable information, feeling respected and believed, talking through long-term plans, and emotional support. The authors also noted that the data behind team-based care is thin and much of it is anecdotal, so it's still unclear how much it improves quality of life.",
    "clinicalNoteSources": [
      {
        "url": "https://pubmed.ncbi.nlm.nih.gov/37753632/",
        "label": "Aust N Z J Obstet Gynaecol (2024): Evidence for the role of multidisciplinary team care in people with pelvic pain and endometriosis, a systematic review",
        "summary": "Reviewed 19 studies on team-based endometriosis care, describing who is on the team and what patients value, and found the evidence limited."
      }
    ],
    "warnings": [
      "See a healthcare provider if you need to change a pad or tampon in less than 2 hours, pass clots the size of a quarter or larger, or have periods lasting more than 7 days.",
      "Heavy bleeding can leave you tired, low on energy, or short of breath, which are also signs to get checked.",
      "If your gynecologist finds no cause for heavy bleeding at a routine visit, you should be tested for a bleeding disorder such as von Willebrand disease."
    ],
    "warningsSource": {
      "url": "https://www.cdc.gov/ncbddd/blooddisorders/women/menorrhagia.html",
      "label": "CDC: About Heavy Menstrual Bleeding"
    }
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
    ],
    "clinicalNote": "Pads are regulated by the FDA as medical devices, and makers have to register them and report problems. The FDA's main safety advice is to change your pad every few hours, even on light days, because wearing one too long can irritate your skin. A Harvard Health article by an OB-GYN suggests unscented pads, changed about every 2 to 6 hours. A 2019 review of pad safety research found the evidence on longer-term health effects of pad chemicals limited, with small studies that neither clearly show harm nor rule it out.",
    "clinicalNoteSources": [
      {
        "url": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-pads-and-liners",
        "label": "FDA: Menstrual Pads and Liners",
        "summary": "Explains how FDA regulates pads and gives safe-use tips, including changing them every few hours."
      },
      {
        "url": "https://www.health.harvard.edu/blog/vulvar-health-navigating-the-nether-regions-2019040116322",
        "label": "Harvard Health Blog (Huma Farid, MD, 2019): Vulvar health",
        "summary": "Suggests unscented cotton pads without a mesh covering, changed about every 2 to 6 hours, and avoiding scented feminine products."
      },
      {
        "url": "https://synapse.koreamed.org/articles/1130139",
        "label": "Ewha Medical Journal 2019 (Woo et al.), doi:10.12771/emj.2019.42.3.25: Systematic Review on Sanitary Pads and Female Health",
        "summary": "Reviews studies on chemicals in pads and finds the evidence on health effects limited and inconclusive."
      }
    ],
    "warnings": [
      "Change your pad every few hours, even if your flow is light, and more often when it is heavy.",
      "Wearing a pad too long can irritate your skin.",
      "Some people react to scents, deodorants or other materials added to pads.",
      "If you get itching, a rash, pain, swelling or discomfort, stop using the pad and contact your healthcare provider."
    ],
    "warningsSource": {
      "url": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-pads-and-liners",
      "label": "FDA: Menstrual Pads and Liners"
    }
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
    ],
    "clinicalNote": "Pads are regulated by the FDA as medical devices, and makers have to register them and report problems. The FDA's main safety advice is to change your pad every few hours, even on light days, because wearing one too long can irritate your skin. A Harvard Health article by an OB-GYN suggests unscented pads, changed about every 2 to 6 hours. A 2019 review of pad safety research found the evidence on longer-term health effects of pad chemicals limited, with small studies that neither clearly show harm nor rule it out.",
    "clinicalNoteSources": [
      {
        "url": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-pads-and-liners",
        "label": "FDA: Menstrual Pads and Liners",
        "summary": "Explains how FDA regulates pads and gives safe-use tips, including changing them every few hours."
      },
      {
        "url": "https://www.health.harvard.edu/blog/vulvar-health-navigating-the-nether-regions-2019040116322",
        "label": "Harvard Health Blog (Huma Farid, MD, 2019): Vulvar health",
        "summary": "Suggests unscented cotton pads without a mesh covering, changed about every 2 to 6 hours, and avoiding scented feminine products."
      },
      {
        "url": "https://synapse.koreamed.org/articles/1130139",
        "label": "Ewha Medical Journal 2019 (Woo et al.), doi:10.12771/emj.2019.42.3.25: Systematic Review on Sanitary Pads and Female Health",
        "summary": "Reviews studies on chemicals in pads and finds the evidence on health effects limited and inconclusive."
      }
    ],
    "warnings": [
      "Change your pad every few hours, even if your flow is light, and more often when it is heavy.",
      "Wearing a pad too long can irritate your skin.",
      "Some people react to scents, deodorants or other materials added to pads.",
      "If you get itching, a rash, pain, swelling or discomfort, stop using the pad and contact your healthcare provider."
    ],
    "warningsSource": {
      "url": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-pads-and-liners",
      "label": "FDA: Menstrual Pads and Liners"
    }
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
    ],
    "ingredientScience": [
      {
        "name": "Chlorine-free pulp",
        "text": "A 2019 review of pad safety found that a US investigation measured dioxin (a pollutant) levels in pads lower than what people take in from food. It found no studies comparing chlorine-free or organic pads with regular ones, so there's no direct evidence either way that chlorine-free pulp is better for your health.",
        "citations": [
          {
            "url": "https://synapse.koreamed.org/articles/1130139",
            "label": "Ewha Medical Journal 2019 (Woo et al.), doi:10.12771/emj.2019.42.3.25: Systematic Review on Sanitary Pads and Female Health"
          }
        ]
      }
    ],
    "clinicalNote": "Pads are regulated by the FDA as medical devices, and makers have to register them and report problems. The FDA's main safety advice is to change your pad every few hours, even on light days, because wearing one too long can irritate your skin. A Harvard Health article by an OB-GYN suggests unscented pads, changed about every 2 to 6 hours. A 2019 review of pad safety research found the evidence on longer-term health effects of pad chemicals limited, with small studies that neither clearly show harm nor rule it out. Being fragrance-free fits the advice to avoid scented feminine products.",
    "clinicalNoteSources": [
      {
        "url": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-pads-and-liners",
        "label": "FDA: Menstrual Pads and Liners",
        "summary": "Explains how FDA regulates pads and gives safe-use tips, including changing them every few hours."
      },
      {
        "url": "https://www.health.harvard.edu/blog/vulvar-health-navigating-the-nether-regions-2019040116322",
        "label": "Harvard Health Blog (Huma Farid, MD, 2019): Vulvar health",
        "summary": "Suggests unscented cotton pads without a mesh covering, changed about every 2 to 6 hours, and avoiding scented feminine products."
      },
      {
        "url": "https://synapse.koreamed.org/articles/1130139",
        "label": "Ewha Medical Journal 2019 (Woo et al.), doi:10.12771/emj.2019.42.3.25: Systematic Review on Sanitary Pads and Female Health",
        "summary": "Reviews studies on chemicals in pads and finds the evidence on health effects limited and inconclusive."
      }
    ],
    "warnings": [
      "Change your pad every few hours, even if your flow is light, and more often when it is heavy.",
      "Wearing a pad too long can irritate your skin.",
      "Some people react to scents, deodorants or other materials added to pads.",
      "If you get itching, a rash, pain, swelling or discomfort, stop using the pad and contact your healthcare provider."
    ],
    "warningsSource": {
      "url": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-pads-and-liners",
      "label": "FDA: Menstrual Pads and Liners"
    }
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
    "clinicalNote": "The FDA regulates menstrual pads as medical devices. It advises changing pads every few hours, even on light days, and stopping use if you notice itching, rash or swelling.",
    "communityReview": "Reviews are mostly positive. People often say the pads feel light and comfortable, don't cause irritation, and that the wings help keep them in place. The complaints that come up are pads that feel bulkier than the \"ultra thin\" name suggests and wing adhesive that is inconsistent, in one case sticking so hard to underwear it wouldn't come off.",
    "communityReviewSources": [
      {
        "url": "https://www.influenster.com/reviews/u-by-kotex-cleanwear-ultra-thin-pads-with-wings",
        "label": "Influenster reviews: U by Kotex CleanWear Ultra Thin Pads with Wings"
      },
      {
        "url": "https://www.walmart.com/ip/430392368",
        "label": "Walmart customer reviews: U by Kotex CleanWear Ultra Thin Pads with Wings"
      }
    ],
    "warnings": [
      "Change your pad every few hours, even if your flow is light, and more often when it is heavy.",
      "Wearing a pad too long can irritate your skin.",
      "Some people react to scents, deodorants or other materials added to pads.",
      "If you get itching, a rash, pain, swelling or discomfort, stop using the pad and contact your healthcare provider."
    ],
    "warningsSource": {
      "url": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-pads-and-liners",
      "label": "FDA: Menstrual Pads and Liners"
    }
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
    ],
    "clinicalNote": "In the US, pads and liners are regulated by the FDA as medical devices. Makers have to register them, follow good manufacturing practices, and report problems and bad reactions. The FDA's main advice is simple: change your pad every few hours, even on light days, because wearing one too long can irritate your skin. Some people react to added scents or deodorants, so stop using a pad if you get itching, a rash or swelling.",
    "clinicalNoteSources": [
      {
        "url": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-pads-and-liners",
        "label": "FDA: Menstrual Pads and Liners",
        "summary": "FDA regulates pads and liners as medical devices and advises changing them every few hours, since wearing one too long can irritate skin."
      }
    ],
    "warnings": [
      "Change your pad every few hours, even on light days, and more often when your flow is heavy.",
      "Wearing a pad too long may irritate your skin.",
      "Some people react to scents, deodorants or other materials added to pads.",
      "Stop using it and contact your healthcare provider if you get itching, rash, pain, swelling or discomfort."
    ],
    "warningsSource": {
      "url": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-pads-and-liners",
      "label": "FDA: Menstrual Pads and Liners"
    }
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
    "clinicalNote": "The FDA regulates menstrual pads as medical devices and notes some people react to scents or other materials added to pads. If you get itching, rash or swelling, stop using the pad and check in with your provider.",
    "communityReview": "Reviewers mostly like these. Common praise is for strong absorbency, comfort, no chemical smell, and extra length that covers more than other overnight pads. Complaints are that wings can come unstuck or shift, the pads feel bulky to some, they cost more than supermarket brands, and some people are put off that only the top layer is cotton while the backing is plastic.",
    "communityReviewSources": [
      {
        "url": "https://www.walmart.com/ip/seort/634726416",
        "label": "Walmart customer reviews: Rael Organic Cotton Cover Overnight Pads"
      },
      {
        "url": "https://helloclue.com/es/articulos/culture/clue-reviews-rael-disposable-menstrual-pads",
        "label": "Clue: staff test Rael disposable pads"
      },
      {
        "url": "https://well.ca/products/rael-organic-overnight-pad_171205.html",
        "label": "Well.ca customer review: Rael Organic Overnight Pad"
      }
    ],
    "warnings": [
      "Change your pad every few hours, even on light days, and more often when your flow is heavy.",
      "Wearing a pad too long may irritate your skin.",
      "Some people react to scents, deodorants or other materials added to pads.",
      "Stop using it and contact your healthcare provider if you get itching, rash, pain, swelling or discomfort."
    ],
    "warningsSource": {
      "url": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-pads-and-liners",
      "label": "FDA: Menstrual Pads and Liners"
    }
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
    ],
    "clinicalNote": "In the US, pads and liners are regulated by the FDA as medical devices. Makers have to register them, follow good manufacturing practices, and report problems and bad reactions. The FDA's main advice is simple: change your pad every few hours, even on light days, because wearing one too long can irritate your skin. Some people react to added scents or deodorants, so stop using a pad if you get itching, a rash or swelling. On organic cotton: one 2018 study in women with irritated vulvar skin found organic cotton pads caused fewer irritation effects than conventional synthetic pads. Keep in mind only Cora's topsheet (the layer against your skin) is organic cotton; its absorbent core is wood pulp with a superabsorbent polymer (sodium polyacrylate).",
    "clinicalNoteSources": [
      {
        "url": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-pads-and-liners",
        "label": "FDA: Menstrual Pads and Liners",
        "summary": "FDA regulates pads and liners as medical devices and advises changing them every few hours, since wearing one too long can irritate skin."
      },
      {
        "url": "https://pubmed.ncbi.nlm.nih.gov/30465412/",
        "label": "Minerva Ginecologica (2018): Evaluation of safety and skin tolerability of organic cotton pads in case of irritative vulvitis (doi:10.23736/S0026-4784.18.04338-1), University of Pavia repository",
        "summary": "Clinical and lab tests in which organic cotton pads caused fewer irritation effects than conventional synthetic pads in women with irritated vulvar skin."
      }
    ],
    "warnings": [
      "Change your pad every few hours, even on light days, and more often when your flow is heavy.",
      "Wearing a pad too long may irritate your skin.",
      "Some people react to scents, deodorants or other materials added to pads.",
      "Stop using it and contact your healthcare provider if you get itching, rash, pain, swelling or discomfort."
    ],
    "warningsSource": {
      "url": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-pads-and-liners",
      "label": "FDA: Menstrual Pads and Liners"
    }
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
    ],
    "clinicalNote": "Liners are regulated by the FDA the same way as pads, and the FDA advises changing them every few hours even on light days, since wearing one too long can irritate skin. In a small study of 12 women, a liner with a non-breathable backing made vulva skin warmer, damper and less acidic than wearing no liner, while a breathable liner left skin close to normal. That study measured skin conditions, not infections, so it does not show liners cause problems.",
    "clinicalNoteSources": [
      {
        "url": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-pads-and-liners",
        "label": "FDA: Menstrual Pads and Liners",
        "summary": "FDA regulates pads and liners as medical devices and advises changing them every few hours, since wearing one too long can irritate skin."
      },
      {
        "url": "https://pubmed.ncbi.nlm.nih.gov/12735634/",
        "label": "Acta Dermato-Venereologica: The vulva skin microclimate: influence of panty liners on temperature, humidity and pH (doi:10.1080/00015550310007409)",
        "summary": "In 12 healthy women, a liner with a non-breathable backsheet made vulva skin warmer, damper and less acidic than no liner, while a breathable liner largely left it unchanged."
      }
    ],
    "warnings": [
      "Change liners every few hours, even on light days.",
      "Wearing one too long may irritate your skin.",
      "Some people react to scents, deodorants or other materials added to pads and liners.",
      "Stop using it and contact your healthcare provider if you get itching, rash, pain, swelling or discomfort."
    ],
    "warningsSource": {
      "url": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-pads-and-liners",
      "label": "FDA: Menstrual Pads and Liners"
    }
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
    ],
    "clinicalNote": "Liners are regulated by the FDA the same way as pads, and the FDA advises changing them every few hours even on light days, since wearing one too long can irritate skin. In a small study of 12 women, a liner with a non-breathable backing made vulva skin warmer, damper and less acidic than wearing no liner, while a breathable liner left skin close to normal. That study measured skin conditions, not infections, so it does not show liners cause problems.",
    "clinicalNoteSources": [
      {
        "url": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-pads-and-liners",
        "label": "FDA: Menstrual Pads and Liners",
        "summary": "FDA regulates pads and liners as medical devices and advises changing them every few hours, since wearing one too long can irritate skin."
      },
      {
        "url": "https://pubmed.ncbi.nlm.nih.gov/12735634/",
        "label": "Acta Dermato-Venereologica: The vulva skin microclimate: influence of panty liners on temperature, humidity and pH (doi:10.1080/00015550310007409)",
        "summary": "In 12 healthy women, a liner with a non-breathable backsheet made vulva skin warmer, damper and less acidic than no liner, while a breathable liner largely left it unchanged."
      }
    ],
    "warnings": [
      "Change liners every few hours, even on light days.",
      "Wearing one too long may irritate your skin.",
      "Some people react to scents, deodorants or other materials added to pads and liners.",
      "Stop using it and contact your healthcare provider if you get itching, rash, pain, swelling or discomfort."
    ],
    "warningsSource": {
      "url": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-pads-and-liners",
      "label": "FDA: Menstrual Pads and Liners"
    }
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
    ],
    "clinicalNote": "Liners are regulated by the FDA the same way as pads, and the FDA advises changing them every few hours even on light days, since wearing one too long can irritate skin. In a small study of 12 women, a liner with a non-breathable backing made vulva skin warmer, damper and less acidic than wearing no liner, while a breathable liner left skin close to normal. That study measured skin conditions, not infections, so it does not show liners cause problems.",
    "clinicalNoteSources": [
      {
        "url": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-pads-and-liners",
        "label": "FDA: Menstrual Pads and Liners",
        "summary": "FDA regulates pads and liners as medical devices and advises changing them every few hours, since wearing one too long can irritate skin."
      },
      {
        "url": "https://pubmed.ncbi.nlm.nih.gov/12735634/",
        "label": "Acta Dermato-Venereologica: The vulva skin microclimate: influence of panty liners on temperature, humidity and pH (doi:10.1080/00015550310007409)",
        "summary": "In 12 healthy women, a liner with a non-breathable backsheet made vulva skin warmer, damper and less acidic than no liner, while a breathable liner largely left it unchanged."
      }
    ],
    "warnings": [
      "Change liners every few hours, even on light days.",
      "Wearing one too long may irritate your skin.",
      "Some people react to scents, deodorants or other materials added to pads and liners.",
      "Stop using it and contact your healthcare provider if you get itching, rash, pain, swelling or discomfort."
    ],
    "warningsSource": {
      "url": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-pads-and-liners",
      "label": "FDA: Menstrual Pads and Liners"
    }
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
    ],
    "clinicalNote": "Tampons are medical devices in the US, and the FDA has to review and authorize each one before it can be sold, including checks on its materials and absorbency. The main safety concern is toxic shock syndrome (TSS), a rare but serious illness linked to leaving a tampon in too long, and reported cases have dropped a lot over the past 20 years. In 2026 the FDA studied trace metals in tampons and concluded the amount released during use is too small to cause harm.",
    "clinicalNoteSources": [
      {
        "url": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/tampons",
        "label": "FDA: Tampons",
        "summary": "FDA must review and authorize tampons before sale; TSS is rare but linked to leaving tampons in too long, and a 2026 FDA study found trace metals released during use are too small to cause harm."
      }
    ],
    "warnings": [
      "Choose the lowest absorbency that handles your flow to lower your risk of toxic shock syndrome (TSS), a rare but serious illness that can be fatal.",
      "If you get a sudden fever (usually 102°F or more), vomiting, diarrhea, fainting or near fainting when standing up, dizziness, or a rash that looks like sunburn, remove the tampon at once and see a doctor right away.",
      "If you have had TSS warning signs before, check with your doctor before using tampons again.",
      "Alternating tampons with pads during your period can lower your TSS risk."
    ],
    "warningsSource": {
      "url": "https://playtextampons.com/pages/tss-information",
      "label": "Playtex: TSS Information"
    }
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
    ],
    "clinicalNote": "Tampons are medical devices in the US, and the FDA has to review and authorize each one before it can be sold, including checks on its materials and absorbency. The main safety concern is toxic shock syndrome (TSS), a rare but serious illness linked to leaving a tampon in too long, and reported cases have dropped a lot over the past 20 years. In 2026 the FDA studied trace metals in tampons and concluded the amount released during use is too small to cause harm.",
    "clinicalNoteSources": [
      {
        "url": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/tampons",
        "label": "FDA: Tampons",
        "summary": "FDA must review and authorize tampons before sale; TSS is rare but linked to leaving tampons in too long, and a 2026 FDA study found trace metals released during use are too small to cause harm."
      }
    ],
    "warnings": [
      "Change your tampon every 4 to 8 hours, and never leave one in for more than 8 hours.",
      "Use the lowest absorbency tampon you need for your flow.",
      "Only use tampons during your period, not for other vaginal bleeding or discharge.",
      "If you get a sudden high fever, chills, vomiting, diarrhea, rash, dizziness or fainting, take the tampon out and get medical care right away, since these can be signs of toxic shock syndrome (TSS)."
    ],
    "warningsSource": {
      "url": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/tampons",
      "label": "FDA: Tampons"
    }
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
      "sourceUrl": "https://www.ob-tampons.com/pages/tss",
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
    ],
    "clinicalNote": "Tampons are medical devices in the US, and the FDA has to review and authorize each one before it can be sold, including checks on its materials and absorbency. The main safety concern is toxic shock syndrome (TSS), a rare but serious illness linked to leaving a tampon in too long, and reported cases have dropped a lot over the past 20 years. In 2026 the FDA studied trace metals in tampons and concluded the amount released during use is too small to cause harm.",
    "clinicalNoteSources": [
      {
        "url": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/tampons",
        "label": "FDA: Tampons",
        "summary": "FDA must review and authorize tampons before sale; TSS is rare but linked to leaving tampons in too long, and a 2026 FDA study found trace metals released during use are too small to cause harm."
      }
    ],
    "warnings": [
      "Choose the lowest absorbency that handles your flow to lower your risk of toxic shock syndrome (TSS), a rare but serious illness that can be fatal.",
      "If you get a sudden fever (usually 102°F or more), vomiting, diarrhea, fainting or near fainting when standing up, dizziness, or a rash that looks like sunburn, remove the tampon at once and see a doctor right away.",
      "If you have had TSS warning signs before, check with your doctor before using tampons again.",
      "Alternating tampons with pads during your period can lower your TSS risk."
    ],
    "warningsSource": {
      "url": "https://www.ob-tampons.com/pages/tss",
      "label": "o.b.: Toxic Shock Syndrome (TSS)"
    }
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
    ],
    "clinicalNote": "Tampons are medical devices in the US, and the FDA has to review and authorize each one before it can be sold, including checks on its materials and absorbency. The main safety concern is toxic shock syndrome (TSS), a rare but serious illness linked to leaving a tampon in too long, and reported cases have dropped a lot over the past 20 years. In 2026 the FDA studied trace metals in tampons and concluded the amount released during use is too small to cause harm.",
    "clinicalNoteSources": [
      {
        "url": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/tampons",
        "label": "FDA: Tampons",
        "summary": "FDA must review and authorize tampons before sale; TSS is rare but linked to leaving tampons in too long, and a 2026 FDA study found trace metals released during use are too small to cause harm."
      }
    ],
    "warnings": [
      "Change your tampon every 4 to 8 hours, and never leave one in for more than 8 hours.",
      "Use the lowest absorbency tampon you need for your flow.",
      "Only use tampons during your period, not for other vaginal bleeding or discharge.",
      "If you get a sudden high fever, chills, vomiting, diarrhea, rash, dizziness or fainting, take the tampon out and get medical care right away, since these can be signs of toxic shock syndrome (TSS)."
    ],
    "warningsSource": {
      "url": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/tampons",
      "label": "FDA: Tampons"
    }
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
    ],
    "howToUse": {
      "intro": "Per FDA tampon guidance (follow the insert in your Seventh Generation box for applicator steps):",
      "steps": [
        "Wash your hands before you insert and after you remove a tampon.",
        "Follow the package directions for your applicator type.",
        "Use the lowest absorbency that handles your flow.",
        "Change it every 4 to 8 hours, even on light days, and never wear one longer than 8 hours.",
        "Use tampons only for your period, not for other bleeding or discharge.",
        "Take it out and call your provider if you get a sudden high fever, rash or dizziness, which can be signs of toxic shock syndrome."
      ],
      "sourceUrl": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/tampons",
      "sourceLabel": "FDA: Tampons, facts and safe use"
    },
    "ingredientScience": [
      {
        "name": "Organic cotton",
        "text": "Cotton is one of the standard tampon fibers, and every FDA-authorized tampon, organic or not, must be bleached without elemental chlorine to keep dioxin (an environmental pollutant) out. Small amounts of metals have been found in both organic and regular tampons, but FDA's 2026 study concluded the amount likely released during use is too small to cause harm.",
        "citations": [
          {
            "url": "https://www.fda.gov/consumers/consumer-updates/facts-tampons-and-tampon-safety",
            "label": "FDA: The Facts on Tampons and Tampon Safety"
          }
        ]
      }
    ],
    "clinicalNote": "All FDA-authorized tampons are made of cotton, rayon, or a blend, and their fibers are bleached without elemental chlorine. A 2024 NIH-funded study of 30 tampons from 14 brands found small amounts of metals in all of them, with more arsenic in the organic ones and more lead in the non-organic ones; it did not test whether any metal gets into your body. FDA followed up with its own study in 2026 and concluded the amount likely released during use is too small to cause harm. Toxic shock syndrome (TSS, a rare but serious infection caused by a bacterial toxin) is linked to tampons in general, so the safe-use rules are the same for organic tampons.",
    "clinicalNoteSources": [
      {
        "url": "https://www.fda.gov/consumers/consumer-updates/facts-tampons-and-tampon-safety",
        "label": "FDA: The Facts on Tampons and Tampon Safety",
        "summary": "FDA's tampon safety page covering materials, chlorine-free bleaching, its 2026 metals study, and TSS."
      },
      {
        "url": "https://factor.niehs.nih.gov/2024/8/feature/3-feature-metals-in-tampons",
        "label": "NIH (NIEHS Environmental Factor): Metals in tampons",
        "summary": "NIH summary of the 2024 study that measured metals in organic and non-organic tampons and found health effects are not yet known."
      }
    ],
    "warnings": [
      "Change your tampon every 4 to 8 hours, and never wear one for more than 8 hours.",
      "Use the lowest absorbency you need, and only during your period.",
      "Stop using tampons and get medical care right away if you get a sudden fever (usually 102°F or higher), vomiting, diarrhea, fainting or dizziness, or a sunburn-like rash during or soon after your period.",
      "Stop and contact your provider if you have pain, unusual symptoms, or an allergic reaction."
    ],
    "warningsSource": {
      "url": "https://www.fda.gov/consumers/consumer-updates/facts-tampons-and-tampon-safety",
      "label": "FDA: The Facts on Tampons and Tampon Safety"
    }
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
    ],
    "howToUse": {
      "intro": "Per Rael's package directions and FDA tampon guidance:",
      "steps": [
        "Wash your hands, unwrap the tampon, and gently pull out the back of the applicator until it clicks into place.",
        "Hold the applicator between your thumb and middle finger and insert it with the tip angled slightly up.",
        "Push the inner tube with your index finger, then remove the applicator and leave the string outside.",
        "Use the lowest absorbency that handles your flow, and change it every 4 to 8 hours, never longer than 8.",
        "To remove, hold the string and pull slowly forward at an angle.",
        "Take it out and call your provider if you get a sudden high fever, rash or dizziness, which can be signs of toxic shock syndrome."
      ],
      "sourceUrl": "https://www.dodoskin.com/products/rael-organic-cotton-compact-tampons-super-4-packs",
      "sourceLabel": "Rael compact tampon directions (retailer listing) and FDA tampon guidance"
    },
    "ingredientScience": [
      {
        "name": "Organic cotton",
        "text": "Cotton is one of the standard tampon fibers, and every FDA-authorized tampon, organic or not, must be bleached without elemental chlorine to keep dioxin (an environmental pollutant) out. Small amounts of metals have been found in both organic and regular tampons, but FDA's 2026 study concluded the amount likely released during use is too small to cause harm.",
        "citations": [
          {
            "url": "https://www.fda.gov/consumers/consumer-updates/facts-tampons-and-tampon-safety",
            "label": "FDA: The Facts on Tampons and Tampon Safety"
          }
        ]
      }
    ],
    "clinicalNote": "All FDA-authorized tampons are made of cotton, rayon, or a blend, and their fibers are bleached without elemental chlorine. A 2024 NIH-funded study of 30 tampons from 14 brands found small amounts of metals in all of them, with more arsenic in the organic ones and more lead in the non-organic ones; it did not test whether any metal gets into your body. FDA followed up with its own study in 2026 and concluded the amount likely released during use is too small to cause harm. Toxic shock syndrome (TSS, a rare but serious infection caused by a bacterial toxin) is linked to tampons in general, so the safe-use rules are the same for organic tampons.",
    "clinicalNoteSources": [
      {
        "url": "https://www.fda.gov/consumers/consumer-updates/facts-tampons-and-tampon-safety",
        "label": "FDA: The Facts on Tampons and Tampon Safety",
        "summary": "FDA's tampon safety page covering materials, chlorine-free bleaching, its 2026 metals study, and TSS."
      },
      {
        "url": "https://factor.niehs.nih.gov/2024/8/feature/3-feature-metals-in-tampons",
        "label": "NIH (NIEHS Environmental Factor): Metals in tampons",
        "summary": "NIH summary of the 2024 study that measured metals in organic and non-organic tampons and found health effects are not yet known."
      }
    ],
    "warnings": [
      "Change your tampon every 4 to 8 hours, and never wear one for more than 8 hours.",
      "Use the lowest absorbency you need, and only during your period.",
      "Stop using tampons and get medical care right away if you get a sudden fever (usually 102°F or higher), vomiting, diarrhea, fainting or dizziness, or a sunburn-like rash during or soon after your period.",
      "Stop and contact your provider if you have pain, unusual symptoms, or an allergic reaction."
    ],
    "warningsSource": {
      "url": "https://www.fda.gov/consumers/consumer-updates/facts-tampons-and-tampon-safety",
      "label": "FDA: The Facts on Tampons and Tampon Safety"
    }
  },
  "p-lena-cup": {
    "whoItsFor": [
      "First-time cup users, especially with the softer Sensitive version",
      "People who prefer a firmer feel, who can choose the Original",
      "Anyone who wants one reusable product instead of buying tampons or pads every cycle"
    ],
    "howToUse": {
      "intro": "Per Lena's own user manual:",
      "steps": [
        "Wash your hands and the cup, and boil it for 5 to 7 minutes before first use if you like.",
        "Fold the cup (7 fold, punch-down or C-fold), relax, and guide it in pointing toward your tailbone.",
        "Let it open, then run a finger around the base and give it a gentle twist to check it has sealed.",
        "Wear it for up to 12 hours, including overnight, and empty it at least twice a day.",
        "To remove, pinch the base to break the seal and wiggle it out upright instead of pulling on the stem.",
        "Rinse with cold water, wash with warm water and mild soap, and clean it thoroughly at the end of your cycle."
      ],
      "sourceUrl": "https://cdn.shopify.com/s/files/1/1274/0057/files/LENA_Manual_English.pdf",
      "sourceLabel": "Lena Cup: User Manual (English)"
    },
    "ingredientScience": [
      {
        "name": "Medical-grade silicone",
        "text": "FDA says cups are usually made of silicone or rubber, and that silicone is the one to pick if you're sensitive to latex, since rubber cups can set off a latex allergy. That's the main evidence-backed point about the material itself; there's little research comparing silicone grades.",
        "citations": [
          {
            "url": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-cups",
            "label": "FDA: Menstrual Cups"
          }
        ]
      }
    ],
    "clinicalNote": "A 2019 review in The Lancet Public Health pooled 43 studies with 3,319 people and found cups leaked about the same as or less than pads and tampons in the four studies that compared them directly, and about 73% of people wanted to keep using one. Four studies found no harm to vaginal flora (the normal bacteria that keep the vagina healthy), but the review did log rare problems, including 5 cases of toxic shock syndrome and 13 IUDs that got pulled out of place. Most of the studies were low quality, so the authors called cups a safe option while asking for better research. If you have an IUD, FDA advises talking to your gynecologist before you start using a cup.",
    "clinicalNoteSources": [
      {
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC6669309/",
        "label": "The Lancet Public Health (2019), van Eijk et al.: Menstrual cup use, leakage, acceptability, safety, and availability (DOAJ record)",
        "summary": "Systematic review of 43 studies finding cups leak about the same as or less than disposables, with rare harms including TSS and IUD displacement."
      },
      {
        "url": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-cups",
        "label": "FDA: Menstrual Cups",
        "summary": "FDA's menstrual cup page covering materials, wear time, cleaning, and IUD cautions."
      }
    ],
    "warnings": [
      "Empty the cup about every 8 to 12 hours, following the label.",
      "Wash your hands before and after handling the cup, and clean it as the instructions say (typically boiling it for 1 to 2 minutes at the end of your cycle).",
      "Talk to your gynecologist first if you have an IUD, since a cup can interfere with the IUD strings and placement.",
      "Stop using it and contact your provider if you get itching, rash, pain, swelling, or discomfort, and don't use it for bleeding or discharge that isn't your period."
    ],
    "warningsSource": {
      "url": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-cups",
      "label": "FDA: Menstrual Cups"
    }
  },
  "p-ruby-cup": {
    "whoItsFor": [
      "People who want a reusable medical-grade silicone cup",
      "Shoppers who care about social impact: for every cup sold, one is donated to someone without access to period products",
      "Anyone looking to cut down on disposable period waste"
    ],
    "howToUse": {
      "intro": "Per FDA menstrual cup guidance (follow the leaflet in your Ruby Cup box for folding and insertion steps):",
      "steps": [
        "Wash your hands before and after handling the cup.",
        "Wash the cup with soap and water before you insert it.",
        "Follow Ruby Cup's own instructions for folding, inserting and removing it.",
        "Empty it every 8 to 12 hours, and don't leave it in longer than the label allows.",
        "Boil it for 1 to 2 minutes at the end of each cycle.",
        "Stop using it and call your provider if you get itching, rash, pain or swelling, and check with your gynecologist first if you have an IUD."
      ],
      "sourceUrl": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-cups",
      "sourceLabel": "FDA: Menstrual Cups"
    },
    "ingredientScience": [
      {
        "name": "Medical-grade silicone",
        "text": "FDA says cups are usually made of silicone or rubber, and that silicone is the one to pick if you're sensitive to latex, since rubber cups can set off a latex allergy. That's the main evidence-backed point about the material itself; there's little research comparing silicone grades.",
        "citations": [
          {
            "url": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-cups",
            "label": "FDA: Menstrual Cups"
          }
        ]
      }
    ],
    "clinicalNote": "A 2019 review in The Lancet Public Health pooled 43 studies with 3,319 people and found cups leaked about the same as or less than pads and tampons in the four studies that compared them directly, and about 73% of people wanted to keep using one. Four studies found no harm to vaginal flora (the normal bacteria that keep the vagina healthy), but the review did log rare problems, including 5 cases of toxic shock syndrome and 13 IUDs that got pulled out of place. Most of the studies were low quality, so the authors called cups a safe option while asking for better research. If you have an IUD, FDA advises talking to your gynecologist before you start using a cup.",
    "clinicalNoteSources": [
      {
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC6669309/",
        "label": "The Lancet Public Health (2019), van Eijk et al.: Menstrual cup use, leakage, acceptability, safety, and availability (DOAJ record)",
        "summary": "Systematic review of 43 studies finding cups leak about the same as or less than disposables, with rare harms including TSS and IUD displacement."
      },
      {
        "url": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-cups",
        "label": "FDA: Menstrual Cups",
        "summary": "FDA's menstrual cup page covering materials, wear time, cleaning, and IUD cautions."
      }
    ],
    "warnings": [
      "Empty the cup about every 8 to 12 hours, following the label.",
      "Wash your hands before and after handling the cup, and clean it as the instructions say (typically boiling it for 1 to 2 minutes at the end of your cycle).",
      "Talk to your gynecologist first if you have an IUD, since a cup can interfere with the IUD strings and placement.",
      "Stop using it and contact your provider if you get itching, rash, pain, swelling, or discomfort, and don't use it for bleeding or discharge that isn't your period."
    ],
    "warningsSource": {
      "url": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-cups",
      "label": "FDA: Menstrual Cups"
    }
  },
  "p-organicup": {
    "whoItsFor": [
      "Teens and first-time cup users, who can start with the Mini",
      "People with a low cervix, who may find the Mini fits better",
      "Anyone who wants a soft silicone cup with several sizes to choose from"
    ],
    "howToUse": {
      "intro": "Per AllMatters' (OrganiCup's) own product page and FAQ:",
      "steps": [
        "Pick a comfortable position and fold the cup with a C-fold or punch-down fold.",
        "Slide it in angled toward your tailbone until the whole cup and stem are inside, then let it open.",
        "Check the seal: the base should feel round, and a gentle tug on the stem should meet resistance.",
        "Wear it for up to 12 hours, then pinch the base to break the seal and wiggle it out upright.",
        "Empty it, rinse it with water (keeping the air holes clear), and reinsert.",
        "Once your period ends, sanitize it in boiling water for 3 to 5 minutes."
      ],
      "sourceUrl": "https://allmatters.com/products/menstrual-cup",
      "sourceLabel": "AllMatters: OrganiCup Menstrual Cup"
    },
    "ingredientScience": [
      {
        "name": "Medical-grade silicone",
        "text": "FDA says cups are usually made of silicone or rubber, and that silicone is the one to pick if you're sensitive to latex, since rubber cups can set off a latex allergy. That's the main evidence-backed point about the material itself; there's little research comparing silicone grades.",
        "citations": [
          {
            "url": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-cups",
            "label": "FDA: Menstrual Cups"
          }
        ]
      }
    ],
    "clinicalNote": "A 2019 review in The Lancet Public Health pooled 43 studies with 3,319 people and found cups leaked about the same as or less than pads and tampons in the four studies that compared them directly, and about 73% of people wanted to keep using one. Four studies found no harm to vaginal flora (the normal bacteria that keep the vagina healthy), but the review did log rare problems, including 5 cases of toxic shock syndrome and 13 IUDs that got pulled out of place. Most of the studies were low quality, so the authors called cups a safe option while asking for better research. If you have an IUD, FDA advises talking to your gynecologist before you start using a cup.",
    "clinicalNoteSources": [
      {
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC6669309/",
        "label": "The Lancet Public Health (2019), van Eijk et al.: Menstrual cup use, leakage, acceptability, safety, and availability (DOAJ record)",
        "summary": "Systematic review of 43 studies finding cups leak about the same as or less than disposables, with rare harms including TSS and IUD displacement."
      },
      {
        "url": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-cups",
        "label": "FDA: Menstrual Cups",
        "summary": "FDA's menstrual cup page covering materials, wear time, cleaning, and IUD cautions."
      }
    ],
    "warnings": [
      "Empty the cup about every 8 to 12 hours, following the label.",
      "Wash your hands before and after handling the cup, and clean it as the instructions say (typically boiling it for 1 to 2 minutes at the end of your cycle).",
      "Talk to your gynecologist first if you have an IUD, since a cup can interfere with the IUD strings and placement.",
      "Stop using it and contact your provider if you get itching, rash, pain, swelling, or discomfort, and don't use it for bleeding or discharge that isn't your period."
    ],
    "warningsSource": {
      "url": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-cups",
      "label": "FDA: Menstrual Cups"
    }
  },
  "p-femmycycle": {
    "whoItsFor": [
      "People who find cup stems uncomfortable or hard to grip",
      "Those with a high cervix who want a ring pull to reach for",
      "Anyone who wants a reusable silicone cup with a stemless design"
    ],
    "howToUse": {
      "intro": "Per FemmyCycle's product listing and FDA menstrual cup guidance:",
      "steps": [
        "Read the instructions that come in the box before your first use.",
        "Pick your size by how high your cervix sits, as FemmyCycle recommends.",
        "Wash your hands and the cup with soap and water before inserting it.",
        "Wear it for up to 12 hours, or empty it sooner if your flow is heavy.",
        "Use the ring handle to help pull it out, and use the spout to empty it without spilling.",
        "Boil it for 1 to 2 minutes at the end of each cycle, and check with your gynecologist first if you have an IUD."
      ],
      "sourceUrl": "https://www.apotea.se/femmycycle-normal",
      "sourceLabel": "Apotea: FemmyCycle Normal product listing (plus FDA: Menstrual Cups)"
    },
    "ingredientScience": [
      {
        "name": "Medical-grade silicone",
        "text": "FDA says cups are usually made of silicone or rubber, and that silicone is the one to pick if you're sensitive to latex, since rubber cups can set off a latex allergy. That's the main evidence-backed point about the material itself; there's little research comparing silicone grades.",
        "citations": [
          {
            "url": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-cups",
            "label": "FDA: Menstrual Cups"
          }
        ]
      }
    ],
    "clinicalNote": "A 2019 review in The Lancet Public Health pooled 43 studies with 3,319 people and found cups leaked about the same as or less than pads and tampons in the four studies that compared them directly, and about 73% of people wanted to keep using one. Four studies found no harm to vaginal flora (the normal bacteria that keep the vagina healthy), but the review did log rare problems, including 5 cases of toxic shock syndrome and 13 IUDs that got pulled out of place. Most of the studies were low quality, so the authors called cups a safe option while asking for better research. If you have an IUD, FDA advises talking to your gynecologist before you start using a cup.",
    "clinicalNoteSources": [
      {
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC6669309/",
        "label": "The Lancet Public Health (2019), van Eijk et al.: Menstrual cup use, leakage, acceptability, safety, and availability (DOAJ record)",
        "summary": "Systematic review of 43 studies finding cups leak about the same as or less than disposables, with rare harms including TSS and IUD displacement."
      },
      {
        "url": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-cups",
        "label": "FDA: Menstrual Cups",
        "summary": "FDA's menstrual cup page covering materials, wear time, cleaning, and IUD cautions."
      }
    ],
    "warnings": [
      "Empty the cup about every 8 to 12 hours, following the label.",
      "Wash your hands before and after handling the cup, and clean it as the instructions say (typically boiling it for 1 to 2 minutes at the end of your cycle).",
      "Talk to your gynecologist first if you have an IUD, since a cup can interfere with the IUD strings and placement.",
      "Stop using it and contact your provider if you get itching, rash, pain, swelling, or discomfort, and don't use it for bleeding or discharge that isn't your period."
    ],
    "warningsSource": {
      "url": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-cups",
      "label": "FDA: Menstrual Cups"
    }
  },
  "p-flex-cup": {
    "whoItsFor": [
      "First-time cup users who are nervous about removal",
      "Anyone who has struggled to break the seal on a traditional cup",
      "People who want a reusable medical-grade silicone option"
    ],
    "howToUse": {
      "intro": "Per Flex's own How to Use page:",
      "steps": [
        "Wash the cup with mild soap before first use, and boil it for 10 minutes between periods.",
        "Fold it (Flex suggests the punch-down fold), relax, and insert it; it can sit low, and the pull tab can hang outside or tuck up.",
        "Pinch and twist the base, then run a finger around it to check it has fully opened.",
        "Wear it for up to 12 hours at a time.",
        "To remove, wash your hands and pull the tab down gently to break the seal, going slowly to avoid spills.",
        "Empty it into the toilet, rinse, wash with mild soap and reinsert."
      ],
      "sourceUrl": "https://flexfits.com/pages/how-to-use-cup",
      "sourceLabel": "Flex: How to use Flex Cup"
    },
    "clinicalSources": [
      {
        "url": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-cups",
        "label": "FDA: Menstrual Cups",
        "summary": "FDA advises washing your hands and the cup before use, emptying it every 8 to 12 hours, boiling reusable cups for 1 to 2 minutes at the end of each cycle, and asking your gynecologist first if you have an IUD, since a cup could interfere with the strings or placement."
      }
    ],
    "communityReview": "Feedback is mostly positive about removal. Reviewers, including people with limited hand dexterity, say the pull tab makes breaking the seal much easier than pinching a regular cup, and many report comfortable, leak-free wear. Complaints are that the tab makes the cup harder to fold and clean, some feel an uncomfortable pop when the seal breaks, and one tester found the suction too strong and had leaks where the tab exits. Some cup fans also say they avoid the brand over claims that its design copies the Keela cup.",
    "communityReviewSources": [
      {
        "url": "https://reviewed.com/health/content/flex-cup-review",
        "label": "Reviewed: Flex Cup review"
      },
      {
        "url": "https://putacupinit.com/flex-cup/comment-page-1/",
        "label": "Put A Cup In It: Flex Cup post and reader comments"
      }
    ],
    "ingredientScience": [
      {
        "name": "Medical-grade silicone",
        "text": "FDA says cups are usually made of silicone or rubber, and that silicone is the one to pick if you're sensitive to latex, since rubber cups can set off a latex allergy. That's the main evidence-backed point about the material itself; there's little research comparing silicone grades.",
        "citations": [
          {
            "url": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-cups",
            "label": "FDA: Menstrual Cups"
          }
        ]
      }
    ],
    "clinicalNote": "A 2019 review in The Lancet Public Health pooled 43 studies with 3,319 people and found cups leaked about the same as or less than pads and tampons in the four studies that compared them directly, and about 73% of people wanted to keep using one. Four studies found no harm to vaginal flora (the normal bacteria that keep the vagina healthy), but the review did log rare problems, including 5 cases of toxic shock syndrome and 13 IUDs that got pulled out of place. Most of the studies were low quality, so the authors called cups a safe option while asking for better research. If you have an IUD, FDA advises talking to your gynecologist before you start using a cup.",
    "clinicalNoteSources": [
      {
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC6669309/",
        "label": "The Lancet Public Health (2019), van Eijk et al.: Menstrual cup use, leakage, acceptability, safety, and availability (DOAJ record)",
        "summary": "Systematic review of 43 studies finding cups leak about the same as or less than disposables, with rare harms including TSS and IUD displacement."
      },
      {
        "url": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-cups",
        "label": "FDA: Menstrual Cups",
        "summary": "FDA's menstrual cup page covering materials, wear time, cleaning, and IUD cautions."
      }
    ],
    "warnings": [
      "Empty the cup about every 8 to 12 hours, following the label.",
      "Wash your hands before and after handling the cup, and clean it as the instructions say (typically boiling it for 1 to 2 minutes at the end of your cycle).",
      "Talk to your gynecologist first if you have an IUD, since a cup can interfere with the IUD strings and placement.",
      "Stop using it and contact your provider if you get itching, rash, pain, swelling, or discomfort, and don't use it for bleeding or discharge that isn't your period."
    ],
    "warningsSource": {
      "url": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-cups",
      "label": "FDA: Menstrual Cups"
    }
  },
  "p-ziggy-disc": {
    "whoItsFor": [
      "People with heavy flow: in a 2023 lab study using red blood cells, the Ziggy disc held about 80 mL, the most of any product tested",
      "Those who want a reusable disc that can be worn during intimacy",
      "People who would rather skip sizing decisions, since it comes in one size"
    ],
    "scienceSources": [
      {
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC10847380/",
        "label": "DeLoughery et al., BMJ Sexual & Reproductive Health (2024): red blood cell capacity of menstrual products",
        "summary": "In lab testing with red blood cells, discs held the most of any product type (about 61 mL on average), and the Ziggy disc held the most of all products tested, about 80 mL."
      }
    ],
    "howToUse": {
      "intro": "Per Intimina's Ziggy Cup directions as published by retailers:",
      "steps": [
        "Boil the cup for 5 minutes before first use and again after each period.",
        "Wash your hands, then squeeze the rim into an 8 shape with the back rim against your palm.",
        "Relax, push the back rim down and back as far as it goes, then tuck the front rim up behind your pubic bone.",
        "Follow the wear time on your box: retailer copies of the directions list 8 to 12 hours.",
        "To remove, wash your hands, hook a finger under the front rim, and pull it out level to avoid spills.",
        "Empty it into the toilet, rinse, and reinsert, keeping it in its case between periods."
      ],
      "sourceUrl": "https://www.lookfantastic.com/p/intimina-ziggy-cup-2-size-a/13761957",
      "sourceLabel": "Pure Eros: Intimina Ziggy Cup listing with directions"
    },
    "clinicalSources": [
      {
        "url": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-cups",
        "label": "FDA: Menstrual Cups",
        "summary": "FDA, which groups menstrual discs with cups, says to wash your hands and the device before use, empty it every 8 to 12 hours, boil reusable ones for 1 to 2 minutes at the end of each cycle, and check with your gynecologist first if you have an IUD."
      }
    ],
    "ingredientScience": [
      {
        "name": "Medical-grade silicone",
        "text": "FDA says cups are usually made of silicone or rubber, and that silicone is the one to pick if you're sensitive to latex, since rubber cups can set off a latex allergy. That's the main evidence-backed point about the material itself; there's little research comparing silicone grades.",
        "citations": [
          {
            "url": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-cups",
            "label": "FDA: Menstrual Cups"
          }
        ]
      }
    ],
    "clinicalNote": "A 2024 lab study in BMJ Sexual & Reproductive Health tested real red blood cells and found discs held the most of any product type, about 61 mL on average, compared with 20 to 34 mL for Tampax tampons and 22 to 35 mL for DivaCup cups. Intimina's Ziggy was one of the discs tested and held 80 mL, the most of any single product in the study. The authors note products may hold less in your body than in the lab, and that doctors checking for heavy periods should ask which products you use, since older bleeding measures were built around older products. FDA groups discs with cups and advises talking to your gynecologist first if you have an IUD.",
    "clinicalNoteSources": [
      {
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC10847380/",
        "label": "BMJ Sexual & Reproductive Health (2024), DeLoughery et al.: Red blood cell capacity of modern menstrual products",
        "summary": "Lab study using red blood cells found menstrual discs held the most blood of the products tested."
      },
      {
        "url": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-cups",
        "label": "FDA: Menstrual Cups",
        "summary": "FDA's menstrual cup page, which also covers discs, with wear time and IUD cautions."
      }
    ],
    "warnings": [
      "Empty the cup about every 8 to 12 hours, following the label.",
      "Wash your hands before and after handling the cup, and clean it as the instructions say (typically boiling it for 1 to 2 minutes at the end of your cycle).",
      "Talk to your gynecologist first if you have an IUD, since a cup can interfere with the IUD strings and placement.",
      "Stop using it and contact your provider if you get itching, rash, pain, swelling, or discomfort, and don't use it for bleeding or discharge that isn't your period."
    ],
    "warningsSource": {
      "url": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-cups",
      "label": "FDA: Menstrual Cups"
    }
  },
  "p-lumma-disc": {
    "whoItsFor": [
      "People who want to choose a disc size (S, M or L) for a better fit",
      "Those who find disc removal tricky and want a string option",
      "People with heavier flow: in a 2023 lab study, menstrual discs held the most of any product type, about 61 mL on average"
    ],
    "scienceSources": [
      {
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC10847380/",
        "label": "DeLoughery et al., BMJ Sexual & Reproductive Health (2024): red blood cell capacity of menstrual products",
        "summary": "In lab testing with red blood cells, menstrual discs held the most of any product type, about 61 mL on average, versus roughly 20 to 50 mL for tampons, cups and heavy pads."
      }
    ],
    "howToUse": {
      "intro": "Per Lumma's directions on Period Nirvana's shop page:",
      "steps": [
        "Practice before your period, and wear a liner or period underwear as backup while you learn.",
        "Pinch the rim together lengthwise to fold it, then guide it in angled down toward your tailbone until it sits below your cervix.",
        "Lift the front rim and tuck it behind your pubic bone, which the brand calls the key step for preventing leaks.",
        "Wear it for up to 12 hours, emptying sooner on heavy days.",
        "To remove, relax, use the string to find the rim, hook a finger under the front edge, and pull forward and down while keeping it level.",
        "Wash it with gentle soap every time you empty it, and boil it monthly or use a cup steamer."
      ],
      "sourceUrl": "https://shop.periodnirvana.com/products/lumma-disc",
      "sourceLabel": "Period Nirvana shop: Lumma menstrual disc"
    },
    "clinicalSources": [
      {
        "url": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-cups",
        "label": "FDA: Menstrual Cups",
        "summary": "FDA, which groups menstrual discs with cups, notes that finding the right size can be hard, and advises emptying every 8 to 12 hours, boiling reusable ones at the end of each cycle, and checking with your gynecologist first if you have an IUD."
      }
    ],
    "ingredientScience": [
      {
        "name": "Medical-grade silicone",
        "text": "FDA says cups are usually made of silicone or rubber, and that silicone is the one to pick if you're sensitive to latex, since rubber cups can set off a latex allergy. That's the main evidence-backed point about the material itself; there's little research comparing silicone grades.",
        "citations": [
          {
            "url": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-cups",
            "label": "FDA: Menstrual Cups"
          }
        ]
      }
    ],
    "clinicalNote": "A 2024 lab study in BMJ Sexual & Reproductive Health tested real red blood cells and found discs held the most of any product type, about 61 mL on average, compared with 20 to 34 mL for Tampax tampons and 22 to 35 mL for DivaCup cups. Lumma was one of the discs tested, though the paper doesn't say which result was Lumma's. The authors note products may hold less in your body than in the lab, and that doctors checking for heavy periods should ask which products you use, since older bleeding measures were built around older products. FDA groups discs with cups and advises talking to your gynecologist first if you have an IUD.",
    "clinicalNoteSources": [
      {
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC10847380/",
        "label": "BMJ Sexual & Reproductive Health (2024), DeLoughery et al.: Red blood cell capacity of modern menstrual products",
        "summary": "Lab study using red blood cells found menstrual discs held the most blood of the products tested."
      },
      {
        "url": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-cups",
        "label": "FDA: Menstrual Cups",
        "summary": "FDA's menstrual cup page, which also covers discs, with wear time and IUD cautions."
      }
    ],
    "warnings": [
      "Empty the cup about every 8 to 12 hours, following the label.",
      "Wash your hands before and after handling the cup, and clean it as the instructions say (typically boiling it for 1 to 2 minutes at the end of your cycle).",
      "Talk to your gynecologist first if you have an IUD, since a cup can interfere with the IUD strings and placement.",
      "Stop using it and contact your provider if you get itching, rash, pain, swelling, or discomfort, and don't use it for bleeding or discharge that isn't your period."
    ],
    "warningsSource": {
      "url": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-cups",
      "label": "FDA: Menstrual Cups"
    }
  },
  "p-softdisc": {
    "whoItsFor": [
      "People curious about discs who want to try one before buying a reusable",
      "Those who want up to 12 hours of wear",
      "Not the pick if cutting waste is your goal: it's single-use"
    ],
    "howToUse": {
      "intro": "Per Softdisc's package directions:",
      "steps": [
        "Wash your hands, then squeeze opposite sides of the rim together.",
        "Insert the disc fully into the vagina, where it molds to your shape.",
        "Wear it for up to 12 hours, and never longer.",
        "To remove, hook a finger under the rim and pull slowly.",
        "Throw it away after one use.",
        "Don't use it if you have an IUD or have ever had toxic shock syndrome, and check with your doctor first after childbirth, gynecologic surgery, miscarriage or abortion."
      ],
      "sourceUrl": "https://pbis.instacart.com/products/17365289-softdisc-disposable-14-ea",
      "sourceLabel": "Softdisc Disposable listing with package directions (Instacart)"
    },
    "clinicalSources": [
      {
        "url": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-cups",
        "label": "FDA: Menstrual Cups",
        "summary": "FDA, which groups menstrual discs with cups, says to wash your hands before handling one, follow the label for wear time, use it only for period bleeding, and stop and call your provider if you have itching, rash, pain or swelling."
      }
    ],
    "ingredientScience": [],
    "clinicalNote": "A 2024 lab study in BMJ Sexual & Reproductive Health tested real red blood cells and found discs held the most of any product type, about 61 mL on average, compared with 20 to 34 mL for Tampax tampons and 22 to 35 mL for DivaCup cups. Softdisc itself was not one of the products tested. The authors note products may hold less in your body than in the lab, and that doctors checking for heavy periods should ask which products you use, since older bleeding measures were built around older products. FDA groups discs with cups and advises talking to your gynecologist first if you have an IUD.",
    "clinicalNoteSources": [
      {
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC10847380/",
        "label": "BMJ Sexual & Reproductive Health (2024), DeLoughery et al.: Red blood cell capacity of modern menstrual products",
        "summary": "Lab study using red blood cells found menstrual discs held the most blood of the products tested."
      },
      {
        "url": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-cups",
        "label": "FDA: Menstrual Cups",
        "summary": "FDA's menstrual cup page, which also covers discs, with wear time and IUD cautions."
      }
    ],
    "warnings": [
      "Empty or replace the disc about every 8 to 12 hours, following the label.",
      "Wash your hands before and after inserting or removing it.",
      "Talk to your gynecologist first if you have an IUD, since it can interfere with the IUD strings and placement.",
      "Stop using it and contact your provider if you get itching, rash, pain, swelling, or discomfort, and don't use it for bleeding or discharge that isn't your period."
    ],
    "warningsSource": {
      "url": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-cups",
      "label": "FDA: Menstrual Cups"
    }
  },
  "p-period-nirvana-disc": {
    "whoItsFor": [
      "Those who want two sizes to choose from and a notch for removal",
      "People with heavier flow: in a 2023 lab study, menstrual discs held the most of any product type, about 61 mL on average"
    ],
    "scienceSources": [
      {
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC10847380/",
        "label": "DeLoughery et al., BMJ Sexual & Reproductive Health (2024): red blood cell capacity of menstrual products",
        "summary": "In lab testing with red blood cells, menstrual discs held the most of any product type, about 61 mL on average, versus roughly 20 to 50 mL for tampons, cups and heavy pads."
      }
    ],
    "clinicalSources": [
      {
        "url": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-cups",
        "label": "FDA: Menstrual Cups",
        "summary": "FDA, which groups menstrual discs with cups, says to wash your hands and the device before use, empty it every 8 to 12 hours, boil reusable ones for 1 to 2 minutes at the end of each cycle, and check with your gynecologist first if you have an IUD."
      }
    ],
    "ingredientScience": [
      {
        "name": "Medical-grade silicone",
        "text": "Most reusable discs and cups are made of medical-grade silicone, a soft, flexible material made for use inside the body. With proper care, these products can last years before you need to replace them.",
        "citations": [
          {
            "url": "https://www.nyp.org/healthmatters/your-guide-to-period-products",
            "label": "NewYork-Presbyterian Health Matters: Your Guide to Period Products"
          }
        ]
      }
    ],
    "clinicalNote": "A menstrual disc is a shallow, round cup that sits higher in the vagina than a tampon, right at the base of the cervix (the opening of the uterus), and it can be worn for up to 12 hours or until full. A NewYork-Presbyterian gynecologist says discs are generally fine with an IUD (a birth control device placed in the uterus) if you know where your IUD strings are, but a large 2019 review of menstrual cups did record 13 cases of IUDs being pulled out of place, so break the seal gently when removing. Like tampons, discs carry a small but serious risk of toxic shock syndrome (TSS), a rare bacterial infection; that same review counted 5 TSS cases in cup users. In studies of cups, leaks were similar to or lower than with pads or tampons.",
    "clinicalNoteSources": [
      {
        "url": "https://www.nyp.org/healthmatters/your-guide-to-period-products",
        "label": "NewYork-Presbyterian Health Matters: Your Guide to Period Products",
        "summary": "A gynecologist explains how discs sit at the base of the cervix, can be worn up to 12 hours, are generally safe with an IUD, and carry a small TSS risk."
      },
      {
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC6669309/",
        "label": "The Lancet Public Health 2019: Menstrual cup use, leakage, acceptability, safety, and availability (systematic review, via DOAJ)",
        "summary": "A review of 43 studies found cup leakage similar to or lower than pads and tampons, and recorded 5 TSS cases and 13 IUD dislodgements in cup users."
      }
    ],
    "warnings": [
      "Only use internal period products like tampons and menstrual cups when you have your period.",
      "Change your period products regularly, since wearing one too long can let harmful bacteria grow.",
      "Wash your hands before and after using a period product.",
      "Contact your healthcare provider if you have pain, fever or other unusual symptoms."
    ],
    "warningsSource": {
      "url": "https://www.fda.gov/medical-devices/products-and-medical-procedures/menstrual-product-options-facts-and-safe-use",
      "label": "FDA: Menstrual Product Options, Facts, and Safe Use"
    }
  },
  "p-aisle-underwear": {
    "whoItsFor": [
      "People who want to adjust absorbency by swapping inserts instead of buying separate pairs",
      "Those looking for PFAS-free period underwear in inclusive sizing",
      "Anyone who prefers organic cotton against their skin"
    ],
    "howToUse": {
      "intro": "Per Aisle's own guidance on wear and care:",
      "steps": [
        "Change when you feel damp or uncomfortable, roughly every 6 to 8 hours on heavy days and 10 to 12 hours on light days.",
        "On heavier days, add a removable Booster if your style has one, and pack a spare pair or Booster in case your flow changes.",
        "Rinse in cold water right after wearing to get out excess blood.",
        "Machine wash cold on a gentle cycle, with no fabric softener or bleach.",
        "Hang to dry if you can, since air drying protects the absorbent layers."
      ],
      "sourceUrl": "https://periodaisle.com/blogs/all/how-often-should-you-change-period-underwear-best-practices-for-maximum-comfort",
      "sourceLabel": "Aisle: How often should you change period underwear?"
    },
    "clinicalSources": [
      {
        "url": "https://www.fda.gov/medical-devices/products-and-medical-procedures/menstrual-product-options-facts-and-safe-use",
        "label": "FDA: Menstrual Product Options, Facts, and Safe Use",
        "summary": "FDA counts period underwear as a type of menstrual pad that absorbs flow outside the body, and its general advice for all period products is to change them regularly and contact your provider if you have pain, fever or other unusual symptoms."
      }
    ],
    "communityReview": "Reviews of the underwear itself are mostly positive: people say it feels soft and not bulky, handles overnight flow without leaks, holds up in the wash, and comes in an inclusive size range. The most common complaints are about the company rather than the product, including long shipping waits even with priority shipping, slow customer service and refunds, and a final-sale policy some only noticed after ordering. A few mention the Booster shifting out of place, staining over time, or needing to size up.",
    "communityReviewSources": [
      {
        "url": "https://thingtesting.com/brands/aisle/reviews",
        "label": "Thingtesting: Aisle reviews"
      }
    ],
    "ingredientScience": [
      {
        "name": "Organic cotton",
        "text": "Cotton lets air flow and cuts down on moisture buildup, which is why MedlinePlus recommends cotton underwear (or a cotton-lined crotch) over synthetic fabric to help prevent vaginitis, meaning irritation or infection of the vagina. That's standard self-care advice rather than something tested head to head in trials.",
        "citations": [
          {
            "url": "https://medlineplus.gov/ency/patientinstructions/000566.htm",
            "label": "MedlinePlus (NIH): Vaginitis, self-care"
          }
        ]
      },
      {
        "name": "PFAS-free absorbent layer",
        "text": "PFAS are \"forever chemicals\" that some makers use to help fabric repel liquid. The EPA says exposure to certain PFAS may be linked to lower fertility, higher cholesterol, weaker vaccine response and some cancers, though research on how different exposure levels affect health is still ongoing. Going PFAS-free avoids that question; the PFAS-free status here is the brand's own claim.",
        "citations": [
          {
            "url": "https://www.epa.gov/pfas/our-current-understanding-human-health-and-environmental-risks-pfas",
            "label": "US EPA: Our Current Understanding of the Human Health and Environmental Risks of PFAS"
          }
        ]
      }
    ],
    "clinicalNote": "Period underwear has absorbent layers plus a leak barrier and catches flow outside the body, and the FDA regulates it as a medical device like other menstrual products. A Cleveland Clinic ob/gyn says a typical pair holds about one to two tampons' worth of flow, so on heavy days you may need to change more often, and you shouldn't wear one pair for more than 12 hours. A 2025 study of reusable period products found PFAS (\"forever chemicals\") in all 19 products picked for closer testing, and the researchers think some period underwear has PFAS added to stop leaks, so a PFAS-free claim is worth looking for.",
    "clinicalNoteSources": [
      {
        "url": "https://health.clevelandclinic.org/does-period-underwear-work",
        "label": "Cleveland Clinic: What Is Period Underwear and Does It Work?",
        "summary": "An ob/gyn explains that period underwear typically holds one to two tampons' worth of flow and should not be worn more than 12 hours."
      },
      {
        "url": "https://www.fda.gov/medical-devices/products-and-medical-procedures/menstrual-product-options-facts-and-safe-use",
        "label": "FDA: Menstrual Product Options, Facts, and Safe Use",
        "summary": "FDA regulates menstrual products, including period underwear, as medical devices and advises changing them regularly."
      },
      {
        "url": "https://axial.acs.org/environmental-and-sustainable-chemistry/forever-chemicals-in-feminine-hygiene-products-expanded-findings-raise-new-pfas-concerns",
        "label": "American Chemical Society: summary of Wicks et al., Environ Sci Technol Lett 2025 (doi:10.1021/acs.estlett.5c00553)",
        "summary": "A 2025 study of 59 reusable period products found PFAS in all 19 chosen for closer testing; researchers called the PFAS use unnecessary."
      }
    ],
    "warnings": [
      "Rinse in cold water right after use to remove excess blood.",
      "Skip fabric softener and bleach, which can stop the absorbent layers from working.",
      "Switch to a fresh pair if you start to feel damp or uncomfortable."
    ],
    "warningsSource": {
      "url": "https://periodaisle.com/blogs/all/how-often-should-you-change-period-underwear-best-practices-for-maximum-comfort",
      "label": "Aisle: How Often Should You Change Period Underwear?"
    }
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
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC10847380/",
        "label": "DeLoughery et al., BMJ Sexual & Reproductive Health (2024): red blood cell capacity of menstrual products",
        "summary": "In lab testing with red blood cells, super-absorbency period underwear held about 2 mL on average, far less than tampons, cups, discs or heavy pads, so it works best as backup or for lighter flow."
      }
    ],
    "howToUse": {
      "intro": "Per The Period Company's product page:",
      "steps": [
        "Wear them like regular underwear, ideally on your heaviest days.",
        "Check after about 4 hours on a heavy day, then stretch the time gradually to learn your limit (the brand says about 8 hours is average).",
        "Plan on roughly 3 to 4 pairs for each of your first two heavy days.",
        "Rinse for a few seconds, then hand wash or machine wash on regular settings without bleach.",
        "Tumble dry low or hang dry, and don't dry clean."
      ],
      "sourceUrl": "https://www.period.co/products/the-bikini",
      "sourceLabel": "The Period Company: The Bikini Period. in Organic Cotton For Heavy Flows"
    },
    "clinicalNote": "Period underwear has absorbent layers plus a leak barrier and catches flow outside the body, and the FDA regulates it as a medical device like other menstrual products. A Cleveland Clinic ob/gyn says a typical pair holds about one to two tampons' worth of flow, so on heavy days you may need to change more often, and you shouldn't wear one pair for more than 12 hours. This pair is sold for heavy flow, and its higher absorbency claim comes from the brand's own testing. The brand itself says most people get about 8 hours on a heavy day, and some need to change after 3 to 4.",
    "clinicalNoteSources": [
      {
        "url": "https://health.clevelandclinic.org/does-period-underwear-work",
        "label": "Cleveland Clinic: What Is Period Underwear and Does It Work?",
        "summary": "An ob/gyn explains that period underwear typically holds one to two tampons' worth of flow and should not be worn more than 12 hours."
      },
      {
        "url": "https://www.fda.gov/medical-devices/products-and-medical-procedures/menstrual-product-options-facts-and-safe-use",
        "label": "FDA: Menstrual Product Options, Facts, and Safe Use",
        "summary": "FDA regulates menstrual products, including period underwear, as medical devices and advises changing them regularly."
      }
    ],
    "warnings": [
      "On heavy days, start by checking after about 4 hours until you know your limit.",
      "Wash without bleach.",
      "Do not dry clean."
    ],
    "warningsSource": {
      "url": "https://period.co/products/the-bikini",
      "label": "Period.: The Bikini product page"
    }
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
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC10847380/",
        "label": "DeLoughery et al., BMJ Sexual & Reproductive Health (2024): red blood cell capacity of menstrual products",
        "summary": "In lab testing with red blood cells, super-absorbency period underwear held about 2 mL on average, far less than tampons, cups, discs or heavy pads, so it works best as backup or for lighter flow."
      }
    ],
    "howToUse": {
      "intro": "Per WUKA's own product page:",
      "steps": [
        "Wear them like regular underwear and change based on your flow, for up to 12 hours.",
        "Rinse in cold water after each use.",
        "Machine wash with similar dark colors at 30 to 40°C (Perform styles cold), using a mesh bag for lace or mesh styles.",
        "Skip fabric conditioner.",
        "Line dry or air dry, and don't tumble dry."
      ],
      "sourceUrl": "https://wuka.co.uk/products/wuka-ultimate-midi-brief-heavy-overnight",
      "sourceLabel": "WUKA: Ultimate Midi Brief, Heavy Overnight Flow"
    },
    "ingredientScience": [
      {
        "name": "Organic cotton",
        "text": "Cotton lets air flow and cuts down on moisture buildup, which is why MedlinePlus recommends cotton underwear (or a cotton-lined crotch) over synthetic fabric to help prevent vaginitis, meaning irritation or infection of the vagina. That's standard self-care advice rather than something tested head to head in trials.",
        "citations": [
          {
            "url": "https://medlineplus.gov/ency/patientinstructions/000566.htm",
            "label": "MedlinePlus (NIH): Vaginitis, self-care"
          }
        ]
      },
      {
        "name": "PFAS-free absorbent layer",
        "text": "PFAS are \"forever chemicals\" that some makers use to help fabric repel liquid. The EPA says exposure to certain PFAS may be linked to lower fertility, higher cholesterol, weaker vaccine response and some cancers, though research on how different exposure levels affect health is still ongoing. Going PFAS-free avoids that question; the PFAS-free status here is the brand's own claim.",
        "citations": [
          {
            "url": "https://www.epa.gov/pfas/our-current-understanding-human-health-and-environmental-risks-pfas",
            "label": "US EPA: Our Current Understanding of the Human Health and Environmental Risks of PFAS"
          }
        ]
      }
    ],
    "clinicalNote": "Period underwear has absorbent layers plus a leak barrier and catches flow outside the body, and the FDA regulates it as a medical device like other menstrual products. A Cleveland Clinic ob/gyn says a typical pair holds about one to two tampons' worth of flow, so on heavy days you may need to change more often, and you shouldn't wear one pair for more than 12 hours. A 2025 study of reusable period products found PFAS (\"forever chemicals\") in all 19 products picked for closer testing, and the researchers think some period underwear has PFAS added to stop leaks, so a PFAS-free claim is worth looking for.",
    "clinicalNoteSources": [
      {
        "url": "https://health.clevelandclinic.org/does-period-underwear-work",
        "label": "Cleveland Clinic: What Is Period Underwear and Does It Work?",
        "summary": "An ob/gyn explains that period underwear typically holds one to two tampons' worth of flow and should not be worn more than 12 hours."
      },
      {
        "url": "https://www.fda.gov/medical-devices/products-and-medical-procedures/menstrual-product-options-facts-and-safe-use",
        "label": "FDA: Menstrual Product Options, Facts, and Safe Use",
        "summary": "FDA regulates menstrual products, including period underwear, as medical devices and advises changing them regularly."
      },
      {
        "url": "https://axial.acs.org/environmental-and-sustainable-chemistry/forever-chemicals-in-feminine-hygiene-products-expanded-findings-raise-new-pfas-concerns",
        "label": "American Chemical Society: summary of Wicks et al., Environ Sci Technol Lett 2025 (doi:10.1021/acs.estlett.5c00553)",
        "summary": "A 2025 study of 59 reusable period products found PFAS in all 19 chosen for closer testing; researchers called the PFAS use unnecessary."
      }
    ],
    "warnings": [
      "Wear one pair for up to 8 hours at a time.",
      "If you can smell period blood, it's time to change."
    ],
    "warningsSource": {
      "url": "https://wuka.co.uk/blogs/periods-a-z/how-do-period-pants-work",
      "label": "WUKA: How Do Period Pants Work?"
    }
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
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC10847380/",
        "label": "DeLoughery et al., BMJ Sexual & Reproductive Health (2024): red blood cell capacity of menstrual products",
        "summary": "In lab testing with red blood cells, super-absorbency period underwear held about 2 mL on average, far less than tampons, cups, discs or heavy pads, so it works best as backup or for lighter flow."
      }
    ],
    "howToUse": {
      "intro": "Per TomboyX's instructions for its First Line Period styles:",
      "steps": [
        "Give a new pair a quick cold wash before you first wear it.",
        "On your heaviest days, add a liner or winged pad as backup.",
        "Wash in cold water with like colors, by hand or on a delicate cycle.",
        "Skip fabric softener and bleach, which wear down the absorbent fabric.",
        "Lay flat or hang to dry, or tumble dry on low and avoid high heat."
      ],
      "sourceUrl": "https://tomboyx.com/products/first-line-period-bikini-x-black",
      "sourceLabel": "TomboyX First Line Period Bikini product page"
    },
    "clinicalNote": "Period underwear has absorbent layers plus a leak barrier and catches flow outside the body, and the FDA regulates it as a medical device like other menstrual products. A Cleveland Clinic ob/gyn says a typical pair holds about one to two tampons' worth of flow, so on heavy days you may need to change more often, and you shouldn't wear one pair for more than 12 hours. Cleveland Clinic suggests trying a new pair on your lightest day, at home, to check fit and leaks before relying on it.",
    "clinicalNoteSources": [
      {
        "url": "https://health.clevelandclinic.org/does-period-underwear-work",
        "label": "Cleveland Clinic: What Is Period Underwear and Does It Work?",
        "summary": "An ob/gyn explains that period underwear typically holds one to two tampons' worth of flow and should not be worn more than 12 hours."
      },
      {
        "url": "https://www.fda.gov/medical-devices/products-and-medical-procedures/menstrual-product-options-facts-and-safe-use",
        "label": "FDA: Menstrual Product Options, Facts, and Safe Use",
        "summary": "FDA regulates menstrual products, including period underwear, as medical devices and advises changing them regularly."
      }
    ],
    "warnings": [
      "Give new pairs a quick cold wash before you first wear them.",
      "Avoid bleach, harsh chemicals and fabric softeners, which weaken the fabric.",
      "Air dry if you can; if you use a dryer, pick the lowest heat."
    ],
    "warningsSource": {
      "url": "https://tomboyx.com/pages/detailed-wash-care-guide",
      "label": "TomboyX: Detailed Wash and Care Guide"
    }
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
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC10847380/",
        "label": "DeLoughery et al., BMJ Sexual & Reproductive Health (2024): red blood cell capacity of menstrual products",
        "summary": "In lab testing with red blood cells, super-absorbency period underwear held about 2 mL on average, far less than tampons, cups, discs or heavy pads, so it works best as backup or for lighter flow."
      }
    ],
    "howToUse": {
      "intro": "Per Dear Kate's care guide:",
      "steps": [
        "If a pair gets heavily soaked while you're out, rinse it and keep it in a sealable pouch until you can wash it.",
        "Machine wash on a delicate cycle with a gentle detergent, and avoid hot water.",
        "Skip fabric softener, which can block absorbency, plus bleach and dry cleaning.",
        "Line dry when you can, or use a low dryer setting."
      ],
      "sourceUrl": "https://dearkate.com/blogs/blog/how-to-properly-care-for-your-dear-kate-period-undies",
      "sourceLabel": "Dear Kate: How to Properly Care for Your Period Undies"
    },
    "clinicalNote": "Period underwear has absorbent layers plus a leak barrier and catches flow outside the body, and the FDA regulates it as a medical device like other menstrual products. A Cleveland Clinic ob/gyn says a typical pair holds about one to two tampons' worth of flow, so on heavy days you may need to change more often, and you shouldn't wear one pair for more than 12 hours. A 2025 study of reusable period products found PFAS (\"forever chemicals\") in all 19 products picked for closer testing, and the researchers think some period underwear has PFAS added to stop leaks, so a PFAS-free claim is worth looking for.",
    "clinicalNoteSources": [
      {
        "url": "https://health.clevelandclinic.org/does-period-underwear-work",
        "label": "Cleveland Clinic: What Is Period Underwear and Does It Work?",
        "summary": "An ob/gyn explains that period underwear typically holds one to two tampons' worth of flow and should not be worn more than 12 hours."
      },
      {
        "url": "https://www.fda.gov/medical-devices/products-and-medical-procedures/menstrual-product-options-facts-and-safe-use",
        "label": "FDA: Menstrual Product Options, Facts, and Safe Use",
        "summary": "FDA regulates menstrual products, including period underwear, as medical devices and advises changing them regularly."
      },
      {
        "url": "https://axial.acs.org/environmental-and-sustainable-chemistry/forever-chemicals-in-feminine-hygiene-products-expanded-findings-raise-new-pfas-concerns",
        "label": "American Chemical Society: summary of Wicks et al., Environ Sci Technol Lett 2025 (doi:10.1021/acs.estlett.5c00553)",
        "summary": "A 2025 study of 59 reusable period products found PFAS in all 19 chosen for closer testing; researchers called the PFAS use unnecessary."
      }
    ],
    "warnings": [
      "Don't use fabric softener, which leaves residue that blocks liquid from soaking in.",
      "Don't bleach, dry clean or wash in hot water.",
      "If a pair gets oversaturated, rinse it and keep it in a sealable pouch until laundry day."
    ],
    "warningsSource": {
      "url": "https://dearkate.com/blogs/blog/how-to-properly-care-for-your-dear-kate-period-undies",
      "label": "Dear Kate: How to Properly Care for Your Dear Kate Period Undies"
    }
  },
  "p-proof-period": {
    "whoItsFor": [
      "People who want one pair for periods and occasional light bladder leaks (for leaks alone, a product made for urine is the better pick)",
      "Those who want to pick from several absorbency levels",
      "Shoppers looking for PFAS-free absorbent layers",
      "Not the pick as your only protection on your heaviest days: in a 2023 lab study using red blood cells, super-absorbency period underwear held about 2 mL on average, far less than tampons, cups or discs"
    ],
    "scienceSources": [
      {
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC10847380/",
        "label": "DeLoughery et al., BMJ Sexual & Reproductive Health (2024): red blood cell capacity of menstrual products",
        "summary": "In lab testing with red blood cells, super-absorbency period underwear held about 2 mL on average, far less than tampons, cups, discs or heavy pads, so it works best as backup or for lighter flow."
      }
    ],
    "howToUse": {
      "intro": "Per Proof's FAQ:",
      "steps": [
        "Pick the absorbency that fits your flow: lighter styles for light days, higher ones for heavy days, overnight styles for sleep.",
        "For bladder leaks, choose Moderate for light leaks, Heavy for moderate leaks and Super Heavy for heavy leaks.",
        "Put on a fresh pair each day rather than rewearing the same one.",
        "Wash on a delicate cycle in cold water with a gentle detergent, or wash by hand."
      ],
      "sourceUrl": "https://shopproof.com/pages/faq",
      "sourceLabel": "Proof Leak Proof Underwear FAQs"
    },
    "clinicalNote": "Period underwear has absorbent layers plus a leak barrier and catches flow outside the body, and the FDA regulates it as a medical device like other menstrual products. A Cleveland Clinic ob/gyn says a typical pair holds about one to two tampons' worth of flow, so on heavy days you may need to change more often, and you shouldn't wear one pair for more than 12 hours. Cleveland Clinic notes period underwear can also be used for urine leaks, discharge and bleeding after birth, but if you mainly need it for urine leaks, it suggests a product designed for that. A 2025 study of reusable period products found PFAS (\"forever chemicals\") in all 19 products picked for closer testing, and the researchers think some period underwear has PFAS added to stop leaks, so a PFAS-free claim is worth looking for.",
    "clinicalNoteSources": [
      {
        "url": "https://health.clevelandclinic.org/does-period-underwear-work",
        "label": "Cleveland Clinic: What Is Period Underwear and Does It Work?",
        "summary": "An ob/gyn explains that period underwear typically holds one to two tampons' worth of flow and should not be worn more than 12 hours."
      },
      {
        "url": "https://www.fda.gov/medical-devices/products-and-medical-procedures/menstrual-product-options-facts-and-safe-use",
        "label": "FDA: Menstrual Product Options, Facts, and Safe Use",
        "summary": "FDA regulates menstrual products, including period underwear, as medical devices and advises changing them regularly."
      },
      {
        "url": "https://axial.acs.org/environmental-and-sustainable-chemistry/forever-chemicals-in-feminine-hygiene-products-expanded-findings-raise-new-pfas-concerns",
        "label": "American Chemical Society: summary of Wicks et al., Environ Sci Technol Lett 2025 (doi:10.1021/acs.estlett.5c00553)",
        "summary": "A 2025 study of 59 reusable period products found PFAS in all 19 chosen for closer testing; researchers called the PFAS use unnecessary."
      }
    ],
    "warnings": [
      "Change your period products regularly, since wearing one too long can let harmful bacteria grow.",
      "Wash your hands before and after using a period product.",
      "Contact your healthcare provider if you have pain, fever or other unusual symptoms."
    ],
    "warningsSource": {
      "url": "https://www.fda.gov/medical-devices/products-and-medical-procedures/menstrual-product-options-facts-and-safe-use",
      "label": "FDA: Menstrual Product Options, Facts, and Safe Use"
    }
  },
  "p-hanes-period": {
    "whoItsFor": [
      "People on a budget who want to try period underwear",
      "Those with light to moderate flow, or who want backup for a tampon or cup",
      "Not the pick as your only protection on your heaviest days: in a 2023 lab study using red blood cells, super-absorbency period underwear held about 2 mL on average, far less than tampons, cups or discs"
    ],
    "scienceSources": [
      {
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC10847380/",
        "label": "DeLoughery et al., BMJ Sexual & Reproductive Health (2024): red blood cell capacity of menstrual products",
        "summary": "In lab testing with red blood cells, super-absorbency period underwear held about 2 mL on average, far less than tampons, cups, discs or heavy pads, so it works best as backup or for lighter flow."
      }
    ],
    "howToUse": {
      "intro": "Per Hanes' Comfort, Period. collection page:",
      "steps": [
        "Choose light, moderate or super protection to match your flow or leaks.",
        "Wear them on their own, or as backup to a pad, tampon or cup on heavy days and overnight.",
        "Wash in cold water and reuse."
      ],
      "sourceUrl": "https://www.hanes.com/women/collections/period-underwear",
      "sourceLabel": "Hanes Comfort, Period. Underwear collection"
    },
    "clinicalNote": "Period underwear has absorbent layers plus a leak barrier and catches flow outside the body, and the FDA regulates it as a medical device like other menstrual products. A Cleveland Clinic ob/gyn says a typical pair holds about one to two tampons' worth of flow, so on heavy days you may need to change more often, and you shouldn't wear one pair for more than 12 hours. A light to moderate pair like this may need changing sooner on your heaviest days. Cleveland Clinic suggests testing a new pair on a light day at home first.",
    "clinicalNoteSources": [
      {
        "url": "https://health.clevelandclinic.org/does-period-underwear-work",
        "label": "Cleveland Clinic: What Is Period Underwear and Does It Work?",
        "summary": "An ob/gyn explains that period underwear typically holds one to two tampons' worth of flow and should not be worn more than 12 hours."
      },
      {
        "url": "https://www.fda.gov/medical-devices/products-and-medical-procedures/menstrual-product-options-facts-and-safe-use",
        "label": "FDA: Menstrual Product Options, Facts, and Safe Use",
        "summary": "FDA regulates menstrual products, including period underwear, as medical devices and advises changing them regularly."
      }
    ],
    "warnings": [
      "Change your period products regularly, since wearing one too long can let harmful bacteria grow.",
      "Wash your hands before and after using a period product.",
      "Contact your healthcare provider if you have pain, fever or other unusual symptoms."
    ],
    "warningsSource": {
      "url": "https://www.fda.gov/medical-devices/products-and-medical-procedures/menstrual-product-options-facts-and-safe-use",
      "label": "FDA: Menstrual Product Options, Facts, and Safe Use"
    }
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
    ],
    "clinicalNote": "The North American Menopause Society lists over-the-counter, hormone-free vaginal moisturizers and lubricants as first-line care for dryness from menopause, while noting that few clinical studies have tested these products. It also says there's no evidence yet that hyaluronic acid products work better than other moisturizers. That said, a randomized trial of 144 women found a hyaluronic acid vaginal gel was not inferior to estriol (a low-dose estrogen) cream for relieving dryness. Because this gel contains several plant extracts, the Society's tip applies: try a product on a small patch of skin for 24 hours before using it inside the vagina.",
    "clinicalNoteSources": [
      {
        "url": "https://www.isswsh.org/images/content/2020-NAMS-GSM-Paper.pdf",
        "label": "Menopause (journal), 2020: The North American Menopause Society position statement on genitourinary syndrome of menopause",
        "summary": "Professional position statement naming nonhormone moisturizers and lubricants as first-line for genitourinary syndrome of menopause, with limited trial data and no proven extra benefit from hyaluronic acid."
      },
      {
        "url": "https://pubmed.ncbi.nlm.nih.gov/24178484/",
        "label": "Archives of Gynecology and Obstetrics (Springer), 2013: Is vaginal hyaluronic acid as effective as vaginal estriol for vaginal dryness relief?",
        "summary": "Summary of a randomized trial in which hyaluronic acid vaginal gel was non-inferior to estriol cream for vaginal dryness."
      }
    ]
  },
  "p-good-kitty-uti-biome-shield": {
    "whoItsFor": [
      "People who get recurrent UTIs and want to try a cranberry and D-mannose supplement, knowing the evidence is mixed",
      "Those whose UTIs tend to follow sex, since the brand gives a separate pre-sex dose",
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
    ],
    "clinicalNote": "The two main ingredients here have very different evidence. A 2023 Cochrane review of 50 trials found cranberry products probably lower UTI risk, including in women with recurrent UTIs, though not in pregnant women or older adults in care homes. D-mannose has a weaker record: a 2024 randomized trial of 598 women with recurrent UTIs found daily D-mannose did no better than placebo. No published trial of this finished product was found, so its combined effect is unknown.",
    "clinicalNoteSources": [
      {
        "url": "https://www.cochrane.org/CD001321/UTI_cranberry-for-preventing-urinary-tract-infections",
        "label": "Cochrane Review, 2023: Cranberries for preventing urinary tract infections",
        "summary": "Cranberry products probably reduce symptomatic UTIs (RR 0.70 overall, 0.74 in women with recurrent UTIs), with little or no benefit in pregnant women or institutionalized elderly."
      },
      {
        "url": "https://urology.wisc.edu/wp-content/uploads/2024/05/D-Mannose-for-Prevention-of-Recurrent-Urinary-Tract-Infection-Among-Women.pdf",
        "label": "JAMA Internal Medicine, 2024: D-Mannose for Prevention of Recurrent UTI Among Women, RCT (copy hosted by UW Urology)",
        "summary": "Daily D-mannose did not reduce recurrent UTIs versus placebo in 598 women in UK primary care."
      }
    ],
    "warnings": [
      "Don't use cranberry products instead of a proven treatment for a UTI; if you think you have one, see a health care provider.",
      "There is conflicting evidence on whether cranberry interacts with the blood thinner warfarin, so check with your provider if you take medicines.",
      "Cranberry in amounts larger than food is not proven safe in pregnancy or breastfeeding; talk with your provider first."
    ],
    "warningsSource": {
      "url": "https://www.nccih.nih.gov/health/cranberry?nav=tw",
      "label": "NCCIH (NIH): Cranberry (official guidance for the cranberry ingredient; the brand page could not be opened)"
    }
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
    },
    "clinicalNote": "The International Society for Sexual Medicine says there are only a limited number of studies on vibrators, but early findings suggest they may improve genital blood flow, arousal, satisfaction, and orgasm, and possibly pelvic floor muscle tone. A Cedars-Sinai urogynecologist describes vibration as a way to boost blood flow to the genitals as estrogen drops in menopause, though the article notes the research comes from a handful of small studies. None of this tested the warming feature or this device.",
    "clinicalNoteSources": [
      {
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC11150285/",
        "label": "Int Urogynecol J (2024), Dubinskaya et al.: The role of vibrators in women's pelvic health",
        "summary": "In a prospective pilot study at a urogynecology clinic (53 of 79 women completed 3 months), regular vibrator use was linked to better desire, arousal, orgasm, satisfaction and overall sexual function scores, less pain with sex, and fewer bothersome prolapse symptoms, with no control group."
      },
      {
        "url": "https://www.cedars-sinai.org/stories-and-insights/healthy-living/sexual-healing-vibrators-as-medicine",
        "label": "Cedars-Sinai, 2025: Sexual Healing, Vibrators as Medicine",
        "summary": "Academic medical center article quoting a urogynecologist on vibrators for blood flow, pelvic floor relaxation and menopause changes; notes evidence comes from a handful of small studies."
      }
    ]
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
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC11150285/",
        "label": "Int Urogynecol J (2024), Dubinskaya et al.: The role of vibrators in women's pelvic health",
        "summary": "In a prospective pilot study at a urogynecology clinic (53 of 79 women completed 3 months), regular vibrator use was linked to better desire, arousal, orgasm, satisfaction and overall sexual function scores, less pain with sex, and fewer bothersome prolapse symptoms, with no control group."
      },
      {
        "url": "https://menopause.org/wp-content/uploads/for-women/MenoNote-GSM.pdf",
        "label": "The Menopause Society: MenoNote on genitourinary syndrome of menopause",
        "summary": "The Menopause Society notes that sexual stimulation, alone, with a partner or with a device such as a vibrator, may support vaginal blood flow and natural moisture after menopause."
      }
    ],
    "clinicalNote": "The International Society for Sexual Medicine says there are only a limited number of studies on vibrators, but early findings suggest they may improve genital blood flow, arousal, satisfaction, and orgasm, and possibly pelvic floor muscle tone. Cedars-Sinai's urogynecologist notes that vibrators make orgasm easier for many women and can be used externally, without insertion. The evidence is small and early, and none of it tested this device.",
    "clinicalNoteSources": [
      {
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC11150285/",
        "label": "Int Urogynecol J (2024), Dubinskaya et al.: The role of vibrators in women's pelvic health",
        "summary": "In a prospective pilot study at a urogynecology clinic (53 of 79 women completed 3 months), regular vibrator use was linked to better desire, arousal, orgasm, satisfaction and overall sexual function scores, less pain with sex, and fewer bothersome prolapse symptoms, with no control group."
      },
      {
        "url": "https://www.cedars-sinai.org/stories-and-insights/healthy-living/sexual-healing-vibrators-as-medicine",
        "label": "Cedars-Sinai, 2025: Sexual Healing, Vibrators as Medicine",
        "summary": "Academic medical center article quoting a urogynecologist on vibrators for blood flow, pelvic floor relaxation and menopause changes; notes evidence comes from a handful of small studies."
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
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC11150285/",
        "label": "Int Urogynecol J (2024), Dubinskaya et al.: The role of vibrators in women's pelvic health",
        "summary": "In a prospective pilot study at a urogynecology clinic (53 of 79 women completed 3 months), regular vibrator use was linked to better desire, arousal, orgasm, satisfaction and overall sexual function scores, less pain with sex, and fewer bothersome prolapse symptoms, with no control group."
      },
      {
        "url": "https://menopause.org/wp-content/uploads/for-women/MenoNote-GSM.pdf",
        "label": "The Menopause Society: MenoNote on genitourinary syndrome of menopause",
        "summary": "The Menopause Society notes that sexual stimulation, alone, with a partner or with a device such as a vibrator, may support vaginal blood flow and natural moisture after menopause."
      }
    ],
    "clinicalNote": "Research on vibrators is still small. A 2023 review found 17 studies linking vibrator use to better arousal, desire, satisfaction and orgasm, with early signs of benefit for pelvic floor muscles and vulvar pain, but the authors say more research is needed. In a large 2009 U.S. survey, about 7 in 10 women who used vibrators had no side effects; the most common one was temporary numbness, and most side effects were mild and short-lived. None of these studies tested Oboo devices. Smooch is for external use only, so it can be an option when penetration is uncomfortable. Oboo's own FAQ says it is compact and powerful rather than especially mild, so starting on the lowest setting makes sense.",
    "clinicalNoteSources": [
      {
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC11150285/",
        "label": "Int Urogynecol J (2024), Dubinskaya et al.: The role of vibrators in women's pelvic health",
        "summary": "In a prospective pilot study at a urogynecology clinic (53 of 79 women completed 3 months), regular vibrator use was linked to better desire, arousal, orgasm, satisfaction and overall sexual function scores, less pain with sex, and fewer bothersome prolapse symptoms, with no control group."
      },
      {
        "url": "https://kinseyinstitute.org/pdf/Herbenick%20et%20al%20JSM%202009%20Women%20Vibe%20Final%20in%20Print.pdf",
        "label": "Journal of Sexual Medicine (2009), Herbenick et al.: vibrator use by U.S. women (Kinsey Institute PDF)",
        "summary": "National survey of 2,056 women; 71.5% of vibrator users reported no side effects, and most reported side effects such as numbness were mild and short-lived."
      }
    ],
    "warnings": [
      "Wash it with warm water and soap after each use.",
      "If you share it, put a new condom on it each time, especially between different partners.",
      "Check it regularly for scratches or breaks, and follow the maker's cleaning and storage instructions."
    ],
    "warningsSource": {
      "url": "https://seftonsexualhealth.nhs.uk/adult-safer-sex",
      "label": "NHS Sefton Sexual Health: Safer sex (sex toys)"
    }
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
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC11150285/",
        "label": "Int Urogynecol J (2024), Dubinskaya et al.: The role of vibrators in women's pelvic health",
        "summary": "In a prospective pilot study at a urogynecology clinic (53 of 79 women completed 3 months), regular vibrator use was linked to better desire, arousal, orgasm, satisfaction and overall sexual function scores, less pain with sex, and fewer bothersome prolapse symptoms, with no control group."
      },
      {
        "url": "https://menopause.org/wp-content/uploads/for-women/MenoNote-GSM.pdf",
        "label": "The Menopause Society: MenoNote on genitourinary syndrome of menopause",
        "summary": "The Menopause Society notes that sexual stimulation, alone, with a partner or with a device such as a vibrator, may support vaginal blood flow and natural moisture after menopause."
      }
    ],
    "clinicalNote": "Research on vibrators is still small. A 2023 review found 17 studies linking vibrator use to better arousal, desire, satisfaction and orgasm, with early signs of benefit for pelvic floor muscles and vulvar pain, but the authors say more research is needed. In a large 2009 U.S. survey, about 7 in 10 women who used vibrators had no side effects; the most common one was temporary numbness, and most side effects were mild and short-lived. None of these studies tested Oboo devices. Woo is for external use only, which keeps things simple if penetration is not something you want right now.",
    "clinicalNoteSources": [
      {
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC11150285/",
        "label": "Int Urogynecol J (2024), Dubinskaya et al.: The role of vibrators in women's pelvic health",
        "summary": "In a prospective pilot study at a urogynecology clinic (53 of 79 women completed 3 months), regular vibrator use was linked to better desire, arousal, orgasm, satisfaction and overall sexual function scores, less pain with sex, and fewer bothersome prolapse symptoms, with no control group."
      },
      {
        "url": "https://kinseyinstitute.org/pdf/Herbenick%20et%20al%20JSM%202009%20Women%20Vibe%20Final%20in%20Print.pdf",
        "label": "Journal of Sexual Medicine (2009), Herbenick et al.: vibrator use by U.S. women (Kinsey Institute PDF)",
        "summary": "National survey of 2,056 women; 71.5% of vibrator users reported no side effects, and most reported side effects such as numbness were mild and short-lived."
      }
    ],
    "warnings": [
      "Wash it with warm water and soap after each use.",
      "If you share it, put a new condom on it each time, especially between different partners.",
      "Check it regularly for scratches or breaks, and follow the maker's cleaning and storage instructions."
    ],
    "warningsSource": {
      "url": "https://seftonsexualhealth.nhs.uk/adult-safer-sex",
      "label": "NHS Sefton Sexual Health: Safer sex (sex toys)"
    }
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
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC11150285/",
        "label": "Int Urogynecol J (2024), Dubinskaya et al.: The role of vibrators in women's pelvic health",
        "summary": "In a prospective pilot study at a urogynecology clinic (53 of 79 women completed 3 months), regular vibrator use was linked to better desire, arousal, orgasm, satisfaction and overall sexual function scores, less pain with sex, and fewer bothersome prolapse symptoms, with no control group."
      },
      {
        "url": "https://menopause.org/wp-content/uploads/for-women/MenoNote-GSM.pdf",
        "label": "The Menopause Society: MenoNote on genitourinary syndrome of menopause",
        "summary": "The Menopause Society notes that sexual stimulation, alone, with a partner or with a device such as a vibrator, may support vaginal blood flow and natural moisture after menopause."
      }
    ],
    "clinicalNote": "Research on vibrators is still small. A 2023 review found 17 studies linking vibrator use to better arousal, desire, satisfaction and orgasm, with early signs of benefit for pelvic floor muscles and vulvar pain, but the authors say more research is needed. In a large 2009 U.S. survey, about 7 in 10 women who used vibrators had no side effects; the most common one was temporary numbness, and most side effects were mild and short-lived. None of these studies tested Oboo devices. Oboo says Shoop is meant for gentle, shallow internal use or external use; if dryness is part of the picture, a water-based lubricant can make internal use more comfortable.",
    "clinicalNoteSources": [
      {
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC11150285/",
        "label": "Int Urogynecol J (2024), Dubinskaya et al.: The role of vibrators in women's pelvic health",
        "summary": "In a prospective pilot study at a urogynecology clinic (53 of 79 women completed 3 months), regular vibrator use was linked to better desire, arousal, orgasm, satisfaction and overall sexual function scores, less pain with sex, and fewer bothersome prolapse symptoms, with no control group."
      },
      {
        "url": "https://kinseyinstitute.org/pdf/Herbenick%20et%20al%20JSM%202009%20Women%20Vibe%20Final%20in%20Print.pdf",
        "label": "Journal of Sexual Medicine (2009), Herbenick et al.: vibrator use by U.S. women (Kinsey Institute PDF)",
        "summary": "National survey of 2,056 women; 71.5% of vibrator users reported no side effects, and most reported side effects such as numbness were mild and short-lived."
      }
    ],
    "warnings": [
      "Wash it with warm water and soap after each use.",
      "If you share it, put a new condom on it each time, especially between different partners.",
      "Check it regularly for scratches or breaks, and follow the maker's cleaning and storage instructions.",
      "Wash it, or change the condom, when you switch between vaginal and anal use."
    ],
    "warningsSource": {
      "url": "https://seftonsexualhealth.nhs.uk/adult-safer-sex",
      "label": "NHS Sefton Sexual Health: Safer sex (sex toys)"
    }
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
    },
    "clinicalSources": [
      {
        "url": "https://health.clevelandclinic.org/anal-sex-safety",
        "label": "Cleveland Clinic: Is Anal Sex Safe?",
        "summary": "A Cleveland Clinic gastroenterologist explains that the anus makes no natural lubrication and its lining tears easily, so you need ample lube, a slow gradual pace, clean toys between uses, and to stop with sharp pain or seek care for heavy or lasting bleeding."
      }
    ],
    "clinicalNote": "The anus does not make its own lubricant, so plenty of lube matters for any anal toy. In one hospital series of 25 people with an object stuck in the rectum, sex toys were the most common object, two people had tears in the rectal lining (the inner skin of the rectum), and half had used the same object before without trouble. That is why a flared base (a wide end that stops the toy going all the way in), going slowly and stopping with pain or bleeding matter. No study has tested this kit.",
    "clinicalNoteSources": [
      {
        "url": "https://seftonsexualhealth.nhs.uk/adult-safer-sex",
        "label": "NHS Sefton Sexual Health: Safer sex",
        "summary": "NHS sexual health advice that the anus does not make its own lubricant, so plenty of lube is important, and that toys should be washed and covered with a new condom when shared."
      },
      {
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC5081549/",
        "label": "World Journal of Gastrointestinal Surgery (2016): Increasing trend in retained rectal foreign bodies",
        "summary": "In 25 hospital cases, sex toys were the most common objects stuck in the rectum, two people had tears in the rectal lining, and half had used the same object before without problems."
      }
    ],
    "warnings": [
      "Lubrication is essential: use a generous amount of water-based lube every time.",
      "Start with short sessions of 10 to 15 minutes and only move up a size when you're ready.",
      "Remove the plug if you feel any discomfort.",
      "Wash all plugs with warm soapy water or toy cleaner before and after each use."
    ],
    "warningsSource": {
      "url": "https://oboo.love/products/moon",
      "label": "Oboo: Moon Anal Training Kit product page"
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
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC11150285/",
        "label": "Int Urogynecol J (2024), Dubinskaya et al.: The role of vibrators in women's pelvic health",
        "summary": "In a prospective pilot study at a urogynecology clinic (53 of 79 women completed 3 months), regular vibrator use was linked to better desire, arousal, orgasm, satisfaction and overall sexual function scores, less pain with sex, and fewer bothersome prolapse symptoms, with no control group."
      },
      {
        "url": "https://menopause.org/wp-content/uploads/for-women/MenoNote-GSM.pdf",
        "label": "The Menopause Society: MenoNote on genitourinary syndrome of menopause",
        "summary": "The Menopause Society notes that sexual stimulation, alone, with a partner or with a device such as a vibrator, may support vaginal blood flow and natural moisture after menopause."
      }
    ],
    "clinicalNote": "Research on vibrators is still small. A 2023 review found 17 studies linking vibrator use to better arousal, desire, satisfaction and orgasm, with early signs of benefit for pelvic floor muscles and vulvar pain, but the authors say more research is needed. In a large 2009 U.S. survey, about 7 in 10 women who used vibrators had no side effects; the most common one was temporary numbness, and most side effects were mild and short-lived. None of these studies tested Oboo devices. Oooh is an external-only, palm-sized design, and the brand suggests a water-based lubricant if you want more glide.",
    "clinicalNoteSources": [
      {
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC11150285/",
        "label": "Int Urogynecol J (2024), Dubinskaya et al.: The role of vibrators in women's pelvic health",
        "summary": "In a prospective pilot study at a urogynecology clinic (53 of 79 women completed 3 months), regular vibrator use was linked to better desire, arousal, orgasm, satisfaction and overall sexual function scores, less pain with sex, and fewer bothersome prolapse symptoms, with no control group."
      },
      {
        "url": "https://kinseyinstitute.org/pdf/Herbenick%20et%20al%20JSM%202009%20Women%20Vibe%20Final%20in%20Print.pdf",
        "label": "Journal of Sexual Medicine (2009), Herbenick et al.: vibrator use by U.S. women (Kinsey Institute PDF)",
        "summary": "National survey of 2,056 women; 71.5% of vibrator users reported no side effects, and most reported side effects such as numbness were mild and short-lived."
      }
    ],
    "warnings": [
      "Wash it with warm water and soap after each use.",
      "If you share it, put a new condom on it each time, especially between different partners.",
      "Check it regularly for scratches or breaks, and follow the maker's cleaning and storage instructions."
    ],
    "warningsSource": {
      "url": "https://seftonsexualhealth.nhs.uk/adult-safer-sex",
      "label": "NHS Sefton Sexual Health: Safer sex (sex toys)"
    }
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
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC11150285/",
        "label": "Int Urogynecol J (2024), Dubinskaya et al.: The role of vibrators in women's pelvic health",
        "summary": "In a prospective pilot study at a urogynecology clinic (53 of 79 women completed 3 months), regular vibrator use was linked to better desire, arousal, orgasm, satisfaction and overall sexual function scores, less pain with sex, and fewer bothersome prolapse symptoms, with no control group."
      },
      {
        "url": "https://menopause.org/wp-content/uploads/for-women/MenoNote-GSM.pdf",
        "label": "The Menopause Society: MenoNote on genitourinary syndrome of menopause",
        "summary": "The Menopause Society notes that sexual stimulation, alone, with a partner or with a device such as a vibrator, may support vaginal blood flow and natural moisture after menopause."
      }
    ],
    "clinicalNote": "Research on vibrators is still small. A 2023 review found 17 studies linking vibrator use to better arousal, desire, satisfaction and orgasm, with early signs of benefit for pelvic floor muscles and vulvar pain, but the authors say more research is needed. In a large 2009 U.S. survey, about 7 in 10 women who used vibrators had no side effects; the most common one was temporary numbness, and most side effects were mild and short-lived. None of these studies tested Oboo devices. Groove's two motors are controlled separately, so you can keep one part low or off while you find what feels comfortable.",
    "clinicalNoteSources": [
      {
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC11150285/",
        "label": "Int Urogynecol J (2024), Dubinskaya et al.: The role of vibrators in women's pelvic health",
        "summary": "In a prospective pilot study at a urogynecology clinic (53 of 79 women completed 3 months), regular vibrator use was linked to better desire, arousal, orgasm, satisfaction and overall sexual function scores, less pain with sex, and fewer bothersome prolapse symptoms, with no control group."
      },
      {
        "url": "https://kinseyinstitute.org/pdf/Herbenick%20et%20al%20JSM%202009%20Women%20Vibe%20Final%20in%20Print.pdf",
        "label": "Journal of Sexual Medicine (2009), Herbenick et al.: vibrator use by U.S. women (Kinsey Institute PDF)",
        "summary": "National survey of 2,056 women; 71.5% of vibrator users reported no side effects, and most reported side effects such as numbness were mild and short-lived."
      }
    ],
    "warnings": [
      "Wash it with warm water and soap after each use.",
      "If you share it, put a new condom on it each time, especially between different partners.",
      "Check it regularly for scratches or breaks, and follow the maker's cleaning and storage instructions.",
      "Wash it, or change the condom, when you switch between vaginal and anal use."
    ],
    "warningsSource": {
      "url": "https://seftonsexualhealth.nhs.uk/adult-safer-sex",
      "label": "NHS Sefton Sexual Health: Safer sex (sex toys)"
    }
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
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC11150285/",
        "label": "Int Urogynecol J (2024), Dubinskaya et al.: The role of vibrators in women's pelvic health",
        "summary": "In a prospective pilot study at a urogynecology clinic (53 of 79 women completed 3 months), regular vibrator use was linked to better desire, arousal, orgasm, satisfaction and overall sexual function scores, less pain with sex, and fewer bothersome prolapse symptoms, with no control group."
      },
      {
        "url": "https://menopause.org/wp-content/uploads/for-women/MenoNote-GSM.pdf",
        "label": "The Menopause Society: MenoNote on genitourinary syndrome of menopause",
        "summary": "The Menopause Society notes that sexual stimulation, alone, with a partner or with a device such as a vibrator, may support vaginal blood flow and natural moisture after menopause."
      }
    ],
    "clinicalNote": "Research on vibrators is still small. A 2023 review found 17 studies linking vibrator use to better arousal, desire, satisfaction and orgasm, with early signs of benefit for pelvic floor muscles and vulvar pain, but the authors say more research is needed. In a large 2009 U.S. survey, about 7 in 10 women who used vibrators had no side effects; the most common one was temporary numbness, and most side effects were mild and short-lived. None of these studies tested Oboo devices. Oboo says the warming tail increases blood flow, but no published study of this warming feature was found, so treat that as a brand claim.",
    "clinicalNoteSources": [
      {
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC11150285/",
        "label": "Int Urogynecol J (2024), Dubinskaya et al.: The role of vibrators in women's pelvic health",
        "summary": "In a prospective pilot study at a urogynecology clinic (53 of 79 women completed 3 months), regular vibrator use was linked to better desire, arousal, orgasm, satisfaction and overall sexual function scores, less pain with sex, and fewer bothersome prolapse symptoms, with no control group."
      },
      {
        "url": "https://kinseyinstitute.org/pdf/Herbenick%20et%20al%20JSM%202009%20Women%20Vibe%20Final%20in%20Print.pdf",
        "label": "Journal of Sexual Medicine (2009), Herbenick et al.: vibrator use by U.S. women (Kinsey Institute PDF)",
        "summary": "National survey of 2,056 women; 71.5% of vibrator users reported no side effects, and most reported side effects such as numbness were mild and short-lived."
      }
    ],
    "warnings": [
      "Wash it with warm water and soap after each use.",
      "If you share it, put a new condom on it each time, especially between different partners.",
      "Check it regularly for scratches or breaks, and follow the maker's cleaning and storage instructions.",
      "Wash it, or change the condom, when you switch between vaginal and anal use."
    ],
    "warningsSource": {
      "url": "https://seftonsexualhealth.nhs.uk/adult-safer-sex",
      "label": "NHS Sefton Sexual Health: Safer sex (sex toys)"
    }
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
    ],
    "clinicalNote": "Dermatologists advise caring for vulvar skin with a plain, unscented emollient (a moisturizing cream or ointment that soothes and protects) and avoiding perfumed products and those with long ingredient lists. This balm has a long botanical list that includes sweet orange oil, so a patch test first is sensible if your skin reacts easily. It also contains black cohosh, chaste tree, dong quai and red clover; NIH's summary of black cohosh and red clover for menopause describes mixed or inconsistent results for extract products and does not cover use on vulvar skin. It is oil-based, so it is not condom-safe with latex.",
    "clinicalNoteSources": [
      {
        "url": "https://www.skinhealthinfo.org.uk/wp-content/uploads/2018/11/Vulval-skincare-PIL-May-2023.pdf",
        "label": "British Association of Dermatologists: Vulval skincare patient leaflet (2023)",
        "summary": "Recommends a regular unscented emollient for vulval skin and advises avoiding perfumed products and those with long ingredient lists."
      },
      {
        "url": "https://nccih.nih.gov/health/providers/digest/menopausal-symptoms-and-complementary-health-practices-science",
        "label": "NIH NCCIH: Menopausal symptoms and complementary health practices",
        "summary": "Reviews black cohosh and red clover extracts for menopause symptoms, describing mixed or inconsistent results and not addressing use on the skin."
      }
    ],
    "warnings": [
      "This oil-based balm is not compatible with latex or polyisoprene condoms, dental dams or other latex barriers, and may cause them to break.",
      "If you need barrier protection, use only polyurethane condoms or a water-based lubricant instead.",
      "Always patch test first, and stop if your skin reacts.",
      "It is for external vulva care only and is not designed as a lube."
    ],
    "warningsSource": {
      "url": "https://oboo.love/products/smooth-daily-vulva-balm",
      "label": "Oboo: Smooth Daily Vulva Balm product page"
    }
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
    ],
    "clinicalNote": "Dermatologists advise caring for vulvar skin with a plain, unscented emollient (a moisturizing cream or ointment that soothes and protects) and avoiding perfumed products and those with long ingredient lists. This balm has a long botanical list that includes peppermint oil, which gives the cooling tingle, so a patch test first is sensible if your skin reacts easily. It also contains black cohosh, chaste tree, dong quai and red clover; NIH's summary of black cohosh and red clover for menopause describes mixed or inconsistent results for extract products and does not cover use on vulvar skin. It is oil-based, so it is not condom-safe with latex. The Menopause Society also notes that oil-based products may raise the risk of vaginal infections, so the brand's advice to keep it external and add a water-based lube for penetration fits.",
    "clinicalNoteSources": [
      {
        "url": "https://www.skinhealthinfo.org.uk/wp-content/uploads/2018/11/Vulval-skincare-PIL-May-2023.pdf",
        "label": "British Association of Dermatologists: Vulval skincare patient leaflet (2023)",
        "summary": "Recommends a regular unscented emollient for vulval skin and advises avoiding perfumed products and those with long ingredient lists."
      },
      {
        "url": "https://nccih.nih.gov/health/providers/digest/menopausal-symptoms-and-complementary-health-practices-science",
        "label": "NIH NCCIH: Menopausal symptoms and complementary health practices",
        "summary": "Reviews black cohosh and red clover extracts for menopause symptoms, describing mixed or inconsistent results and not addressing use on the skin."
      },
      {
        "url": "https://menopause.org/wp-content/uploads/for-women/MenoNote-GSM.pdf",
        "label": "The Menopause Society: MenoNote on genitourinary syndrome of menopause",
        "summary": "Explains that moisturizers are used several times a week, lubricants as needed, and that oil-based products may damage condoms and may raise the risk of vaginal infections."
      }
    ],
    "warnings": [
      "This oil-based balm is not compatible with latex or polyisoprene condoms, dental dams or other latex barriers, and may cause them to break.",
      "If you need barrier protection, use only polyurethane condoms or a water-based lubricant instead.",
      "Always do a patch test before full use, and talk to your healthcare provider if you have concerns or pre-existing conditions.",
      "It is for external use on the vulva only."
    ],
    "warningsSource": {
      "url": "https://oboo.love/products/smooth-arousal-vulva-balm",
      "label": "Oboo: Smooth Arousal Vulva Balm product page"
    }
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
    ],
    "clinicalNote": "For genitourinary syndrome of menopause (the dryness, irritation and painful sex that come with lower estrogen), The North American Menopause Society lists nonhormone lubricants and regular long-acting vaginal moisturizers as first-line options, though few studies have tested them. Moisturizers are usually used several times a week to keep tissue moist, not just before sex. Loob contains sodium hyaluronate (hyaluronic acid), but the society says there is no evidence hyaluronic acid products work better than others. Some water-based products are hyperosmolar (more concentrated than body fluids, which can irritate), so if one stings, try a patch of skin for 24 hours or switch products; for more severe symptoms, these can be combined with prescription treatment.",
    "clinicalNoteSources": [
      {
        "url": "https://www.isswsh.org/images/content/2020-NAMS-GSM-Paper.pdf",
        "label": "Menopause (2020): The North American Menopause Society GSM position statement",
        "summary": "Names nonhormone lubricants and regular long-acting vaginal moisturizers as first-line options, while noting few studies and no evidence that hyaluronic acid products work better."
      },
      {
        "url": "https://menopause.org/wp-content/uploads/for-women/MenoNote-GSM.pdf",
        "label": "The Menopause Society: MenoNote on genitourinary syndrome of menopause",
        "summary": "Explains that moisturizers are used several times a week, lubricants as needed, and that oil-based products may damage condoms and may raise the risk of vaginal infections."
      }
    ],
    "warnings": [
      "Always do a patch test before use.",
      "Stop using it if irritation occurs.",
      "Keep out of reach of children."
    ],
    "warningsSource": {
      "url": "https://oboo.love/products/loob-daily",
      "label": "Oboo: Loob Daily Moisturizer product page"
    }
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
    ],
    "clinicalNote": "The Menopause Society lists lubricants during sex and regular use of long-acting vaginal moisturizers as first-line treatments for vaginal dryness after menopause, though it also notes that few clinical studies have tested these products directly. It says there are very few safety data on lubricants with flavors or warming properties, and suggests testing a new product on your skin for 24 hours before using it inside the vagina. Loob adds a peppermint oil tingle and several herbal extracts, which go beyond what those studies looked at.",
    "clinicalNoteSources": [
      {
        "url": "https://www.isswsh.org/images/content/2020-NAMS-GSM-Paper.pdf",
        "label": "The Menopause Society (NAMS): 2020 Genitourinary Syndrome of Menopause Position Statement (hosted by ISSWSH)",
        "summary": "Names nonhormone lubricants and long-acting moisturizers as first-line options for menopausal vaginal dryness, notes limited trial data and limited safety data for flavored or warming products, and advises a 24-hour skin patch test."
      }
    ],
    "warnings": [
      "Always do a patch test before use.",
      "Stop using it if irritation occurs.",
      "If you are extra sensitive, start with a small amount.",
      "Keep out of reach of children."
    ],
    "warningsSource": {
      "url": "https://oboo.love/products/loob-arousal",
      "label": "Oboo: Loob Arousal Moisturizer product page"
    }
  },
  "p-oboo-mood-drops": {
    "whoItsFor": [
      "Women Oboo markets it to: those with low desire who want a daily herbal option (there are no studies of this product)",
      "Oboo also markets it for stress and tension alongside libido",
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
    ],
    "clinicalNote": "For lavender, one of the herbs in this tincture, NCCIH (part of the NIH) says an oral lavender oil product might help with anxiety, but the studies are small and preliminary, and lavender may interact with sedative drugs or herbs. That research used a specific lavender oil product, not a lavender flower extract like this one. More broadly, NCCIH notes that supplement makers don't have to prove to the FDA that a product is safe or effective before selling it, that some supplements interact with prescription or over-the-counter medicines, and that \"natural\" does not necessarily mean safe. The drops are made with water and ethanol (alcohol).",
    "clinicalNoteSources": [
      {
        "url": "https://www.nccih.nih.gov/health/lavender?nav=govd",
        "label": "NCCIH (NIH): Lavender",
        "summary": "Says an oral lavender oil product might help anxiety, with weak, preliminary evidence, and flags possible interactions with sedatives."
      },
      {
        "url": "https://nccih.nih.gov/health/tips/supplements",
        "label": "NCCIH (NIH): 5 Tips: What Consumers Need To Know About Dietary Supplements",
        "summary": "Explains that supplements aren't proven safe or effective to the FDA before sale, can interact with medicines, and that natural doesn't mean safe."
      }
    ],
    "warnings": [
      "Check with your healthcare provider before starting any new supplement.",
      "Check with a doctor first if you are pregnant, nursing, or taking medication.",
      "This product has not been evaluated by the FDA."
    ],
    "warningsSource": {
      "url": "https://oboo.love/products/in-the-mood-libido-drops",
      "label": "Oboo: In the Mood Drops product page"
    }
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
    ],
    "howToUse": {
      "intro": "Per Oboo's product page:",
      "steps": [
        "Shake the bottle before each use.",
        "Hold it about six inches away and mist your neck, chest, wrists or face.",
        "Breathe in the scent as you spray.",
        "Reapply whenever a hot flash starts.",
        "If your skin is very reactive, start with a small amount first."
      ],
      "sourceUrl": "https://oboo.love/products/cool-spray-for-hot-flashes",
      "sourceLabel": "Oboo Cool Spray for Hot Flashes product page"
    },
    "clinicalNote": "The Menopause Society's 2023 position statement on non-hormone treatments for hot flashes does not recommend cooling techniques, and it also does not recommend supplements and herbal remedies. Options it does recommend include cognitive behavioral therapy, clinical hypnosis, weight loss, stellate ganglion block (a nerve injection in the neck), certain antidepressants (SSRIs and SNRIs), gabapentin, oxybutynin, and fezolinetant, a newer FDA-approved non-hormone medication. A cooling mist may still feel nice in the moment, but if hot flashes are disrupting your life, those are the options worth raising with a clinician.",
    "clinicalNoteSources": [
      {
        "url": "https://menopause.org/wp-content/uploads/press-release/nonhormone-therapy-position-statement-release.pdf",
        "label": "The Menopause Society (NAMS): 2023 Nonhormone Therapy Position Statement press release",
        "summary": "Lists recommended non-hormone treatments for hot flashes and lists cooling techniques and supplements/herbal remedies as not recommended."
      }
    ],
    "warnings": [
      "If your skin is extra reactive, start with a small amount first."
    ],
    "warningsSource": {
      "url": "https://oboo.love/products/cool-spray-for-hot-flashes",
      "label": "Oboo: Cool Spray for Hot Flashes product page"
    }
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
        "summary": "Added letrozole for anovulatory infertility linked to PMOS or unexplained infertility, noting more live births than clomifene in PMOS and that this use is off-label in the US and EU."
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
    ],
    "howToUse": {
      "intro": "Per BUNI's bundle and product pages:",
      "steps": [
        "Pump REJUVENATE onto the outer vulva only; it is not for internal vaginal use.",
        "Smooth SOOTHE onto nipples after each feed, or before pumping to cut friction; there's no need to wipe it off before nursing.",
        "Roll TRANSFORM onto the scar or stretch marks once a day.",
        "Follow with the onyx gua sha to massage the oil in, about 5 minutes in total.",
        "Expect older scars to need daily use for at least 8 to 12 weeks.",
        "Get your doctor's OK before using TRANSFORM on a new or C-section scar, and before using REJUVENATE while pregnant or breastfeeding."
      ],
      "sourceUrl": "https://www.bunibody.com/products/buni-bundle",
      "sourceLabel": "BUNI Bundle page, with directions from the REJUVENATE, SOOTHE and TRANSFORM product pages on bunibody.com"
    },
    "clinicalNote": "For sore nipples in the first weeks of breastfeeding, a 2014 Cochrane review of four small, low-quality trials found not enough evidence to recommend any specific treatment, and suggested that applying nothing or expressed breast milk may work as well as or better than lanolin. For most women in those trials, nipple pain dropped to mild levels about 7 to 10 days after birth, whatever they used. That doesn't mean a plant-based balm like SOOTHE is harmful, just that comfort is the realistic goal.",
    "clinicalNoteSources": [
      {
        "url": "https://www.cochrane.org/evidence/CD007366_interventions-treating-painful-nipples-among-breastfeeding-women",
        "label": "Cochrane: Interventions for treating painful nipples among breastfeeding women (2014)",
        "summary": "Found too little evidence to recommend any nipple-pain treatment, with breast milk or nothing doing as well as lanolin, and pain easing to mild in about 7 to 10 days for most women."
      }
    ],
    "warnings": [
      "Get your doctor's approval before using TRANSFORM on new scars.",
      "Check with your medical professional before using TRANSFORM on a C-section scar."
    ],
    "warningsSource": {
      "url": "https://www.bunibody.com/products/buni-natural-scar-body-treatment-oil",
      "label": "BUNI: TRANSFORM Scar & Body Treatment Oil product page"
    }
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
    ],
    "clinicalSources": [
      {
        "url": "https://www.mayoclinic.org/diseases-conditions/stress-incontinence/diagnosis-treatment/drc-20355732",
        "label": "Mayo Clinic: Stress incontinence, diagnosis and treatment",
        "summary": "Lists regular pelvic floor (Kegel) exercises, taught by a clinician or physical therapist and sometimes paired with biofeedback, plus over-the-counter vaginal inserts and pessaries as non-drug options for bladder leaks."
      },
      {
        "url": "https://www.isswsh.org/images/content/2020-NAMS-GSM-Paper.pdf",
        "label": "The 2020 genitourinary syndrome of menopause position statement of The North American Menopause Society (Menopause, 2020)",
        "summary": "Names lubricants and regularly used vaginal moisturizers as first-line for mild menopausal dryness, and says energy-based vaginal devices are still under investigation, none are FDA-approved for this use, and larger sham-controlled trials are needed."
      }
    ],
    "effectiveness": "There is one published study of this type of therapy, and it was a case series with no comparison group. In the 2017 Joylux-funded study of 55 women aged 30 to 59 with stress urinary incontinence (leaking when you cough, sneeze, or exercise) after vaginal birth, 84% of those with measurable leakage at the start had their leakage cut by more than half after 50 days, and bladder, quality-of-life, and sexual function scores also improved. Without a control group, it's unclear how much of that came from the device itself, and ayna didn't find a controlled trial of vFit for dryness, sensation, or menopause symptoms.",
    "effectivenessSources": [
      {
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC5514206/",
        "label": "International Urogynecology Journal (2017): Multimodal vaginal toning for bladder symptoms and quality of life in stress urinary incontinence",
        "summary": "Joylux-funded case series of 55 postpartum women with stress incontinence reporting less leakage and better symptom scores after 24 home sessions, with no control group."
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
    },
    "scienceSources": [
      {
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC5514206/",
        "label": "de la Torre and Miller, Multimodal vaginal toning for bladder symptoms and quality of life in stress urinary incontinence, International Urogynecology Journal (2017)",
        "summary": "An uncontrolled case series of 55 women using the original device (then called vSculpt) at home found less leakage and better symptom scores after about 24 sessions; Joylux funded it and both authors were Joylux consultants, and it did not test the PLUS version."
      }
    ],
    "communityReview": "No reviews that clearly name vFit PLUS could be opened, so this reflects Joylux's Trustpilot reviews of its vFit devices in general. Longtime users often say it helped with tone, lubrication and comfort during sex. Common complaints are devices or lights that stopped working after a few weeks or months, a size some people with vaginal atrophy found painful, app and subscription requirements that weren't clear up front, and trouble getting refunds.",
    "communityReviewSources": [
      {
        "url": "https://au.trustpilot.com/review/joylux.com?page=3",
        "label": "Trustpilot: Joylux reviews (page 3)"
      },
      {
        "url": "https://www.trustpilot.com/review/joylux.com?page=4",
        "label": "Trustpilot: Joylux reviews (page 4)"
      }
    ],
    "effectiveness": "No study of vFit PLUS was found. The only published study of this type of therapy is the 2017 Joylux-funded case series of the standard vFit approach in 55 women with stress urinary incontinence (leaking when you cough, sneeze, or exercise) after vaginal birth. It reported less leakage and better symptom scores after 50 days, but had no control group, so it can't show how much the device itself helped, or whether the brighter LEDs and longer sessions on PLUS add anything.",
    "effectivenessSources": [
      {
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC5514206/",
        "label": "International Urogynecology Journal (2017): Multimodal vaginal toning for bladder symptoms and quality of life in stress urinary incontinence",
        "summary": "Joylux-funded case series of 55 postpartum women with stress incontinence reporting less leakage and better symptom scores after 24 home sessions, with no control group."
      }
    ]
  },
  "p-joylux-juicy-like-a-peach": {
    "whoItsFor": [
      "People in menopause who want a hormone-free gel for vaginal dryness and pain during sex",
      "Those who prefer a short, simple ingredient list with a vaginal-range pH (3.8, per Joylux)",
      "Not the pick if you use natural rubber latex or polyurethane condoms, which Joylux says it isn't compatible with"
    ],
    "scienceSources": [
      {
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC9708399/",
        "label": "Sarmento et al., Efficacy of Hormonal and Nonhormonal Approaches to Vaginal Atrophy and Sexual Dysfunctions in Postmenopausal Women: A Systematic Review, Revista Brasileira de Ginecologia e Obstetrícia (2022)",
        "summary": "Across 55 randomized trials, lubricants and moisturizers helped most with dryness and pain during sex but had a smaller effect than vaginal estrogen, with mild side effects and low to moderate certainty evidence."
      },
      {
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC4819835/",
        "label": "Climacteric (2016), Edwards and Panay: How important is vaginal lubricant and moisturizer composition?",
        "summary": "A Climacteric review from the same group explains that lubricant and moisturizer pH and osmolality should be close to natural vaginal fluid and that some additives can irritate or damage vaginal tissue, recommending lubricants for sex and moisturizers for ongoing dryness."
      }
    ],
    "ingredientScience": [
      {
        "name": "Hypromellose",
        "text": "Hypromellose (HPMC) is a cellulose-based thickener that turns water into a clear gel and is known for clinging to moist tissue, like the lining of the mouth and gut. A 2025 review describes it as a widely used, low-toxicity ingredient in medicines and cosmetics; it's what gives the gel its body, not a treatment on its own.",
        "citations": [
          {
            "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC12196896/",
            "label": "Pharmaceutics (MDPI, 2025): Hydroxypropyl Methylcellulose, A Key Excipient in Pharmaceutical Drug Delivery Systems"
          }
        ]
      },
      {
        "name": "Lactic acid",
        "text": "Lactic acid is a mild acid that keeps the gel acidic. It's also been tested as a gel for bacterial vaginosis (an overgrowth of certain vaginal bacteria), with mixed results in small trials; a 2022 review, funded by a company that sells such gels, called the evidence limited.",
        "citations": [
          {
            "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC7877752/",
            "label": "PLOS ONE (2021), Plummer et al.: Lactic acid-containing products for bacterial vaginosis, a systematic review"
          }
        ]
      }
    ],
    "effectiveness": "ayna didn't find a published study of this gel, so this is about vaginal moisturizers as a group. In a 2018 trial of 302 postmenopausal women with moderate to severe dryness, itching, or pain with sex, an over-the-counter vaginal moisturizer, a low-dose vaginal estrogen tablet, and a plain placebo gel all eased symptoms about equally over 12 weeks, with about half of women in every group improving meaningfully. The Menopause Society still lists moisturizers as a first-line option, while noting that few studies have tested these products.",
    "effectivenessSources": [
      {
        "url": "https://www.aafp.org/pubs/afp/issues/2018/1115/od3.html",
        "label": "American Family Physician (AAFP, 2018): summary of Mitchell et al., JAMA Internal Medicine 2018",
        "summary": "Reports that vaginal estradiol was no more effective than a nonprescription vaginal moisturizer or a placebo gel over 12 weeks in 302 postmenopausal women."
      },
      {
        "url": "https://www.isswsh.org/images/content/2020-NAMS-GSM-Paper.pdf",
        "label": "The Menopause Society (NAMS): 2020 Genitourinary Syndrome of Menopause Position Statement (hosted by ISSWSH)",
        "summary": "Lists lubricants and long-acting moisturizers as first-line for menopausal vaginal dryness while noting few clinical studies of these products."
      }
    ]
  },
  "p-joylux-lets-spin": {
    "whoItsFor": [
      "People who want a water-based gel to add moisture and make sex more comfortable when dryness or hormone changes get in the way",
      "Those who like hyaluronic acid and aloe in an intimacy product",
      "Not the pick if you use polyurethane condoms, which Joylux says it isn't compatible with"
    ],
    "howToUse": {
      "intro": "Per Joylux's directions on its Ulta listing:",
      "steps": [
        "Remove the cap.",
        "Squeeze the desired amount onto your intimate areas for moisture.",
        "Reapply as often as you like.",
        "Replace the cap and store the tube at room temperature."
      ],
      "sourceUrl": "https://www.ulta.com/p/mini-lets-spin-intimacy-gel-pimprod2052232",
      "sourceLabel": "Ulta: Joylux LET'S SPIN Intimacy Gel"
    },
    "scienceSources": [
      {
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC4819835/",
        "label": "Climacteric (2016), Edwards and Panay: How important is vaginal lubricant and moisturizer composition?",
        "summary": "A Climacteric review from the same group explains that lubricant and moisturizer pH and osmolality should be close to natural vaginal fluid and that some additives can irritate or damage vaginal tissue, recommending lubricants for sex and moisturizers for ongoing dryness."
      },
      {
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC10520994/",
        "label": "Albalawi et al., Comparison of the Efficacy of Vaginal Hyaluronic Acid to Estrogen for the Treatment of Vaginal Atrophy in Postmenopausal Women: A Systematic Review, Cureus (2023)",
        "summary": "Six small trials suggest vaginal hyaluronic acid works about as well as estrogen for menopausal vaginal symptoms, though not better, and the studies had real limitations; it did not test this gel."
      }
    ],
    "ingredientScience": [
      {
        "name": "Sodium hyaluronate (hyaluronic acid)",
        "text": "Hyaluronic acid holds onto water and is the main active idea behind this gel. A 2023 review of six small trials found vaginal hyaluronic acid worked about as well as vaginal estrogen for dryness after menopause, but the studies had real flaws, and The Menopause Society says there's no evidence yet that hyaluronic acid products beat moisturizers or lubricants without it.",
        "citations": [
          {
            "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC10520994/",
            "label": "Cureus (2023): Comparison of the Efficacy of Vaginal Hyaluronic Acid to Estrogen for the Treatment of Vaginal Atrophy in Postmenopausal Women, A Systematic Review"
          }
        ]
      },
      {
        "name": "Hydroxyethylcellulose",
        "text": "Hydroxyethylcellulose is a cellulose thickener that gives the gel its slip. A gel made from it has been used as the placebo in large vaginal gel trials, and in one trial of more than 1,500 women it caused no more genital side effects than using no gel at all.",
        "citations": [
          {
            "url": "https://rti.org/publication/appropriateness-hydroxyethylcellulose-gel-placebo-control-vaginal-microbicide-trials-comparison-two",
            "label": "Journal of Acquired Immune Deficiency Syndromes (2013): Appropriateness of hydroxyethylcellulose gel as a placebo control in vaginal microbicide trials (abstract via RTI International)"
          }
        ]
      }
    ],
    "clinicalNote": "As a water-based lubricant, Let's Spin is the kind of product The Menopause Society lists as a first-line option for dryness during sex, and most water-based lubricants are safe with latex condoms. The society also notes that some water-based products are hyperosmolar (much more concentrated than your body's own fluids), which damaged vaginal cells in lab studies, and that the World Health Organization recommends an osmolality under 1,200 mOsm/kg. If you're trying a new lubricant, the society suggests testing it on a small patch of skin for 24 hours first.",
    "clinicalNoteSources": [
      {
        "url": "https://www.isswsh.org/images/content/2020-NAMS-GSM-Paper.pdf",
        "label": "The Menopause Society (NAMS): 2020 Genitourinary Syndrome of Menopause Position Statement (hosted by ISSWSH)",
        "summary": "Covers lubricants as first-line care, latex compatibility, osmolality concerns with the WHO threshold, and a 24-hour skin patch test."
      }
    ],
    "effectiveness": "ayna didn't find a published study of this gel, so this is about the product type. In a 2018 trial of 302 postmenopausal women, a nonprescription vaginal moisturizer, low-dose vaginal estrogen, and a plain placebo gel all eased dryness and pain with sex about equally over 12 weeks. Small trials of hyaluronic acid vaginal gels found them roughly as helpful as estrogen for dryness, though those trials had real limitations.",
    "effectivenessSources": [
      {
        "url": "https://www.aafp.org/pubs/afp/issues/2018/1115/od3.html",
        "label": "American Family Physician (AAFP, 2018): summary of Mitchell et al., JAMA Internal Medicine 2018",
        "summary": "Reports that vaginal estradiol was no more effective than a nonprescription vaginal moisturizer or a placebo gel over 12 weeks in 302 postmenopausal women."
      },
      {
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC10520994/",
        "label": "Cureus (2023): Vaginal Hyaluronic Acid vs Estrogen for Vaginal Atrophy, A Systematic Review",
        "summary": "Six small trials suggest hyaluronic acid works comparably to estrogen for vaginal atrophy, with notable study limitations."
      }
    ]
  },
  "p-joylux-reliefher": {
    "whoItsFor": [
      "People who want a non-hormonal vaginal moisturizer used at bedtime every 2 to 3 days rather than daily",
      "Those who prefer an oil-based melt with hyaluronic acid over a water-based gel",
      "Not the pick if you rely on condoms: it contains oils, and the CDC warns oil-based products can cause condoms to break"
    ],
    "scienceSources": [
      {
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC10520994/",
        "label": "Albalawi et al., Comparison of the Efficacy of Vaginal Hyaluronic Acid to Estrogen for the Treatment of Vaginal Atrophy in Postmenopausal Women: A Systematic Review, Cureus (2023)",
        "summary": "Six small trials suggest vaginal hyaluronic acid works about as well as estrogen for menopausal vaginal symptoms, though not better, and the authors flag limitations in the studies."
      },
      {
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC9708399/",
        "label": "Sarmento et al., Efficacy of Hormonal and Nonhormonal Approaches to Vaginal Atrophy and Sexual Dysfunctions in Postmenopausal Women: A Systematic Review, Revista Brasileira de Ginecologia e Obstetrícia (2022)",
        "summary": "Found hyaluronic acid effective and well tolerated for vaginal atrophy symptoms compared with vaginal estrogen, while noting low to moderate certainty evidence."
      }
    ],
    "ingredientScience": [
      {
        "name": "Hyaluronic acid",
        "text": "Hyaluronic acid holds onto water. A 2023 review of six small trials found vaginal hyaluronic acid worked about as well as vaginal estrogen for dryness after menopause, though the studies had real flaws and none tested this product.",
        "citations": [
          {
            "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC10520994/",
            "label": "Cureus (2023): Comparison of the Efficacy of Vaginal Hyaluronic Acid to Estrogen for the Treatment of Vaginal Atrophy in Postmenopausal Women, A Systematic Review"
          }
        ]
      },
      {
        "name": "Vitamin E",
        "text": "In a small 2023 trial of 72 postmenopausal women, a vaginal vitamin E cream (100 IU) eased dryness and related symptoms about as much as a vaginal estrogen cream over 8 weeks. That's encouraging but early, since the trial was small and short.",
        "citations": [
          {
            "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC9086347/",
            "label": "J Menopausal Med (2022), Porterfield et al.: Vaginal vitamin E for genitourinary syndrome of menopause, a systematic review of RCTs"
          }
        ]
      },
      {
        "name": "Coconut oil",
        "text": "Virgin coconut oil works as a skin moisturizer: a review notes it was as effective and safe as mineral oil for mild to moderate dry skin. Those studies were on regular skin, not inside the vagina.",
        "citations": [
          {
            "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC5796020/",
            "label": "International Journal of Molecular Sciences (MDPI, 2018): Anti-Inflammatory and Skin Barrier Repair Effects of Topical Application of Some Plant Oils"
          }
        ]
      }
    ],
    "clinicalNote": "These melts are oil-based, with coconut oil and cocoa butter. The Menopause Society notes that oil-based lubricants can erode latex condoms, and that one study found more yeast (Candida) in women who used oils vaginally than in those who didn't. It also says there's no evidence yet that hyaluronic acid products work better than moisturizers or lubricants without it.",
    "clinicalNoteSources": [
      {
        "url": "https://www.isswsh.org/images/content/2020-NAMS-GSM-Paper.pdf",
        "label": "The Menopause Society (NAMS): 2020 Genitourinary Syndrome of Menopause Position Statement (hosted by ISSWSH)",
        "summary": "Notes oil-based lubricants can erode condoms, links vaginal oil use to more Candida colonization, and finds no added benefit shown for hyaluronic acid products."
      }
    ],
    "effectiveness": "ayna didn't find a study of these melts, so this is about their main ingredients. Small trials suggest vaginal hyaluronic acid and vaginal vitamin E can each ease menopausal dryness about as well as vaginal estrogen, but the trials were small and short, and none tested this combination.",
    "effectivenessSources": [
      {
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC10520994/",
        "label": "Cureus (2023): Vaginal Hyaluronic Acid vs Estrogen for Vaginal Atrophy, A Systematic Review",
        "summary": "Six small trials suggest hyaluronic acid works comparably to estrogen for vaginal atrophy, with notable study limitations."
      },
      {
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC9086347/",
        "label": "J Menopausal Med (2022), Porterfield et al.: Vaginal vitamin E for genitourinary syndrome of menopause, a systematic review of RCTs",
        "summary": "A systematic review of 4 small Iranian RCTs found that vaginal vitamin E (100 IU) eased menopausal vaginal symptoms about as well as conjugated estrogen cream in two 12-week trials of 52 women each, while noting the evidence is limited and major menopause societies do not yet recommend it."
      }
    ]
  },
  "p-joylux-revitalizher": {
    "whoItsFor": [
      "People with dryness on the outer vulva who want an oil-based protective layer",
      "Those who prefer plant oils and beeswax over water-based creams",
      "Not the pick for internal vaginal dryness: it's for external use only"
    ],
    "howToUse": {
      "intro": "Per Joylux's directions on its Equinox and Ulta listings:",
      "steps": [
        "Cleanse the area first, then gently pat it dry.",
        "Massage the amount you like into the skin of your vulva.",
        "Use it on the outside only, not inside the vagina.",
        "Leave it on; don't rinse it off."
      ],
      "sourceUrl": "https://shop.equinox.com/products/revitalizher%E2%84%A2-hydrating-serum",
      "sourceLabel": "Equinox: Joylux revitalizHER Hydrating Serum"
    },
    "clinicalSources": [
      {
        "url": "https://www.stgeorges.nhs.uk/wp-content/uploads/2023/02/DER_VSC.pdf",
        "label": "St George's University Hospitals NHS dermatology: Vulval skin care leaflet",
        "summary": "Says emollients can be used on vulval skin as often as needed for soothing relief and as a barrier, and lists fragranced or perfumed products among irritants to avoid."
      }
    ],
    "clinicalNote": "NHS dermatology advice supports using a moisturizer on vulval skin as often as you need it, including as a barrier before sex or peeing. The same advice lists perfumed products as common irritants, so stop if this serum stings.",
    "scienceSources": [
      {
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC5796020/",
        "label": "Lin et al., Anti-Inflammatory and Skin Barrier Repair Effects of Topical Application of Some Plant Oils, International Journal of Molecular Sciences (2018)",
        "summary": "Reviews evidence that coconut oil works about as well as mineral oil for dry skin and that jojoba oil's wax esters may help repair a damaged skin barrier; it did not study vulvar skin or this serum."
      }
    ],
    "communityReview": "Retail reviews are mostly positive but few. Reviewers often say it feels silky, hydrating and gentle on sensitive skin, and some postmenopausal buyers say it eased external dryness quickly. Complaints include the price, a smell one buyer disliked, irritation for at least one reviewer, and no noticeable change after a couple of weeks for another.",
    "communityReviewSources": [
      {
        "url": "https://www.ulta.com/p/revitalizher-intimate-hydrating-serum-pimprod2054091",
        "label": "Ulta: revitalizHER Intimate Hydrating Serum reviews"
      },
      {
        "url": "https://www.lovelyskin.com/o/reviews/joylux-revitalizher-hydrating-serum",
        "label": "LovelySkin: revitalizHER Hydrating Serum reviews"
      }
    ],
    "ingredientScience": [
      {
        "name": "Coconut oil",
        "text": "Virgin coconut oil is a decent skin moisturizer: a review notes it was as effective and safe as mineral oil for mild to moderate dry skin, and it helped skin barrier measures in children with eczema. Those studies weren't on the vulva.",
        "citations": [
          {
            "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC5796020/",
            "label": "International Journal of Molecular Sciences (MDPI, 2018): Anti-Inflammatory and Skin Barrier Repair Effects of Topical Application of Some Plant Oils"
          }
        ]
      },
      {
        "name": "Jojoba oil",
        "text": "Jojoba oil is rich in waxy compounds similar to the skin's own oils, and a review suggests it may help repair a damaged skin barrier. The human evidence behind that is thin.",
        "citations": [
          {
            "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC5796020/",
            "label": "International Journal of Molecular Sciences (MDPI, 2018): Anti-Inflammatory and Skin Barrier Repair Effects of Topical Application of Some Plant Oils"
          }
        ]
      },
      {
        "name": "Vitamin E (tocopherol)",
        "text": "Vitamin E is an antioxidant that may support the skin barrier and healing, but the evidence the review describes comes mostly from lab and mouse studies, not people.",
        "citations": [
          {
            "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC5796020/",
            "label": "International Journal of Molecular Sciences (MDPI, 2018): Anti-Inflammatory and Skin Barrier Repair Effects of Topical Application of Some Plant Oils"
          }
        ]
      },
      {
        "name": "Mandarin orange peel oil",
        "text": "Citrus peel oils contain limonene, which forms skin-allergy-causing compounds as it oxidizes during storage. In a study of 2,273 people patch-tested at European dermatology clinics, up to 6.5% per clinic reacted to oxidized limonene, so it's worth patch testing if your skin is sensitive.",
        "citations": [
          {
            "url": "https://pubmed.ncbi.nlm.nih.gov/12399762/",
            "label": "Journal of the American Academy of Dermatology (2002): Oxidized citrus oil (R-limonene), a frequent skin sensitizer in Europe"
          }
        ]
      }
    ],
    "effectiveness": "ayna didn't find a study of this serum or of oil-based vulvar serums in general. The closest evidence is for plant oils on ordinary dry skin, where virgin coconut oil moisturized about as well as mineral oil; whether that carries over to vulvar dryness hasn't been tested.",
    "effectivenessSources": [
      {
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC5796020/",
        "label": "International Journal of Molecular Sciences (MDPI, 2018): Anti-Inflammatory and Skin Barrier Repair Effects of Topical Application of Some Plant Oils",
        "summary": "Reviews skin studies of plant oils, including coconut oil performing as well as mineral oil for mild to moderate dry skin."
      }
    ]
  },
  "p-joylux-shebar": {
    "whoItsFor": [
      "People who want a soap-free bar for washing the outer intimate area",
      "Those who find regular soap drying and prefer a gentler syndet cleanser",
      "Not the pick if fragrance irritates your skin: this bar contains added fragrance"
    ],
    "howToUse": {
      "intro": "Per Joylux's directions on its Ulta listing:",
      "steps": [
        "Wet the skin of your outer intimate area.",
        "Rub the bar onto the wet skin, outside only.",
        "Gently lather and massage.",
        "Rinse thoroughly."
      ],
      "sourceUrl": "https://www.ulta.com/p/shebar-intimate-cleansing-bar-pimprod2048012",
      "sourceLabel": "Ulta: Joylux SHEbar Intimate Cleansing Bar"
    },
    "scienceSources": [
      {
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC8954092/",
        "label": "Mijaljica et al., Molecules (2022): Skin Cleansing without or with Compromise: Soaps and Syndets",
        "summary": "This review explains that soaps are alkaline (pH about 8.5 to 11) while syndets are close to skin pH (about 5.5 to 7), and that alkaline cleansers can strip skin lipids and disrupt the skin barrier more than syndets do."
      }
    ],
    "communityReview": "Retail reviews are very positive. Reviewers often say it cleans without drying or irritating, feels gentle and leaves skin soft, and many like the scent and reorder. The main complaint, from a small number of buyers, is that the fragrance is too strong.",
    "communityReviewSources": [
      {
        "url": "https://www.ulta.com/p/shebar-intimate-cleansing-bar-pimprod2048012",
        "label": "Ulta: SHEbar Intimate Cleansing Bar reviews"
      },
      {
        "url": "https://www.lovelyskin.com/o/reviews/joylux-shebar-intimate-soap",
        "label": "LovelySkin: SHEbar Intimate Soap reviews"
      }
    ],
    "ingredientScience": [
      {
        "name": "Sodium cocoyl isethionate",
        "text": "This is the main cleansing agent in syndet bars (bars made with synthetic detergents instead of soap). A small 28-day study in 50 people with mild eczema found syndet bar use was linked to less eczema and kept skin hydration steady, but it had no soap comparison group and several authors worked for the bar makers, so the evidence is modest.",
        "citations": [
          {
            "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC8954092/",
            "label": "Mijaljica et al., Molecules (2022): Skin Cleansing without or with Compromise: Soaps and Syndets"
          }
        ]
      },
      {
        "name": "Coconut oil",
        "text": "Coconut oil is a plant oil that can soften dry skin. In a randomized trial of 148 older adults with dry legs, virgin coconut oil applied twice a day for 2 weeks improved dryness and hydration more than mineral oil, though the trial was small and short. In this bar it is a minor ingredient in a rinse-off product, so it may do less than a leave-on oil.",
        "citations": [
          {
            "url": "https://actamedicaphilippina.upm.edu.ph/index.php/acta/article/download/31/19",
            "label": "Acta Medica Philippina (2019): Virgin coconut oil vs mineral oil for senile xerosis"
          }
        ]
      },
      {
        "name": "Argan oil",
        "text": "Argan oil is a plant oil used as an emollient (a skin softener that helps hold in moisture). One 60-day study of 60 postmenopausal women found argan oil on the forearm lowered water loss from the skin and raised skin water content, but the study was small and was not done on vulvar skin.",
        "citations": [
          {
            "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC4520377/",
            "label": "Menopause Review (2014): Skin hydration in postmenopausal women, argan oil oral and/or topical use"
          }
        ]
      },
      {
        "name": "Fragrance",
        "text": "Fragrance has no skin benefit and is here for scent. NHS vulval care advice says to avoid all fragrances on vulval skin, so if your skin is sensitive this is the ingredient to watch.",
        "citations": [
          {
            "url": "https://www.bradfordhospitals.nhs.uk/wp-content/uploads/2026/03/25070706-Vulva-Care-Advice-Sheet.pdf",
            "label": "NHS (Bradford Teaching Hospitals): Vulval Care Advice Sheet"
          }
        ]
      }
    ],
    "clinicalNote": "Your vulva doesn't need a special cleanser. NHS vulval care advice says water alone is enough to clean the area, that you don't need soap, and that a soap substitute can help stop water from drying the skin. The same advice says to avoid all fragrances on vulval skin. A soap-free bar like this is closer to a soap substitute than to regular soap, but it does contain fragrance.",
    "clinicalNoteSources": [
      {
        "url": "https://www.bradfordhospitals.nhs.uk/wp-content/uploads/2026/03/25070706-Vulva-Care-Advice-Sheet.pdf",
        "label": "NHS (Bradford Teaching Hospitals): Vulval Care Advice Sheet",
        "summary": "Says water alone is enough to clean the vulva, soap isn't needed, soap substitutes can limit drying, and all fragrances should be avoided."
      }
    ],
    "effectiveness": "No study of SHEbar itself was found. For the product type, syndet bars built on sodium cocoyl isethionate are described as milder than soap, but the supporting study was small, industry-linked, done in people with eczema rather than on vulvar skin, and had no soap comparison group. NHS advice says water alone is enough to keep the vulva clean.",
    "effectivenessSources": [
      {
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC8954092/",
        "label": "Mijaljica et al., Molecules (2022): Skin Cleansing without or with Compromise: Soaps and Syndets",
        "summary": "This review says syndets, which sit close to skin pH, disrupt the skin barrier less than alkaline soaps, which can strip lipids and natural moisturizing factors."
      },
      {
        "url": "https://www.bradfordhospitals.nhs.uk/wp-content/uploads/2026/03/25070706-Vulva-Care-Advice-Sheet.pdf",
        "label": "NHS (Bradford Teaching Hospitals): Vulval Care Advice Sheet",
        "summary": "States that water alone is enough to clean the vulval area."
      }
    ]
  },
  "p-joylux-ilyeo-body": {
    "whoItsFor": [
      "Midlife women looking for a drug-free, at-home option for minor muscle and joint aches, like sore shoulders or knees",
      "People who already like heat for stiffness and want a cordless wrap with red light and vibration added",
      "Not the pick if you take light-sensitizing medications, have reduced feeling in the area, or have active skin cancer or suspicious lesions, per Joylux"
    ],
    "clinicalSources": [
      {
        "url": "https://www.mdanderson.org/cancerwise/what-is-red-light-therapy.h00-159701490.html",
        "label": "MD Anderson Cancer Center: What is red light therapy?",
        "summary": "MD Anderson pain specialists say red light therapy may ease muscle pain but is still investigational for pain management with no trials defining how often or how long to use it, and that at-home devices are less intense than clinic ones and low risk when used safely."
      }
    ],
    "scienceSources": [
      {
        "url": "https://www.lni.wa.gov/patient-care/_docs/HTAupdateLLLT_011818.pdf",
        "label": "Washington State Department of Labor and Industries: Low-level laser therapy for musculoskeletal conditions, technology assessment update (2018)",
        "summary": "Reviewing systematic reviews of randomized trials, it rated the evidence for low-level light therapy on muscle and joint pain as low or very low quality, with small, short-term and inconsistent benefits; it covered clinic lasers, not wearable LED wraps like this one."
      },
      {
        "url": "https://journals.sbmu.ac.ir/jlms/article/view/48441",
        "label": "High- and Low-Level Laser Therapy for the Treatment of Orthopedic Pain: A Systematic Review, Journal of Lasers in Medical Sciences (2025)",
        "summary": "Eight randomized trials suggest laser therapy is a safe, helpful add-on for orthopedic pain, but differences in devices and settings ruled out pooling the results."
      }
    ],
    "effectiveness": "No study of ILYEO body itself was found, and none was found for this mix of red light, heat and vibration together. Looking at the parts on their own: a Cochrane review found moderate evidence that heat wraps give a small, short-term drop in pain and disability for recent low back pain. A 2009 Lancet review found low-level laser therapy eased neck pain, but those studies used lasers, not the LED red light in wearables like this, so they don't show this device works.",
    "effectivenessSources": [
      {
        "url": "https://search.pedro.org.au/search-results/record-detail/15878",
        "label": "Cochrane review (2006): Superficial heat or cold for low back pain (PEDro record)",
        "summary": "Moderate evidence from a few trials that heat wrap therapy gives a small, short-term reduction in pain and disability in acute and sub-acute low back pain."
      },
      {
        "url": "https://search.pedro.org.au/search-results/record-detail/24285",
        "label": "Lancet (2009): Low-level laser therapy for neck pain, systematic review and meta-analysis (PEDro record)",
        "summary": "Low-level laser therapy reduced pain right after treatment in acute neck pain and for up to 22 weeks in chronic neck pain, with mild side effects similar to placebo."
      }
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
    ],
    "scienceSources": [
      {
        "url": "https://www.bumc.bu.edu/camed/news-events/articles/2025/study-finds-wrist-cooling-represents-a-promising-approach-for-managing-hot-flashes/",
        "label": "Boston University Chobanian & Avedisian School of Medicine: Study finds wrist cooling represents a promising approach for managing hot flashes (2025)",
        "summary": "Describes a small randomized, double-blind crossover trial of 27 people, including 5 postmenopausal women, in which a wrist cooling device cut severe hot flashes by 46% versus baseline; it tested a different cooling device, not bra inserts."
      }
    ],
    "communityReview": "Retail reviews are mostly positive. Reviewers like that the pads cool quickly during a hot flash, are discreet enough to keep in a bra or handbag, and also soothe sore breasts. Complaints are that the cold doesn't last long, the pads don't sit well in some bras, and for some buyers they stopped firming up after about 10 uses or stayed soft for hours in a warm room until refrigerated.",
    "communityReviewSources": [
      {
        "url": "https://www.ulta.com/p/coldher-cooling-bra-inserts-pimprod2048010",
        "label": "Ulta: coldHER Cooling Bra Inserts reviews"
      }
    ],
    "clinicalNote": "Cooling can make a hot flash feel more bearable, but it doesn't reduce how often hot flashes happen. The Menopause Society's 2023 statement on non-hormone treatments does not recommend cooling techniques as a treatment, because the studies so far are small or found no objective change. Treatments with stronger evidence include hormone therapy, which the statement calls the most effective option for those who can take it, plus cognitive behavioral therapy (a structured talk therapy), clinical hypnosis, and some prescription medicines.",
    "clinicalNoteSources": [
      {
        "url": "https://depts.washington.edu/mbwc/content/page-files/NAMS_2023-nonhormone-therapy-position-statement_(1)22.pdf",
        "label": "The Menopause Society (2023): Nonhormone therapy position statement, Menopause journal",
        "summary": "Does not recommend cooling techniques for hot flashes due to limited evidence, recommends CBT, hypnosis and several medicines, and notes hormone therapy is the most effective treatment."
      }
    ],
    "effectiveness": "No study of coldHER was found. For cooling products in general, The Menopause Society says the evidence is weak: studies were small and uncontrolled, and one device trial found no objective change in nighttime hot flashes. Treat it as a comfort tool, not a hot flash treatment. No study on cooling pads for breast soreness was found.",
    "effectivenessSources": [
      {
        "url": "https://depts.washington.edu/mbwc/content/page-files/NAMS_2023-nonhormone-therapy-position-statement_(1)22.pdf",
        "label": "The Menopause Society (2023): Nonhormone therapy position statement, Menopause journal",
        "summary": "Rates cooling techniques as not recommended because the studies are small, uncontrolled, or showed no objective change."
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
    ],
    "howToUse": {
      "intro": "SootheHer's own pad instructions couldn't be opened, so these steps follow NHS guidance on TENS pads:",
      "steps": [
        "Put the pad on clean skin near the painful area.",
        "Don't place it on irritated, broken, infected or numb skin.",
        "Turn the device off and remove the pad if your skin gets itchy, irritated or red."
      ],
      "sourceUrl": "https://www.nhs.uk/conditions/transcutaneous-electrical-nerve-stimulation-tens/",
      "sourceLabel": "NHS: TENS (transcutaneous electrical nerve stimulation)"
    },
    "clinicalSources": [
      {
        "url": "https://www.nhs.uk/conditions/transcutaneous-electrical-nerve-stimulation-tens/",
        "label": "NHS: TENS (transcutaneous electrical nerve stimulation)",
        "summary": "Says to place TENS pads on clean skin, never on irritated, broken, infected or numb areas, and to stop and remove them if the skin becomes itchy, irritated or red."
      }
    ],
    "scienceSources": [
      {
        "url": "https://www.cochrane.org/evidence/CD013331_tens-electrical-nerve-stimulation-through-skin-effective-treatment-period-pain-and-does-it-cause",
        "label": "Han et al., Transcutaneous electrical nerve stimulation (TENS) for pain control in women with primary dysmenorrhoea, Cochrane Database of Systematic Reviews (2024)",
        "summary": "Across 20 small trials, TENS may reduce period pain compared with placebo or no treatment (low certainty evidence), and mild skin redness or irritation at the pad sites is the main possible side effect."
      }
    ],
    "clinicalNote": "These pads are the part of the Elaris Pod that touches your skin, so they don't do anything on their own. We couldn't open the SootheHer site to confirm exactly how the Pod works. For electrical stimulation devices for period pain in general, called TENS (transcutaneous electrical nerve stimulation, a mild current sent through pads on the skin), a Cochrane review of 7 small trials found high-frequency TENS eased period pain better than a placebo device, while low-frequency TENS did not. The reviewers noted the number of trials was small.",
    "clinicalNoteSources": [
      {
        "url": "https://www.cochrane.org/CD002123/MENSTR_transcutaneous-electrical-nerve-stimulation-for-primary-dysmenorrhoea",
        "label": "Cochrane: Transcutaneous electrical nerve stimulation for primary dysmenorrhoea",
        "summary": "Across 7 randomized trials, high-frequency TENS relieved period pain better than placebo TENS; low-frequency TENS did not, and the trials were few and small."
      }
    ]
  },
  "p-gina-insertion-applicator-refills": {
    "whoItsFor": [
      "gina Vaginal Moisturizing Glides users who lost or wore out their applicator",
      "People who find it easier to place a Glide deeper and more precisely with an applicator than with fingers",
      "Not the pick if you don't use gina Glides: it's designed only for them"
    ],
    "clinicalSources": [
      {
        "url": "https://www.mayoclinic.org/diseases-conditions/menopause/expert-answers/vaginal-dryness/faq-20115086",
        "label": "Mayo Clinic: Vaginal dryness after menopause, how to treat it?",
        "summary": "Says vaginal moisturizers are put into the vagina or around the vulva every day or every few days to keep tissues healthy, which is the kind of product this applicator is used to place."
      }
    ],
    "clinicalNote": "This applicator is only a tool for placing gina's Vaginal Moisturizing Glides, so the real question is whether a vaginal moisturizer suits you. Mayo Clinic describes vaginal moisturizers as something you use every few days to keep vaginal tissue moisturized, which is different from a lubricant you use at the time of sex. If dryness keeps bothering you, a doctor may suggest low-dose vaginal estrogen as a cream, tablet or ring, and if you've had breast cancer, Mayo Clinic says to talk with your doctor about the risks of vaginal estrogen first.",
    "clinicalNoteSources": [
      {
        "url": "https://newsnetwork.mayoclinic.org/discussion/womens-wellness-how-to-treat-vaginal-dryness-after-menopause/",
        "label": "Mayo Clinic News Network: How to treat vaginal dryness after menopause",
        "summary": "Explains that vaginal moisturizers are applied every few days while lubricants are for sex, and lists low-dose vaginal estrogen and other options for ongoing dryness."
      }
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
        "url": "https://leaflets.ekhuft.nhs.uk/general-care-of-vulval-skin",
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
        "url": "https://leaflets.ekhuft.nhs.uk/general-care-of-vulval-skin",
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
        "url": "https://leaflets.ekhuft.nhs.uk/general-care-of-vulval-skin",
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
        "url": "https://leaflets.ekhuft.nhs.uk/general-care-of-vulval-skin",
        "label": "East Kent Hospitals (NHS): General care of vulval skin",
        "summary": "NHS patient guidance recommends a daily emollient on vulval skin, washing with a soap substitute, and avoiding soaps, wipes, douches and scented products that can irritate."
      }
    ]
  },
  "p-alubri-rejuvenate-restore-kit": {
    "clinicalSources": [
      {
        "url": "https://leaflets.ekhuft.nhs.uk/general-care-of-vulval-skin",
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
        "url": "https://esraeurope.org/prospect/procedures/vaginal-delivery-with-perineal-tears-or-episiotomy-2023/summary-recommendations-35/",
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
        "url": "https://esraeurope.org/prospect/procedures/vaginal-delivery-with-perineal-tears-or-episiotomy-2023/summary-recommendations-35/",
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
        "url": "https://www.asrm.org/practice-guidance/practice-committee-documents/prepregnancy-counseling-2019/",
        "label": "ACOG and ASRM: Prepregnancy counseling (ACOG Committee Opinion No. 762, 2019)",
        "summary": "The joint ACOG/ASRM opinion recommends folic acid before pregnancy, reaching a normal BMI, moderate exercise at least 30 minutes 5 days a week, avoiding alcohol and marijuana, and screening for tobacco use with help to quit."
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
        "url": "https://leaflets.ekhuft.nhs.uk/general-care-of-vulval-skin",
        "label": "East Kent Hospitals (NHS): General care of vulval skin",
        "summary": "For people with sensitive or irritated vulval skin, this NHS guidance advises against wearing panty liners every day and recommends loose cotton underwear and avoiding scented products."
      }
    ]
  },
  "p-tampontribe-reusable-pads": {
    "clinicalSources": [
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
    ],
    "effectiveness": "No study of Rèsa exists yet because it hasn't launched, so this is evidence for wrist wearables in general. In a 2019 study of a different bracelet (Ava) in 193 women, wrist skin temperature, heart rate, and breathing rate all shifted with cycle phase, and the company's algorithm picked out the fertile window with about 90% accuracy in women who wore it consistently; several authors worked for the company. A 2021 study of the same bracelet in 57 women found wrist temperature caught ovulation more often than a morning oral thermometer (62% vs 23%) but gave many more false alarms.",
    "effectivenessSources": [
      {
        "url": "https://jmir.org/2019/4/e13404/",
        "label": "Goodale et al., Journal of Medical Internet Research 2019: Wearable sensors reveal menses-driven changes in physiology",
        "summary": "Found wrist temperature, heart rate, and breathing rate change across the menstrual cycle in a wrist wearable, with a disclosed company conflict of interest."
      },
      {
        "url": "https://www.jmir.org/2021/6/e20710/",
        "label": "Zhu et al., Journal of Medical Internet Research 2021: Accuracy of wrist skin temperature in detecting ovulation",
        "summary": "Found wrist skin temperature during sleep was more sensitive but less specific than basal body temperature for detecting ovulation."
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
    ],
    "scienceSources": [
      {
        "url": "https://pubmed.ncbi.nlm.nih.gov/38963987/",
        "label": "Shearston et al., Environment International (2024): Tampons as a source of exposure to metal(loid)s",
        "summary": "Tested 30 tampons from 14 brands and found metals such as lead and arsenic across product types, with no category (organic, store or name brand, US or EU) consistently lower; whether metals are absorbed through vaginal tissue was not tested."
      },
      {
        "url": "https://iro.uiowa.edu/esploro/outputs/journalArticle/Device-Associated-Menstrual-Toxic-Shock-Syndrome/9984066349902771",
        "label": "Schlievert and Davis, Clinical Microbiology Reviews (2020): Device-Associated Menstrual Toxic Shock Syndrome",
        "summary": "Peer-reviewed review linking tampon use to menstrual toxic shock syndrome, explaining why standard absorbency labeling exists, and noting that cases still occur."
      }
    ],
    "communityReview": "Reviewers often praise how comfortable these feel once inserted, the lack of applicator waste, and how compact they are to carry. Common complaints are finger insertion, which some people just don't like, a dry or scratchy feel for some users, and a minority who find absorbency lacking. Some recent reviewers also dislike a newer twist-off wrapper that is hard to open, especially with arthritic hands.",
    "communityReviewSources": [
      {
        "url": "https://www.target.com/p/-/A-14013693",
        "label": "Target: o.b. Applicator-Free Tampons Multipack reviews"
      },
      {
        "url": "https://www.target.com/p/-/A-13293258",
        "label": "Target: o.b. Original Super Plus reviews"
      },
      {
        "url": "https://walmart.com/ip/seort/14089583",
        "label": "Walmart: o.b. Tampons Multi-Pack reviews"
      }
    ],
    "clinicalNote": "Toxic shock syndrome (TSS) is a rare but life-threatening illness caused by a toxin made by certain bacteria. Tampons are a known risk factor, especially highly absorbent ones and ones left in for a long time, though today fewer than half of TSS cases are linked to tampon use. The FDA says reported tampon-related TSS cases have dropped a lot over the years, and that if you can wear one tampon for up to 8 hours without changing it, the absorbency may be too high for you. Picking the lowest absorbency you need and changing it every 4 to 8 hours are the main ways to lower your risk.",
    "clinicalNoteSources": [
      {
        "url": "https://medlineplus.gov/ency/article/000653.htm",
        "label": "MedlinePlus (NIH): Toxic shock syndrome",
        "summary": "NIH patient page explaining that TSS is a medical emergency, that tampon use (especially highly absorbent tampons or long wear) is a risk factor, and that less than half of cases today are tampon-linked."
      },
      {
        "url": "https://www.fda.gov/forconsumers/consumerupdates/ucm612029.htm",
        "label": "FDA: The Facts on Tampons and How to Use Them Safely",
        "summary": "FDA consumer guidance on choosing the lowest absorbency, changing tampons every 4 to 8 hours, and recognizing TSS symptoms."
      }
    ],
    "warnings": [
      "Use the lowest absorbency tampon you need for your flow.",
      "Change each tampon every 4 to 8 hours, and never wear one for more than 8 hours at a time.",
      "Tampons are for one-time use only, so throw each one away after use.",
      "If you get a sudden fever, vomiting, diarrhea, dizziness, fainting, or a rash that looks like a sunburn during or soon after your period, stop using tampons and get medical help right away."
    ],
    "warningsSource": {
      "url": "https://www.fda.gov/forconsumers/consumerupdates/ucm612029.htm",
      "label": "FDA: The Facts on Tampons and How to Use Them Safely"
    }
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
    ],
    "scienceSources": [
      {
        "url": "https://pubmed.ncbi.nlm.nih.gov/38963987/",
        "label": "Shearston et al., Environment International (2024): Tampons as a source of exposure to metal(loid)s",
        "summary": "Tested 30 tampons from 14 brands and found metals such as lead and arsenic across product types, with no category (organic, store or name brand, US or EU) consistently lower; whether metals are absorbed through vaginal tissue was not tested."
      },
      {
        "url": "https://iro.uiowa.edu/esploro/outputs/journalArticle/Device-Associated-Menstrual-Toxic-Shock-Syndrome/9984066349902771",
        "label": "Schlievert and Davis, Clinical Microbiology Reviews (2020): Device-Associated Menstrual Toxic Shock Syndrome",
        "summary": "Peer-reviewed review linking tampon use to menstrual toxic shock syndrome, explaining why standard absorbency labeling exists, and noting that cases still occur."
      }
    ],
    "communityReview": "Reviewers often praise how comfortable these feel once inserted, the lack of applicator waste, and how compact they are to carry. Common complaints are finger insertion, which some people just don't like, a dry or scratchy feel for some users, and a minority who find absorbency lacking. Some recent reviewers also dislike a newer twist-off wrapper that is hard to open, especially with arthritic hands.",
    "communityReviewSources": [
      {
        "url": "https://www.target.com/p/-/A-14013693",
        "label": "Target: o.b. Applicator-Free Tampons Multipack reviews"
      },
      {
        "url": "https://www.target.com/p/-/A-13293258",
        "label": "Target: o.b. Original Super Plus reviews"
      },
      {
        "url": "https://walmart.com/ip/seort/14089583",
        "label": "Walmart: o.b. Tampons Multi-Pack reviews"
      }
    ],
    "clinicalNote": "Toxic shock syndrome (TSS) is a rare but life-threatening illness caused by a toxin made by certain bacteria. Tampons are a known risk factor, especially highly absorbent ones and ones left in for a long time, though today fewer than half of TSS cases are linked to tampon use. The FDA says reported tampon-related TSS cases have dropped a lot over the years, and that if you can wear one tampon for up to 8 hours without changing it, the absorbency may be too high for you. Picking the lowest absorbency you need and changing it every 4 to 8 hours are the main ways to lower your risk.",
    "clinicalNoteSources": [
      {
        "url": "https://medlineplus.gov/ency/article/000653.htm",
        "label": "MedlinePlus (NIH): Toxic shock syndrome",
        "summary": "NIH patient page explaining that TSS is a medical emergency, that tampon use (especially highly absorbent tampons or long wear) is a risk factor, and that less than half of cases today are tampon-linked."
      },
      {
        "url": "https://www.fda.gov/forconsumers/consumerupdates/ucm612029.htm",
        "label": "FDA: The Facts on Tampons and How to Use Them Safely",
        "summary": "FDA consumer guidance on choosing the lowest absorbency, changing tampons every 4 to 8 hours, and recognizing TSS symptoms."
      }
    ],
    "warnings": [
      "Use the lowest absorbency tampon you need for your flow.",
      "Change each tampon every 4 to 8 hours, and never wear one for more than 8 hours at a time.",
      "Tampons are for one-time use only, so throw each one away after use.",
      "If you get a sudden fever, vomiting, diarrhea, dizziness, fainting, or a rash that looks like a sunburn during or soon after your period, stop using tampons and get medical help right away."
    ],
    "warningsSource": {
      "url": "https://www.fda.gov/forconsumers/consumerupdates/ucm612029.htm",
      "label": "FDA: The Facts on Tampons and How to Use Them Safely"
    }
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
    ],
    "scienceSources": [
      {
        "url": "https://pubmed.ncbi.nlm.nih.gov/38963987/",
        "label": "Shearston et al., Environment International (2024): Tampons as a source of exposure to metal(loid)s",
        "summary": "Tested 30 tampons from 14 brands and found metals such as lead and arsenic across product types, with no category (organic, store or name brand, US or EU) consistently lower; whether metals are absorbed through vaginal tissue was not tested."
      },
      {
        "url": "https://iro.uiowa.edu/esploro/outputs/journalArticle/Device-Associated-Menstrual-Toxic-Shock-Syndrome/9984066349902771",
        "label": "Schlievert and Davis, Clinical Microbiology Reviews (2020): Device-Associated Menstrual Toxic Shock Syndrome",
        "summary": "Peer-reviewed review linking tampon use to menstrual toxic shock syndrome, explaining why standard absorbency labeling exists, and noting that cases still occur."
      }
    ],
    "communityReview": "Reviewers often praise how comfortable these feel once inserted, the lack of applicator waste, and how compact they are to carry. Common complaints are finger insertion, which some people just don't like, a dry or scratchy feel for some users, and a minority who find absorbency lacking. Some recent reviewers also dislike a newer twist-off wrapper that is hard to open, especially with arthritic hands.",
    "communityReviewSources": [
      {
        "url": "https://www.target.com/p/-/A-14013693",
        "label": "Target: o.b. Applicator-Free Tampons Multipack reviews"
      },
      {
        "url": "https://www.target.com/p/-/A-13293258",
        "label": "Target: o.b. Original Super Plus reviews"
      },
      {
        "url": "https://walmart.com/ip/seort/14089583",
        "label": "Walmart: o.b. Tampons Multi-Pack reviews"
      }
    ],
    "clinicalNote": "Toxic shock syndrome (TSS) is a rare but life-threatening illness caused by a toxin made by certain bacteria. Tampons are a known risk factor, especially highly absorbent ones and ones left in for a long time, though today fewer than half of TSS cases are linked to tampon use. The FDA says reported tampon-related TSS cases have dropped a lot over the years, and that if you can wear one tampon for up to 8 hours without changing it, the absorbency may be too high for you. Picking the lowest absorbency you need and changing it every 4 to 8 hours are the main ways to lower your risk.",
    "clinicalNoteSources": [
      {
        "url": "https://medlineplus.gov/ency/article/000653.htm",
        "label": "MedlinePlus (NIH): Toxic shock syndrome",
        "summary": "NIH patient page explaining that TSS is a medical emergency, that tampon use (especially highly absorbent tampons or long wear) is a risk factor, and that less than half of cases today are tampon-linked."
      },
      {
        "url": "https://www.fda.gov/forconsumers/consumerupdates/ucm612029.htm",
        "label": "FDA: The Facts on Tampons and How to Use Them Safely",
        "summary": "FDA consumer guidance on choosing the lowest absorbency, changing tampons every 4 to 8 hours, and recognizing TSS symptoms."
      }
    ],
    "warnings": [
      "Use the lowest absorbency tampon you need for your flow.",
      "Change each tampon every 4 to 8 hours, and never wear one for more than 8 hours at a time.",
      "Tampons are for one-time use only, so throw each one away after use.",
      "If you get a sudden fever, vomiting, diarrhea, dizziness, fainting, or a rash that looks like a sunburn during or soon after your period, stop using tampons and get medical help right away."
    ],
    "warningsSource": {
      "url": "https://www.fda.gov/forconsumers/consumerupdates/ucm612029.htm",
      "label": "FDA: The Facts on Tampons and How to Use Them Safely"
    }
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
    ],
    "scienceSources": [
      {
        "url": "https://pubmed.ncbi.nlm.nih.gov/38963987/",
        "label": "Shearston et al., Environment International (2024): Tampons as a source of exposure to metal(loid)s",
        "summary": "Tested 30 tampons from 14 brands and found metals such as lead and arsenic across product types, with no category (organic, store or name brand, US or EU) consistently lower; whether metals are absorbed through vaginal tissue was not tested."
      },
      {
        "url": "https://iro.uiowa.edu/esploro/outputs/journalArticle/Device-Associated-Menstrual-Toxic-Shock-Syndrome/9984066349902771",
        "label": "Schlievert and Davis, Clinical Microbiology Reviews (2020): Device-Associated Menstrual Toxic Shock Syndrome",
        "summary": "Peer-reviewed review linking tampon use to menstrual toxic shock syndrome, explaining why standard absorbency labeling exists, and noting that cases still occur."
      }
    ],
    "communityReview": "Reviewers often praise how comfortable these feel once inserted, the lack of applicator waste, and how compact they are to carry. Common complaints are finger insertion, which some people just don't like, a dry or scratchy feel for some users, and a minority who find absorbency lacking. Some recent reviewers also dislike a newer twist-off wrapper that is hard to open, especially with arthritic hands.",
    "communityReviewSources": [
      {
        "url": "https://www.target.com/p/-/A-14013693",
        "label": "Target: o.b. Applicator-Free Tampons Multipack reviews"
      },
      {
        "url": "https://www.target.com/p/-/A-13293258",
        "label": "Target: o.b. Original Super Plus reviews"
      },
      {
        "url": "https://walmart.com/ip/seort/14089583",
        "label": "Walmart: o.b. Tampons Multi-Pack reviews"
      }
    ],
    "clinicalNote": "Toxic shock syndrome (TSS) is a rare but life-threatening illness caused by a toxin made by certain bacteria. Tampons are a known risk factor, especially highly absorbent ones and ones left in for a long time, though today fewer than half of TSS cases are linked to tampon use. The FDA says reported tampon-related TSS cases have dropped a lot over the years, and that if you can wear one tampon for up to 8 hours without changing it, the absorbency may be too high for you. Picking the lowest absorbency you need and changing it every 4 to 8 hours are the main ways to lower your risk.",
    "clinicalNoteSources": [
      {
        "url": "https://medlineplus.gov/ency/article/000653.htm",
        "label": "MedlinePlus (NIH): Toxic shock syndrome",
        "summary": "NIH patient page explaining that TSS is a medical emergency, that tampon use (especially highly absorbent tampons or long wear) is a risk factor, and that less than half of cases today are tampon-linked."
      },
      {
        "url": "https://www.fda.gov/forconsumers/consumerupdates/ucm612029.htm",
        "label": "FDA: The Facts on Tampons and How to Use Them Safely",
        "summary": "FDA consumer guidance on choosing the lowest absorbency, changing tampons every 4 to 8 hours, and recognizing TSS symptoms."
      }
    ],
    "warnings": [
      "Use the lowest absorbency tampon you need for your flow.",
      "Change each tampon every 4 to 8 hours, and never wear one for more than 8 hours at a time.",
      "Tampons are for one-time use only, so throw each one away after use.",
      "If you get a sudden fever, vomiting, diarrhea, dizziness, fainting, or a rash that looks like a sunburn during or soon after your period, stop using tampons and get medical help right away."
    ],
    "warningsSource": {
      "url": "https://www.fda.gov/forconsumers/consumerupdates/ucm612029.htm",
      "label": "FDA: The Facts on Tampons and How to Use Them Safely"
    }
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
    ],
    "scienceSources": [
      {
        "url": "https://pubmed.ncbi.nlm.nih.gov/38963987/",
        "label": "Shearston et al., Environment International (2024): Tampons as a source of exposure to metal(loid)s",
        "summary": "Tested 30 tampons from 14 brands and found metals such as lead and arsenic across product types, with no category (organic, store or name brand, US or EU) consistently lower; whether metals are absorbed through vaginal tissue was not tested."
      },
      {
        "url": "https://iro.uiowa.edu/esploro/outputs/journalArticle/Device-Associated-Menstrual-Toxic-Shock-Syndrome/9984066349902771",
        "label": "Schlievert and Davis, Clinical Microbiology Reviews (2020): Device-Associated Menstrual Toxic Shock Syndrome",
        "summary": "Peer-reviewed review linking tampon use to menstrual toxic shock syndrome, explaining why standard absorbency labeling exists, and noting that cases still occur."
      }
    ],
    "communityReview": "Reviewers often praise how comfortable these feel once inserted, the lack of applicator waste, and how compact they are to carry. Common complaints are finger insertion, which some people just don't like, a dry or scratchy feel for some users, and a minority who find absorbency lacking. Some recent reviewers also dislike a newer twist-off wrapper that is hard to open, especially with arthritic hands.",
    "communityReviewSources": [
      {
        "url": "https://www.target.com/p/-/A-14013693",
        "label": "Target: o.b. Applicator-Free Tampons Multipack reviews"
      },
      {
        "url": "https://www.target.com/p/-/A-13293258",
        "label": "Target: o.b. Original Super Plus reviews"
      },
      {
        "url": "https://walmart.com/ip/seort/14089583",
        "label": "Walmart: o.b. Tampons Multi-Pack reviews"
      }
    ],
    "clinicalNote": "Toxic shock syndrome (TSS) is a rare but life-threatening illness caused by a toxin made by certain bacteria. Tampons are a known risk factor, especially highly absorbent ones and ones left in for a long time, though today fewer than half of TSS cases are linked to tampon use. The FDA says reported tampon-related TSS cases have dropped a lot over the years, and that if you can wear one tampon for up to 8 hours without changing it, the absorbency may be too high for you. Picking the lowest absorbency you need and changing it every 4 to 8 hours are the main ways to lower your risk.",
    "clinicalNoteSources": [
      {
        "url": "https://medlineplus.gov/ency/article/000653.htm",
        "label": "MedlinePlus (NIH): Toxic shock syndrome",
        "summary": "NIH patient page explaining that TSS is a medical emergency, that tampon use (especially highly absorbent tampons or long wear) is a risk factor, and that less than half of cases today are tampon-linked."
      },
      {
        "url": "https://www.fda.gov/forconsumers/consumerupdates/ucm612029.htm",
        "label": "FDA: The Facts on Tampons and How to Use Them Safely",
        "summary": "FDA consumer guidance on choosing the lowest absorbency, changing tampons every 4 to 8 hours, and recognizing TSS symptoms."
      }
    ],
    "warnings": [
      "Use the lowest absorbency tampon you need for your flow.",
      "Change each tampon every 4 to 8 hours, and never wear one for more than 8 hours at a time.",
      "Tampons are for one-time use only, so throw each one away after use.",
      "If you get a sudden fever, vomiting, diarrhea, dizziness, fainting, or a rash that looks like a sunburn during or soon after your period, stop using tampons and get medical help right away."
    ],
    "warningsSource": {
      "url": "https://www.fda.gov/forconsumers/consumerupdates/ucm612029.htm",
      "label": "FDA: The Facts on Tampons and How to Use Them Safely"
    }
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
    ],
    "scienceSources": [
      {
        "url": "https://pubmed.ncbi.nlm.nih.gov/38963987/",
        "label": "Shearston et al., Environment International (2024): Tampons as a source of exposure to metal(loid)s",
        "summary": "Tested 30 tampons from 14 brands and found metals such as lead and arsenic across product types, with no category (organic, store or name brand, US or EU) consistently lower; whether metals are absorbed through vaginal tissue was not tested."
      },
      {
        "url": "https://iro.uiowa.edu/esploro/outputs/journalArticle/Device-Associated-Menstrual-Toxic-Shock-Syndrome/9984066349902771",
        "label": "Schlievert and Davis, Clinical Microbiology Reviews (2020): Device-Associated Menstrual Toxic Shock Syndrome",
        "summary": "Peer-reviewed review linking tampon use to menstrual toxic shock syndrome, explaining why standard absorbency labeling exists, and noting that cases still occur."
      }
    ],
    "communityReview": "Reviewers often praise how comfortable these feel once inserted, the lack of applicator waste, and how compact they are to carry. Common complaints are finger insertion, which some people just don't like, a dry or scratchy feel for some users, and a minority who find absorbency lacking. Some recent reviewers also dislike a newer twist-off wrapper that is hard to open, especially with arthritic hands. A few longtime Ultra users say the redesigned version feels stiffer and less absorbent than before.",
    "communityReviewSources": [
      {
        "url": "https://www.target.com/p/-/A-14013693",
        "label": "Target: o.b. Applicator-Free Tampons Multipack reviews"
      },
      {
        "url": "https://www.target.com/p/-/A-13293258",
        "label": "Target: o.b. Original Super Plus reviews"
      },
      {
        "url": "https://walmart.com/ip/seort/14089583",
        "label": "Walmart: o.b. Tampons Multi-Pack reviews"
      }
    ],
    "clinicalNote": "Toxic shock syndrome (TSS) is a rare but life-threatening illness caused by a toxin made by certain bacteria. Tampons are a known risk factor, especially highly absorbent ones and ones left in for a long time, though today fewer than half of TSS cases are linked to tampon use. The FDA says reported tampon-related TSS cases have dropped a lot over the years, and that if you can wear one tampon for up to 8 hours without changing it, the absorbency may be too high for you. Picking the lowest absorbency you need and changing it every 4 to 8 hours are the main ways to lower your risk.",
    "clinicalNoteSources": [
      {
        "url": "https://medlineplus.gov/ency/article/000653.htm",
        "label": "MedlinePlus (NIH): Toxic shock syndrome",
        "summary": "NIH patient page explaining that TSS is a medical emergency, that tampon use (especially highly absorbent tampons or long wear) is a risk factor, and that less than half of cases today are tampon-linked."
      },
      {
        "url": "https://www.fda.gov/forconsumers/consumerupdates/ucm612029.htm",
        "label": "FDA: The Facts on Tampons and How to Use Them Safely",
        "summary": "FDA consumer guidance on choosing the lowest absorbency, changing tampons every 4 to 8 hours, and recognizing TSS symptoms."
      }
    ],
    "warnings": [
      "Use the lowest absorbency tampon you need for your flow.",
      "Change each tampon every 4 to 8 hours, and never wear one for more than 8 hours at a time.",
      "Tampons are for one-time use only, so throw each one away after use.",
      "If you get a sudden fever, vomiting, diarrhea, dizziness, fainting, or a rash that looks like a sunburn during or soon after your period, stop using tampons and get medical help right away."
    ],
    "warningsSource": {
      "url": "https://www.fda.gov/forconsumers/consumerupdates/ucm612029.htm",
      "label": "FDA: The Facts on Tampons and How to Use Them Safely"
    }
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
    "clinicalNote": "The FDA says to change a tampon every 4 to 8 hours and never wear one longer than 8. If a tampon lasts a full 8 hours without filling, the absorbency may be more than you need.",
    "scienceSources": [
      {
        "url": "https://pubmed.ncbi.nlm.nih.gov/38963987/",
        "label": "Shearston et al., Environment International (2024): Tampons as a source of exposure to metal(loid)s",
        "summary": "Tested 30 tampons from 14 brands and found metals such as lead and arsenic across product types, with no category (organic, store or name brand, US or EU) consistently lower; whether metals are absorbed through vaginal tissue was not tested."
      },
      {
        "url": "https://iro.uiowa.edu/esploro/outputs/journalArticle/Device-Associated-Menstrual-Toxic-Shock-Syndrome/9984066349902771",
        "label": "Schlievert and Davis, Clinical Microbiology Reviews (2020): Device-Associated Menstrual Toxic Shock Syndrome",
        "summary": "Peer-reviewed review linking tampon use to menstrual toxic shock syndrome, explaining why standard absorbency labeling exists, and noting that cases still occur."
      }
    ],
    "communityReview": "Reviewers on a German pharmacy site often say they barely feel the tampon once it's in and find the smooth surface easy to insert, including first-time users. Most treat Mini as a light-day or start-and-end-of-period size, and the main complaint is that it doesn't last on heavier days. One reviewer noticed loose fibers on the surface. Many of these reviews were posted during a promotion, and the site says it doesn't verify them.",
    "communityReviewSources": [
      {
        "url": "https://www.medpex.de/o-b-tampons-procomfort-mini/00723767/erfahrungen",
        "label": "medpex.de: o.b. ProComfort Mini customer reviews (German)"
      }
    ],
    "warnings": [
      "Use the lowest absorbency tampon you need for your flow.",
      "Change each tampon every 4 to 8 hours, and never wear one for more than 8 hours at a time.",
      "Tampons are for one-time use only, so throw each one away after use.",
      "If you get a sudden fever, vomiting, diarrhea, dizziness, fainting, or a rash that looks like a sunburn during or soon after your period, stop using tampons and get medical help right away."
    ],
    "warningsSource": {
      "url": "https://www.fda.gov/forconsumers/consumerupdates/ucm612029.htm",
      "label": "FDA: The Facts on Tampons and How to Use Them Safely"
    }
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
    "clinicalNote": "The FDA says to change a tampon every 4 to 8 hours and never wear one longer than 8. If a tampon lasts a full 8 hours without filling, the absorbency may be more than you need.",
    "scienceSources": [
      {
        "url": "https://pubmed.ncbi.nlm.nih.gov/38963987/",
        "label": "Shearston et al., Environment International (2024): Tampons as a source of exposure to metal(loid)s",
        "summary": "Tested 30 tampons from 14 brands and found metals such as lead and arsenic across product types, with no category (organic, store or name brand, US or EU) consistently lower; whether metals are absorbed through vaginal tissue was not tested."
      },
      {
        "url": "https://iro.uiowa.edu/esploro/outputs/journalArticle/Device-Associated-Menstrual-Toxic-Shock-Syndrome/9984066349902771",
        "label": "Schlievert and Davis, Clinical Microbiology Reviews (2020): Device-Associated Menstrual Toxic Shock Syndrome",
        "summary": "Peer-reviewed review linking tampon use to menstrual toxic shock syndrome, explaining why standard absorbency labeling exists, and noting that cases still occur."
      }
    ],
    "communityReview": "Reviewers on a German pharmacy site often say they barely feel the tampon once it's in and find the smooth surface easy to insert, including first-time users. Most treat Mini as a light-day or start-and-end-of-period size, and the main complaint is that it doesn't last on heavier days. One reviewer noticed loose fibers on the surface. Many of these reviews were posted during a promotion, and the site says it doesn't verify them.",
    "communityReviewSources": [
      {
        "url": "https://www.medpex.de/o-b-tampons-procomfort-mini/00723767/erfahrungen",
        "label": "medpex.de: o.b. ProComfort Mini customer reviews (German)"
      }
    ],
    "warnings": [
      "Use the lowest absorbency tampon you need for your flow.",
      "Change each tampon every 4 to 8 hours, and never wear one for more than 8 hours at a time.",
      "Tampons are for one-time use only, so throw each one away after use.",
      "If you get a sudden fever, vomiting, diarrhea, dizziness, fainting, or a rash that looks like a sunburn during or soon after your period, stop using tampons and get medical help right away."
    ],
    "warningsSource": {
      "url": "https://www.fda.gov/forconsumers/consumerupdates/ucm612029.htm",
      "label": "FDA: The Facts on Tampons and How to Use Them Safely"
    }
  },
  "p-poise-ultra-thin-moderate": {
    "whoItsFor": [
      "Women with moderate bladder leaks from stress or urge incontinence",
      "People in perimenopause or postpartum dealing with new bladder leaks",
      "Anyone using menstrual pads for urine who wants a pad built to absorb urine and control its odor",
      "Not the pick for period bleeding: it's designed for urine, not menstrual flow"
    ],
    "howToUse": {
      "intro": "Per Poise's label directions (as listed for Poise pads on Carewell):",
      "steps": [
        "Read the instructions in the pack before your first use.",
        "Press the pad sticky side down onto the inside of your underwear.",
        "Change it as needed.",
        "Don't wear one pad for longer than 12 hours."
      ],
      "sourceUrl": "https://www.carewell.com/product/poise-original-pads-maximum/",
      "sourceLabel": "Carewell: Poise Original Pads, Maximum (directions)"
    },
    "clinicalNote": "Stress incontinence means leaking urine when coughing, sneezing, laughing or exercise puts pressure on your bladder, and pregnancy, childbirth and menopause can all weaken the pelvic floor muscles that prevent it. Incontinence affects twice as many women as men. Pads like this are a way to stay protected while you work on treatments: pelvic floor (Kegel) exercises may help, especially for stress leaks, along with bladder training (peeing on a schedule) and cutting back on caffeine and alcohol. Treatments can take a month or more to work.",
    "clinicalNoteSources": [
      {
        "url": "https://www.niddk.nih.gov/health-information/urologic-diseases/bladder-control-problems/symptoms-causes",
        "label": "NIDDK (NIH): Symptoms and Causes of Bladder Control Problems",
        "summary": "Defines stress incontinence and lists pregnancy, childbirth and menopause among events that weaken pelvic floor muscles."
      },
      {
        "url": "https://www.niddk.nih.gov/health-information/urologic-diseases/bladder-control-problems/treatment",
        "label": "NIDDK (NIH): Treatments for Bladder Control Problems (Urinary Incontinence)",
        "summary": "Lists pads and absorbent underwear for managing leaks, plus pelvic floor exercises, bladder training and lifestyle changes to reduce them."
      },
      {
        "url": "https://womenshealth.gov/sites/default/files/documents/fact-sheet-urinary-incontinence.pdf",
        "label": "US Office on Women's Health: Urinary Incontinence fact sheet",
        "summary": "Says incontinence affects twice as many women as men and that pads can be used while working on other treatments."
      }
    ],
    "warnings": [
      "Pads manage leaks but don't treat them; NIDDK advises that you at least talk with your health care professional about bladder problems.",
      "Special skin cleaners and creams may help keep skin near the urethra from getting irritated by urine."
    ],
    "warningsSource": {
      "url": "https://www.niddk.nih.gov/health-information/urologic-diseases/bladder-control-problems/treatment",
      "label": "NIDDK (NIH): Treatments for Bladder Control Problems (Urinary Incontinence)"
    }
  },
  "p-always-discreet-boutique-liners": {
    "whoItsFor": [
      "Women with very light bladder leaks, like a small leak when you cough, sneeze or laugh",
      "Anyone using a menstrual panty liner for urine who wants one designed to absorb urine and control its odor",
      "People who want a thin, discreet option for occasional leaks",
      "Anyone whose leaks are frequent or getting worse, since a clinician can check for treatable pelvic floor causes"
    ],
    "clinicalSources": [
      {
        "url": "https://www.niddk.nih.gov/health-information/urologic-diseases/bladder-control-problems/treatment",
        "label": "NIDDK (NIH): Treatments for Bladder Control Problems (Urinary Incontinence)",
        "summary": "Lists disposable pads worn in your underwear as a way to manage leaks alongside pelvic floor exercises and bladder training, and says to talk with a health care professional if lifestyle changes don't help."
      }
    ],
    "communityReview": "No reviews specific to the Boutique version could be opened, so this reflects reviews of Always Discreet's standard very light long liners. Many reviewers say they are thin, comfortable, stick well and handle small leaks and odor without bulk. Common complaints are the added scent, which some found irritating or headache-inducing, liners slipping out of place, side leaks once damp, and a length that felt shorter than described.",
    "communityReviewSources": [
      {
        "url": "https://www.samsclub.com/reviews/product/3700052225?page=3",
        "label": "Sam's Club: Always Discreet Plus Incontinence Liners, Very Light Long reviews"
      },
      {
        "url": "https://www.walmart.com/ip/39878650",
        "label": "Walmart: Always Discreet Incontinence Liners, Very Light Long"
      }
    ],
    "clinicalNote": "Stress incontinence means leaking urine when coughing, sneezing, laughing or exercise puts pressure on your bladder, and pregnancy, childbirth and menopause can all weaken the pelvic floor muscles that prevent it. Incontinence affects twice as many women as men. A liner like this handles small leaks day to day, while pelvic floor (Kegel) exercises, bladder training (peeing on a schedule) and cutting back on caffeine and alcohol can reduce the leaks themselves.",
    "clinicalNoteSources": [
      {
        "url": "https://www.niddk.nih.gov/health-information/urologic-diseases/bladder-control-problems/symptoms-causes",
        "label": "NIDDK (NIH): Symptoms and Causes of Bladder Control Problems",
        "summary": "Defines stress incontinence and lists pregnancy, childbirth and menopause among events that weaken pelvic floor muscles."
      },
      {
        "url": "https://www.niddk.nih.gov/health-information/urologic-diseases/bladder-control-problems/treatment",
        "label": "NIDDK (NIH): Treatments for Bladder Control Problems (Urinary Incontinence)",
        "summary": "Lists pads and absorbent underwear for managing leaks, plus pelvic floor exercises, bladder training and lifestyle changes to reduce them."
      },
      {
        "url": "https://womenshealth.gov/sites/default/files/documents/fact-sheet-urinary-incontinence.pdf",
        "label": "US Office on Women's Health: Urinary Incontinence fact sheet",
        "summary": "Says incontinence affects twice as many women as men and that pads can be used while working on other treatments."
      }
    ],
    "warnings": [
      "Change your liner based on your own needs; there's no fixed schedule.",
      "For bladder problems, see your doctor for professional advice."
    ],
    "warningsSource": {
      "url": "https://canary.always.co.uk/en-gb/discreet/incontinence-advice/questions-and-answers-about-incontinence-in-women/incontinence-pads-and-liners/",
      "label": "Always Discreet (UK): Incontinence pads and liners Q&A"
    }
  },
  "p-depend-silhouette-underwear": {
    "whoItsFor": [
      "Women with moderate to heavy bladder leaks, where a liner alone isn't enough",
      "People who want pull-on protection that looks and feels closer to regular underwear than a pad",
      "Anyone whose leaks are frequent or getting worse, since a clinician can check for treatable pelvic floor causes"
    ],
    "howToUse": {
      "intro": "Per Depend's sizing chart and IUGA and MedlinePlus guidance on incontinence products:",
      "steps": [
        "Measure your waist and pick your size from Depend's chart: S 26 to 34 in, M 32 to 42 in, L 40 to 52 in, XL 50 to 60 in.",
        "Pull them on like regular underwear and check they sit snugly, since a loose fit lets urine escape.",
        "Change when the underwear is wet, and remove a soaked pair right away.",
        "Clean and dry your skin at each change with a gentle wash or incontinence wipe rather than baby wipes."
      ],
      "sourceUrl": "https://cm.depend.com/en-us/incontinence-products/women/silhouette-classic-underwear",
      "sourceLabel": "Depend Silhouette product page (sizing), with IUGA and MedlinePlus pad-care guidance"
    },
    "clinicalSources": [
      {
        "url": "https://medlineplus.gov/ency/article/003973.htm",
        "label": "MedlinePlus (NIH): Urinary incontinence products",
        "summary": "Describes pads, pull-on and reusable underwear for leaks, advises a snug fit for disposables, and says to remove soaked products right away and clean and dry the skin to prevent breakdown."
      },
      {
        "url": "https://www.yourpelvicfloor.org/media/Continence_Pads_and_Perineal_Care-new-1.pdf",
        "label": "IUGA: Continence Pads and Perineal Care, A Guide for Women",
        "summary": "Explains that menstrual pads are made for blood, not urine, and recommends dedicated continence products chosen by leak volume, worn snugly, changed by wetness, with gentle pH-balanced skin cleansing."
      },
      {
        "url": "https://www.cochrane.org/zh-hant/about-us/news/featured-review-pelvic-floor-muscle-training-versus-no-treatment-or-inactive-control-treatmen-0",
        "label": "Cochrane featured review (2018): Pelvic floor muscle training for urinary incontinence in women",
        "summary": "Concludes with confidence that pelvic floor muscle training can cure or improve stress and other types of urinary incontinence and could be part of first-line care."
      }
    ],
    "communityReview": "Reviewers often say these hold up overnight and during activity, feel close to regular underwear, and are hard to spot under clothes, especially the black version. Common complaints are a pad area that feels too short or narrow, waistbands that dig in or irritate skin, and reports that newer packs leak more than older ones. Fit for larger bodies is another recurring sticking point.",
    "communityReviewSources": [
      {
        "url": "https://www.target.com/p/depend-silhouette-women-s-small-postpartum-incontinence-disposable-underwear/-/A-94947533",
        "label": "Target: Depend Silhouette Maximum Absorbency reviews"
      },
      {
        "url": "https://www.walmart.com/ip/960731633",
        "label": "Walmart: Depend Silhouette for Women reviews"
      }
    ],
    "clinicalNote": "Absorbent products catch leaks but don't treat what causes them. NIH says pelvic floor muscle exercises (squeezing the muscles that hold in urine) lead to fewer leaks per day, and bladder training (peeing on a set schedule) and losing weight can also help. UK guidance from NICE says pads and absorbent underwear are best used as a short-term way to cope, or long term only if treatment hasn't worked. If your skin gets irritated, NIH notes that special skin cleaners and creams can help protect it.",
    "clinicalNoteSources": [
      {
        "url": "https://www.niddk.nih.gov/health-information/urologic-diseases/bladder-control-problems/treatment",
        "label": "NIDDK (NIH): Treatments for Bladder Control Problems (Urinary Incontinence)",
        "summary": "NIH overview of bladder control treatments, including pelvic floor exercises, bladder training, weight loss, absorbent products, and skin care."
      },
      {
        "url": "https://www.nice.org.uk/guidance/QS77/chapter/quality-statement-3-containment-products",
        "label": "NICE Quality Standard QS77: Containment products",
        "summary": "UK national guidance that containment products should be a temporary coping strategy, or long-term management only if treatment is unsuccessful."
      }
    ],
    "warnings": [
      "Bladder leaks may be caused by a condition that can be treated, so the label says to see your doctor for advice.",
      "Keep the plastic bag away from babies and children to avoid the risk of suffocation.",
      "Like most clothing, this underwear can burn if exposed to a flame.",
      "Do not flush."
    ],
    "warningsSource": {
      "url": "https://stopandshop.com/groceries/product/depend-womens-silhouette-incontinence-underwear-maximum-l-20-ct-pkg/329225",
      "label": "Depend Silhouette Maximum label text (as listed on Stop & Shop product page)"
    }
  },
  "p-tena-intimates-very-light-liner": {
    "whoItsFor": [
      "Women with occasional, very light bladder leaks",
      "People in or after perimenopause noticing small leaks",
      "Anyone using a menstrual liner for urine who wants one designed to lock away urine odor"
    ],
    "howToUse": {
      "intro": "TENA's product page has no step-by-step directions, so these follow IUGA and MedlinePlus guidance on continence pads:",
      "steps": [
        "Use a bladder-leak liner for urine rather than a menstrual pad or liner.",
        "Place it in close-fitting regular underwear so it sits snugly against your body.",
        "Change it when it feels wet rather than after every small drip, since changing too often can dry out your skin.",
        "Clean your skin at each change with a gentle wash or incontinence wipe rather than baby wipes.",
        "Move up to a more absorbent pad if your leaks outgrow a very light liner."
      ],
      "sourceUrl": "https://www.yourpelvicfloor.org/media/Continence_Pads_and_Perineal_Care-new-1.pdf",
      "sourceLabel": "IUGA: Continence Pads and Perineal Care, A Guide for Women"
    },
    "clinicalSources": [
      {
        "url": "https://www.yourpelvicfloor.org/media/Continence_Pads_and_Perineal_Care-new-1.pdf",
        "label": "IUGA: Continence Pads and Perineal Care, A Guide for Women",
        "summary": "Explains that menstrual pads are made for blood, not urine, and recommends dedicated continence products chosen by leak volume, worn snugly, changed by wetness, with gentle pH-balanced skin cleansing."
      },
      {
        "url": "https://medlineplus.gov/ency/article/003973.htm",
        "label": "MedlinePlus (NIH): Urinary incontinence products",
        "summary": "Describes pads, pull-on and reusable underwear for leaks, advises a snug fit for disposables, and says to remove soaked products right away and clean and dry the skin to prevent breakdown."
      },
      {
        "url": "https://www.cochrane.org/zh-hant/about-us/news/featured-review-pelvic-floor-muscle-training-versus-no-treatment-or-inactive-control-treatmen-0",
        "label": "Cochrane featured review (2018): Pelvic floor muscle training for urinary incontinence in women",
        "summary": "Concludes with confidence that pelvic floor muscle training can cure or improve stress and other types of urinary incontinence and could be part of first-line care."
      }
    ],
    "communityReview": "Reviewers often say this liner handles light drips without noticeable urine smell, stays in place, and feels gentle on sensitive skin. The main limit people mention is capacity: it works for small leaks but not bigger ones. A real share of ratings are negative, though the visible reviews don't point to one common complaint.",
    "communityReviewSources": [
      {
        "url": "https://www.walmart.com/ip/796765417",
        "label": "Walmart: TENA Sensitive Care Extra Coverage Very Light Liner reviews"
      }
    ],
    "clinicalNote": "Absorbent products catch leaks but don't treat what causes them. NIH says pelvic floor muscle exercises (squeezing the muscles that hold in urine) lead to fewer leaks per day, and bladder training (peeing on a set schedule) and losing weight can also help. UK guidance from NICE says pads and absorbent underwear are best used as a short-term way to cope, or long term only if treatment hasn't worked. If your skin gets irritated, NIH notes that special skin cleaners and creams can help protect it.",
    "clinicalNoteSources": [
      {
        "url": "https://www.niddk.nih.gov/health-information/urologic-diseases/bladder-control-problems/treatment",
        "label": "NIDDK (NIH): Treatments for Bladder Control Problems (Urinary Incontinence)",
        "summary": "NIH overview of bladder control treatments, including pelvic floor exercises, bladder training, weight loss, absorbent products, and skin care."
      },
      {
        "url": "https://www.nice.org.uk/guidance/QS77/chapter/quality-statement-3-containment-products",
        "label": "NICE Quality Standard QS77: Containment products",
        "summary": "UK national guidance that containment products should be a temporary coping strategy, or long-term management only if treatment is unsuccessful."
      }
    ]
  },
  "p-lim-method-shoe-covers": {
    "whoItsFor": [
      "People already doing LiM Method sessions with the LiM Sliding Board",
      "Anyone who needs their feet to glide on the board during LiM movements",
      "Not the pick as a pelvic floor treatment on its own: it's an accessory for the LiM exercise system"
    ],
    "clinicalNote": "These shoe covers are an add-on for LiM Method exercise sessions, not a treatment by themselves. The bigger clinical picture is pelvic floor muscle training: a Cochrane review found it can cure or improve symptoms of stress incontinence (leaking when you cough, sneeze or lift) and other types of bladder leakage, with rare side effects. That evidence is for supervised pelvic floor training in general, not for this product or the LiM program specifically. Cleveland Clinic notes pelvic floor muscles can become weak, but also tight or spastic, which is why pelvic floor physical therapists often use relaxation and breathing work, not only strengthening.",
    "clinicalNoteSources": [
      {
        "url": "https://www.cochrane.org/ja/about-us/news/featured-review-pelvic-floor-muscle-training-versus-no-treatment-or-inactive-control-treatmen-0",
        "label": "Cochrane: Pelvic floor muscle training versus no treatment for urinary incontinence in women",
        "summary": "Cochrane review concluding pelvic floor muscle training can cure or improve stress and other types of urinary incontinence in women, with rare side effects."
      },
      {
        "url": "https://my.clevelandclinic.org/departments/rehabilitation/services/pelvic-health",
        "label": "Cleveland Clinic: Pelvic Health Physical Therapy",
        "summary": "Explains that pelvic floor muscles may become weak, tight or spastic, and that therapy can include strengthening, relaxation techniques, diaphragmatic breathing and a home exercise program."
      }
    ]
  },
  "p-lim-method-kneeling-pad": {
    "whoItsFor": [
      "People doing LiM Method sessions who want extra cushioning in low-to-the-ground positions",
      "Anyone whose knees get sore kneeling on a hard floor during exercise",
      "Not the pick as a pelvic floor treatment on its own: it's a cushioning accessory"
    ],
    "clinicalNote": "This kneeling pad is a comfort accessory for LiM Method exercise sessions, not a treatment by itself. The bigger clinical picture is pelvic floor muscle training: a Cochrane review found it can cure or improve symptoms of stress incontinence (leaking when you cough, sneeze or lift) and other types of bladder leakage, with rare side effects. That evidence is for supervised pelvic floor training in general, not for this product or the LiM program specifically. Cleveland Clinic notes pelvic floor muscles can become weak, but also tight or spastic, which is why pelvic floor physical therapists often use relaxation and breathing work, not only strengthening.",
    "clinicalNoteSources": [
      {
        "url": "https://www.cochrane.org/ja/about-us/news/featured-review-pelvic-floor-muscle-training-versus-no-treatment-or-inactive-control-treatmen-0",
        "label": "Cochrane: Pelvic floor muscle training versus no treatment for urinary incontinence in women",
        "summary": "Cochrane review concluding pelvic floor muscle training can cure or improve stress and other types of urinary incontinence in women, with rare side effects."
      },
      {
        "url": "https://my.clevelandclinic.org/departments/rehabilitation/services/pelvic-health",
        "label": "Cleveland Clinic: Pelvic Health Physical Therapy",
        "summary": "Explains that pelvic floor muscles may become weak, tight or spastic, and that therapy can include strengthening, relaxation techniques, diaphragmatic breathing and a home exercise program."
      }
    ]
  },
  "p-magnesium-glycinate": {
    "whoItsFor": [
      "Adults who want a daily magnesium supplement for general muscle, nerve, heart and bone support, which is how Nature Made describes it",
      "People curious about magnesium for period cramps or PMS who understand the research is small and mostly older studies",
      "Anyone who wants a moderate dose: 200 mg per serving stays under the 350 mg daily upper limit NIH sets for supplemental magnesium",
      "Not the pick without talking to your doctor if you have kidney disease or take bisphosphonates, certain antibiotics, diuretics or long-term acid reducers, which NIH says can interact with magnesium"
    ],
    "clinicalSources": [
      {
        "url": "https://ods.od.nih.gov/factsheets/magnesium-healthprofessional/",
        "label": "NIH Office of Dietary Supplements: Magnesium fact sheet",
        "summary": "Sets the adult upper limit for supplemental magnesium at 350 mg a day, notes diarrhea and cramping as common side effects at high doses, and lists interactions with bisphosphonates, some antibiotics, diuretics and long-term proton pump inhibitors, plus higher risk with kidney disease."
      }
    ],
    "scienceSources": [
      {
        "url": "https://pubmed.ncbi.nlm.nih.gov/28392498/",
        "label": "Parazzini et al., Magnesium Research (2017): Magnesium in the gynaecological practice, a literature review",
        "summary": "This review concludes oral magnesium may help prevent period cramps, PMS and menstrual migraine, while noting how it works has not been studied much."
      },
      {
        "url": "https://ods.od.nih.gov/pdf/factsheets/magnesium-consumer.pdf",
        "label": "NIH ODS: Magnesium Fact Sheet for Consumers",
        "summary": "NIH says adult women need about 310 to 320 mg of magnesium a day from all sources, and the upper limit from supplements is 350 mg a day."
      }
    ],
    "ingredientScience": [
      {
        "name": "Magnesium (as magnesium bisglycinate)",
        "text": "Magnesium is a mineral your body uses in more than 300 enzyme systems, including the ones behind nerve signals, muscle contraction and a normal heart rhythm. Supplement evidence is mixed and condition-specific: small trials found modest drops in migraine frequency, while evidence for blood pressure and blood sugar is weak or inconclusive. The NIH fact sheet does not cover period cramps or the glycinate form specifically, though it notes forms that dissolve well tend to be absorbed better than magnesium oxide.",
        "citations": [
          {
            "url": "https://ods.od.nih.gov/factsheets/Magnesium-healthProfessional/",
            "label": "NIH Office of Dietary Supplements: Magnesium fact sheet for health professionals"
          }
        ]
      }
    ],
    "clinicalNote": "Most adult women need about 310 to 320 mg of magnesium a day from all sources, and a lot of that can come from food. One two-capsule serving here gives 200 mg, which is under the 350 mg daily upper limit that NIH sets for magnesium from supplements and medicines. Too much supplemental magnesium usually shows up as diarrhea, sometimes with nausea and stomach cramps. People with kidney problems are at higher risk of magnesium building up, because their kidneys can't clear the extra.",
    "clinicalNoteSources": [
      {
        "url": "https://ods.od.nih.gov/factsheets/Magnesium-healthProfessional/",
        "label": "NIH Office of Dietary Supplements: Magnesium fact sheet for health professionals",
        "summary": "Gives recommended intakes, the 350 mg upper limit for supplemental magnesium, side effects of excess, and drug interactions."
      }
    ],
    "warnings": [
      "Don't take more than 350 mg a day of magnesium from supplements and medicines combined unless a clinician tells you to; high doses often cause diarrhea.",
      "The risk of magnesium toxicity goes up if your kidneys don't work well.",
      "Take tetracycline or quinolone antibiotics at least 2 hours before or 4 to 6 hours after magnesium.",
      "Space magnesium at least 2 hours apart from oral bisphosphonates for bone loss, such as alendronate."
    ],
    "warningsSource": {
      "url": "https://ods.od.nih.gov/factsheets/Magnesium-healthProfessional/",
      "label": "NIH Office of Dietary Supplements: Magnesium fact sheet for health professionals"
    }
  },
  "p-ubiquinol-thorne": {
    "whoItsFor": [
      "Adults who want a CoQ10 supplement in the ubiquinol form, which Thorne markets for cellular energy and heart health",
      "People preparing for IVF who have discussed CoQ10 with their fertility doctor, knowing the trials so far are small",
      "Athletes who want a supplement that is NSF Certified for Sport",
      "Not the pick without checking with your doctor if you take warfarin or insulin, which NIH says CoQ10 may interact with, or if you're vegetarian, since the softgel is bovine gelatin"
    ],
    "howToUse": {
      "intro": "Per Thorne's label directions:",
      "steps": [
        "Take 1 softgel one to two times a day, or as your health care practitioner recommends.",
        "Take it with a meal, since CoQ10 is fat-soluble.",
        "If you're pregnant, check with your health care practitioner before using it.",
        "Keep the bottle tightly sealed in a cool, dry place."
      ],
      "sourceUrl": "https://www.vitacost.com/products/thorne-ubiquinol-100-mg-60-softgels-161877",
      "sourceLabel": "Thorne Ubiquinol label directions (Vitacost listing)"
    },
    "clinicalSources": [
      {
        "url": "https://www.nccih.nih.gov/health/coenzyme-q10?nav=govd",
        "label": "NIH National Center for Complementary and Integrative Health: Coenzyme Q10",
        "summary": "No serious side effects of CoQ10 have been reported, mild stomach upset or sleep problems can happen, and it may interact with warfarin and insulin."
      }
    ],
    "scienceSources": [
      {
        "url": "https://pubmed.ncbi.nlm.nih.gov/29587861/",
        "label": "Xu et al., Reproductive Biology and Endocrinology (2018): CoQ10 pretreatment in young women with low ovarian reserve",
        "summary": "In an open-label trial of women under 35 with low ovarian reserve, 600 mg a day of CoQ10 for 60 days before IVF led to more eggs retrieved and more good-quality embryos, but the rise in live births was not statistically significant."
      }
    ],
    "ingredientScience": [
      {
        "name": "Ubiquinol (CoQ10)",
        "text": "Ubiquinol is the reduced form of coenzyme Q10, a compound your cells use to make energy. A 2020 review of 5 small trials in 449 women going through IVF or similar treatment found CoQ10 was linked to more clinical pregnancies (a pregnancy confirmed on ultrasound), about 29% versus 14%, but it did not change live birth or miscarriage rates. That's a small evidence base, and the trials did not test this product.",
        "citations": [
          {
            "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC7550497/",
            "label": "J Assist Reprod Genet (2020): CoQ10 supplementation and fertility outcomes in women undergoing ART, systematic review and meta-analysis"
          }
        ]
      }
    ],
    "clinicalNote": "CoQ10 has been tested for many conditions, and for most of them the NIH's complementary health center calls the research inconclusive or too limited to draw conclusions. For fertility, the clearest data come from women having IVF or similar treatment, where a 2020 review of 5 trials found a higher clinical pregnancy rate but no difference in live births. No serious side effects have been reported, though mild sleep trouble or stomach upset can happen.",
    "clinicalNoteSources": [
      {
        "url": "https://www.nccih.nih.gov/health/coenzyme-q10?nav=govd",
        "label": "NCCIH (NIH): Coenzyme Q10",
        "summary": "Summarizes CoQ10 research as mostly inconclusive or limited, notes no serious side effects reported, and flags interactions with warfarin and insulin."
      },
      {
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC7550497/",
        "label": "J Assist Reprod Genet (2020): CoQ10 and fertility outcomes in ART, meta-analysis of 5 RCTs",
        "summary": "In 449 infertile women, oral CoQ10 was linked to higher clinical pregnancy rates but no change in live birth or miscarriage."
      }
    ],
    "warnings": [
      "CoQ10 may interact with the blood thinner warfarin.",
      "CoQ10 may interact with insulin.",
      "CoQ10 may not be compatible with some types of cancer treatment.",
      "Mild side effects such as trouble sleeping or digestive upset may occur."
    ],
    "warningsSource": {
      "url": "https://www.nccih.nih.gov/health/coenzyme-q10?nav=govd",
      "label": "NCCIH (NIH): Coenzyme Q10"
    }
  },
  "d-clue": {
    "whoItsFor": [
      "Anyone who menstruates and wants period and ovulation predictions based on their own cycle length and flow",
      "People who want to track symptoms in detail, since Clue lets you log over 200 symptoms and experiences",
      "Those moving through life stages, with modes for trying to conceive, pregnancy and perimenopause",
      "Not the pick as birth control: Clue says the app should not be used as a contraceptive"
    ],
    "howToUse": {
      "intro": "Per Clue's help center and App Store listing:",
      "steps": [
        "Download Clue from the App Store or Google Play and create an account.",
        "Open Track, or switch to Calendar view, and select the day your period started.",
        "In the Period category, pick your flow level for that day, then move to each following day and repeat.",
        "Tap Save to store your period dates.",
        "Log symptoms, moods and other experiences as they come up so predictions and charts get more personal.",
        "Switch modes if you're trying to conceive, pregnant or in perimenopause, and upgrade to Clue Plus only if you want deeper analysis."
      ],
      "sourceUrl": "https://support.helloclue.com/hc/en-us/articles/215935063-How-do-I-track-my-period",
      "sourceLabel": "Clue Help Center: How do I track my period?"
    },
    "clinicalSources": [
      {
        "url": "https://pubmed.ncbi.nlm.nih.gov/26595586/",
        "label": "ACOG Committee Opinion No. 651: Menstruation in Girls and Adolescents, Using the Menstrual Cycle as a Vital Sign",
        "summary": "ACOG calls the menstrual cycle a vital sign and asks clinicians to teach patients what a normal cycle looks like, since spotting abnormal patterns early can flag health problems."
      }
    ],
    "clinicalNote": "Period apps like Clue predict your next period from the cycles you've logged, so predictions get better the more cycles you track and are less reliable if your cycles vary a lot. Clue's data has been used in peer-reviewed research: a 2020 study of more than 378,000 users and 4.9 million cycles found links between how much a person's cycle varies and the symptoms they log. A tracker is a log, not a diagnosis, so it's useful to bring your history to a clinician if something seems off.",
    "clinicalNoteSources": [
      {
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC7250828/",
        "label": "npj Digital Medicine (2020): Characterizing physiological and symptomatic variation in menstrual cycles using self-tracked mobile-health data",
        "summary": "Used Clue app data from over 378,000 users and 4.9 million cycles to link cycle variability with tracked symptoms."
      }
    ],
    "effectiveness": "No independent study measuring how accurately Clue itself predicts periods was found. For the product type, a 2016 Obstetrics and Gynecology study found most free menstrual tracking apps were inaccurate: only 20 of 108 met basic accuracy criteria, such as basing predictions on at least 3 past cycles. Clue was not named in that study, and apps have changed a lot since 2016.",
    "effectivenessSources": [
      {
        "url": "https://scholars.mssm.edu/en/publications/evaluation-of-smartphone-menstrual-cycle-tracking-applications-us-3/",
        "label": "Obstetrics and Gynecology (2016): Evaluation of smartphone menstrual cycle tracking applications",
        "summary": "Of 108 free period-tracking apps reviewed, only 20 met accuracy criteria; the authors concluded most were inaccurate."
      }
    ],
    "warnings": [
      "HIPAA, the US health privacy law, usually doesn't protect data you enter into an app for personal use.",
      "Avoid giving the app access to your phone's location unless you need it.",
      "Check the app maker's help pages to learn how to delete your stored data."
    ],
    "warningsSource": {
      "url": "https://www.hhs.gov/hipaa/for-professionals/privacy/guidance/cell-phone-hipaa/index.html",
      "label": "HHS: Protecting the privacy and security of your health information when using your personal cell phone or tablet"
    }
  },
  "d-stardust": {
    "whoItsFor": [
      "People who want period, ovulation and fertility predictions alongside astrology and moon-phase content",
      "Those who like a social angle, since Stardust lets you sync cycles with friends or invite a partner",
      "Pregnant users who want weekly updates, through the app's Pregnancy Mode",
      "Not the pick if data privacy is your top concern: Mozilla Foundation's July 2026 privacy review scored it 2 out of 10 and found health data sent to an analytics service by default, and Stardust says the app should not be used for contraception"
    ],
    "howToUse": {
      "intro": "Per Stardust's App Store listing:",
      "steps": [
        "Download Stardust from the App Store.",
        "Log your period, then add symptoms, moods and cravings as they come up to get period, ovulation and fertility predictions.",
        "Check the moon calendar and monthly Cycle Recap if you want those extras.",
        "Turn on Pregnancy Mode if you're pregnant.",
        "Sync with friends or invite a partner only if you want to share your cycle.",
        "Don't rely on it for birth control, and review the privacy policy before logging sensitive details."
      ],
      "sourceUrl": "https://apps.apple.com/ci/app/stardust-cycle-tracker/id1495829322",
      "sourceLabel": "Stardust Cycle Tracker on the App Store"
    },
    "clinicalSources": [
      {
        "url": "https://pubmed.ncbi.nlm.nih.gov/26595586/",
        "label": "ACOG Committee Opinion No. 651: Menstruation in Girls and Adolescents, Using the Menstrual Cycle as a Vital Sign",
        "summary": "ACOG calls the menstrual cycle a vital sign and asks clinicians to teach patients what a normal cycle looks like, since spotting abnormal patterns early can flag health problems."
      }
    ],
    "clinicalNote": "Stardust predicts periods from the cycles you log, like other trackers, and adds moon-phase features. The science on moon and menstrual cycles is unsettled: a 2021 Science Advances study of long-term records found some women's cycles lined up with the moon only now and then, and that this faded with age and exposure to artificial light at night. Because period data is sensitive, the FTC suggests comparing apps' privacy notices and picking the more protective settings, since defaults often lean toward sharing.",
    "clinicalNoteSources": [
      {
        "url": "https://ri.conicet.gov.ar/handle/11336/163998",
        "label": "Science Advances (2021): Women temporarily synchronize their menstrual cycles with the luminance and gravimetric cycles of the Moon",
        "summary": "Long-term records showed cycles over 27 days were only intermittently in sync with lunar cycles, and lost this with age and night-time artificial light."
      },
      {
        "url": "https://consumer.ftc.gov/consumer-alerts/2021/01/does-your-health-app-protect-your-sensitive-info",
        "label": "FTC Consumer Alert (2021): Does your health app protect your sensitive info?",
        "summary": "After a settlement with period app Flo over sharing health data, the FTC gives tips for choosing and setting up health apps."
      }
    ],
    "effectiveness": "No independent study of Stardust's predictions was found. For the product type, a 2016 Obstetrics and Gynecology study found only 20 of 108 free period-tracking apps met basic accuracy criteria. Stardust was not named, and apps have changed since then.",
    "effectivenessSources": [
      {
        "url": "https://scholars.mssm.edu/en/publications/evaluation-of-smartphone-menstrual-cycle-tracking-applications-us-3/",
        "label": "Obstetrics and Gynecology (2016): Evaluation of smartphone menstrual cycle tracking applications",
        "summary": "Of 108 free period-tracking apps reviewed, only 20 met accuracy criteria; the authors concluded most were inaccurate."
      }
    ],
    "warnings": [
      "Compare privacy notices and look for one that plainly says what health data is collected, how it's used and who it's shared with.",
      "Review the app's settings, since defaults often lean toward sharing.",
      "Keep the app and your phone's operating system updated to fix privacy and security problems."
    ],
    "warningsSource": {
      "url": "https://consumer.ftc.gov/consumer-alerts/2021/01/does-your-health-app-protect-your-sensitive-info",
      "label": "FTC Consumer Alert: Does your health app protect your sensitive info?"
    }
  },
  "d-balance-menopause": {
    "whoItsFor": [
      "Anyone in perimenopause or menopause who wants to track symptoms like sleep, mood and periods in one place",
      "People who want a symptom report to bring to their doctor, since Balance lets you download a Health Report to share",
      "Those who want free, evidence-based menopause reading, with optional paid live sessions and videos",
      "Not the pick if you want a fully private log: Healthify NZ's review notes other users can see profiles and symptoms in the community, and tracking sticks to preset categories with no free-text notes"
    ],
    "howToUse": {
      "intro": "Per Balance's own site and Healthify NZ's app review:",
      "steps": [
        "Download Balance from the App Store or Google Play and create a login.",
        "Log your symptoms, periods, sleep, mood, exercise and nutrition as you go.",
        "Fill in the symptom questionnaire when the app reminds you, about every 3 months.",
        "Check your 1, 3 or 6 month symptom graphs to spot patterns.",
        "Download your Health Report and share it with your doctor or nurse.",
        "Review the privacy settings, including the option to opt out of data sharing, before posting in the community."
      ],
      "sourceUrl": "https://healthify.nz/apps/b/balance-app",
      "sourceLabel": "Healthify NZ: Balance, Menopause Support app review"
    },
    "warnings": [
      "HIPAA, the US health privacy law, usually doesn't protect data you enter into an app for personal use.",
      "Avoid giving the app access to your phone's location unless you need it.",
      "Check the app maker's help pages to learn how to delete your stored data."
    ],
    "warningsSource": {
      "url": "https://www.hhs.gov/hipaa/for-professionals/privacy/guidance/cell-phone-hipaa/index.html",
      "label": "HHS: Protecting the privacy and security of your health information when using your personal cell phone or tablet"
    },
    "effectiveness": "No published study testing whether using Balance improves menopause symptoms or care was found. A 2023 clinician review for Healthify NZ found the free education content largely evidence-based, but said the app's suggested Experiments, including some supplements, rest on low-level evidence and may cost money for little benefit.",
    "effectivenessSources": []
  },
  "p-uqora-control": {
    "scienceSources": [
      {
        "url": "https://www.cochrane.org/evidence/CD013608_d-mannose-sugar-tablets-preventing-or-treating-urinary-tract-infections-adults-and-children",
        "label": "Cochrane review (2022): D-mannose for preventing and treating urinary tract infections",
        "summary": "Across 7 small trials with 719 people, the evidence was very low certainty and not enough to know whether D-mannose prevents or treats UTIs; side effects were few, mainly diarrhea."
      },
      {
        "url": "https://urology.wisc.edu/wp-content/uploads/2024/05/D-Mannose-for-Prevention-of-Recurrent-Urinary-Tract-Infection-Among-Women.pdf",
        "label": "Hayward et al., JAMA Internal Medicine (2024): D-mannose for prevention of recurrent UTI among women",
        "summary": "In a double-blind trial of 598 women with recurrent UTIs, about 2 g of D-mannose a day for 6 months did not significantly reduce UTIs compared with placebo (51% vs 56%), and the authors advised against recommending it for prevention."
      }
    ],
    "ingredientScience": [
      {
        "name": "D-mannose",
        "text": "D-mannose is a simple sugar that is thought to stop E. coli bacteria from sticking to the bladder wall. The biggest trial so far, published in JAMA Internal Medicine in 2024, gave 598 women with recurrent UTIs 2 g a day or a placebo for 6 months, and found no meaningful difference: about 51% versus 56% needed care for a suspected UTI. So the evidence that it prevents UTIs is weak.",
        "citations": [
          {
            "url": "https://urology.wisc.edu/wp-content/uploads/2024/05/D-Mannose-for-Prevention-of-Recurrent-Urinary-Tract-Infection-Among-Women.pdf",
            "label": "JAMA Internal Medicine (2024): D-mannose for prevention of recurrent urinary tract infection among women, randomized clinical trial"
          }
        ]
      },
      {
        "name": "Hibiscus extract",
        "text": "Hibiscus (Hibiscus sabdariffa) is a plant extract added to some urinary health blends. The only human study found was a small 2019 study of 100 women who took a mix of D-mannose, hibiscus and a probiotic after a bladder test, and 13 got a urinary infection; there was no comparison group and hibiscus was never tested on its own, so the evidence for it is very weak.",
        "citations": [
          {
            "url": "https://pubmed.ncbi.nlm.nih.gov/30208764/",
            "label": "Urologia (2019): D-mannose, Hibiscus sabdariffa and Lactobacillus plantarum to prevent infection after urodynamic study"
          }
        ]
      }
    ]
  },
  "p-d-mannose-now": {
    "whoItsFor": [
      "Adults who want an inexpensive, single-ingredient D-mannose capsule for urinary tract support",
      "People with recurrent UTIs who have talked with their clinician and want to try D-mannose, knowing the best recent trial found no clear benefit over placebo",
      "Anyone who wants a vegetarian capsule free of common allergens like gluten, soy and dairy",
      "Not the pick for treating an active UTI, which needs a clinician and often antibiotics, and not for children, since NOW labels it for adults only"
    ],
    "howToUse": {
      "intro": "Per NOW's label directions:",
      "steps": [
        "Take 3 capsules, 1 to 3 times a day.",
        "Take them with water or unsweetened juice, like unsweetened cranberry juice.",
        "Use it only if you're an adult, and keep it out of reach of children.",
        "Check with your doctor if you're pregnant, breastfeeding, take other medicines or have a medical condition.",
        "Store the bottle in a cool, dry place after opening."
      ],
      "sourceUrl": "https://nowfoods.com/supplements/d-mannose-500-mg-veg-capsules",
      "sourceLabel": "NOW Foods: D-Mannose 500 mg Veg Capsules"
    },
    "scienceSources": [
      {
        "url": "https://www.cochrane.org/evidence/CD013608_d-mannose-sugar-tablets-preventing-or-treating-urinary-tract-infections-adults-and-children",
        "label": "Cochrane review (2022): D-mannose for preventing and treating urinary tract infections",
        "summary": "Across 7 small trials with 719 people, the evidence was very low certainty and not enough to know whether D-mannose prevents or treats UTIs; side effects were few, mainly diarrhea."
      },
      {
        "url": "https://urology.wisc.edu/wp-content/uploads/2024/05/D-Mannose-for-Prevention-of-Recurrent-Urinary-Tract-Infection-Among-Women.pdf",
        "label": "Hayward et al., JAMA Internal Medicine (2024): D-mannose for prevention of recurrent UTI among women",
        "summary": "In a double-blind trial of 598 women with recurrent UTIs, about 2 g of D-mannose a day for 6 months did not significantly reduce UTIs compared with placebo (51% vs 56%), and the authors advised against recommending it for prevention."
      }
    ],
    "warnings": [
      "For adults only.",
      "Ask a doctor before use if you are pregnant or nursing, take medication, or have a medical condition.",
      "Keep out of reach of children."
    ],
    "warningsSource": {
      "url": "https://www.vitacost.com/now-foods-d-mannose-500-mg-240-veg-capsules",
      "label": "NOW Foods D-Mannose 500 mg capsules, label copy on Vitacost"
    }
  },
  "p-cystex": {
    "whoItsFor": [
      "Adults and teens 12 and up who want short-term relief from UTI burning, urgency and frequency while they wait to see a clinician",
      "People who want an over-the-counter option that pairs a pain reliever with methenamine, which the label says may help slow a bladder infection",
      "Not the pick as a stand-in for care: the label says to check with a doctor in case you need a prescription antibiotic, and not to use it more than 3 days unless directed",
      "Not the pick if you're allergic to aspirin, pregnant (unless your doctor says so), have stomach ulcers or bleeding, heart disease, high blood pressure or liver disease, or for a child or teen with flu symptoms or chickenpox"
    ],
    "howToUse": {
      "intro": "Per Cystex's Drug Facts label:",
      "steps": [
        "If you're 12 or older, take 2 tablets with a full glass of water 3 times a day.",
        "Drink plenty of fluids while you take it.",
        "Don't use it for more than 3 days unless a doctor tells you to, and call your doctor if symptoms don't improve.",
        "Ask a doctor before giving it to a child under 12.",
        "Stop and call your doctor if you get ringing in the ears, feel light-headed, have new stomach pain, or see bloody or tarry stools."
      ],
      "sourceUrl": "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=ac0f9a8c-164a-4908-8b1d-bb714a82550d",
      "sourceLabel": "DailyMed (NLM): Cystex (methenamine, sodium salicylate) Drug Facts label"
    },
    "scienceSources": [
      {
        "url": "https://apps-eprint4-l.ncl.ac.uk/281984",
        "label": "Harding et al., Health Technology Assessment (2022): The ALTAR trial, methenamine hippurate vs antibiotic prophylaxis for recurrent UTIs in women",
        "summary": "In 240 women with recurrent UTIs, daily prescription methenamine hippurate (1 g twice a day) prevented UTIs nearly as well as low-dose antibiotics over 12 months; note this is a different form and much higher dose of methenamine than Cystex, which is meant for short-term symptom relief."
      }
    ],
    "ingredientScience": [
      {
        "name": "Methenamine",
        "text": "Methenamine only works once it turns into formaldehyde, and that happens in acidic urine that stays in the bladder long enough. Most of the research is on a related form, methenamine hippurate, taken daily for months to prevent repeat UTIs, not on a few days of use for symptoms. A New Zealand government review called the overall evidence weak, though a 2022 UK trial found it held up about as well as low-dose antibiotics for prevention.",
        "citations": [
          {
            "url": "https://www.Medsafe.govt.nz/committees/MARC/reports/190-Methenamine-benefit-risk-review.pdf",
            "label": "Medsafe (New Zealand Ministry of Health), 2022: Methenamine benefit-risk review"
          }
        ]
      },
      {
        "name": "Sodium salicylate",
        "text": "Sodium salicylate is an NSAID (the same drug family as aspirin) that eases pain. The NIH's medical dictionary notes it is less effective than the same dose of aspirin for pain and fever, and has the same kinds of side effects, with less hidden stomach bleeding.",
        "citations": [
          {
            "url": "https://meshb.nlm.nih.gov/record/ui?ui=D012980",
            "label": "NIH National Library of Medicine (MeSH): Sodium Salicylate"
          }
        ]
      }
    ],
    "clinicalNote": "Cystex pairs a pain reliever with methenamine, an antibacterial that only becomes active in acidic urine. Methenamine has mainly been studied for long-term prevention of repeat UTIs, and a government review notes that if you need antibiotics for an active infection, methenamine prevention is paused until the infection clears. The label says to ask a doctor first if this is your first time having frequent, burning urination, and to stop and ask a doctor after 3 days.",
    "clinicalNoteSources": [
      {
        "url": "https://www.Medsafe.govt.nz/committees/MARC/reports/190-Methenamine-benefit-risk-review.pdf",
        "label": "Medsafe (New Zealand Ministry of Health), 2022: Methenamine benefit-risk review",
        "summary": "Explains how methenamine converts to formaldehyde in acidic urine, that it is meant for long-term prevention, and rates the overall efficacy evidence as weak."
      },
      {
        "url": "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=ac0f9a8c-164a-4908-8b1d-bb714a82550d",
        "label": "DailyMed (NLM): Cystex (methenamine, sodium salicylate) Drug Facts label",
        "summary": "The official Cystex label (Clarion Brands) lists methenamine 162 mg and sodium salicylate 162.5 mg, says not to use it for more than 3 days unless a doctor directs, and says to ask a doctor before use if you have frequent, burning urination for the first time."
      }
    ],
    "warnings": [
      "Children and teens who have or are recovering from chickenpox or flu-like symptoms should not use it, because of the risk of Reye's syndrome (a rare but serious illness).",
      "It contains an NSAID that may cause stomach bleeding, especially if you are 60 or older, have ulcers, take blood thinners, steroids or other NSAIDs, or drink 3 or more alcoholic drinks a day.",
      "Do not use if you are allergic to salicylates, including aspirin.",
      "Stop and ask a doctor if you have used it for 3 days, get ringing in your ears, or notice signs of stomach bleeding.",
      "Pregnancy: Cleveland Clinic says taking it between weeks 20 and 30 of pregnancy may harm the baby and not to take it after week 30, so ask your clinician first."
    ],
    "warningsSource": {
      "url": "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=ac0f9a8c-164a-4908-8b1d-bb714a82550d",
      "label": "DailyMed (NLM): Cystex (methenamine, sodium salicylate) Drug Facts label"
    }
  },
  "p-cora-organic-pads": {
    "whoItsFor": [
      "People who want an organic cotton layer against their skin and pads made without added fragrance or dyes",
      "Anyone who likes to match pads to their flow, with Regular, Super and Overnight options in the same lineup",
      "Overnight users who want up to 10 hours of wear with extra coverage at the back",
      "Not the pick if you want an all-cotton pad: Cora uses an organic cotton topsheet, but the absorbent core is chlorine-free wood pulp"
    ],
    "howToUse": {
      "intro": "Per Cora's own guidance and FDA pad guidance:",
      "steps": [
        "Pick the absorbency that matches your flow that day, and use lighter pads or liners at the start and end of your period.",
        "Peel off the backing, center the pad in your underwear and fold the wings around the sides.",
        "Change your pad every few hours, and more often on heavy days.",
        "Use an Overnight pad for sleep, for up to 10 hours of wear."
      ],
      "sourceUrl": "https://cora.com/blogs/blood-milk/what-are-the-best-organic-pads",
      "sourceLabel": "Cora: What are the best organic pads?"
    },
    "scienceSources": [
      {
        "url": "https://synapse.koreamed.org/articles/1130139",
        "label": "Woo et al., The Ewha Medical Journal (2019): Systematic review on sanitary pads and female health",
        "summary": "This review of 71 studies found no clear cause-and-effect link between pads and skin irritation or vaginal microbiome changes, and says more research on chemical exposure from everyday pad use is needed."
      }
    ],
    "clinicalNote": "Pads sit outside the body and absorb flow after it leaves, and FDA regulates them as medical devices and calls them generally safe. FDA says the main skin problems come from wearing a pad too long or from scents, deodorants or other materials added to pads. A 2019 systematic review found the research on pads and health is limited overall and did not report any study comparing organic and conventional pads head to head.",
    "clinicalNoteSources": [
      {
        "url": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-pads-and-liners",
        "label": "FDA: Menstrual Pads and Liners",
        "summary": "FDA safe-use guidance for pads, including that long wear and added scents or materials can irritate skin."
      },
      {
        "url": "https://synapse.koreamed.org/articles/1130139",
        "label": "Ewha Medical Journal, 2019: Systematic Review on Sanitary Pads and Female Health",
        "summary": "Reviewed studies on pads and women's health and found the evidence weak, with no organic vs conventional comparisons reported."
      }
    ],
    "warnings": [
      "Change pads every few hours, even if your flow is light, and more often when it is heavy.",
      "Wearing a pad too long may irritate the skin.",
      "If you get itching, rash, pain, swelling or discomfort while using a pad, stop using it and contact a healthcare provider."
    ],
    "warningsSource": {
      "url": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-pads-and-liners",
      "label": "FDA: Menstrual Pads and Liners"
    }
  },
  "p-probiotics-women": {
    "whoItsFor": [
      "Women who want a once-daily probiotic that doesn't need refrigeration",
      "People who want a broad blend (16 strains, mostly Lactobacillus) labeled for vaginal, digestive and immune support",
      "Those with repeat bacterial vaginosis who want to ask their clinician about adding a probiotic: a 2022 meta-analysis found lower recurrence, though the trials were small and short",
      "Not the pick for treating an active infection on its own; the label also says to check with your provider first if you're pregnant, breastfeeding, on medication or have a health condition"
    ],
    "howToUse": {
      "intro": "Per the Garden of Life label:",
      "steps": [
        "Take 1 capsule daily.",
        "Take it with or without food.",
        "If swallowing is hard, open the capsule and take the contents with water or juice.",
        "Store the bottle in a cool, dry place; no refrigeration needed.",
        "Check with your doctor if you're pregnant, breastfeeding or take other medicines."
      ],
      "sourceUrl": "https://www.vitacost.com/garden-of-life-dr-formulated-probiotics-once-daily-womens-50-billion-30-vegetarian-capsules",
      "sourceLabel": "Garden of Life label (via Vitacost product page)"
    },
    "scienceSources": [
      {
        "url": "https://www.frontiersin.org/journals/nutrition/articles/10.3389/fnut.2022.938838/full",
        "label": "Chieng et al., Frontiers in Nutrition (2022): probiotics and bacterial vaginosis recurrence, meta-analysis of 10 RCTs",
        "summary": "Across 10 trials with 1,234 women, probiotics were linked to a 45% lower risk of BV coming back, by oral or vaginal route, though follow-up was short and the authors called for larger trials."
      }
    ],
    "ingredientScience": [
      {
        "name": "Lactobacillus strains (40 billion CFU of the 50 billion)",
        "text": "Most of the blend is Lactobacillus, the type of bacteria that normally dominates a healthy vagina. A 2022 review of 10 trials (1,234 women) found probiotics cut the chance of bacterial vaginosis (BV, an overgrowth of the wrong bacteria) coming back by about 45% compared with placebo or antibiotics alone, and oral and vaginal products did about the same. The evidence was rated moderate quality, and the trials used other products, not this one.",
        "citations": [
          {
            "url": "https://www.frontiersin.org/journals/nutrition/articles/10.3389/fnut.2022.938838/full",
            "label": "Frontiers in Nutrition (2022): Probiotics to reduce the recurrence of bacterial vaginosis, systematic review and meta-analysis"
          }
        ]
      },
      {
        "name": "50 billion CFU, 16 strains",
        "text": "CFU (colony-forming units) counts how many live bacteria are in a dose. NIH notes that a higher CFU count does not make a product more effective, and that benefits depend on the specific strain, so a big number or a long strain list is not proof on its own.",
        "citations": [
          {
            "url": "https://ods.od.nih.gov/factsheets/Probiotics-HealthProfessional",
            "label": "NIH Office of Dietary Supplements: Probiotics, Fact Sheet for Health Professionals"
          }
        ]
      }
    ],
    "clinicalNote": "Probiotics have been studied mostly as an add-on for women who keep getting BV, not as a cure for an active infection. A 2022 meta-analysis found fewer BV recurrences with probiotics, but the trials were small, mixed, and mostly short, and none tested this exact product. NIH notes side effects are usually minor, like gas, and that serious infections from probiotics have mostly happened in people who were severely ill or had weakened immune systems.",
    "clinicalNoteSources": [
      {
        "url": "https://www.frontiersin.org/journals/nutrition/articles/10.3389/fnut.2022.938838/full",
        "label": "Frontiers in Nutrition (2022): Probiotics and BV recurrence meta-analysis",
        "summary": "Across 10 randomized trials, probiotics lowered BV recurrence (14.8% vs 25.5%), with moderate-quality evidence and a call for better trials."
      },
      {
        "url": "https://ods.od.nih.gov/factsheets/Probiotics-HealthProfessional",
        "label": "NIH Office of Dietary Supplements: Probiotics",
        "summary": "Explains CFU, strain-specific effects, and that side effects are usually minor gut symptoms."
      }
    ],
    "warnings": [
      "Ask your healthcare practitioner before use if you are pregnant, breastfeeding, on medication, or have any health condition.",
      "Stop using it and get medical advice if you have a bad reaction.",
      "Not intended for children; keep out of reach of children.",
      "Do not use if the safety seal is broken or missing."
    ],
    "warningsSource": {
      "url": "https://www.vitacost.com/products/garden-of-life-dr-formulated-probiotics-once-daily-women-s-50-billion-30-vegetarian-capsules-64442",
      "label": "Product label (Supplement Facts and warnings) as listed on Vitacost"
    }
  },
  "p-evening-primrose": {
    "whoItsFor": [
      "People who want a simple, single-ingredient evening primrose oil as a source of GLA",
      "Those who have read the evidence and still want to try it, knowing research hasn't shown clear benefit for PMS or breast pain",
      "Not the pick as a treatment for PMS, PMOS, period pain or cyclical breast pain: a 2021 meta-analysis found it no better than placebo for breast pain",
      "Not the pick for anyone pregnant, nursing, on medication or managing a medical condition without first checking with a doctor, per the label"
    ],
    "howToUse": {
      "intro": "Per NOW Foods' directions for its Evening Primrose Oil 1000 mg:",
      "steps": [
        "Take 1 softgel daily with a meal.",
        "Use it as an adult supplement only, and keep it out of reach of children.",
        "Store in a cool, dry place after opening.",
        "Check with your doctor if you're pregnant, breastfeeding or take other medicines."
      ],
      "sourceUrl": "https://www.nowfoods.com/products/supplements/evening-primrose-oil-1000-mg-vegan-formula-veggie-softgels?SKU=1542",
      "sourceLabel": "NOW Foods: Evening Primrose Oil 1000 mg"
    },
    "scienceSources": [
      {
        "url": "https://www.nccih.nih.gov/health/evening-primrose-oil",
        "label": "NCCIH: Evening Primrose Oil",
        "summary": "NCCIH says evening primrose oil is probably no more effective than a placebo for breast pain, and the evidence is insufficient for PMS and menopause symptoms."
      }
    ],
    "ingredientScience": [
      {
        "name": "Evening primrose oil (1000 mg)",
        "text": "The oil comes from the seeds of the evening primrose plant. NIH's NCCIH says there isn't enough evidence to know if it helps PMS or menopause symptoms, and that it is probably no better than a placebo (a dummy pill) for breast pain.",
        "citations": [
          {
            "url": "https://www.nccih.nih.gov/health/evening-primrose-oil?nav=govd",
            "label": "NIH NCCIH: Evening Primrose Oil"
          }
        ]
      },
      {
        "name": "GLA (gamma-linolenic acid, 100 mg)",
        "text": "GLA is an omega-6 fatty acid and the main reason people take evening primrose oil. Even so, Mayo Clinic says most research shows little to no help for PMS or breast pain, and research hasn't found that the supplement treats any condition.",
        "citations": [
          {
            "url": "https://www.mayoclinic.org/drugs-supplements-evening-primrose/art-20364500",
            "label": "Mayo Clinic: Evening primrose"
          }
        ]
      }
    ],
    "clinicalNote": "Evening primrose oil has been studied a fair amount for breast pain and other women's health uses, but the results have not held up well. NCCIH says the evidence is insufficient for PMS and menopause symptoms, and that it is probably no better than placebo for breast pain. It is probably safe for most adults by mouth, and the most common side effects are stomach pain, nausea, or diarrhea.",
    "clinicalNoteSources": [
      {
        "url": "https://www.nccih.nih.gov/health/evening-primrose-oil?nav=govd",
        "label": "NIH NCCIH: Evening Primrose Oil",
        "summary": "Insufficient evidence for PMS and menopause symptoms; probably no better than placebo for breast pain; generally safe for adults."
      },
      {
        "url": "https://www.mayoclinic.org/drugs-supplements-evening-primrose/art-20364500",
        "label": "Mayo Clinic: Evening primrose",
        "summary": "Most research shows little to no help for PMS or breast pain, and lists who should avoid it."
      }
    ],
    "warnings": [
      "Don't take it if you have epilepsy or schizophrenia, since it might raise your risk of seizures.",
      "Don't take it if you have a bleeding condition, and be careful with blood thinners or anti-platelet medicines.",
      "Stop taking it two weeks before surgery.",
      "It might raise the risk of pregnancy complications."
    ],
    "warningsSource": {
      "url": "https://www.mayoclinic.org/drugs-supplements-evening-primrose/art-20364500",
      "label": "Mayo Clinic: Evening primrose"
    }
  },
  "p-vitex": {
    "whoItsFor": [
      "People with PMS symptoms, especially breast tenderness, who want to try an herbal option and accept that the evidence is mixed",
      "Those willing to take it every day for a while, since Gaia says best results come from long-term use",
      "Not the pick as a treatment for PMOS or period cramps, where vitex isn't established",
      "Not the pick during pregnancy or breastfeeding, per the label; check with your doctor first if you have a medical condition or take medication"
    ],
    "howToUse": {
      "intro": "Per the Gaia Herbs label:",
      "steps": [
        "Take 2 capsules daily in the morning.",
        "Stick with it over time, since Gaia says best results come from long-term use.",
        "Don't combine it with Gaia's Menopause Support Daytime, Fertility Support or Cycle Support.",
        "Don't use it if you're pregnant or breastfeeding.",
        "Check with your doctor first if you have a medical condition or take other medicines."
      ],
      "sourceUrl": "https://www.grove.co/products/vitex-berry",
      "sourceLabel": "Gaia Herbs Vitex Berry label (via Grove Collaborative product page)"
    },
    "ingredientScience": [
      {
        "name": "Vitex agnus-castus (chasteberry) berry extract",
        "text": "Chasteberry is the fruit of a Mediterranean shrub. NIH's NCCIH says several low to moderate quality studies suggest it might ease some PMS symptoms, especially breast pain or tenderness, but there isn't enough reliable evidence for infertility or sexual problems.",
        "citations": [
          {
            "url": "https://www.nccih.nih.gov/health/chasteberry",
            "label": "NIH NCCIH: Chasteberry"
          }
        ]
      }
    ],
    "clinicalNote": "Chasteberry is one of the more studied herbs for PMS, and some trials found less breast pain and other premenstrual symptoms, but study quality is mixed and more research is needed. It is generally well tolerated in the short term and has been used safely in studies for up to 3 months. Side effects are usually mild, like nausea, stomach upset, headache, or itching. Because it has hormone-like effects, NCCIH says it may not be safe for women with hormone-sensitive conditions such as breast, uterine, or ovarian cancer.",
    "clinicalNoteSources": [
      {
        "url": "https://www.nccih.nih.gov/health/chasteberry",
        "label": "NIH NCCIH: Chasteberry",
        "summary": "Low to moderate quality studies suggest some PMS benefit; generally well tolerated for up to 3 months; caution with hormone-sensitive conditions."
      },
      {
        "url": "https://www.mskcc.org/cancer-care/integrative-medicine/herbs/chasteberry",
        "label": "Memorial Sloan Kettering Cancer Center: Chasteberry",
        "summary": "Some evidence for PMS and cycle-related breast pain, with more studies needed; lists side effects and possible drug interactions."
      }
    ],
    "warnings": [
      "Avoid during pregnancy and breastfeeding.",
      "If you have a hormone-sensitive cancer, talk to your doctor before using it.",
      "Lab studies suggest it may weaken birth control pills and hormone therapy, though this hasn't been confirmed in people.",
      "It may interfere with dopamine-related drugs, such as some Parkinson's medicines and antipsychotics."
    ],
    "warningsSource": {
      "url": "https://www.mskcc.org/cancer-care/integrative-medicine/herbs/chasteberry",
      "label": "Memorial Sloan Kettering Cancer Center: Chasteberry (About Herbs)"
    }
  },
  "p-fish-oil": {
    "whoItsFor": [
      "Women who want omega-3 fish oil and evening primrose oil in one daily supplement",
      "People with painful periods who want to try omega-3s alongside their usual care, knowing studies are encouraging but doses and results vary",
      "Those who prefer a triglyceride-form fish oil from a brand that publishes third-party purity testing",
      "Not the pick for anyone pregnant, breastfeeding, on blood thinners or other medication without checking with a doctor first, per the label"
    ],
    "howToUse": {
      "intro": "Per the Nordic Naturals label:",
      "steps": [
        "Take 2 soft gels daily with food, or as your health care professional directs.",
        "Store in a cool, dry place away from sunlight.",
        "Don't use it if the tamper-evident seal is broken or missing.",
        "Check with your doctor if you're pregnant, breastfeeding or take other medicines, including blood thinners."
      ],
      "sourceUrl": "https://www.vitacost.com/products/nordic-naturals-omega-woman-with-evening-primrose-oil-120-soft-gels-4298",
      "sourceLabel": "Nordic Naturals Omega Woman label (via Vitacost product page)"
    },
    "ingredientScience": [
      {
        "name": "Fish oil omega-3s (EPA and DHA)",
        "text": "EPA and DHA are omega-3 fats from fish oil. A 2023 review of 12 studies (881 women) found omega-3s reduced period pain and the need for painkillers at 300 to 1800 mg a day over 2 to 3 months, but the authors said the studies had quality problems and it's still unclear how it works.",
        "citations": [
          {
            "url": "https://library.fabresearch.org/viewItem.php?id=15977",
            "label": "Nutrition & Dietetics (2023, DOI 10.1111/1747-0080.12835): Omega-3s for dysmenorrhoea pain, systematic review and meta-analysis (abstract via Food and Behaviour Research)"
          }
        ]
      },
      {
        "name": "Evening primrose oil (source of GLA)",
        "text": "Evening primrose oil adds GLA, an omega-6 fat. NIH's NCCIH says there isn't enough evidence that it helps PMS or menopause symptoms, and it is probably no better than a placebo (a dummy pill) for breast pain.",
        "citations": [
          {
            "url": "https://www.nccih.nih.gov/health/evening-primrose-oil?nav=govd",
            "label": "NIH NCCIH: Evening Primrose Oil"
          }
        ]
      }
    ],
    "clinicalNote": "Omega-3s have been tested in several small trials for painful periods (dysmenorrhea). A 2023 meta-analysis found a large drop in period pain with omega-3s, but the studies were small and had design flaws, so it isn't a sure thing. Omega-3s can raise bleeding risk, so Memorial Sloan Kettering advises against combining them with blood thinners. The evening primrose oil in this formula has weak evidence on its own.",
    "clinicalNoteSources": [
      {
        "url": "https://library.fabresearch.org/viewItem.php?id=15977",
        "label": "Nutrition & Dietetics (2023): Omega-3s and dysmenorrhoea meta-analysis",
        "summary": "Across 8 pooled studies, omega-3s had a large effect on period pain, though study quality was limited."
      },
      {
        "url": "https://www.mskcc.org/cancer-care/patient-education/herbs/omega-3",
        "label": "Memorial Sloan Kettering Cancer Center: Omega-3",
        "summary": "Lists side effects like fishy taste, nausea, and diarrhea, and warns omega-3 can increase bleeding risk with blood thinners."
      }
    ],
    "warnings": [
      "Ask a doctor before use if you are pregnant or breastfeeding, have a medical condition, or take medicines, including blood thinners.",
      "Do not take if the tamper-evident seal is broken or missing.",
      "Keep out of reach of children."
    ],
    "warningsSource": {
      "url": "https://www.vitacost.com/products/nordic-naturals-omega-woman-with-evening-primrose-oil-120-soft-gels-4298",
      "label": "Nordic Naturals Omega Woman product label as listed on Vitacost"
    }
  },
  "p-b-complex": {
    "whoItsFor": [
      "People who want a full B-complex with active forms of folate (methylfolate) and B12 (methylcobalamin)",
      "Women on the pill who want to talk with a clinician about B vitamin support: older research found slightly lower folate and B12 blood levels in pill users",
      "Those who want a flexible dose, from 1 to 3 capsules a day as a practitioner advises",
      "Not the pick for stacking with other B6 products without checking totals: each capsule has about 23 mg of B6, and NIH sets the adult upper limit at 100 mg a day"
    ],
    "howToUse": {
      "intro": "Per Thorne's label and NIH guidance:",
      "steps": [
        "Take 1 capsule one to three times daily, or as your health care practitioner recommends.",
        "Count the B6 in all your supplements and stay under 100 mg a day unless your doctor advises otherwise.",
        "Talk to your doctor first if you take methotrexate for cancer, since Thorne notes these folate forms may interfere with it.",
        "Check with your doctor if you're pregnant, breastfeeding or take other medicines."
      ],
      "sourceUrl": "https://www.nhc.com/products/b-complex-12-by-thorne-research",
      "sourceLabel": "Thorne B-Complex #12 label (via NHC product page)"
    },
    "clinicalSources": [
      {
        "url": "https://ods.od.nih.gov/Pdf/Factsheets/Vitaminb6-Consumer.Pdf",
        "label": "NIH Office of Dietary Supplements: Vitamin B6 fact sheet for consumers",
        "summary": "Adult women need 1.3 to 1.5 mg of B6 a day, the upper limit is 100 mg a day, and high supplement doses taken for a year or longer can cause severe nerve damage."
      }
    ],
    "clinicalNote": "NIH sets the adult upper limit for vitamin B6 at 100 mg a day and notes that high supplement doses taken for a year or longer can cause nerve damage, so add up the B6 from everything you take.",
    "scienceSources": [
      {
        "url": "https://pubmed.ncbi.nlm.nih.gov/7037144",
        "label": "Shojania, Canadian Medical Association Journal (1982): oral contraceptives and folate and vitamin B12 metabolism",
        "summary": "Women using oral contraceptives had slightly but significantly lower folate and serum B12 levels than controls, and the author advised making sure folate stores are adequate before trying to conceive."
      }
    ],
    "ingredientScience": [
      {
        "name": "Vitamin B6 (23.4 mg as pyridoxine and pyridoxal 5'-phosphate)",
        "text": "B6 helps your body run many chemical reactions, including making brain messengers (neurotransmitters). Singapore's health regulator notes that nerve damage (peripheral neuropathy) has been reported with long-term B6 intake above 100 mg a day, so it's worth adding up the B6 from all your supplements.",
        "citations": [
          {
            "url": "https://www.hsa.gov.sg/announcements/high-dose-vitamin-b6-and-risk-of-peripheral-neuropathy/",
            "label": "Health Sciences Authority Singapore (2023): High-dose vitamin B6 and risk of peripheral neuropathy"
          }
        ]
      },
      {
        "name": "Folate (400 mcg as L-5-methyltetrahydrofolate, also called methylfolate)",
        "text": "Folate is needed to make DNA. Methylfolate is the active form your body uses. US guidance says women who could become pregnant should get 400 mcg of folic acid a day to help prevent neural tube defects (serious birth defects of the brain and spine); NIH notes there is no official formula yet for converting methylfolate to the same units.",
        "citations": [
          {
            "url": "https://ods.od.nih.gov/factsheets/Folate-HealthProfessional/",
            "label": "NIH Office of Dietary Supplements: Folate, Fact Sheet for Health Professionals"
          }
        ]
      },
      {
        "name": "B vitamins and the birth control pill (B2, B6, B12, folate)",
        "text": "A 2013 review reported that the pill can lower levels of folate and vitamins B2 (riboflavin), B6, and B12, along with some other nutrients, and suggested doctors consider supplements to prevent deficiencies. This is a review, not a trial showing that a B-complex improves energy or mood in pill users.",
        "citations": [
          {
            "url": "https://pubmed.ncbi.nlm.nih.gov/21967158/",
            "label": "Wilson et al., Nutrition Reviews (2011): Oral contraceptive use, impact on folate, vitamin B6, and vitamin B12 status"
          }
        ]
      }
    ],
    "warnings": [
      "If you are pregnant, ask your healthcare practitioner before using this product.",
      "Use only if the bottle is sealed.",
      "Long-term B6 intake above 100 mg a day has been linked to nerve damage; at the label's top dose (3 capsules) this product alone gives about 70 mg."
    ],
    "warningsSource": {
      "url": "https://www.vitacost.com/products/thorne-b-complex-12-60-capsules-18126",
      "label": "Thorne B-Complex #12 label as listed on Vitacost (B6 limit from HSA Singapore, linked above)"
    }
  },
  "p-cranberry-supplement": {
    "whoItsFor": [
      "Women with recurring UTIs who want an easy daily cranberry option: a 2023 Cochrane review found cranberry products cut UTIs in this group",
      "People who want cranberry without the sugar and calories of juice",
      "Budget shoppers who want a widely available supplement from a drugstore brand",
      "Not the pick for treating a UTI you have now: if you have burning, urgency or pelvic pain, contact a doctor"
    ],
    "howToUse": {
      "intro": "Per AZO's directions and Mayo Clinic guidance:",
      "steps": [
        "Take 2 caplets daily with water.",
        "Use it as part of prevention, and check with your healthcare team that cranberry products are OK for you.",
        "Drink plenty of fluids, especially water, through the day.",
        "Contact a doctor if you get UTI symptoms like burning, a strong urge to pee or pelvic pain, rather than relying on the supplement."
      ],
      "sourceUrl": "https://www.carewell.com/product/azo-urinary-tract-health-cranberry-supplement-50-tablets/",
      "sourceLabel": "AZO Cranberry label (via Carewell product page) and Mayo Clinic: Urinary tract infection"
    },
    "scienceSources": [
      {
        "url": "https://swiss.cochrane.org/news/can-cranberries-help-prevent-urinary-tract-infections",
        "label": "Cochrane: Can cranberries help prevent urinary tract infections? (2023 review update)",
        "summary": "An updated Cochrane review of 50 studies with 8,857 people found cranberry products lower the risk of UTIs in women with recurring UTIs, while evidence for pregnant women and older nursing home residents was inconclusive."
      }
    ],
    "ingredientScience": [
      {
        "name": "Cranberry whole fruit powder (Pacran, 500 mg)",
        "text": "A 2023 Cochrane review of 50 trials (8,857 people) found cranberry products lowered the risk of UTIs by about 30% overall, with moderate certainty, and probably helped women with repeat UTIs. They showed little or no benefit in pregnant women or older adults in care homes. The review covered many cranberry products, not this brand specifically.",
        "citations": [
          {
            "url": "https://www.cochrane.org/CD001321/RENAL_cranberries-prevent-urinary-tract-infections",
            "label": "Cochrane Review (2023): Cranberries for preventing urinary tract infections"
          }
        ]
      }
    ],
    "clinicalNote": "Cranberry is a prevention tool, not a treatment. NIH's NCCIH says it may lower the risk of repeat UTIs in women by about 25%, but findings are inconsistent, and it is not recommended for treating a UTI you already have. If you think you have a UTI, NCCIH says to see a provider for diagnosis and treatment. Cranberry by mouth is generally considered safe.",
    "clinicalNoteSources": [
      {
        "url": "https://www.nccih.nih.gov/health/cranberry?nav=tw",
        "label": "NIH NCCIH: Cranberry (updated November 2024)",
        "summary": "May reduce recurrent UTIs in women by about 25% but is not a treatment for an existing UTI."
      },
      {
        "url": "https://www.cochrane.org/CD001321/RENAL_cranberries-prevent-urinary-tract-infections",
        "label": "Cochrane Review (2023): Cranberries for preventing UTIs",
        "summary": "50 trials found cranberry reduced UTI risk overall with moderate certainty, with no clear gut side-effect difference from placebo."
      }
    ],
    "warnings": [
      "Don't use cranberry products in place of proven treatment for a UTI.",
      "If you take warfarin or other medicines, talk with your provider first, since it's unclear whether cranberry interacts with warfarin.",
      "Very large amounts of cranberry can cause stomach upset and diarrhea."
    ],
    "warningsSource": {
      "url": "https://www.nccih.nih.gov/health/cranberry?nav=tw",
      "label": "NIH NCCIH: Cranberry"
    }
  },
  "p-zinc": {
    "whoItsFor": [
      "People whose clinician has identified a need for extra zinc, such as low intake from their diet",
      "Those who prefer a whole-food style zinc with added vitamin C and a small probiotic blend",
      "Not the pick as a PMOS or acne treatment on its own: research on minerals for PMOS is still early and doses aren't settled",
      "Not the pick for stacking with other zinc products: the 30 mg dose plus food can approach NIH's 40 mg daily upper limit"
    ],
    "howToUse": {
      "intro": "Per the Garden of Life label and NIH guidance:",
      "steps": [
        "Take 2 capsules daily, which together give 30 mg of zinc.",
        "Take it with or without food, or open the capsules into water or juice.",
        "Keep your total zinc from all supplements and food under 40 mg a day unless a doctor prescribes more.",
        "If you take a quinolone or tetracycline antibiotic, take it at least 2 hours before or 4 to 6 hours after zinc.",
        "Check with your doctor if you're pregnant, breastfeeding or take other medicines."
      ],
      "sourceUrl": "https://www.professionalsupplementcenter.com/products/vitamin-code-raw-zinc-30-mg-by-garden-of-life",
      "sourceLabel": "Garden of Life Vitamin Code Raw Zinc label (via Professional Supplement Center) and NIH Office of Dietary Supplements"
    },
    "clinicalSources": [
      {
        "url": "https://ods.od.nih.gov/pdf/factsheets/zinc-consumer.pdf",
        "label": "NIH Office of Dietary Supplements: Zinc fact sheet for consumers",
        "summary": "Adult women need 8 mg of zinc a day, the upper limit is 40 mg a day from all sources, and long-term excess can lower copper levels, immunity and HDL cholesterol."
      }
    ],
    "clinicalNote": "Adult women need about 8 mg of zinc a day, and NIH sets the upper limit at 40 mg a day from all sources, so a 30 mg supplement plus food can get close. Too much zinc over time can lower copper levels and immunity.",
    "scienceSources": [
      {
        "url": "https://ods.od.nih.gov/factsheets/Zinc-HealthProfessional/",
        "label": "NIH Office of Dietary Supplements: Zinc fact sheet for health professionals",
        "summary": "NIH sets the zinc RDA for adult women at 8 mg a day and the upper limit at 40 mg a day, and notes that 50 mg or more a day over weeks can block copper absorption and reduce immune function."
      }
    ],
    "ingredientScience": [
      {
        "name": "Zinc (30 mg, from brown rice chelate)",
        "text": "Zinc is needed for hundreds of enzymes, your immune system, making protein and DNA, and wound healing. Adult women need about 8 mg a day, so 30 mg is well above that but still under NIH's 40 mg daily upper limit (this counts zinc from all supplements). NIH's fact sheet does not list acne or PMOS as uses with evidence.",
        "citations": [
          {
            "url": "https://ods.od.nih.gov/factsheets/Zinc-HealthProfessional",
            "label": "NIH Office of Dietary Supplements: Zinc, Fact Sheet for Health Professionals"
          }
        ]
      }
    ],
    "warnings": [
      "Ask your healthcare practitioner first if you are pregnant, nursing, expecting surgery, take medication regularly, or are under medical supervision.",
      "Not intended for children; keep out of reach of children.",
      "Don't go over 40 mg of zinc a day from all sources; 50 mg or more for weeks can lower copper and weaken immune function.",
      "Zinc can block absorption of quinolone and tetracycline antibiotics, so take the antibiotic at least 2 hours before or 4 to 6 hours after zinc."
    ],
    "warningsSource": {
      "url": "https://www.vitacost.com/products/garden-of-life-vitamin-code-raw-zinc-with-vitamin-c-60-vegan-capsules-46033",
      "label": "Garden of Life Vitamin Code Raw Zinc label as listed on Vitacost (limits and antibiotic timing from NIH ODS Zinc fact sheet, linked above)"
    }
  },
  "p-boric-acid": {
    "whoItsFor": [
      "People with recurring vaginal infections whose clinician has suggested vaginal boric acid as part of their plan",
      "Those who have already been examined and tested, since CDC notes that self-diagnosis of yeast infections is unreliable and can delay the right treatment",
      "Not the pick during pregnancy or breastfeeding, per the brand's warnings",
      "Not the pick for routine pH upkeep, odor or a first-time infection without a diagnosis: CDC lists boric acid only for specific recurring cases"
    ],
    "howToUse": {
      "intro": "Per The Honey Pot's directions:",
      "steps": [
        "Use it at bedtime, or wear a pantiliner during the day because it can leak.",
        "You can use it during your period, but not with tampons.",
        "Don't use it on broken or irritated skin.",
        "Use it vaginally only: never swallow it, and get medical help or call poison control right away if swallowed.",
        "Stop and call your doctor if you get irritation or burning, or if symptoms persist or worsen."
      ],
      "sourceUrl": "https://thehoneypot.co/blogs/education/ph-outta-wack",
      "sourceLabel": "The Honey Pot: Boric Acid & Herbs Suppositories"
    },
    "ingredientScience": [
      {
        "name": "Boric acid",
        "text": "CDC's treatment guidelines use 600 mg in a gelatin capsule, inserted vaginally once a day for 3 weeks, for yeast infections caused by non-albicans Candida (less common yeast species) that keep coming back. That is a specific, doctor-guided use, not routine prevention. This product is a blend of boric acid and herbs with no boric acid amount stated on the brand page, so it is not that regimen.",
        "citations": [
          {
            "url": "https://www.cdc.gov/std/treatment-guidelines/candidiasis.htm",
            "label": "CDC STI Treatment Guidelines: Candidiasis, Vulvovaginal"
          }
        ]
      },
      {
        "name": "Tea tree oil (Melaleuca alternifolia leaf oil)",
        "text": "The current label also lists tea tree oil. Mayo Clinic notes it can cause skin irritation, burning, and allergic rashes (dermatitis), advises against it if you have very sensitive skin, and warns it can make you very sick if swallowed. It does not list vaginal infections as an evidence-backed use.",
        "citations": [
          {
            "url": "https://mayoclinic.org/drugs-supplements-tea-tree-oil/art-20364246",
            "label": "Mayo Clinic: Tea tree oil"
          }
        ]
      }
    ],
    "clinicalNote": "Boric acid has a real but narrow role. CDC guidelines use it for repeat yeast infections caused by less common yeast species, and a review in Clinical Infectious Diseases reported that most of these non-albicans infections can be treated with fluconazole or boric acid. On CDC's yeast infection page, boric acid appears only for that situation, and the review notes women who carry these yeasts without symptoms should skip treatment.",
    "clinicalNoteSources": [
      {
        "url": "https://www.cdc.gov/std/treatment-guidelines/candidiasis.htm",
        "label": "CDC STI Treatment Guidelines: Candidiasis, Vulvovaginal",
        "summary": "Recommends 600 mg vaginal boric acid daily for 3 weeks when non-albicans yeast infection recurs."
      },
      {
        "url": "https://www.cdc.gov/std/treatment-guidelines/candidiasis.htm",
        "label": "CDC STI Treatment Guidelines (2021): Vulvovaginal Candidiasis",
        "summary": "CDC recommends 600 mg vaginal boric acid daily for 3 weeks for non-albicans yeast infections, reports about 70% clinical and mycologic eradication, and says yeast found without symptoms should not be treated."
      }
    ],
    "warnings": [
      "For vaginal use only; if swallowed, get medical help or call poison control right away.",
      "Do not use if you are pregnant or nursing.",
      "Do not use on broken or irritated skin, and stop and contact a doctor if symptoms persist or worsen, or you have irritation or burning.",
      "Avoid sex while using the suppositories, and keep out of reach of children."
    ],
    "warningsSource": {
      "url": "https://www.heb.com/product-detail/the-honey-pot-boric-acid-and-herbs-suppositories/5689050",
      "label": "The Honey Pot Boric Acid and Herbs Suppositories label as listed on H-E-B"
    }
  },
  "p-love-wellness-intimate-skin-support": {
    "whoItsFor": [
      "People who want a rinse-free way to freshen the external vulva and perineum between showers, such as after workouts, swimming or sex",
      "Those with sensitive skin in the bikini area who want a fragrance-free option for minor irritation like razor burn",
      "Anyone who prefers a spray over wipes when they are on the go",
      "Not the pick for UTI symptoms, unusual discharge or ongoing itching: the brand states it is not a UTI treatment, so see a clinician instead"
    ],
    "howToUse": {
      "intro": "Per Love Wellness's instructions:",
      "steps": [
        "Spray thoroughly onto the vulva and perineum, on external skin only.",
        "Never spray it internally.",
        "Let it air dry, with no rinsing needed.",
        "Use after sex, workouts, swimming, bathroom trips or as needed during the day.",
        "Stop using it if you react to any ingredient, and seek medical advice if symptoms persist."
      ],
      "sourceUrl": "https://www.ulta.com/p/p-pimprod2050204",
      "sourceLabel": "Ulta Beauty product page (Love Wellness directions)"
    },
    "ingredientScience": [
      {
        "name": "Hypochlorous acid (0.018%)",
        "text": "Hypochlorous acid is a chlorine-based germ killer used in wound and skin care, valued for its antimicrobial and anti-inflammatory effects. A 2025 review says it's well tolerated with no serious side effects reported, but that results across studies are not entirely consistent.",
        "citations": [
          {
            "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC12730738/",
            "label": "Biomedicines (MDPI, 2025): Hypochlorous Acid, clinical insights across dermatology and other specialties"
          }
        ]
      }
    ],
    "warnings": [
      "For external use only; spray on the vulva and perineum, never inside the vagina.",
      "A mild stinging feeling may happen in rare cases.",
      "This is not a treatment for UTIs; see your doctor for UTI symptoms.",
      "Don't use it if you're sensitive to any ingredient, and seek medical advice if your symptoms persist."
    ],
    "warningsSource": {
      "url": "https://www.ulta.com/p/p-pimprod2050204",
      "label": "Ulta Beauty: Love Wellness Intimate Skin Support product label"
    }
  },
  "p-elvie-trainer": {
    "whoItsFor": [
      "People with mild stress or urge leaks who want to build a daily Kegel habit",
      "Those who aren't sure they're squeezing the right muscles and want app feedback while they practice",
      "People rebuilding pelvic floor strength after pregnancy and childbirth, once a clinician says it's okay to start",
      "Not the pick for large leaks when you cough or sneeze, or for overflow incontinence: Mayo Clinic notes Kegels are less helpful there, so see a clinician first"
    ],
    "howToUse": {
      "intro": "Per Elvie's instructions:",
      "steps": [
        "Charge the Trainer in its case and download the Elvie Trainer app.",
        "Stand or lie with your legs about shoulder-width apart.",
        "Gently insert the pod and about 1 cm of the tail, leaving the rest outside.",
        "Follow the on-screen workouts, at least three times a week and ideally daily.",
        "Remove it gently, wash with warm water and mild soap, and dry it fully before storing it in the case."
      ],
      "sourceUrl": "https://support.elvie.com/elvie-trainer/using-elvie-trainer",
      "sourceLabel": "Elvie Support: How to use Elvie Trainer"
    },
    "clinicalSources": [
      {
        "url": "https://www.mayoclinic.org/healthy-lifestyle/womens-health/in-depth/art-20045283",
        "label": "Mayo Clinic: Kegel exercises, a how-to guide for women",
        "summary": "Explains who Kegels help (stress, urge and fecal incontinence), how to find the right muscles, daily sets to aim for, and that a vaginal pressure-sensor biofeedback device can help you learn the right movement."
      }
    ],
    "scienceSources": [
      {
        "url": "https://www.cochrane.org/evidence/CD009252_exercise-pelvic-floor-muscles-more-effective-treating-unintentional-passing-urine-incontinence-women",
        "label": "Cochrane Review (2025): Feedback or biofeedback to augment pelvic floor muscle training for urinary incontinence in women",
        "summary": "Across 41 studies and 3,483 women, adding biofeedback to pelvic floor training made little to no difference to quality of life or self-reported cure, with slightly fewer leaks and possibly slightly higher satisfaction."
      }
    ],
    "warnings": [
      "Don't use it if you gave birth within the last six weeks, or if you have an active urinary infection until symptoms have stopped.",
      "If you're pregnant, check with a licensed healthcare professional before using it.",
      "Don't leave it inside your vagina for more than one hour at a time, or exercise with it for more than 15 minutes in 24 hours.",
      "Stop and see a healthcare professional if insertion is persistently painful, or you have abnormal bleeding or sudden urine retention or leakage."
    ],
    "warningsSource": {
      "url": "https://cdn2.elvie.com/elvie-website/assets/manuals/aw-000564-elvie-trainer-ifu-rev-h.pdf",
      "label": "Elvie Trainer Instructions for Use (Elvie, Rev H)"
    }
  },
  "p-intimate-rose": {
    "whoItsFor": [
      "People with pain or tightness at the vaginal opening that makes tampons, pelvic exams or sex difficult, including vaginismus",
      "Those working through dyspareunia or pelvic floor dysfunction, ideally alongside a pelvic floor physical therapist",
      "People with vaginal narrowing after menopause, radiation, cancer surgery or reconstructive surgery whose clinician has recommended dilator therapy",
      "Anyone who wants a graduated set so they can move up one small size at a time"
    ],
    "howToUse": {
      "intro": "Per Cleveland Clinic guidance on vaginal dilators (Intimate Rose's own steps are in its video guides):",
      "steps": [
        "Talk to your provider first about which size to start with and how often to practice.",
        "Wash the dilator with gentle soap and warm water, then apply a water-based lubricant.",
        "Lie on your back with knees bent and legs relaxed outward.",
        "Insert the smallest comfortable size, angled toward your spine, and stop at snug tension without forcing it.",
        "Breathe deeply and leave it in for about 10 to 15 minutes, then wash and dry it.",
        "Stop if you feel pain, and call your provider for heavy bleeding or bleeding that lasts more than 24 hours."
      ],
      "sourceUrl": "https://my.clevelandclinic.org/health/treatments/24971-vaginal-dilators",
      "sourceLabel": "Cleveland Clinic: Vaginal Dilators"
    },
    "clinicalSources": [
      {
        "url": "https://my.clevelandclinic.org/health/treatments/24971-vaginal-dilators",
        "label": "Cleveland Clinic: Vaginal Dilators",
        "summary": "Lists the conditions dilators are used for (vaginismus, dyspareunia, menopause, radiation, vaginal stenosis), how to use them with water-based lube, and to talk to a provider before starting even though they are sold over the counter."
      }
    ],
    "clinicalNote": "Dilators are smooth, graduated tubes you insert yourself, starting small and moving up in size, to gently stretch and relax the vaginal muscles. Cleveland Clinic says most people with pain during sex feel some relief with regular, consistent use, and suggests follow-ups with a provider or pelvic floor physical therapist while you work through the sizes. Sessions are usually about 10 to 15 minutes with a water-based lubricant, and you shouldn't rush through sizes or keep going if it hurts. After pelvic radiation, a Cochrane review found no reliable trial evidence that routine dilation prevents narrowing, only observational links, so that use is less settled.",
    "clinicalNoteSources": [
      {
        "url": "https://my.clevelandclinic.org/health/treatments/24971-vaginal-dilators",
        "label": "Cleveland Clinic: Vaginal Dilators",
        "summary": "Explains who uses dilators, how to use them, and that most people with painful sex feel some relief with consistent use."
      },
      {
        "url": "https://www.cochrane.org/evidence/CD007291_vaginal-dilator-therapy-women-receiving-pelvic-radiotherapy",
        "label": "Cochrane Review: Vaginal dilator therapy for women receiving pelvic radiotherapy",
        "summary": "Found no reliable randomized evidence that routine dilation during radiotherapy prevents stenosis; observational data link frequent dilation with less self-reported stenosis."
      }
    ],
    "warnings": [
      "Don't use vaginal dilators if you are pregnant or have an active pelvic infection.",
      "Use a water-based lubricant only; oil or silicone-based lubricants will damage the silicone."
    ],
    "warningsSource": {
      "url": "https://www.intimaterose.com/pages/video-indications-contraindications-for-vaginal-dilators",
      "label": "Intimate Rose: Indications and contraindications for vaginal dilators"
    }
  },
  "p-honeypot-wash": {
    "whoItsFor": [
      "People who like a foaming, plant-based wash for the external vulva and want an alternative to scented body soap",
      "Shoppers who prefer formulas without parabens or sulfates and are fine with botanical ingredients",
      "Those who want an affordable wash that is easy to find at big-box stores",
      "Not the pick if essential oils bother your skin: the Sensitive formula lists lavender essential oil, and the brand advises checking with your OB/GYN first if you're pregnant or breastfeeding"
    ],
    "howToUse": {
      "intro": "Per The Honey Pot's guidance in its retailer Q&A:",
      "steps": [
        "Pump the wash 3 times into clean hands or a clean washcloth.",
        "Apply it to the external vulva only, never inside the vagina.",
        "Let the foam sit for 3 to 5 minutes for best results.",
        "Rinse well with warm water.",
        "Check with your OB/GYN before trying it if you're pregnant or breastfeeding."
      ],
      "sourceUrl": "https://target.com/p/the-honey-pot-sensitive-feminine-wash-5-51-fl-oz/-/A-51130592",
      "sourceLabel": "Target product page, The Honey Pot Sensitive Feminine Wash (brand Q&A)"
    },
    "ingredientScience": [
      {
        "name": "Aloe leaf juice",
        "text": "Aloe is a plant gel used to soothe skin. NIH says topical aloe is generally well tolerated, with occasional reports of burning, itching, or rash, but there's no research on it in intimate washes specifically.",
        "citations": [
          {
            "url": "https://www.nccih.nih.gov/health/aloe-vera",
            "label": "NIH NCCIH: Aloe Vera"
          }
        ]
      },
      {
        "name": "Lactic acid",
        "text": "Lactic acid makes a wash more acidic, closer to the natural acidity of the vagina. In one small study of 36 women (funded by a wash maker, with no comparison group), a lactic acid wash used daily for 28 days was well tolerated and didn't change vulvar skin pH or bacteria, so it seems gentle, but there's no proof it improves vaginal health.",
        "citations": [
          {
            "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC7168340/",
            "label": "Antibiotics (MDPI, 2020): 28 day assessment of a lactic acid intimate gel wash on skin tolerance and the vulvar microbiome"
          }
        ]
      },
      {
        "name": "Fragrance (natural fragrance, linalool, hydroxycitronellal)",
        "text": "This version's label lists fragrance plus linalool and hydroxycitronellal (fragrance compounds). The British Association of Dermatologists lists perfumes among everyday products that can irritate the vulva, so if your skin is sensitive, a fragrance-free option may suit you better.",
        "citations": [
          {
            "url": "https://www.skinhealthinfo.org.uk/wp-content/uploads/2018/11/Vulval-skincare-PIL-May-2023.pdf",
            "label": "British Association of Dermatologists: Vulval skin care patient leaflet (2023)"
          }
        ]
      }
    ],
    "clinicalNote": "The vagina cleans itself and doesn't need washes or perfume; Harvard Health suggests avoiding products marketed to cleanse the vagina and scented feminine products. For the vulva (the outer skin), dermatologists advise washing gently with your hands, and the British Association of Dermatologists says an emollient (a plain moisturizing cream) is the preferred soap substitute. If you like using a wash, keep it on the outside and rinse it off thoroughly, as the label directs.",
    "clinicalNoteSources": [
      {
        "url": "https://www.health.harvard.edu/blog/vulvar-health-navigating-the-nether-regions-2019040116322",
        "label": "Harvard Health: Vulvar health, navigating the nether regions",
        "summary": "Says the vagina doesn't need cleansing or perfume, and advises avoiding vagina-cleansing and scented feminine products."
      },
      {
        "url": "https://www.skinhealthinfo.org.uk/wp-content/uploads/2018/11/Vulval-skincare-PIL-May-2023.pdf",
        "label": "British Association of Dermatologists: Vulval skin care patient leaflet (2023)",
        "summary": "Advises washing the vulva gently by hand, using an emollient instead of soap, and avoiding perfumed products."
      }
    ],
    "warnings": [
      "For external use only.",
      "Avoid contact with eyes."
    ],
    "warningsSource": {
      "url": "https://www.heb.com/product-detail/the-honey-pot-intimate-foaming-wash-sensitive-with-cucumber-aloe/12430512",
      "label": "H-E-B: The Honey Pot Intimate Foaming Wash, Sensitive with Cucumber Aloe (label text)"
    }
  },
  "p-luna-wash": {
    "whoItsFor": [
      "People who want one gentle, pH-balanced wash for the whole body, including the external vulva",
      "Those with sensitive or easily dried-out skin who want a sulfate-free, paraben-free option",
      "Anyone who prefers to skip a separate intimate product and use one wash in the shower",
      "Not the pick for internal use: the brand says it's for external skin only because the vagina is self-cleaning"
    ],
    "howToUse": {
      "intro": "Per Luna Daily's instructions:",
      "steps": [
        "Patch test on the inside of your arm 24 hours before first use.",
        "Massage onto damp skin, including the external vulva, like a regular body wash.",
        "Keep it external and never use it inside the vagina.",
        "Rinse well with warm water."
      ],
      "sourceUrl": "https://www.ulta.com/p/everywhere-wash-pimprod2056336",
      "sourceLabel": "Ulta Beauty: Luna Daily The Everywhere Wash"
    },
    "communityReview": "Reviewers often say the wash feels gentle on sensitive skin and leaves it soft and hydrated, and many like the light scent. Common complaints are a watery texture that doesn't lather much, occasional pump problems, a scent some find too faint, and a price that feels high for a body wash.",
    "communityReviewSources": [
      {
        "url": "https://www.ulta.com/p/everywhere-wash-pimprod2056336",
        "label": "Ulta Beauty customer reviews: Luna Daily The Everywhere Wash"
      }
    ],
    "ingredientScience": [
      {
        "name": "Lactic acid",
        "text": "Lactic acid makes a wash more acidic, closer to the natural acidity of the vagina. In one small study of 36 women (funded by a wash maker, with no comparison group), a lactic acid wash used daily for 28 days was well tolerated and didn't change vulvar skin pH or bacteria, so it seems gentle, but there's no proof it improves vaginal health.",
        "citations": [
          {
            "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC7168340/",
            "label": "Antibiotics (MDPI, 2020): 28 day assessment of a lactic acid intimate gel wash on skin tolerance and the vulvar microbiome"
          }
        ]
      },
      {
        "name": "Chamomile flower extract",
        "text": "Chamomile is a calming plant extract, and NIH says using it on the skin is possibly safe short term. You're more likely to react to it if you're allergic to related plants like ragweed, chrysanthemums, marigolds, or daisies.",
        "citations": [
          {
            "url": "https://www.nccih.nih.gov/health/chamomile/ataglance.htm?nav=gsa",
            "label": "NIH NCCIH: Chamomile"
          }
        ]
      },
      {
        "name": "Aloe vera leaf juice",
        "text": "Aloe is a plant gel used to soothe skin. NIH says topical aloe is generally well tolerated, with occasional reports of burning, itching, or rash, but there's no research on it in intimate washes specifically.",
        "citations": [
          {
            "url": "https://www.nccih.nih.gov/health/aloe-vera",
            "label": "NIH NCCIH: Aloe Vera"
          }
        ]
      },
      {
        "name": "Fragrance (Original version)",
        "text": "Retail listings show the Original wash contains fragrance, and a Fragrance Free version is also sold. The British Association of Dermatologists lists perfumes among products that can irritate the vulva, so the fragrance-free one is the safer pick for sensitive skin.",
        "citations": [
          {
            "url": "https://www.skinhealthinfo.org.uk/wp-content/uploads/2018/11/Vulval-skincare-PIL-May-2023.pdf",
            "label": "British Association of Dermatologists: Vulval skin care patient leaflet (2023)"
          }
        ]
      }
    ],
    "clinicalNote": "The vagina cleans itself and doesn't need washes or perfume, so any wash belongs on the outside only. For the vulva, the British Association of Dermatologists advises washing gently with your hands, using an emollient (a plain moisturizing cream) instead of soap, and avoiding perfumed products. Harvard Health also suggests skipping scented feminine products, which fits this page's advice to avoid fragrance if you're sensitive.",
    "clinicalNoteSources": [
      {
        "url": "https://www.health.harvard.edu/blog/vulvar-health-navigating-the-nether-regions-2019040116322",
        "label": "Harvard Health: Vulvar health, navigating the nether regions",
        "summary": "Says the vagina doesn't need cleansing or perfume, and advises avoiding vagina-cleansing and scented feminine products."
      },
      {
        "url": "https://www.skinhealthinfo.org.uk/wp-content/uploads/2018/11/Vulval-skincare-PIL-May-2023.pdf",
        "label": "British Association of Dermatologists: Vulval skin care patient leaflet (2023)",
        "summary": "Advises washing the vulva gently by hand, using an emollient instead of soap, and avoiding perfumed products."
      }
    ],
    "warnings": [
      "For external use only; don't use it inside the vagina, which cleans itself.",
      "Patch test on the inside of your arm 24 hours before first use."
    ],
    "warningsSource": {
      "url": "https://boots.com/lunadaily-the-everywhere-wash-250ml-10336536",
      "label": "Boots: Luna Daily The Everywhere Wash (product label text)"
    }
  },
  "d-natural-cycles": {
    "whoItsFor": [
      "Premenopausal women 18 and older who want hormone-free birth control and are willing to measure their temperature most mornings",
      "People coming off condoms or another less effective method who want more structure around fertile days",
      "Couples comfortable using condoms or skipping sex on the days the app flags as fertile",
      "Not the pick if a pregnancy would be a serious health risk for you, or if you're on hormonal birth control: the FDA says it shouldn't be used in those cases, and it doesn't protect against STIs"
    ],
    "howToUse": {
      "intro": "Per Natural Cycles' help center:",
      "steps": [
        "Download the app, sign up, and choose an approved basal thermometer or wearable.",
        "Keep the thermometer by your bed and measure first thing after waking, before you sit up, drink or get out of bed.",
        "Measure at least 5 mornings a week, at roughly the same time each day.",
        "Log the reading in the app and use protection or skip sex on the days it shows as fertile.",
        "Exclude a reading if you're sick, hungover, or slept about 2 hours more or less than usual."
      ],
      "sourceUrl": "https://help.naturalcycles.com/hc/en/articles/360003290614",
      "sourceLabel": "Natural Cycles Help Center: Measuring with a basal thermometer"
    },
    "clinicalSources": [
      {
        "url": "https://www.fda.gov/NewsEvents/Newsroom/PressAnnouncements/ucm616511.htm",
        "label": "FDA: FDA allows marketing of first direct-to-consumer app for contraceptive use (2018)",
        "summary": "Authorizes Natural Cycles for premenopausal women 18 and older, reports 1.8% perfect-use and 6.5% typical-use pregnancy rates from 15,570 women, and says it should not be used with hormonal birth control or when pregnancy would be high risk."
      }
    ],
    "scienceSources": [
      {
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC6475236",
        "label": "BMJ Open: Natural Cycles typical-use effectiveness in 16,331 Swedish women",
        "summary": "Found an overall typical-use Pearl Index of about 6.1, lower in former condom users and higher in women who recently stopped the pill; the study was funded by Natural Cycles."
      },
      {
        "url": "https://www.nice.org.uk/advice/mib244/chapter/Clinical-and-technical-evidence",
        "label": "NICE Medtech Innovation Briefing (MIB244): Natural Cycles clinical evidence",
        "summary": "Reviews 5 observational, company-funded studies showing a typical-use pregnancy rate of about 7% a year, and notes there are no head-to-head comparisons with other contraceptives."
      }
    ],
    "clinicalNote": "Natural Cycles is a fertility awareness method run by an app. You take your temperature each morning with a basal body thermometer (one sensitive enough to catch the small rise of about half a degree Fahrenheit that comes with ovulation), and the app tells you which days you need to abstain or use a condom. How well it works depends a lot on how you use it: in a Swedish study of over 16,000 users, people who switched from the pill got pregnant more often than people who switched from condoms, partly because of unprotected sex on fertile days.",
    "clinicalNoteSources": [
      {
        "url": "https://www.fda.gov/NewsEvents/Newsroom/PressAnnouncements/ucm616511.htm",
        "label": "FDA (2018): FDA allows marketing of first direct-to-consumer app for contraceptive use",
        "summary": "Explains how the app uses daily basal body temperature to flag fertile days and who should not use it."
      },
      {
        "url": "https://pubmed.ncbi.nlm.nih.gov/30904873/",
        "label": "BMJ Open (2019): Typical use effectiveness of Natural Cycles, postmarket surveillance study",
        "summary": "Among 16,331 Swedish users, typical-use pregnancy rates ranged from 3.5 (former condom users) to 8.1 (former pill users) per 100 woman-years."
      }
    ],
    "effectiveness": "For this app specifically: in the studies FDA reviewed (15,570 women), about 1.8 in 100 got pregnant in a year with perfect use and 6.5 in 100 with typical use. A 2021 study of 5,879 US users found similar numbers: a typical-use rate of 6.2 and a perfect-use rate of 2.0 pregnancies per 100 women per year.",
    "effectivenessSources": [
      {
        "url": "https://www.fda.gov/NewsEvents/Newsroom/PressAnnouncements/ucm616511.htm",
        "label": "FDA (2018): First direct-to-consumer app for contraceptive use",
        "summary": "Reports a 1.8% perfect-use and 6.5% typical-use yearly failure rate from clinical studies of 15,570 women."
      },
      {
        "url": "https://discovery.fiu.edu/display/pub194530",
        "label": "Journal of Women's Health (2021): Contraceptive Effectiveness of an FDA-Cleared Birth Control App, Natural Cycles U.S. Cohort",
        "summary": "In 5,879 US users, the typical-use Pearl Index was 6.2 and perfect-use was 2.0."
      }
    ],
    "warnings": [
      "Does not protect against sexually transmitted infections.",
      "Not for you if you have a medical condition where pregnancy would carry a significant risk.",
      "Not for you if you are using birth control or hormone treatments that stop ovulation.",
      "No method works perfectly, so pregnancy can still happen even with correct use."
    ],
    "warningsSource": {
      "url": "https://www.fda.gov/NewsEvents/Newsroom/PressAnnouncements/ucm616511.htm",
      "label": "FDA (2018): FDA allows marketing of first direct-to-consumer app for contraceptive use"
    }
  },
  "d-ovia": {
    "whoItsFor": [
      "People whose employer or health plan offers Ovia Health as a benefit, so they can use it at no extra cost",
      "Anyone planning a pregnancy who wants period and ovulation tracking plus family-building content, including adoption and surrogacy",
      "People who want one company's apps to carry them from trying to conceive through pregnancy and early parenting",
      "Not the pick if you're uneasy about an employer-sponsored app holding your reproductive data: review the privacy settings before you sign up"
    ],
    "howToUse": {
      "intro": "Per an employer benefits guide for Ovia Health:",
      "steps": [
        "Download the app that fits your stage: Ovia Fertility, Ovia Pregnancy or Ovia Parenting.",
        "During sign-up, choose the option saying you have Ovia Health as a benefit.",
        "Select your employer or health plan to unlock your coverage.",
        "Log your periods, symptoms and pregnancy details to get personalized tracking and tips.",
        "Review the app's privacy settings so you know what is shared."
      ],
      "sourceUrl": "https://www.cu.edu/blog/work-life/find-family-planning-support-ovia-health",
      "sourceLabel": "University of Colorado: Find family planning support with Ovia Health"
    },
    "clinicalSources": [
      {
        "url": "https://www.nichd.nih.gov/health/topics/preconceptioncare/conditioninfo/before-pregnancy",
        "label": "NIH (NICHD): Can you promote a healthy pregnancy before getting pregnant?",
        "summary": "Recommends a pre-pregnancy visit with a provider and at least 400 mcg of folic acid daily starting before conception, along with managing existing conditions and updating vaccines."
      }
    ],
    "clinicalNote": "Tracking apps are a helpful tool, but NIH guidance still recommends a pre-pregnancy visit with your provider and starting at least 400 mcg of folic acid daily before you conceive.",
    "warnings": [
      "Ovia's own App Store privacy label says your location, identifiers, usage data and diagnostics may be used to track you across other companies' apps and sites.",
      "The same label says data linked to your identity can include health and fitness data, financial info and sensitive info, so review your privacy settings."
    ],
    "warningsSource": {
      "url": "https://apps.apple.com/app/570244389",
      "label": "Ovia Cycle & Pregnancy Tracker (Ovuline, Inc.), Apple App Store listing, App Privacy label"
    }
  },
  "d-glow": {
    "whoItsFor": [
      "People trying to conceive who want to log periods, basal body temperature, cervical mucus and sex in one place",
      "Those who want a community forum to swap experiences with others on the same path",
      "People who want optional paid extras like advanced cycle and temperature charts",
      "Not the pick for birth control: Glow says the app is meant to help with conception and not to be used for contraception"
    ],
    "howToUse": {
      "intro": "Per Glow's App Store listing:",
      "steps": [
        "Download the Glow app and create an account.",
        "Log your period dates, symptoms and mood each day.",
        "Add fertility signs like basal body temperature, cervical mucus and sex to sharpen your fertile-window predictions.",
        "Connect Apple Health if you want your data to sync.",
        "Check medical questions raised in the forums with your own doctor."
      ],
      "sourceUrl": "https://apps.apple.com/us/app/glow-fertility-ovulation-app/id638021335?pid=header",
      "sourceLabel": "Apple App Store: Glow Ovulation & Period App"
    },
    "clinicalSources": [
      {
        "url": "https://www.cdc.gov/MMWR/preview/mmwrhtml/rr59e0528a9.htm",
        "label": "CDC MMWR (2010): Classifications for Fertility Awareness-Based Methods",
        "summary": "Explains that fertility-sign methods are less reliable with irregular bleeding, after childbirth, around perimenopause and with fevers, and that they offer no STI protection."
      }
    ],
    "scienceSources": [
      {
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC8504278/",
        "label": "Women's Health (2021): Period tracker applications: What menstrual cycle information are they giving women?",
        "summary": "Ten tracker apps gave conflicting dates and only 8% of ovulation predictions were exactly right, and the authors note the fertile window is best predicted with markers like basal temperature, ovulation tests or cervical mucus."
      }
    ],
    "clinicalNote": "The CDC notes that fertility signs are harder to read with irregular bleeding, after childbirth and around perimenopause, so app predictions are less reliable in those times.",
    "warnings": [
      "Glow is meant to help you predict ovulation to get pregnant. It is not meant to be used as birth control.",
      "The app's information does not replace professional medical advice, so check medical questions with a healthcare provider.",
      "Glow's App Store privacy label says some data, including purchases, location and identifiers, may be used to track you across other companies' apps and sites, so review your privacy settings."
    ],
    "warningsSource": {
      "url": "https://apps.apple.com/app/id638021335",
      "label": "Glow Ovulation & Period App, Apple App Store listing (description and App Privacy label)"
    }
  },
  "d-maven": {
    "whoItsFor": [
      "People whose employer or health plan offers Maven, since covered members get access fully paid",
      "Anyone at a family-building or life stage Maven supports, from fertility and pregnancy to parenting and menopause, who wants virtual access to many specialists",
      "Those who want a personal Care Advocate to explain benefits and help coordinate care",
      "Not covered through work? You can still book single appointments for a per-visit fee, with no subscription"
    ],
    "howToUse": {
      "intro": "Per Maven's help center:",
      "steps": [
        "Check whether your employer or health plan offers Maven, then download the app and set up your account.",
        "Go to My Care to browse appointment types and book a virtual visit.",
        "Find your Care Advocate under View Care Team and send them a message to get started.",
        "Use the Library for medically reviewed articles, on-demand classes and live events.",
        "If you're not eligible for a covered program, book appointments one at a time for a fee."
      ],
      "sourceUrl": "https://support.mavenclinic.com/hc/en-us/articles/34228933931923-Getting-Started-with-Maven",
      "sourceLabel": "Maven Help Center: Getting Started with Maven"
    },
    "clinicalSources": [
      {
        "url": "https://medlineplus.gov/ency/patientinstructions/000919.htm",
        "label": "MedlinePlus: Telehealth",
        "summary": "Explains what telehealth can do, like visits without travel and secure messaging for questions and refills, that you should check your insurance coverage first, and that it isn't for medical emergencies."
      }
    ],
    "scienceSources": [
      {
        "url": "https://jmir.org/2023/1/e43180/authors",
        "label": "JMIR (2023): Association Between the Use of a Digital Health Platform During Pregnancy and Helping Users Avoid Emergency and In-Person Care",
        "summary": "In a retrospective study of 5,263 pregnant Maven users, written mostly by Maven staff, heavier use of virtual provider visits was linked to self-reported avoidance of ER or office visits, though the design can't show cause and effect."
      }
    ],
    "clinicalNote": "Maven is a virtual clinic, so the evidence that matters is about telehealth in women's health in general, not about Maven itself. A 2020 review of 47 studies (31,967 people) in Obstetrics & Gynecology found telehealth helped with quitting smoking during pregnancy and with breastfeeding, and cut the number of office visits needed for high-risk pregnancy monitoring without worse outcomes for parent or baby. The review's lead author also noted that we still know very little about how well many of these tools work.",
    "clinicalNoteSources": [
      {
        "url": "https://scholar.usuhs.edu/en/publications/telehealth-interventions-to-improve-obstetric-and-gynecologic-hea/",
        "label": "Obstetrics & Gynecology (2020): Telehealth Interventions to Improve Obstetric and Gynecologic Health Outcomes, systematic review",
        "summary": "Across 47 studies, telehealth improved smoking cessation and breastfeeding and reduced high-risk monitoring visits while keeping outcomes the same."
      },
      {
        "url": "https://smhs.gwu.edu/news/telehealth-interventions-associated-improved-obstetric-outcomes",
        "label": "George Washington University School of Medicine: Telehealth interventions associated with improved obstetric outcomes",
        "summary": "The lead author says more evidence is needed on how clinicians can fit telehealth into care."
      }
    ],
    "warnings": [
      "Not for emergency or urgent care needs. In a true emergency, call 911 or go to the nearest emergency room.",
      "Not a substitute for your own doctor's care.",
      "Program nurses and other representatives cannot diagnose problems or suggest treatment."
    ],
    "warningsSource": {
      "url": "https://plexusbenefits.uhc.com/wp-content/uploads/2025/07/maven-maternity-member-flier.pdf",
      "label": "UnitedHealthcare: Maven Maternity member flier"
    }
  },
  "d-tia": {
    "whoItsFor": [
      "Women near a Tia clinic in New York, California or Arizona who want gynecology and primary care in one place, with virtual visits too",
      "People who like a whole-person approach, with mental health, nutrition and acupuncture offered alongside medical care",
      "Those with a major PPO plan who want to use insurance, either with no membership fee or with a paid membership for extra support",
      "Not the pick if you rely on Medicaid: Tia says it does not currently accept it"
    ],
    "howToUse": {
      "intro": "Per Tia's instructions:",
      "steps": [
        "Pick the free Essential plan or the paid Signature membership and sign up online.",
        "Check your insurance coverage, since Tia confirms whether you're in network.",
        "Book a new-patient establishment-of-care visit, either virtual or in person.",
        "Work with your provider on an annual preventive exam or a care plan built around your goals.",
        "Book later visits through the member portal or by calling 646-650-5337."
      ],
      "sourceUrl": "https://asktia.com/care-at-tia/",
      "sourceLabel": "Tia: Care at Tia"
    },
    "clinicalSources": [
      {
        "url": "https://medlineplus.gov/ency/patientinstructions/000919.htm",
        "label": "MedlinePlus: Telehealth",
        "summary": "Explains what virtual visits can and can't do, that you should check whether your insurance covers telehealth, and that it isn't for medical emergencies."
      }
    ],
    "clinicalNote": "Tia pairs regular OB-GYN care with add-ons like acupuncture, so it helps to know where acupuncture has evidence. NIH's complementary health center (NCCIH) says acupuncture may help some pain conditions, like back, neck and knee pain. For women's health uses the picture is weaker: in a 2021 review it did no better than sham (fake) acupuncture for pregnancy or live birth rates with fertility treatment, and for hot flashes it beat no treatment but not sham acupuncture. NCCIH also says not to use acupuncture to put off seeing a health care provider, and to tell all your providers about complementary treatments you use.",
    "clinicalNoteSources": [
      {
        "url": "https://nccih.nih.gov/health/acupuncture",
        "label": "NIH NCCIH: Acupuncture, Effectiveness and Safety",
        "summary": "Acupuncture may help several pain conditions; it was not better than sham for IVF pregnancy rates or for hot flashes; serious problems are rare when done properly with sterile single-use needles."
      }
    ],
    "warnings": [
      "Tia does not currently accept Medicaid.",
      "Membership fees are not typically covered by insurance, though visits are billed to insurance.",
      "Late cancellations cost $50 (Signature, under 24 hours' notice) or $75 (Essential, under 48 hours' notice).",
      "Care is available in New York, California and Arizona only."
    ],
    "warningsSource": {
      "url": "https://asktia.com/membership",
      "label": "Tia: Membership"
    }
  },
  "d-ppd": {
    "whoItsFor": [
      "People who want birth control pills, the patch or the ring prescribed online and mailed to them, in a plain envelope",
      "Anyone with simple UTI symptoms who wants antibiotics sent to a local pharmacy without an in-person visit",
      "People watching costs: mail-order visit fees start at $0, and pricing varies by state",
      "Not the pick for STI testing right now: Planned Parenthood says at-home STI tests and telehealth STI visits are temporarily paused, so use an in-person health center"
    ],
    "howToUse": {
      "intro": "Per Planned Parenthood's instructions:",
      "steps": [
        "Download the Planned Parenthood Direct app and choose the service you need.",
        "Fill out the health questionnaire.",
        "Watch for in-app messages, since a provider may ask follow-up questions while reviewing your request.",
        "Get your medication shipped discreetly or pick it up at a local pharmacy.",
        "Expect a referral to in-person care if telehealth isn't right for your situation or state."
      ],
      "sourceUrl": "https://plannedparenthood.org/planned-parenthood-direct",
      "sourceLabel": "Planned Parenthood: Planned Parenthood Direct"
    },
    "clinicalSources": [
      {
        "url": "https://medlineplus.gov/ency/patientinstructions/000919.htm",
        "label": "MedlinePlus: Telehealth",
        "summary": "Explains how telehealth lets you get care and prescriptions without travel, that insurance coverage varies, and that it isn't for medical emergencies."
      }
    ],
    "scienceSources": [
      {
        "url": "https://effectivehealthcare.ahrq.gov/sites/default/files/product/pdf/cer-256-telehealth-women-preventive-services.pdf",
        "label": "AHRQ Comparative Effectiveness Review No. 256 (2022): Effectiveness of Telehealth for Women's Preventive Services",
        "summary": "Across 16 studies, telehealth for contraceptive care led to similar rates of contraceptive use, STIs and pregnancy as comparison care, though the strength of evidence was low."
      }
    ],
    "clinicalNote": "Getting birth control through an app is backed by CDC guidance: you do not need a pelvic exam (an internal exam) or a breast exam to start the pill, patch or ring, and you do not need lab tests first. The one check CDC calls essential for the pill, patch and ring (methods that contain estrogen) is a blood pressure reading, and you can report one taken somewhere else. A large 2020 review of telehealth in obstetrics and gynecology found benefits, but its authors said there is still a lot we don't know about how well these tools work.",
    "clinicalNoteSources": [
      {
        "url": "https://cdc.gov/contraception/hcp/usspr/tests-before-contraception.html",
        "label": "CDC, U.S. Selected Practice Recommendations: Examinations and Tests Needed Before Initiation of Contraceptive Methods",
        "summary": "Pelvic and breast exams and lab tests are not needed before starting the pill, patch, ring, shot or progestin-only pill; blood pressure is essential for combined methods and can be self-reported."
      },
      {
        "url": "https://scholar.usuhs.edu/en/publications/telehealth-interventions-to-improve-obstetric-and-gynecologic-hea/",
        "label": "Obstetrics & Gynecology (2020): Telehealth Interventions to Improve Obstetric and Gynecologic Health Outcomes, systematic review",
        "summary": "Across 47 studies (31,967 people), telehealth helped with smoking cessation and breastfeeding and cut high-risk monitoring visits without worse outcomes."
      },
      {
        "url": "https://smhs.gwu.edu/news/telehealth-interventions-associated-improved-obstetric-outcomes",
        "label": "George Washington University School of Medicine: Telehealth interventions associated with improved obstetric outcomes",
        "summary": "The review's lead author notes that we still know very little about how effective many telehealth tools are."
      }
    ],
    "warnings": [
      "Services vary by state, and care may not be available where you live or you may be referred to in-person care.",
      "If the provider thinks your symptoms are caused by something other than a simple UTI, they can't prescribe through the app (the visit fee is refunded).",
      "At-home STI testing and telehealth STI visits are currently paused.",
      "Shipped orders can't be returned or refunded."
    ],
    "warningsSource": {
      "url": "https://plannedparenthood.org/planned-parenthood-direct",
      "label": "Planned Parenthood: Planned Parenthood Direct"
    }
  },
  "d-eight-sleep": {
    "whoItsFor": [
      "People who run hot at night, including women with night sweats or hot flashes around perimenopause and menopause",
      "Couples who want different temperatures on each side of the bed",
      "Anyone interested in overnight sleep and heart-rate tracking without wearing a device",
      "Not the pick if you're on a tight budget or don't have WiFi and a smartphone: the system needs both, plus a nearby outlet"
    ],
    "howToUse": {
      "intro": "Per Eight Sleep's instructions:",
      "steps": [
        "Download the Eight Sleep app and follow its setup steps, which take about 15 to 30 minutes.",
        "Fit the cover over your mattress like a fitted sheet.",
        "Connect the Hub to a wall outlet and WiFi, then do the first water fill.",
        "Set a temperature for each side in the app, or turn on Autopilot to adjust it overnight.",
        "Change the water every 2 to 3 months and clean the cover with a mild detergent."
      ],
      "sourceUrl": "https://help.eightsleep.com/en_us/how-do-i-maintain-the-pod-HyWYigaKN.md",
      "sourceLabel": "Eight Sleep: Answering Your Questions About The Pod"
    },
    "clinicalSources": [
      {
        "url": "https://www.mayoclinic.org/diseases-conditions/hot-flashes/diagnosis-treatment/drc-20352795",
        "label": "Mayo Clinic: Hot flashes, diagnosis and treatment",
        "summary": "Self-care tips include dressing in layers and using a fan, air conditioning or a cooler room, though Mayo notes the evidence for these steps is limited."
      }
    ],
    "scienceSources": [
      {
        "url": "https://pubmed.ncbi.nlm.nih.gov/22738673/",
        "label": "Journal of Physiological Anthropology (2012): Effects of thermal environment on sleep and circadian rhythm",
        "summary": "This review finds that in real-life conditions with bedding, heat increases wakefulness and cuts deep and REM sleep, which supports keeping your sleep environment cool."
      }
    ],
    "clinicalNote": "Your body needs to cool down a little to fall and stay asleep, and a warm room makes hot flashes (sudden waves of heat, often with sweating) more likely. That is why common advice for night sweats is a cool room, a fan, and fewer blankets. A bed that cools itself is a high-tech take on the same idea. The one published study of the Pod was run by Eight Sleep and did not focus on perimenopause or night sweats, so its benefit for those symptoms specifically hasn't been tested.",
    "clinicalNoteSources": [
      {
        "url": "https://www.uofmhealth.org/health-library/hw228097",
        "label": "University of Michigan Health (Healthwise): Hot Flashes and Menopause",
        "summary": "Hot flashes are more likely in a warm environment; suggests keeping the room cool, using a fan, and sleeping with fewer blankets."
      },
      {
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC11048088/",
        "label": "Bioengineering (2024): Sleeping for One Week on a Temperature-Controlled Mattress Cover Improves Sleep and Cardiovascular Recovery",
        "summary": "Single-group study of 54 healthy adults by mostly Eight Sleep-affiliated authors; did not study menopause symptoms."
      }
    ],
    "effectiveness": "There is one study of this product. In 54 healthy adults sleeping at home, a week with the Pod turned on lowered sleeping heart rate slightly (about 1 beat per minute) and raised heart rate variability (HRV, a sign of recovery) by about 2 ms, and people rated their sleep better. Men who slept cooler gained about 14 minutes of deep sleep, but women's deep sleep did not change significantly (they gained some REM sleep instead). Most authors work for Eight Sleep, there was no comparison group, and it lasted only one week.",
    "effectivenessSources": [
      {
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC11048088/",
        "label": "Bioengineering (2024): Temperature-controlled mattress cover, sleep and cardiovascular recovery",
        "summary": "One week on the Eight Sleep Pod modestly lowered sleeping heart rate and raised HRV; deep sleep rose in men but not significantly in women."
      }
    ]
  },
  "p-frida-mom-kit": {
    "whoItsFor": [
      "Expecting parents who want their vaginal-birth recovery supplies bought and ready before the baby arrives",
      "People who expect perineal soreness or swelling and want cold relief and witch hazel liners in one kit",
      "Anyone who wants disposable underwear and pads so they don't have to stain their own underwear in the first days after birth",
      "Not a replacement for your care team: call your OB or midwife for a fever of 100.4°F or higher, worsening pain or foul-smelling discharge"
    ],
    "howToUse": {
      "intro": "Per Frida Mom's kit regimen and Boston Medical Center's perineal care guidance:",
      "steps": [
        "Rinse your perineum with warm water from a peri bottle after you pee or poop, then pat dry.",
        "Put on the disposable postpartum underwear.",
        "Use an Instant Ice Maxi Pad for cooling and absorbency, especially in the first day or so when swelling is worst.",
        "Add the witch hazel cooling liners on top of your pad to soothe the area.",
        "Apply the perineal healing foam for pain relief.",
        "Change your pad every 2 to 4 hours."
      ],
      "sourceUrl": "https://boots.ie/fridamom-postpartum-recovery-essentials-kit--10295379",
      "sourceLabel": "Boots: Frida Mom Postpartum Recovery Essentials Kit"
    },
    "clinicalSources": [
      {
        "url": "https://www.bmc.org/bump-beyond/postpartum-experience/physical-health/perineal-care.md",
        "label": "Boston Medical Center: Perineal care after birth",
        "summary": "Recommends a peri bottle rinse after using the toilet, cold packs on the first day, frozen Tucks pads on top of your pad, sitz baths, pad changes every 2 to 4 hours, and calling your doctor for fever, worsening pain or foul discharge."
      }
    ],
    "clinicalNote": "After a vaginal birth, the perineum (the skin and muscle between the vagina and anus) is often sore, swollen, or stitched. Hospitals commonly suggest a cold pack or \"ice diaper\" on the first day, chilled pads on top of a regular pad, and spraying warm water on the area after you pee instead of wiping. A 2020 Cochrane review of 10 trials found only limited, very low certainty evidence that ice packs or cold gel pads ease perineal pain in the first two days, so think of cold therapy as a low-risk comfort measure rather than a proven treatment.",
    "clinicalNoteSources": [
      {
        "url": "https://www.cochrane.org/evidence/CD006304_local-cooling-relieving-pain-perineal-trauma-sustained-during-childbirth",
        "label": "Cochrane (2020): Local cooling for relieving pain from perineal trauma sustained during childbirth",
        "summary": "10 trials; limited very low certainty evidence that ice packs or cold gel pads may relieve perineal pain in the first two days after birth."
      },
      {
        "url": "https://www.bmc.org/bump-beyond/postpartum-experience/physical-health/perineal-care.md",
        "label": "Boston Medical Center, Bump & Beyond: Perineal care",
        "summary": "Suggests a cold pack or ice diaper on day one, frozen pads on top of a menstrual pad, and a warm water spray bottle after peeing."
      }
    ],
    "warnings": [
      "Call your OB/GYN right away if you have a fever of 100.4 °F or higher, more pain, or foul-smelling discharge."
    ],
    "warningsSource": {
      "url": "https://www.bmc.org/bump-beyond/postpartum-experience/physical-health/perineal-care.md",
      "label": "Boston Medical Center, Bump & Beyond: Perineal care (official guidance for postpartum perineal care)"
    }
  },
  "p-lansinoh-pads": {
    "whoItsFor": [
      "Breastfeeding or pumping parents who leak between feeds and want to protect their bras and clothes",
      "People who prefer a disposable pad they can toss after each feed rather than washing reusable ones",
      "Those who want adhesive strips that keep the pad from shifting inside the bra",
      "Anyone dealing with sore nipples who wants to keep the area dry, since the NHS advises changing pads after every feed"
    ],
    "howToUse": {
      "intro": "Per Lansinoh's instructions and NHS breastfeeding guidance:",
      "steps": [
        "Take the pad out of its wrapper and peel the protective sheets off the adhesive strips.",
        "Place it inside your bra with the curved edges toward the sides.",
        "Change it after every feed or as soon as it feels soaked through.",
        "Let your nipples air-dry after feeds before putting in a fresh pad.",
        "Keep wrappers away from your baby and throw them away properly."
      ],
      "sourceUrl": "https://lansinoh.helpjuice.com/en_US/stay-dry-disposable-nursing-pads/instructions-for-use-stay-dry-disposable-nursing-pads",
      "sourceLabel": "Lansinoh: Instructions for use, Stay Dry Disposable Nursing Pads"
    },
    "clinicalSources": [
      {
        "url": "https://www.nhs.uk/start-for-life/baby/feeding-your-baby/breastfeeding/breastfeeding-challenges/sore-nipples/",
        "label": "NHS Start for Life: Sore nipples",
        "summary": "Advises changing breast pads after every feed and letting nipples air-dry, and notes that most nipple pain comes from a poor latch."
      }
    ],
    "clinicalNote": "Nursing pads catch leaking milk, which is common in the early weeks of breastfeeding. The NHS advises changing breast pads after every feed if you use them. Sore nipples are most often caused by a shallow latch, and cracked nipples can let in thrush (a yeast infection), so if your nipples hurt, crack, or bleed, get help from a midwife, health visitor, or breastfeeding specialist early rather than relying on pads alone.",
    "clinicalNoteSources": [
      {
        "url": "https://www.nhs.uk/best-start-in-life/baby/feeding-your-baby/breastfeeding/breastfeeding-challenges/sore-nipples/",
        "label": "NHS Best Start in Life: Sore nipples",
        "summary": "Change breast pads after every feed; poor latch is the most common cause of nipple pain; thrush can follow cracked nipples."
      }
    ],
    "warnings": [
      "Change pads often to keep your skin healthy, generally after each feeding.",
      "Change pads during the night if they get soaked.",
      "The pads are for one-time use only, so throw each one away after use."
    ],
    "warningsSource": {
      "url": "https://lansinoh.helpjuice.com/en_US/stay-dry-disposable-nursing-pads/faqs-stay-dry-disposable-nursing-pads",
      "label": "Lansinoh Help Center: FAQs, Stay Dry Disposable Nursing Pads"
    }
  },
  "p-rituals-prenatal": {
    "whoItsFor": [
      "Women who are thinking about pregnancy, actively trying, or currently pregnant, which is who Ritual designed it for",
      "People who want folate, iron, choline and omega-3 DHA in one daily capsule routine",
      "Those who prefer a vegan capsule with a shorter, more targeted ingredient list",
      "Not a complete multivitamin: it lists 12 nutrients and leaves out calcium, vitamin A, vitamin C and zinc, so ask your clinician whether you need to cover those elsewhere"
    ],
    "howToUse": {
      "intro": "Per Ritual's instructions:",
      "steps": [
        "Take two capsules together once a day.",
        "Take them with or without food.",
        "Take them morning or night, whichever is easier to remember.",
        "Ask your prenatal care provider whether you need extra nutrients this formula doesn't include."
      ],
      "sourceUrl": "https://www.ritual.com/products/essential-prenatal-multivitamin",
      "sourceLabel": "Ritual: Essential for Women Prenatal Multivitamin"
    },
    "scienceSources": [
      {
        "url": "https://russia.cochrane.org/news/new-research-finds-omega-3-fatty-acids-reduce-risk-premature-birth",
        "label": "Cochrane Review (2018): Omega-3 fatty acid addition during pregnancy",
        "summary": "Across 70 randomized trials, omega-3 during pregnancy lowered the risk of preterm birth by 11% and of early preterm birth before 34 weeks by 42%, which supports including DHA in a prenatal."
      }
    ],
    "ingredientScience": [
      {
        "name": "Methylfolate (6S-5-methyltetrahydrofolate, \"MTHF folate\")",
        "text": "Folate helps prevent neural tube defects (serious birth defects of the brain and spine) when taken before and in early pregnancy. But the CDC and NIH say folic acid is the only form proven to do this, and no studies show that other forms like methylfolate prevent these defects, so the evidence for this form is indirect.",
        "citations": [
          {
            "url": "https://www.cdc.gov/folic-acid/hcp/clinical-overview/index.html",
            "label": "CDC: Folic Acid, Facts for Clinicians"
          }
        ]
      },
      {
        "name": "Iron (ferrous bisglycinate)",
        "text": "You need more iron in pregnancy (27 mg a day vs 18 mg for most adult women), and most pregnant women in the US get less than they need from food. A 2024 Cochrane review found iron supplements cut iron deficiency anemia at term by 59% (moderate certainty), though NIH notes that routine iron in women who already have enough may have downsides.",
        "citations": [
          {
            "url": "https://ods.od.nih.gov/factsheets/Pregnancy-HealthProfessional/",
            "label": "NIH Office of Dietary Supplements: Dietary Supplements and Life Stages, Pregnancy"
          }
        ]
      },
      {
        "name": "Choline (choline bitartrate)",
        "text": "Choline needs go up to 450 mg a day in pregnancy, and fewer than 1 in 10 pregnant women get that much from food. Less than half of US prenatal supplements contain any choline, and those that do usually have only a small amount, so this one helps but likely won't cover your whole need.",
        "citations": [
          {
            "url": "https://ods.od.nih.gov/factsheets/Pregnancy-HealthProfessional/",
            "label": "NIH Office of Dietary Supplements: Dietary Supplements and Life Stages, Pregnancy"
          }
        ]
      }
    ],
    "clinicalNote": "All women who could get pregnant are advised to take 400 micrograms of folic acid daily, starting at least a month before conception, because starting at the first prenatal visit is too late to prevent neural tube defects. This prenatal uses methylfolate instead of folic acid. The CDC says there are no studies showing other folate forms prevent these defects, and it still recommends folic acid even for people with MTHFR gene variants. NIH also notes that more prenatal folate or iron is not automatically better: there are upper limits (1,000 mcg a day of supplemental folate and 45 mg a day of iron), so check the totals if you take more than one supplement.",
    "clinicalNoteSources": [
      {
        "url": "https://www.cdc.gov/folic-acid/hcp/clinical-overview/index.html",
        "label": "CDC: Folic Acid, Facts for Clinicians",
        "summary": "Folic acid is the only folate type shown to help prevent neural tube defects; recommends 400 mcg daily starting at least 1 month before conception, regardless of MTHFR genotype."
      },
      {
        "url": "https://ods.od.nih.gov/factsheets/Pregnancy-HealthProfessional/",
        "label": "NIH Office of Dietary Supplements: Dietary Supplements and Life Stages, Pregnancy",
        "summary": "Covers pregnancy needs and upper limits for folate, iron, and choline, and notes 5-MTHF hasn't been tested in trials for neural tube defect prevention."
      }
    ],
    "warnings": [
      "Accidental overdose of iron-containing products is a leading cause of fatal poisoning in children under 6.",
      "Keep this product out of reach of children, and call a doctor or poison control center right away in case of accidental overdose.",
      "Check with your health care practitioner before using it if you are pregnant or nursing."
    ],
    "warningsSource": {
      "url": "https://www.vitacost.com/products/ritual-essential-for-women-prenatal-multivitamin-citrus-60-vegan-capsules-153103",
      "label": "Ritual Essential for Women Prenatal Multivitamin label, as reproduced on Vitacost"
    }
  },
  "p-belly-bandit": {
    "whoItsFor": [
      "Pregnant people with low back or pelvic girdle pain who want some extra support while walking and standing",
      "Those who want a soft, flexible band rather than a rigid brace, since flexible belts are the type studied for pregnancy pain",
      "People already doing exercises or physical therapy for pregnancy pain who want a short-term add-on",
      "Not the pick if the band makes your pain worse: physiotherapy guidance says increased pain while wearing a belt is a reason to stop and get assessed"
    ],
    "howToUse": {
      "intro": "Per physiotherapy and academic medical center guidance on maternity support belts (we couldn't verify Belly Bandit's own written instructions):",
      "steps": [
        "Ask your provider or a pelvic health physiotherapist whether a support belt suits your type of pain.",
        "Follow the maker's fitting instructions so the band supports without squeezing.",
        "Wear it mainly when you're up and moving, and for short periods rather than all day.",
        "Pair it with the exercises and advice your provider gives you, not as the only treatment.",
        "Stop and seek care if pain gets worse, or if back pain comes with contractions, bleeding, leaking fluid or less fetal movement."
      ],
      "sourceUrl": "https://www.stgeorges.nhs.uk/wp-content/uploads/2025/06/PHP_PGP.pdf",
      "sourceLabel": "St George's University Hospitals NHS (gesh): Pregnancy-related pelvic girdle pain"
    },
    "clinicalSources": [
      {
        "url": "https://www.stgeorges.nhs.uk/wp-content/uploads/2025/06/PHP_PGP.pdf",
        "label": "St George's University Hospitals NHS (gesh): Pregnancy-related pelvic girdle pain",
        "summary": "An NHS physiotherapy leaflet that says a pelvic support belt may help if pain stops you moving, and to ask a physiotherapist for advice because it may not suit everyone."
      },
      {
        "url": "https://www.med.umich.edu/1libr/Gyn/BirthCenterTriage/BackPain.pdf",
        "label": "University of Michigan Health: Back Pain in Pregnancy",
        "summary": "Suggests asking your provider about a maternity support belt and calling for care if back pain worsens or comes with contractions, bleeding, fluid leakage or reduced fetal movement."
      }
    ],
    "scienceSources": [
      {
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC7053516/",
        "label": "Liddle & Pennick, Cochrane Database of Systematic Reviews (2015): Interventions for preventing and treating low-back and pelvic pain during pregnancy",
        "summary": "This Cochrane review of pregnancy back and pelvic pain treatments rated the evidence moderate to low quality, with exercise best supported and other options, including support belts, resting on small single studies."
      },
      {
        "url": "https://research.polyu.edu.hk/en/publications/effectiveness-of-maternity-support-belts-in-reducing-low-back-pai/",
        "label": "Journal of Clinical Nursing (2009): Effectiveness of maternity support belts in reducing low back pain during pregnancy, a review",
        "summary": "Found insufficient evidence that maternity belts reduce pregnancy back or pelvic pain and noted reported side effects such as increased pain and skin irritation."
      }
    ],
    "clinicalNote": "Low back and pelvic pain are common in pregnancy, especially later on. A Cochrane review (2013, summarized by WONCA's PEARLS) found that adding a rigid pelvic belt to exercise relieved pelvic or back pain more than usual care alone, and found no clear difference between types of support belts. Overall the evidence was low quality because the studies were small and at high risk of bias, and a soft stretchy band like this one is not the same as the rigid belts studied.",
    "clinicalNoteSources": [
      {
        "url": "https://pubmed.ncbi.nlm.nih.gov/23904227/",
        "label": "Pennick and Liddle, Cochrane Database Syst Rev (2013): Interventions for preventing and treating pelvic and back pain in pregnancy",
        "summary": "Review of 26 trials (4,093 women): adding a rigid pelvic belt to exercise seemed to relieve pelvic or back pain more than usual care alone, based on low-quality evidence from single trials."
      }
    ]
  },
  "p-maude-vibe": {
    "whoItsFor": [
      "People who want a simple, beginner-friendly vibrator for external use with just one button and three speeds",
      "Those who care about body-safe materials: the brand says it's platinum-grade silicone, free of phthalates and latex",
      "Anyone who wants something they can use in the shower or bath",
      "Not the pick if you prefer silicone lube: Maude says silicone and oil-based lubricants will break down the Vibe's silicone"
    ],
    "howToUse": {
      "intro": "Per Maude's instructions:",
      "steps": [
        "Charge it fully for about two hours before first use, and never for more than 3 hours.",
        "Wash it before and after every use with mild unscented soap and water, then let it dry fully.",
        "Use it with a water-based lubricant only.",
        "Press the button to turn it on and cycle through low, medium and high.",
        "Use it externally, and in the shower or bath if you like, but don't fully submerge it.",
        "Store it apart from toys made of other materials, away from extreme heat or cold."
      ],
      "sourceUrl": "https://www.cultbeauty.com/p/maude-vibe-grey/17796764/",
      "sourceLabel": "Cult Beauty: Maude Vibe (brand usage and care details)"
    },
    "clinicalNote": "Vibrator use is common: in a 2009 national survey of 2,056 US women, about half (52.5%) had used one. Women who had used one in the past month tended to report better desire, arousal, lubrication, and orgasm, though the survey can't show that the vibrator caused this. Most users (71.5%) never had side effects, and the ones reported, like brief numbness or irritation, were usually mild and rarely lasted a day or more. The study was funded by a condom maker, Church & Dwight.",
    "clinicalNoteSources": [
      {
        "url": "https://kinseyinstitute.org/pdf/Herbenick%20et%20al%20JSM%202009%20Women%20Vibe%20Final%20in%20Print.pdf",
        "label": "Journal of Sexual Medicine (2009), Herbenick et al.: Prevalence and characteristics of vibrator use by women in the United States",
        "summary": "52.5% of 2,056 women had used a vibrator; recent use was linked with better sexual function scores; side effects were uncommon and mostly short-lived."
      }
    ]
  },
  "p-uberlube": {
    "whoItsFor": [
      "People who want a long-lasting lube that doesn't dry out or get sticky as fast as water-based formulas",
      "Those with sensitive skin who prefer a short, fragrance-free ingredient list with no glycerin or parabens",
      "Couples using latex condoms, which the brand lists as compatible",
      "Not the pick if you use silicone toys: Uberlube says it can degrade silicone, so stick to glass, stainless steel or plastic toys"
    ],
    "howToUse": {
      "intro": "Per Uberlube's directions on its retailer listings:",
      "steps": [
        "Squeeze a small amount onto your fingertips.",
        "Apply it to the clitoris, vulva or wherever you want more glide.",
        "Reapply as needed.",
        "Use it with latex or polyisoprene condoms, not polyurethane ones.",
        "Keep it away from silicone toys, and stop using it if you notice irritation."
      ],
      "sourceUrl": "https://www.superdrug.com/health/sexual-health/lube-gel-jelly-oils/uberlube-silicone-lubricant-112ml/p/mp-00057217",
      "sourceLabel": "Superdrug: Uberlube Silicone Lubricant 112ml"
    },
    "ingredientScience": [
      {
        "name": "Dimethicone, dimethiconol, cyclomethicone (silicones)",
        "text": "These silicone fluids make up the slippery base. A WHO advisory note calls silicone fluids inert and safe, with little effect on latex condoms, but also says there are no published clinical studies backing their use as condom lubricants, so the safety case rests on lab properties more than trials.",
        "citations": [
          {
            "url": "https://www.e-lactancia.org/media/papers/Lubricants-WHO2012.pdf",
            "label": "WHO/UNFPA/FHI360 Advisory Note (2012): Use and procurement of additional lubricants for male and female condoms"
          }
        ]
      }
    ],
    "clinicalNote": "Lubricant can make sex more comfortable and help prevent condoms from tearing. The WHO notes that many water-based lubes are very concentrated (high osmolality), which may damage the lining of the vagina or rectum, a concern that applies to water-based products rather than silicone ones like this. Silicone lubes are compatible with latex and polyurethane condoms and last longer, which also makes them a common pick for anal sex.",
    "clinicalNoteSources": [
      {
        "url": "https://www.e-lactancia.org/media/papers/Lubricants-WHO2012.pdf",
        "label": "WHO/UNFPA/FHI360 Advisory Note (2012): Use and procurement of additional lubricants",
        "summary": "Silicone fluids are inert and compatible with latex; high-osmolality water-based lubes may damage vaginal and anal tissue."
      },
      {
        "url": "https://health.cornell.edu/sites/health/files/pdf-library/Condoms_Lube.pdf",
        "label": "Cornell Health: Condoms and Lube",
        "summary": "Silicone-based lube is safe with latex and polyurethane condoms and is longer-lasting."
      }
    ],
    "warnings": [
      "Some people get slight irritation from silicone-based lube if it isn't washed off soon after vaginal sex."
    ],
    "warningsSource": {
      "url": "https://health.cornell.edu/sites/health/files/pdf-library/Condoms_Lube.pdf",
      "label": "Cornell Health: Condoms and Lube (guidance for silicone-based lubricants)"
    }
  },
  "p-v-wash": {
    "whoItsFor": [
      "Women who want a mild, soap-free wash for the external intimate area as part of a daily routine",
      "People who prefer a lactic acid formula, which the brand says keeps the pH around 3.5 to 4.5",
      "Those going through pregnancy or menopause who have checked with their clinician first, as the brand advises",
      "Not the pick for treating a UTI or ongoing itching: the brand says to stop if irritation occurs and follow your provider's advice for infections"
    ],
    "howToUse": {
      "intro": "Per VWash's instructions:",
      "steps": [
        "Pour a few drops into your hand.",
        "Apply it to the external intimate area only, never inside the vagina.",
        "Rinse the area thoroughly with water.",
        "Stop using it and get medical advice if you notice itching or irritation."
      ],
      "sourceUrl": "https://perfmedicine.apollopharmacy.in/otc/v-wash-plus-intimate-wash-200ml",
      "sourceLabel": "Apollo Pharmacy: VWash Plus Intimate Wash 200ml"
    },
    "ingredientScience": [
      {
        "name": "Tea tree oil",
        "text": "Tea tree oil is mainly used for its antifungal and antibacterial properties, but its evidence is mixed even on regular skin (it may ease athlete's foot but works less well than antifungal medicine). It is a known cause of skin irritation and allergic rash, and Mayo Clinic advises against it if you have eczema or very sensitive skin.",
        "citations": [
          {
            "url": "https://mayoclinic.org/drugs-supplements-tea-tree-oil/art-20364246",
            "label": "Mayo Clinic: Tea tree oil"
          }
        ]
      }
    ]
  },
  "p-sweet-spot-wipes": {
    "whoItsFor": [
      "People who want a quick external refresh after a workout or on a hot day when a shower isn't an option",
      "Those who want something cooling during a hot flash, heavy period day or bladder leaks, which the brand lists as uses",
      "Anyone who likes to keep individually packed wipes in a gym bag or purse",
      "Not the pick if fragrance bothers your skin: some versions list fragrance, and the brand says to stop if a rash or discomfort develops"
    ],
    "howToUse": {
      "intro": "Per SweetSpot Labs' instructions:",
      "steps": [
        "Use the wipe on external skin only, such as the vulva or underarms.",
        "Always wipe front to back when using it on the vulva.",
        "Use it after workouts, during a hot flash, or on heavy-flow or leaky days.",
        "Throw the wipe in the trash rather than flushing it.",
        "Stop using it if a rash or discomfort develops."
      ],
      "sourceUrl": "https://www.ulta.com/p/unscented-gentle-soothing-wipes-pimprod2007177",
      "sourceLabel": "Ulta Beauty: SweetSpot Labs Gentle Soothing Wipes"
    },
    "communityReview": "Reviewers often say the wipes feel gentle and soothing, leave skin soft without drying it out, and are handy to carry. Common complaints are a scent some find strong or artificial, wipes that feel thin or dry, occasional irritation or burning, and a small count for the price.",
    "communityReviewSources": [
      {
        "url": "https://www.ulta.com/p/unscented-gentle-soothing-wipes-pimprod2007177",
        "label": "Ulta Beauty customer reviews: SweetSpot Labs Vanilla Blossom Gentle Soothing Wipes"
      }
    ],
    "ingredientScience": [
      {
        "name": "Aloe (aloe barbadensis leaf juice)",
        "text": "Aloe gel on the skin is generally well tolerated, though there are occasional reports of burning, itching, and rash. Clinical research suggests it may help burns heal, but there isn't reliable evidence that it soothes irritation or eczema, so its role in a wipe is mostly as a gentle, low-risk ingredient.",
        "citations": [
          {
            "url": "https://www.nccih.nih.gov/health/aloe-vera",
            "label": "NCCIH (NIH): Aloe Vera"
          }
        ]
      }
    ],
    "warnings": [
      "For external use only.",
      "If you use it on your vulva, always wipe front to back.",
      "Stop using it if a rash or discomfort develops.",
      "Keep out of the reach and sight of children."
    ],
    "warningsSource": {
      "url": "https://www.ulta.com/p/unscented-gentle-soothing-wipes-pimprod2007177",
      "label": "SweetSpot Labs Unscented Gentle Soothing Wipes label text (Ulta product listing)"
    }
  },
  "p-kindra-lotion": {
    "whoItsFor": [
      "People with vaginal dryness or discomfort from menopause who want a hormone-free daily option",
      "Those with dryness linked to hormonal changes from oral contraceptives, which the brand also names",
      "Anyone who would rather not use vaginal estrogen, or wants a moisturizer to use alongside their doctor's plan",
      "Not the pick if you have ongoing stinging or burning: the brand says to cut back, then stop and see a provider if irritation continues"
    ],
    "howToUse": {
      "intro": "Per Kindra's instructions:",
      "steps": [
        "Wash your hands and put 2 to 3 pumps on a clean, dry finger.",
        "Apply gently to the vulvovaginal area.",
        "Use at least twice a day, ideally morning and night.",
        "Adjust the amount: 1 to 2 pumps for occasional dryness, up to 3 to 4 for extra moisture.",
        "For intimacy, apply externally about 30 minutes beforehand.",
        "Wash your hands after each use."
      ],
      "sourceUrl": "https://mysteryvibe.com/products/daily-v-lotion",
      "sourceLabel": "Kindra Daily V Lotion product page"
    },
    "scienceSources": [
      {
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC10520994/",
        "label": "Albalawi et al., Cureus 2023: vaginal hyaluronic acid vs estrogen for vaginal atrophy (systematic review)",
        "summary": "Across six trials, topical hyaluronic acid (an ingredient in this lotion) relieved vaginal atrophy symptoms and painful sex, and the authors called it a reasonable non-hormonal alternative, though estrogen came out ahead in most comparisons."
      }
    ],
    "ingredientScience": [
      {
        "name": "Sodium hyaluronate (hyaluronic acid)",
        "text": "Hyaluronic acid holds water in tissue, which is why it's used for vaginal dryness. A 2023 review of six small trials in postmenopausal women found it seemed to work about as well as vaginal estrogen for vaginal atrophy (thinning and drying of vaginal tissue), but the authors rated the evidence as weak, and estrogen may still work better for moderate to severe cases.",
        "citations": [
          {
            "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC10520994/",
            "label": "Cureus (2023): Vaginal hyaluronic acid vs estrogen for vaginal atrophy in postmenopausal women, a systematic review (doi:10.7759/cureus.44191)"
          }
        ]
      },
      {
        "name": "Coconut oil",
        "text": "A Cleveland Clinic ob/gyn lists coconut oil as a natural option to ease dryness during sex and says these oils typically don't cause irritation or infection. Oils break down latex, so they shouldn't be used with latex condoms. We found no trials of coconut oil as a daily vaginal moisturizer.",
        "citations": [
          {
            "url": "https://health.clevelandclinic.org/what-can-i-use-instead-of-lube",
            "label": "Cleveland Clinic: What can I use instead of lube?"
          }
        ]
      },
      {
        "name": "Sunflower seed oil",
        "text": "Sunflower oil is another plant oil a Cleveland Clinic ob/gyn lists as a natural lubricant option that typically doesn't cause irritation or infection. Like other oils, it can break down latex condoms. We found no trials of it as a vaginal moisturizer.",
        "citations": [
          {
            "url": "https://health.clevelandclinic.org/what-can-i-use-instead-of-lube",
            "label": "Cleveland Clinic: What can I use instead of lube?"
          }
        ]
      }
    ],
    "warnings": [
      "For external use only, and keep it out of your eyes.",
      "Stop use and ask a doctor if your symptoms get worse, last more than 7 days, or clear up and then come back within a few days.",
      "Keep out of reach of children. If swallowed, get medical help or call Poison Control right away."
    ],
    "warningsSource": {
      "url": "https://otclabels.com/lib/otc/otc-meds/daily-vlotion/",
      "label": "Kindra Daily V Lotion product label (OTC Labels)"
    }
  },
  "p-citracal-bone-health": {
    "whoItsFor": [
      "Postmenopausal women who don't get enough calcium from food and want a supplement with vitamin D3 built in",
      "Women over 50, whose recommended calcium intake rises to 1,200 mg a day per NIH",
      "People with low stomach acid or who take acid reducers, since calcium citrate absorbs well with or without food",
      "Not the pick without checking with your doctor if you take levothyroxine, quinolone antibiotics, lithium or dolutegravir, which NIH says can interact with calcium"
    ],
    "howToUse": {
      "intro": "Per the product listing and NIH calcium guidance:",
      "steps": [
        "Take 2 caplets twice a day, as the listing directs.",
        "Take it with or without food; calcium citrate absorbs either way.",
        "Take the two doses at different times of day, since calcium absorbs best in smaller amounts.",
        "Count calcium from food and drinks too, and stay under 2,000 mg a day total if you're over 50.",
        "Check with your doctor or pharmacist if you take other medicines."
      ],
      "sourceUrl": "https://www.walmart.com/ip/13448582",
      "sourceLabel": "Citracal Maximum Plus product listing (Walmart)"
    },
    "clinicalSources": [
      {
        "url": "https://ods.od.nih.gov/factsheets/Calcium-Consumer",
        "label": "NIH Office of Dietary Supplements: Calcium fact sheet",
        "summary": "Women over 50 need 1,200 mg of calcium a day, calcium citrate absorbs well with or without food, doses of 500 mg or less absorb best, and vitamin D helps the body absorb calcium."
      }
    ],
    "ingredientScience": [
      {
        "name": "Calcium citrate",
        "text": "Calcium is the main mineral in your bones. The citrate form doesn't need much stomach acid to dissolve, so you can take it with or without food, and it causes less gas, bloating, and constipation than calcium carbonate. Your body absorbs calcium best in doses of 500 mg or less at a time.",
        "citations": [
          {
            "url": "https://ods.od.nih.gov/factsheets/Calcium-HealthProfessional/%23h3",
            "label": "NIH Office of Dietary Supplements: Calcium, Fact Sheet for Health Professionals"
          }
        ]
      },
      {
        "name": "Vitamin D3 (cholecalciferol)",
        "text": "Vitamin D helps your gut absorb calcium and supports normal bone mineralization (how bone hardens). D3 raises blood vitamin D levels more, and keeps them up longer, than the D2 form.",
        "citations": [
          {
            "url": "https://ods.od.nih.gov/factsheets/VitaminD-HealthProfessional/",
            "label": "NIH Office of Dietary Supplements: Vitamin D, Fact Sheet for Health Professionals"
          }
        ]
      }
    ],
    "clinicalNote": "Getting enough calcium and vitamin D matters for bone health, and trials suggest the two together may raise bone density a little in some postmenopausal women. Whether supplements prevent fractures is less clear. One meta-analysis of adults over 50 linked calcium plus vitamin D to fewer total and hip fractures, while other reviews found no effect, and the U.S. Preventive Services Task Force found that daily doses of 1,000 mg calcium or less and 400 IU vitamin D or less don't prevent fractures in postmenopausal women. For women over 50, the upper limit for calcium from food and supplements combined is 2,000 mg a day, so it helps to count what you already get from your diet.",
    "clinicalNoteSources": [
      {
        "url": "https://ods.od.nih.gov/factsheets/Calcium-HealthProfessional/%23h3",
        "label": "NIH Office of Dietary Supplements: Calcium, Fact Sheet for Health Professionals",
        "summary": "Covers calcium forms, absorption, upper limits, mixed fracture evidence, kidney stone findings, and drug interactions."
      },
      {
        "url": "https://ods.od.nih.gov/factsheets/VitaminD-HealthProfessional/",
        "label": "NIH Office of Dietary Supplements: Vitamin D, Fact Sheet for Health Professionals",
        "summary": "Explains vitamin D's role in calcium absorption and reviews trials and USPSTF findings on bone density and fractures."
      }
    ],
    "warnings": [
      "Take with a full glass of water while sitting upright.",
      "If you're pregnant, breastfeeding, taking medicine, or have any medical condition, ask a health professional before use.",
      "Older adults, teens, and anyone who has trouble swallowing should check with a health professional before use.",
      "Not for children under 12, and do not take more than the recommended amount."
    ],
    "warningsSource": {
      "url": "https://nz.iherb.com/pr/citracal-maximum-plus-d3-180-coated-caplets/31720",
      "label": "Citracal Maximum Plus + D3 label text (iHerb product listing, 180-caplet size)"
    }
  },
  "d-peanut": {
    "whoItsFor": [
      "Women who want to meet others at the same life stage, from trying to conceive through pregnancy, motherhood and menopause",
      "New and expecting moms looking for local friends or bump buddies due around the same time",
      "Anyone who wants to ask sensitive questions anonymously, using the app's incognito mode",
      "Not a replacement for professional care: research on peer support apps shows mixed effects on loneliness and mood, so see a provider if you're struggling"
    ],
    "howToUse": {
      "intro": "Per Peanut's app store listing:",
      "steps": [
        "Download Peanut for free and set up your profile, which is checked with selfie verification.",
        "Swipe to find women nearby at a similar life stage, then chat once you match.",
        "Join groups on topics like pregnancy, newborn care or menopause.",
        "Use Ask to get advice from members, or turn on Incognito Mode to post anonymously.",
        "Upgrade to Peanut Plus only if you want extra matching features; the core app is free."
      ],
      "sourceUrl": "https://apps.apple.com/au/app/peanut-find-mum-friends/id1178656034",
      "sourceLabel": "Peanut on the Apple App Store"
    },
    "scienceSources": [
      {
        "url": "https://knowledge.lancashire.ac.uk/id/eprint/59049/1/59049%20Vasquez%20et%20al.%20VOR.pdf",
        "label": "Vasquez et al., BMC Psychiatry 2026: perinatal mental health interventions and loneliness (systematic review)",
        "summary": "Across 26 studies, some interventions improved loneliness or feeling supported, but app-based peer support showed mixed results, improving perceived support in some trials without clear mental health gains."
      }
    ],
    "clinicalNote": "Peer support has some research behind it for new moms, especially those at higher risk of postnatal depression (depression after giving birth). A review of seven randomized trials found that telephone peer support lowered depression scores in high-risk women, and peer-led women's groups reduced moderate depression in poorer communities, but other support models showed no clear effect and no single model could be strongly recommended. We found no published studies of Peanut itself, so think of it as a way to find connection, not a treatment.",
    "clinicalNoteSources": [
      {
        "url": "https://www.cambridge.org/core/journals/european-psychiatry/article/systematic-literature-review-of-the-use-of-lay-support-models-in-postnatal-depression/F9873CF2B959245EDA3FB44D4CE98C7E",
        "label": "European Psychiatry (2011): Systematic literature review of the use of lay support models in postnatal depression (conference abstract)",
        "summary": "Reviewed seven randomized trials of peer and lay support for postnatal depression and found benefit for some targeted programs but mixed results overall."
      }
    ],
    "warnings": [
      "The app is rated 18+.",
      "Posts come from other users, and health and wellness topics are part of the community.",
      "The developer says some data, including purchases and sensitive info, may be used to track you across other companies' apps and websites, so check the privacy settings before sharing."
    ],
    "warningsSource": {
      "url": "https://apps.apple.com/app/id1178656034",
      "label": "Peanut on the Apple App Store (developer's listing and privacy label)"
    }
  },
  "p-intimina-lily": {
    "whoItsFor": [
      "People who find standard cups too wide to insert, since Intimina says this cup folds as thin as a tampon",
      "Anyone looking for a reusable, medical-grade silicone alternative to pads and tampons",
      "Those with lighter flow or who haven't given birth vaginally, who suit the smaller Size A",
      "Not the pick if you've had toxic shock syndrome before: Intimina's own label says not to use it"
    ],
    "howToUse": {
      "intro": "Per Intimina's product directions:",
      "steps": [
        "Hold the base, flatten the opening and fold the cup in half.",
        "Angle it toward your tailbone and insert until the removal stem is inside.",
        "Rotate the cup or pull it down slightly, and run a finger around it to check it has opened.",
        "Don't wear it longer than 8 hours at a time.",
        "To remove, grab the stem, squeeze the base to release the seal and gently pull it out.",
        "Use it only during your period and remove it before sex."
      ],
      "sourceUrl": "https://www.superdrug.com/natural-pain-relief/health/womens-intimate-health-care/periods/menstrual-cups/intimina-menstrual-lily-cup-compact-a/p/mp-00440408",
      "sourceLabel": "Intimina Lily Cup Compact product directions (Superdrug)"
    },
    "clinicalSources": [
      {
        "url": "https://health.clevelandclinic.org/menstrual-cup",
        "label": "Cleveland Clinic: What to know about menstrual cups",
        "summary": "Most new users need about three cycles to get comfortable, cups can be worn up to 12 hours, prolapse can affect fit, and cup use may raise the chance of dislodging an IUD."
      }
    ],
    "clinicalNote": "Cleveland Clinic says most people need about three cycles to get the hang of a cup, and a little leaking early on usually improves with practice. If you have an IUD, talk to your provider first, since cup use may make it more likely to shift.",
    "ingredientScience": [
      {
        "name": "Medical-grade silicone",
        "text": "The FDA says menstrual cups are generally made of silicone or rubber, and that you should choose silicone if you're sensitive to latex. We found no studies comparing one brand's silicone to another's.",
        "citations": [
          {
            "url": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-cups",
            "label": "FDA: Menstrual Cups"
          }
        ]
      }
    ],
    "warnings": [
      "Do not use Lily Cup if you have had toxic shock syndrome (TSS) in the past.",
      "Don't wear it for more than 8 hours at a time.",
      "It is not a contraceptive and won't protect against pregnancy or STIs, so remove it before sex.",
      "Stop using it and contact a medical practitioner if you have any pain or discomfort."
    ],
    "warningsSource": {
      "url": "https://www.superdrug.com/natural-pain-relief/health/womens-intimate-health-care/periods/menstrual-cups/intimina-menstrual-lily-cup-compact-a/p/mp-00440408",
      "label": "Intimina Lily Cup Compact label text (Superdrug product listing)"
    }
  },
  "p-hello-disc": {
    "whoItsFor": [
      "Disc users who struggle with removal and want a tab to hook a finger through",
      "People with a high cervix or trouble reaching, who can let the tab hang down for easier grip",
      "Those with heavy flow who want more capacity than a tampon or pad, since discs held the most blood in lab testing",
      "Not the pick if you'd rather skip a learning curve: discs take practice and may not fit every body"
    ],
    "howToUse": {
      "intro": "Per the Hello Disc quick-start guide from retailer Period Nirvana:",
      "steps": [
        "Boil the disc before first use, keeping it off the bottom of the pot.",
        "Pick a tab style: tucked for a low cervix or sex, dropped for a high cervix or reach issues.",
        "Fold the disc lengthwise and insert it angled toward your tailbone, tab last.",
        "Push it in as far as it goes, then lift the front edge up behind your pubic bone.",
        "To remove, hook a finger through one of the tab loops and let the disc tip back as you pull.",
        "Wear a backup liner or period underwear while you're learning."
      ],
      "sourceUrl": "https://shop.periodnirvana.com/blogs/articles/hello-disc-quick-start",
      "sourceLabel": "Period Nirvana: Hello Disc quick start"
    },
    "clinicalSources": [
      {
        "url": "https://www.nj.gov/health/womenshealth/reproductive-health/periods-menstruation/period-products/menstrual-discs.shtml",
        "label": "New Jersey Department of Health: Menstrual discs",
        "summary": "Discs sit behind the cervix, can be worn up to 12 hours, should be boiled before first use and between cycles, and may not suit everyone because of vaginal shape or cervix position."
      }
    ],
    "clinicalNote": "The New Jersey Department of Health says discs can be worn up to 12 hours and expects a learning curve to get a secure fit. Wash your hands before inserting or removing, and replace the disc if it tears or cracks.",
    "scienceSources": [
      {
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC10847380/",
        "label": "DeLoughery et al., BMJ Sexual & Reproductive Health: Red blood cell capacity of modern menstrual products",
        "summary": "In lab testing with real blood, menstrual discs held the most of any product type, about 61 mL on average, versus roughly 20 to 50 mL for tampons, pads and cups."
      },
      {
        "url": "https://public-pages-files-2025.frontiersin.org/journals/reproductive-health/articles/10.3389/frph.2025.1740096/pdf",
        "label": "Mason et al., Frontiers in Reproductive Health 2026: experiences using a menstrual disc (qualitative study)",
        "summary": "Women given a disc in a Kenyan trial often needed several tries at first, but by month three most used it without leakage or pain and wanted to keep using it."
      }
    ],
    "ingredientScience": [
      {
        "name": "Medical-grade silicone",
        "text": "The FDA says menstrual cups and discs are generally made of silicone or rubber, and that you should choose silicone if you're sensitive to latex. We found no studies comparing one brand's silicone to another's.",
        "citations": [
          {
            "url": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-cups",
            "label": "FDA: Menstrual Cups"
          }
        ]
      }
    ],
    "warnings": [
      "Menstrual cups and discs have been linked to toxic shock syndrome (TSS), a rare but serious illness. If you get a fever, vomiting, or diarrhea during your period, remove the disc and get medical advice right away.",
      "Do not leave the disc in for more than 12 hours.",
      "It is not birth control and won't prevent pregnancy.",
      "If condoms are your only birth control, remove the disc before sex, since friction could cause a tiny tear in the condom."
    ],
    "warningsSource": {
      "url": "https://www.chemistwarehouse.co.nz/buy/122640/hello-period-menstrual-disc",
      "label": "Hello Disc label text (Chemist Warehouse NZ product listing)"
    }
  },
  "p-saalt-disc": {
    "whoItsFor": [
      "People who want a reusable disc that sits higher than a cup and can be worn up to 12 hours",
      "Those with heavier flow, since discs held the most blood of any product type in lab testing",
      "First-time and experienced disc users alike, which Saalt says the disc is designed for",
      "Not the pick for postpartum bleeding: Saalt says not to use it then, and to check with your doctor first if you have an IUD or ring"
    ],
    "howToUse": {
      "intro": "Per Saalt's own instructions:",
      "steps": [
        "Boil the disc for 4 to 5 minutes before first use, then wash your hands and the disc.",
        "Pinch the rim into a figure 8 and insert it angled toward your tailbone, notch last.",
        "Tuck the front edge up behind your pubic bone and check you can't feel your cervix outside the disc.",
        "Empty and reinsert at least every 12 hours.",
        "To remove, hook a finger on the notch or rim and pull it out level to avoid spills.",
        "Rinse in cold water, wash after each use, and boil or wipe with 70% alcohol between cycles."
      ],
      "sourceUrl": "https://saalt.com/pages/disc-instructions",
      "sourceLabel": "Saalt Disc instructions"
    },
    "clinicalSources": [
      {
        "url": "https://www.nj.gov/health/womenshealth/reproductive-health/periods-menstruation/period-products/menstrual-discs.shtml",
        "label": "New Jersey Department of Health: Menstrual discs",
        "summary": "Discs sit behind the cervix, can be worn up to 12 hours, should be boiled before first use and between cycles, and may not suit everyone because of vaginal shape or cervix position."
      }
    ],
    "clinicalNote": "The New Jersey Department of Health says to expect a learning curve with a disc, to wash your hands before inserting or removing it, and to store it in a breathable pouch, never an airtight container.",
    "scienceSources": [
      {
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC10847380/",
        "label": "DeLoughery et al., BMJ Sexual & Reproductive Health: Red blood cell capacity of modern menstrual products",
        "summary": "In lab testing with real blood, menstrual discs held the most of any product type, about 61 mL on average, versus roughly 20 to 50 mL for tampons, pads and cups."
      }
    ],
    "ingredientScience": [
      {
        "name": "Medical-grade silicone",
        "text": "The FDA says menstrual cups and discs are generally made of silicone or rubber, and that you should choose silicone if you're sensitive to latex. We found no studies comparing one brand's silicone to another's.",
        "citations": [
          {
            "url": "https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-cups",
            "label": "FDA: Menstrual Cups"
          }
        ]
      }
    ],
    "warnings": [
      "If you have an IUD, talk to your doctor first, since removing a disc could pull on the IUD string.",
      "If you use an IUD and still get periods, check your IUD string after each period for any change in length or feel.",
      "The Saalt Disc is not a contraceptive and won't protect against STIs."
    ],
    "warningsSource": {
      "url": "https://saalt.com/blogs/news/can-you-use-a-menstrual-cup-with-an-iud",
      "label": "Saalt: Can you use a menstrual disc or cup with an IUD?"
    }
  },
  "p-knix-underwear": {
    "whoItsFor": [
      "People who want reusable period protection that looks and feels like regular underwear",
      "Light to moderate flow days, or as backup with a tampon or cup on heavier days",
      "Those whose skin gets irritated by disposable pads, which Cleveland Clinic names as a reason to try period underwear",
      "Not the pick as your only protection for heavy bleeding: lab testing found period underwear holds far less than discs, cups, tampons or pads"
    ],
    "howToUse": {
      "intro": "Per Knix's care guide and Cleveland Clinic's general guidance:",
      "steps": [
        "Pick the absorbency for your day: Light for lighter flow, Super for heavy days and overnight.",
        "Wear them alone or as backup with a tampon or cup.",
        "Change into a fresh pair at least every 12 hours, sooner on heavy days.",
        "Rinse after wearing, then machine wash cold with a mild detergent.",
        "Lay flat to dry or tumble dry on low, and skip fabric softener, bleach and ironing."
      ],
      "sourceUrl": "https://knix.ca/blogs/knix-blog/washing-period-underwear",
      "sourceLabel": "Knix: How to wash period underwear"
    },
    "clinicalSources": [
      {
        "url": "https://health.clevelandclinic.org/does-period-underwear-work",
        "label": "Cleveland Clinic: Does period underwear work?",
        "summary": "Period underwear usually holds about one to two tampons' worth of flow, shouldn't be worn more than 12 hours, and can be a good option if pads irritate your skin."
      }
    ],
    "clinicalNote": "Cleveland Clinic says most pairs hold about one to two tampons' worth of flow, so plan on five to seven pairs per cycle and change more often on heavy days. Don't wear the same pair longer than 12 hours.",
    "scienceSources": [
      {
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC10847380/",
        "label": "DeLoughery et al., BMJ Sexual & Reproductive Health: Red blood cell capacity of modern menstrual products",
        "summary": "In lab testing with real blood, period underwear held only a few mL, far less than other products, and the authors say it is unlikely to work on its own for heavy bleeding."
      }
    ],
    "warnings": [
      "Wash your period underwear after every single use.",
      "Machine wash on cold with a mild, ideally unscented detergent, and don't use bleach.",
      "Lay them flat to dry.",
      "Try them first at home on your lightest flow day to see how they work for you."
    ],
    "warningsSource": {
      "url": "https://knix.ca/blogs/resources/how-often-should-you-change-your-period-underwear",
      "label": "Knix: How often should you change your period underwear?"
    }
  },
  "p-bambody-underwear": {
    "whoItsFor": [
      "Budget shoppers who want washable period underwear for light to medium flow",
      "People who want a backup layer under a tampon or cup, or extra security for sports and sleep",
      "Teens and adults alike, since Bambody markets its absorbent panties to both",
      "Not the pick as your only protection for heavy bleeding: lab testing found period underwear holds far less than discs, cups, tampons or pads"
    ],
    "howToUse": {
      "intro": "We couldn't find Bambody's own instructions, so these follow Cleveland Clinic's general period underwear guidance:",
      "steps": [
        "Test a pair at home on a light-flow day first.",
        "Wear them alone on lighter days, or with a tampon or cup for extra protection.",
        "Change into a fresh pair at least every 12 hours, sooner on heavy days.",
        "Wash them gently on their own with a mild, unscented detergent and an extra rinse.",
        "Skip fabric softener and air-dry them."
      ],
      "sourceUrl": "https://health.clevelandclinic.org/does-period-underwear-work",
      "sourceLabel": "Cleveland Clinic: Does period underwear work?"
    },
    "scienceSources": [
      {
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC10847380/",
        "label": "DeLoughery et al., BMJ Sexual & Reproductive Health: Red blood cell capacity of modern menstrual products",
        "summary": "In lab testing with real blood, period underwear held only a few mL, far less than other products, and the authors say it is unlikely to work on its own for heavy bleeding."
      }
    ],
    "ingredientScience": [
      {
        "name": "Bamboo viscose",
        "text": "Bamboo viscose is a kind of rayon: plant cellulose (here from bamboo) dissolved with chemicals and spun into a soft fiber. The US Federal Trade Commission says rayon made from bamboo does not keep the bamboo plant's natural antimicrobial properties, so any benefit comes from how the fabric feels and breathes, not from the bamboo itself. We found no studies on bamboo viscose and vaginal or vulvar irritation.",
        "citations": [
          {
            "url": "https://www.ftc.gov/node/44492",
            "label": "US Federal Trade Commission (2009): FTC Charges Companies with 'Bamboo-zling' Consumers with False Product Claims"
          }
        ]
      }
    ],
    "clinicalNote": "Period underwear is underwear with built-in absorbent layers that you wear instead of, or as backup to, a pad or tampon. A Cleveland Clinic ob/gyn says most pairs hold about 1 to 2 tampons' worth of flow, and that they can help people whose skin gets irritated by pads. She advises wearing one pair no more than 12 hours, changing sooner on heavy days, and washing them gently with a mild, unscented detergent and no fabric softener, since leftover detergent can irritate skin. Trying a pair at home on a light day first is a low-stress way to check fit and leaks.",
    "clinicalNoteSources": [
      {
        "url": "https://health.clevelandclinic.org/does-period-underwear-work",
        "label": "Cleveland Clinic Health Essentials: Does period underwear work?",
        "summary": "Ob/gyn Karmon James, MD, on capacity (1 to 2 tampons), a 12-hour wear limit, washing, and who period underwear suits."
      }
    ],
    "warnings": [
      "Do not wear the same pair for more than 12 hours, and change sooner on your heaviest days.",
      "Wash with a mild, unscented, dye-free detergent and skip fabric softener; leftover detergent can irritate your skin.",
      "If you mainly need protection from urine leaks, choose a product designed for that."
    ],
    "warningsSource": {
      "url": "https://health.clevelandclinic.org/does-period-underwear-work",
      "label": "Cleveland Clinic Health Essentials: Does period underwear work? (no brand page or label found for Bambody)"
    }
  },
  "p-bodily-kit": {
    "whoItsFor": [
      "Anyone packing a hospital bag who wants the basic postpartum recovery items in one box",
      "People recovering from a vaginal birth, who Bodily says the kit is especially suited to",
      "Gift-givers looking for a practical present for someone about to give birth",
      "Not the pick if you want to return what you don't use: the kit is final sale"
    ],
    "howToUse": {
      "intro": "Per Bodily's product page:",
      "steps": [
        "Pack the kit in your hospital bag so it's ready right after birth.",
        "Wear the mesh undies to hold large postpartum pads in place.",
        "Use the angled peri bottle to rinse your perineal area hands-free after using the toilet.",
        "To inflate the cushion, pull out the red valve, blow in air to the firmness you like, then push the valve back down.",
        "Machine wash the mesh undies cold on a delicate cycle and line dry; hand wash the peri bottle."
      ],
      "sourceUrl": "https://itsbodily.com/products/postpartum-recovery-kit-save-11",
      "sourceLabel": "Bodily Postpartum Recovery Kit product page"
    },
    "clinicalNote": "The kit's items match common hospital advice for the first weeks after a vaginal birth, when the perineum (the skin and muscle between the vagina and anus) is often sore or stitched. Boston Medical Center advises spraying warm water on the area after you pee or poop and patting it dry, and changing your pad every 2 to 4 hours. NHS guidance says pouring water over the area as you pee helps stop stinging and keeps it clean, and suggests breathable cotton or disposable briefs with loose clothing. Neither source mentions sitting cushions, so we could not find guidance for or against the inflatable cushion.",
    "clinicalNoteSources": [
      {
        "url": "https://www.bmc.org/bump-beyond/postpartum-experience/physical-health/perineal-care",
        "label": "Boston Medical Center, Bump & Beyond: Perineal care",
        "summary": "Recommends a warm-water spray bottle after toileting, frequent pad changes, cold packs, sitz baths, and calling OB/GYN for fever, more pain or smelly discharge."
      },
      {
        "url": "https://www.therotherhamft.nhs.uk/node/691/printable/print",
        "label": "The Rotherham NHS Foundation Trust: Caring for your perineum after giving birth",
        "summary": "NHS leaflet on keeping stitches clean, pouring water while peeing, breathable underwear, and signs of infection."
      }
    ],
    "warnings": [
      "Call your OB/GYN right away if you have a fever of 100.4 F or higher, more pain, or a foul-smelling discharge.",
      "Signs your stitches may be infected include redness, a smelly discharge, new or growing swelling or pain, or feeling feverish and unwell.",
      "Change your pad often and wash your hands before changing it, to lower the risk of infection."
    ],
    "warningsSource": {
      "url": "https://www.bmc.org/bump-beyond/postpartum-experience/physical-health/perineal-care",
      "label": "Boston Medical Center: Perineal care (first warning); The Rotherham NHS Foundation Trust: Caring for your perineum after giving birth (second and third). Bodily's product page lists no safety warnings."
    }
  },
  "p-haakaa-pump": {
    "whoItsFor": [
      "Breastfeeding parents who want to catch let-down from one breast while baby feeds on the other",
      "Anyone who wants a cheap, cordless, one-piece pump that's easy to clean and travel with",
      "Those building a small milk stash without a full electric pump setup"
    ],
    "howToUse": {
      "intro": "Per Haakaa's product instructions and FDA and CDC breast pump guidance:",
      "steps": [
        "Sterilize the pump before first use by boiling it for a few minutes.",
        "Center your nipple in the neck of the pump and press the flange against your breast until it seals comfortably.",
        "Squeeze the base to create suction, then let go and let it collect.",
        "Remove it when the flow slows or it's full, and pour the milk into a storage container.",
        "Rinse and wash it after every use, and don't share it, since manual pumps are single-user devices."
      ],
      "sourceUrl": "https://www.babylist.com/gp/haakaa-silicone-breast-pump/14358/30613",
      "sourceLabel": "Haakaa Silicone Breast Pump product directions (Babylist)"
    },
    "clinicalSources": [
      {
        "url": "https://www.fda.gov/ForConsumers/ConsumerUpdates/ucm335261.htm",
        "label": "FDA: What to know when buying or using a breast pump",
        "summary": "Manual pumps are single-user medical devices that should never be shared or bought secondhand, and milk-contact parts should be rinsed, washed and air-dried after each use."
      },
      {
        "url": "https://www.cdc.gov/hygiene/childcare/breast-pump.html",
        "label": "CDC: How to clean and sanitize breast pumps",
        "summary": "Clean pump parts after every use and sanitize at least daily, especially if your baby is under 2 months old, premature or has a weakened immune system."
      }
    ],
    "clinicalNote": "The FDA says manual pumps are single-user devices, so don't share one or buy it secondhand. The CDC recommends cleaning milk-contact parts after every use and sanitizing daily if your baby is young, premature or immunocompromised.",
    "warnings": [
      "Clean after every use and sterilise by steam or by boiling for 2 to 3 minutes; do not use bleach, sterilising tablets or UV sterilisers.",
      "Check it regularly and replace it if you see any signs of damage.",
      "It is not a toy; adult supervision is required.",
      "It should not hurt your nipples; if it does, Haakaa says the suction is probably too strong."
    ],
    "warningsSource": {
      "url": "https://www.haakaa.co.nz/products/silicone-breast-pump",
      "label": "Haakaa: Silicone Breast Pump product page (care and caution); suction note from haakaa.co.nz/pages/faq"
    }
  },
  "p-silverette-cups": {
    "whoItsFor": [
      "Breastfeeding parents with sore or cracked nipples who want to protect them between feeds",
      "Anyone who'd rather avoid creams and balms on their nipples",
      "Those who keep breastfeeding through nipple pain while they work on latch with a midwife or lactation consultant",
      "Not a fix for poor latch: the NHS says sore nipples usually come from attachment issues, so get latch help early"
    ],
    "howToUse": {
      "intro": "Per Silverette's directions:",
      "steps": [
        "After a feed, add a few drops of breast milk to each cup.",
        "Place a cup directly over each nipple.",
        "Keep them on as much as you can between feeds.",
        "Take them off before you nurse.",
        "Don't combine them with other nipple creams or treatments."
      ],
      "sourceUrl": "https://www.naturalresources-sf.com/products/silverette-silver-nursing-cups",
      "sourceLabel": "Silverette Nursing Cups directions (Natural Resources)"
    },
    "clinicalSources": [
      {
        "url": "https://www.nhs.uk/conditions/baby/breastfeeding-and-bottle-feeding/breastfeeding-problems/sore-nipples/",
        "label": "NHS: Sore or cracked nipples when breastfeeding",
        "summary": "Sore nipples are usually caused by poor attachment; for cracked nipples the NHS suggests dabbing on breast milk after feeds or using silver nipple cups between feeds."
      }
    ],
    "clinicalNote": "The NHS lists silver nipple cups as one option for cracked nipples between feeds, but says soreness usually comes from how baby is attached. Get help early from a midwife or breastfeeding supporter if feeds hurt every time or nipples crack or bleed, since that raises infection risk.",
    "scienceSources": [
      {
        "url": "https://pubmed.ncbi.nlm.nih.gov/25989381/",
        "label": "Marrazzu et al., Breastfeeding Medicine 2015: silver cap for nipple fissures (randomized trial)",
        "summary": "In 40 breastfeeding women with nipple fissures, those using a silver cap had pain resolve faster by day 7 and 15 than those on standard care, with no reactions reported."
      }
    ],
    "warnings": [
      "Take the cups off before you breastfeed.",
      "Do not use other nipple treatments, like creams, together with the cups; the brand says this may make them work less well.",
      "Wash them every day with warm water to remove milk residue."
    ],
    "warningsSource": {
      "url": "https://jilliansdrawers.com/products/silverette-silver-nursing-cups",
      "label": "Jillian's Drawers: Silverette Silver Nursing Cups (brand how-to-use instructions, retailer copy)"
    }
  },
  "p-hatch-oil": {
    "whoItsFor": [
      "Pregnant and postpartum people with dry, itchy skin on the belly, breasts or hips",
      "Anyone who wants a quick-drying body oil they can keep using after birth",
      "Those who enjoy a nightly skin routine, with realistic expectations about stretch marks",
      "Not the pick if you want proven stretch mark prevention: a Cochrane review found no high-quality evidence that any topical product prevents them"
    ],
    "howToUse": {
      "intro": "Per Hatch Mama's directions:",
      "steps": [
        "Massage it gently onto your bump, breasts, hips or anywhere that feels dry.",
        "Apply at least twice a day.",
        "Keep using it through pregnancy and postpartum.",
        "Add a few drops to bath water to help seal in moisture."
      ],
      "sourceUrl": "https://bluemercury.com/products/hatch-mama-belly-oil",
      "sourceLabel": "Hatch Mama Belly Oil product page (Bluemercury)"
    },
    "scienceSources": [
      {
        "url": "https://www.cochrane.org/CD000066/PREG_topical-preparations-for-preventing-stretch-marks-in-pregnancy",
        "label": "Brennan et al., Cochrane 2012: Topical preparations for preventing stretch marks in pregnancy",
        "summary": "Across six trials with 800 women, there was no high-quality evidence that any topical cream or oil prevents stretch marks in pregnancy."
      }
    ],
    "ingredientScience": [
      {
        "name": "Calendula flower extract",
        "text": "Calendula (pot marigold) is used to soothe dry, irritated skin. A 2019 systematic review of 14 studies found some support for it in wound healing, but the human trials were few and mixed, and none looked at stretch marks, so the evidence for this use is weak.",
        "citations": [
          {
            "url": "https://ecite.utas.edu.au/133286",
            "label": "Wound Repair and Regeneration (2019): A systematic review of Calendula officinalis extract for wound healing (Givol et al.)"
          }
        ]
      },
      {
        "name": "Tocopherol (vitamin E) and olive oil",
        "text": "These help keep skin soft. A Cochrane review of 6 trials (800 women) tested creams and oils that all contained vitamin E, including olive oil, and found they did not prevent stretch marks in pregnancy compared with placebo or nothing.",
        "citations": [
          {
            "url": "https://www.cochrane.org/CD000066",
            "label": "Cochrane: Topical preparations for preventing stretch marks in pregnancy (Brennan, Young, Devane)"
          }
        ]
      }
    ],
    "clinicalNote": "Stretch marks are very common in pregnancy, and moisturizing oils can make tight, itchy skin feel more comfortable. But a Cochrane review of 6 trials with 800 women found no high-quality evidence that any cream or oil prevents stretch marks or makes them less severe. So think of a belly oil as comfort for dry skin rather than a way to stop stretch marks.",
    "clinicalNoteSources": [
      {
        "url": "https://www.cochrane.org/CD000066",
        "label": "Cochrane: Topical preparations for preventing stretch marks in pregnancy",
        "summary": "Six trials, 800 women: no significant difference in stretch marks with topical products versus placebo or no treatment, and no high-quality evidence for any product."
      }
    ]
  },
  "p-willow-pump": {
    "whoItsFor": [
      "Pumping parents who need to move around, work or care for other kids while they pump",
      "People who want a cordless pump that fits inside a bra, with milk going straight into a sealed bag or container",
      "Those willing to spend time on flange sizing and setup to get a good fit",
      "Not the pick if you want to share or buy secondhand: the FDA says single-user pumps should never be shared"
    ],
    "howToUse": {
      "intro": "Per Willow's own instructions:",
      "steps": [
        "Charge the pump and check that your flange size lets your nipple move freely without pain or redness.",
        "Assemble the flange, Flextube and milk bag or container, then snap the parts onto the pump.",
        "Put it in a supportive bra with your nipple centered, and press firmly as it starts so it latches.",
        "Lean back slightly during stimulation, then move freely once it switches to expression.",
        "Pause before removing, then wash the flange, Flextube and container after every use.",
        "Replace flanges and Flextubes every 3 months."
      ],
      "sourceUrl": "https://onewillow.com/blog/how-to-use-willow-pump/",
      "sourceLabel": "Willow: How to use the Willow pump"
    },
    "clinicalSources": [
      {
        "url": "https://www.fda.gov/ForConsumers/ConsumerUpdates/ucm335261.htm",
        "label": "FDA: What to know when buying or using a breast pump",
        "summary": "Breast pumps are FDA-regulated devices; battery-powered models suit pumping away from home, and single-user pumps should never be shared, rented or bought secondhand."
      },
      {
        "url": "https://www.cdc.gov/hygiene/childcare/breast-pump.html",
        "label": "CDC: How to clean and sanitize breast pumps",
        "summary": "Clean pump parts after every use, sanitize at least daily for babies under 2 months, premature or immunocompromised, and air-dry parts without towel-rubbing."
      }
    ],
    "clinicalNote": "The FDA notes battery-powered pumps suit pumping at work or on the go, and that single-user pumps shouldn't be shared or bought used. The CDC recommends washing milk-contact parts after every use and sanitizing daily for young or premature babies.",
    "warnings": [
      "Do not share, rent or buy a used single-user pump; a contaminated pump can give you and your baby an infection.",
      "Clean the parts that touch milk after every use: rinse in cool water, wash in warm soapy water, rinse in hot water and air dry.",
      "If you have pain or get hurt while pumping, contact your health care provider.",
      "For problems with suction or the motor, contact the manufacturer."
    ],
    "warningsSource": {
      "url": "https://www.fda.gov/consumers/consumer-updates/what-know-when-buying-or-using-breast-pump",
      "label": "FDA: What to know when buying or using a breast pump"
    }
  },
  "p-boppy-pillow": {
    "whoItsFor": [
      "Breastfeeding or bottle-feeding parents who want to raise baby to a comfortable height without hunching",
      "Anyone recovering from birth who finds it hard to hold baby in position for a whole feed",
      "Parents who feed sitting up on a couch or chair",
      "Not for baby sleep, ever: Boppy says to use it only while baby is awake and supervised, and never on a bed or in a crib"
    ],
    "howToUse": {
      "intro": "Per Boppy's safe use instructions:",
      "steps": [
        "Sit down first, and use it only while you're sitting.",
        "Wrap it around your waist with the opening at your back or side.",
        "Rest baby on the pillow and feed in whatever hold is comfortable.",
        "Use it only while baby is awake and never leave baby on it alone.",
        "Don't use it on a bed or anywhere you might fall asleep while feeding.",
        "Wash the cover on a delicate cycle up to 30°C and tumble dry low."
      ],
      "sourceUrl": "https://boppy.com/pages/original-nursing-support-safe-use-and-product-care",
      "sourceLabel": "Boppy Original Nursing Support: safe use and product care"
    },
    "clinicalNote": "A nursing pillow is meant for one job: holding your baby at a comfortable height while you feed, sitting up and awake. The US Consumer Product Safety Commission (CPSC) knows of 154 infant deaths and 64 injuries from 2010 to 2022 linked to nursing pillows, mostly from suffocation or a baby being left in one. That led to a federal safety standard for nursing pillows approved in 2024. CPSC's advice is simple: use it only for feeding, never for sleep or lounging, and if your baby dozes off while feeding, move them to a flat, bare crib, bassinet or play yard.",
    "clinicalNoteSources": [
      {
        "url": "https://www.cpsc.gov/Newsroom/News-Releases/2024/CPSC-Approves-New-Federal-Safety-Standard-for-Nursing-Pillows-to-Prevent-Infant-Deaths-and-Serious-Injuries",
        "label": "US Consumer Product Safety Commission (2024): New federal safety standard for nursing pillows",
        "summary": "Reports 154 infant deaths and 64 injuries tied to nursing pillows from 2010 to 2022 and gives safe-use advice for parents."
      }
    ],
    "warnings": [
      "Never let your baby sleep on the pillow or lie face down on it.",
      "Never leave your baby unattended; use it only while you are sitting up and your baby is awake.",
      "Do not use it in a crib, bassinet, play yard or on a bed, or anywhere a baby may sleep.",
      "Do not set it on a raised surface except when it is supporting your baby on your lap."
    ],
    "warningsSource": {
      "url": "https://boppy.com/pages/original-nursing-support-safe-use-and-product-care",
      "label": "Boppy: Original Nursing Support safe use and product care"
    }
  },
  "p-snoogle-pillow": {
    "whoItsFor": [
      "Pregnant people who want support for the belly, back, hips and legs in one pillow",
      "Anyone in the third trimester trying to stay on their side, which NHS guidance advises from 28 weeks",
      "Side sleepers who already stack several pillows and want one that does the job",
      "Not the pick if you need a fully machine-washable pillow: only the cover goes in the wash"
    ],
    "howToUse": {
      "intro": "Per Leachco's product listing and NHS pregnancy sleep guidance:",
      "steps": [
        "Use it to support your tummy, back, hips and legs while you lie on your side.",
        "From 28 weeks, go to sleep on your side, including for naps and when you fall back asleep at night.",
        "Use it for upper or lower body elevation when you need it.",
        "Remove the cover and machine wash it warm on a gentle cycle.",
        "Spot clean the pillow itself, don't machine wash it, and fluff it if the filling clumps."
      ],
      "sourceUrl": "https://www.walmart.com/ip/Snoogle/1133546673",
      "sourceLabel": "Leachco Snoogle Total Body Pillow listing (Walmart)"
    },
    "clinicalSources": [
      {
        "url": "https://coch.nhs.uk/all-services/maternity-services/your-pregnancy/safe-sleep-during-pregnancy.aspx",
        "label": "Countess of Chester Hospital NHS Foundation Trust: Safe sleep during pregnancy",
        "summary": "From 28 weeks, go to sleep on your side, since going to sleep on your back is linked to a higher risk of stillbirth; this applies to naps and night waking too."
      }
    ],
    "clinicalNote": "NHS guidance says that from 28 weeks you should go to sleep on your side, because going to sleep on your back is linked to a higher risk of stillbirth. That applies to naps and to falling back asleep after waking in the night.",
    "scienceSources": [
      {
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC6543252/",
        "label": "Cronin et al., EClinicalMedicine 2019: going-to-sleep position and late stillbirth (individual participant data meta-analysis)",
        "summary": "Across five studies and over 3,000 women, going to sleep on your back after 28 weeks was linked to about 2.6 times the odds of late stillbirth, while left and right side sleeping were similarly safe."
      }
    ],
    "warnings": [
      "For adult use only; do not let children under 2 use this pillow.",
      "To prevent suffocation, never put it in a crib, play pen or bassinet, or near anywhere a baby may sleep.",
      "Keep it away from heat and open flame."
    ],
    "warningsSource": {
      "url": "https://well.ca/products/leachco-snoogle-chic-total-body-pillow_129572.html",
      "label": "Well.ca: Leachco Snoogle Chic Total Body Pillow (label safety precautions, retailer copy)"
    }
  },
  "p-dame-arc": {
    "whoItsFor": [
      "People who want a curved vibrator for internal G-spot stimulation that can also be used externally",
      "Anyone who wants a waterproof, body-safe silicone toy that's easy to clean",
      "Those who like separate controls for pattern and intensity",
      "Not for anal use: Dame says the base isn't flared enough"
    ],
    "howToUse": {
      "intro": "Per Dame's Arc manual:",
      "steps": [
        "Fully charge Arc before first use.",
        "Hold the power button to turn it on, then press it to cycle through patterns.",
        "Use the intensity button to turn the strength up or down on any pattern.",
        "Use a water-based lube, never silicone-based, which can damage the toy.",
        "Wash it after every use with soap and water or a toy cleaner, and dry it fully.",
        "Store it apart from other toys, away from extreme heat or cold."
      ],
      "sourceUrl": "https://cdn.shopify.com/s/files/1/1027/2873/files/Arc_Manual.pdf",
      "sourceLabel": "Dame Arc user manual"
    },
    "scienceSources": [
      {
        "url": "https://kinseyinstitute.org/pdf/Herbenick%20et%20al%20JSM%202009%20Women%20Vibe%20Final%20in%20Print.pdf",
        "label": "Herbenick et al., Journal of Sexual Medicine 2009: vibrator use by women in the US (national survey)",
        "summary": "In a national survey of 2,056 women, about half had used a vibrator, users scored higher on most sexual function measures, and side effects like numbness or irritation were uncommon and usually brief (the survey was industry-funded and can't show cause and effect)."
      }
    ],
    "clinicalNote": "Vibrators are common: in a US national survey of 2,056 women, 52.5% had used one. Recent users scored higher on most measures of sexual function, like desire, arousal, lubrication and orgasm, though the survey can't show the vibrator caused that, and it was funded by a condom maker. Most users (71.5%) never had genital side effects; when they did, they were usually mild and short, like brief numbness or irritation. A hospital patient guide suggests starting on the lowest setting, using a water-based lube, and stopping if anything hurts.",
    "clinicalNoteSources": [
      {
        "url": "https://kinseyinstitute.org/pdf/Herbenick%20et%20al%20JSM%202009%20Women%20Vibe%20Final%20in%20Print.pdf%20et%20al%20JSM%202009%20Women%20Vibe%20Final%20in%20Print.pdf",
        "label": "Journal of Sexual Medicine (2009): Prevalence and characteristics of vibrator use by women in the United States (Herbenick et al.)",
        "summary": "Nationally representative survey: 52.5% of women had used a vibrator, use was linked to better sexual function scores, and side effects were uncommon and mostly mild."
      }
    ],
    "warnings": [
      "Do not use silicone-based lube with Arc; use water-based.",
      "Do not insert anally; the base is not flared enough.",
      "Clean after every use with soap and water or a water-based toy cleaner; never use alcohol, petroleum or acetone, and do not boil it or put it in the dishwasher."
    ],
    "warningsSource": {
      "url": "https://cdn.shopify.com/s/files/1/1027/2873/files/Arc_Manual.pdf",
      "label": "Dame Arc user manual (PDF)"
    }
  },
  "p-lelo-sona": {
    "whoItsFor": [
      "People who find direct vibration on the clitoris too intense and want a sonic, indirect sensation",
      "Anyone who likes firm pressure, since LELO's Cruise Control keeps the power steady when you press harder",
      "Those who want a fully waterproof toy for the bath or shower",
      "Not the pick for internal use: it's designed for external clitoral stimulation"
    ],
    "howToUse": {
      "intro": "Per LELO's product directions:",
      "steps": [
        "Charge it for 2 hours before first use.",
        "Press + to turn it on, then use the middle button to switch between 8 patterns.",
        "Adjust strength with + and -, and hold - to turn it off.",
        "Rest it lightly or press it firmly over the clitoral area; it isn't meant for direct contact.",
        "Use only a water-based lube, never silicone-based.",
        "Clean it with toy cleaner after use and store it away from heat and sunlight."
      ],
      "sourceUrl": "https://www.superdrug.com/health/sexual-health/vibrators-adult-toys/vibrators/lelo-sona-cruise-clitoral-massager-cerise/p/mp-00120986",
      "sourceLabel": "LELO SONA Cruise product directions (Superdrug)"
    },
    "scienceSources": [
      {
        "url": "https://kinseyinstitute.org/pdf/Herbenick%20et%20al%20JSM%202009%20Women%20Vibe%20Final%20in%20Print.pdf",
        "label": "Herbenick et al., Journal of Sexual Medicine 2009: vibrator use by women in the US (national survey)",
        "summary": "In a national survey of 2,056 women, about half had used a vibrator, users scored higher on most sexual function measures, and side effects like numbness or irritation were uncommon and usually brief (the survey was industry-funded and can't show cause and effect)."
      }
    ],
    "clinicalNote": "Vibrators are common: in a US national survey of 2,056 women, 52.5% had used one. Recent users scored higher on most measures of sexual function, like desire, arousal, lubrication and orgasm, though the survey can't show the vibrator caused that, and it was funded by a condom maker. Most users (71.5%) never had genital side effects; when they did, they were usually mild and short, like brief numbness or irritation. We found no studies on sonic or air-pulse devices specifically. A hospital patient guide suggests starting on the lowest setting, using a water-based lube, and stopping if anything hurts.",
    "clinicalNoteSources": [
      {
        "url": "https://kinseyinstitute.org/pdf/Herbenick%20et%20al%20JSM%202009%20Women%20Vibe%20Final%20in%20Print.pdf%20et%20al%20JSM%202009%20Women%20Vibe%20Final%20in%20Print.pdf",
        "label": "Journal of Sexual Medicine (2009): Prevalence and characteristics of vibrator use by women in the United States (Herbenick et al.)",
        "summary": "Nationally representative survey: 52.5% of women had used a vibrator, use was linked to better sexual function scores, and side effects were uncommon and mostly mild."
      }
    ],
    "warnings": [
      "Use only water-based lube, not silicone lube.",
      "Clean it with toy cleaner.",
      "Do not leave it in heat or direct sunlight."
    ],
    "warningsSource": {
      "url": "https://www.superdrug.com/health/sexual-health/vibrators-adult-toys/vibrators/lelo-sona-cruise-clitoral-massager-cerise/p/mp-00120986",
      "label": "Superdrug: LELO SONA Cruise Clitoral Massager (product copy; lelo.com page could not be opened)"
    }
  },
  "p-mystery-vibe": {
    "whoItsFor": [
      "People who want one toy they can bend into different shapes for internal or external use",
      "Couples or solo users who like app control, custom vibration patterns and remote use",
      "Anyone who finds rigid toys uncomfortable and wants something that shapes to their body",
      "Not the pick without a doctor's OK if you're pregnant or have a pacemaker, diabetes, phlebitis or thrombosis, per MysteryVibe's own safety notes"
    ],
    "howToUse": {
      "intro": "Per MysteryVibe's Crescendo 2 user guide:",
      "steps": [
        "Charge it for 1 hour before first use; the light turns solid green when it's full.",
        "Hold the power button for 2 seconds to turn it on.",
        "Bend it one section at a time into the shape you want, never sideways.",
        "Use the buttons to change intensity and switch between the 12 preset vibes.",
        "For more control, download the MysteryVibe app, turn on Bluetooth and pair the device.",
        "Clean it before and after every use with soap and water or a toy cleaner."
      ],
      "sourceUrl": "https://mysteryvibe.com/cdn/shop/files/Crescendo-2-User-Guide-Booklet-1.0-Digital.pdf",
      "sourceLabel": "MysteryVibe Crescendo 2 user guide"
    },
    "scienceSources": [
      {
        "url": "https://kinseyinstitute.org/pdf/Herbenick%20et%20al%20JSM%202009%20Women%20Vibe%20Final%20in%20Print.pdf",
        "label": "Herbenick et al., Journal of Sexual Medicine 2009: vibrator use by women in the US (national survey)",
        "summary": "In a national survey of 2,056 women, about half had used a vibrator, users scored higher on most sexual function measures, and side effects like numbness or irritation were uncommon and usually brief (the survey was industry-funded and can't show cause and effect)."
      }
    ],
    "clinicalNote": "Research on vibrators for health is still small. The International Society for Sexual Medicine says vibrators may improve genital blood flow, arousal, satisfaction and orgasm, and may also help pelvic floor muscle strength and vulvodynia pain (long-lasting pain at the opening of the vagina), but that there are only a limited number of studies and more research is needed. In a 2009 survey of 2,056 US women, about half had used a vibrator, and 71.5% of users had never had a side effect. The side effects that did happen, like brief numbness or irritation, were mostly mild and short-lived. That survey was funded by a condom maker, Church & Dwight.",
    "clinicalNoteSources": [
      {
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC11150285/",
        "label": "Int Urogynecol J (2024), Dubinskaya et al.: The role of vibrators in women's pelvic health",
        "summary": "In a prospective pilot study at a urogynecology clinic (53 of 79 women completed 3 months), regular vibrator use was linked to better desire, arousal, orgasm, satisfaction and overall sexual function scores, less pain with sex, and fewer bothersome prolapse symptoms, with no control group."
      },
      {
        "url": "https://kinseyinstitute.org/pdf/Herbenick%20et%20al%20JSM%202009%20Women%20Vibe%20Final%20in%20Print.pdf",
        "label": "Journal of Sexual Medicine (2009), Herbenick et al.: Prevalence and characteristics of vibrator use by women in the United States",
        "summary": "52.5% of 2,056 women had used a vibrator; 71.5% of users never had side effects, and those reported were mostly mild and brief."
      }
    ],
    "warnings": [
      "Use water-based lubricants to protect the silicone surface.",
      "Don't fully submerge it for long periods.",
      "It is designed for adults."
    ],
    "warningsSource": {
      "url": "https://mysteryvibe.com/pages/crescendo2-health",
      "label": "MysteryVibe: Crescendo 2 product page"
    }
  },
  "p-phd-wash": {
    "whoItsFor": [
      "People who want a gentle external wash for the vulva with a light odor-control angle",
      "Not the pick if you react to fragrance or essential oils: it contains lavender oil",
      "Anyone who wants something they can use daily, including during their period, per the brand",
      "Not a treatment for infection: it's for external washing only, so see a provider for unusual discharge, itching or a strong odor"
    ],
    "howToUse": {
      "intro": "Per pH-D's own directions:",
      "steps": [
        "Use it in the shower or bath, on the outside of the vulva only.",
        "Work the foam into a lather with clean hands.",
        "Skip sponges and loofahs, which are too harsh for this area.",
        "Rinse thoroughly.",
        "Use it daily if you like, including during your period."
      ],
      "sourceUrl": "https://phdfemininehealth.com/products/ph-d-boric-acid-honey-lavender-foam-wash",
      "sourceLabel": "pH-D Boric Acid Foam Wash product page"
    },
    "ingredientScience": [
      {
        "name": "Boric acid",
        "text": "Boric acid is a mild acid. A federal pesticide information fact sheet says it is low in toxicity on skin and is poorly absorbed unless the skin is damaged. We found no studies testing whether boric acid in an external wash changes vaginal pH; the clinical research on boric acid is about capsules placed inside the vagina for hard-to-treat yeast infections.",
        "citations": [
          {
            "url": "https://www.npic.orst.edu/factsheets/boricgen.html",
            "label": "National Pesticide Information Center (Oregon State University and US EPA): Boric Acid General Fact Sheet"
          }
        ]
      },
      {
        "name": "Lavender oil",
        "text": "Lavender oil adds scent and is a known skin allergen once it oxidizes (breaks down in air). In one dermatology clinic study, 2.8% of patients tested had an allergic reaction to oxidized lavender oil, so this matters if your skin is sensitive.",
        "citations": [
          {
            "url": "https://pubmed.ncbi.nlm.nih.gov/26671837/",
            "label": "Acta Dermato-Venereologica (Hagvall and Bråred Christensson): Contact allergy to oxidized lavender oil"
          }
        ]
      }
    ],
    "warnings": [
      "For external use only.",
      "Avoid contact with your eyes and mouth."
    ],
    "warningsSource": {
      "url": "https://www.vitacost.com/products/ph-d-feminine-health-boric-acid-foam-wash-sensitive-6-fl-oz-177-ml-152146",
      "label": "Vitacost: pH-D Feminine Health Boric Acid Foam Wash, Sensitive (label copy)"
    }
  },
  "p-sweetspot-buff-brighten": {
    "whoItsFor": [
      "People who shave or wax the bikini line, underarms or legs and keep getting ingrown hairs or razor bumps",
      "Those who want a fragrance-free exfoliant for dark spots or darkening from repeated hair removal, which the brand says the pads target",
      "Anyone who prefers a pre-soaked, single-use pad over a scrub or lotion",
      "Not the pick for use right after shaving or waxing: the brand says to wait 24 hours, and to check with your doctor first if you're pregnant"
    ],
    "howToUse": {
      "intro": "Per SweetSpot Labs' instructions on the product listing:",
      "steps": [
        "Wait at least 24 hours after shaving or waxing before you use a pad.",
        "Swipe one pad over dry skin in a gentle circular motion.",
        "Throw the pad away after one use, don't flush it, and close the lid tightly.",
        "Start with about three times a week and build up to daily if your skin tolerates it.",
        "Wear sunscreen and limit sun exposure while using it and for a week after, since AHAs can raise sun sensitivity.",
        "Stop using it if you get a rash or discomfort, and keep it away from your eyes."
      ],
      "sourceUrl": null,
      "sourceLabel": null
    },
    "clinicalSources": [
      {
        "url": "https://www.aad.org/public/everyday-care/skin-care-basics/hair/razor-bump-prevention",
        "label": "American Academy of Dermatology: 6 razor bump prevention tips from dermatologists",
        "summary": "The AAD's prevention basics are shaving with the grain, softening hair first, using a cleanser, shave cream and an aftershave made to reduce bumps, and seeing a dermatologist if bumps keep coming back."
      }
    ],
    "scienceSources": [
      {
        "url": "https://pubmed.ncbi.nlm.nih.gov/40392821/",
        "label": "Cutis (2025): Beyond the Razor: Managing Pseudofolliculitis Barbae in Skin of Color",
        "summary": "This dermatology review says alpha hydroxy acids such as glycolic acid can reduce the curvature of the hair and that hydroxy acids help by loosening the buildup of skin around hair follicles, though it cites no trial results of its own."
      }
    ],
    "ingredientScience": [
      {
        "name": "Lactic acid",
        "text": "Lactic acid is an alpha hydroxy acid (AHA), an acid that loosens dead skin cells on the surface. The FDA notes that AHAs make your skin more sensitive to the sun: after four weeks of use, sensitivity to UV redness went up 18% in a study. An expert safety panel considers AHAs safe at 10% or less with a product pH of 3.5 or higher; this product lists 6.7% total AHAs at pH 3.75 to 4.75.",
        "citations": [
          {
            "url": "https://www.fda.gov/cosmetics/cosmetic-ingredients/alpha-hydroxy-acids",
            "label": "FDA: Alpha Hydroxy Acids"
          }
        ]
      },
      {
        "name": "Glycolic acid",
        "text": "Glycolic acid is another AHA. A 2025 dermatology review on razor bumps (pseudofolliculitis, where shaved hairs curl back into the skin) says AHAs like glycolic acid can reduce how much the hair curls and that hydroxy acids help as add-on treatments. The review gives no study sizes, so treat the evidence as supportive but not strong.",
        "citations": [
          {
            "url": "https://pubmed.ncbi.nlm.nih.gov/40392821/",
            "label": "Cutis 2025;115(4):135-136 (Usatine, Heath, Welch): Beyond the Razor: Managing Pseudofolliculitis Barbae in Skin of Color"
          }
        ]
      },
      {
        "name": "Salicylic acid",
        "text": "Salicylic acid is a beta hydroxy acid (BHA) and a keratolytic, meaning it softens and loosens dead skin and helps unplug blocked pores. MedlinePlus says not to put it on skin that is broken, red, swollen, irritated or infected, and that it can cause stinging or irritation.",
        "citations": [
          {
            "url": "https://medlineplus.gov/druginfo/meds/a607072.html",
            "label": "MedlinePlus (NIH): Salicylic Acid Topical"
          }
        ]
      }
    ],
    "clinicalNote": "Ingrown hairs and razor bumps happen when a cut hair curls back and grows into the skin. A 2025 dermatology review says hydroxy acids, the same family as the lactic, glycolic and salicylic acids here, can help as an add-on by loosening dead skin around the hair. The FDA advises that AHA products raise your sun sensitivity, so use sunscreen on treated areas while using them and for a week after.",
    "clinicalNoteSources": [
      {
        "url": "https://pubmed.ncbi.nlm.nih.gov/40392821/",
        "label": "Cutis 2025 (Usatine, Heath, Welch): Beyond the Razor: Managing Pseudofolliculitis Barbae in Skin of Color",
        "summary": "Reviews razor bump care and lists hydroxy acids, including glycolic acid, as helpful add-on treatments."
      },
      {
        "url": "https://www.fda.gov/cosmetics/cosmetic-ingredients/alpha-hydroxy-acids",
        "label": "FDA: Alpha Hydroxy Acids",
        "summary": "Explains AHA sun sensitivity, safe concentration and pH limits, and the recommended sunburn alert."
      }
    ],
    "warnings": [
      "Wait 24 hours after shaving or waxing before you use a pad.",
      "This product has AHAs that can make your skin more sensitive to the sun, so use sunscreen and limit sun exposure while using it and for a week after.",
      "Avoid your eyes; if it gets in them, rinse well with water.",
      "Stop using it if you get a rash or discomfort, and if you're pregnant, check with your doctor before using AHA or BHA products."
    ],
    "warningsSource": {
      "url": null,
      "label": "Ulta: SweetSpot Labs Buff & Brighten AHA/BHA Body Exfoliating Pads (brand product listing)"
    }
  },
  "p-gennev-care": {
    "whoItsFor": [
      "People in perimenopause or menopause who want a virtual visit with a menopause-trained, board-certified doctor",
      "Those who want to talk through hormone therapy or other prescription options and get prescriptions renewed in follow-up visits",
      "Anyone who wants support beyond medication, since Gennev offers health coaches, dietitians and mental health specialists for sleep, nutrition, stress and lifestyle",
      "People with Aetna, Anthem or other in-network plans who want to use insurance (check your plan with Gennev's lookup tool first)"
    ],
    "howToUse": {
      "intro": "Per Gennev's own How It Works page:",
      "steps": [
        "Create a free account on Gennev's site.",
        "Fill out the short health history, sign the privacy form, and choose insurance or direct billing.",
        "Book a 30-minute video visit with a menopause-trained doctor to build your care plan.",
        "Join from a computer if you can, using the link sent by text and email about 15 minutes before.",
        "Check your visit summary in the Gennev portal, fill any prescriptions, and book follow-ups or coaching sessions your doctor recommends."
      ],
      "sourceUrl": "https://gennev.com/patients/how-gennev-works/",
      "sourceLabel": "Gennev: How Gennev Works"
    },
    "clinicalSources": [
      {
        "url": "https://newsnetwork.mayoclinic.org/discussion/menopause-symptoms-mayo-clinic-expert-outlines-hormone-and-nonhormonal-therapies/",
        "label": "Mayo Clinic News Network: Menopause symptoms, hormone and nonhormonal therapies",
        "summary": "A Mayo Clinic women's health specialist explains that hormone therapy's benefits generally outweigh risks for healthy people under 60 or within 10 years of their last period, that it's usually not an option after breast cancer or blood clots, and that nonhormonal options include low-dose paroxetine, CBT and clinical hypnosis."
      }
    ],
    "scienceSources": [
      {
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC8785511",
        "label": "Menopause (2021): Delivery of menopause care during a pandemic, patient satisfaction with telephone visits",
        "summary": "In 246 visits at a Toronto menopause clinic in 2020, patients rated remote visits highly (4.23 out of 5) and about 80% of those who had tried both preferred them, though this was one clinic and not a study of Gennev."
      }
    ],
    "clinicalNote": "Two position statements from The Menopause Society give useful context for any menopause care service. The Menopause Society's 2022 statement says hormone therapy's benefits outweigh its risks for most healthy women with symptoms who are under 60 or within 10 years of menopause, with the dose and form chosen with you and rechecked over time. For people who can't or don't want to use hormones, its 2023 statement recommends options like cognitive behavioral therapy, clinical hypnosis, certain antidepressants, gabapentin and the newer drug fezolinetant for hot flashes, and does not recommend supplements or herbal remedies.",
    "clinicalNoteSources": [
      {
        "url": "https://menopause.org/wp-content/uploads/press-release/ht-position-statement-release.pdf",
        "label": "The Menopause Society: 2022 Hormone Therapy Position Statement (press release, July 2022)",
        "summary": "Says hormone therapy benefits outweigh risks for most healthy women with symptoms who are under 60 or within 10 years of menopause, with personalized dosing and regular rechecks."
      },
      {
        "url": "https://menopause.org/wp-content/uploads/press-release/nonhormone-therapy-position-statement-release.pdf",
        "label": "The Menopause Society: 2023 Nonhormone Therapy Position Statement (press release, June 2023)",
        "summary": "Lists recommended nonhormone treatments for hot flashes and says supplements and herbal remedies are not recommended."
      }
    ],
    "warnings": [
      "Your practitioner may decide you need to be seen in person by a doctor."
    ],
    "warningsSource": {
      "url": "https://help.gennev.com/article/7-providerdiagnosis",
      "label": "Gennev Help Center: How can the practitioner diagnose me without seeing me in person?"
    }
  },
  "p-womaness-me": {
    "whoItsFor": [
      "Adults in perimenopause or menopause. Womaness markets it for hot flashes, night sweats, mood and sleep; The Menopause Society does not recommend supplements for hot flashes",
      "People who want to avoid estrogen and phytoestrogens, since Womaness says the formula contains neither",
      "Those willing to take it every day for about three months, which is how long the brand says to try it for best results",
      "Not the pick to start on your own if you're pregnant, nursing, take medications or have a medical condition: the label says to check with your doctor first"
    ],
    "howToUse": {
      "intro": "Per Womaness's label directions:",
      "steps": [
        "Take 1 capsule a day with water, ideally with a meal, or as your doctor directs.",
        "Take it at any time of day that suits you, since the brand says timing is flexible.",
        "Stick with it for at least three months before judging results, as the brand recommends.",
        "Don't use it if the clear neck seal is broken or missing, and store it in a dry place at room temperature.",
        "Check with your doctor if you're pregnant, breastfeeding or take other medicines, including hormone therapy."
      ],
      "sourceUrl": "https://womaness.com/products/me-no-pause",
      "sourceLabel": "Womaness: Me.No.Pause. product page"
    },
    "scienceSources": [
      {
        "url": "https://www.frontiersin.org/articles/10.3389/frph.2025.1647721/full",
        "label": "Frontiers in Reproductive Health (2025): Ashwagandha root extract for menopausal symptoms, randomized placebo-controlled trial",
        "summary": "In 60 women aged 45 to 55, 300 mg of one branded ashwagandha extract twice daily for 8 weeks lowered Menopause Rating Scale scores more than placebo, but the trial was small and short and did not test Me.No.Pause. or its dose."
      }
    ],
    "ingredientScience": [
      {
        "name": "Pycnogenol (French maritime pine bark extract)",
        "text": "A Cochrane review of 27 small trials across 10 long-term conditions found the evidence too weak to draw firm conclusions about whether pine bark extract works or is safe. That review did not look at hot flashes or other menopause symptoms.",
        "citations": [
          {
            "url": "https://cochrane.org/evidence/CD008294_using-pine-bark-supplements-help-treat-variety-chronic-diseases",
            "label": "Cochrane Database of Systematic Reviews (2020): Pine bark (Pinus spp.) extract for treating chronic disorders"
          }
        ]
      },
      {
        "name": "Bacopa (Bacognize)",
        "text": "Bacopa is an herb studied for memory. A 2012 review of six 12-week trials found it improved memory recall on 9 of 17 tests, with little evidence of benefit for other thinking skills. These trials were not in menopausal women.",
        "citations": [
          {
            "url": "https://research.monash.edu/en/publications/the-cognitive-enhancing-effects-of-bacopa-monnieri-a-systematic-r/",
            "label": "Journal of Alternative and Complementary Medicine 2012 (Pase et al.), doi:10.1089/acm.2011.0367: The cognitive-enhancing effects of Bacopa monnieri"
          }
        ]
      },
      {
        "name": "Ashwagandha",
        "text": "Small trials suggest ashwagandha may lower stress and slightly improve sleep, according to the NIH Office of Dietary Supplements, which does not mention menopause. Safety data beyond about 3 months is lacking, and there are case reports of liver injury and thyroid changes; some experts advise against it in pregnancy.",
        "citations": [
          {
            "url": "https://ods.od.nih.gov/factsheets/ashwagandha-HealthProfessional/",
            "label": "NIH Office of Dietary Supplements: Ashwagandha fact sheet for health professionals"
          }
        ]
      }
    ],
    "clinicalNote": "The Menopause Society's 2023 statement on nonhormone treatments does not recommend supplements or herbal remedies for hot flashes. It does recommend cognitive behavioral therapy, clinical hypnosis, weight loss, certain antidepressants, gabapentin, oxybutynin and the newer drug fezolinetant. The label doesn't list how much of each ingredient is in a capsule, which makes it hard to compare with the doses used in studies.",
    "clinicalNoteSources": [
      {
        "url": "https://menopause.org/wp-content/uploads/press-release/nonhormone-therapy-position-statement-release.pdf",
        "label": "The Menopause Society: 2023 Nonhormone Therapy Position Statement (press release, June 2023)",
        "summary": "Lists recommended nonhormone treatments for hot flashes and says supplements and herbal remedies are not recommended."
      }
    ],
    "warnings": [
      "If you are pregnant, nursing, taking medications, have a medical condition or have trouble swallowing, check with your doctor before use.",
      "Don't use it if the clear neck seal is broken or missing.",
      "California Prop 65 notice: this product can expose you to chemicals including lead."
    ],
    "warningsSource": {
      "url": "https://womaness.com/products/me-no-pause",
      "label": "Womaness: Me.No.Pause. product page"
    }
  },
  "d-evernow": {
    "whoItsFor": [
      "People in perimenopause or menopause who want ongoing virtual care from a clinician licensed in their state, available in all 50 states and D.C.",
      "Those who want to discuss hormone therapy or non-hormonal prescriptions without an in-person appointment",
      "Anyone who likes being able to message their provider any time, which comes with the membership",
      "Not the pick if you rely on Medicare or Medicaid, which Evernow says it doesn't currently accept, or if you need in-person exams"
    ],
    "howToUse": {
      "intro": "Per Evernow's How It Works and FAQ pages:",
      "steps": [
        "Choose a monthly membership for ongoing care or a single pay-per-visit appointment.",
        "Answer a short set of health questions and pick your plan.",
        "Get matched with a menopause provider licensed in your state, often within 24 hours.",
        "Build your care plan with your provider in a video visit or by secure messaging.",
        "Fill prescriptions at your local pharmacy or get them delivered, and message your provider with questions as you go."
      ],
      "sourceUrl": "https://www.evernow.com/faq",
      "sourceLabel": "Evernow: FAQ"
    },
    "scienceSources": [
      {
        "url": "https://www.cochrane.org/evidence/CD002978_oral-hormone-therapies-help-reduce-frequency-and-severity-hot-flushes-and-night-sweats-caused",
        "label": "Cochrane Review: Oral oestrogen and combined oestrogen/progestogen therapy versus placebo for hot flushes",
        "summary": "Across 24 trials with 3,329 women, oral hormone therapy cut weekly hot flushes by about 75% compared with placebo and also lowered their severity."
      },
      {
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC8785511",
        "label": "Menopause (2021): Delivery of menopause care during a pandemic, patient satisfaction with telephone visits",
        "summary": "At one Toronto menopause clinic, patients rated remote visits highly and most who had tried both preferred them, which supports virtual menopause care in general, though this was not a study of Evernow."
      }
    ],
    "clinicalNote": "Evernow's clinicians may suggest hormonal or non-hormonal treatment. The Menopause Society's 2022 statement says hormone therapy's benefits outweigh its risks for most healthy women with symptoms who are under 60 or within 10 years of menopause, that patches and lower doses may lower the risk of blood clots, and that the plan should be rechecked over time. Its 2023 statement lists recommended non-hormonal options for hot flashes, including cognitive behavioral therapy, clinical hypnosis, certain antidepressants, gabapentin and fezolinetant, and does not recommend supplements or herbal remedies.",
    "clinicalNoteSources": [
      {
        "url": "https://menopause.org/wp-content/uploads/press-release/ht-position-statement-release.pdf",
        "label": "The Menopause Society: 2022 Hormone Therapy Position Statement (press release, July 2022)",
        "summary": "Says hormone therapy benefits outweigh risks for most healthy women with symptoms who are under 60 or within 10 years of menopause, with personalized dosing and regular rechecks."
      },
      {
        "url": "https://menopause.org/wp-content/uploads/press-release/nonhormone-therapy-position-statement-release.pdf",
        "label": "The Menopause Society: 2023 Nonhormone Therapy Position Statement (press release, June 2023)",
        "summary": "Lists recommended nonhormone treatments for hot flashes and says supplements and herbal remedies are not recommended."
      }
    ],
    "warnings": [
      "Evernow providers don't handle medical emergencies; call 911 or go to the nearest emergency room.",
      "Some health needs aren't right for a telehealth visit, and your provider will decide that.",
      "Evernow providers are an addition to, not a replacement for, your local primary care provider.",
      "Evernow has no in-person clinic locations."
    ],
    "warningsSource": {
      "url": "https://www.evernow.com/legal/informed-consent",
      "label": "Evernow: Informed Consent"
    }
  },
  "p-mypelvicbra-sports": {
    "clinicalSources": [
      {
        "url": "https://mayoclinic.org/diseases-conditions/pelvic-organ-prolapse/diagnosis-treatment/drc-20562951?p=1",
        "label": "Mayo Clinic: Pelvic organ prolapse, diagnosis and treatment",
        "summary": "Lists pelvic floor exercises with biofeedback and a fitted pessary as the main nonsurgical treatments for prolapse, plus steps like avoiding heavy lifting and straining; it does not mention support garments."
      }
    ],
    "scienceSources": [
      {
        "url": "https://www.frontiersin.org/journals/sports-and-active-living/articles/10.3389/fspor.2025.1691794/full",
        "label": "Donnelly et al., Pelvic compression garments alter running biomechanics, perceived support, and fear of symptoms in postpartum women with pelvic floor dysfunction, Frontiers in Sports and Active Living (2026)",
        "summary": "In 13 postpartum runners, compression shorts (a different brand, not a Pelvic Bra) smoothed pelvic motion, raised perceived support and lowered fear of symptoms, but did not change reported symptoms over a 7-minute run."
      }
    ]
  },
  "p-sootheher-elaris-pod": {
    "howToUse": {
      "intro": "SootheHer's own instructions couldn't be opened, so these steps follow NHS guidance on using a TENS device:",
      "steps": [
        "Stick the gel pad onto clean skin near where it hurts, such as your lower belly.",
        "Start on the lowest setting and turn it up slowly until you feel a tingling that isn't painful.",
        "Don't use it while you sleep, in the bath or shower, or while driving.",
        "Turn it off and remove the pad if your skin gets itchy, irritated or red.",
        "Skip it if you have epilepsy or a pacemaker, or if you're pregnant unless your doctor says otherwise."
      ],
      "sourceUrl": "https://www.nhs.uk/conditions/transcutaneous-electrical-nerve-stimulation-tens/",
      "sourceLabel": "NHS: TENS (transcutaneous electrical nerve stimulation)"
    }
  },
  "p-winx-uti-test-treat": {
    "ingredientScience": [
      {
        "name": "Nitrite test pad",
        "text": "Nitrite is made by bacteria that turn nitrate in urine into nitrite, so a positive result points fairly strongly to a UTI if you have symptoms. A negative result does not rule one out: bacteria need about four hours in the bladder to make nitrite, some germs (like Enterococcus) don't make it at all, and vitamin C in your urine can cause a false negative. The pain reliever phenazopyridine can cause a false positive.",
        "citations": [
          {
            "url": "https://www.aafp.org/pubs/afp/issues/2022/0700/office-based-urinalysis.html",
            "label": "American Family Physician (AAFP), 2022: Office-Based Urinalysis: A Comprehensive Review"
          }
        ]
      },
      {
        "name": "Leukocyte esterase test pad",
        "text": "Leukocyte esterase is an enzyme released by white blood cells, so it signals inflammation or infection in the urinary tract, not only bacteria. On standard dipsticks, a negative nitrite plus negative leukocyte esterase result lowers the odds of a UTI, but in women with vague symptoms a negative strip still left about a 1 in 4 chance of infection, so a urine culture (a lab test that grows the bacteria) may still be needed.",
        "citations": [
          {
            "url": "https://aafp.org/afp/2006/0101/p129.html",
            "label": "American Family Physician (AAFP), 2006: Urine Dipstick for Diagnosing Urinary Tract Infection"
          }
        ]
      }
    ]
  },
  "p-winx-vaginal-health-test-treat": {
    "ingredientScience": [
      {
        "name": "Vaginal pH indicator strip",
        "text": "A healthy vaginal pH is usually 3.8 to 4.5, kept acidic mostly by lactic acid from Lactobacillus bacteria. Bacterial vaginosis (BV) and trichomoniasis (a common STI) are linked to a pH above 4.5, while a yeast infection barely changes pH, so a normal reading can't rule out yeast. Symptoms alone can't reliably tell these apart, so lab testing is still the way to confirm.",
        "citations": [
          {
            "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC8363453/",
            "label": "Peer-reviewed study (2021, DOI 10.1155/2021/4948954): vaginal infection self-test kit vs clinical diagnosis"
          }
        ]
      }
    ]
  },
  "p-winx-pregnancy-tests": {
    "ingredientScience": [
      {
        "name": "hCG test strip",
        "text": "The strip detects hCG (human chorionic gonadotropin), a hormone made by the placenta that rises very quickly in early pregnancy. FDA notes that 10 to 20 out of every 100 pregnant women won't get a positive result on the first day of a missed period, and that testing 1 to 2 weeks after a missed period gives the most reliable result.",
        "citations": [
          {
            "url": "https://www.fda.gov/medical-devices/home-use-tests/pregnancy",
            "label": "FDA: Home Use Tests, Pregnancy"
          }
        ]
      }
    ],
    "warnings": [
      "Accuracy depends on following the instructions and reading the result correctly.",
      "Testing too early can give a false negative because hCG may not be high enough yet.",
      "Treat a negative result as tentative: FDA suggests avoiding medications and potentially harmful behaviors until you're more certain you're not pregnant.",
      "Using your first morning urine can improve accuracy."
    ],
    "warningsSource": {
      "url": "https://www.fda.gov/medical-devices/home-use-tests/pregnancy",
      "label": "FDA: Home Use Tests, Pregnancy"
    }
  },
  "p-winx-uti-pain-relief": {
    "ingredientScience": [
      {
        "name": "Phenazopyridine hydrochloride",
        "text": "A urinary pain reliever thought to numb the lining of the urinary tract; it eases burning, urgency, and frequency but is not an antibiotic and does not treat the infection. The recommended course is 2 days alongside an antibiotic. It was marketed before modern efficacy rules, so the trial evidence is limited and older, though it has a generally favorable safety record when used short-term. It's not recommended with severe kidney disease or G6PD deficiency (an inherited condition that makes red blood cells break down more easily).",
        "citations": [
          {
            "url": "https://pubmed.ncbi.nlm.nih.gov/35593852/",
            "label": "StatPearls (NIH Bookshelf reference): Phenazopyridine"
          }
        ]
      }
    ]
  },
  "p-winx-vaginal-probiotic": {
    "ingredientScience": [
      {
        "name": "Lactobacillus rhamnosus",
        "text": "A 2022 review of 10 randomized trials found that Lactobacillus probiotics, taken after antibiotic treatment for BV, lowered the chance of BV coming back (about 15% vs 26%). The evidence was rated moderate, most trials only followed women for about a month, and having L. rhamnosus in the product was not itself linked to better results.",
        "citations": [
          {
            "url": "https://www.frontiersin.org/journals/nutrition/articles/10.3389/fnut.2022.938838/full",
            "label": "Frontiers in Nutrition, 2022: Probiotics to reduce BV recurrence, systematic review and meta-analysis of RCTs"
          }
        ]
      },
      {
        "name": "Lactobacillus reuteri",
        "text": "Usually studied paired with L. rhamnosus. In a UK randomized trial of 238 pregnant women, a daily oral capsule of L. rhamnosus GR-1 and L. reuteri RC-14 did not change the vaginal microbiome or BV rates compared with placebo. Results depend on the exact strain, and this label doesn't say which L. reuteri strain it uses.",
        "citations": [
          {
            "url": "https://openaccess.city.ac.uk/22010",
            "label": "BJOG, 2020: Oral probiotics (L. rhamnosus GR-1 + L. reuteri RC-14) and vaginal microbiota in pregnancy, RCT"
          }
        ]
      },
      {
        "name": "Inulin",
        "text": "A plant fiber that acts as a prebiotic (food for helpful bacteria). Human studies show it mainly boosts Bifidobacterium in the colon, with a smaller effect on lactobacilli; that research is about gut health, not vaginal health.",
        "citations": [
          {
            "url": "https://core-cms.cambridgecore.org/core/services/aop-cambridge-core/content/view/4C8D01FE5AF4A6A81965344B26FAB14D/S0007114502000958a.pdf/prebiotic-effects-of-inulin-and-oligofructose.pdf",
            "label": "British Journal of Nutrition, 2002: Prebiotic effects of inulin and oligofructose"
          }
        ]
      }
    ],
    "warnings": [
      "The risk of harm from probiotics is higher in people with severe illnesses or a weakened immune system.",
      "Some probiotic products have been found to contain microbes not listed on the label.",
      "Probiotics sold as dietary supplements don't need FDA approval before they are sold."
    ],
    "warningsSource": {
      "url": "https://www.nccih.nih.gov/health/probiotics-usefulness-and-safety",
      "label": "NCCIH (NIH): Probiotics, Usefulness and Safety"
    }
  },
  "p-winx-uti-daily-defense": {
    "ingredientScience": [
      {
        "name": "Cranberry extract (proanthocyanidins)",
        "text": "A 2023 Cochrane review of 50 trials (8,857 people) found cranberry products probably lower the risk of UTIs; in women with recurrent UTIs, risk dropped by about a quarter. It showed little or no benefit for pregnant women, elderly people in care homes, or people whose bladder doesn't empty fully.",
        "citations": [
          {
            "url": "https://www.cochrane.org/CD001321/UTI_cranberry-for-preventing-urinary-tract-infections",
            "label": "Cochrane Review, 2023: Cranberries for preventing urinary tract infections"
          }
        ]
      },
      {
        "name": "D-mannose",
        "text": "A sugar meant to stop E. coli from sticking to the bladder wall. In a 2024 randomized trial of 598 women with recurrent UTIs in UK primary care, daily D-mannose did not reduce UTIs compared with placebo (51% vs 56%, not a significant difference), and the authors said it shouldn't be recommended for prevention in this group.",
        "citations": [
          {
            "url": "https://urology.wisc.edu/wp-content/uploads/2024/05/D-Mannose-for-Prevention-of-Recurrent-Urinary-Tract-Infection-Among-Women.pdf",
            "label": "JAMA Internal Medicine, 2024: D-Mannose for Prevention of Recurrent UTI Among Women, RCT (copy hosted by UW Urology)"
          }
        ]
      },
      {
        "name": "Turmeric",
        "text": "NIH's integrative health center says there isn't enough evidence to conclude turmeric or curcumin helps any health condition, and it doesn't list UTIs among the uses studied. Highly absorbable curcumin products have been linked to liver injury in some people, and turmeric supplements may be unsafe in pregnancy.",
        "citations": [
          {
            "url": "https://www.nccih.nih.gov/health/turmeric",
            "label": "NCCIH (NIH): Turmeric"
          }
        ]
      },
      {
        "name": "Vitamin C",
        "text": "Adults should keep total vitamin C under 2,000 mg a day; large supplement doses can cause stomach upset or diarrhea and, in some people, kidney stones. Vitamin C in urine can also make the nitrite pad on a home UTI test read falsely negative.",
        "citations": [
          {
            "url": "https://mayoclinic.org/healthy-lifestyle/adult-health/expert-answers/shaving/faq-20058030",
            "label": "Mayo Clinic: Too much vitamin C, is it harmful?"
          }
        ]
      }
    ]
  }
};
