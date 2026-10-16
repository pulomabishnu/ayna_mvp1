/* global process, Buffer */
/**
 * Free product campaign emails: the announcement plus two transactional
 * messages (reward unlocked, reward claimed). Sent through Resend, the same
 * provider api/contact.js already uses.
 *
 * Built with tables and inline styles so it holds up in Gmail, Outlook and
 * Apple Mail. Same visual language as the site: paper background, 2px ink
 * outlines, butter / pink / periwinkle tiles, Bricolage Grotesque headings
 * and Poppins body (both fall back to system fonts where web fonts don't load).
 */
import crypto from 'node:crypto';

export const SITE = (process.env.PUBLIC_SITE_URL || 'https://www.aynahealth.co').replace(/\/$/, '');
export const CAMPAIGN_URL = `${SITE}/free-product`;

const C = {
  ink: '#1d1a2b', soft: '#5d5a6b', paper: '#fffcf5', cream: '#faf8f1',
  butter: '#f7e78e', pink: '#f7badd', peri: '#b9c2f4', mint: '#bdebd6',
};
const DISPLAY = "'Bricolage Grotesque', 'Arial Black', 'Helvetica Neue', Arial, sans-serif";
const UI = "Poppins, 'Helvetica Neue', Helvetica, Arial, sans-serif";

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

/* ------------------------------ unsubscribe ------------------------------ */

function unsubscribeSecret() {
  return process.env.EMAIL_UNSUBSCRIBE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
}

/** Signed, stateless token: base64url(email).hmac */
export function unsubscribeToken(email) {
  const secret = unsubscribeSecret();
  if (!secret) return null;
  const e = String(email || '').trim().toLowerCase();
  const payload = Buffer.from(e).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(`unsub:${e}`).digest('base64url').slice(0, 32);
  return `${payload}.${sig}`;
}

export function readUnsubscribeToken(token) {
  const secret = unsubscribeSecret();
  if (!secret || typeof token !== 'string' || token.length > 600) return null;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return null;
  let email = '';
  try { email = Buffer.from(payload, 'base64url').toString('utf8'); } catch { return null; }
  const expected = crypto.createHmac('sha256', secret).update(`unsub:${email}`).digest('base64url').slice(0, 32);
  const a = Buffer.from(sig); const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

export const unsubscribeUrl = (email) => {
  const t = unsubscribeToken(email);
  return t ? `${SITE}/api/email-unsubscribe?t=${encodeURIComponent(t)}` : null;
};

/* ------------------------------ building blocks ------------------------------ */

const button = (href, label) => `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
  <tr><td align="center" bgcolor="${C.ink}" style="border:2px solid ${C.ink};border-radius:99px;">
    <a href="${escapeHtml(href)}" style="display:inline-block;padding:15px 30px;font:700 16px/1 ${UI};color:${C.paper};text-decoration:none;border-radius:99px;">${escapeHtml(label)}</a>
  </td></tr>
</table>`;

const tile = (bg, big, small) => `
<tr><td style="padding:0;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr><td bgcolor="${bg}" style="border:2px solid ${C.ink};border-radius:18px;padding:18px 20px;">
      <div style="font:800 26px/1.05 ${DISPLAY};letter-spacing:-0.03em;color:${C.ink};">${big}</div>
      <div style="margin-top:6px;font:500 14px/1.45 ${UI};color:${C.ink};">${small}</div>
    </td></tr>
  </table>
</td></tr>`;

const operator = (sym) => `<tr><td align="center" style="padding:6px 0;font:800 26px/1 ${DISPLAY};color:${C.ink};">${sym}</td></tr>`;

function footer({ email, reason }) {
  const unsub = email ? unsubscribeUrl(email) : null;
  const postal = process.env.EMAIL_POSTAL_ADDRESS || '';
  return `
<tr><td style="padding:28px 8px 8px;font:500 12px/1.6 ${UI};color:${C.soft};text-align:center;">
  ${escapeHtml(reason)}<br>
  ${unsub ? `<a href="${escapeHtml(unsub)}" style="color:${C.ink};">Unsubscribe from campaign emails</a> &middot; ` : ''}<a href="${SITE}/privacy-policy" style="color:${C.ink};">Privacy</a> &middot; <a href="${SITE}/terms-of-use" style="color:${C.ink};">Terms</a><br>
  ayna health${postal ? ` &middot; ${escapeHtml(postal)}` : ''}
</td></tr>`;
}

function shell({ preheader, body, email, reason }) {
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only"><meta name="supported-color-schemes" content="light">
<title>ayna</title>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,800&family=Poppins:wght@400;500;700&display=swap" rel="stylesheet">
<style>
  @media (max-width:520px){ .ay-pad{padding:24px 18px !important;} .ay-h1{font-size:36px !important;} }
  a{color:${C.ink};}
</style>
</head>
<body style="margin:0;padding:0;background:${C.cream};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.cream}">
<tr><td align="center" style="padding:24px 12px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
    <tr><td style="padding:0 4px 14px;font:800 30px/1 ${DISPLAY};letter-spacing:-0.05em;color:${C.ink};">ayna</td></tr>
    <tr><td class="ay-pad" bgcolor="${C.paper}" style="border:2px solid ${C.ink};border-radius:24px;padding:36px 32px;">
      ${body}
    </td></tr>
    ${footer({ email, reason })}
  </table>
</td></tr>
</table>
</body></html>`;
}

const h1 = (text) => `<h1 class="ay-h1" style="margin:0;font:800 42px/1.02 ${DISPLAY};letter-spacing:-0.045em;color:${C.ink};">${text}</h1>`;
const p = (text, extra = '') => `<p style="margin:14px 0 0;font:400 16px/1.55 ${UI};color:${C.ink};${extra}">${text}</p>`;

/* ------------------------------ the announcement ------------------------------ */

export function announcementEmail({ email, firstName } = {}) {
  const hi = firstName ? `hi ${escapeHtml(firstName)},` : 'hi,';
  const body = `
    ${h1('give us your thoughts.<br>get something on us.')}
    ${p(`${hi} we're building ayna with you, not just for you. Tell us what's working and what isn't, bring a few friends, and pick a free product from our shelf.`)}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:26px;">
      ${tile(C.butter, '3 real answers', 'Three short pieces of feedback, a couple of sentences each. "love it" won\'t count.')}
      ${operator('+')}
      ${tile(C.pink, '3 friends join', 'They sign up with your link and verify their accounts.')}
      ${operator('=')}
      ${tile(C.peri, 'a free product', 'Spin for something you\'ll actually want. Don\'t love it? Spin again.')}
    </table>
    <div style="height:28px;line-height:28px;">&nbsp;</div>
    ${button(`${CAMPAIGN_URL}?utm_source=email&utm_campaign=free-product-2026`, 'start earning your free product')}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:30px;border-top:2px solid ${C.ink};">
      <tr><td style="padding-top:20px;">
        <div style="font:800 20px/1.1 ${DISPLAY};letter-spacing:-0.03em;color:${C.ink};">how it works</div>
        <ol style="margin:12px 0 0;padding:0 0 0 20px;font:400 15px/1.6 ${UI};color:${C.ink};">
          <li>Verify your own ayna account (email or phone).</li>
          <li>Answer three quick questions on the campaign page.</li>
          <li>Share your link. A friend counts once they've made a new account and verified it.</li>
          <li>Spin as many times as you like. Once you claim a product, that's your pick.</li>
        </ol>
        ${p('Products and quantities are limited, so what\'s on the shelf can change while you\'re still earning. One free product per person.', `font-size:13px;color:${C.soft};`)}
      </td></tr>
    </table>`;
  return {
    subject: 'give us your thoughts. get something on us.',
    html: shell({ preheader: '3 real answers + 3 friends who join = a free product.', body, email, reason: "You're getting this because you have an ayna account." }),
    text: [
      'give us your thoughts. get something on us.',
      '',
      '3 real answers + 3 friends who join ayna = a free product.',
      '',
      'How it works:',
      '1. Verify your own ayna account.',
      '2. Answer three quick questions (a couple of sentences each).',
      '3. Share your link. A friend counts once they have made a new account and verified it.',
      '4. Spin as many times as you like. Once you claim a product, that is your pick.',
      '',
      'Products are limited and can run out. One free product per person.',
      '',
      `start earning your free product: ${CAMPAIGN_URL}`,
      '',
      email && unsubscribeUrl(email) ? `Unsubscribe: ${unsubscribeUrl(email)}` : '',
      process.env.EMAIL_POSTAL_ADDRESS ? `ayna health, ${process.env.EMAIL_POSTAL_ADDRESS}` : 'ayna health',
    ].join('\n'),
  };
}

/* ------------------------------ transactional ------------------------------ */

export function unlockedEmail({ email }) {
  const body = `
    ${h1('your free product is unlocked.')}
    ${p("Your three answers are in and three friends joined. That's everything. Come spin for something you'll actually want.")}
    ${p("Not for you? Spin again, as many times as you like. Once you claim one, it's yours and that's final.", `font-size:14px;color:${C.soft};`)}
    <div style="height:26px;line-height:26px;">&nbsp;</div>
    ${button(CAMPAIGN_URL, 'unlock my free product')}
    ${p('Products are limited, so what you see depends on what\'s left.', `font-size:13px;color:${C.soft};text-align:center;`)}`;
  return {
    subject: 'your free product is unlocked',
    html: shell({ preheader: "That's everything. Come pick something.", body, email, reason: "You're getting this because you joined ayna's free product campaign." }),
    text: `your free product is unlocked.\n\nYour three answers are in and three friends joined. Come spin for something you'll actually want:\n${CAMPAIGN_URL}\n\nProducts are limited.\n${email && unsubscribeUrl(email) ? `\nUnsubscribe: ${unsubscribeUrl(email)}` : ''}`,
  };
}

export function claimedEmail({ email, productName, productBrand }) {
  const name = escapeHtml(productName);
  const brand = productBrand ? escapeHtml(productBrand) : '';
  const body = `
    ${h1("it's yours.")}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:22px;">
      <tr><td bgcolor="${C.butter}" style="border:2px solid ${C.ink};border-radius:18px;padding:18px 20px;">
        ${brand ? `<div style="font:700 13px/1 ${UI};color:${C.ink};">${brand}</div>` : ''}
        <div style="margin-top:6px;font:800 24px/1.1 ${DISPLAY};letter-spacing:-0.03em;color:${C.ink};">${name}</div>
      </td></tr>
    </table>
    ${p("Thanks for helping us make ayna better. If you haven't added where to send it yet, do that on the campaign page. You can check its status there anytime.")}
    <div style="height:24px;line-height:24px;">&nbsp;</div>
    ${button(CAMPAIGN_URL, 'see my free product')}`;
  return {
    subject: `it's yours: ${String(productName || 'your free product').slice(0, 80)}`,
    html: shell({ preheader: `You claimed ${productName}.`, body, email, reason: 'You claimed a free product on ayna. This is your confirmation.' }),
    text: `it's yours.\n\n${productBrand ? `${productBrand} ` : ''}${productName}\n\nIf you haven't added where to send it yet, do that here, and check its status anytime:\n${CAMPAIGN_URL}`,
  };
}

/* ------------------------------ sending ------------------------------ */

export function campaignFrom() {
  return process.env.CAMPAIGN_FROM_EMAIL || process.env.CONTACT_FROM_EMAIL || 'ayna <hello@aynahealth.co>';
}

/**
 * Sends one email through Resend. Returns { ok, skipped?, error? }.
 * Never throws: email is a nice-to-have, never something a claim depends on.
 */
export async function sendEmail({ to, subject, html, text, unsubscribe, idempotencyKey }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, skipped: 'no_resend_key' };
  try {
    const headers = { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
    if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;
    const body = { from: campaignFrom(), to: [to], subject, html, text };
    if (unsubscribe) {
      body.headers = { 'List-Unsubscribe': `<${unsubscribe}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' };
    }
    const r = await fetch('https://api.resend.com/emails', { method: 'POST', headers, body: JSON.stringify(body) });
    if (!r.ok) return { ok: false, error: `resend_${r.status}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e?.message || 'send_failed' };
  }
}
