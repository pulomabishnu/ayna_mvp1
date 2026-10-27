/* global process */
import Stripe from 'stripe';
import { getServiceClient } from './_usageLimit.js';

export const PRO_FLOW = 'ayna_pro_early_access_v1';
export const PRO_PLANS = {
  month: {
    amount: 499,
    standardAmount: 899,
    regularAmount: 899,
    couponEnv: 'STRIPE_PRO_MONTH_COUPON_ID',
    recurringEnv: 'STRIPE_PRO_MONTH_RENEWAL_PRICE_ID',
    label: 'First month',
  },
  year: {
    amount: 4500,
    standardAmount: 9000,
    regularAmount: 9000,
    couponEnv: 'STRIPE_PRO_YEAR_COUPON_ID',
    recurringEnv: 'STRIPE_PRO_YEAR_RENEWAL_PRICE_ID',
    label: 'First year',
  },
};
export const objectId = value => typeof value === 'string' ? value : value?.id;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function proConfig() {
  const key = process.env.STRIPE_RESTRICTED_KEY;
  const mode = process.env.STRIPE_PRO_LIVEMODE;
  const origin = new URL(process.env.SITE_URL || 'https://www.aynahealth.co');
  if (!['http:', 'https:'].includes(origin.protocol) || (origin.protocol !== 'https:' && origin.hostname !== 'localhost')) throw new Error('Invalid SITE_URL');
  const enabled = process.env.PRO_BILLING_ENABLED === '1' && process.env.PRO_CHECKOUT_ENABLED === '1';
  if (!key || !process.env.STRIPE_PRO_WEBHOOK_SECRET || !process.env.STRIPE_PRO_PRODUCT_ID ||
      !Object.values(PRO_PLANS).every(p => process.env[p.couponEnv] && process.env[p.recurringEnv]) ||
      !['true', 'false'].includes(mode)) throw new Error('Pro billing is not configured');
  return { enabled, livemode: mode === 'true', key, origin: origin.origin,
    product: process.env.STRIPE_PRO_PRODUCT_ID, webhookSecret: process.env.STRIPE_PRO_WEBHOOK_SECRET };
}
export function proStripe() { return new Stripe(proConfig().key, { apiVersion: '2026-08-26.dahlia', maxNetworkRetries: 2, timeout: 10000 }); }
export function proAdmin() {
  const admin = getServiceClient();
  if (!admin) throw new Error('Pro database unavailable');
  return admin;
}
export async function proStatus(admin, userId) {
  const { data, error } = await admin.rpc('pro_access_status', { p_user_id: userId });
  if (error || !data || typeof data.active !== 'boolean') throw new Error('Pro status unavailable');
  return data;
}
export function renewalDate(launchAt, plan) {
  const date = new Date(launchAt);
  if (!Number.isFinite(date.getTime())) throw new Error('Launch date required');
  const day = date.getUTCDate(); date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + (plan === 'year' ? 12 : 1));
  const max = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(day, max));
  return Math.floor(date.getTime() / 1000);
}
export async function validateProPrices(stripe, plan) {
  const offer = PRO_PLANS[plan], config = proConfig();
  const [renewal, coupon] = await Promise.all([
    stripe.prices.retrieve(process.env[offer.recurringEnv]),
    stripe.coupons.retrieve(process.env[offer.couponEnv]),
  ]);
  const common = p => p.active && p.currency === 'usd' && p.product === config.product && p.livemode === config.livemode;
  const discountAmount = offer.standardAmount - offer.amount;
  if (!common(renewal) || renewal.type !== 'recurring' || renewal.unit_amount !== offer.regularAmount ||
      renewal.recurring?.interval !== plan || renewal.recurring?.interval_count !== 1 || renewal.recurring?.usage_type !== 'licensed' ||
      !coupon.valid || coupon.livemode !== config.livemode || coupon.duration !== 'once' || coupon.currency !== 'usd' ||
      coupon.amount_off !== discountAmount || coupon.percent_off !== null) throw new Error('Pro price configuration mismatch');
  return { renewal: renewal.id, coupon: coupon.id };
}
export async function revokeProPayment(admin, paymentIntent, reason, at) {
  if (!paymentIntent) return;
  const { error } = await admin.from('pro_payment_revocations').upsert({ payment_intent_id: paymentIntent, reason, revoked_at: at }, { onConflict: 'payment_intent_id', ignoreDuplicates: true });
  if (error) throw new Error('Pro revocation could not be saved');
}
async function accountExists(admin, userId) {
  const { data, error } = await admin.auth.admin.getUserById(userId);
  if (error?.status === 404 || (!error && !data?.user)) return false;
  if (error) throw new Error('Could not resolve Pro account');
  return true;
}
async function saveGrant(admin, grant) {
  const { error } = await admin.from('pro_purchases').upsert(grant, { onConflict: 'session_id', ignoreDuplicates: true });
  if (error) throw new Error('Pro purchase could not be saved');
}
async function invoiceIntent(stripe, invoiceId) {
  const payments = await stripe.invoicePayments.list({ invoice: invoiceId, status: 'paid', limit: 100 });
  const payment = payments.data.find(p => p.payment?.type === 'payment_intent');
  if (!payment) return null;
  return stripe.paymentIntents.retrieve(objectId(payment.payment.payment_intent), { expand: ['latest_charge'] });
}
export async function syncProSubscription(stripe, admin, subscriptionId) {
  const sub = await stripe.subscriptions.retrieve(subscriptionId);
  if (sub.metadata?.flow !== PRO_FLOW) return null;
  const userId = sub.metadata.user_id, plan = sub.metadata.plan;
  if (!uuid.test(userId || '') || !Object.hasOwn(PRO_PLANS, plan) || sub.livemode !== proConfig().livemode) throw new Error('Invalid Pro subscription');
  if (!await accountExists(admin, userId)) {
    if (!['canceled', 'incomplete_expired'].includes(sub.status)) await stripe.subscriptions.cancel(sub.id);
    return null;
  }
  const { error } = await admin.from('pro_subscriptions').upsert({
    subscription_id: sub.id, user_id: userId, customer_id: objectId(sub.customer), plan,
    status: sub.status, cancel_at_period_end: sub.cancel_at_period_end === true,
  }, { onConflict: 'subscription_id' });
  if (error) throw new Error('Could not save subscription');
  return sub;
}
export async function fulfillProSession(stripe, admin, sessionId, paidAt) {
  const config = proConfig();
  const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['line_items.data.price'] });
  if (session.metadata?.flow !== PRO_FLOW) return;
  const plan = session.metadata.plan, userId = session.client_reference_id;
  if (session.mode !== 'subscription' || session.livemode !== config.livemode || !uuid.test(userId || '') ||
      session.metadata.user_id !== userId || !Object.hasOwn(PRO_PLANS, plan)) throw new Error('Invalid Pro session');
  if (session.payment_status !== 'paid' || session.status !== 'complete') return;
  const offer = PRO_PLANS[plan], items = session.line_items;
  const upfront = items?.data?.find(i => i.price?.type === 'one_time' && i.price?.product === config.product &&
    i.price?.currency === 'usd' && i.price?.unit_amount === offer.standardAmount);
  const recurring = items?.data?.find(i => i.price?.id === process.env[offer.recurringEnv]);
  const expectedDiscount = offer.standardAmount - offer.amount;
  if (!items || items.has_more || items.data.length !== 2 || !upfront || !recurring ||
      upfront.quantity !== 1 || recurring.quantity !== 1 || upfront.price.product !== config.product || recurring.price.product !== config.product ||
      upfront.price.unit_amount !== offer.standardAmount || recurring.price.unit_amount !== offer.regularAmount ||
      session.currency !== 'usd' || session.amount_subtotal !== offer.standardAmount ||
      session.total_details?.amount_discount !== expectedDiscount || session.amount_total !== offer.amount) throw new Error('Invalid Pro line items');
  const intent = await invoiceIntent(stripe, objectId(session.invoice));
  if (intent?.status !== 'succeeded' || intent.latest_charge?.status !== 'succeeded') throw new Error('Payment not settled');
  const sub = await syncProSubscription(stripe, admin, objectId(session.subscription));
  if (!sub) return;
  if (sub.metadata.user_id !== userId || sub.metadata.plan !== plan || String(sub.trial_end) !== session.metadata.renew_at) throw new Error('Invalid Pro term');
  const { data: revoked, error: revocationError } = await admin.from('pro_payment_revocations').select('payment_intent_id').eq('payment_intent_id', intent.id).maybeSingle();
  if (revocationError) throw new Error('Could not read revocation');
  if (revoked || intent.latest_charge.refunded || intent.latest_charge.disputed) {
    if (!revoked) await revokeProPayment(admin, intent.id, intent.latest_charge.disputed ? 'dispute' : 'refund', paidAt);
    if (sub.status !== 'canceled') await stripe.subscriptions.cancel(sub.id);
  }
  await saveGrant(admin, { session_id: session.id, payment_intent_id: intent.id, user_id: userId, plan, paid_at: paidAt,
    price_id: upfront.price.id, livemode: config.livemode, subscription_id: sub.id,
    term_starts_at: session.metadata.launch_at, term_ends_at: new Date(Number(session.metadata.renew_at) * 1000).toISOString() });
}
export async function fulfillProInvoice(stripe, admin, invoiceId, paidAt) {
  const invoice = await stripe.invoices.retrieve(invoiceId);
  if (invoice.billing_reason !== 'subscription_cycle' || invoice.status !== 'paid' || invoice.livemode !== proConfig().livemode) return;
  const subId = objectId(invoice.parent?.subscription_details?.subscription);
  if (!subId) return;
  const sub = await syncProSubscription(stripe, admin, subId);
  if (!sub) return;
  const plan = sub.metadata.plan, offer = PRO_PLANS[plan];
  const lines = await stripe.invoices.listLineItems(invoiceId, { limit: 100 });
  const line = lines.data.find(l => l.pricing?.price_details?.price === process.env[offer.recurringEnv] && !l.parent?.subscription_item_details?.proration);
  if (!line || line.quantity !== 1 || line.amount !== offer.regularAmount || invoice.currency !== 'usd' || !line.period?.end) throw new Error('Invalid Pro renewal invoice');
  const intent = await invoiceIntent(stripe, invoice.id);
  if (intent?.latest_charge?.refunded || intent?.latest_charge?.disputed) await revokeProPayment(admin, intent.id, 'refund', paidAt);
  await saveGrant(admin, { session_id: invoice.id, payment_intent_id: intent?.id || `invoice_${invoice.id}`, user_id: sub.metadata.user_id,
    subscription_id: sub.id, plan, paid_at: paidAt, price_id: process.env[offer.recurringEnv], livemode: invoice.livemode,
    term_starts_at: new Date(line.period.start * 1000).toISOString(), term_ends_at: new Date(line.period.end * 1000).toISOString() });
}
export async function cancelRefundedSubscription(stripe, admin, paymentIntent) {
  const { data, error } = await admin.from('pro_purchases').select('subscription_id').eq('payment_intent_id', paymentIntent).maybeSingle();
  if (error) throw new Error('Could not resolve refunded subscription');
  if (data?.subscription_id) {
    const sub = await stripe.subscriptions.retrieve(data.subscription_id);
    if (sub.status !== 'canceled') await stripe.subscriptions.cancel(sub.id);
    await syncProSubscription(stripe, admin, sub.id);
  }
}
