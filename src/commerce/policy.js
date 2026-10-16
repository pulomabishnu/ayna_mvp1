/**
 * Commerce capability policy: what ayna is allowed to do with each kind of
 * offer. This is the one place that decides it, and the rules that come from
 * a contract (Amazon Associates) cannot be switched on by data or env vars.
 *
 * Why Amazon is hard-coded to redirect-only (Associates Program Policies,
 * updated 2026-04-14, Participation Requirements 6(k), 6(u)):
 *   - an Associate may not place Amazon orders on behalf of anyone else;
 *   - an Associate may not buy through its own links, for itself or others;
 *   - an Associate may not offer Amazon products for resale on its site.
 * So "customer pays ayna, ayna buys it on Amazon" breaks the agreement no
 * matter who places the order: a founder, an employee, or a purchasing API
 * such as Zinc. Changing this needs written approval from Amazon or leaving
 * the Associates program; it is not a feature flag. See
 * docs/commerce/ARCHITECTURE.md.
 */

export const PROVIDERS = Object.freeze({
  AMAZON_ASSOCIATES: 'amazon_associates',
  SHOPMY: 'shopmy',
  SHOPIFY_COLLABS: 'shopify_collabs',
  IMPACT: 'impact',
  BRAND_AFFILIATE: 'brand_affiliate', // a partner's own tracking link or ?ref= code
  BRAND_DIRECT: 'brand_direct', // the brand's own page, no tracking
  RETAILER: 'retailer', // Target, Walmart, ... with no affiliate tracking
  SHOPPABLE: 'shoppable',
  DIRECT_PARTNER_CHECKOUT: 'direct_partner_checkout', // wholesale / dropship agreement
  APP_OR_SERVICE: 'app_or_service',
  UNKNOWN: 'unknown',
});

export const COMMERCE_METHODS = Object.freeze({
  AFFILIATE_REDIRECT: 'affiliate_redirect',
  EXTERNAL_REDIRECT: 'external_redirect', // no affiliate tracking
  PROVIDER_CHECKOUT: 'provider_checkout', // Shoppable's own payment element
  MANAGED_CHECKOUT: 'managed_checkout', // ayna takes payment (Stripe), then fulfils
  NONE: 'none',
});

export const PAYMENT_PROVIDERS = Object.freeze({
  STRIPE: 'stripe',
  SHOPPABLE: 'shoppable',
  EXTERNAL_MERCHANT: 'external_merchant',
});

const AMAZON_HOST = /(^|\.)amazon\.[a-z.]+$|^amzn\.(to|com)$|\.amzn\.com$|^a\.co$/i;

export function isAmazonHost(hostname) {
  return AMAZON_HOST.test(String(hostname || '').toLowerCase());
}

export function isAmazonUrlOrId(value) {
  const s = String(value || '').trim();
  if (!s) return false;
  try {
    return isAmazonHost(new URL(s).hostname);
  } catch {
    return false;
  }
}

/** Classify an outbound URL into a provider. Only hostnames, never guesses about terms. */
export function providerForUrl(url) {
  let host;
  try {
    host = new URL(String(url || '').trim()).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return PROVIDERS.UNKNOWN;
  }
  if (isAmazonHost(host)) return PROVIDERS.AMAZON_ASSOCIATES;
  if (host === 'go.shopmy.us' || host.endsWith('.shopmy.us') || host === 'shopmy.us') return PROVIDERS.SHOPMY;
  if (host === 'collabs.shop' || host.endsWith('.collabs.shop')) return PROVIDERS.SHOPIFY_COLLABS;
  if (host.endsWith('.pxf.io') || host.endsWith('.sjv.io') || host.endsWith('.7eer.net')) return PROVIDERS.IMPACT;
  if (['target.com', 'walmart.com', 'cvs.com', 'walgreens.com', 'iherb.com'].includes(host)) return PROVIDERS.RETAILER;
  return PROVIDERS.BRAND_DIRECT;
}

const REDIRECT_ONLY = Object.freeze({
  affiliateRedirect: true,
  managedCheckout: false,
  manualFulfillment: false,
  providerCheckout: false,
  providerOrdering: false,
  paymentProvider: PAYMENT_PROVIDERS.EXTERNAL_MERCHANT,
});

/**
 * Capabilities for one offer. `offer.agreement` is the only way to unlock
 * managed checkout, and only for non-Amazon providers:
 *   { type: 'wholesale'|'dropship'|'written_permission', reference: string, approvedAt: 'YYYY-MM-DD' }
 * Unknown permission is never treated as allowed.
 *
 * @returns {{ affiliateRedirect: boolean, managedCheckout: boolean, manualFulfillment: boolean,
 *   providerCheckout: boolean, providerOrdering: boolean, paymentProvider: string, reason: string }}
 */
export function capabilitiesFor(offer, env = {}) {
  const provider = offer?.provider || PROVIDERS.UNKNOWN;

  if (provider === PROVIDERS.AMAZON_ASSOCIATES || isAmazonUrlOrId(offer?.destinationUrl) || isAmazonUrlOrId(offer?.purchasingUrl)) {
    // Ignores every override on purpose.
    return { ...REDIRECT_ONLY, reason: 'AMAZON_ASSOCIATES_REDIRECT_ONLY' };
  }

  if (provider === PROVIDERS.SHOPPABLE) {
    const confirmed = String(env.SHOPPABLE_CHECKOUT_ACCESS_CONFIRMED || '') === 'true';
    return {
      affiliateRedirect: false,
      managedCheckout: confirmed,
      manualFulfillment: false,
      providerCheckout: confirmed,
      providerOrdering: false,
      paymentProvider: PAYMENT_PROVIDERS.SHOPPABLE,
      reason: confirmed ? 'SHOPPABLE_CHECKOUT' : 'SHOPPABLE_CHECKOUT_ACCESS_REQUIRES_CONFIRMATION',
    };
  }

  const agreement = offer?.agreement;
  const hasAgreement = Boolean(
    agreement
      && ['wholesale', 'dropship', 'written_permission'].includes(agreement.type)
      && String(agreement.reference || '').trim()
      && /^\d{4}-\d{2}-\d{2}$/.test(String(agreement.approvedAt || '')),
  );
  if (hasAgreement && provider !== PROVIDERS.APP_OR_SERVICE) {
    return {
      affiliateRedirect: false,
      managedCheckout: true,
      manualFulfillment: true,
      providerCheckout: false,
      // Zinc may place a non-Amazon order only when the agreement says so.
      providerOrdering: agreement.allowsPurchasingProvider === true,
      paymentProvider: PAYMENT_PROVIDERS.STRIPE,
      reason: 'PARTNER_MANAGED_CHECKOUT_APPROVED',
    };
  }

  const tracked = [PROVIDERS.SHOPMY, PROVIDERS.SHOPIFY_COLLABS, PROVIDERS.IMPACT, PROVIDERS.BRAND_AFFILIATE].includes(provider);
  return {
    ...REDIRECT_ONLY,
    affiliateRedirect: tracked,
    reason: tracked ? 'AFFILIATE_REDIRECT_DEFAULT' : 'EXTERNAL_REDIRECT_DEFAULT',
  };
}

export class CommercePolicyError extends Error {
  constructor(code, message) {
    super(message || code);
    this.code = code;
  }
}

/** Throws unless ayna may take payment for this offer itself. Call on the server before any charge. */
export function assertManagedCheckoutAllowed(offer, env = {}) {
  const caps = capabilitiesFor(offer, env);
  if (caps.reason === 'AMAZON_ASSOCIATES_REDIRECT_ONLY') {
    throw new CommercePolicyError('AMAZON_REDIRECT_ONLY', 'Amazon products can only be bought on Amazon through a shopper click.');
  }
  if (!caps.managedCheckout || caps.paymentProvider !== PAYMENT_PROVIDERS.STRIPE) {
    throw new CommercePolicyError('MANAGED_CHECKOUT_NOT_ALLOWED', `Managed checkout is not allowed for this offer (${caps.reason}).`);
  }
  return caps;
}

/** Throws unless a purchasing provider (Zinc) may place this order. */
export function assertProviderOrderingAllowed(offer, env = {}) {
  const caps = assertManagedCheckoutAllowed(offer, env);
  if (!caps.providerOrdering) {
    throw new CommercePolicyError('PROVIDER_ORDERING_NOT_ALLOWED', 'This merchant has not agreed to orders from a purchasing provider.');
  }
  return caps;
}
