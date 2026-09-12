# Security and Health-Data Incident Response Plan

Last reviewed: 2026-09-12

This internal runbook covers suspected unauthorized access, disclosure, loss, alteration, or misuse of ayna account data or consumer health data. It is operational guidance, not a substitute for legal advice.

## 1. Trigger the incident process

Treat any of the following as an incident until ruled out:

- unauthorized access to Supabase, Vercel, PostHog, an AI provider, Twilio, Resend, GitHub, or another production processor;
- exposed secrets, tokens, service-role credentials, signing keys, or authentication bypass credentials;
- evidence that one user could access another user's records;
- unexpected health data in analytics, logs, error tracking, support systems, or third-party services;
- lost or stolen administrator devices with active production sessions;
- suspicious account deletion/export behavior, unusual data exfiltration, or mass scraping of user-owned records;
- a processor notifying ayna of a security event that may affect ayna data.

## 2. Immediate containment

1. Create an incident record with UTC timestamp, reporter, systems involved, and what is known.
2. Preserve relevant logs before rotation where legally and technically appropriate.
3. Revoke or rotate affected secrets and sessions.
4. Disable the affected feature, integration, account, endpoint, or deployment if leaving it active increases risk.
5. Do not delete evidence or rewrite production history solely to make the incident disappear.
6. Limit internal discussion to people who need the information to respond.

## 3. Determine scope

Document:

- what data categories were involved, especially reproductive, sexual, pregnancy, medication, condition, symptom, allergy, or other consumer health data;
- whose data may have been affected and how many people may be involved;
- whether the data was actually acquired, viewed, changed, exfiltrated, or merely exposed to a risk;
- the systems and processors involved;
- the earliest and latest known exposure times;
- whether credentials, authentication tokens, or encryption keys were involved;
- whether law enforcement, regulators, processors, or affected users may need notice.

## 4. Legal/privacy escalation

Promptly escalate a suspected consumer-health-data breach to qualified privacy/security counsel. Counsel should assess applicable notification obligations, including the FTC Health Breach Notification Rule and state consumer-health-data or breach-notification laws.

Do not promise users or regulators that an event is or is not a legally reportable breach before the legal assessment is complete.

## 5. Processor coordination

For each affected processor:

- open the processor's security/support case;
- obtain incident timestamps, logs, affected data categories, remediation steps, and written confirmation where available;
- preserve the processor's notice and case number;
- confirm whether the processor made any downstream disclosures.

## 6. Notifications

If notice is legally required, use counsel-reviewed notices and meet the shortest applicable deadline. Track:

- affected consumers;
- FTC or other regulator notices;
- state attorney general or agency notices;
- processor/subprocessor notices;
- dates sent and delivery method.

Notices should accurately describe what happened, what information was involved, what ayna has done, what the user can do, and how to contact ayna. Avoid speculation.

## 7. Recovery

Before restoring a disabled system or feature:

- fix the root cause;
- rotate affected credentials;
- verify authorization and RLS policies;
- verify analytics/logging boundaries;
- run relevant tests and a production build;
- monitor for recurrence.

## 8. Post-incident review

Within a reasonable period after containment:

- write a root-cause analysis;
- record what detection or control failed;
- create remediation owners and deadlines;
- update privacy notices, data maps, processor records, or retention rules if the actual data flow differed from published disclosures;
- retain the incident record according to counsel-approved retention requirements.

## 9. Emergency contacts to maintain outside the repository

Keep an up-to-date private contact list for:

- privacy/security counsel;
- cyber/privacy insurer and breach hotline, if covered;
- Supabase, Vercel, PostHog, AI providers, Twilio, Resend, and other production processors;
- authorized ayna incident leads.

Never store live production secrets in this runbook.
