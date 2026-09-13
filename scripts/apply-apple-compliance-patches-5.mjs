import fs from 'node:fs';

function read(path) { return fs.readFileSync(path, 'utf8'); }
function write(path, text) { fs.writeFileSync(path, text); }
function requiredReplace(text, before, after, label) {
  if (text.includes(after)) return text;
  if (!text.includes(before)) throw new Error(`Missing patch anchor: ${label}`);
  return text.replace(before, after);
}

// Keep the direct premium-user fixture consented while still proving that
// client-writable user_metadata.is_premium cannot grant premium privileges.
{
  const path = 'api/llm-recommendations.integration.test.js';
  let text = read(path);
  const before = "data: { user: { id: 'u-x', email: 'x@x.com', app_metadata: {}, user_metadata: { is_premium: true } } },";
  const after = "data: { user: { id: 'u-x', email: 'x@x.com', app_metadata: {}, user_metadata: { consent_version: 'v2-18plus', consent_given_at: '2026-09-13T00:00:00.000Z', age_18_confirmed: true, ai_health_processing_allowed: true, is_premium: true } } },";
  if (!text.includes(after)) {
    if (!text.includes(before)) {
      // Older generated version may already have consent fields but not the
      // new revocable AI flag.
      const intermediate = "data: { user: { id: 'u-x', email: 'x@x.com', app_metadata: {}, user_metadata: { consent_version: 'v2-18plus', consent_given_at: '2026-09-13T00:00:00.000Z', age_18_confirmed: true, is_premium: true } } },";
      if (!text.includes(intermediate)) throw new Error('Missing direct premium-user fixture anchor');
      text = text.replace(intermediate, after);
    } else {
      text = text.replace(before, after);
    }
    write(path, text);
  }
}

// Desktop signup/social auth must collect the same current 18+ + named-AI
// permission as native mobile. Google OAuth can create an unseen account even
// from the Sign in tab, so those confirmations must be visible there too.
{
  const path = 'src/components/AuthGate.jsx';
  let text = read(path);
  text = text.replace(
    "import { CONSENT_VERSION, stashPendingConsent } from '../utils/pendingConsent.js';",
    "import { AGE_REQUIREMENT_VERSION, CONSENT_VERSION, stashPendingConsent } from '../utils/pendingConsent.js';"
  );
  const oldItems = `const CONSENT_ITEMS = [
  'The health information I share with ayna is self-reported wellness information, not a clinical record.',
  'My wellness data may be processed by an external AI service to personalize recommendations. ayna takes measures to anonymize and secure this information and never sells it.',
  'ayna provides wellness information, not medical advice or a substitute for care from a qualified healthcare provider.',
];`;
  const newItems = `const CONSENT_ITEMS = [
  'The health information I share with ayna is self-reported wellness information, not a clinical record.',
  'When I intentionally use an AI-powered feature, relevant information I provide may be processed by third-party AI providers such as Anthropic, OpenAI, or Google to generate my requested response. ayna minimizes the context sent and does not sell it.',
  'ayna provides wellness information, not medical advice or a substitute for care from a qualified healthcare provider.',
  'I confirm that I am at least 18 years old.',
];`;
  text = requiredReplace(text, oldItems, newItems, 'AuthGate consent items');
  text = text.replace('const [checked, setChecked] = useState([false, false, false]);', 'const [checked, setChecked] = useState([false, false, false, false]);');
  text = text.replaceAll('Please agree to the three statements above', 'Please agree to all four statements above');
  text = text.replace(
    'if (isSignup && !allConsented) {\n      setError("Please agree to all four statements above before continuing.");',
    'if (!allConsented) {\n      setError("Please agree to all four statements above before continuing.");'
  );

  if (!text.includes('ai_health_processing_consented_at: consentAt')) {
    text = text.replaceAll(
      '              consent_version: CONSENT_VERSION,\n',
      '              consent_version: CONSENT_VERSION,\n              age_18_confirmed: true,\n              age_18_confirmed_at: consentAt,\n              age_requirement_version: AGE_REQUIREMENT_VERSION,\n              ai_health_processing_allowed: true,\n              ai_health_processing_consented_at: consentAt,\n              ai_health_processing_revoked_at: null,\n'
    );
  }

  if (!text.includes('Privacy confirmations for Google')) {
    const divider = '        <div style={styles.divider}>\n';
    if (!text.includes(divider)) throw new Error('Missing AuthGate divider anchor');
    const block = `        {!isSignup && (
          <div style={styles.consentSection}>
            <button
              type="button"
              onClick={() => setShowConsentDetails(v => !v)}
              style={styles.consentToggle}
              aria-expanded={showConsentDetails}
            >
              <span>Privacy confirmations for Google</span>
              <span style={{ transform: showConsentDetails ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>⌄</span>
            </button>
            {showConsentDetails && (
              <div style={styles.consentDetails}>
                {CONSENT_ITEMS.map((text, i) => (
                  <label key={i} style={styles.consentItem}>
                    <input
                      type="checkbox"
                      checked={checked[i]}
                      onChange={() => toggleCheck(i)}
                      style={styles.checkbox}
                    />
                    <span style={styles.consentText}>{text}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

`;
    text = text.replace(divider, block + divider);
  }
  write(path, text);
}

// Native email signup records the revocable AI permission too. Logout resets
// the PostHog identity so another account on the same device cannot inherit it.
{
  const path = 'src/mobile/hooks/useSupabaseAuth.js';
  let text = read(path);
  if (!text.includes("import posthog from 'posthog-js';")) {
    text = text.replace("import { useEffect, useState } from 'react';", "import { useEffect, useState } from 'react';\nimport posthog from 'posthog-js';");
  }
  if (!text.includes('ai_health_processing_consented_at: consentAt')) {
    text = text.replace(
      '          age_requirement_version: AGE_REQUIREMENT_VERSION,\n',
      '          age_requirement_version: AGE_REQUIREMENT_VERSION,\n          ai_health_processing_allowed: true,\n          ai_health_processing_consented_at: consentAt,\n          ai_health_processing_revoked_at: null,\n'
    );
  }
  const oldSignOut = `  async function signOut() {
    const supabase = getSupabaseClient();
    if (supabase) await supabase.auth.signOut();
  }`;
  const newSignOut = `  async function signOut() {
    const supabase = getSupabaseClient();
    if (supabase) await supabase.auth.signOut();
    try { posthog.reset(); } catch { /* analytics may be unavailable/opted out */ }
  }`;
  text = requiredReplace(text, oldSignOut, newSignOut, 'mobile auth signout');
  write(path, text);
}

// Clear account-specific in-memory state when signing out, in addition to the
// native persistent-cache hardening in the hooks themselves.
{
  const path = 'src/mobile/MobileApp.jsx';
  let text = read(path);
  text = text.replace(
    'const { savedMap, isSaved, toggleSaved } = useSavedProducts(authUser);',
    'const { savedMap, isSaved, toggleSaved, resetSaved } = useSavedProducts(authUser);'
  );
  const oldSignOut = `  const handleSignOut = () => {
    setOverlay(null);
    resetSession();
    signOutSupabase();
    setScreen('landing');
  };`;
  const newSignOut = `  const handleSignOut = () => {
    setOverlay(null);
    setAskAynaOpen(false);
    setAskAynaHistory([]);
    pendingQuizEcosystemRef.current = null;
    ecosystemFlagsRef.current = { trackedProducts: {}, omittedProducts: {} };
    resetSaved();
    resetSession();
    signOutSupabase();
    setScreen('landing');
  };`;
  text = requiredReplace(text, oldSignOut, newSignOut, 'MobileApp signout state reset');
  write(path, text);
}

// Privacy & Data uses the same persisted analytics choice as first launch and
// exposes a reversible account-level AI permission that the API enforces.
{
  const path = 'src/mobile/screens/profile/ProfileFlow.jsx';
  let text = read(path);
  if (!text.includes("import posthog from 'posthog-js';")) {
    text = text.replace("import { useEffect, useMemo, useState } from 'react';", "import { useEffect, useMemo, useState } from 'react';\nimport posthog from 'posthog-js';");
  }
  if (!text.includes("../../../utils/analyticsConsent.js")) {
    text = text.replace(
      "import LegalFooter from '../../components/LegalFooter.jsx';",
      "import LegalFooter from '../../components/LegalFooter.jsx';\nimport { denyConsent, getStoredConsent, grantConsent } from '../../../utils/analyticsConsent.js';\nimport { grantCurrentUserConsent, hasCurrentConsent, revokeCurrentUserAiConsent } from '../../../utils/pendingConsent.js';"
    );
  }

  const oldBlock = `// Real toggle: PostHog's own opt-out API (posthog-js exposes
// opt_out_capturing/opt_in_capturing/has_opted_out_capturing — see
// src/main.jsx for the real init). Not a stored per-user backend flag, but
// a genuine SDK call, not invented state — and this app has no analytics
// consent UI anywhere yet, so this is the first place it's wired up.
// window.posthog may be undefined if VITE_PUBLIC_POSTHOG_KEY isn't set
// (e.g. this dev environment) — every call below is guarded for that.
function isAnalyticsOptedOut() {
  try { return typeof window !== 'undefined' && window.posthog?.has_opted_out_capturing?.() === true; } catch { return false; }
}

function PrivacyDataScreen({ onBack, onOpenManageData, onOpenDeleteAccount }) {
  const [analyticsOptedOut, setAnalyticsOptedOut] = useState(isAnalyticsOptedOut);

  const toggleAnalytics = () => {
    const nextOptedOut = !analyticsOptedOut;
    setAnalyticsOptedOut(nextOptedOut);
    try {
      if (nextOptedOut) window.posthog?.opt_out_capturing?.();
      else window.posthog?.opt_in_capturing?.();
    } catch { /* posthog not initialized in this environment */ }
  };`;
  const newBlock = `function readAnalyticsEnabled() {
  return getStoredConsent() === 'granted';
}

function PrivacyDataScreen({ onBack, onOpenManageData, onOpenDeleteAccount, authUser }) {
  const [analyticsEnabled, setAnalyticsEnabled] = useState(readAnalyticsEnabled);
  const [aiOverride, setAiOverride] = useState(null);
  const [privacyStatus, setPrivacyStatus] = useState('');
  const aiEnabled = aiOverride ?? hasCurrentConsent(authUser);

  const toggleAnalytics = () => {
    const next = !analyticsEnabled;
    setAnalyticsEnabled(next);
    try {
      if (next) grantConsent(posthog);
      else denyConsent(posthog);
    } catch {
      setAnalyticsEnabled(!next);
      setPrivacyStatus('Analytics choice could not be saved right now.');
    }
  };

  const toggleAi = async () => {
    if (!authUser) {
      setPrivacyStatus('Sign in to change AI permission for your account.');
      return;
    }
    const supabase = getSupabaseClient();
    if (!supabase) {
      setPrivacyStatus('AI permission is not available right now.');
      return;
    }
    setPrivacyStatus('');
    try {
      if (aiEnabled) {
        await revokeCurrentUserAiConsent(supabase);
        setAiOverride(false);
        setPrivacyStatus('AI features are off. Non-AI parts of ayna still work.');
      } else {
        if (authUser?.user_metadata?.age_18_confirmed !== true) {
          setPrivacyStatus('Open an AI feature first to review the 18+ and AI privacy confirmation.');
          return;
        }
        await grantCurrentUserConsent(supabase);
        setAiOverride(true);
        setPrivacyStatus('AI features are allowed for this account.');
      }
    } catch (e) {
      setPrivacyStatus(e?.message || 'AI permission could not be changed right now.');
    }
  };`;
  text = requiredReplace(text, oldBlock, newBlock, 'ProfileFlow privacy toggles');
  text = text.replace('on={!analyticsOptedOut}\n            onClick={toggleAnalytics}', 'on={analyticsEnabled}\n            onClick={toggleAnalytics}');
  const analyticsRow = `            sub="Usage analytics that help us understand how the app is used. We do not include your health-profile answers."
            on={analyticsEnabled}
            onClick={toggleAnalytics}
          />`;
  const rows = `            sub="Optional product analytics. On iPhone this stays off until you allow it. Health answers, AI messages, SMS content, names, emails, phone numbers, and raw searches are filtered from analytics events."
            on={analyticsEnabled}
            onClick={toggleAnalytics}
          />
          <ToggleRow
            title="Allow AI features"
            sub="When on, the minimum relevant context for an AI feature may be sent to Anthropic, OpenAI, or Google to generate the response. Turn this off any time without deleting your account or health profile."
            on={aiEnabled}
            onClick={toggleAi}
          />`;
  text = requiredReplace(text, analyticsRow, rows, 'ProfileFlow analytics/AI rows');

  const afterShareBox = `        </div>

        <div style={{ marginTop: 14, background: 'var(--ayna-surface)', border: '1px solid var(--ayna-border)', borderRadius: 22, padding: '16px 18px' }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 'calc(9.5px * var(--ayna-text-scale, 1))', letterSpacing: '1.3px', textTransform: 'uppercase', color: 'var(--ayna-accent-dark)', marginBottom: 8 }}>How AI is used</div>`;
  const withStatus = `        </div>
        {privacyStatus && <div style={{ marginTop: 9, padding: '0 4px', fontSize: 'calc(11.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', lineHeight: 1.5 }}>{privacyStatus}</div>}

        <div style={{ marginTop: 14, background: 'var(--ayna-surface)', border: '1px solid var(--ayna-border)', borderRadius: 22, padding: '16px 18px' }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 'calc(9.5px * var(--ayna-text-scale, 1))', letterSpacing: '1.3px', textTransform: 'uppercase', color: 'var(--ayna-accent-dark)', marginBottom: 8 }}>How AI is used</div>`;
  text = requiredReplace(text, afterShareBox, withStatus, 'ProfileFlow privacy status');

  text = text.replace(
    `Ask Ayna and match explanations are powered by a third-party AI provider (Anthropic). Your questions and relevant profile details are shared with them to generate a response — never sold, and never used to train anyone else's model.`,
    `AI-powered features may use Anthropic, OpenAI, or Google depending on the feature and provider availability. They only receive the context needed to generate the response after you allow AI features. ayna does not sell that information.`
  );
  text = text.replace(
    `Deletion removes your account and health answers from our active systems. We may keep limited records where the law requires it — never your health data.`,
    `Deletion removes account-linked data from the active systems ayna controls. Limited records may remain where law requires, and processor backups may expire under their documented retention schedules.`
  );
  text = text.replace(
    `Your intake answers, your questions to Ask Ayna, and the products you save. We use them to build your matches, explain why a product fits, and flag safety recalls on what you own — nothing else.`,
    `Depending on what you use, this can include intake answers, AI questions, saved or tracked products, account/contact details, preferences, and user-initiated SMS health conversations. We use them to provide the features you request, personalize matches, and support safety or account functions.`
  );
  text = text.replace('Five service providers, each doing exactly one job for us.', 'These service-provider groups support specific parts of ayna.');
  text = text.replace(
    `{ initial: 'P', name: 'PostHog', role: 'Anonymised usage analytics — off any time in Privacy & data.', bg: '#F1EDE6', fg: '#6B6257' },`,
    `{ initial: 'P', name: 'PostHog', role: 'Optional product analytics after you opt in on iPhone; sensitive health, message, search, and direct-identifier fields are filtered.', bg: '#F1EDE6', fg: '#6B6257' },`
  );
  if (!text.includes("Turn off third-party AI processing")) {
    text = text.replace(
      `{ title: 'Withdraw consent for analytics', how: 'Settings → Privacy & data → the analytics toggle' },`,
      `{ title: 'Withdraw consent for analytics', how: 'Settings → Privacy & data → the analytics toggle' },\n  { title: 'Turn off third-party AI processing', how: 'Settings → Privacy & data → Allow AI features' },`
    );
  }
  text = text.replace(
`// the rights described map to screens that already exist and work (Manage
// my data / Download my data, the analytics opt-out toggle in Privacy &
// data, account deletion via the email below) rather than promises of
// features that don't exist yet.`,
`// the rights described map to screens that already exist and work (Manage
// my data / Download my data, analytics and AI permission toggles, and direct
// in-app account deletion) rather than promises of features that do not exist.`
  );
  text = text.replace(
`      <PrivacyDataScreen
        onBack={goBack}
        onOpenManageData={() => pushScreen('manageData')}
        onOpenDeleteAccount={() => pushScreen('deleteAccount')}
      />`,
`      <PrivacyDataScreen
        onBack={goBack}
        onOpenManageData={() => pushScreen('manageData')}
        onOpenDeleteAccount={() => pushScreen('deleteAccount')}
        authUser={authUser}
      />`
  );
  write(path, text);
}

console.log('Final consent withdrawal and local-device privacy patches applied.');
