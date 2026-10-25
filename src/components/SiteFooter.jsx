import React, { useEffect, useState } from 'react';
import posthog from 'posthog-js';
import { getStoredConsent, denyConsent, grantConsent } from '../utils/analyticsConsent';
import '../styles/audit-info.css';
import '../styles/verify-people.css';
import '../styles/site-footer.css';
import { getSupabaseClient } from '../utils/supabaseClient';
import { installReferralCapture } from '../utils/badges';
import { WEFUNDER_URL, trackInvestClick } from '../data/invest';

/**
 * Site footer: brand blurb + Explore / Company / Get in touch columns, a
 * © row, and the legal row.
 *
 * The legal row is the ONE place the medical disclaimer appears on the
 * website (audit G21), and it carries the same items as the app's
 * LegalFooter (audit AP04): 18+ only, Privacy Policy, Consumer Health Data
 * Privacy notice (/consumer-health-data, the in-site page), Terms, How We
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

export function AnalyticsToggle() {
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
    <nav className="ay-foot__col" aria-label={title}>
      <h2 className="ay-foot__title">{title}</h2>
      {children}
    </nav>
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
  // The home hero has its own Pause motion button (one setting for the page): follow it.
  React.useEffect(() => {
    const mo = new MutationObserver(() => setPaused(document.documentElement.classList.contains('ay-motion-paused')));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => mo.disconnect();
  }, []);
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
  onViewConsumerHealthData,
  onViewHowWeMakeMoney,
  onViewEcosystem,
  onViewCommunity,
}) {
  // The footer is on every website page: capture ?ref invite codes here
  // (idempotent, a no-op without Supabase).
  useEffect(() => {
    installReferralCapture(getSupabaseClient());
  }, []);

  return (
    <footer className="ay-foot">
      <div className="ay-foot__inner">
      <div className="ay-foot__grid">
        <div className="ay-foot__brand">
          <p className="ay-foot__logo">ayna</p>
          <p className="ay-foot__blurb">
            Women's health products matched to your answers, with the research beside each one.
          </p>
        </div>

        <FooterColumn title="Explore">
          <a className="ay-foot__link" href="/how-it-works" onClick={(e) => footerGo(e, onViewHowItWorks)}>How it works</a>
          <a className="ay-foot__link" href="/explore/products" onClick={(e) => footerGo(e, () => onViewDiscovery?.(''))}>Products</a>
          <a className="ay-foot__link" href="/explore/resources" onClick={(e) => footerGo(e, onViewArticles)}>Resources</a>
          <a className="ay-foot__link" href="/you/ecosystem" onClick={(e) => footerGo(e, onViewEcosystem)}>My ecosystem</a>
          <a className="ay-foot__link" href="/community" onClick={(e) => footerGo(e, onViewCommunity)}>Community</a>
          <a className="ay-foot__link" href="/campus-resources">Campus resources</a>
        </FooterColumn>

        <FooterColumn title="Company">
          <a className="ay-foot__link" href="/about" onClick={(e) => footerGo(e, onViewAbout)}>About</a>
          <a className="ay-foot__link" href="/partners" onClick={(e) => footerGo(e, onViewWaitlist)}>Partner brands</a>
          <a className="ay-foot__link" href={WEFUNDER_URL} target="_blank" rel="noopener noreferrer" onClick={() => trackInvestClick('footer')}>Invest in ayna <span aria-hidden="true">↗</span><span className="sr-only"> (opens Wefunder in a new tab)</span></a>
        </FooterColumn>

        <FooterColumn title="Get in touch">
          <a className="ay-foot__link" href="/contact" onClick={(e) => footerGo(e, onViewContact)}>Contact</a>
          <a className="ay-foot__link" href="https://form.typeform.com/to/Jt7rx3BS?typeform-source=aynahealth.co" target="_blank" rel="noreferrer">Give us feedback <span aria-hidden="true">↗</span><span className="sr-only"> (opens in a new tab)</span></a>
          <a className="ay-foot__link" href="https://www.instagram.com/ayna.health/" target="_blank" rel="noreferrer">Instagram <span aria-hidden="true">↗</span><span className="sr-only"> (opens in a new tab)</span></a>
          <a className="ay-foot__link" href="https://www.tiktok.com/@aynahealth" target="_blank" rel="noreferrer">TikTok <span aria-hidden="true">↗</span><span className="sr-only"> (opens in a new tab)</span></a>
        </FooterColumn>
      </div>

      <div className="ay-foot__base">
        <span>© ayna 2026</span>
        <span>Made for women, by women.</span>
      </div>

      <div className="ay-foot__legal">
        <p className="ay-foot__legaltext">
          <strong>18+ only.</strong> ayna provides wellness information only, not medical advice. Always consult a
          qualified healthcare provider for medical decisions. We do not sell your personal health information.
          {' '}Our Wefunder round is testing the waters under Regulation Crowdfunding: no money is accepted and a reservation involves no obligation until a Form C is filed.
        </p>
        <nav className="ay-foot__legallinks" aria-label="Legal">
          <a className="ay-footer-legal__link" href="/privacy-policy" onClick={(e) => footerGo(e, onViewPrivacyPolicy)}>Privacy policy</a>
          <a className="ay-footer-legal__link" href="/consumer-health-data" onClick={(e) => footerGo(e, onViewConsumerHealthData)}>Consumer health data notice</a>
          <a className="ay-footer-legal__link" href="/terms-of-use" onClick={(e) => footerGo(e, onViewTermsOfUse)}>Terms of use</a>
          <a className="ay-footer-legal__link" href="/how-we-make-money" onClick={(e) => footerGo(e, onViewHowWeMakeMoney)}>How we make money</a>
          <AnalyticsToggle />
          <MotionToggle />
        </nav>
      </div>
      </div>
    </footer>
  );
}
