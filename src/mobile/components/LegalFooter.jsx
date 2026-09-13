import PrivacyPreferencesLink from '../../components/PrivacyPreferencesLink.jsx';

// Same absolute URLs already used by the Legal screen in ProfileFlow.jsx
// (PRIVACY_POLICY_URL/TERMS_URL) and by desktop's SiteFooter — kept here
// too rather than threading in-app navigation callbacks through every
// screen this footer appears on.
const PRIVACY_POLICY_URL = 'https://www.aynahealth.co/privacy-policy';
const CONSUMER_HEALTH_DATA_URL = 'https://www.aynahealth.co/consumer-health-data.html';
const TERMS_URL = 'https://www.aynahealth.co/terms-of-use';
const HOW_WE_MAKE_MONEY_URL = 'https://www.aynahealth.co/how-we-make-money';

const LINK_STYLE = {
  color: 'inherit',
  textDecoration: 'underline',
};

/**
 * The same legal disclosure that appears in SiteFooter.jsx on the desktop
 * site (main branch) — mobile has no shared footer component of its own, so
 * this is a mobile-styled port of that exact copy and those exact links
 * (PrivacyPreferencesLink and analyticsConsent.js are also ported verbatim
 * from main, unmodified, since the "Turn usage analytics off/on" toggle
 * they implement is the same PostHog opt-state main.jsx already sets up
 * identically for mobile and desktop).
 *
 * Appears at the bottom of every mobile screen except Browse, which already
 * carries its own "ALL OTC · NOT A DIAGNOSIS" disclosure line.
 *
 * variant="light" is for the handful of screens with a fixed dark gradient
 * background regardless of light/dark theme (Landing, Signin, the ecosystem
 * intro/building/reveal flow) — var(--ayna-text-faint) is tuned for a light
 * surface and would be low-contrast against those, so this uses the same
 * translucent-white treatment those screens already use for secondary text.
 */
export default function LegalFooter({ variant = 'default' }) {
  const light = variant === 'light';
  return (
    <div
      style={{
        fontSize: 'calc(10.5px * var(--ayna-text-scale, 1))',
        lineHeight: 1.6,
        color: light ? 'rgba(255,249,242,.62)' : 'var(--ayna-text-faint)',
        textAlign: 'center',
        padding: '22px 24px max(22px, env(safe-area-inset-bottom))',
      }}
    >
      18+ only. ayna provides wellness information only, not medical advice. We do not sell your personal health information.{' '}
      <a href={PRIVACY_POLICY_URL} target="_blank" rel="noreferrer" style={LINK_STYLE}>Privacy Policy</a>
      {' · '}
      <a href={CONSUMER_HEALTH_DATA_URL} target="_blank" rel="noreferrer" style={LINK_STYLE}>Consumer Health Data Privacy</a>
      {' · '}
      <a href={TERMS_URL} target="_blank" rel="noreferrer" style={LINK_STYLE}>Terms of Use</a>
      {' · '}
      <a href={HOW_WE_MAKE_MONEY_URL} target="_blank" rel="noreferrer" style={LINK_STYLE}>How We Make Money</a>
      <PrivacyPreferencesLink style={LINK_STYLE} />
    </div>
  );
}
