import { proFeatureRules } from './_proFeatures.js';
import { hasPremiumAccess } from './_entitlement.js';

// Respect the existing rollout switch and authoritative paid/granted expiry.
// Never use client profile flags or subscription cancellation alone as access.
export async function hasHealthAccess(user, admin) {
  const rules = await proFeatureRules(admin);
  return !rules.enabled || await hasPremiumAccess(user, admin);
}
