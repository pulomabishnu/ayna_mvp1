import fs from 'node:fs';

function read(path) { return fs.readFileSync(path, 'utf8'); }
function write(path, text) { fs.writeFileSync(path, text); }

function replaceExact(path, before, after) {
  let text = read(path);
  if (text.includes(after)) return false;
  if (!text.includes(before)) throw new Error(`Missing patch anchor in ${path}: ${before.slice(0, 100)}`);
  text = text.replace(before, after);
  write(path, text);
  return true;
}

// ---- Mobile auth and consent -------------------------------------------------
replaceExact(
  'src/mobile/hooks/useSupabaseAuth.js',
  "import { Capacitor } from '@capacitor/core';",
  "import { Capacitor, registerPlugin } from '@capacitor/core';"
);
replaceExact(
  'src/mobile/hooks/useSupabaseAuth.js',
  "import { CONSENT_VERSION, stashPendingConsent, flushPendingConsent } from '../../utils/pendingConsent.js';",
  "import { AGE_REQUIREMENT_VERSION, CONSENT_VERSION, clearPendingConsent, stashPendingConsent, flushPendingConsent } from '../../utils/pendingConsent.js';"
);
replaceExact(
  'src/mobile/hooks/useSupabaseAuth.js',
  "const NATIVE_OAUTH_REDIRECT = 'co.aynahealth.app://auth/callback';",
  "const NATIVE_OAUTH_REDIRECT = 'co.aynahealth.app://auth/callback';\nconst AppleSignIn = registerPlugin('AppleSignIn');"
);
replaceExact(
  'src/mobile/hooks/useSupabaseAuth.js',
  "          consent_given_at: consentAt,\n          consent_version: CONSENT_VERSION,",
  "          consent_given_at: consentAt,\n          consent_version: CONSENT_VERSION,\n          age_18_confirmed: true,\n          age_18_confirmed_at: consentAt,\n          age_requirement_version: AGE_REQUIREMENT_VERSION,"
);
replaceExact(
  'src/mobile/hooks/useSupabaseAuth.js',
  '  async function signInWithGoogle() {',
  '  async function signInWithGoogle({ consented = false } = {}) {'
);
replaceExact(
  'src/mobile/hooks/useSupabaseAuth.js',
  "    // Stashed before EITHER redirect path below, same as AuthGate.jsx's\n    // handleGoogle — Supabase's Google provider auto-provisions a real\n    // account for any unseen address the instant this redirect completes,\n    // with no consent checkboxes shown at all in mobile's \"sign in\" mode.\n    stashPendingConsent();",
  "    // Only persist consent metadata when the person actually checked the\n    // visible signup confirmations. A normal returning-user sign-in must never\n    // manufacture a consent timestamp just because Google was clicked.\n    if (consented) stashPendingConsent();\n    else clearPendingConsent();"
);
replaceExact(
  'src/mobile/hooks/useSupabaseAuth.js',
  "  async function signOut() {\n    const supabase = getSupabaseClient();\n    if (supabase) await supabase.auth.signOut();\n  }\n\n  return { user, authLoading, signUpWithPassword, signInWithPassword, signInWithGoogle, signOut, resendConfirmation };",
  `  async function signInWithApple({ consented = false } = {}) {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error('Sign-in is not configured right now.');
    if (Capacitor.getPlatform() !== 'ios') throw new Error('Sign in with Apple is available in the iOS app.');

    if (consented) stashPendingConsent();
    else clearPendingConsent();

    const result = await AppleSignIn.authorize();
    if (!result?.identityToken || !result?.nonce) throw new Error('Apple did not return a usable sign-in token.');

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: result.identityToken,
      nonce: result.nonce,
    });
    if (error) throw error;

    // Apple only supplies name on the first authorization. Save it then, but
    // never overwrite an existing profile name with an empty value later.
    const givenName = String(result.givenName || '').trim();
    const familyName = String(result.familyName || '').trim();
    const fullName = [givenName, familyName].filter(Boolean).join(' ');
    if (givenName || fullName) {
      const { error: nameError } = await supabase.auth.updateUser({
        data: {
          ...(givenName ? { first_name: givenName } : {}),
          ...(fullName ? { full_name: fullName } : {}),
        },
      });
      if (nameError) console.warn('[Ayna] Apple display name could not be saved:', nameError.message);
    }

    if (consented) await flushPendingConsent(supabase);
    return data?.user || null;
  }

  async function signOut() {
    const supabase = getSupabaseClient();
    if (supabase) await supabase.auth.signOut();
  }

  return { user, authLoading, signUpWithPassword, signInWithPassword, signInWithGoogle, signInWithApple, signOut, resendConfirmation };`
);

replaceExact(
  'src/mobile/screens/SigninScreen.jsx',
  "  'My wellness data may be processed by an external AI service to personalize recommendations. ayna takes measures to anonymize and secure this information and never sells it.',",
  "  'When I intentionally use an AI-powered feature, relevant information I provide may be processed by third-party AI providers such as Anthropic, OpenAI, or Google to generate my requested response. ayna minimizes the context sent and does not sell it.',"
);
replaceExact(
  'src/mobile/screens/SigninScreen.jsx',
  "  'ayna provides wellness information, not medical advice or a substitute for care from a qualified healthcare provider.',\n];",
  "  'ayna provides wellness information, not medical advice or a substitute for care from a qualified healthcare provider.',\n  'I confirm that I am at least 18 years old.',\n];"
);
replaceExact(
  'src/mobile/screens/SigninScreen.jsx',
  '\nexport default function SigninScreen({',
  `
function AppleButton({ onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        width: '100%', background: '#000', color: '#fff', border: '1px solid #000',
        textAlign: 'center', padding: 15, borderRadius: 99, fontFamily: "-apple-system, BlinkMacSystemFont, 'DM Sans', sans-serif",
        fontWeight: 600, fontSize: 'calc(15px * var(--ayna-text-scale, 1))', cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? .6 : 1,
      }}
    >
      {disabled ? 'Opening Apple…' : 'Continue with Apple'}
    </button>
  );
}

export default function SigninScreen({`
);
replaceExact(
  'src/mobile/screens/SigninScreen.jsx',
  '  onGoogleSignIn,\n  onResendConfirmation,',
  '  onGoogleSignIn,\n  onAppleSignIn,\n  onResendConfirmation,'
);
replaceExact(
  'src/mobile/screens/SigninScreen.jsx',
  '  const [googleLoading, setGoogleLoading] = useState(false);',
  '  const [googleLoading, setGoogleLoading] = useState(false);\n  const [appleLoading, setAppleLoading] = useState(false);'
);
replaceExact(
  'src/mobile/screens/SigninScreen.jsx',
  'Please agree to the three statements above before creating your account.',
  'Please agree to all four statements above before creating your account.'
);
replaceExact(
  'src/mobile/screens/SigninScreen.jsx',
  'Please agree to the three statements above before continuing.',
  'Please agree to all four statements above before continuing.'
);
replaceExact(
  'src/mobile/screens/SigninScreen.jsx',
  '      await onGoogleSignIn();',
  "      await onGoogleSignIn({ consented: mode === 'signup' && allConsented });"
);
replaceExact(
  'src/mobile/screens/SigninScreen.jsx',
  '\n  const handleResend = async () => {',
  `
  const handleApple = async () => {
    if (!onAppleSignIn) return;
    if (mode === 'signup' && !allConsented) {
      setError('Please agree to all four statements above before continuing.');
      return;
    }
    setError('');
    setAppleLoading(true);
    try {
      await onAppleSignIn({ consented: mode === 'signup' && allConsented });
      onAuthenticated(firstName.trim() || undefined);
    } catch (e) {
      if (!/cancel/i.test(e?.message || '')) setError(e?.message || 'Could not sign in with Apple.');
    } finally {
      setAppleLoading(false);
    }
  };

  const handleResend = async () => {`
);
replaceExact(
  'src/mobile/screens/SigninScreen.jsx',
  '            <GoogleButton onClick={handleGoogle} disabled={googleLoading || loading} />',
  "            <GoogleButton onClick={handleGoogle} disabled={googleLoading || appleLoading || loading} />\n            {onAppleSignIn && <AppleButton onClick={handleApple} disabled={appleLoading || googleLoading || loading} />}"
);

// ---- Mobile shell -----------------------------------------------------------
replaceExact(
  'src/mobile/MobileApp.jsx',
  "import { useEffect, useRef, useState } from 'react';",
  "import { useEffect, useRef, useState } from 'react';\nimport { Capacitor } from '@capacitor/core';"
);
replaceExact(
  'src/mobile/MobileApp.jsx',
  "import AskAynaModal from './components/AskAynaModal.jsx';",
  "import AskAynaModal from './components/AskAynaModal.jsx';\nimport AnalyticsConsentPrompt from './components/AnalyticsConsentPrompt.jsx';\nimport AiConsentPrompt from './components/AiConsentPrompt.jsx';"
);
replaceExact(
  'src/mobile/MobileApp.jsx',
  '  const { user: authUser, signUpWithPassword, signInWithPassword, signInWithGoogle, signOut: signOutSupabase, resendConfirmation } = useSupabaseAuth();',
  '  const { user: authUser, signUpWithPassword, signInWithPassword, signInWithGoogle, signInWithApple, signOut: signOutSupabase, resendConfirmation } = useSupabaseAuth();'
);
replaceExact(
  'src/mobile/MobileApp.jsx',
  '    onGoogleSignIn: signInWithGoogle,\n    onResendConfirmation: resendConfirmation,',
  "    onGoogleSignIn: signInWithGoogle,\n    onAppleSignIn: Capacitor.getPlatform() === 'ios' ? signInWithApple : undefined,\n    onResendConfirmation: resendConfirmation,"
);
replaceExact(
  'src/mobile/MobileApp.jsx',
  '    <div className="ayna-mobile" data-theme={resolvedTheme} style={{ \'--ayna-text-scale\': textScale }}>\n      <Screen',
  '    <div className="ayna-mobile" data-theme={resolvedTheme} style={{ \'--ayna-text-scale\': textScale }}>\n      <AnalyticsConsentPrompt />\n      <AiConsentPrompt user={authUser} />\n      <Screen'
);

// ---- Minimize AI context from product chat ---------------------------------
replaceExact(
  'src/mobile/screens/ProductDetailScreen.jsx',
  "import { renderMarkdownLite } from '../../utils/renderMarkdownLite.jsx';",
  "import { renderMarkdownLite } from '../../utils/renderMarkdownLite.jsx';\nimport { buildAiHealthContext } from '../../utils/aiHealthContext.js';"
);
replaceExact(
  'src/mobile/screens/ProductDetailScreen.jsx',
  "          userContext: quizAnswers?.fullHealthIntake ? JSON.stringify(quizAnswers.fullHealthIntake).slice(0, 4000) : '',",
  "          userContext: JSON.stringify(buildAiHealthContext(quizAnswers, q)).slice(0, 3000),"
);

// ---- AI routes require current consent -------------------------------------
replaceExact(
  'api/ask-ayna.js',
  "import { callWithFallback, parseProviderOrder, tryParseJsonCandidate, stripDiagnosticLanguage } from './_llm.js';",
  "import { callWithFallback, parseProviderOrder, tryParseJsonCandidate, stripDiagnosticLanguage } from './_llm.js';\nimport { requireAiConsent } from './_privacyConsent.js';"
);
replaceExact(
  'api/ask-ayna.js',
  "  const { user, error, admin } = await verifyUser(req);\n  if (!user) return res.status(401).json({ error });",
  "  const { user, error, admin } = await verifyUser(req);\n  if (!user) return res.status(401).json({ error });\n  if (!requireAiConsent(user, res)) return;"
);
replaceExact(
  'api/product-chat.js',
  "import { fetchOfficialSiteText } from './_officialSiteFetch.js';",
  "import { fetchOfficialSiteText } from './_officialSiteFetch.js';\nimport { requireAiConsent } from './_privacyConsent.js';"
);
replaceExact(
  'api/product-chat.js',
  "  const { user, error, admin } = await verifyUser(req);\n  if (!user) return res.status(401).json({ error });",
  "  const { user, error, admin } = await verifyUser(req);\n  if (!user) return res.status(401).json({ error });\n  if (!requireAiConsent(user, res)) return;"
);

// ---- Never identify PostHog with Supabase UUID/email -----------------------
replaceExact(
  'src/App.jsx',
  "import posthog from 'posthog-js';",
  "import posthog from 'posthog-js';\nimport { safePosthogIdentify } from './utils/posthogPrivacy.js';"
);
{
  const path = 'src/App.jsx';
  let text = read(path);
  text = text.replaceAll("posthog.identify(session.user.id, { email: session.user.email });", "safePosthogIdentify(posthog, session.user.id);");
  write(path, text);
}

// ---- Correct in-app privacy wording ----------------------------------------
{
  const path = 'src/mobile/screens/profile/ProfileFlow.jsx';
  let text = read(path);
  const replacements = [
    ['Anonymised product usage, so we can see which screens confuse people. Never your health answers.', 'Usage analytics that help us understand how the app is used. We do not include your health-profile answers.'],
    ['Anonymised usage analytics — off any time above', 'Usage analytics and app error signals — off any time in Privacy settings'],
    ['verification codes and opt-in safety-recall texts', 'phone verification and user-initiated SMS health conversations'],
    ["We'll process it within a week — nothing kept after.", 'Your account and associated personal data will be deleted, except information we are legally required to retain.'],
    ['Email puloma@aynahealth.co — providers are directed too', 'Settings → Account → Delete account. Email puloma@aynahealth.co for additional privacy support.'],
  ];
  for (const [before, after] of replacements) {
    if (text.includes(before)) text = text.replaceAll(before, after);
  }
  write(path, text);
}

// ---- Xcode project: entitlement + privacy manifest --------------------------
replaceExact(
  'ios/App/App.xcodeproj/project.pbxproj',
  '\t\t504EC3121FED79650016851F /* LaunchScreen.storyboard in Resources */ = {isa = PBXBuildFile; fileRef = 504EC3101FED79650016851F /* LaunchScreen.storyboard */; };',
  '\t\t504EC3121FED79650016851F /* LaunchScreen.storyboard in Resources */ = {isa = PBXBuildFile; fileRef = 504EC3101FED79650016851F /* LaunchScreen.storyboard */; };\n\t\tA1A1A1A10000000000000002 /* PrivacyInfo.xcprivacy in Resources */ = {isa = PBXBuildFile; fileRef = A1A1A1A10000000000000001 /* PrivacyInfo.xcprivacy */; };'
);
replaceExact(
  'ios/App/App.xcodeproj/project.pbxproj',
  '\t\t504EC3131FED79650016851F /* Info.plist */ = {isa = PBXFileReference; lastKnownFileType = text.plist.xml; path = Info.plist; sourceTree = "<group>"; };',
  '\t\t504EC3131FED79650016851F /* Info.plist */ = {isa = PBXFileReference; lastKnownFileType = text.plist.xml; path = Info.plist; sourceTree = "<group>"; };\n\t\tA1A1A1A10000000000000001 /* PrivacyInfo.xcprivacy */ = {isa = PBXFileReference; lastKnownFileType = text.xml; path = PrivacyInfo.xcprivacy; sourceTree = "<group>"; };\n\t\tA1A1A1A10000000000000003 /* App.entitlements */ = {isa = PBXFileReference; lastKnownFileType = text.plist.entitlements; path = App.entitlements; sourceTree = "<group>"; };'
);
replaceExact(
  'ios/App/App.xcodeproj/project.pbxproj',
  '\t\t\t\t504EC3131FED79650016851F /* Info.plist */,',
  '\t\t\t\t504EC3131FED79650016851F /* Info.plist */,\n\t\t\t\tA1A1A1A10000000000000001 /* PrivacyInfo.xcprivacy */,\n\t\t\t\tA1A1A1A10000000000000003 /* App.entitlements */,'
);
replaceExact(
  'ios/App/App.xcodeproj/project.pbxproj',
  '\t\t\t\t504EC3121FED79650016851F /* LaunchScreen.storyboard in Resources */,',
  '\t\t\t\t504EC3121FED79650016851F /* LaunchScreen.storyboard in Resources */,\n\t\t\t\tA1A1A1A10000000000000002 /* PrivacyInfo.xcprivacy in Resources */,'
);
{
  const path = 'ios/App/App.xcodeproj/project.pbxproj';
  let text = read(path);
  if (!text.includes('CODE_SIGN_ENTITLEMENTS = App/App.entitlements;')) {
    text = text.replaceAll('\t\t\t\tCODE_SIGN_STYLE = Automatic;', '\t\t\t\tCODE_SIGN_ENTITLEMENTS = App/App.entitlements;\n\t\t\t\tCODE_SIGN_STYLE = Automatic;');
  }
  write(path, text);
}

console.log('Apple compliance patches applied.');
