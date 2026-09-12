import React from 'react';

const sectionStyle = {
  padding: '1rem 0',
  borderTop: '1px solid var(--color-border)',
};

const pStyle = {
  margin: '0.45rem 0',
  color: 'var(--color-text-muted)',
  lineHeight: 1.7,
};

const listStyle = {
  color: 'var(--color-text-muted)',
  lineHeight: 1.7,
  paddingLeft: '1.25rem',
};

export default function TermsOfUse({ onBack }) {
  return (
    <section className="container animate-fade-in-up" style={{ padding: 'var(--spacing-xl) var(--spacing-md)', maxWidth: '900px' }}>
      <div className="card" style={{ padding: 'clamp(1.25rem, 4vw, 2.5rem)' }}>
        {onBack && (
          <button type="button" className="btn btn-outline" onClick={onBack} style={{ marginBottom: '1rem' }}>
            Back
          </button>
        )}

        <h1 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: 'clamp(2rem, 5vw, 2.7rem)' }}>Terms of Use</h1>
        <p style={{ ...pStyle, marginTop: '0.4rem' }}><strong>Last updated September 12, 2026</strong></p>
        <p style={pStyle}>
          These Terms govern your use of www.aynahealth.co and related ayna services (the “Services”). The Services are currently operated by Ayna Health, Inc., doing business as ayna (“ayna,” “we,” “us,” or “our”). By using the Services, you agree to these Terms and our Privacy Policy.
        </p>

        <div style={sectionStyle}>
          <h2>1. Adults only</h2>
          <p style={pStyle}>
            The Services are intended only for people who are at least 18 years old. By creating an account or using an account-only feature, you represent that you are 18 or older. If you are under 18, do not create an account or submit health information to ayna.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2>2. Wellness information, not medical care</h2>
          <p style={pStyle}>
            ayna is a wellness, educational, and product-discovery service. ayna is not a healthcare provider, pharmacy, emergency service, medical device, diagnosis service, or substitute for a qualified healthcare professional. Information, match scores, AI responses, summaries, product comparisons, safety notes, and recommendations may be incomplete or incorrect and should not be used as medical instructions.
          </p>
          <p style={pStyle}>
            Always seek appropriate professional care for diagnosis, treatment, medication decisions, pregnancy concerns, severe or worsening symptoms, or emergencies. If you believe you may be experiencing a medical emergency, contact emergency services or an appropriate medical professional rather than relying on ayna.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2>3. Product information and evidence</h2>
          <p style={pStyle}>
            ayna may summarize manufacturer information, public research, clinical guidance, community experiences, retailer information, and other sources. A source about an ingredient, product category, or clinical topic does not necessarily constitute product-specific clinical validation. Brand claims are not treated as independent medical facts merely because they appear on ayna.
          </p>
          <p style={pStyle}>
            Product ingredients, prices, availability, recalls, regulatory status, and retailer listings can change. Check current product packaging, the manufacturer, the retailer, and appropriate professional guidance before making decisions that affect your health.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2>4. AI-powered features</h2>
          <p style={pStyle}>
            Some features use artificial intelligence to synthesize information or respond to questions. AI-generated content can be inaccurate, outdated, or incomplete. It is provided for educational purposes and is not a diagnosis, prescription, or medical instruction. When you intentionally use an AI-powered feature, information needed for that request may be processed by a third-party AI provider as described in our Privacy Policy and Consumer Health Data Privacy Notice.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2>5. Accounts and security</h2>
          <p style={pStyle}>
            You are responsible for providing accurate account information, keeping your login credentials confidential, and notifying us if you believe your account has been compromised. You may not impersonate another person, access another user’s account or data, probe or bypass security controls, interfere with the Services, or use the Services unlawfully.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2>6. Privacy and consumer health data</h2>
          <p style={pStyle}>
            Our <a href="/privacy-policy">Privacy Policy</a> explains how we handle personal information. Our <a href="/consumer-health-data.html">Consumer Health Data Privacy Notice</a> provides additional disclosures and rights relating to consumer health data. Those notices are incorporated into these Terms to the extent applicable.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2>7. Retailers, purchases, affiliate links, and partners</h2>
          <p style={pStyle}>
            ayna does not currently sell physical products directly or process payment-card information on the website. Buy links generally take you to a third-party retailer or brand. Purchases, shipping, returns, refunds, warranties, and retailer customer service are governed by the third party’s terms and policies.
          </p>
          <p style={pStyle}>
            Some links are affiliate links and ayna may earn a commission from qualifying purchases at no additional cost to you. As an Amazon Associate, ayna earns from qualifying purchases. Confirmed brand partnerships may affect visibility in general Browse when disclosed, but partnership or affiliate status does not determine personalized match scores or personalized recommendation order.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2>8. No current paid ayna subscription</h2>
          <p style={pStyle}>
            The current website does not offer an automatically renewing paid ayna subscription and does not process payment cards for an ayna membership. If paid features are introduced, the applicable price, billing terms, cancellation terms, and payment provider will be disclosed before purchase and these Terms will be updated as needed.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2>9. User content and feedback</h2>
          <p style={pStyle}>
            You retain ownership of information and content you submit. You give ayna a limited license to host, process, reproduce, and use that content only as reasonably necessary to provide, secure, support, and improve the Services, subject to our Privacy Policy and applicable law. If you voluntarily submit general product feedback or suggestions that do not contain personal health information, we may use those suggestions without an obligation to compensate you.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2>10. Intellectual property</h2>
          <p style={pStyle}>
            The Services, including ayna’s software, design, branding, original text, graphics, and other proprietary content, are owned by or licensed to ayna and protected by applicable intellectual-property laws. Except as allowed by law, you may not copy, sell, reverse engineer, scrape at scale, redistribute, or create competing derivative products from protected portions of the Services without permission.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2>11. Acceptable use</h2>
          <ul style={listStyle}>
            <li>Do not attempt to obtain another user’s health or account information.</li>
            <li>Do not upload malware, probe internal infrastructure, evade rate limits, or bypass authentication or access controls.</li>
            <li>Do not use ayna to provide unlawful medical, discriminatory, deceptive, or abusive services.</li>
            <li>Do not submit content that you do not have the right to provide.</li>
          </ul>
        </div>

        <div style={sectionStyle}>
          <h2>12. Third-party services</h2>
          <p style={pStyle}>
            The Services may link to or interoperate with third parties. We do not control those third parties and are not responsible for their independent products, content, availability, security, privacy practices, or transactions. Review their terms before using them.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2>13. Availability and changes</h2>
          <p style={pStyle}>
            We may add, remove, suspend, or change features, product listings, integrations, or content. We do not guarantee uninterrupted or error-free operation. We may suspend or terminate access when reasonably necessary to protect users, comply with law, prevent abuse, or enforce these Terms.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2>14. Disclaimers</h2>
          <p style={pStyle}>
            TO THE FULLEST EXTENT PERMITTED BY LAW, THE SERVICES ARE PROVIDED “AS IS” AND “AS AVAILABLE.” AYNA DISCLAIMS WARRANTIES THAT ARE NOT EXPRESSLY REQUIRED BY LAW, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. NOTHING IN THESE TERMS EXCLUDES RIGHTS OR WARRANTIES THAT CANNOT LEGALLY BE WAIVED.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2>15. Limitation of liability</h2>
          <p style={pStyle}>
            TO THE FULLEST EXTENT PERMITTED BY LAW, AYNA AND ITS DIRECTORS, OFFICERS, EMPLOYEES, AND AGENTS WILL NOT BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, PUNITIVE, OR CONSEQUENTIAL DAMAGES ARISING FROM THE SERVICES. ANY LIMITATION APPLIES ONLY TO THE EXTENT PERMITTED BY APPLICABLE LAW; SOME JURISDICTIONS DO NOT ALLOW CERTAIN LIMITATIONS.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2>16. Governing law and disputes</h2>
          <p style={pStyle}>
            These Terms are governed by the laws of the Commonwealth of Massachusetts, without regard to conflict-of-law principles, except where mandatory consumer law requires otherwise. Before filing a formal claim, you and ayna agree to make a reasonable good-faith effort to resolve the dispute informally by written notice. If a dispute proceeds in court, the parties consent to an appropriate state or federal court in Massachusetts that has jurisdiction, subject to any nonwaivable consumer rights.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2>17. Changes to these Terms</h2>
          <p style={pStyle}>
            We may update these Terms as the product or law changes. We will update the date above and provide additional notice when required by law. Changes apply prospectively from their effective date.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2>18. Contact</h2>
          <p style={pStyle}>
            Questions about these Terms: <a href="mailto:puloma@aynahealth.co">puloma@aynahealth.co</a>.
          </p>
        </div>
      </div>
    </section>
  );
}
