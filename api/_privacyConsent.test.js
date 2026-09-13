import { describe, it, expect, vi } from 'vitest';
import { hasRequiredAiConsent, requireAiConsent, REQUIRED_AI_CONSENT_VERSION } from './_privacyConsent.js';

describe('AI privacy consent gate', () => {
  const valid = { user_metadata: { consent_version: REQUIRED_AI_CONSENT_VERSION, consent_given_at: '2026-09-13T00:00:00.000Z', age_18_confirmed: true } };

  it('allows only the current version with a timestamp and 18+ confirmation', () => {
    expect(hasRequiredAiConsent(valid)).toBe(true);
    expect(hasRequiredAiConsent({ user_metadata: { ...valid.user_metadata, consent_version: 'old' } })).toBe(false);
    expect(hasRequiredAiConsent({ user_metadata: { ...valid.user_metadata, consent_given_at: null } })).toBe(false);
    expect(hasRequiredAiConsent({ user_metadata: { ...valid.user_metadata, age_18_confirmed: false } })).toBe(false);
  });

  it('returns a 403 without leaking data when consent is missing', () => {
    const json = vi.fn();
    const res = { status: vi.fn(() => ({ json })) };
    expect(requireAiConsent({ user_metadata: {} }, res)).toBe(false);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ error: 'ai_consent_required' }));
  });
});
