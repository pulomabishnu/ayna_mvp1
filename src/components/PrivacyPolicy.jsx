import React from 'react';
import { EdPage } from './editorial/EdPage';

const PROCESSORS = [
  ['Supabase', 'Authentication and storage of account-linked data, including health-profile data you choose to save.'],
  ['Vercel', 'Website hosting and server-side API infrastructure.'],
  ['Stripe', 'Payment checkout, payment-card processing and subscription billing when you choose ayna Pro. ayna receives transaction status and subscription reference information, not your full card number.'],
  ['PostHog', 'Optional product analytics are off until you explicitly opt in. Before you choose, ayna counts page visits and app errors anonymously, without cookies, browser storage or an identifier, so we can tell whether the site is reached and working; choosing Keep analytics off or sending Global Privacy Control stops this too. If you turn analytics on, ayna uses a dedicated analytics identifier instead of your account ID, and analytics include the pages you visit and the products you view and click (product name or ID), across your visits; they exclude search text, quiz answers, conditions, symptoms and other health-profile details, and page titles. Session recording and automatic click/text capture are disabled. Analytics are never sold or used for advertising. You can opt out again in Privacy Preferences.'],
  ['OpenAI, Anthropic, and Google Gemini', 'Depending on feature availability and server configuration, one provider may process a prompt, product information and limited relevant health context when you intentionally use an AI-powered feature such as Ask ayna or AI product insights. Not every request is sent to every provider. A health screenshot you choose to read in Upload health data is sent to Anthropic only after you tap "Read it", and ayna does not store the image.'],
  ['Twilio', 'Phone verification and opted-in SMS features such as safety or recall messaging.'],
  ['Resend', 'Transactional and support email.'],
  ['Search providers', 'For sensitive symptom or condition searches, ayna checks its reviewed first-party health knowledge before using an external search service. External search is permitted only after the internal database has no adequate match; the fallback query is minimized and does not append your saved diagnosis list or health profile. Ordinary non-health product discovery may still use external search directly.'],
  ['Retailers and affiliate networks', 'When you choose a Buy link, the destination retailer may receive normal web-request information and an affiliate identifier. ayna does not send your saved ayna health profile to a retailer as part of an ordinary Buy-link click.'],
];

export default function PrivacyPolicy({ onBack, backLabel }) {
  return (
    <EdPage title="Privacy policy" crumb="Privacy" updated="Last updated November 10, 2026" onBack={onBack} backLabel={backLabel} toc glance bandLabel="In short" band={<div className="uq-legal-intro">
        <p>
          This policy explains how ayna handles personal information when you use www.aynahealth.co and related ayna services. ayna is a wellness, educational and product-discovery service, not a healthcare provider or emergency service. ayna accounts and account-only health features are for adults age 18 and older.
        </p>
        <p>
          Consumer health data receives additional disclosures and rights in our{' '}
          <a href="/consumer-health-data">Consumer Health Data Privacy Notice</a>, which supplements this policy.
        </p>
        </div>}>
        <section>
          <h2>1. Information we collect</h2>
          <p>
            Depending on the features you use, we may collect account information such as your name, email address, authentication details, phone number and notification preferences; health-profile information you choose to provide such as symptoms, concerns, conditions, medications, allergies, cycle information, life stage, preferences and notes; products you save, track, hide, review or add to your ecosystem; support or feedback messages; and technical information needed to operate and secure the service.
          </p>
          <p>
            ayna Pro offers an Early Access paid subscription with automatic renewal. If you choose it, Stripe Checkout processes your payment-card details and ayna stores the subscription status, amount, plan, payment reference and access period needed to administer your purchase. ayna does not store your full payment-card number. Your purchased subscription term begins February 1, 2027; see the current offer terms on /pro and the Terms of Use.
          </p>
        </section>

        <section>
          <h2>2. Health-file imports</h2>
          <p>
            When you import supported Apple Health or FHIR data, the raw import file is parsed in your browser and is not uploaded as a raw file to ayna. If you choose to save or use information extracted from that file, selected or summarized health information may be stored with your account or sent to an ayna API or contracted provider when you request a personalized feature.
          </p>
        </section>

        <section>
          <h2>3. How we use information</h2>
          <p>
            We use information to operate accounts, personalize product discovery, calculate relevance or match explanations, generate user-requested AI features, save your ecosystem and preferences, provide support, send messages you have requested, maintain product-safety features, prevent abuse, troubleshoot errors and improve ayna.
          </p>
          <p>
            Partnership or affiliate status may affect visibility in general Browse, but it does not change personalized match scores or personalized recommendation order.
          </p>
        </section>

        <section>
          <h2 id="analytics">4. Analytics and privacy preferences</h2>
          <p>
            Optional PostHog usage analytics are off until you explicitly opt in. Until you choose, ayna sends only an anonymous count of page visits and app errors, with no cookies, browser storage or identifier, and page addresses cut to the section of the site (for example &quot;a product page&quot;, never which product); Keep analytics off and Global Privacy Control stop this too. Unless you choose Keep off, we count Buy clicks per product per day, without any information about who clicked. Global Privacy Control stops this count too. If you click Turn on, analytics also record the pages you visit and the products you view and click (product name or ID) across your visits, linked to a random analytics identifier, not your name, email or account ID. Search text, quiz answers, conditions, symptoms, other health-profile details and page titles are never included, and analytics are never sold or used for advertising. You can withdraw consent at any time with Privacy choices in the site footer or in account privacy controls; a prior denial is not silently expired and Global Privacy Control is respected. Session recording, automatic click/text capture and automatic exception capture are disabled, and IP collection is disabled in ayna's PostHog configuration.
          </p>
          <p>
            Raw health-search text, account email, direct account identifiers, product identifiers, and known health-profile fields are stripped before optional events are sent. Signed-in usage analytics use a dedicated random analytics identifier, not your health-record account ID. Aggregated usage counts may still be retained after you withdraw consent.
          </p>
          <p>
            We design analytics to minimize health information, but no online system can guarantee that every technical edge case is risk-free. Please avoid putting information you do not want processed into free-text fields.
          </p>
        </section>

        <section>
          <h2>5. AI-powered features</h2>
          <p>
            When you intentionally use an AI-powered feature, ayna may send the prompt, product information and a limited amount of relevant profile context through ayna's server to the AI provider selected for that request. Depending on availability and configuration, ayna may use OpenAI, Anthropic or Google Gemini. We use multiple providers for reliability; not every request is sent to every provider.
          </p>
          <p>
            We minimize the context sent to what is relevant for the requested feature. We do not describe health context sent to an AI provider as anonymous when it may still be linkable or sensitive. AI responses are educational and may be incorrect. They are not medical diagnoses, prescriptions or substitutes for professional care.
          </p>
        </section>

        <section>
          <h2>6. Service providers and recipients</h2>
          <dl className="ed-dl">
            {PROCESSORS.map(([name, role]) => (
              <div key={name}>
                <dt>{name}</dt>
                <dd>{role}</dd>
              </div>
            ))}
          </dl>
          <p>
            We do not sell personal health information to data brokers or advertisers. We may disclose information when required by law, to investigate fraud, abuse or security incidents, to protect users or the service, or as part of a corporate transaction subject to applicable law and this policy.
          </p>
        </section>

        <section>
          <h2>7. Affiliate links and commercial relationships</h2>
          <p>
            Some Buy links are affiliate links. ayna may earn a commission when you make a qualifying purchase, at no additional cost to you. As an Amazon Associate, ayna earns from qualifying purchases. Clicking a retailer link takes you to that retailer, whose privacy practices and purchase terms then apply.
          </p>
        </section>

        <section>
          <h2>8. Storage, security and retention</h2>
          <p>
            Account-linked health data is primarily stored using Supabase and protected by access controls, including row-level security for user-owned records. Sensitive browser fallbacks such as health-intake answers, imported health context, AI recommendation memory and personalized insight caches are limited to active-session storage rather than long-term persistent local storage. Older persistent copies are removed as users load the updated site. Public catalog data and ordinary UI preferences may still be cached locally because they do not contain a user's health profile.
          </p>
          <p>
            ayna also uses HTTPS, server-side authentication and authorization checks, rate limiting, content-security controls, restricted image fetching, source-map controls and other safeguards. No system is perfectly secure.
          </p>
          <p>
            We keep information only for as long as reasonably necessary to provide the service, comply with legal obligations, resolve disputes, prevent abuse, investigate security incidents and maintain required records. Different records may have different retention periods.
          </p>
        </section>

        <section>
          <h2>9. Your choices and rights</h2>
          <p>
            Signed-in users can edit their health profile, change analytics preferences, download a copy of account-linked data and permanently delete their account from the account privacy controls. The download includes saved health-intake and imported health-profile records associated with the account. Deletion removes active user-linked data handled by the self-service deletion flow, subject to limited information we may be legally required to retain.
          </p>
          <p>
            Depending on where you live, you may also have rights to access, correct, delete, restrict, withdraw consent for certain processing, obtain a copy of personal information, learn which categories of recipients received consumer health data, and appeal certain privacy decisions. See the Consumer Health Data Privacy Notice for additional health-data rights and instructions.
          </p>
        </section>

        <section>
          <h2>10. Social login</h2>
          <p>
            If you sign in with Google or another supported identity provider, ayna receives the information needed to create or authenticate your account, such as your provider user ID, email address, name or profile image depending on what that provider supplies and what you authorize. New account creation requires acceptance of ayna's current privacy, AI, wellness and 18+ confirmations.
          </p>
        </section>

        <section>
          <h2>11. Adults only</h2>
          <p>
            ayna accounts and account-only health features are not intended for people under 18. If we learn that an account was created by someone under 18, we may suspend the account and delete information as appropriate, subject to applicable law.
          </p>
        </section>

        <section>
          <h2>12. Text messages (SMS)</h2>
          <p>
            If you add and verify your mobile number in ayna and turn on text messages, ayna uses your number to send the texts you chose: one-time verification codes, reminders you set up, order updates, and replies when you text ayna. Each type is a separate opt-in that is off until you turn it on. Message frequency varies. Message and data rates may apply. Reply STOP to opt out at any time and HELP for help.
          </p>
          <p>
            We do not sell or share your SMS opt-in data or personal information with third parties for marketing purposes. Mobile phone numbers and text messaging opt-in data and consent are not shared with any third parties or affiliates, except the service providers that deliver the messages for ayna (Twilio).
          </p>
        </section>

        <section>
          <h2>13. Changes and contact</h2>
          <p>
            We may update this policy as the product or law changes. Material changes will be reflected by changing the date above and, when required, by providing additional notice or requesting additional consent before using existing information for a newly disclosed purpose.
          </p>
          <p>
            Privacy questions, consumer health data requests, rights requests or appeals: <a href="mailto:puloma@aynahealth.co">puloma@aynahealth.co</a>.
          </p>
        </section>
    </EdPage>
  );
}
