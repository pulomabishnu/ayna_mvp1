# DRAFT: Consumer Health Data, connected apps and wearables

> **Not approved. Not live.** Proposed additions for founder and counsel review.
> The live Privacy Policy and the in-app Consumer Health Data screen have NOT
> been changed. Written to fit Washington's My Health My Data Act (RCW 19.373),
> Nevada SB 370, Connecticut's consumer health data rules, the FTC Health
> Breach Notification Rule, Apple App Review 5.1.3 and Google Play's Health apps
> policy, but code and copy alone do not make ayna compliant. Counsel should confirm.

## What we collect when you connect health data
Only the categories you turn on, as daily summaries:
- **Sleep:** time asleep, deep and REM sleep
- **Cycle:** period days and flow level
- **Temperature:** basal body temperature, overnight skin temperature, temperature change from your normal
- **Heart:** resting heart rate, heart rate variability, average heart rate
- **Activity:** steps, active energy, workout time and count
- **Readiness:** your device's daily readiness score (Oura)

We do not collect your location, routes, medications or clinical records from these sources, minute-by-minute readings, or anything you leave off.

## Where it comes from
Apple Health (iPhone), Health Connect (Android), Oura (with your sign-in), and files or numbers you upload and confirm. We record which app or device each value came from.

## Why we use it
- To show you your own trends (Health Insights).
- To make products for goals **you chose** a stronger match when your trends support them, and to explain when that happened.

We do not use it to diagnose anything, for advertising or marketing, to decide what brand partners pay or where they appear, or to build audiences. We do not give it to AI models. We do not sell it.

## Who we share it with
No one, except service providers that store and run ayna for us (database hosting: Supabase; app hosting: Vercel) under contracts that limit them to that. **[Counsel: confirm processor list, DPAs, and whether Upstash (rate limiting, no health values) needs listing.]** If you turn on screenshot reading, the screenshot is sent to Anthropic to read the numbers, and is not kept. **[Feature is off until this is approved.]**

## Your choices
- Each category is off until you turn it on, for each source.
- **Pause** syncing any time.
- **Disconnect only:** we stop collecting and remove our access at the provider; what we already have stays until you delete it.
- **Disconnect and delete:** we also delete everything we stored from that source.
- Turning a category off deletes what we had for it from that source.
- **Delete all my health data:** You → Health data, or You → Settings → Privacy & data.
- Deleting your account deletes all of it.
- On iPhone, also manage access in the Health app (your picture → Privacy → Apps → ayna). On Android, in Health Connect → App permissions.
- Access: Settings → Account → download your data includes your health data.

**[Counsel: MHMDA requires notifying processors of deletion; confirm Supabase backup retention and wording. Oura's agreement requires deletion within 72 hours of a request; ours is immediate in the live database.]**

## Retention
We keep daily summaries while the source is connected and you don't delete them. **[Decide: an automatic limit, e.g. 24 months.]** Uploaded files are never stored.

## Breaches
If health data is ever accessed or shared without your authorization, we will notify you, and regulators where required, within the time the law requires (FTC Health Breach Notification Rule: no later than 60 days).

---
## Checklist outside this text
- [ ] Homepage link to a standalone Consumer Health Data Privacy Policy (MHMDA requirement).
- [ ] App Store privacy details: Health & Fitness data, linked to identity, used for App Functionality only, not used for tracking.
- [ ] Google Play Data Safety + Health apps declaration (exact permission list in AndroidManifest.xml) + "not a medical device" statement.
- [ ] Oura: written confirmation on personal product matching before enabling it.
- [ ] Separate consent if any health data is ever shared with a third party (MHMDA), and signed authorization for any sale (we don't plan either).
