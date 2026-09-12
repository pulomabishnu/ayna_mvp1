import React from 'react';
import PrivacyPreferencesLink from './PrivacyPreferencesLink';

function FooterColumn({ title, children }) {
  return (
    <div className="v6-footer-column">
      <div className="v6-footer-column__title">{title}</div>
      <div className="v6-footer-column__links">{children}</div>
    </div>
  );
}

function FooterButton({ children, onClick }) {
  return <button type="button" className="v6-footer-link" onClick={onClick}>{children}</button>;
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
  return (
    <footer className="site-footer v6-footer">
      <div className="site-footer__columns v6-footer__grid">
        <div className="v6-footer__brand">
          <div className="v6-footer__wordmark">ayna</div>
          <p>Personalized women&apos;s health discovery, shaped around your body, goals, preferences, and everyday life.</p>
          <div className="v6-footer__social">
            <a href="https://www.instagram.com/ayna.health/" target="_blank" rel="noreferrer">Instagram</a>
            <a href="https://www.tiktok.com/@aynahealth" target="_blank" rel="noreferrer">TikTok</a>
          </div>
        </div>

        <FooterColumn title="Explore">
          <FooterButton onClick={() => onViewDiscovery?.('')}>Browse</FooterButton>
          <a className="v6-footer-link" href="/ecosystem">My Ecosystem</a>
          <a className="v6-footer-link" href="/profile">Health Profile</a>
          <FooterButton onClick={onViewArticles}>Health Library</FooterButton>
        </FooterColumn>

        <FooterColumn title="Ayna">
          <FooterButton onClick={onViewHowItWorks}>How It Works</FooterButton>
          <FooterButton onClick={onViewAbout}>Our Story</FooterButton>
          <FooterButton onClick={onViewWaitlist}>Partners</FooterButton>
          <FooterButton onClick={onViewHowWeMakeMoney}>How We Make Money</FooterButton>
        </FooterColumn>

        <FooterColumn title="Help + privacy">
          <FooterButton onClick={onViewContact}>Help & Contact</FooterButton>
          <FooterButton onClick={onViewPrivacyPolicy}>Privacy Policy</FooterButton>
          <a className="v6-footer-link" href="/consumer-health-data.html">Consumer Health Data Privacy</a>
          <FooterButton onClick={onViewTermsOfUse}>Terms of Use</FooterButton>
          <PrivacyPreferencesLink className="v6-footer-link" />
        </FooterColumn>
      </div>

      <div className="site-footer__baseline v6-footer__baseline">
        <span>© ayna 2026</span>
        <span>Made for women, by women.</span>
      </div>

      <div className="site-footer__legal v6-footer__legal">
        18+ only. ayna provides wellness information only, not medical advice. We do not sell your personal health information.
        {' '}
        <FooterButton onClick={onViewPrivacyPolicy}>Privacy Policy</FooterButton>
        {' · '}
        <a className="v6-footer-link" href="/consumer-health-data.html">Consumer Health Data Privacy</a>
        {' · '}
        <FooterButton onClick={onViewTermsOfUse}>Terms of Use</FooterButton>
      </div>
    </footer>
  );
}
