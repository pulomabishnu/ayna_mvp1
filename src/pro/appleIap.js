import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { AynaStore } from 'capacitor-ayna-store';
import { getSupabaseClient } from '../utils/supabaseClient.js';
import { apiUrl } from '../utils/apiUrl.js';
import { announceProChanged } from './paywall.js';

/**
 * ayna Pro through Apple in-app purchase in the iPhone app (App Review 3.1.1 / 3.1.3(b), Nov 25).
 * The website keeps Stripe. Product ids must match App Store Connect and api/_appleJws.js.
 */
export const APPLE_PRODUCTS = { year: 'co.aynahealth.app.pro.yearly', month: 'co.aynahealth.app.pro.monthly' };
const PLAN_BY_PRODUCT = Object.fromEntries(Object.entries(APPLE_PRODUCTS).map(([plan, id]) => [id, plan]));

/** True in the iPhone app, where Pro is sold with Apple in-app purchase. */
export function usesAppleIap() {
  try { return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios'; } catch { return false; }
}

async function session() {
  const client = getSupabaseClient();
  const { data } = client ? await client.auth.getSession() : { data: null };
  return data?.session || null;
}

/** Send Apple's signed transactions to ayna, which verifies them before Pro unlocks. */
export async function sendAppleTransactions(jwsList) {
  const s = await session();
  const list = (jwsList || []).filter(Boolean);
  if (!s?.access_token || !list.length) return { ok: false, results: [] };
  const res = await fetch(apiUrl('/api/pro'), {
    method: 'POST',
    headers: { Authorization: `Bearer ${s.access_token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'apple_verify', transactions: list }),
  });
  const out = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error('We couldn’t confirm your purchase yet. Tap Restore purchases in a minute.'), { code: 'verify_failed' });
  if (out.active) announceProChanged();
  return out;
}

/**
 * Pro plans with Apple's localized prices, e.g.
 * { year: { id, plan: 'year', displayPrice: '$89.99', intro: { displayPrice: '$44.99', ... }, introEligible } }
 */
export async function loadAppleProducts() {
  const { products = [] } = await AynaStore.products({ ids: Object.values(APPLE_PRODUCTS) });
  const out = {};
  for (const p of products) {
    const plan = PLAN_BY_PRODUCT[p.id];
    if (plan) out[plan] = { ...p, plan, intro: p.introOffer || null };
  }
  return out;
}

export function useAppleProducts(enabled) {
  const [state, setState] = useState({ status: enabled ? 'loading' : 'off', products: {} });
  useEffect(() => {
    if (!enabled) return undefined;
    let live = true;
    loadAppleProducts()
      .then((products) => { if (live) setState({ status: Object.keys(products).length ? 'ready' : 'empty', products }); })
      .catch(() => { if (live) setState({ status: 'error', products: {} }); });
    return () => { live = false; };
  }, [enabled]);
  return state;
}

/**
 * Buy a plan. Resolves 'success' | 'pending' | 'cancelled'. A purchase is finished with Apple only
 * after ayna has saved it, so nothing is lost if the network drops: Apple redelivers it.
 */
export async function buyWithApple(plan) {
  const s = await session();
  if (!s?.user?.id) throw Object.assign(new Error('Sign in to your ayna account first.'), { code: 'sign_in_required' });
  const id = APPLE_PRODUCTS[plan];
  if (!id) throw new Error('That plan isn’t available.');
  const result = await AynaStore.purchase({ id, appAccountToken: s.user.id });
  if (result.status !== 'success') return result.status;
  const out = await sendAppleTransactions([result.jws]);
  // Only finished once ayna has saved it; otherwise Apple hands it back next launch.
  if (!out.ok) throw Object.assign(new Error('We couldn’t confirm your purchase yet. Tap Restore purchases in a minute.'), { code: 'verify_failed' });
  try { await AynaStore.finish({ transactionId: result.transactionId }); } catch { /* finished next launch */ }
  return 'success';
}

/** "Restore purchases": her active Apple subscription goes back on her ayna account. */
export async function restoreApplePurchases() {
  const { transactions = [] } = await AynaStore.restore();
  if (!transactions.length) return { restored: false };
  const out = await sendAppleTransactions(transactions.map((t) => t.jws));
  const otherAccount = (out.results || []).some((r) => r.result === 'other_account');
  return { restored: Boolean(out.active), otherAccount, results: out.results || [] };
}

export async function manageAppleSubscription() {
  await AynaStore.manageSubscriptions();
}

/**
 * Renewals, Ask to Buy approvals and purchases from another device arrive while the app runs.
 * Started once at app launch (MobileApp). Each is sent to ayna, then finished.
 */
let listening = false;
export function listenForAppleTransactions() {
  if (listening || !usesAppleIap()) return;
  listening = true;
  AynaStore.addListener('transaction', async (t) => {
    try {
      const out = await sendAppleTransactions([t.jws]);
      if (out.ok) await AynaStore.finish({ transactionId: t.transactionId });
    } catch { /* stays unfinished; Apple delivers it again next launch */ }
  }).catch(() => { listening = false; });
}

/** "$89.99/year", "$8.99/month". */
export function perPeriod(p) {
  if (!p) return '';
  const unit = p.periodUnit === 'year' ? 'year' : p.periodUnit === 'month' ? 'month' : p.periodUnit || '';
  return p.periodValue > 1 ? `${p.displayPrice} every ${p.periodValue} ${unit}s` : `${p.displayPrice}/${unit}`;
}

/** "First year $44.99", "First month $4.99", "1 week free"; '' when she can't get the intro offer. */
export function introLine(p) {
  const i = p?.introEligible ? p.intro : null;
  if (!i) return '';
  const span = `${i.periodValue * Math.max(1, i.periodCount)} ${i.periodUnit}${i.periodValue * Math.max(1, i.periodCount) > 1 ? 's' : ''}`;
  if (i.paymentMode === 'freeTrial') return `${span} free`;
  if (i.paymentMode === 'payUpFront') return `First ${span === `1 ${i.periodUnit}` ? i.periodUnit : span} ${i.displayPrice}`;
  return `${i.displayPrice}/${i.periodUnit} for ${span}`;
}
