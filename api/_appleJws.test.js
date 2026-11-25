import { describe, it, expect, vi, afterEach } from 'vitest';
import { createPrivateKey, sign, X509Certificate } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { verifyAppleJws, subscriptionRow, AppleJwsError, APPLE_PRO_PRODUCTS } from './_appleJws.js';

// A throwaway test chain (made with openssl for this test only; not Apple's and not secret).
const chain = JSON.parse(readFileSync(new URL('./__fixtures__/appleJwsTestChain.json', import.meta.url), 'utf8'));
const rootFingerprint = new X509Certificate(Buffer.from(chain.x5c[2], 'base64')).fingerprint256;
const leafKey = createPrivateKey(chain.leafKey);
const b64url = (b) => Buffer.from(b).toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');

function makeJws(payload, { x5c = chain.x5c, alg = 'ES256', key = leafKey } = {}) {
  const head = b64url(JSON.stringify({ alg, x5c }));
  const body = b64url(JSON.stringify(payload));
  const sig = sign('sha256', Buffer.from(`${head}.${body}`), { key, dsaEncoding: 'ieee-p1363' });
  return `${head}.${body}.${b64url(sig)}`;
}

const tx = (over = {}) => ({
  bundleId: 'co.aynahealth.app', productId: 'co.aynahealth.app.pro.yearly', environment: 'Sandbox',
  transactionId: '2000001', originalTransactionId: '2000000', purchaseDate: Date.UTC(2026, 10, 25),
  expiresDate: Date.UTC(2027, 10, 25), appAccountToken: '11111111-2222-3333-4444-555555555555', ...over,
});

describe('verifyAppleJws', () => {
  it('returns the payload when the chain and signature check out', () => {
    expect(verifyAppleJws(makeJws(tx()), { rootFingerprint })).toMatchObject({ productId: 'co.aynahealth.app.pro.yearly' });
  });
  it('rejects a chain that does not end at the expected root (default is Apple G3)', () => {
    expect(() => verifyAppleJws(makeJws(tx()))).toThrow(AppleJwsError);
  });
  it('rejects a changed payload', () => {
    const [h, , s] = makeJws(tx()).split('.');
    const forged = `${h}.${b64url(JSON.stringify(tx({ expiresDate: Date.UTC(2099, 0, 1) })))}.${s}`;
    expect(() => verifyAppleJws(forged, { rootFingerprint })).toThrow(/signature/);
  });
  it('rejects a chain whose links were not signed by each other', () => {
    const swapped = [chain.x5c[0], chain.x5c[2], chain.x5c[2]];
    expect(() => verifyAppleJws(makeJws(tx(), { x5c: swapped }), { rootFingerprint })).toThrow(/chain/);
  });
  it('rejects other algorithms and junk', () => {
    expect(() => verifyAppleJws(makeJws(tx(), { alg: 'none' }), { rootFingerprint })).toThrow(/header/);
    expect(() => verifyAppleJws('not.a.jws', { rootFingerprint })).toThrow(AppleJwsError);
    expect(() => verifyAppleJws('', { rootFingerprint })).toThrow(/format/);
  });
  it('rejects an expired chain', () => {
    expect(() => verifyAppleJws(makeJws(tx()), { rootFingerprint, now: new Date('2100-01-01') })).toThrow(/expired/);
  });
});

describe('subscriptionRow', () => {
  afterEach(() => { vi.unstubAllEnvs(); });
  it('maps a verified yearly transaction to the stored row', () => {
    expect(subscriptionRow(tx(), 'u1')).toMatchObject({
      original_transaction_id: '2000000', user_id: 'u1', plan: 'year', last_transaction_id: '2000001',
      expires_at: '2027-11-25T00:00:00.000Z', revoked_at: null, environment: 'Sandbox',
    });
  });
  it('keeps a refund as revoked', () => {
    expect(subscriptionRow(tx({ revocationDate: Date.UTC(2026, 10, 26) }), 'u1').revoked_at).toBe('2026-11-26T00:00:00.000Z');
  });
  it('refuses other apps, unknown products and Xcode test receipts', () => {
    expect(() => subscriptionRow(tx({ bundleId: 'com.other' }), 'u1')).toThrow(/bundle/);
    expect(() => subscriptionRow(tx({ productId: 'x' }), 'u1')).toThrow(/product/);
    expect(() => subscriptionRow(tx({ environment: 'Xcode' }), 'u1')).toThrow(/environment/);
  });
  it('can turn sandbox off', () => {
    vi.stubEnv('APPLE_IAP_ALLOW_SANDBOX', 'false');
    expect(() => subscriptionRow(tx(), 'u1')).toThrow(/environment/);
    expect(subscriptionRow(tx({ environment: 'Production' }), 'u1').environment).toBe('Production');
  });
  it('has the two Pro products', () => {
    expect(Object.values(APPLE_PRO_PRODUCTS).sort()).toEqual(['month', 'year']);
  });
});
