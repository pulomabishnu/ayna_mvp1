/* global process, Buffer */
/**
 * Notification emails: templates, unsubscribe tokens and the Resend call.
 * Used by api/send-emails.js (cron) and api/email-unsubscribe.js.
 *
 * Rules (see the "ayna notification emails" doc):
 *   - no health details in subjects or preview text
 *   - every email carries a one-click unsubscribe link (+ List-Unsubscribe headers)
 *   - brand look: butter #ffedac, espresso #3e2723, rose #f7badd, DM Serif Display / DM Sans
 */
import crypto from 'node:crypto';

export const SITE = 'https://www.aynahealth.co';
export const FROM = () => process.env.NOTIFY_FROM_EMAIL || 'ayna <notifications@aynahealth.co>';
// Replies reach all three founders.
export const REPLY_TO = () => (process.env.NOTIFY_REPLY_TO ? process.env.NOTIFY_REPLY_TO.split(',').map((x) => x.trim()) : ['puloma@aynahealth.co', 'ameera@aynahealth.co', 'eliz@aynahealth.co']);
// Mailing address in every footer (US CAN-SPAM). Override with MAIL_POSTAL_ADDRESS in Vercel.
const ADDRESS = () => process.env.MAIL_POSTAL_ADDRESS || 'ayna, 312 West 119th St, New York, NY 10026';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ---------- unsubscribe tokens (HMAC, keyed by a server-only secret) ---------- */

function unsubKey() {
  const k = process.env.EMAIL_UNSUB_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  return k ? `ayna-unsub:${k}` : '';
}

export function unsubToken(userId, group) {
  const key = unsubKey();
  if (!key || !userId) return '';
  return crypto.createHmac('sha256', key).update(`${userId}:${group}`).digest('base64url').slice(0, 32);
}

export function verifyUnsubToken(userId, group, token) {
  const want = unsubToken(userId, group);
  if (!want || typeof token !== 'string' || token.length !== want.length) return false;
  return crypto.timingSafeEqual(Buffer.from(want), Buffer.from(token));
}

export function unsubUrl(userId, group) {
  const q = new URLSearchParams({ u: userId, g: group, t: unsubToken(userId, group) });
  return `${SITE}/api/email-unsubscribe?${q}`;
}

/* ---------- light formatting (announcement bodies: **bold**, __underline__, *italic*, lists) ---------- */

function inline(t) {
  return esc(t)
    .replace(/\*\*([^*\n]+?)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_\n]+?)__/g, '<u>$1</u>')
    .replace(/\*([^*\n]+?)\*/g, '<em>$1</em>');
}

export function richToHtml(text) {
  const lines = String(text || '').replace(/\r\n?/g, '\n').split('\n');
  const out = [];
  let list = null;
  const close = () => { if (list) { out.push(`</${list}>`); list = null; } };
  for (const line of lines) {
    const b = line.match(/^\s*[-•]\s+(.*)$/);
    const n = line.match(/^\s*\d+[.)]\s+(.*)$/);
    if (b || n) {
      const kind = b ? 'ul' : 'ol';
      if (list !== kind) { close(); out.push(`<${kind} style="margin:0 0 14px;padding-left:22px">`); list = kind; }
      out.push(`<li style="margin:4px 0">${inline((b || n)[1])}</li>`);
    } else {
      close();
      if (line.trim()) out.push(`<p style="margin:0 0 14px">${inline(line)}</p>`);
    }
  }
  close();
  return out.join('');
}

export const richToText = (text) => String(text || '').replace(/\*\*([^*\n]+?)\*\*/g, '$1').replace(/__([^_\n]+?)__/g, '$1').replace(/\*([^*\n]+?)\*/g, '$1');

/* ---------- layout ---------- */

function layout({ preheader, title, bodyHtml, cta, userId, group, groupLabel }) {
  const unsub = unsubUrl(userId, group);
  const unsubAll = unsubUrl(userId, 'all');
  const address = `<br>${esc(ADDRESS())}`;
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta name="color-scheme" content="light only"></head>
<body style="margin:0;padding:0;background:#ffedac">
<span style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffedac"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
<tr><td style="padding:0 0 18px;font:700 26px/1 'Bricolage Grotesque','DM Sans',Arial,sans-serif;color:#3e2723;letter-spacing:-.02em">ayna</td></tr>
<tr><td style="background:#ffffff;border:2px solid #3e2723;border-radius:22px;padding:30px 28px;box-shadow:6px 6px 0 #3e2723">
<h1 style="margin:0 0 16px;font:400 30px/1.15 'DM Serif Display',Georgia,serif;color:#3e2723">${esc(title)}</h1>
<div style="font:400 16px/1.55 'DM Sans',Arial,sans-serif;color:#3e2723">${bodyHtml}</div>
${cta ? `<p style="margin:22px 0 0"><a href="${esc(cta.href)}" style="display:inline-block;padding:13px 24px;border-radius:999px;background:#3e2723;color:#ffedac;font:700 15px/1 'DM Sans',Arial,sans-serif;text-decoration:none">${esc(cta.label)}</a></p>` : ''}
</td></tr>
<tr><td style="padding:22px 6px 0;font:400 12px/1.6 'DM Sans',Arial,sans-serif;color:#3e2723">
You're getting this because ${esc(groupLabel)} emails are on in your ayna settings.<br>
<a href="${esc(unsub)}" style="color:#3e2723">Unsubscribe from these</a> · <a href="${esc(unsubAll)}" style="color:#3e2723">Unsubscribe from all</a> · <a href="${SITE}/you#wyou-email" style="color:#3e2723">Email settings</a>${address}
</td></tr></table></td></tr></table></body></html>`;
}

function footerText(userId, group) {
  const address = `\n${ADDRESS()}`;
  return `\n\n--\nUnsubscribe from these: ${unsubUrl(userId, group)}\nUnsubscribe from all: ${unsubUrl(userId, 'all')}\nEmail settings: ${SITE}/you#wyou-email${address}`;
}

function headers(userId, group) {
  return {
    'List-Unsubscribe': `<${unsubUrl(userId, group)}>`,
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
  };
}

/* ---------- emails ---------- */

const VERBS = {
  follow: 'followed you', followed: 'followed you',
  friend_request: 'sent you a friend request', friend_accepted: 'accepted your friend request',
  comment: 'commented on your post', reply: 'replied to you',
  reaction: 'found your post helpful', helpful: 'found your post helpful', like: 'liked your post',
  recommendation: 'recommended a product to you', recommend: 'recommended a product to you',
  mention: 'mentioned you', playlist_save: 'saved your playlist',
};

export function describeNotification(n, names) {
  const who = names.get(n.actor_id) || 'Someone';
  const verb = VERBS[String(n.type || '').toLowerCase()];
  return verb ? `${who} ${verb}` : `${who}: ${String(n.type || 'update').replace(/_/g, ' ')}`;
}

/** Community roundup (weekly) or a single update (instant). */
export function communityEmail({ to, userId, notes, names, weekly }) {
  const lines = notes.map((n) => describeNotification(n, names));
  const shown = lines.slice(0, 12);
  const more = lines.length - shown.length;
  const title = weekly ? 'Your week on ayna' : lines.length === 1 ? 'New on ayna' : `${lines.length} new updates`;
  const subject = weekly ? `Your week in the ayna Community` : lines.length === 1 ? lines[0] : `${lines.length} new updates in the ayna Community`;
  const list = `<ul style="margin:0;padding-left:20px">${shown.map((l) => `<li style="margin:6px 0">${esc(l)}</li>`).join('')}</ul>${more > 0 ? `<p style="margin:12px 0 0">and ${more} more.</p>` : ''}`;
  return {
    to: [to], from: FROM(), reply_to: REPLY_TO(), subject,
    html: layout({ preheader: lines[0] || 'New activity in the ayna Community', title, bodyHtml: list, cta: { label: 'Open Community', href: `${SITE}/community` }, userId, group: 'community', groupLabel: 'Community activity' }),
    text: `${title}\n\n${shown.map((l) => `- ${l}`).join('\n')}${more > 0 ? `\nand ${more} more.` : ''}\n\nOpen Community: ${SITE}/community${footerText(userId, 'community')}`,
    headers: headers(userId, 'community'),
  };
}

export function announcementEmail({ to, userId, ann }) {
  const title = String(ann.title || 'News from ayna').slice(0, 120);
  return {
    to: [to], from: FROM(), reply_to: REPLY_TO(), subject: title,
    html: layout({ preheader: richToText(ann.body || '').slice(0, 120) || title, title, bodyHtml: richToHtml(ann.body || ''), cta: { label: 'Read it in Community', href: `${SITE}/community?tab=announcements` }, userId, group: 'announcements', groupLabel: 'ayna announcements' }),
    text: `${title}\n\n${richToText(ann.body || '')}\n\nRead it in Community: ${SITE}/community${footerText(userId, 'announcements')}`,
    headers: headers(userId, 'announcements'),
  };
}

/* ---------- sending ---------- */

/** Sends up to 100 emails per Resend batch call. Returns { sent, failed }. */
export async function sendBatch(emails, fetchImpl = fetch) {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY is not configured');
  let sent = 0; let failed = 0;
  for (let i = 0; i < emails.length; i += 100) {
    const chunk = emails.slice(i, i + 100);
    const r = await fetchImpl('https://api.resend.com/emails/batch', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(chunk),
    });
    if (r.ok) sent += chunk.length;
    else {
      failed += chunk.length;
      const body = await r.text().catch(() => '');
      console.error('[send-emails] Resend batch failed:', r.status, body.slice(0, 500));
    }
  }
  return { sent, failed };
}
