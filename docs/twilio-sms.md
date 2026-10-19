# Twilio SMS for ayna

Everything here is off until the env vars below are set. While they are unset,
`/api/sms` reports `configured: false`, the reminders cron returns
`configured: false`, team texts are skipped, and nothing throws.

## What already existed (unchanged in behavior)

- `api/phone-verify-send.js`, `api/phone-verify-confirm.js`: phone verification
  with a self-issued, peppered 6-digit code (`api/_otp.js`), stored server-only
  in `pending_phone_verifications`; verified number in `phone_numbers`.
- `api/sms-webhook.js`: inbound texts, signature check with
  `twilio.validateRequest` (fails closed), STOP/START, Ask ayna by text with a
  burst limit and a weekly quota, transcript in `sms_conversations`.
- `api/fda-recall.js`: recall texts to verified, not-opted-out numbers.

## What was added

- `supabase/sms_2026-10-19.sql`: `sms_preferences` (per-feature opt-ins:
  reminders, orders, chat, health_details; stopped_at; consent version/time)
  and `sms_events` (consent and send log, never bodies or numbers).
- `api/_twilio.js`: outbound send over Twilio REST (no SDK), team alerts,
  config flags. `api/_smsStore.js`: prefs, events, per-day counting, `sendOrderText`.
- `api/sms.js`: one authenticated endpoint for the app's Text messages screen.
- `api/sms-webhook.js`: HELP/INFO, STOP clears every feature, START keeps
  features off, chat needs opt-in, 5 texts a day, profile only with health details.
- `api/sms-reminders.js` + daily cron in `vercel.json` (15:00 UTC).
- Team texts on new suggestions and app/wearable requests (email unchanged).
- `src/utils/smsApi.js` client.

## Env vars (Vercel, Production)

| Var | Needed for |
| --- | --- |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` | everything; the auth token also validates inbound webhooks |
| `TWILIO_MESSAGING_SERVICE_SID` | preferred sender for reminders, order and team texts |
| `TWILIO_PHONE_NUMBER` | existing sender for verification codes and recall texts; also the fallback sender. `TWILIO_FROM_NUMBER` is accepted as an alias for new sends |
| `TEAM_SMS_NUMBERS` | comma list, E.164, founder numbers for team alerts |
| `AYNA_TEXT_NUMBER` | the public number people text, shown in the app |
| `CRON_SECRET` | already set for other crons; protects `/api/sms-reminders` |
| `SMS_SUPPORT_EMAIL` | optional, HELP reply email (default puloma@aynahealth.co) |
| `SMS_ALLOWED_COUNTRY_CODES` | optional, existing, default `1` (US/Canada) |

`TWILIO_VERIFY_SERVICE_SID` is not used: verification stays on the existing
self-issued code flow, which works on accounts that cannot provision Verify.

## Legacy website subscribers

People who verified on the website "ayna by text" screen agreed that their
texts would be used to give personalized health information, and have no
`sms_preferences` row. For them chat (with their profile) works as before, and
reminders and order texts stay off. Once she saves settings in the app (or
texts STOP), the explicit row is all that counts.

## Twilio console setup

1. Buy or port the public number; set `AYNA_TEXT_NUMBER` to it.
2. Messaging Service: create one, add the number to its sender pool, set
   `TWILIO_MESSAGING_SERVICE_SID`. Under Integration, "Send a webhook" to
   `https://www.aynahealth.co/api/sms-webhook` (HTTP POST). The URL must match
   exactly or signatures fail.
3. A2P 10DLC: register the brand (ayna) and a campaign (use case: account
   notifications / customer care, mixed). Sample messages: the HELP reply,
   the restock reminder, the check-in nudge. Opt-in description: in-app
   Text messages screen with per-feature switches, verified by code. Attach
   the campaign to the Messaging Service. US texts are filtered until approved.
4. Advanced Opt-Out (Messaging Service, Opt-Out Management): turn it on and
   keep the default STOP / START / HELP keywords. Set the HELP text to match
   the webhook's HELP reply. Twilio then blocks texts to anyone who sent STOP.
5. Verify service: not needed (see above).
6. Set the env vars in Vercel and redeploy. Run the SQL file once.

## Order texts

There is no ayna order or checkout backend yet. When one exists, call
`sendOrderText(admin, userId, 'placed' | 'shipped' | 'delivered' | 'canceled', { productName })`
from `api/_smsStore.js` right after the order status is saved. It only sends
with `orders` on and leaves the product name out unless health details are on.
