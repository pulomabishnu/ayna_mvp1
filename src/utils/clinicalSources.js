import { getVerificationLinks } from './verificationLinks.js';

// The Shop "clinical" filter, website and app. Honest about what it means:
// a clinical view written from non-brand sources (mostly ayna's summary of
// peer-reviewed research and guidelines) or a clinician source link is on
// file. It is NOT a clinician sign-off and NOT proof the product works, so
// the label never says "clinically backed" or "reviewed by a clinician".
// No product has a named clinician reviewer yet (getNamedReviewer in
// src/data/passport/content.js); when one does, that earns its own label.
export const CLINICAL_SOURCES_LABEL = 'Has clinical sources';

export function hasClinicalSources(product) {
  if (!product) return false;
  const independentView = Boolean(product.doctorOpinion || product.clinicianOpinion) && product.clinicianOpinionSource !== 'brand';
  return independentView || Boolean(product.clinicianReview) || getVerificationLinks(product, 'doctor').length > 0;
}
