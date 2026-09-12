import React from 'react';
import PrivacyPreferencesLink from './PrivacyPreferencesLink';

const LINK_STYLE = {
  background: 'none',
  border: 'none',
  padding: 0,
  margin: 0,
  font: 'inherit',
  color: 'inherit',
  textAlign: 'left',
  cursor: 'pointer',
  textDecoration: 'none',
};

function FooterColumn({ title, children }) {
  return (
    <div>
      <div style={{
        font: "600 11.5px/1 'DM Sans', sans-serif",
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: '#4a4356',
      }}>
        {title}
      </div>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: '14px',
        marginTop: '20px',
        fontSize: '14.5px',
        color: '#4a4356',
      }}>
        {children}
      </div>
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
  return (
    <footer className="site-footer">
      <div className="site-footer__columns">
        <div style={{ maxWidth: '320px' }}>
          <div style={{
            font: "italic 400 22px/1 'Playfair Display', serif",
            color: '#1A1714',
          }}>
            ayna
          </div>
          <div style={{
            fontSize: '14.5px',
            lineHeight: 1.6,
            color: '#6f6880',
            marginTop: '16px',
          }}>
            Personalized women&apos;s health discovery. Matched to your body, your goals, your data.
          </div>
        </div>

        <FooterColumn title="Explore">
          <button type="button" style={LINK_STYLE} onClick={onViewHowItWorks}>How It Works</button>
          <button type="button" style={LINK_STYLE} onClick={() => onViewDiscovery?.('')}>Browse</button>
          <button type="button" style={LINK_STYLE} onClick={onViewArticles}>My Health Library</button>
        </FooterColumn>

        <FooterColumn title="Company">
          <button type="button" style={LINK_STYLE} onClick={onViewAbout}>About</button>
          <button type="button" style={LINK_STYLE} onClick={onViewWaitlist}>Brand Partnerships</button>
          <a style={LINK_STYLE} href="/consumer-health-data.html">Consumer Health Data Privacy</a>
        </FooterColumn>

        <FooterColumn title="Get in touch">
          <button type="button" style={LINK_STYLE} onClick={onViewContact}>Contact</button>
          <a style={LINK_STYLE} href="https://form.typeform.com/to/Jt7rx3BS?typeform-source=aynahealth.substack.com" target="_blank" rel="noreferrer">Give us Feedback</a>
          <a style={LINK_STYLE} href="https://www.instagram.com/ayna.health/" target="_blank" rel="noreferrer">Instagram</a>
          <a style={LINK_STYLE} href="https://www.tiktok.com/@aynahealth" target="_blank" rel="noreferrer">TikTok</a>
        </FooterColumn>
      </div>

      <div className="site-footer__baseline">
        <span>© ayna 2026</span>
        <span>Made for women, by women.</span>
      </div>

      <div className="site-footer__legal">
        18+ only. ayna provides wellness information only, not medical advice. We do not sell your personal health information.
        {' '}
        <button type="button" style={{ ...LINK_STYLE, textDecoration: 'underline' }} onClick={onViewPrivacyPolicy}>Privacy Policy</button>
        {' · '}
        <a style={{ ...LINK_STYLE, textDecoration: 'underline' }} href="/consumer-health-data.html">Consumer Health Data Privacy</a>
        {' · '}
        <button type="button" style={{ ...LINK_STYLE, textDecoration: 'underline' }} onClick={onViewTermsOfUse}>Terms of Use</button>
        {' · '}
        <button type="button" style={{ ...LINK_STYLE, textDecoration: 'underline' }} onClick={onViewHowWeMakeMoney}>How We Make Money</button>
        <PrivacyPreferencesLink style={{ ...LINK_STYLE, textDecoration: 'underline' }} />
      </div>
    </footer>
  );
}
