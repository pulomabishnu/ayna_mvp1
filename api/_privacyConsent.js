export const REQUIRED_AI_CONSENT_VERSION = 'v2-18plus';

export function hasRequiredAiConsent(user) {
  const meta = user?.user_metadata || {};
  return meta.consent_version === REQUIRED_AI_CONSENT_VERSION &&
    Boolean(meta.consent_given_at) &&
    meta.age_18_confirmed === true;
}

export function requireAiConsent(user, res) {
  if (hasRequiredAiConsent(user)) return true;
  res.status(403).json({
    error: 'ai_consent_required',
    message: 'Please review and accept the current AI privacy consent in ayna before using this feature.',
  });
  return false;
}
