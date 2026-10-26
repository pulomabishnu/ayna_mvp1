// What a new account agrees to, shared by the website (AuthGate.jsx) and the
// app (SigninScreen.jsx) so the two forms cannot drift apart.
//
// Onboarding audit (Oct 25, P1 #2): one real choice, the AI processing
// consent, stays a required checkbox. The two acknowledgements (what she
// shares is self-reported, ayna is not medical advice) and the 18+
// confirmation are kept word for word in meaning, as one sentence right above
// the create-account button. Nothing that was required before is dropped.
import { CONSENT_VERSION } from './pendingConsent.js';

/** The one checkbox (wording from the 2026-09 legal hardening on main). */
export const AI_CONSENT_TEXT = 'When I intentionally use an AI-powered feature, limited relevant wellness context may be processed by an external AI provider to generate my requested response. ayna minimizes the context sent, protects it in transit, and does not sell it.';
export const AI_CONSENT_ERROR = 'Tick this box to agree to how AI features may process your wellness context.';

/**
 * The acknowledgements as one sentence, ending where the legal links go.
 * `action`: what she is doing ("creating an account", "continuing").
 */
export function acknowledgementLead(action = 'creating an account') {
  return `By ${action}, you confirm you are 18 or older, that the health information you share with ayna is self-reported wellness information and not a clinical record, that ayna provides wellness information, not medical advice or a substitute for care from a qualified healthcare provider, and you agree to our`;
}

export const LEGAL_LINKS = [
  { href: '/privacy-policy', label: 'Privacy policy' },
  { href: '/consumer-health-data', label: 'Consumer health data privacy notice' },
  { href: '/terms-of-use', label: 'Terms of use' },
];

export const AGE_REQUIREMENT_VERSION = '18plus-v1';

/** Consent + 18+ fields recorded on every new account (all sign-up paths and ConsentGate). */
export function consentMetadata(now = new Date().toISOString()) {
  return {
    consent_given_at: now,
    consent_version: CONSENT_VERSION,
    ai_processing_consent: true,
    acknowledgements_shown: true,
    age_18_confirmed: true,
    age_18_confirmed_at: now,
    age_requirement_version: AGE_REQUIREMENT_VERSION,
  };
}

// "Where did you hear about us?" is optional and asked after sign-up
// (HeardAboutPrompt.jsx). A sign-up sets this flag; the prompt shows once
// she is signed in, then clears it whether she answers or skips.
const HEARD_FLAG = 'ayna_ask_heard_about';
const HEARD_FLAG_TTL = 24 * 60 * 60 * 1000;

export function markAskHeardAbout() {
  try { localStorage.setItem(HEARD_FLAG, String(Date.now())); } catch { /* storage unavailable: the question is optional */ }
}

export function shouldAskHeardAbout(user) {
  if (!user || user.user_metadata?.heard_about) return false;
  try {
    const at = Number(localStorage.getItem(HEARD_FLAG));
    return Number.isFinite(at) && at > 0 && Date.now() - at < HEARD_FLAG_TTL;
  } catch {
    return false;
  }
}

export function clearAskHeardAbout() {
  try { localStorage.removeItem(HEARD_FLAG); } catch { /* ignore */ }
}
