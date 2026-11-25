import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { AynaStore } from 'capacitor-ayna-store';

/**
 * May the iPhone app link to buying Pro on the web? Apple allows it for the US App Store
 * storefront only (Guideline 3.1.1(a), May 2025); everywhere else the app may not point to an
 * outside purchase. Founder decision (Ameera, Nov 15): sell Pro in the app through the web
 * checkout for US App Store users. Unknown storefront = not allowed (the safe answer).
 *   'web'     not the iPhone app: the normal Stripe checkout
 *   'us_link' iPhone app, US App Store: prices + a link to checkout on aynahealth.co
 *   'none'    iPhone app anywhere else (or we can't tell): no prices, no link
 */
let cached = null;
let pending = null;

export function proPurchaseModeFor({ native, countryCode }) {
  if (!native) return 'web';
  return countryCode === 'USA' ? 'us_link' : 'none';
}

export async function loadProPurchaseMode({ native = isNative(), lookup = () => AynaStore.storefront() } = {}) {
  if (!native) return 'web';
  if (cached) return cached;
  if (!pending) {
    pending = Promise.resolve().then(lookup).then((r) => proPurchaseModeFor({ native, countryCode: r?.countryCode || null })).catch(() => 'none')
      .then((mode) => { cached = mode; pending = null; return mode; });
  }
  return pending;
}

function isNative() { try { return Capacitor.isNativePlatform(); } catch { return false; } }

/** In a component: 'web' | 'us_link' | 'none'; 'none' until the App Store answers. */
export function useProPurchaseMode(nativeOverride) {
  const native = nativeOverride ?? isNative();
  const [loaded, setLoaded] = useState(() => cached);
  useEffect(() => {
    if (!native) return undefined;
    let live = true;
    loadProPurchaseMode({ native }).then((m) => { if (live) setLoaded(m); });
    return () => { live = false; };
  }, [native]);
  if (!native) return 'web';
  return loaded || 'none';
}

export function _resetStorefront() { cached = null; pending = null; }
