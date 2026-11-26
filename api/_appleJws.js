import { Buffer } from 'node:buffer';
/* global process */
import { X509Certificate, verify as cryptoVerify } from 'node:crypto';

/**
 * Verifies data the App Store signs (StoreKit 2 transactions, renewal info and App Store Server
 * Notifications V2). Each is a JWS whose header carries Apple's certificate chain (x5c). We check
 * the chain ends at Apple Root CA - G3 (by SHA-256 fingerprint, so no certificate file is needed),
 * that each certificate signed the next, that they are in date, that the leaf and intermediate
 * carry Apple's App Store receipt-signing markers, and then the ES256 signature itself.
 *
 * Fingerprint of Apple Root CA - G3 (https://www.apple.com/certificateauthority/). Matches the
 * value used by Apple's own app-store-server-library and by app-store-server-api.
 */
export const APPLE_ROOT_CA_G3_FINGERPRINT = '63:34:3A:BF:B8:9A:6A:03:EB:B5:7E:9B:3F:5F:A7:BE:7C:4F:5C:75:6F:30:17:B3:A8:C4:88:C3:65:3E:91:79';
// Apple's marker OIDs: leaf "Mac App Store and iTunes Store Receipt Signing", intermediate "Apple WWDR".
const LEAF_OID = '1.2.840.113635.100.6.11.1';
const INTERMEDIATE_OID = '1.2.840.113635.100.6.2.1';

export class AppleJwsError extends Error {
  constructor(reason) { super(`apple_jws_${reason}`); this.reason = reason; }
}

const b64url = (s) => Buffer.from(String(s).replace(/-/g, '+').replace(/_/g, '/'), 'base64');

/** DER contains the OID's encoded bytes (a plain byte search, as Apple's own libraries do). */
function hasOid(cert, oid) {
  const parts = oid.split('.').map(Number);
  const bytes = [40 * parts[0] + parts[1]];
  for (const n of parts.slice(2)) {
    const stack = [n & 0x7f];
    let v = n >>> 7;
    while (v > 0) { stack.unshift((v & 0x7f) | 0x80); v >>>= 7; }
    bytes.push(...stack);
  }
  const needle = Buffer.from([0x06, bytes.length, ...bytes]);
  return cert.raw.includes(needle);
}

/**
 * @param {string} jws compact JWS from Apple
 * @param {{ rootFingerprint?: string, now?: Date }} opts rootFingerprint is overridable for tests only
 * @returns {object} the verified payload
 */
export function verifyAppleJws(jws, { rootFingerprint = APPLE_ROOT_CA_G3_FINGERPRINT, now = new Date() } = {}) {
  const parts = String(jws || '').split('.');
  if (parts.length !== 3) throw new AppleJwsError('format');
  let header;
  try { header = JSON.parse(b64url(parts[0]).toString('utf8')); } catch { throw new AppleJwsError('header'); }
  if (header.alg !== 'ES256' || !Array.isArray(header.x5c) || header.x5c.length < 3) throw new AppleJwsError('header');
  let certs;
  try { certs = header.x5c.map((c) => new X509Certificate(Buffer.from(c, 'base64'))); } catch { throw new AppleJwsError('certificate'); }
  const root = certs[certs.length - 1];
  if (root.fingerprint256 !== rootFingerprint) throw new AppleJwsError('root');
  for (const c of certs) {
    if (!(new Date(c.validFrom) <= now && now <= new Date(c.validTo))) throw new AppleJwsError('expired');
  }
  for (let i = 0; i < certs.length - 1; i++) {
    if (!certs[i].checkIssued(certs[i + 1]) || !certs[i].verify(certs[i + 1].publicKey)) throw new AppleJwsError('chain');
  }
  if (rootFingerprint === APPLE_ROOT_CA_G3_FINGERPRINT && (!hasOid(certs[0], LEAF_OID) || !hasOid(certs[1], INTERMEDIATE_OID))) {
    throw new AppleJwsError('not_app_store');
  }
  const ok = cryptoVerify('sha256', Buffer.from(`${parts[0]}.${parts[1]}`), { key: certs[0].publicKey, dsaEncoding: 'ieee-p1363' }, b64url(parts[2]));
  if (!ok) throw new AppleJwsError('signature');
  try { return JSON.parse(b64url(parts[1]).toString('utf8')); } catch { throw new AppleJwsError('payload'); }
}

export const APP_BUNDLE_ID = 'co.aynahealth.app';
/** App Store product id -> Pro plan. Must match the products in App Store Connect and src/pro/appleIap.js. */
export const APPLE_PRO_PRODUCTS = {
  'co.aynahealth.app.pro.monthly': 'month',
  'co.aynahealth.app.pro.yearly': 'year',
};
/**
 * The free 14-day trial in the iPhone app (founder, Nov 25: "no card"). Guideline 3.1.1 allows a free
 * trial as a non-consumable at $0 named "14-Day Trial": nothing is charged and nothing renews.
 * It has no expiry from Apple, so access runs APPLE_TRIAL_DAYS from the purchase.
 */
export const APPLE_TRIAL_PRODUCT = 'co.aynahealth.app.pro.trial14';
export const APPLE_TRIAL_DAYS = 14;

/** Sandbox purchases count only where we allow them (TestFlight / review). App Review buys in Sandbox. */
export function environmentAllowed(env) {
  if (env === 'Production') return true;
  if (env === 'Sandbox') return process.env.APPLE_IAP_ALLOW_SANDBOX !== 'false';
  return false;
}

/**
 * A verified transaction -> the row we keep. Throws if it isn't one of our Pro subscriptions.
 * @param {object} tx decoded JWSTransaction
 */
export function subscriptionRow(tx, userId) {
  if (tx.bundleId !== APP_BUNDLE_ID) throw new AppleJwsError('bundle');
  const trial = tx.productId === APPLE_TRIAL_PRODUCT;
  const plan = trial ? 'trial' : APPLE_PRO_PRODUCTS[tx.productId];
  if (!plan) throw new AppleJwsError('product');
  if (!environmentAllowed(tx.environment)) throw new AppleJwsError('environment');
  const expires = trial ? Number(tx.purchaseDate) + APPLE_TRIAL_DAYS * 864e5 : Number(tx.expiresDate);
  if (!tx.originalTransactionId || !tx.transactionId || !Number.isFinite(expires)) throw new AppleJwsError('fields');
  return {
    original_transaction_id: String(tx.originalTransactionId),
    user_id: userId,
    product_id: tx.productId,
    plan,
    last_transaction_id: String(tx.transactionId),
    purchased_at: tx.purchaseDate ? new Date(Number(tx.purchaseDate)).toISOString() : null,
    expires_at: new Date(expires).toISOString(),
    revoked_at: tx.revocationDate ? new Date(Number(tx.revocationDate)).toISOString() : null,
    environment: tx.environment,
    ...(trial ? { auto_renew: false } : {}),
    updated_at: new Date().toISOString(),
  };
}
