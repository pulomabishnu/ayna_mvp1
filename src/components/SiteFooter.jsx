import React, { useState } from 'react';
import posthog from 'posthog-js';
import { getStoredConsent, denyConsent, grantConsent } from '../utils/analyticsConsent';
import '../styles/audit-info.css';

/**
 * Site footer: brand blurb + Explore / Company / Get in touch columns, a
 * © row, and the legal row.
 *
 * The legal row is the ONE place the medical disclaimer appears on the
 * website (audit G21), and it carries the same items as the app's
 * LegalFooter (audit AP04): 18+ only, Privacy Policy, Consumer Health Data
 * Privacy, Terms, How We Make Money, and the usage-analytics switch.
 *
 * The analytics switch uses the same analyticsConsent helpers as the
 * consent notice and account settings, so the choice is persisted by
 * PostHog's own opt-out state (plus the shared consent record).
 */

/** Section of the privacy policy that covers health data. There is no
 * standalone Consumer Health Data page in this repo, so the link opens the
 * privacy policy and scrolls to that section. */
const CONSUMER_HEALTH_ANCHOR = 'sensitiveinfo';

function readAnalyticsOff() {
  try {
    if (getStoredConsent() === 'denied') return true;
    return posthog?.has_opted_out_capturing?.() === true;
  } catch {
    return false;
  }
}

function scrollToWhenReady(id, tries = 40) {
  const el = typeof document !== 'undefined' ? document.getElementById(id) : null;
  if (el) {
    // Let the view change finish its own scroll-to-top first.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      el.scrollIntoView({ block: 'start' });
    }));
    return;
  }
  if (tries > 0) setTimeout(() => scrollToWhenReady(id, tries - 1), 50);
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
  const openConsumerHealth = () => {
    onViewPrivacyPolicy?.();
    scrollToWhenReady(CONSUMER_HEALTH_ANCHOR);
  };

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
          <button type="button" className="ay-footer-link" onClick={onViewHowItWorks}>How It Works</button>
          <button type="button" className="ay-footer-link" onClick={() => onViewDiscovery?.('')}>Shop</button>
          <button type="button" className="ay-footer-link" onClick={onViewArticles}>Library</button>
        </FooterColumn>

        <FooterColumn title="Company">
          <button type="button" className="ay-footer-link" onClick={onViewAbout}>About</button>
          <button type="button" className="ay-footer-link" onClick={onViewWaitlist}>Brand Partnerships</button>
        </FooterColumn>

        <FooterColumn title="Get in touch">
          <button type="button" className="ay-footer-link" onClick={onViewContact}>Contact</button>
          <a className="ay-footer-link" href="https://form.typeform.com/to/Jt7rx3BS?typeform-source=aynahealth.substack.com" target="_blank" rel="noreferrer">Give us Feedback</a>
          <a className="ay-footer-link" href="https://www.instagram.com/ayna.health/" target="_blank" rel="noreferrer">Instagram</a>
          <a className="ay-footer-link" href="https://www.tiktok.com/@aynahealth" target="_blank" rel="noreferrer">TikTok</a>
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
          <button type="button" className="ay-footer-legal__link" onClick={onViewPrivacyPolicy}>Privacy Policy</button>
          <button type="button" className="ay-footer-legal__link" onClick={openConsumerHealth}>Consumer Health Data Privacy</button>
          <button type="button" className="ay-footer-legal__link" onClick={onViewTermsOfUse}>Terms of Use</button>
          <button type="button" className="ay-footer-legal__link" onClick={onViewHowWeMakeMoney}>How We Make Money</button>
          <AnalyticsToggle />
        </nav>
      </div>
    </footer>
  );
}
