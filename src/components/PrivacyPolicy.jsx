import React from 'react';

const PROCESSORS = [
  ['Supabase', 'Authentication and storage of account-linked data, including health-profile data you choose to save.'],
  ['Vercel', 'Website hosting and server-side API infrastructure.'],
  ['PostHog', 'Product analytics. ayna uses a dedicated analytics identifier rather than your Supabase account ID, does not intentionally send raw health-search text or account email as analytics properties, and has session recording disabled.'],
  ['OpenAI, Anthropic, and Google Gemini', 'Depending on feature availability and server configuration, one or more may process prompts or limited health context when you explicitly use an AI-powered feature such as Ask ayna or AI product insights.'],
  ['Twilio', 'Phone verification and opted-in SMS features such as safety or recall messaging.'],
  ['Resend', 'Transactional and support email.'],
  ['Search providers', 'Some product-discovery features may use external search services to locate public product information.'],
  ['Retailers and affiliate networks', 'When you choose a Buy link, the destination retailer may receive normal web-request information and an affiliate identifier.'],
];

const sectionStyle = {
  padding: '1rem 0',
  borderTop: '1px solid var(--color-border)',
};

const pStyle = {
  margin: '0.45rem 0',
  color: 'var(--color-text-muted)',
  lineHeight: 1.7,
};

export default function PrivacyPolicy({ onBack }) {
  return (
    <section className="container animate-fade-in-up" style={{ padding: 'var(--spacing-xl) var(--spacing-md)', maxWidth: '900px' }}>
      <div className="card" style={{ padding: 'clamp(1.25rem, 4vw, 2.5rem)' }}>
        {onBack && (
          <button type="button" className="btn btn-outline" onClick={onBack} style={{ marginBottom: '1rem' }}>
            Back
          </button>
        )}

        <h1 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: 'clamp(2rem, 5vw, 2.7rem)' }}>Privacy Policy</h1>
        <p style={{ ...pStyle, marginTop: '0.4rem' }}><strong>Last updated September 12, 2026</strong></p>
        <p style={pStyle}>
          This policy explains how ayna handles information when you use www.aynahealth.co and related ayna services. ayna is a product-discovery and educational service, not a healthcare provider or emergency service.
        </p>

        <div style={sectionStyle}>
          <h2>1. Information we collect</h2>
          <p style={pStyle}>
            Depending on the features you use, we may collect account information such as your name, email address, authentication details, phone number and notification preferences; health-profile information you choose to provide such as symptoms, concerns, conditions, medications, allergies, cycle information, life stage, preferences and notes; products you save, track, hide, review or add to your ecosystem; support or feedback messages; and technical information needed to operate and secure the service.
          </p>
          <p style={pStyle}>
            We do not currently process payment-card information through the ayna website. If paid features are introduced later, this policy will be updated to reflect the payment provider actually in use.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2>2. Health-file imports</h2>
          <p style={pStyle}>
            When you import supported Apple Health or FHIR data, the raw import file is parsed in your browser and is not uploaded as a raw file to ayna. If you choose to save or use information extracted from that file, selected or summarized health information may be stored with your account or sent to an ayna API or AI provider when you request a personalized feature.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2>3. How we use information</h2>
          <p style={pStyle}>
            We use information to operate accounts, personalize product discovery, generate user-requested AI features, save your ecosystem and preferences, provide support, send messages you have requested, maintain product-safety features, prevent abuse, troubleshoot errors and improve ayna.
          </p>
          <p style={pStyle}>
            Partnership or affiliate status may affect visibility in general Browse, but it does not change personalized match scores or personalized recommendation order.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2>4. Analytics</h2>
          <p style={pStyle}>
            ayna uses PostHog to understand product usage and reliability. Session recording and automatic click/text capture are disabled. Raw health-search text, account email, direct account identifiers and common health-profile fields are removed at the analytics boundary. For signed-in analytics, ayna substitutes a dedicated random analytics identifier rather than using the same user ID stored with your health records. You can opt out of analytics from your account privacy controls, and we honor Global Privacy Control where supported by the browser.
          </p>
          <p style={pStyle}>
            Please avoid putting information you do not want processed into free-text fields. We design our analytics layer to minimize health information and disable automatic exception capture, but no online system can guarantee that every technical edge case is risk-free.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2>5. AI-powered features</h2>
          <p style={pStyle}>
            When you intentionally use an AI-powered feature, ayna may send the prompt, product information and a limited amount of relevant profile context to an AI model provider so it can generate the requested response. Depending on server availability and configuration, ayna may use OpenAI, Anthropic or Google Gemini. We use multiple providers for reliability; not every request is sent to every provider.
          </p>
          <p style={pStyle}>
            AI responses are educational and may be incorrect. They are not medical diagnoses, prescriptions or substitutes for professional care.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2>6. Service providers and recipients</h2>
          <div style={{ display: 'grid', gap: '0.7rem', marginTop: '0.75rem' }}>
            {PROCESSORS.map(([name, role]) => (
              <div key={name} style={{ padding: '0.8rem 0.9rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-surface-soft)' }}>
                <strong>{name}</strong>
                <div style={{ ...pStyle, marginBottom: 0 }}>{role}</div>
              </div>
            ))}
          </div>
          <p style={pStyle}>
            We do not sell personal health information to data brokers or advertisers. We may disclose information when required by law, to protect users or the service, or as part of a corporate transaction subject to applicable law.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2>7. Affiliate links</h2>
          <p style={pStyle}>
            Some Buy links are affiliate links. ayna may earn a commission when you make a qualifying purchase, at no additional cost to you. As an Amazon Associate, ayna earns from qualifying purchases. Clicking a retailer link takes you to that retailer, whose privacy practices then apply.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2>8. Storage, security and retention</h2>
          <p style={pStyle}>
            Account-linked health data is primarily stored using Supabase and protected by access controls, including row-level security for user-owned records. Sensitive browser fallbacks such as health-intake answers, imported health context, AI recommendation memory and personalized insight caches are limited to the active browser tab rather than persistent local storage. Older persistent copies are removed as users load the updated site. Public catalog data and ordinary UI preferences may still be cached locally because they do not contain a user's health profile. ayna also uses HTTPS, server-side authentication checks, rate limiting, content-security controls and other safeguards. No system is perfectly secure.
          </p>
          <p style={pStyle}>
            We keep information only for as long as reasonably necessary to provide the service, comply with legal obligations, resolve disputes, prevent abuse and maintain required records. Different records may have different retention periods.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2>9. Your choices and rights</h2>
          <p style={pStyle}>
            Signed-in users can edit their health profile, opt out of analytics, download a copy of account-linked data and permanently delete their account from the account privacy controls. The download includes saved health-intake and imported health-profile records associated with the account. Deletion removes active user-linked data handled by the self-service deletion flow, subject to limited information we may be legally required to retain.
          </p>
          <p style={pStyle}>
            Depending on where you live, you may also have rights to access, correct, delete, restrict or obtain a copy of personal information, and to appeal certain privacy decisions.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2>10. Social login</h2>
          <p style={pStyle}>
            If you sign in with Google or another supported identity provider, ayna receives the information needed to create or authenticate your account, such as your provider user ID, email address, name or profile image depending on what that provider supplies and what you authorize.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2>11. Changes and contact</h2>
          <p style={pStyle}>
            We may update this policy as the product changes. Material changes will be reflected by changing the date above and, when appropriate, by providing additional notice.
          </p>
          <p style={pStyle}>
            Privacy questions or rights requests: <a href="mailto:puloma@aynahealth.co">puloma@aynahealth.co</a>.
          </p>
          <p style={{ ...pStyle, fontSize: '0.85rem' }}>
            This product-facing policy is intended to describe ayna's current technical behavior accurately. It is not a substitute for jurisdiction-specific legal advice; ayna should have privacy counsel review it as the service, geography and data flows expand.
          </p>
        </div>
      </div>
    </section>
  );
}
