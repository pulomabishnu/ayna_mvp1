import React from 'react';

const PROCESSORS = [
  ['Supabase', 'Authentication and storage of account-linked data, including health profiles, preferences, saved products, SMS-related account records, and other user-owned records.'],
  ['Vercel', 'Website and API hosting infrastructure used to deliver ayna services.'],
  ['PostHog', 'Product-usage analytics and coarse app-error signals. In the iOS app, analytics require a first-use choice before collection starts. ayna disables session recording, automatic click/text capture, automatic exception capture, and IP collection, and filters health-profile answers, message content, direct contact information, raw sensitive search text, authentication tokens, and health-inferential product/category fields from analytics payloads.'],
  ['Anthropic, OpenAI, and Google Gemini', 'When you intentionally use an AI-powered feature, the provider selected for that request may process your prompt, product information, and a limited amount of relevant wellness context to generate the requested response. Google Gemini may be reached through Vercel AI Gateway where configured. Not every request is sent to every provider.'],
  ['Twilio', 'Phone verification and user-initiated SMS functionality, including personalized health-question conversations when you choose to use them.'],
  ['Resend', 'Transactional, contact, and support email delivery.'],
  ['Google and Apple', 'Account authentication when you choose Google sign-in or Sign in with Apple. The identity provider may supply identifiers, email, and profile information permitted by that provider and your choices, such as Apple Hide My Email.'],
  ['Search providers', 'Product and information discovery when you intentionally search beyond the ayna catalog. External discovery is account-authenticated and requires the current AI privacy permission before a potentially health-sensitive query leaves ayna.'],
  ['Retailers and affiliate networks', 'When you choose a Buy link, the destination retailer may receive normal web-request information and an affiliate identifier. ayna does not send your identifiable health profile to a retailer as part of an ordinary Buy-link click.'],
];

const sectionStyle = { padding: '1.05rem 0', borderTop: '1px solid var(--color-border)' };
const pStyle = { margin: '0.5rem 0', color: 'var(--color-text-muted)', lineHeight: 1.72 };
const ulStyle = { ...pStyle, paddingLeft: '1.3rem' };

export default function PrivacyPolicy({ onBack }) {
  return (
    <section className="container animate-fade-in-up" style={{ padding: 'var(--spacing-xl) var(--spacing-md)', maxWidth: 900 }}>
      <div className="card" style={{ padding: 'clamp(1.25rem, 4vw, 2.5rem)' }}>
        {onBack && (
          <button type="button" className="btn btn-outline" onClick={onBack} style={{ marginBottom: '1rem' }}>
            Back
          </button>
        )}

        <h1 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: 'clamp(2rem, 5vw, 2.7rem)' }}>Privacy Policy</h1>
        <p style={{ ...pStyle, marginTop: '0.4rem' }}><strong>Last updated September 13, 2026</strong></p>
        <p style={pStyle}>
          This policy explains how ayna handles personal information when you use www.aynahealth.co, the ayna iOS/mobile app, an ayna account, or related account-based services. ayna is a wellness, education, and product-discovery service. It is not a healthcare provider, diagnosis service, or emergency service. ayna accounts and account-only health features for this release are for adults age 18 and older.
        </p>
        <p style={pStyle}>
          Consumer health data receives additional disclosures and rights in our{' '}
          <a href="/consumer-health-data.html">Consumer Health Data Privacy Notice</a>, which supplements this policy.
        </p>

        <div style={sectionStyle}>
          <h2>1. Information we collect</h2>
          <p style={pStyle}>Depending on the features you choose to use, ayna may collect:</p>
          <ul style={ulStyle}>
            <li>account information such as name, email address, phone number, account/user identifiers, authentication information, and sign-in provider;</li>
            <li>health and wellness information you choose to provide, including symptoms, conditions, cycle information, pregnancy or postpartum information, reproductive or sexual wellness information, medications, supplements, allergies, pain/severity, goals, life stage, and related profile answers;</li>
            <li>ZIP or similar coarse/profile location information, not precise GPS for this release;</li>
            <li>insurance, FSA/HSA, budget, purchase-tendency, product-format, and other preference information;</li>
            <li>saved, tracked, hidden, reviewed, or interacted-with products and related purchase/product history;</li>
            <li>searches and product-discovery interactions;</li>
            <li>Ask ayna questions, product-chat questions, reviews, feedback, support messages, and other user-provided text;</li>
            <li>SMS conversation content when you choose to use ayna SMS features;</li>
            <li>device/product analytics identifiers, app usage events, and coarse crash/error or diagnostic signals used to operate and improve the service.</li>
          </ul>
          <p style={pStyle}>
            The submitted release does not collect payment-card numbers or billing-card details through ayna. If payment features are introduced later, this policy and App Store disclosures will be updated to describe the actual payment flow.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2>2. Sources of information</h2>
          <p style={pStyle}>
            Most information comes directly from you through account creation, profile and intake answers, searches, product interactions, messages, reviews, support, and features you choose to use. If you sign in with Google or Apple, ayna also receives the account information the identity provider supplies for authentication, such as a provider identifier, email address, and available profile/name information. We may derive limited inferences from information you provide in order to produce a requested product match, safety check, recommendation, or AI response.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2>3. How we use information</h2>
          <p style={pStyle}>
            We use information to create and secure accounts, save and personalize your health/product profile, provide product discovery and recommendations, explain product relevance, provide user-requested AI and SMS features, maintain product-safety and recall functionality, provide support, prevent abuse, troubleshoot problems, and improve ayna.
          </p>
          <p style={pStyle}>
            Commercial, affiliate, or partner status is not used to increase a personalized health match score or personalized recommendation rank, and it does not change Ask ayna answers. Commercial metadata may be used for affiliate links, disclosure badges, attribution, giveaways, events, or other non-personalized commercial surfaces.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2>4. Analytics and privacy choices</h2>
          <p style={pStyle}>
            ayna uses PostHog for product analytics and coarse app-error signals. In the native iOS app, optional analytics do not begin on a fresh install until you choose <strong>Allow analytics</strong>. You can decline and still use core app features, and you can change the choice later from Privacy &amp; Data. A prior opt-out is honored on later launches. Global Privacy Control is respected where applicable.
          </p>
          <p style={pStyle}>
            ayna disables PostHog session recording, automatic click/text capture, automatic exception capture, and IP collection. Analytics use a dedicated device/account analytics identifier and may therefore be linkable for analytics purposes; we do not describe this analytics data as anonymous. The analytics boundary is designed to remove direct contact information, account IDs, raw health-profile answers, Ask ayna or SMS message text, authentication tokens, raw sensitive search text, and health-inferential product/category identifiers before an event is sent.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2>5. AI-powered features and consent</h2>
          <p style={pStyle}>
            When you intentionally use an AI-powered feature, ayna may send your prompt, relevant product information, recent conversation context, and a limited amount of relevant wellness context through ayna's server to a third-party AI provider selected for that request. Depending on availability and configuration, that provider may be Anthropic, OpenAI, or Google Gemini. Gemini may use Vercel AI Gateway as routing infrastructure. Not every request is sent to every provider.
          </p>
          <p style={pStyle}>
            The iOS app asks for an explicit AI privacy choice before account-linked personal or health information is used with these AI features. If you do not agree, you can continue using non-AI parts of ayna. After allowing AI features, you can withdraw that permission at any time from <strong>Settings → Privacy &amp; Data → Allow AI features</strong>. The server checks the current permission for protected AI routes, so turning it off prevents new account-linked requests from being sent to these AI providers until you allow it again. ayna is designed not to include your name, email address, phone number, or account UUID in AI prompts and to minimize health context to what is relevant for the feature. AI output can be wrong and is educational only, not a medical diagnosis, prescription, or substitute for professional care.
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
            We may also disclose information when required by law, to investigate fraud, abuse, or security incidents, to protect users or the service, or as part of a corporate transaction subject to applicable law and this policy.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2>7. Consumer health data, partners, and advertising</h2>
          <p style={pStyle}>
            ayna does not sell identifiable health data and does not provide partners with identifiable individual health profiles for advertising or targeting. We may use de-identified or aggregated information to understand trends, improve our services, and create aggregate insights. Partners must not receive names, emails, phone numbers, account IDs, individual health profiles, identifiable Ask ayna histories, identifiable SMS content, or other individual-level sensitive health data for advertising or targeting.
          </p>
          <p style={pStyle}>
            ayna does not use health information to build third-party targeted advertising audiences and does not attempt to re-identify aggregate or de-identified health information. The current iOS release does not request the advertising identifier (IDFA) and does not use Apple-defined cross-company tracking.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2>8. Search history</h2>
          <p style={pStyle}>
            Search terms are processed to return results. The current release is designed not to build a persistent account-linked history of raw search queries in ayna browser/device storage. Ordinary catalog search stays inside ayna. If you intentionally search beyond the ayna catalog, the external discovery request requires a signed-in account and the current AI privacy permission before the query is sent to configured AI/search providers. Those providers may process or retain request data under their own applicable service terms and the production settings/contracts ayna uses with them. Product interactions resulting from a search can still be recorded separately where needed to provide account features, but ayna's analytics filter removes raw search text and health-inferential product/category identifiers.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2>9. SMS</h2>
          <p style={pStyle}>
            If you verify a phone number and use ayna's SMS features, inbound and outbound message content may be stored with your account so ayna can provide and personalize that conversation. Twilio processes the phone/SMS traffic and ayna may use an AI provider to generate a requested health-information reply only while the account has the current AI permission. SMS health conversations are not marketing consent. STOP, UNSUBSCRIBE, CANCEL, END, or QUIT opt you out of ordinary ayna SMS; START or UNSTOP can re-enable it subject to carrier/provider behavior and ayna's stored preference.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2>10. Storage, security, and retention</h2>
          <p style={pStyle}>
            Account-linked data is primarily stored using Supabase with authentication and row-level/access controls for user-owned records. ayna also uses HTTPS, server-side authorization checks, rate limiting, content-security controls, privacy filtering, and other safeguards. No online system is perfectly secure.
          </p>
          <p style={pStyle}>
            We keep information only for as long as reasonably necessary for the purpose for which it is used, to provide requested services, meet legal obligations, resolve disputes, prevent abuse, investigate security incidents, and maintain required records. Different records and service providers may have different retention periods. We do not promise a specific deletion period unless it is actually enforced.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2>11. Your choices, data export, and account deletion</h2>
          <p style={pStyle}>
            Signed-in users can edit profile information, change analytics preferences, turn third-party AI processing off or back on, view or download a copy of account-linked data available through ayna's self-service export, and permanently delete their account from <strong>Settings → Account → Delete account</strong>. The export describes its scope and may not include every independent log held by an infrastructure or identity provider.
          </p>
          <p style={pStyle}>
            Account deletion removes the ayna account and associated active user-linked personal data handled by the deletion flow, except information that must be retained for legal, security, fraud-prevention, or other permitted purposes. When a revocable Sign in with Apple authorization is available to ayna's server, the deletion flow also attempts to revoke that Apple authorization. Where applicable, processors or identity-provider records may have separate deletion or revocation requirements.
          </p>
          <p style={pStyle}>
            Depending on where you live, you may also have rights to access, correct, delete, restrict, withdraw consent for certain processing, obtain a copy of personal information, learn categories of recipients, and appeal certain privacy decisions. See the Consumer Health Data Privacy Notice for additional health-data rights.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2>12. Adults only</h2>
          <p style={pStyle}>
            ayna accounts and account-only health features in this release are intended only for people age 18 and older. If you are under 18, do not create an account or submit consumer health data to ayna.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2>13. Changes and contact</h2>
          <p style={pStyle}>
            We may update this policy as the product or law changes. Material changes will be reflected by changing the date above and, when required, by providing additional notice or requesting new consent before using existing information for a newly disclosed purpose.
          </p>
          <p style={pStyle}>
            Privacy questions, consumer health data requests, rights requests, or appeals: <a href="mailto:puloma@aynahealth.co">puloma@aynahealth.co</a>.
          </p>
        </div>
      </div>
    </section>
  );
}
