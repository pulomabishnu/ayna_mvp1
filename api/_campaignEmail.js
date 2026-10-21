/* global process */
/**
 * Free product campaign emails: one renderer for the announcement and every
 * transactional message, so they all look the same.
 *
 * Look: ayna theme v3 translated to what email clients can draw. Butter page,
 * espresso (#3e2723) 2px outlines, the hard shadow drawn as a thicker
 * right/bottom border, sky and rose fills, white product tiles, DM Serif
 * Display headlines (Georgia fallback), DM Sans body. Tables + inline styles.
 *
 * Sending goes through Resend (already used by api/contact.js). Nothing is
 * sent unless RESEND_API_KEY is set.
 */

export const SITE_URL = (process.env.SITE_URL || 'https://www.aynahealth.co').replace(/\/+$/, '');

// Theme v3 (src/styles/theme-v3.css): butter page, espresso ink, sky + rose.
const INK = '#3e2723';
const SOFT = '#6b524d';
const PAGE = '#ffedac';
const SKY = '#769ebe';
const ROSE = '#f7badd';
const LINE = '#e8d58f';
const DISPLAY = "'DM Serif Display', Georgia, 'Times New Roman', serif";
const UI = "'DM Sans', Arial, Helvetica, sans-serif";
const LOGO = "'Bricolage Grotesque', 'DM Sans', Arial, sans-serif";

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
  `<p style="margin:0 0 18px;font:400 17px/27px ${UI};color:${INK};${extra}">${html}</p>`;

function button(label, href) {
  return `
  <table role="presentation" class="btn" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 8px">
    <tr><td style="border-radius:99px;background:${INK};border:2px solid ${INK}">
      <a href="${escapeHtml(href)}" style="display:inline-block;padding:15px 28px;font:600 17px/22px ${UI};color:${PAGE};text-decoration:none;border-radius:99px">${escapeHtml(label)}&nbsp;&nbsp;&rarr;</a>
    </td></tr>
  </table>`;
}

/** "3 answers + 3 friends = 1 free product", stacked on phones. */
function equation() {
  // Equal-height tiles: big number beside a two-line label, so it reads in one glance.
  const tile = (n, label, sub, fill) => `
    <td class="eq-tile" width="30%" valign="top" style="padding:0">
      <table role="presentation" width="100%" height="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td height="96" valign="middle" style="height:96px;background:${fill};border:2px solid ${INK};border-right-width:5px;border-bottom-width:5px;border-radius:16px;padding:12px 14px">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
            <td valign="middle" style="padding-right:10px;font:400 44px/44px ${DISPLAY};color:${INK}">${n}</td>
            <td valign="middle" style="font:700 15px/19px ${UI};color:${INK}">${label}<br><span style="font-weight:400;font-size:14px">${sub}</span></td>
          </tr></table>
        </td></tr>
      </table>
    </td>`;
  const op = (sym) => `<td class="eq-op" width="5%" align="center" valign="middle" style="font:400 30px/30px ${DISPLAY};color:${INK};padding:0 4px">${sym}</td>`;
  return `
  <table role="presentation" class="eq" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 28px">
    <tr>
      ${tile('3', 'answers', 'real ones', SKY)}
      ${op('+')}
      ${tile('3', 'friends', 'who join', ROSE)}
      ${op('=')}
      ${tile('1', 'free', 'product', '#ffffff')}
    </tr>
  </table>`;
}

function steps(items) {
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 8px">
    ${items.map(([title, body], i) => `
    <tr>
      <td width="46" valign="top" style="padding:0 14px 20px 0">
        <div style="width:32px;height:32px;border:2px solid ${INK};border-radius:99px;background:${ROSE};text-align:center;font:400 18px/32px ${DISPLAY};color:${INK}">${i + 1}</div>
      </td>
      <td valign="top" style="padding:3px 0 20px">
        <div style="font:700 17px/24px ${UI};color:${INK}">${title}</div>
        <div style="margin-top:2px;font:400 16px/24px ${UI};color:${SOFT}">${body}</div>
      </td>
    </tr>`).join('')}
  </table>`;
}

/** Short checklist in a white box: the rules people must not miss. */
function goodToKnow(items) {
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 28px">
    <tr><td style="background:#ffffff;border:2px solid ${INK};border-radius:16px;padding:18px 20px">
      <div style="margin:0 0 10px;font:700 16px/22px ${UI};color:${INK}">Good to know</div>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0">
        ${items.map((t) => `<tr><td width="24" valign="top" style="padding:4px 0;font:700 16px/24px ${UI};color:${INK}">&#10003;</td><td valign="top" style="padding:4px 0;font:400 16px/24px ${UI};color:${INK}">${t}</td></tr>`).join('')}
      </table>
    </td></tr>
  </table>`;
}

const sectionTitle = (t) => `<div style="margin:0 0 18px;font:400 28px/32px ${DISPLAY};color:${INK}">${t}</div>`;

function productCard(product) {
  if (!product) return '';
  const img = product.image && /^https:\/\//.test(product.image)
    ? `<img src="${escapeHtml(product.image)}" width="120" height="120" alt="${escapeHtml(product.name)}" style="display:block;width:120px;height:120px;object-fit:contain;border:0">`
    : '';
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px">
    <tr><td style="border:2px solid ${INK};border-right-width:5px;border-bottom-width:5px;border-radius:20px;padding:16px;background:${PAGE}">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
        ${img ? `<td width="136" valign="middle" style="padding-right:16px"><div style="background:#ffffff;border:2px solid ${INK};border-radius:14px;padding:8px">${img}</div></td>` : ''}
        <td valign="middle">
          ${product.brand ? `<div style="font:700 14px/18px ${UI};color:${SOFT}">${escapeHtml(product.brand)}</div>` : ''}
          <div style="margin-top:4px;font:400 26px/30px ${DISPLAY};color:${INK}">${escapeHtml(product.name)}</div>
        </td>
      </tr></table>
    </td></tr>
  </table>`;
}

function footer({ reason, unsubscribeUrl }) {
  const address = process.env.CAMPAIGN_POSTAL_ADDRESS || '{{COMPANY_POSTAL_ADDRESS}}';
  return `
  <tr><td style="padding:24px 32px 32px;border-top:2px solid ${INK}" class="px">
    <div style="font:800 22px/26px ${LOGO};color:${INK};letter-spacing:-1px">ayna</div>
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
<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@400;500;700&family=Bricolage+Grotesque:wght@800&display=swap" rel="stylesheet">
<style>
  body { margin:0; padding:0; background:${PAGE}; -webkit-text-size-adjust:100%; }
  a { color:${INK}; }
  @media (max-width: 600px) {
    .px { padding-left:20px !important; padding-right:20px !important; }
    .h1 { font-size:34px !important; line-height:38px !important; }
    .btn a { padding:14px 20px !important; font-size:16px !important; }
    .eq-tile { display:block !important; width:100% !important; }
    .eq-tile td[height] { height:auto !important; }
    .eq-op { display:block !important; width:100% !important; padding:4px 0 !important; text-align:center !important; font-size:24px !important; line-height:24px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:${PAGE}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${escapeHtml(preheader)}&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${PAGE}">
  <tr><td align="center" style="padding:24px 12px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;border:2px solid ${INK};border-right-width:6px;border-bottom-width:6px;border-radius:26px;background:${PAGE}">
      <tr><td class="px" style="padding:28px 32px 8px">
        <a href="${SITE_URL}" style="text-decoration:none;font:800 28px/32px ${LOGO};color:${INK};letter-spacing:-1px">ayna</a>
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

const h1 = (html) => `<h1 class="h1" style="margin:0 0 16px;font:400 48px/50px ${DISPLAY};color:${INK};letter-spacing:-.5px">${html}</h1>`;
// v3: an italic accent word belongs to marketing headlines only (the announcement).
const accent = (text) => `<em style="font-style:italic">${text}</em>`;

const ACCOUNT_REASON = 'You are getting this because you have an ayna account and this is about your free product.';

/* --------------------------------- Templates -------------------------------- */

/** The campaign announcement. Sent as a broadcast; {{{RESEND_UNSUBSCRIBE_URL}}} is filled in by Resend Broadcasts. */
export function announcementEmail({ unsubscribeUrl = '{{{RESEND_UNSUBSCRIBE_URL}}}' } = {}) {
  const url = campaignUrl('/free-product', 'campaign_email');
  const body = `
    ${h1(`Give us your thoughts.<br>Get something ${accent('on&nbsp;us.')}`)}
    ${p('Answer 3 questions. Bring 3 friends. Pick a free product.', `font-size:19px;line-height:28px`)}
    ${equation()}
    ${button('Start earning your free product', url)}
    <div style="height:36px"></div>
    ${sectionTitle('How it works')}
    ${steps([
      ['Verify your account', 'Most accounts already are.'],
      ['Answer 3 questions', 'A couple of real sentences each (120+ characters).'],
      ['Share your link', 'A friend counts once they sign up and verify.'],
      ['Spin and pick', 'You get 3 spins. Claim the one you want. Your claim is final.'],
    ])}
    ${goodToKnow([
      'Products are limited, first come first served.',
      'Friends need to be new to ayna.',
      'One free product per person.',
    ])}
    ${button('Start earning your free product', url)}
  `;
  return {
    subject: 'Give us your thoughts. Get something on us.',
    preheader: '3 answers + 3 friends = a free product you pick.',
    html: renderLayout({
      title: 'Give us your thoughts. Get something on us.',
      preheader: '3 answers + 3 friends = a free product you pick.',
      body,
      reason: 'You are getting this because you have an ayna account.',
      unsubscribeUrl,
    }),
    text: [
      'Give us your thoughts. Get something on us.',
      '',
      'Answer 3 questions. Bring 3 friends. Pick a free product.',
      '',
      `Start here: ${url}`,
      '',
      'How it works',
      '1. Verify your account. Most accounts already are.',
      '2. Answer 3 questions. A couple of real sentences each (120+ characters).',
      '3. Share your link. A friend counts once they sign up and verify.',
      '4. Spin and pick. You get 3 spins. Claim the one you want. Your claim is final.',
      '',
      'Good to know',
      '- Products are limited, first come first served.',
      '- Friends need to be new to ayna.',
      '- One free product per person.',
      '',
      `Unsubscribe: ${unsubscribeUrl}`,
    ].join('\n'),
  };
}

export function unlockedEmail() {
  const url = campaignUrl('/free-product/reward', 'unlocked_email');
  const body = `
    ${h1('Your free product is unlocked.')}
    ${p('Your answers are in and three friends are verified. Thank you, really. You get 3 spins to find something you will actually want.')}
    ${button('Pick my free product', url)}
    ${p('Products are limited and go to whoever claims them first, so we would not wait too long.', `font-size:14px;line-height:22px;color:${SOFT};margin-top:16px`)}
  `;
  return {
    subject: 'Your free product is unlocked',
    html: renderLayout({ title: 'Your free product is unlocked', preheader: 'You get 3 spins to find something you will actually want.', body, reason: ACCOUNT_REASON }),
    text: `Your free product is unlocked.\n\nYour answers are in and three friends are verified. Come spin for something you will actually want:\n${url}\n\nProducts are limited and go to whoever claims them first.`,
  };
}

export function claimedEmail({ product }) {
  const url = campaignUrl('/free-product/reward', 'claimed_email');
  const name = escapeHtml(product?.name || 'your free product');
  const body = `
    ${h1("It's yours.")}
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
    ${h1("It's on the way.")}
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

async function postToResend(to, message, fetchImpl) {
  try {
    const res = await fetchImpl('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.CAMPAIGN_FROM_EMAIL || process.env.CONTACT_FROM_EMAIL || 'ayna <puloma@aynahealth.co>',
        to,
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

/**
 * Email to a person in the campaign. Never sends while the footer still has
 * the postal-address placeholder (CAMPAIGN_POSTAL_ADDRESS unset): marketing
 * email needs a real address.
 * @returns {Promise<{ ok: boolean, skipped?: boolean, error?: string }>}
 */
export async function sendCampaignEmail(to, message, { fetchImpl = fetch } = {}) {
  if (!emailsEnabled()) return { ok: false, skipped: true };
  if (!to) return { ok: false, error: 'no_recipient' };
  if (String(message?.html || '').includes('{{COMPANY_POSTAL_ADDRESS}}')) return { ok: false, error: 'no_postal_address' };
  return postToResend([to], message, fetchImpl);
}

/* ------------------------------- Team alerts -------------------------------- */

/** Who hears about claims and addresses: CAMPAIGN_TEAM_EMAIL, else the ADMIN_EMAILS list. */
export function teamAlertRecipients() {
  const raw = process.env.CAMPAIGN_TEAM_EMAIL || process.env.ADMIN_EMAILS || '';
  return [...new Set(raw.split(',').map((e) => e.trim().toLowerCase()).filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e)))];
}

/** Internal mail, so it does not wait for CAMPAIGN_EMAILS_ENABLED; it only needs Resend and a recipient. */
export function teamAlertsEnabled() {
  return Boolean(process.env.RESEND_API_KEY) && teamAlertRecipients().length > 0;
}

const plainRow = (label, value) => (value ? `${label}: ${value}` : '');
const htmlRows = (rows) => rows.filter(([, v]) => v).map(([k, v]) =>
  `<tr><td style="padding:4px 16px 4px 0;color:${SOFT};font:400 14px/20px ${UI};vertical-align:top">${escapeHtml(k)}</td><td style="padding:4px 0;color:${INK};font:600 14px/20px ${UI}">${escapeHtml(v)}</td></tr>`).join('');
function teamMessage({ subject, intro, rows }) {
  const adminUrl = `${SITE_URL}/admin/campaign`;
  return {
    subject,
    html: `<div style="background:${PAGE};padding:24px"><div style="max-width:560px;margin:0 auto;background:#fff;border:2px solid ${INK};border-radius:16px;padding:24px">
      <p style="margin:0 0 16px;color:${INK};font:400 16px/24px ${UI}">${escapeHtml(intro)}</p>
      <table role="presentation" cellpadding="0" cellspacing="0">${htmlRows(rows)}</table>
      <p style="margin:20px 0 0"><a href="${adminUrl}" style="color:${INK};font:600 15px/22px ${UI}">Open the campaign admin page</a></p>
    </div></div>`,
    text: `${intro}\n\n${rows.map(([k, v]) => plainRow(k, v)).filter(Boolean).join('\n')}\n\n${adminUrl}`,
  };
}
const productLine = (product) => [product?.brand, product?.name, product?.size].filter(Boolean).join(' · ');

/** Someone claimed a product. They still need to add an address. */
export function teamClaimAlert({ accountEmail, product, claimedAt }) {
  const what = productLine(product) || 'a product';
  return teamMessage({
    subject: `Free product claimed: ${what}`,
    intro: 'Someone just claimed a free product. They still need to add their shipping address; you will get another email when they do.',
    rows: [['Product', what], ['Account', accountEmail], ['Claimed', claimedAt ? new Date(claimedAt).toUTCString() : '']],
  });
}

/** Someone added (or changed) their shipping address. Everything needed to ship it. */
export function teamShippingAlert({ accountEmail, product, address = {}, updated = false }) {
  const what = productLine(product) || 'their free product';
  return teamMessage({
    subject: `${updated ? 'Address changed' : 'Ready to ship'}: ${what} to ${address.fullName || 'a winner'}`,
    intro: updated
      ? 'A winner changed their shipping address. Use this one.'
      : 'A winner added their shipping address. It is ready to pack and ship. Mark it shipped on the admin page when it goes out.',
    rows: [
      ['Product', what],
      ['Name', address.fullName],
      ['Address', address.addressLine1],
      ['Apt / suite', address.addressLine2],
      ['City', address.city],
      ['State', address.state],
      ['ZIP', address.postalCode],
      ['Contact email', address.email],
      ['Account', accountEmail],
    ],
  });
}

/** Vinted check: prizes that sold on Vinted (or came back) and were updated in the pool. */
export function teamVintedAlert({ changes = [], available = 0 }) {
  const label = { available: 'available again', reserved: 'reserved on Vinted', sold: 'sold or removed on Vinted' };
  const rows = changes.map((c) => [c.product || `Listing ${c.listingId}`, `${label[c.to] || c.to}${c.wonInCampaign ? ' (already won in the campaign, still ship it)' : ''} · vinted.com/items/${c.listingId}`]);
  rows.push(['Vinted prize units still winnable', String(available)]);
  const gone = changes.filter((c) => c.to !== 'available').length;
  return teamMessage({
    subject: gone ? `Vinted: ${gone} prize${gone === 1 ? '' : 's'} taken out of the free product pool` : 'Vinted: prizes back in the free product pool',
    intro: gone
      ? 'These Vinted listings are no longer for sale, so they can no longer be won.'
      : 'These Vinted listings are for sale again, so they are back in the pool.',
    rows,
  });
}

/** Best effort: never throws, never blocks the person's request. */
export async function sendTeamAlert(message, { fetchImpl = fetch } = {}) {
  if (!teamAlertsEnabled()) return { ok: false, skipped: true };
  return postToResend(teamAlertRecipients(), message, fetchImpl);
}
