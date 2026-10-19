#!/usr/bin/env node
/**
 * Writes the free product campaign emails to emails/free-product/*.html so
 * they can be opened in a browser, pasted into Resend as a broadcast, or
 * sent as a test from the Resend dashboard. This script sends NOTHING.
 *
 *   node scripts/render-campaign-emails.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { announcementEmail, claimedEmail, shippedEmail, unlockedEmail } from '../api/_campaignEmail.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'emails', 'free-product');
fs.mkdirSync(out, { recursive: true });

// Sample product for the transactional previews only.
const sample = { name: 'Saalt Menstrual Cup', brand: 'Saalt', image: 'https://shop.periodnirvana.com/cdn/shop/files/saaltgreenprod.jpg' };

const emails = {
  announcement: announcementEmail(),
  unlocked: unlockedEmail(),
  claimed: claimedEmail({ product: sample }),
  shipped: shippedEmail({ product: sample }),
};

for (const [name, m] of Object.entries(emails)) {
  fs.writeFileSync(path.join(out, `${name}.html`), m.html);
  fs.writeFileSync(path.join(out, `${name}.txt`), `Subject: ${m.subject}\n\n${m.text}\n`);
  console.log(`wrote emails/free-product/${name}.html  (${m.subject})`);
}
