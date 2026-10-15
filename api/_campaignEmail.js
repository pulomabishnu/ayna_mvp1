/* global process */
/**
 * Free product campaign emails: one renderer for the announcement and every
 * transactional message, so they all look the same.
 *
 * Look: the website's sticker language translated to what email clients can
 * draw. White canvas, ink (#1d1a2b) 2px outlines, the offset shadow drawn as a
 * thicker right/bottom border, butter / periwinkle / pink fills, Bricolage
 * Grotesque headlines falling back to Arial. Tables + inline styles only.
 *
 * Sending goes through Resend (already used by api/contact.js). Nothing is
 * sent unless RESEND_API_KEY is set.
 */

export const SITE_URL = (process.env.SITE_URL || 'https://www.aynahealth.co').replace(/\/+$/, '');

const INK = '#1d1a2b';
const SOFT = '#5d5a6a';
const BUTTER = '#f7e78e';
const PERI = '#b9c2f4';
const PINK = '#f7badd';
const LINE = '#e4e1ea';
const DISPLAY = "'Bricolage Grotesque', 'Poppins', Arial, Helvetica, sans-serif";
const UI = "'Poppins', Arial, Helvetica, sans-serif";

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function campaignUrl(path = '/free-product', source = 'email') {
  const sep = path.includes('?') ? '&' : '?';
  return `${SITE_URL}${path}${sep}utm_source=${encodeURIComponent(source)}&utm_campaign=free-product-2026`;
}

const p = (html, extra = '') =>
  `<p style="margin:0 0 16px;font:500 16px/26px ${UI};color:${INK};${extra}">${html}</p>`;

function button(label, href) {
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 8px">
    <tr><td style="border-radius:99px;background:${INK};border:2px solid ${INK}">
      <a href="${escapeHtml(href)}" style="display:inline-block;padding:15px 28px;font:600 17px/22px ${UI};color:#ffffff;text-decoration:none;border-radius:99px">${escapeHtml(label)}&nbsp;&nbsp;&rarr;</a>
    </td></tr>
  </table>`;
}

/** "3 answers + 3 friends = 1 free product", stacked on phones. */
function equation() {
  const tile = (n, line1, line2, fill) => `
    <td class="eq-tile" width="30%" valign="top" style="padding:0">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td style="background:${fill};border:2px solid ${INK};border-right-width:5px;border-bottom-width:5px;border-radius:16px;padding:16px 14px">
          <div style="font:800 40px/40px ${DISPLAY};color:${INK};letter-spacing:-1px">${n}</div>
          <div style="margin-top:8px;font:700 15px/20px ${UI};color:${INK}">${line1}</div>
          <div style="margin-top:2px;font:500 13px/18px ${UI};color:${INK}">${line2}</div>
        </td></tr>
      </table>
    </td>`;
  const op = (s) => `<td class="eq-op" width="5%" align="center" valign="middle" style="font:800 28px/28px ${DISPLAY};color:${INK};padding:0 4px">${s}</td>`;
  return `
  <table role="presentation" class="eq" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px">
    <tr>
      ${tile('3', 'thoughtful answers', 'a few real sentences each', BUTTER)}
      ${op('+')}
      ${tile('3', 'friends who join', 'and verify their account', PERI)}
      ${op('=')}
      ${tile('1', 'free product', 'you pick it', PINK)}
    </tr>
  </table>`;
}

function steps(items) {
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 8px">
    ${items.map(([title, body], i) => `
    <tr>
      <td width="40" valign="top" style="padding:0 12px 16px 0">
        <div style="width:28px;height:28px;border:2px solid ${INK};border-radius:99px;text-align:center;font:700 14px/28px ${UI};color:${INK}">${i + 1}</div>
      </td>
      <td valign="top" style="padding:0 0 16px">
        <div style="font:700 16px/22px ${UI};color:${INK}">${title}</div>
        <div style="margin-top:2px;font:500 15px/22px ${UI};color:${SOFT}">${body}</div>
      </td>
    </tr>`).join('')}
  </table>`;
}

function productCard(product) {
  if (!product) return '';
  const img = product.image && /^https:\/\//.test(product.image)
    ? `<img src="${escapeHtml(product.image)}" width="120" height="120" alt="${escapeHtml(product.name)}" style="display:block;width:120px;height:120px;object-fit:contain;border:0">`
    : '';
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px">
    <tr><td style="border:2px solid ${INK};border-right-width:5px;border-bottom-width:5px;border-radius:20px;padding:16px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
        ${img ? `<td width="136" valign="middle" style="padding-right:16px"><div style="background:#ffffff;border:1px solid ${LINE};border-radius:12px;padding:8px">${img}</div></td>` : ''}
        <td valign="middle">
          ${product.brand ? `<div style="font:700 11px/16px ${UI};letter-spacing:1.4px;text-transform:uppercase;color:${SOFT}">${escapeHtml(product.brand)}</div>` : ''}
          <div style="margin-top:4px;font:800 22px/26px ${DISPLAY};color:${INK};letter-spacing:-.5px">${escapeHtml(product.name)}</div>
        </td>
      </tr></table>
    </td></tr>
  </table>`;
}

function footer({ reason, unsubscribeUrl }) {
  const address = process.env.CAMPAIGN_POSTAL_ADDRESS || '{{COMPANY_POSTAL_ADDRESS}}';
  return `
  <tr><td style="padding:24px 32px 32px;border-top:2px solid ${INK}" class="px">
    <div style="font:800 20px/24px ${DISPLAY};color:${INK};letter-spacing:-.5px">ayna</div>
    <div style="margin-top:8px;font:500 13px/20px ${UI};color:${SOFT}">${reason}</div>
    <div style="margin-top:8px;font:500 13px/20px ${UI};color:${SOFT}">
      <a href="${SITE_URL}/privacy-policy" style="color:${INK};text-decoration:underline">Privacy</a>
      &nbsp;&middot;&nbsp; <a href="${SITE_URL}/terms-of-use" style="color:${INK};text-decoration:underline">Terms</a>
      &nbsp;&middot;&nbsp; <a href="${SITE_URL}/contact" style="color:${INK};text-decoration:underline">Contact us</a>
      ${unsubscribeUrl ? `&nbsp;&middot;&nbsp; <a href="${unsubscribeUrl}" style="color:${INK};text-decoration:underline">Unsubscribe</a>` : ''}
    </div>
    <div style="margin-top:8px;font:500 12px/18px ${UI};color:${SOFT}">${escapeHtml(address)}</div>
  </td></tr>`;
}

/**
 * Full HTML document. `body` is trusted HTML built by the templates below;
 * every dynamic value inside it is escaped where it is inserted.
 */
export function renderLayout({ title, preheader, body, reason, unsubscribeUrl = null }) {
  return `<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light">
<title>${escapeHtml(title)}</title>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@800&family=Poppins:wght@500;600;700&display=swap" rel="stylesheet">
<style>
  body { margin:0; padding:0; background:#ffffff; -webkit-text-size-adjust:100%; }
  a { color:${INK}; }
  @media (max-width: 600px) {
    .px { padding-left:20px !important; padding-right:20px !important; }
    .h1 { font-size:36px !important; line-height:40px !important; }
    .eq-tile { display:block !important; width:100% !important; }
    .eq-op { display:block !important; width:100% !important; padding:8px 0 !important; text-align:center !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:#ffffff">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${escapeHtml(preheader)}&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff">
  <tr><td align="center" style="padding:24px 12px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;border:2px solid ${INK};border-radius:24px;background:#ffffff">
      <tr><td class="px" style="padding:28px 32px 8px">
        <a href="${SITE_URL}" style="text-decoration:none;font:800 26px/30px ${DISPLAY};color:${INK};letter-spacing:-1px">ayna</a>
      </td></tr>
      <tr><td class="px" style="padding:16px 32px 16px">
        ${body}
      </td></tr>
      ${footer({ reason, unsubscribeUrl })}
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

const h1 = (html) => `<h1 class="h1" style="margin:0 0 16px;font:800 44px/48px ${DISPLAY};color:${INK};letter-spacing:-1.5px">${html}</h1>`;
const sticker = (text, fill = BUTTER) =>
  `<span style="display:inline-block;padding:0 10px 2px;background:${fill};border:2px solid ${INK};border-radius:12px">${text}</span>`;

const ACCOUNT_REASON = 'You are getting this because you have an ayna account and this is about your free product.';

/* --------------------------------- Templates -------------------------------- */

/** The campaign announcement. Sent as a broadcast; {{{RESEND_UNSUBSCRIBE_URL}}} is filled in by Resend Broadcasts. */
export function announcementEmail({ unsubscribeUrl = '{{{RESEND_UNSUBSCRIBE_URL}}}' } = {}) {
  const url = campaignUrl('/free-product', 'campaign_email');
  const body = `
    ${h1(`Give us your thoughts.<br>Get something ${sticker('on us.')}`)}
    ${p('Tell us what you really think of ayna, bring three friends, and pick a free product. That is the whole thing:', `color:${SOFT}`)}
    ${equation()}
    ${button('Start earning your free product', url)}
    <div style="height:24px"></div>
    <div style="font:800 22px/28px ${DISPLAY};color:${INK};letter-spacing:-.5px;margin:0 0 16px">How it works</div>
    ${steps([
      ['Verify your account', 'Most accounts already are. If yours is not, the page shows you how.'],
      ['Answer three short questions', 'What you like, what bugs you, what you would change. A couple of real sentences each, 120 characters or more.'],
      ['Share your link', 'A friend counts once they make a new ayna account and verify it. Clicks and invites alone do not count.'],
      ['Spin and pick', 'Spin as many times as you like. Once you claim a product, that is your pick and it is final.'],
    ])}
    ${p('There are a limited number of each product, and they go to whoever claims them first. One free product per person.', `font-size:14px;line-height:22px;color:${SOFT};margin-top:8px`)}
  `;
  return {
    subject: 'Give us your thoughts. Get something on us.',
    preheader: '3 thoughtful answers + 3 friends who join ayna = a free product you pick.',
    html: renderLayout({
      title: 'Give us your thoughts. Get something on us.',
      preheader: '3 thoughtful answers + 3 friends who join ayna = a free product you pick.',
      body,
      reason: 'You are getting this because you have an ayna account.',
      unsubscribeUrl,
    }),
    text: [
      'Give us your thoughts. Get something on us.',
      '',
      '3 thoughtful answers + 3 friends who join ayna = 1 free product, you pick it.',
      '',
      `Start here: ${url}`,
      '',
      'How it works',
      '1. Verify your account. Most accounts already are.',
      '2. Answer three short questions, a couple of real sentences each (120+ characters).',
      '3. Share your link. A friend counts once they make a new ayna account and verify it.',
      '4. Spin and pick. Spin as many times as you like. Claiming a product is final.',
      '',
      'Products are limited and go to whoever claims first. One free product per person.',
      '',
      `Unsubscribe: ${unsubscribeUrl}`,
    ].join('\n'),
  };
}

export function unlockedEmail() {
  const url = campaignUrl('/free-product/reward', 'unlocked_email');
  const body = `
    ${h1(`Your free product is ${sticker('unlocked.', PERI)}`)}
    ${p('Your answers are in and three friends are verified. Thank you, really. Come spin for something you will actually want.')}
    ${button('Pick my free product', url)}
    ${p('Products are limited and go to whoever claims them first, so we would not wait too long.', `font-size:14px;line-height:22px;color:${SOFT};margin-top:16px`)}
  `;
  return {
    subject: 'Your free product is unlocked',
    html: renderLayout({ title: 'Your free product is unlocked', preheader: 'Come spin for something you will actually want.', body, reason: ACCOUNT_REASON }),
    text: `Your free product is unlocked.\n\nYour answers are in and three friends are verified. Come spin for something you will actually want:\n${url}\n\nProducts are limited and go to whoever claims them first.`,
  };
}

export function claimedEmail({ product }) {
  const url = campaignUrl('/free-product/reward', 'claimed_email');
  const name = escapeHtml(product?.name || 'your free product');
  const body = `
    ${h1(`It's ${sticker('yours.', PINK)}`)}
    ${productCard(product)}
    ${p(`One more step: add the address you want ${name} shipped to. Our team packs and sends these ourselves.`)}
    ${button('Add my address', url)}
    ${p('You can check on it anytime from your free product page.', `font-size:14px;line-height:22px;color:${SOFT};margin-top:16px`)}
  `;
  return {
    subject: `It's yours: ${product?.name || 'your free product'}`,
    html: renderLayout({ title: "It's yours", preheader: 'Add your address so we can send it.', body, reason: ACCOUNT_REASON }),
    text: `It's yours: ${product?.name || 'your free product'}${product?.brand ? ` by ${product.brand}` : ''}.\n\nOne more step: add the address you want it shipped to. Our team packs and sends these ourselves.\n${url}`,
  };
}

export function shippedEmail({ product }) {
  const url = campaignUrl('/free-product/reward', 'shipped_email');
  const body = `
    ${h1(`It's on ${sticker('the way.', BUTTER)}`)}
    ${productCard(product)}
    ${p('Your free product has shipped. Thanks again for helping us make ayna better.')}
    ${button('See my free product', url)}
  `;
  return {
    subject: 'Your free product is on the way',
    html: renderLayout({ title: 'Your free product is on the way', preheader: 'It has shipped.', body, reason: ACCOUNT_REASON }),
    text: `Your free product${product?.name ? ` (${product.name})` : ''} has shipped. Thanks again for helping us make ayna better.\n${url}`,
  };
}

/* ---------------------------------- Sending --------------------------------- */

export function emailsEnabled() {
  return process.env.CAMPAIGN_EMAILS_ENABLED === '1' && Boolean(process.env.RESEND_API_KEY);
}

/**
 * @returns {Promise<{ ok: boolean, skipped?: boolean, error?: string }>}
 */
export async function sendCampaignEmail(to, message, { fetchImpl = fetch } = {}) {
  if (!emailsEnabled()) return { ok: false, skipped: true };
  if (!to) return { ok: false, error: 'no_recipient' };
  try {
    const res = await fetchImpl('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.CAMPAIGN_FROM_EMAIL || process.env.CONTACT_FROM_EMAIL || 'ayna <puloma@aynahealth.co>',
        to: [to],
        subject: message.subject,
        html: message.html,
        text: message.text,
      }),
      signal: AbortSignal.timeout ? AbortSignal.timeout(8000) : undefined,
    });
    if (!res.ok) return { ok: false, error: `resend_${res.status}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e?.name === 'TimeoutError' ? 'timeout' : 'network' };
  }
}
