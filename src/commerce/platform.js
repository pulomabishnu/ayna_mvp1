/**
 * Which surface we're on, for commerce rules that differ by surface.
 * Amazon links are allowed in the native app only after Amazon approves it
 * as an Approved Mobile Application (Associates Mobile Application Policy);
 * set VITE_AMAZON_MOBILE_APP_APPROVED=true once that approval is in writing.
 */
import { Capacitor } from '@capacitor/core';

export function isNativeApp() {
  try {
    return Boolean(Capacitor?.isNativePlatform?.());
  } catch {
    return false;
  }
}

export function commerceContext() {
  const env = (typeof import.meta !== 'undefined' && import.meta.env) || {};
  return {
    platform: isNativeApp() ? 'native' : 'web',
    env: {
      VITE_AMAZON_MOBILE_APP_APPROVED: env.VITE_AMAZON_MOBILE_APP_APPROVED,
      // 'legacy' (default): where no verified price exists yet, cards keep the
      // existing catalog text. 'verified_only': cards show only verified prices
      // and say "See current price on Amazon/<merchant>" otherwise. Switch only
      // after the founders approve the card change (docs/commerce/AMAZON.md).
      VITE_COMMERCE_PRICE_MODE: env.VITE_COMMERCE_PRICE_MODE,
    },
  };
}
