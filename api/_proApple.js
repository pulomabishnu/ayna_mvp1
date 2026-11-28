import { createHash } from 'node:crypto';
import { verifyAppleJws, subscriptionRow, AppleJwsError, APPLE_TRIAL_PRODUCT, APPLE_PRO_PRODUCTS } from './_appleJws.js';

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
 * The free trial bought in the app ($0, see APPLE_TRIAL_PRODUCT). One per ayna account, shared with the
 * website's no-card trial (pro_trials), and Apple allows it once per Apple ID. Restores replay it: 'kept'.
 * @returns {{ result: 'saved'|'kept'|'other_account'|'trial_used', transactionId?: string }}
 */
export async function saveAppleTrial(admin, userId, row) {
  const { data: existing, error } = await admin.from('pro_apple_subscriptions')
    .select('user_id').eq('original_transaction_id', row.original_transaction_id).maybeSingle();
  if (error) throw error;
  if (existing) return { result: existing.user_id === userId ? 'kept' : 'other_account', transactionId: row.last_transaction_id };
  const { data: used, error: usedError } = await admin.from('pro_trials').select('user_id').eq('user_id', userId).maybeSingle();
  if (usedError) throw usedError;
  if (used) return { result: 'trial_used', transactionId: row.last_transaction_id };
  const result = await saveAppleRow(admin, row);
  if (result === 'saved') {
    const { error: markError } = await admin.from('pro_trials').upsert({ user_id: userId }, { onConflict: 'user_id' });
    if (markError) throw markError;
  }
  return { result, transactionId: row.last_transaction_id };
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
      if (tx.productId === APPLE_TRIAL_PRODUCT) { results.push(await saveAppleTrial(admin, userId, row)); continue; }
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
  return { handled: true, type: note.notificationType, result: await saveAppleRow(admin, row), analytics: appleAnalyticsEvent(note, tx, renewal) };
}

const NAMES = {
  SUBSCRIBED: 'pro_apple_subscribed', DID_RENEW: 'pro_apple_renewed', EXPIRED: 'pro_apple_expired',
  DID_FAIL_TO_RENEW: 'pro_apple_billing_failed', REFUND: 'pro_apple_refunded', REVOKE: 'pro_apple_refunded',
  DID_CHANGE_RENEWAL_PREF: 'pro_apple_plan_changed', GRACE_PERIOD_EXPIRED: 'pro_apple_expired',
};

/**
 * Nov 27 (founder: "make sure it tracks on PostHog"): what Apple tells the server after the app closes (trial turned
 * paid, canceled, renewed, refunded) as a PostHog event. Pure (tested). Anonymous: keyed on a hash of Apple's
 * subscription id, no person profile, no health data. `environment` separates Sandbox tests from real customers.
 */
export function appleAnalyticsEvent(note, tx, renewal = null) {
  const type = note?.notificationType;
  const sub = note?.subtype || null;
  let event = NAMES[type];
  if (type === 'DID_CHANGE_RENEWAL_STATUS') event = sub === 'AUTO_RENEW_DISABLED' ? 'pro_apple_canceled' : sub === 'AUTO_RENEW_ENABLED' ? 'pro_apple_resumed' : null;
  if (!event || !tx?.originalTransactionId) return null;
  const inTrial = tx.offerDiscountType === 'FREE_TRIAL' || (tx.offerType === 1 && Number(tx.price) === 0);
  const sincePurchase = Number(tx.purchaseDate) - Number(tx.originalPurchaseDate);
  const props = {
    distinct_id: `pro_apple_${createHash('sha256').update(String(tx.originalTransactionId)).digest('hex').slice(0, 24)}`,
    source: 'apple_notification',
    store: 'apple',
    plan: APPLE_PRO_PRODUCTS[tx.productId] || 'unknown',
    environment: tx.environment || note?.data?.environment || 'unknown',
    subtype: sub || undefined,
    in_trial: inTrial,
    amount: Number.isFinite(Number(tx.price)) ? Number(tx.price) / 1000 : undefined,
    currency: tx.currency || undefined,
    ...(note?.notificationUUID ? { $insert_id: `${event}:${note.notificationUUID}` } : {}),
    $process_person_profile: false,
  };
  // The first paid renewal right after a free trial is the trial converting.
  if (type === 'DID_RENEW') props.trial_converted = Number.isFinite(sincePurchase) && sincePurchase > 0 && sincePurchase < 16 * 864e5 && !inTrial;
  if (renewal && typeof renewal.autoRenewStatus === 'number') props.auto_renew = renewal.autoRenewStatus === 1;
  return { event, properties: props };
}
