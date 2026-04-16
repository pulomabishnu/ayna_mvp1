/**
 * Ensures LLM-suggested products carry enough structure for ProductModal tabs
 * (clinician, scientific literature, community) and safety context.
 * Safe to call repeatedly (fills only missing fields).
 */

function truncate(s, max) {
  if (!s || typeof s !== 'string') return '';
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function buildVerificationLinks(product) {
  const name = (product.name || 'product').trim();
  const brand = (product.brand || '').trim();
  const q = encodeURIComponent(`${name} ${brand}`.trim());
  const pubmed = `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(name)}`;
  const medline = 'https://medlineplus.gov/';
  const ods = 'https://ods.od.nih.gov/';
  const acog = 'https://www.acog.org/womens-health';

  return {
    doctor: {
      aiSummary:
        product.safetyNote ||
        'Educational information only. Discuss any product change with your health care provider.',
      links: [
        {
          url: medline,
          text: 'MedlinePlus (NIH)',
          summary: 'Trusted patient-oriented health information.',
          justification: 'U.S. National Library of Medicine',
        },
        {
          url: `https://www.google.com/search?q=${q}+site%3Aacog.org+OR+site%3Amayoclinic.org+OR+site%3Ahealthline.com`,
          text: 'Web search: clinical guidance & reviews',
          summary: 'Find clinician-trusted sources discussing this type of product.',
          justification: 'Discovery link — verify sources independently',
        },
        {
          url: acog,
          text: 'ACOG — Women’s health topics',
          summary: 'Professional guidance on many women’s health concerns.',
          justification: 'American College of Obstetricians and Gynecologists',
        },
      ],
    },
    scientific: {
      aiSummary:
        'Use PubMed and NIH resources to review evidence for ingredients relevant to your goals. This product is not in Ayna’s curated catalog.',
      links: [
        {
          url: pubmed,
          text: `PubMed search: “${truncate(name, 60)}”`,
          summary: 'Peer-reviewed literature search (NIH).',
          justification: 'PubMed',
        },
        {
          url: ods,
          text: 'NIH Office of Dietary Supplements',
          summary: 'Evidence summaries for supplements and nutrients when applicable.',
          justification: 'NIH ODS',
        },
        {
          url: 'https://www.fda.gov/food/dietary-supplements',
          text: 'FDA: Dietary Supplements',
          summary: 'Regulatory context for supplements in the U.S.',
          justification: 'U.S. FDA',
        },
      ],
    },
    community: {
      aiSummary:
        'These links surface community discussion; anecdotes are not medical advice.',
      links: [
        {
          platform: 'reddit',
          url: `https://www.reddit.com/search/?q=${encodeURIComponent(name)}`,
          text: `Reddit search: ${truncate(name, 48)}`,
          summary: 'Community threads and search results.',
        },
        {
          platform: 'youtube',
          url: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${name} review`)}`,
          text: 'YouTube — reviews & comparisons',
          summary: 'Video reviews (verify sponsor disclosure).',
        },
        {
          platform: 'tiktok',
          url: `https://www.tiktok.com/search?q=${encodeURIComponent(name)}`,
          text: 'TikTok — product search',
          summary: 'Short-form reviews and wear tests.',
        },
      ],
    },
  };
}

/**
 * @param {object} product
 * @returns {object}
 */
export function enrichLlmProductForDiscovery(product) {
  if (!product || !product.llmGenerated) return product;

  const hasV = product.verificationLinks && typeof product.verificationLinks === 'object';
  const hasDoctor = hasV && (product.verificationLinks.doctor?.links?.length > 0);
  if (hasDoctor) return product;

  const summary = product.summary || '';
  const vl = buildVerificationLinks(product);

  return {
    ...product,
    clinicianOpinionSource: product.clinicianOpinionSource || 'independent',
    clinicianAttribution:
      product.clinicianAttribution ||
      'Ayna general guidance — this listing is not a curated catalog entry. Verify with your clinician.',
    doctorOpinion:
      product.doctorOpinion ||
      'This match is generated to help you explore options. It is not a substitute for personalized medical advice—confirm fit with your clinician.',
    communityReview:
      product.communityReview ||
      truncate(summary, 320) ||
      'See the Community tab for discussion links; treat forum content as non-medical context.',
    effectiveness:
      product.effectiveness || truncate(summary, 280) || 'See product summary and independent sources.',
    safety: product.safety || {
      recalls:
        'No Ayna-tracked recall data for this generated listing. Check the FDA recall database and the manufacturer before purchase.',
      materials: 'See the manufacturer label and official site for ingredients and materials.',
      sideEffects:
        product.safetyNote ||
        'Consult a clinician if you have conditions, are pregnant or breastfeeding, or take medications.',
      fdaStatus: 'Varies by product—verify on packaging or FDA resources for your product type.',
      opinionAlerts:
        'AI-suggested products can be wrong or outdated. Verify the exact brand name, formulation, and retailer before buying.',
    },
    verificationLinks: vl,
  };
}
