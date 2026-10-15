#!/usr/bin/env node
/* global process, console */
/**
 * Free product campaign announcement.
 *
 *   node scripts/send-campaign-email.mjs --preview            writes artifacts/campaign-email/*.html
 *   node scripts/send-campaign-email.mjs --test you@x.com     sends one copy to you
 *   node scripts/send-campaign-email.mjs --send               dry run: lists who would get it
 *   node scripts/send-campaign-email.mjs --send --confirm     actually sends
 *
 * Audience for --send: ayna accounts with a confirmed email, minus anyone in
 * email_suppressions (unsubscribed). Refuses to send without
 * EMAIL_POSTAL_ADDRESS (required in commercial email) and RESEND_API_KEY.
 * Needs SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY for --send.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { announcementEmail, claimedEmail, sendEmail, unlockedEmail, unsubscribeUrl } from '../api/_campaignEmail.js';

const args = process.argv.slice(2);
const has = (f) => args.includes(f);
const val = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : null; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

if (has('--preview') || !args.length) {
  const out = path.resolve('artifacts/campaign-email');
  fs.mkdirSync(out, { recursive: true });
  const sample = 'preview@example.com';
  fs.writeFileSync(path.join(out, 'announcement.html'), announcementEmail({ email: sample, firstName: 'Maya' }).html);
  fs.writeFileSync(path.join(out, 'unlocked.html'), unlockedEmail({ email: sample }).html);
  fs.writeFileSync(path.join(out, 'claimed.html'), claimedEmail({ email: sample, productName: 'Sample product', productBrand: 'Sample brand' }).html);
  console.log(`Wrote previews to ${out}`);
  process.exit(0);
}

function requireEnv(...names) {
  const missing = names.filter((n) => !process.env[n]);
  if (missing.length) { console.error(`Missing env: ${missing.join(', ')}`); process.exit(1); }
}

if (has('--test')) {
  requireEnv('RESEND_API_KEY', 'EMAIL_POSTAL_ADDRESS');
  const to = val('--test');
  const r = await sendEmail({ to, ...announcementEmail({ email: to }), unsubscribe: unsubscribeUrl(to) });
  console.log(r);
  process.exit(r.ok ? 0 : 1);
}

if (has('--send')) {
  requireEnv('SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'EMAIL_POSTAL_ADDRESS', ...(has('--confirm') ? ['RESEND_API_KEY'] : []));
  const admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const { data: sup, error: supErr } = await admin.from('email_suppressions').select('email');
  if (supErr) { console.error('Could not read email_suppressions (is the migration applied?)', supErr.message); process.exit(1); }
  const suppressed = new Set((sup || []).map((s) => s.email));

  const audience = [];
  for (let page = 1; ; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    for (const u of data.users || []) {
      const email = String(u.email || '').toLowerCase();
      if (!email || u.is_anonymous || !u.email_confirmed_at || suppressed.has(email)) continue;
      audience.push({ email, firstName: String(u.user_metadata?.first_name || '').trim().split(/\s+/)[0] || '' });
    }
    if ((data.users || []).length < 1000) break;
  }
  console.log(`${audience.length} recipients (${suppressed.size} unsubscribed skipped).`);
  if (!has('--confirm')) { console.log('Dry run. Add --confirm to send.'); process.exit(0); }

  let ok = 0; let failed = 0;
  for (const person of audience) {
    const r = await sendEmail({ to: person.email, ...announcementEmail(person), unsubscribe: unsubscribeUrl(person.email), idempotencyKey: `announce-free-product-2026-${person.email}` });
    if (r.ok) ok += 1; else { failed += 1; console.error(person.email.replace(/^(.).*@/, '$1***@'), r.error || r.skipped); }
    await sleep(600); // stays under Resend's default 2 requests/second
  }
  console.log(`Sent ${ok}, failed ${failed}.`);
}
