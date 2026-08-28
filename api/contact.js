/* global process, fetch */
import { getClientIp, rateLimit } from './_rateLimit.js';

const ALLOWED_REASONS = new Set([
  'Partnerships',
  'Help & Support',
  'Feedback or Feature Request',
  'Press & Media',
  'Other',
]);

function clean(value, max) {
  if (typeof value !== 'string') return '';
  return value.replace(/\0/g, '').trim().slice(0, max);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  let body = req.body || {};
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ error: 'Invalid request.' });
    }
  }

  // Honeypot: bots commonly fill hidden fields. Return success so they do not retry.
  if (clean(body.companyWebsite, 200)) {
    return res.status(200).json({ ok: true });
  }

  const limit = await rateLimit(
    `contact:${getClientIp(req)}`,
    { max: 5, windowSec: 600, failClosed: false }
  );

  if (!limit.ok) {
    if (limit.retryAfterSec) res.setHeader('Retry-After', String(limit.retryAfterSec));
    return res.status(429).json({
      error: 'Too many messages were sent from this connection. Please try again later.',
    });
  }

  const name = clean(body.name, 100);
  const email = clean(body.email, 200).toLowerCase();
  const reason = clean(body.reason, 80);
  const subject = clean(body.subject, 160);
  const message = clean(body.message, 5000);

  if (name.length < 2) {
    return res.status(400).json({ error: 'Please enter your name.' });
  }

  if (!validEmail(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  if (!ALLOWED_REASONS.has(reason)) {
    return res.status(400).json({ error: 'Please choose what we can help with.' });
  }

  if (subject.length < 2) {
    return res.status(400).json({ error: 'Please enter a subject.' });
  }

  if (message.length < 10) {
    return res.status(400).json({ error: 'Please include a little more detail in your message.' });
  }

  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.error('[contact] RESEND_API_KEY is not configured.');
    return res.status(503).json({
      error: 'Contact email is temporarily unavailable. Please try again shortly.',
    });
  }

  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeReason = escapeHtml(reason);
  const safeSubject = escapeHtml(subject);
  const safeMessage = escapeHtml(message).replace(/\n/g, '<br>');

  const emailResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.CONTACT_FROM_EMAIL || 'Ayna <puloma@aynahealth.co>',
      to: ['puloma@aynahealth.co'],
      bcc: ['eliz@aynahealth.co', 'ameera@aynahealth.co'],
      reply_to: email,
      subject: `[Ayna Contact - ${reason}] ${subject}`,
      text: [
        'New Ayna contact form submission',
        '',
        `Name: ${name}`,
        `Email: ${email}`,
        `Reason: ${reason}`,
        `Subject: ${subject}`,
        '',
        message,
      ].join('\n'),
      html: `
        <div style="font-family:Arial,sans-serif;color:#1A1714;line-height:1.6">
          <h2 style="margin-bottom:20px">New Ayna contact form submission</h2>
          <p><strong>Name:</strong> ${safeName}</p>
          <p><strong>Email:</strong> ${safeEmail}</p>
          <p><strong>Reason:</strong> ${safeReason}</p>
          <p><strong>Subject:</strong> ${safeSubject}</p>
          <hr style="border:none;border-top:1px solid #e5e0e9;margin:24px 0">
          <p>${safeMessage}</p>
        </div>
      `,
    }),
  });

  const result = await emailResponse.json().catch(() => ({}));

  if (!emailResponse.ok) {
    console.error(
      '[contact] Resend failed:',
      emailResponse.status,
      JSON.stringify(result).slice(0, 1000)
    );
    return res.status(502).json({
      error: 'We could not send your message. Please try again.',
    });
  }

  return res.status(200).json({ ok: true });
}
