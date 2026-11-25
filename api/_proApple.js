import { verifyAppleJws, subscriptionRow, AppleJwsError } from './_appleJws.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Save one verified Apple subscription row. Never moves a subscription to a different account,
 * and never lets an older transaction (arriving late) shorten a later expiry.
 * @returns {'saved'|'kept'|'other_account'}
 */
export async function saveAppleRow(admin, row) {
  const { data: existing, error } = await admin.from('pro_apple_subscriptions')
    .select('user_id, expires_at, revoked_at').eq('original_transaction_id', row.original_transaction_id).maybeSingle();
  if (error) throw error;
  if (existing && existing.user_id !== row.user_id) return 'other_account';
  if (existing && !row.revoked_at && Date.parse(existing.expires_at) > Date.parse(row.expires_at)) return 'kept';
  const { error: upsertError } = await admin.from('pro_apple_subscriptions').upsert(row, { onConflict: 'original_transaction_id' });
  if (upsertError) throw upsertError;
  return 'saved';
}

/**
 * From the app: signed transactions from a purchase, a restore or Transaction.updates.
 * The purchase carries her account id as appAccountToken; a transaction tied to another
 * account is refused.
 */
export async function verifyAppTransactions(admin, userId, list, verify = verifyAppleJws) {
  const results = [];
  for (const jws of (Array.isArray(list) ? list : []).filter((x) => typeof x === 'string' && x.length < 20000).slice(0, 20)) {
    try {
      const tx = verify(jws);
      if (tx.appAccountToken && String(tx.appAccountToken).toLowerCase() !== String(userId).toLowerCase()) { results.push({ result: 'other_account' }); continue; }
      const row = subscriptionRow(tx, userId);
      results.push({ result: await saveAppleRow(admin, row), transactionId: row.last_transaction_id });
    } catch (e) {
      if (e instanceof AppleJwsError) { results.push({ result: 'invalid', reason: e.reason }); continue; }
      throw e;
    }
  }
  return results;
}

/**
 * App Store Server Notifications V2: renewals, expiry, refunds, auto-renew on/off.
 * Who it belongs to comes from the row we already have, or from appAccountToken.
 */
export async function handleAppleNotification(admin, signedPayload, verify = verifyAppleJws) {
  const note = verify(signedPayload);
  const data = note?.data || {};
  if (!data.signedTransactionInfo) return { handled: false, type: note?.notificationType || null };
  const tx = verify(data.signedTransactionInfo);
  const renewal = data.signedRenewalInfo ? verify(data.signedRenewalInfo) : null;
  const { data: existing, error } = await admin.from('pro_apple_subscriptions')
    .select('user_id').eq('original_transaction_id', String(tx.originalTransactionId)).maybeSingle();
  if (error) throw error;
  const userId = existing?.user_id || (UUID.test(String(tx.appAccountToken || '')) ? String(tx.appAccountToken).toLowerCase() : null);
  if (!userId) return { handled: false, type: note.notificationType, reason: 'unknown_user' };
  const row = subscriptionRow(tx, userId);
  if (renewal && typeof renewal.autoRenewStatus === 'number') row.auto_renew = renewal.autoRenewStatus === 1;
  if (['REFUND', 'REVOKE'].includes(note.notificationType) && !row.revoked_at) row.revoked_at = new Date().toISOString();
  return { handled: true, type: note.notificationType, result: await saveAppleRow(admin, row) };
}
