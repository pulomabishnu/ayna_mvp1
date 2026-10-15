import React, { useEffect, useState } from 'react';
import posthog from 'posthog-js';
import { getStoredConsent, denyConsent, grantConsent } from '../utils/analyticsConsent';
import '../styles/audit-info.css';
import '../styles/verify-people.css';
import '../styles/site-footer.css';
import { getSupabaseClient } from '../utils/supabaseClient';
import { installReferralCapture } from '../utils/badges';

/**
 * Site footer: brand blurb + Explore / Company / Get in touch columns, a
 * © row, and the legal row.
 *
 * The legal row is the ONE place the medical disclaimer appears on the
 * website (audit G21), and it carries the same items as the app's
 * LegalFooter (audit AP04): 18+ only, Privacy Policy, Consumer Health Data
 * Privacy (the standalone /consumer-health-data.html notice), Terms, How We
 * Make Money, and the usage-analytics switch.
 *
 * The analytics switch uses the same analyticsConsent helpers as the
 * consent notice and account settings, so the choice is persisted by
 * PostHog's own opt-out state (plus the shared consent record).
 */

function readAnalyticsOff() {
  try {
    if (getStoredConsent() === 'denied') return true;
    return posthog?.has_opted_out_capturing?.() === true;
  } catch {
    return false;
  }
}

function AnalyticsToggle() {
  const [off, setOff] = useState(readAnalyticsOff);

  const turnOff = () => {
    try { denyConsent(posthog); } catch { /* PostHog not initialised: nothing is being captured */ }
    setOff(true);
  };
  const turnOn = () => {
    try { grantConsent(posthog); } catch { /* PostHog not initialised */ }
    setOff(false);
  };

  if (off) {
    return (
      <span className="ay-footer-analytics" role="status">
        Analytics off
        <button type="button" className="ay-footer-legal__link" onClick={turnOn}>Turn on</button>
      </span>
    );
  }
  return (
    <button type="button" className="ay-footer-legal__link" onClick={turnOff}>
      Turn usage analytics off
    </button>
  );
}

function FooterColumn({ title, children }) {
  return (
    <div className="ay-footer-col">
      <div className="ay-footer-col__title">{title}</div>
      <div className="ay-footer-col__links">{children}</div>
    </div>
  );
}

// Real links (open in a new tab, copy, crawl) that still route in-app on a plain click.
/* One control that pauses every moving thing on the site (marquees, carousels, film strips). */
function MotionToggle() {
  const [paused, setPaused] = React.useState(() => { try { return localStorage.getItem('ayna_motion_paused') === '1'; } catch { return false; } });
  React.useEffect(() => {
    document.documentElement.classList.toggle('ay-motion-paused', paused);
    try { localStorage.setItem('ayna_motion_paused', paused ? '1' : '0'); } catch { /* storage unavailable */ }
  }, [paused]);
  return <button type="button" className="ay-footer-legal__link" aria-pressed={paused} onClick={() => setPaused((v) => !v)}>{paused ? 'Play motion' : 'Pause motion'}</button>;
}

function footerGo(e, fn) {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  e.preventDefault();
  fn?.();
}

export default function SiteFooter({
  onViewHowItWorks,
  onViewAbout,
  onViewContact,
  onViewDiscovery,
  onViewWaitlist,
  onViewArticles,
  onViewPrivacyPolicy,
  onViewTermsOfUse,
  onViewHowWeMakeMoney,
}) {
  // The footer is on every website page: capture ?ref invite codes here
  // (idempotent, a no-op without Supabase).
  useEffect(() => {
    installReferralCapture(getSupabaseClient());
  }, []);

  return (
    <footer className="site-footer ay-footer">
      <div className="site-footer__columns ay-footer__columns">
        <div className="ay-footer__brand">
          <div className="site-footer__logo ay-footer__logo">ayna</div>
          <p className="ay-footer__blurb">
            Personalized women's health discovery. Matched to your body, your goals, your data.
          </p>
        </div>

        <FooterColumn title="Explore">
          <a className="ay-footer-link" href="/how-it-works" onClick={(e) => footerGo(e, onViewHowItWorks)}>How It Works</a>
          <a className="ay-footer-link" href="/shop" onClick={(e) => footerGo(e, () => onViewDiscovery?.(''))}>Shop</a>
          <a className="ay-footer-link" href="/library" onClick={(e) => footerGo(e, onViewArticles)}>Library</a>
          <a className="ay-footer-link" href="/campus-resources">Campus Resources</a>
        </FooterColumn>

        <FooterColumn title="Company">
          <a className="ay-footer-link" href="/about" onClick={(e) => footerGo(e, onViewAbout)}>About</a>
          <a className="ay-footer-link" href="/startups" onClick={(e) => footerGo(e, onViewWaitlist)}>Partner brands</a>
        </FooterColumn>

        <FooterColumn title="Get in touch">
          <a className="ay-footer-link" href="/contact" onClick={(e) => footerGo(e, onViewContact)}>Contact</a>
          <a className="ay-footer-link" href="https://form.typeform.com/to/Jt7rx3BS?typeform-source=aynahealth.co" target="_blank" rel="noreferrer">Give us Feedback <span aria-hidden="true">↗</span><span className="sr-only"> (opens in a new tab)</span></a>
          <a className="ay-footer-link" href="https://www.instagram.com/ayna.health/" target="_blank" rel="noreferrer">Instagram <span aria-hidden="true">↗</span><span className="sr-only"> (opens in a new tab)</span></a>
          <a className="ay-footer-link" href="https://www.tiktok.com/@aynahealth" target="_blank" rel="noreferrer">TikTok <span aria-hidden="true">↗</span><span className="sr-only"> (opens in a new tab)</span></a>
        </FooterColumn>
      </div>

      <div className="site-footer__baseline ay-footer__baseline">
        <span>© ayna 2026</span>
        <span>Made for women, by women.</span>
      </div>

      <div className="site-footer__legal ay-footer-legal">
        <p className="ay-footer-legal__text">
          <strong>18+ only.</strong> ayna provides wellness information only, not medical advice. Always consult a
          qualified healthcare provider for medical decisions. We do not sell your personal health information.
        </p>
        <nav className="ay-footer-legal__links" aria-label="Legal">
          <a className="ay-footer-legal__link" href="/privacy-policy" onClick={(e) => footerGo(e, onViewPrivacyPolicy)}>Privacy Policy</a>
          <a className="ay-footer-legal__link" href="/consumer-health-data.html">Consumer Health Data Privacy</a>
          <a className="ay-footer-legal__link" href="/terms-of-use" onClick={(e) => footerGo(e, onViewTermsOfUse)}>Terms of Use</a>
          <a className="ay-footer-legal__link" href="/how-we-make-money" onClick={(e) => footerGo(e, onViewHowWeMakeMoney)}>How We Make Money</a>
          <AnalyticsToggle />
          <MotionToggle />
        </nav>
      </div>
    </footer>
  );
}
