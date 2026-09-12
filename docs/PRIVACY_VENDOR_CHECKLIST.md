# Privacy Vendor / Processor Checklist

Last reviewed: 2026-09-12

Use this internal checklist whenever ayna adds or materially changes a vendor that can receive personal information or consumer health data.

## Current processor categories to verify

- Supabase — authentication, database, account-linked health data
- Vercel — hosting and server APIs
- PostHog — default-on product analytics with persistent opt-out / GPC handling
- OpenAI — AI processing where configured
- Anthropic — AI processing where configured
- Google Gemini — AI processing where configured
- Twilio — phone verification / opted-in SMS
- Resend — transactional/support email
- External search provider(s) — ordinary product discovery, plus minimized sensitive-health fallback only after the reviewed internal database has no adequate match
- Retailer / affiliate networks — outbound purchase attribution

## Before enabling a processor

Confirm and retain evidence of:

- the correct legal vendor/entity name;
- the service being used and exact data categories it can receive;
- processor/DPA terms or other binding privacy terms appropriate to the data flow;
- subprocessor list and notification mechanism;
- security documentation appropriate to the sensitivity of the data;
- breach/incident notification terms;
- data location / international transfer mechanism where relevant;
- retention and deletion controls;
- whether data is used for the vendor's own advertising, profiling, or model training and whether those uses can be disabled or contractually restricted;
- a named ayna owner and next review date.

## Consumer-health-data rule

Do not send consumer health data to a new recipient merely because the vendor has a standard privacy policy. Confirm that the sharing is necessary for a user-requested feature or supported by the required consent, that the public Consumer Health Data Privacy Notice identifies the appropriate category of recipient, and that the vendor's contractual role matches the published disclosure.

## Change-management rule

If a vendor, purpose, data category, or recipient category materially changes:

1. update the internal data map;
2. update Privacy Policy / Consumer Health Data Privacy Notice before the new use when required;
3. obtain additional consent before using previously collected data for a materially new purpose when applicable;
4. update account/export/deletion workflows if the vendor retains account-linked data;
5. test that analytics and logging still exclude sensitive free text and direct account identifiers as designed.

## Offboarding

When a processor is removed:

- disable credentials/integrations;
- request or verify deletion where contractually available;
- remove the vendor from public notices once the old data relationship no longer needs disclosure;
- retain termination/deletion evidence according to ayna's legal-record requirements.

Do not store API keys or secrets in this file.
