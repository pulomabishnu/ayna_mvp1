/**
 * _gpcRegions.js
 *
 * US states whose privacy laws currently require honoring Global Privacy
 * Control (GPC) as a valid "universal opt-out mechanism" (UOOM) — i.e.
 * businesses subject to that law MUST treat a GPC signal as a real opt-out
 * request, not just a courtesy signal to honor if convenient.
 *
 * THIS IS A LEGAL LIST, NOT JUST A TECHNICAL ONE. It changes as more state
 * privacy laws take effect or get amended, and effective dates matter (a
 * law can be passed but not yet enforceable). Review periodically — ideally
 * with privacy counsel — and err toward ADDING a state if uncertain rather
 * than removing one, since the failure mode of over-including is "we asked
 * one fewer visitor than we strictly needed to," while under-including is
 * "we didn't honor an opt-out the law says we must."
 *
 * Last reviewed: 2026-09-12. Confidence varies by entry:
 *   - CA, CO, CT, TX, MT: clearly established, currently in effect.
 *   - DE, NE, NJ, OR, MN, MD: believed to require it as of this review;
 *     verify current effective-date status before leaning on this list for
 *     anything beyond an MVP.
 *
 * Deliberately NOT included, despite having their own comprehensive
 * consumer privacy laws, because those laws require SOME opt-out mechanism
 * to exist but don't mandate recognizing an automated browser-level signal
 * like GPC specifically: Virginia, Utah, Iowa, Indiana, Kentucky, Tennessee.
 */

export const MANDATORY_GPC_STATE_CODES = new Set([
  'CA', // California — CCPA/CPRA
  'CO', // Colorado — CPA
  'CT', // Connecticut — CTDPA
  'TX', // Texas — TDPSA
  'MT', // Montana — MCDPA
  'DE', // Delaware — DPDPA
  'NE', // Nebraska — NDPA
  'NJ', // New Jersey — NJDPA
  'OR', // Oregon — OCPA
  'MN', // Minnesota — MCDPA
  'MD', // Maryland — MODPA
]);

/**
 * @param {string} countryCode  ISO 3166-1 alpha-2, e.g. 'US' — as reported
 *   by Vercel's `x-vercel-ip-country` header.
 * @param {string} regionCode   ISO 3166-2 subdivision code without the
 *   country prefix, e.g. 'CA' for California — as reported by Vercel's
 *   `x-vercel-ip-country-region` header.
 * @returns {boolean}
 */
export function isMandatoryGpcRegion(countryCode, regionCode) {
  if (countryCode !== 'US') return false;
  if (!regionCode) return false;
  return MANDATORY_GPC_STATE_CODES.has(String(regionCode).toUpperCase());
}
