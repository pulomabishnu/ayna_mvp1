import { describe, it, expect } from 'vitest';
import { verifyAppTransactions, handleAppleNotification, saveAppleRow } from './_proApple.js';
import { AppleJwsError } from './_appleJws.js';

const USER = '11111111-2222-3333-4444-555555555555';
function fakeAdmin(rows = {}) {
  return {
    rows,
    from() {
      const admin = this;
      return {
        select() { return this; },
        eq(_c, v) { this.key = v; return this; },
        async maybeSingle() { return { data: admin.rows[this.key] || null, error: null }; },
        async upsert(row) { admin.rows[row.original_transaction_id] = row; return { error: null }; },
      };
    },
  };
}
const tx = (over = {}) => ({
  bundleId: 'co.aynahealth.app', productId: 'co.aynahealth.app.pro.monthly', environment: 'Production',
  transactionId: 't2', originalTransactionId: 'o1', expiresDate: Date.UTC(2027, 0, 1), appAccountToken: USER, ...over,
});
// Tests pass decoded objects straight through as the "verified" payload.
const verify = (x) => { if (x === 'bad') throw new AppleJwsError('signature'); return typeof x === 'string' ? JSON.parse(x) : x; };
const j = (o) => JSON.stringify(o);

describe('verifyAppTransactions', () => {
  it('saves her purchase', async () => {
    const admin = fakeAdmin();
    const out = await verifyAppTransactions(admin, USER, [j(tx())], verify);
    expect(out[0].result).toBe('saved');
    expect(admin.rows.o1).toMatchObject({ user_id: USER, plan: 'month' });
  });
  it('refuses a purchase made for another account', async () => {
    const out = await verifyAppTransactions(fakeAdmin(), USER, [j(tx({ appAccountToken: '99999999-2222-3333-4444-555555555555' }))], verify);
    expect(out[0].result).toBe('other_account');
  });
  it('never moves a subscription that belongs to someone else', async () => {
    const admin = fakeAdmin({ o1: { user_id: 'someone-else', expires_at: '2027-01-01T00:00:00Z' } });
    const out = await verifyAppTransactions(admin, USER, [j(tx({ appAccountToken: undefined }))], verify);
    expect(out[0].result).toBe('other_account');
  });
  it('a late, older transaction does not shorten access', async () => {
    const admin = fakeAdmin({ o1: { user_id: USER, expires_at: '2027-06-01T00:00:00Z' } });
    expect((await verifyAppTransactions(admin, USER, [j(tx())], verify))[0].result).toBe('kept');
  });
  it('reports a forged one as invalid and keeps going', async () => {
    const out = await verifyAppTransactions(fakeAdmin(), USER, ['bad', j(tx())], verify);
    expect(out.map((r) => r.result)).toEqual(['invalid', 'saved']);
  });
});

describe('handleAppleNotification', () => {
  it('a renewal extends the existing row', async () => {
    const admin = fakeAdmin({ o1: { user_id: USER, expires_at: '2027-01-01T00:00:00Z' } });
    const note = { notificationType: 'DID_RENEW', data: { signedTransactionInfo: j(tx({ transactionId: 't3', expiresDate: Date.UTC(2027, 1, 1) })), signedRenewalInfo: j({ autoRenewStatus: 1 }) } };
    const out = await handleAppleNotification(admin, j(note), verify);
    expect(out.result).toBe('saved');
    expect(admin.rows.o1.expires_at).toBe('2027-02-01T00:00:00.000Z');
  });
  it('a refund revokes access', async () => {
    const admin = fakeAdmin({ o1: { user_id: USER, expires_at: '2027-01-01T00:00:00Z' } });
    await handleAppleNotification(admin, j({ notificationType: 'REFUND', data: { signedTransactionInfo: j(tx()) } }), verify);
    expect(admin.rows.o1.revoked_at).toBeTruthy();
  });
  it('turning auto-renew off is recorded', async () => {
    const admin = fakeAdmin({ o1: { user_id: USER, expires_at: '2027-01-01T00:00:00Z' } });
    await handleAppleNotification(admin, j({ notificationType: 'DID_CHANGE_RENEWAL_STATUS', data: { signedTransactionInfo: j(tx()), signedRenewalInfo: j({ autoRenewStatus: 0 }) } }), verify);
    expect(admin.rows.o1.auto_renew).toBe(false);
  });
  it('ignores a notification it cannot tie to an account', async () => {
    const out = await handleAppleNotification(fakeAdmin(), j({ notificationType: 'SUBSCRIBED', data: { signedTransactionInfo: j(tx({ appAccountToken: undefined })) } }), verify);
    expect(out).toMatchObject({ handled: false, reason: 'unknown_user' });
  });
  it('saveAppleRow refuses to change owners', async () => {
    const admin = fakeAdmin({ o1: { user_id: 'x', expires_at: '2027-01-01T00:00:00Z' } });
    expect(await saveAppleRow(admin, { original_transaction_id: 'o1', user_id: USER, expires_at: '2028-01-01T00:00:00Z' })).toBe('other_account');
  });
});
