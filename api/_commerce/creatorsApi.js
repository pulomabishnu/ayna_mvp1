/* global process */
/**
 * Amazon Creators API: status and rules only. Live calls are intentionally not
 * wired until both blockers below clear, so nothing here can fake an Amazon
 * price.
 *
 *   NEEDS_CREATORS_API_CREDENTIALS  ayna has no credentials. Access requires an
 *     approved Associates account with 10+ qualifying sales in the trailing 30
 *     days; credentials are created in Associates Central > Tools > Creators API.
 *   NEEDS_AMAZON_WRITTEN_CONFIRMATION  the license requires a site whose
 *     principal purpose is advertising Amazon. ayna is a multi-retailer
 *     health marketplace; ask Amazon before using API data (draft question in
 *     docs/commerce/AMAZON.md).
 *
 * Rules to follow once live (Associates IP License 2(h)-(k); Creators API best practices):
 *   - OffersV2 only (Offers is retired); GetVariations for child ASINs.
 *   - cache offers 1 hour; other data at most 24 hours; ASINs indefinitely.
 *   - never store or cache image files; an image URL may be kept 24 hours.
 *   - refreshed less often than hourly -> show "as of" time + Amazon's disclaimer.
 *   - no price history, no price tracking or alerts.
 *   - API data may only link to Amazon and may not promote other retailers.
 *   - bearer tokens last 1 hour; cache and share them across servers.
 */

export const CREATORS_API_BLOCKERS = Object.freeze({
  CREDENTIALS: 'NEEDS_CREATORS_API_CREDENTIALS',
  WRITTEN_CONFIRMATION: 'NEEDS_AMAZON_WRITTEN_CONFIRMATION',
});

export function creatorsApiStatus(env = process.env) {
  const blockers = [];
  if (!(env.AMAZON_CREATORS_CREDENTIAL_ID && env.AMAZON_CREATORS_CREDENTIAL_SECRET && env.AMAZON_CREATORS_CREDENTIAL_VERSION)) blockers.push(CREATORS_API_BLOCKERS.CREDENTIALS);
  if (String(env.AMAZON_CREATORS_USE_APPROVED || '') !== 'true') blockers.push(CREATORS_API_BLOCKERS.WRITTEN_CONFIRMATION);
  return { live: blockers.length === 0, blockers };
}

/** Amazon cache windows in ms, from the documented rules. */
export const AMAZON_CACHE_MS = Object.freeze({ offers: 60 * 60 * 1000, otherData: 24 * 60 * 60 * 1000, imageUrl: 24 * 60 * 60 * 1000 });
