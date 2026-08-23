import React from 'react';

/**
 * Site footer — a direct port of the footer that repeats on every board of the
 * Aug 2026 desktop mockup ("Ayna Mockups"): four columns (brand blurb, Explore,
 * Company, Get in touch) over a © / tagline row. Type sizes, colours, gaps and
 * copy are the mockup's own values rather than the app's token scale, because
 * the point of this component is to reproduce that block exactly.
 *
 * The one addition the mockup has no place for is the legal line: Ayna is a
 * health product, so the wellness-not-medical-advice disclaimer and the
 * Privacy / Terms / How We Make Money links have to stay reachable from every
 * page. They sit under the © row as fine print, which is where a real site
 * would put them anyway.
 */

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
  onViewDiscovery,
  onViewDeeptech,
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
            Personalized women's health discovery. Matched to your body, your goals, your data.
          </div>
        </div>

        <FooterColumn title="Explore">
          <button type="button" style={LINK_STYLE} onClick={onViewHowItWorks}>How It Works</button>
          <button type="button" style={LINK_STYLE} onClick={() => onViewDiscovery?.('')}>Browse</button>
          <button type="button" style={LINK_STYLE} onClick={onViewDeeptech}>Why Ayna</button>
          <button type="button" style={LINK_STYLE} onClick={onViewWaitlist}>Launch Week</button>
          <button type="button" style={LINK_STYLE} onClick={onViewArticles}>My Health Library</button>
        </FooterColumn>

        <FooterColumn title="Company">
          <button type="button" style={LINK_STYLE} onClick={onViewAbout}>About</button>
          <button type="button" style={LINK_STYLE} onClick={onViewWaitlist}>Brand Partnerships</button>
        </FooterColumn>

        <FooterColumn title="Get in touch">
          <a style={LINK_STYLE} href="mailto:hello@ayna.com">hello@ayna.com</a>
          <a style={LINK_STYLE} href="https://linktr.ee/aynahealth" target="_blank" rel="noreferrer">Instagram</a>
          <a style={LINK_STYLE} href="https://linktr.ee/aynahealth" target="_blank" rel="noreferrer">TikTok</a>
        </FooterColumn>
      </div>

      <div className="site-footer__baseline">
        <span>© Ayna 2026</span>
        <span>Made for women, by women.</span>
      </div>

      <div className="site-footer__legal">
        Ayna provides wellness information only. Not medical advice. Always consult a qualified
        healthcare provider for medical decisions. By using Ayna, you agree your data is stored
        securely and never sold.
        {' '}
        <button type="button" style={{ ...LINK_STYLE, textDecoration: 'underline' }} onClick={onViewPrivacyPolicy}>Privacy Policy</button>
        {' · '}
        <button type="button" style={{ ...LINK_STYLE, textDecoration: 'underline' }} onClick={onViewTermsOfUse}>Terms of Use</button>
        {' · '}
        <button type="button" style={{ ...LINK_STYLE, textDecoration: 'underline' }} onClick={onViewHowWeMakeMoney}>How We Make Money</button>
      </div>
    </footer>
  );
}
